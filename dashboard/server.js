import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { spawn } from 'child_process';
import os from 'os';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '127.0.0.1';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'dashboard', 'public');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

// Execution State & Log Buffer
let currentProcess = null;
let currentRun = {
  status: 'idle', // 'idle' | 'running' | 'completed' | 'cancelled' | 'failed'
  pid: null,
  startTime: null,
  endTime: null,
  duration: 0,
  exitCode: null,
  command: '',
  params: null,
};
const runHistory = [];
const sseClients = new Set();
let logBuffer = [];

/**
 * Broadcast event to all connected Server-Sent Events (SSE) clients.
 * @param {string} event
 * @param {any} data
 */
function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

/**
 * Scan all test spec files and extract scenario names.
 * @returns {Array<any>}
 */
function scanScenarios() {
  const testsDir = path.join(ROOT_DIR, 'tests');
  const results = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.spec.js')) {
        const relPath = path.relative(ROOT_DIR, fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const scenarios = [];

        let currentSuite = '';
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const suiteMatch = line.match(/test\.describe\s*\(\s*['"`](.*?)['"`]/);
          if (suiteMatch) {
            currentSuite = suiteMatch[1];
          }
          const testMatch = line.match(/(?:test|it)(?:\.(?:only|skip))?\s*\(\s*['"`](.*?)['"`]/);
          if (testMatch) {
            scenarios.push({
              title: testMatch[1],
              suite: currentSuite,
              line: i + 1,
            });
          }
        }

        let category = 'Functional';
        if (relPath.includes('e2e')) category = 'E2E Flow';
        else if (relPath.includes('api')) category = 'API Contract';
        else if (relPath.includes('ui')) category = 'UI Regression';

        results.push({
          file: relPath,
          category,
          scenariosCount: scenarios.length,
          scenarios,
        });
      }
    }
  }

  walk(testsDir);
  // Sort: E2E first, then UI, then API, then others
  const priority = { 'E2E Flow': 1, 'UI Regression': 2, 'API Contract': 3, 'Functional': 4 };
  results.sort((a, b) => (priority[a.category] || 9) - (priority[b.category] || 9) || a.file.localeCompare(b.file));
  return results;
}

/**
 * MIME types dictionary.
 */
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * Serve static file securely preventing path traversal (OWASP A01).
 */
function serveStaticFile(res, filePath, defaultMime = 'text/plain') {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || defaultMime;

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File Not Found' }));
    return;
  }

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to read file', details: err.message }));
  }
}

/**
 * Parse JSON body with strict null-safety (Production Directive 6).
 */
function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protection against giant payload abuse
      if (body.length > 1e6) {
        req.destroy();
        resolve({});
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        const parsed = JSON.parse(body);
        resolve(parsed && typeof parsed === 'object' ? parsed : {});
      } catch {
        resolve({});
      }
    });
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '/';
  const method = req.method ? req.method.toUpperCase() : 'GET';

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // CORS headers for local origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: SSE Events Stream (/api/events)
  if (method === 'GET' && pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    sseClients.add(res);

    // Send initial status and existing buffered logs
    const initPayload = {
      run: currentRun,
      historyCount: runHistory.length,
    };
    res.write(`event: init\ndata: ${JSON.stringify(initPayload)}\n\n`);

    if (logBuffer.length > 0) {
      for (const logItem of logBuffer.slice(-200)) {
        res.write(`event: log\ndata: ${JSON.stringify(logItem)}\n\n`);
      }
    }

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // API 2: List Scenarios (/api/scenarios)
  if (method === 'GET' && pathname === '/api/scenarios') {
    try {
      const scenarios = scanScenarios();
      const totalTests = scenarios.reduce((acc, curr) => acc + curr.scenariosCount, 0);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        suites: scenarios,
        totalSuites: scenarios.length,
        totalTests,
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to scan scenarios', details: err.message }));
    }
    return;
  }

  // API 3: Get Status (/api/status)
  if (method === 'GET' && pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      currentRun,
      history: runHistory.slice(-5),
    }));
    return;
  }

  // API 4: Start Test Execution (/api/run)
  if (method === 'POST' && pathname === '/api/run') {
    if (currentProcess) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'A test run is already currently executing',
        pid: currentProcess.pid,
      }));
      return;
    }

    const body = await parseJsonBody(req);
    const rawData = body && typeof body === 'object' ? body : {};

    // Parameter whitelisting & sanitization (OWASP A03 / LLM02)
    const specFiles = Array.isArray(rawData.specFiles)
      ? rawData.specFiles.filter(
          (f) => typeof f === 'string' && /^tests\/[a-zA-Z0-9_\-\.\/]+\.spec\.js$/.test(f) && fs.existsSync(path.join(ROOT_DIR, f))
        )
      : [];

    const allowedProjects = ['all', 'chromium', 'firefox', 'webkit'];
    const project = typeof rawData.project === 'string' && allowedProjects.includes(rawData.project)
      ? rawData.project
      : 'all';

    const headed = Boolean(rawData.headed);
    const workers = Number.isInteger(rawData.workers) && rawData.workers >= 1 && rawData.workers <= 8
      ? rawData.workers
      : 1;

    // Grep pattern sanitization
    let grep = '';
    if (typeof rawData.grep === 'string' && rawData.grep.trim().length > 0) {
      // Remove null bytes and limit length to prevent abuse
      grep = rawData.grep.trim().replace(/\0/g, '').substring(0, 2000);
    }

    // Build argument list safely without shell interpolation
    const args = ['playwright', 'test'];

    if (specFiles.length > 0) {
      args.push(...specFiles);
    }
    if (grep) {
      args.push('-g', grep);
    }
    if (project !== 'all') {
      args.push(`--project=${project}`);
    }
    if (headed) {
      args.push('--headed');
    }
    if (workers) {
      args.push(`--workers=${workers}`);
    }

    // Reset log buffer for this run
    logBuffer = [];
    const startTime = Date.now();
    const commandDisplay = `npx ${args.join(' ')}`;

    currentRun = {
      status: 'running',
      pid: null,
      startTime,
      endTime: null,
      duration: 0,
      exitCode: null,
      command: commandDisplay,
      params: { specFiles, grep, project, headed, workers },
    };

    try {
      currentProcess = spawn('npx', args, {
        cwd: ROOT_DIR,
        env: { ...process.env, FORCE_COLOR: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      currentRun.pid = currentProcess.pid;

      broadcastSSE('start', {
        run: currentRun,
        message: `Execution launched: ${commandDisplay}`,
      });

      const handleLog = (streamName, text) => {
        const item = { stream: streamName, text, time: Date.now() };
        logBuffer.push(item);
        if (logBuffer.length > 2000) logBuffer.shift();
        broadcastSSE('log', item);
      };

      currentProcess.stdout.on('data', (chunk) => handleLog('stdout', chunk.toString()));
      currentProcess.stderr.on('data', (chunk) => handleLog('stderr', chunk.toString()));

      currentProcess.on('close', (code, signal) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const isCancelled = signal === 'SIGINT' || signal === 'SIGTERM';
        const finalStatus = isCancelled ? 'cancelled' : code === 0 ? 'completed' : 'failed';

        currentRun = {
          ...currentRun,
          status: finalStatus,
          endTime,
          duration,
          exitCode: code !== null ? code : -1,
        };

        runHistory.unshift({ ...currentRun });
        if (runHistory.length > 20) runHistory.pop();

        currentProcess = null;

        broadcastSSE('finish', {
          run: currentRun,
          exitCode: code,
          duration,
          status: finalStatus,
          reportUrl: '/reports/index.html',
        });
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Scenario execution initiated',
        run: currentRun,
      }));
    } catch (err) {
      currentProcess = null;
      currentRun.status = 'failed';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to spawn process', details: err.message }));
    }
    return;
  }

  // API 5: Stop/Cancel Active Execution (/api/stop)
  if (method === 'POST' && pathname === '/api/stop') {
    if (!currentProcess) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No active execution to stop' }));
      return;
    }

    try {
      currentProcess.kill('SIGINT');
      const pidToKill = currentProcess.pid;

      setTimeout(() => {
        if (currentProcess) {
          try {
            currentProcess.kill('SIGKILL');
          } catch {
            // Already dead
          }
        }
      }, 2000);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Terminating execution (PID: ${pidToKill})` }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to terminate execution', details: err.message }));
    }
    return;
  }

  // Static Reports Serving (/reports/index.html or /reports/*)
  if (method === 'GET' && pathname.startsWith('/reports')) {
    const subPath = pathname.replace(/^\/reports\/?/, '') || 'index.html';
    const safePath = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, '');
    const targetFile = path.join(REPORTS_DIR, safePath);

    if (targetFile.startsWith(REPORTS_DIR) && fs.existsSync(targetFile)) {
      serveStaticFile(res, targetFile, 'text/html');
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Report not generated yet</h1><p>Run scenarios first to generate the report.</p>');
    return;
  }

  // Static Dashboard Assets Serving
  let assetPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const safeAsset = path.normalize(assetPath).replace(/^(\.\.[\/\\])+/, '');
  const localFile = path.join(PUBLIC_DIR, safeAsset);

  if (localFile.startsWith(PUBLIC_DIR) && fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
    serveStaticFile(res, localFile);
    return;
  }

  // Default Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found', path: pathname }));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  Port ${PORT} is currently in use. Another instance of the dashboard might already be running.`);
    console.error(`   You can kill the previous process or specify another port: PORT=${PORT + 1} npm run dashboard\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, HOST, () => {
  const divider = '='.repeat(74);
  console.log(`\n${divider}`);
  console.log(`     🚀 ENTERPRISE AUTOMATION SCENARIO DASHBOARD RUNNING`);
  console.log(divider);
  console.log(`  Dashboard URL : http://${HOST}:${PORT}`);
  console.log(`  Target Suites : tests/ (E2E, UI, API Scenarios)`);
  console.log(`  Audit Report  : http://${HOST}:${PORT}/reports/index.html`);
  console.log(`  Host Machine  : ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(divider);
  console.log(`  Press Ctrl+C to stop the dashboard server.\n`);
});

