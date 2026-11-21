import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * HTML Escaper to prevent XSS / script injection (OWASP LLM05 / A03).
 * @param {any} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format milliseconds into human-readable duration (e.g., "1m 12s" or "3.4s").
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  if (!ms || ms < 0) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Categorize test suite into enterprise domain.
 * @param {string} filePath
 * @returns {string}
 */
function getSuiteCategory(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes('e2e')) return 'E2E Flow';
  if (lower.includes('api')) return 'API Contract';
  if (lower.includes('ui')) return 'UI Regression';
  if (lower.includes('perf')) return 'Performance';
  return 'Functional Spec';
}

/**
 * Enterprise MNC-Grade Playwright HTML Reporter.
 * Generates an executive dashboard in `reports/index.html` with:
 * - Executive KPI Dashboard & SLA Quality Gate
 * - Interactive Pure-SVG Donut Analytics
 * - Module Performance Matrix
 * - Dedicated Defect Center & One-Click JIRA Ticket Generator
 * - Multi-Browser & Category Filtering + Instant Search
 * - Embedded Base64 Screenshots & Lightbox Zoom
 * - Enterprise Light / Dark Mode + Print-to-PDF Stylesheet
 * - 100% Offline, Zero CDN Dependencies, Air-Gap Secure
 */
export default class CustomHtmlReporter {
  constructor(options = {}) {
    this.rootDir = process.cwd();
    this.outputFile = options.outputFile || 'reports/index.html';
    this.suiteTitle = options.title || 'Enterprise Quality Assurance & Automation Audit';
    this.organization = options.organization || 'Global Core E-Commerce Platform';
    this.environment = options.environment || (process.env.CI ? 'CI/CD STAGING' : 'QA-E2E PRE-PROD');
    this.tests = [];
    this.startTime = null;
    this.endTime = null;
  }

  onBegin(config, suite) {
    this.startTime = Date.now();
    this.rootDir = process.cwd();
  }

  onTestEnd(test, result) {
    const outcome = typeof test.outcome === 'function' ? test.outcome() : null;
    let status = 'passed';

    if (outcome === 'flaky') {
      status = 'flaky';
    } else if (outcome === 'skipped' || result.status === 'skipped') {
      status = 'skipped';
    } else if (
      outcome === 'unexpected' ||
      result.status === 'failed' ||
      result.status === 'timedOut' ||
      result.status === 'interrupted'
    ) {
      status = 'failed';
    } else if (outcome === 'expected' || result.status === 'passed') {
      status = 'passed';
    } else {
      status = result.status || 'unknown';
    }

    const relFile = test.location?.file
      ? path.relative(this.rootDir, test.location.file)
      : 'Unknown Spec';

    // Project name resolution
    const projectName =
      (typeof test.parent?.project === 'function' && test.parent.project()?.name) ||
      test.projectName ||
      test.titlePath()[0] ||
      'chromium';

    // Titles
    const titlePath = test.titlePath().filter(Boolean);
    const cleanTitle = test.title || titlePath[titlePath.length - 1] || 'Unnamed Test';
    const suiteName = titlePath.length > 2 ? titlePath.slice(1, -1).join(' › ') : '';

    // Errors
    const errors = (result.errors || []).map((err) => ({
      message: err.message || '',
      stack: err.stack || '',
      snippet: err.snippet || '',
    }));

    // Steps
    const steps = (result.steps || []).map((s) => ({
      title: s.title || '',
      duration: s.duration || 0,
      category: s.category || '',
      error: s.error ? s.error.message || String(s.error) : null,
    }));

    // Attachments
    const attachments = [];
    if (Array.isArray(result.attachments)) {
      for (const att of result.attachments) {
        let base64 = null;
        const isImage =
          (att.contentType && att.contentType.startsWith('image/')) ||
          (att.name && att.name.toLowerCase().includes('screenshot')) ||
          (att.path && /\.(png|jpe?g|webp)$/i.test(att.path));

        if (att.path && fs.existsSync(att.path) && isImage) {
          try {
            const buf = fs.readFileSync(att.path);
            if (buf.length < 5 * 1024 * 1024) {
              const mime = att.contentType || 'image/png';
              base64 = `data:${mime};base64,${buf.toString('base64')}`;
            }
          } catch {
            // Ignore attachment read errors
          }
        }

        attachments.push({
          name: att.name || 'Screenshot',
          contentType: att.contentType || 'image/png',
          path: att.path ? path.relative(this.rootDir, att.path) : '',
          base64,
        });
      }
    }

    this.tests.push({
      id: test.id || `${relFile}-${cleanTitle}-${projectName}`,
      title: cleanTitle,
      suiteName,
      fullTitle: titlePath.join(' › '),
      file: relFile,
      category: getSuiteCategory(relFile),
      line: test.location?.line || 0,
      column: test.location?.column || 0,
      project: projectName,
      status,
      rawStatus: result.status,
      duration: result.duration || 0,
      retry: result.retry || 0,
      errors,
      steps,
      attachments,
    });
  }

  async onEnd(result) {
    // If no tests were executed (e.g. --list or filter matched nothing), do not overwrite existing report
    if (this.tests.length === 0) {
      return;
    }

    this.endTime = Date.now();
    const duration = this.endTime - (this.startTime || this.endTime);

    // Compute Enterprise stats
    const stats = {
      total: this.tests.length,
      passed: this.tests.filter((t) => t.status === 'passed').length,
      failed: this.tests.filter((t) => t.status === 'failed').length,
      flaky: this.tests.filter((t) => t.status === 'flaky').length,
      skipped: this.tests.filter((t) => t.status === 'skipped').length,
      duration,
      avgDuration: this.tests.length > 0 ? Math.round(duration / this.tests.length) : 0,
      passRate: this.tests.length > 0
        ? Math.round((this.tests.filter((t) => t.status === 'passed').length / this.tests.length) * 100)
        : 0,
    };

    // Quality Gate Status (Enterprise standard: >= 95% pass rate and 0 failures)
    const qualityGatePassed = stats.failed === 0 && stats.passRate >= 95;

    // Distinct metadata
    const projects = Array.from(new Set(this.tests.map((t) => t.project))).sort();
    const categories = Array.from(new Set(this.tests.map((t) => t.category))).sort();

    // Group tests by spec file
    const suitesMap = new Map();
    for (const t of this.tests) {
      if (!suitesMap.has(t.file)) {
        suitesMap.set(t.file, []);
      }
      suitesMap.get(t.file).push(t);
    }

    const suites = Array.from(suitesMap.entries()).map(([file, tests]) => {
      const suiteTotal = tests.length;
      const suitePassed = tests.filter((t) => t.status === 'passed').length;
      const suiteFailed = tests.filter((t) => t.status === 'failed').length;
      const suiteFlaky = tests.filter((t) => t.status === 'flaky').length;
      const suiteSkipped = tests.filter((t) => t.status === 'skipped').length;
      const suiteDuration = tests.reduce((acc, curr) => acc + curr.duration, 0);
      const suitePassRate = suiteTotal > 0 ? Math.round((suitePassed / suiteTotal) * 100) : 0;

      return {
        file,
        category: getSuiteCategory(file),
        total: suiteTotal,
        passed: suitePassed,
        failed: suiteFailed,
        flaky: suiteFlaky,
        skipped: suiteSkipped,
        duration: suiteDuration,
        passRate: suitePassRate,
        tests,
      };
    });

    // Sort suites so files with failures appear at the top
    suites.sort((a, b) => b.failed - a.failed || a.file.localeCompare(b.file));

    // System / Infrastructure metadata
    const systemInfo = {
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      node: process.version,
      cpus: `${os.cpus().length} Cores`,
      executor: process.env.CI ? 'CI/CD Pipeline Runner' : (process.env.USER || 'QA Automation Engineer'),
      framework: 'Playwright v1.63.0',
      runType: process.env.CI ? 'Automated Scheduled Build' : 'Developer / QA Local Trigger',
    };

    // Render HTML report
    const html = this.renderHtml({
      title: this.suiteTitle,
      organization: this.organization,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      stats,
      qualityGatePassed,
      systemInfo,
      projects,
      categories,
      suites,
    });

    // Ensure output directory exists (always relative to project workspace root)
    const fullOutputPath = path.resolve(this.rootDir, this.outputFile);
    const outDir = path.dirname(fullOutputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(fullOutputPath, html, 'utf8');

    // Print clean console summary
    this.printConsoleSummary(stats, qualityGatePassed, fullOutputPath);
  }

  printConsoleSummary(stats, qualityGatePassed, fullOutputPath) {
    const divider = '='.repeat(76);
    const line = '-'.repeat(76);
    const gateStatus = qualityGatePassed ? 'PASSED [COMPLIANT]' : 'FAILED [ACTION REQUIRED]';

    console.log(`\n${divider}`);
    console.log(`         ENTERPRISE QUALITY ASSURANCE: ${this.organization.toUpperCase()}`);
    console.log(`         ${this.suiteTitle.toUpperCase()}`);
    console.log(divider);
    console.log(`  Quality Gate : ${gateStatus}`);
    console.log(`  Environment  : ${this.environment}`);
    console.log(`  Total Tests  : ${stats.total}`);
    console.log(`  Passed       : ${stats.passed} (${stats.passRate}%)`);
    console.log(`  Failed       : ${stats.failed}`);
    console.log(`  Flaky        : ${stats.flaky}`);
    console.log(`  Skipped      : ${stats.skipped}`);
    console.log(`  Total Time   : ${formatDuration(stats.duration)} (Avg: ${formatDuration(stats.avgDuration)}/test)`);
    console.log(line);
    console.log(`  Audit Report : file://${fullOutputPath}`);
    console.log(`${divider}\n`);

    if (stats.failed > 0) {
      console.log(`❌ Critical Defects Summary (${stats.failed}):`);
      const failedTests = this.tests.filter((t) => t.status === 'failed');
      failedTests.forEach((t, i) => {
        console.log(`  ${i + 1}. [${t.project.toUpperCase()}] ${t.title} (${t.file}:${t.line})`);
        if (t.errors.length > 0 && t.errors[0].message) {
          const firstLine = t.errors[0].message.split('\n')[0].substring(0, 100);
          console.log(`     Root Cause: ${firstLine}`);
        }
      });
      console.log('');
    }
  }

  renderHtml({
    title,
    organization,
    environment,
    timestamp,
    stats,
    qualityGatePassed,
    systemInfo,
    projects,
    categories,
    suites,
  }) {
    const formattedDate = new Date(timestamp).toUTCString();
    const failedTests = this.tests.filter((t) => t.status === 'failed');

    // SVG Donut Calculations (Circumference C = 2 * PI * 44 ≈ 276.46)
    const C = 276.46;
    const passRatio = stats.total > 0 ? stats.passed / stats.total : 0;
    const failRatio = stats.total > 0 ? stats.failed / stats.total : 0;
    const skipRatio = stats.total > 0 ? (stats.flaky + stats.skipped) / stats.total : 0;

    const passDash = passRatio * C;
    const failDash = failRatio * C;
    const skipDash = skipRatio * C;

    const passOffset = 0;
    const failOffset = -passDash;
    const skipOffset = -(passDash + failDash);

    return `<!DOCTYPE html>
<html lang="en" class="theme-dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | ${escapeHtml(organization)}</title>
  <style>
    /* CSS Variables: Enterprise Dark & Light Themes */
    :root.theme-dark {
      --bg-base: #0b0f19;
      --bg-surface: #111827;
      --bg-card: #1f2937;
      --bg-elevated: #374151;
      --border-main: #374151;
      --border-subtle: #1f2937;
      --text-heading: #f9fafb;
      --text-body: #e5e7eb;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --accent-brand: #3b82f6;
      --accent-brand-bg: rgba(59, 130, 246, 0.12);
      --status-pass: #10b981;
      --status-pass-bg: rgba(16, 185, 129, 0.12);
      --status-fail: #ef4444;
      --status-fail-bg: rgba(239, 68, 68, 0.12);
      --status-flaky: #f59e0b;
      --status-flaky-bg: rgba(245, 158, 11, 0.12);
      --status-skip: #6b7280;
      --status-skip-bg: rgba(107, 114, 128, 0.15);
      --code-bg: #030712;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    }

    :root.theme-light {
      --bg-base: #f8fafc;
      --bg-surface: #ffffff;
      --bg-card: #ffffff;
      --bg-elevated: #f1f5f9;
      --border-main: #e2e8f0;
      --border-subtle: #edf2f7;
      --text-heading: #0f172a;
      --text-body: #334155;
      --text-muted: #64748b;
      --text-dim: #94a3b8;
      --accent-brand: #2563eb;
      --accent-brand-bg: #eff6ff;
      --status-pass: #059669;
      --status-pass-bg: #ecfdf5;
      --status-fail: #dc2626;
      --status-fail-bg: #fef2f2;
      --status-flaky: #d97706;
      --status-flaky-bg: #fffbeb;
      --status-skip: #64748b;
      --status-skip-bg: #f1f5f9;
      --code-bg: #0f172a;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-base);
      color: var(--text-body);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      padding: 24px 32px 64px;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Executive Header */
    .enterprise-header {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .org-branding {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .org-logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 20px;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
      flex-shrink: 0;
    }

    .org-title-group h2 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent-brand);
      font-weight: 700;
      margin-bottom: 2px;
    }

    .org-title-group h1 {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-heading);
      letter-spacing: -0.02em;
    }

    .org-title-group .sub-meta {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .quality-gate-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    .quality-gate-badge.passed {
      background: var(--status-pass-bg);
      color: var(--status-pass);
      border: 1px solid var(--status-pass);
    }

    .quality-gate-badge.failed {
      background: var(--status-fail-bg);
      color: var(--status-fail);
      border: 1px solid var(--status-fail);
    }

    .btn-action {
      background: var(--bg-card);
      border: 1px solid var(--border-main);
      color: var(--text-heading);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      box-shadow: var(--shadow-sm);
    }

    .btn-action:hover {
      background: var(--bg-elevated);
      border-color: var(--accent-brand);
    }

    /* System Info Ribbon */
    .meta-ribbon {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: 10px;
      padding: 12px 20px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      font-size: 12px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-item .label {
      color: var(--text-dim);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
      font-size: 11px;
    }

    .meta-item .value {
      color: var(--text-heading);
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    /* Enterprise Tabs */
    .tab-bar {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border-main);
      margin-bottom: 24px;
    }

    .tab-btn {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      color: var(--text-muted);
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--text-heading);
    }

    .tab-btn.active {
      color: var(--accent-brand);
      border-bottom-color: var(--accent-brand);
    }

    .tab-badge {
      background: var(--bg-elevated);
      color: var(--text-muted);
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
    }

    .tab-btn.active .tab-badge {
      background: var(--accent-brand-bg);
      color: var(--accent-brand);
    }

    .tab-badge.danger {
      background: var(--status-fail-bg);
      color: var(--status-fail);
    }

    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }

    /* KPI Cards Grid */
    .kpi-row {
      display: grid;
      grid-template-columns: 280px repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) {
      .kpi-row {
        grid-template-columns: 1fr;
      }
    }

    .donut-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      box-shadow: var(--shadow-sm);
    }

    .donut-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
      flex-shrink: 0;
    }

    .donut-chart {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .donut-bg {
      fill: none;
      stroke: var(--bg-elevated);
      stroke-width: 8;
    }

    .donut-segment {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dasharray 0.3s ease;
    }

    .donut-segment.pass { stroke: var(--status-pass); }
    .donut-segment.fail { stroke: var(--status-fail); }
    .donut-segment.skip { stroke: var(--status-skip); }

    .donut-center-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .donut-percent {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-heading);
      line-height: 1;
    }

    .donut-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
    }

    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }

    .kpi-metric-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .kpi-card .kpi-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .kpi-card .kpi-num {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-heading);
      line-height: 1;
      margin-bottom: 6px;
    }

    .kpi-card .kpi-caption {
      font-size: 12px;
      color: var(--text-dim);
      font-weight: 500;
    }

    .kpi-card.pass .kpi-num { color: var(--status-pass); }
    .kpi-card.fail .kpi-num { color: var(--status-fail); }
    .kpi-card.flaky .kpi-num { color: var(--status-flaky); }
    .kpi-card.skip .kpi-num { color: var(--status-skip); }

    /* Module Matrix Table */
    .section-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-heading);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .enterprise-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .enterprise-table th {
      background: var(--bg-elevated);
      color: var(--text-muted);
      text-align: left;
      padding: 10px 14px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-main);
    }

    .enterprise-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-main);
      color: var(--text-body);
    }

    .enterprise-table tr:hover td {
      background: var(--bg-elevated);
    }

    .progress-bar-container {
      width: 120px;
      height: 8px;
      background: var(--bg-elevated);
      border-radius: 9999px;
      overflow: hidden;
      display: flex;
    }

    .progress-fill-pass { background: var(--status-pass); height: 100%; }
    .progress-fill-fail { background: var(--status-fail); height: 100%; }

    .tag-category {
      background: var(--accent-brand-bg);
      color: var(--accent-brand);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Filter & Search Bar */
    .filter-toolbar {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: var(--shadow-sm);
    }

    .search-input-wrap {
      flex: 1;
      min-width: 280px;
      position: relative;
    }

    .search-input-wrap input {
      width: 100%;
      background: var(--bg-base);
      border: 1px solid var(--border-main);
      color: var(--text-heading);
      padding: 8px 14px 8px 36px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .search-input-wrap input:focus {
      border-color: var(--accent-brand);
    }

    .search-svg-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 15px;
      height: 15px;
      fill: var(--text-muted);
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .pill-btn {
      background: var(--bg-base);
      border: 1px solid var(--border-main);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .pill-btn:hover {
      background: var(--bg-elevated);
      color: var(--text-heading);
    }

    .pill-btn.active {
      background: var(--accent-brand);
      color: #fff;
      border-color: var(--accent-brand);
    }

    .pill-btn.active.fail {
      background: var(--status-fail);
      border-color: var(--status-fail);
    }

    .select-dropdown {
      background: var(--bg-base);
      border: 1px solid var(--border-main);
      color: var(--text-heading);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }

    /* Suite Explorer Cards */
    .suite-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: 12px;
      margin-bottom: 18px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .suite-box-header {
      padding: 14px 20px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-main);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }

    .suite-name-group {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 14px;
      color: var(--text-heading);
      font-family: ui-monospace, SFMono-Regular, monospace;
    }

    .suite-metrics {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .badge-chip {
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
    }

    .badge-chip.pass { background: var(--status-pass-bg); color: var(--status-pass); }
    .badge-chip.fail { background: var(--status-fail-bg); color: var(--status-fail); }
    .badge-chip.flaky { background: var(--status-flaky-bg); color: var(--status-flaky); }
    .badge-chip.skip { background: var(--status-skip-bg); color: var(--status-skip); }

    /* Test Row */
    .test-node {
      border-bottom: 1px solid var(--border-main);
    }

    .test-node:last-child {
      border-bottom: none;
    }

    .test-header-bar {
      padding: 13px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .test-header-bar:hover {
      background: var(--bg-elevated);
    }

    .test-status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .test-status-indicator.passed { background: var(--status-pass); box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
    .test-status-indicator.failed { background: var(--status-fail); box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
    .test-status-indicator.flaky { background: var(--status-flaky); box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
    .test-status-indicator.skipped { background: var(--status-skip); }

    .test-info-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .test-title-col {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .test-suite-hierarchy {
      font-size: 11px;
      color: var(--text-dim);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .test-title-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-heading);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .test-badges-col {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .browser-chip {
      background: var(--bg-elevated);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }

    .latency-chip {
      color: var(--text-dim);
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      min-width: 50px;
      text-align: right;
    }

    .chevron-icon {
      width: 14px;
      height: 14px;
      fill: var(--text-muted);
      transition: transform 0.2s ease;
    }

    .test-node.open .chevron-icon {
      transform: rotate(180deg);
    }

    /* Test Drawer */
    .test-drawer {
      display: none;
      padding: 18px 24px 24px 44px;
      background: var(--bg-card);
      border-top: 1px dashed var(--border-main);
    }

    .test-node.open .test-drawer {
      display: block;
    }

    /* Defect / Error Callout */
    .defect-banner {
      background: var(--status-fail-bg);
      border: 1px solid var(--status-fail);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .defect-banner-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .defect-label {
      color: var(--status-fail);
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .defect-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-copy-defect {
      background: var(--status-fail);
      color: #fff;
      border: none;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .btn-copy-defect:hover {
      opacity: 0.9;
    }

    .stack-code-block {
      background: var(--code-bg);
      border-radius: 6px;
      padding: 12px 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: #fca5a5;
      white-space: pre-wrap;
      overflow-x: auto;
      line-height: 1.5;
    }

    /* Timeline Steps */
    .timeline-title {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-dim);
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }

    .timeline-flow {
      list-style: none;
      border-left: 2px solid var(--border-main);
      padding-left: 14px;
      margin-left: 6px;
    }

    .timeline-step {
      position: relative;
      padding: 6px 0;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .timeline-step::before {
      content: '';
      position: absolute;
      left: -19px;
      top: 12px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border-main);
    }

    .timeline-step.fail::before {
      background: var(--status-fail);
      box-shadow: 0 0 6px var(--status-fail);
    }

    .timeline-step.fail {
      color: var(--status-fail);
      font-weight: 600;
    }

    .step-desc {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 12px;
      word-break: break-word;
    }

    .step-dur {
      font-size: 11px;
      color: var(--text-dim);
      font-family: ui-monospace, SFMono-Regular, monospace;
    }

    /* Attachments Grid */
    .screenshots-gallery {
      margin-top: 16px;
    }

    .gallery-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }

    .gallery-img-thumb {
      max-width: 240px;
      max-height: 150px;
      border-radius: 8px;
      border: 1px solid var(--border-main);
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease;
      box-shadow: var(--shadow-sm);
    }

    .gallery-img-thumb:hover {
      transform: scale(1.02);
      border-color: var(--accent-brand);
    }

    /* Lightbox Modal */
    .img-lightbox-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.88);
      z-index: 99999;
      justify-content: center;
      align-items: center;
      padding: 24px;
    }

    .img-lightbox-modal.active {
      display: flex;
    }

    .img-lightbox-modal img {
      max-width: 95%;
      max-height: 95%;
      border-radius: 8px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }

    .lightbox-close-btn {
      position: absolute;
      top: 20px;
      right: 28px;
      color: #fff;
      font-size: 32px;
      font-weight: 800;
      cursor: pointer;
      user-select: none;
    }

    /* Defect Center Cards */
    .defect-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-left: 4px solid var(--status-fail);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);
    }

    .defect-header-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .defect-title-text {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-heading);
    }

    .defect-meta-pills {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .defect-empty-state {
      padding: 60px 20px;
      text-align: center;
    }

    .defect-empty-state h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--status-pass);
      margin-bottom: 6px;
    }

    .defect-empty-state p {
      color: var(--text-muted);
      font-size: 13px;
    }

    /* Print Stylesheet for Executive PDF Export */
    @media print {
      body {
        background: #fff !important;
        color: #000 !important;
        padding: 0 !important;
      }
      .enterprise-header, .section-card, .meta-ribbon, .kpi-card, .donut-card {
        border: 1px solid #ddd !important;
        box-shadow: none !important;
        background: #fff !important;
        color: #000 !important;
      }
      .header-actions, .filter-toolbar, .tab-bar, .img-lightbox-modal, .btn-copy-defect {
        display: none !important;
      }
      .tab-pane {
        display: block !important;
      }
      .test-node {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Executive Enterprise Header -->
    <header class="enterprise-header">
      <div class="org-branding">
        <div class="org-logo-icon">QA</div>
        <div class="org-title-group">
          <h2>${escapeHtml(organization)}</h2>
          <h1>${escapeHtml(title)}</h1>
          <div class="sub-meta">
            <span>Environment: <strong>${escapeHtml(environment)}</strong></span>
            <span>&bull;</span>
            <span>Audit Date: <strong>${escapeHtml(formattedDate)}</strong></span>
            <span>&bull;</span>
            <span>Suite Runtime: <strong>${escapeHtml(formatDuration(stats.duration))}</strong></span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        ${
          qualityGatePassed
            ? `<div class="quality-gate-badge passed">&#10004; QUALITY GATE: PASSED (SLA MET)</div>`
            : `<div class="quality-gate-badge failed">&#9888; QUALITY GATE: ACTION REQUIRED (${stats.failed} DEFECTS)</div>`
        }
        <button class="btn-action" id="themeToggleBtn">
          <span id="themeIcon">&#9728;</span>
          <span id="themeLabel">Light Mode</span>
        </button>
        <button class="btn-action" onclick="window.print()">
          <span>&#128424;</span>
          <span>Print / Export PDF</span>
        </button>
      </div>
    </header>

    <!-- System Infrastructure Ribbon -->
    <div class="meta-ribbon">
      <div class="meta-item">
        <span class="label">Test Engine</span>
        <span class="value">${escapeHtml(systemInfo.framework)}</span>
      </div>
      <div class="meta-item">
        <span class="label">Runtime Platform</span>
        <span class="value">${escapeHtml(systemInfo.node)} / ${escapeHtml(systemInfo.os)}</span>
      </div>
      <div class="meta-item">
        <span class="label">Compute &amp; Concurrency</span>
        <span class="value">${escapeHtml(systemInfo.cpus)} / Multi-Worker Parallel</span>
      </div>
      <div class="meta-item">
        <span class="label">Pipeline Trigger</span>
        <span class="value">${escapeHtml(systemInfo.runType)}</span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tab-bar">
      <button class="tab-btn active" data-tab="tab-overview">
        <span>Executive Overview</span>
      </button>
      <button class="tab-btn" data-tab="tab-scenarios">
        <span>Test Scenarios</span>
        <span class="tab-badge">${stats.total}</span>
      </button>
      <button class="tab-btn" data-tab="tab-defects">
        <span>Defect Center (RCA)</span>
        <span class="tab-badge ${stats.failed > 0 ? 'danger' : ''}">${stats.failed}</span>
      </button>
      <button class="tab-btn" data-tab="tab-environment">
        <span>Environment &amp; Setup</span>
      </button>
    </div>

    <!-- TAB 1: EXECUTIVE OVERVIEW -->
    <div id="tab-overview" class="tab-pane active">
      <!-- KPI Row with Pure-SVG Donut -->
      <div class="kpi-row">
        <div class="donut-card">
          <div class="donut-wrapper">
            <svg class="donut-chart" viewBox="0 0 100 100">
              <circle class="donut-bg" cx="50" cy="50" r="44"/>
              <!-- Pass segment -->
              <circle class="donut-segment pass" cx="50" cy="50" r="44"
                stroke-dasharray="${passDash} ${C}" stroke-dashoffset="${passOffset}"/>
              <!-- Fail segment -->
              <circle class="donut-segment fail" cx="50" cy="50" r="44"
                stroke-dasharray="${failDash} ${C}" stroke-dashoffset="${failOffset}"/>
              <!-- Flaky/Skip segment -->
              <circle class="donut-segment skip" cx="50" cy="50" r="44"
                stroke-dasharray="${skipDash} ${C}" stroke-dashoffset="${skipOffset}"/>
            </svg>
            <div class="donut-center-text">
              <div class="donut-percent">${stats.passRate}%</div>
              <div class="donut-label">Pass Rate</div>
            </div>
          </div>
          <div class="donut-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: var(--status-pass)"></span>
              <span>Passed: <strong>${stats.passed}</strong></span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: var(--status-fail)"></span>
              <span>Failed: <strong>${stats.failed}</strong></span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: var(--status-skip)"></span>
              <span>Other: <strong>${stats.flaky + stats.skipped}</strong></span>
            </div>
          </div>
        </div>

        <div class="kpi-metric-cards">
          <div class="kpi-card">
            <div class="kpi-title">Total Scenarios</div>
            <div class="kpi-num">${stats.total}</div>
            <div class="kpi-caption">${suites.length} Automated Suites</div>
          </div>
          <div class="kpi-card pass">
            <div class="kpi-title">Passed Scenarios</div>
            <div class="kpi-num">${stats.passed}</div>
            <div class="kpi-caption">${stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}% compliance</div>
          </div>
          <div class="kpi-card fail">
            <div class="kpi-title">Critical Defects</div>
            <div class="kpi-num">${stats.failed}</div>
            <div class="kpi-caption">${stats.total ? Math.round((stats.failed / stats.total) * 100) : 0}% failure rate</div>
          </div>
          <div class="kpi-card flaky">
            <div class="kpi-title">Flaky Scenarios</div>
            <div class="kpi-num">${stats.flaky}</div>
            <div class="kpi-caption">Retry mitigated</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Total Duration</div>
            <div class="kpi-num" style="font-size: 22px;">${escapeHtml(formatDuration(stats.duration))}</div>
            <div class="kpi-caption">Avg: ${escapeHtml(formatDuration(stats.avgDuration))}/test</div>
          </div>
        </div>
      </div>

      <!-- Module Performance Matrix -->
      <div class="section-card">
        <div class="section-header">
          <h3>
            <span>📋</span>
            <span>Module Performance &amp; Coverage Matrix</span>
          </h3>
          <span style="font-size: 12px; color: var(--text-dim);">${suites.length} Modules Analyzed</span>
        </div>
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>Spec File / Module</th>
              <th>Category</th>
              <th>Total</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Flaky</th>
              <th>Health Status</th>
              <th>Pass Ratio</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${suites
              .map(
                (s) => `
            <tr>
              <td><strong style="font-family: ui-monospace, SFMono-Regular, monospace;">${escapeHtml(s.file)}</strong></td>
              <td><span class="tag-category">${escapeHtml(s.category)}</span></td>
              <td>${s.total}</td>
              <td style="color: var(--status-pass); font-weight: 700;">${s.passed}</td>
              <td style="color: ${s.failed > 0 ? 'var(--status-fail)' : 'inherit'}; font-weight: ${s.failed > 0 ? '700' : 'normal'};">${s.failed}</td>
              <td>${s.flaky}</td>
              <td>
                ${
                  s.failed === 0
                    ? `<span class="badge-chip pass">COMPLIANT</span>`
                    : `<span class="badge-chip fail">DEFECT DETECTED</span>`
                }
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="progress-bar-container">
                    <div class="progress-fill-pass" style="width: ${s.passRate}%;"></div>
                    <div class="progress-fill-fail" style="width: ${100 - s.passRate}%;"></div>
                  </div>
                  <span style="font-size: 11px; font-weight: 700;">${s.passRate}%</span>
                </div>
              </td>
              <td style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px;">${escapeHtml(formatDuration(s.duration))}</td>
            </tr>`
              )
              .join('\n')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: DETAILED TEST SCENARIOS -->
    <div id="tab-scenarios" class="tab-pane">
      <!-- Controls & Filter Toolbar -->
      <div class="filter-toolbar">
        <div class="search-input-wrap">
          <svg class="search-svg-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input type="text" id="searchInput" placeholder="Search test title, spec path, or error log...">
        </div>

        <div class="filter-group">
          <button class="pill-btn active" data-filter="all">All (${stats.total})</button>
          <button class="pill-btn fail" data-filter="failed">Failed (${stats.failed})</button>
          <button class="pill-btn pass" data-filter="passed">Passed (${stats.passed})</button>
          <button class="pill-btn" data-filter="flaky">Flaky (${stats.flaky})</button>
          <button class="pill-btn" data-filter="skipped">Skipped (${stats.skipped})</button>
        </div>

        <div class="filter-group">
          ${
            projects.length > 1
              ? `
          <select class="select-dropdown" id="browserSelect">
            <option value="all">All Browsers</option>
            ${projects.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
          </select>`
              : ''
          }
          ${
            categories.length > 1
              ? `
          <select class="select-dropdown" id="categorySelect">
            <option value="all">All Categories</option>
            ${categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>`
              : ''
          }
          <button class="btn-action" id="expandAllBtn">Expand All</button>
          <button class="btn-action" id="collapseAllBtn">Collapse All</button>
        </div>
      </div>

      <!-- Suites Container -->
      <div id="suitesList">
        ${suites.map((s) => this.renderSuiteBox(s)).join('\n')}
      </div>
    </div>

    <!-- TAB 3: DEFECT CENTER (RCA) -->
    <div id="tab-defects" class="tab-pane">
      ${
        failedTests.length === 0
          ? `
      <div class="section-card defect-empty-state">
        <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
        <h3>Zero Defects Detected!</h3>
        <p>All ${stats.total} automated test scenarios completed successfully and comply with the Enterprise Quality Gate threshold.</p>
      </div>`
          : `
      <div class="section-card" style="margin-bottom: 16px;">
        <h3 style="color: var(--status-fail); margin-bottom: 6px;">Critical Quality Gate Defect Log (${failedTests.length})</h3>
        <p style="font-size: 13px; color: var(--text-muted);">
          Each failure contains the root-cause exception, failure coordinates, and a one-click <strong>"Copy JIRA Ticket"</strong> button for immediate bug logging.
        </p>
      </div>
      ${failedTests.map((t, idx) => this.renderDefectCard(t, idx)).join('\n')}
      `
      }
    </div>

    <!-- TAB 4: ENVIRONMENT & SETUP -->
    <div id="tab-environment" class="tab-pane">
      <div class="section-card">
        <div class="section-header">
          <h3>
            <span>⚙️</span>
            <span>Enterprise Infrastructure &amp; Runtime Specifications</span>
          </h3>
        </div>
        <table class="enterprise-table">
          <tbody>
            <tr>
              <td><strong>Operating System</strong></td>
              <td>${escapeHtml(systemInfo.os)}</td>
            </tr>
            <tr>
              <td><strong>Node.js Engine</strong></td>
              <td>${escapeHtml(systemInfo.node)}</td>
            </tr>
            <tr>
              <td><strong>Automation Framework</strong></td>
              <td>${escapeHtml(systemInfo.framework)}</td>
            </tr>
            <tr>
              <td><strong>Hardware Threads</strong></td>
              <td>${escapeHtml(systemInfo.cpus)}</td>
            </tr>
            <tr>
              <td><strong>Target Environment</strong></td>
              <td>${escapeHtml(environment)}</td>
            </tr>
            <tr>
              <td><strong>Execution Trigger</strong></td>
              <td>${escapeHtml(systemInfo.runType)}</td>
            </tr>
            <tr>
              <td><strong>Execution User</strong></td>
              <td>${escapeHtml(systemInfo.executor)}</td>
            </tr>
            <tr>
              <td><strong>Active Browser Engines</strong></td>
              <td>${escapeHtml(projects.join(', '))}</td>
            </tr>
            <tr>
              <td><strong>Quality Gate Requirement</strong></td>
              <td>Pass Rate &ge; 95% &amp;&amp; 0 Critical Failures</td>
            </tr>
            <tr>
              <td><strong>Security &amp; Air-Gap Policy</strong></td>
              <td>Strict Zero-CDN, 100% Self-Contained Offline Artifact, OWASP A03 / LLM05 Escaped</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Lightbox Modal for Screenshots -->
    <div class="img-lightbox-modal" id="lightboxModal">
      <span class="lightbox-close-btn" id="lightboxClose">&times;</span>
      <img id="lightboxImg" src="" alt="Screenshot Full View">
    </div>
  </div>

  <script>
    // Theme Switcher (Dark / Light Mode)
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    function applyTheme(theme) {
      if (theme === 'light') {
        htmlEl.classList.remove('theme-dark');
        htmlEl.classList.add('theme-light');
        themeIcon.innerHTML = '&#9790;';
        themeLabel.textContent = 'Dark Mode';
      } else {
        htmlEl.classList.remove('theme-light');
        htmlEl.classList.add('theme-dark');
        themeIcon.innerHTML = '&#9728;';
        themeLabel.textContent = 'Light Mode';
      }
      localStorage.setItem('enterprise_report_theme', theme);
    }

    const savedTheme = localStorage.getItem('enterprise_report_theme') || 'dark';
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const isDark = htmlEl.classList.contains('theme-dark');
      applyTheme(isDark ? 'light' : 'dark');
    });

    // Enterprise Tabs Navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Filter & Search Engine
    let activeStatusFilter = 'all';
    let activeBrowserFilter = 'all';
    let activeCategoryFilter = 'all';
    let searchKeyword = '';

    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.pill-btn');
    const browserSelect = document.getElementById('browserSelect');
    const categorySelect = document.getElementById('categorySelect');
    const suiteBoxes = document.querySelectorAll('.suite-box');
    const testNodes = document.querySelectorAll('.test-node');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStatusFilter = btn.getAttribute('data-filter');
        executeFilter();
      });
    });

    if (browserSelect) {
      browserSelect.addEventListener('change', (e) => {
        activeBrowserFilter = e.target.value;
        executeFilter();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        activeCategoryFilter = e.target.value;
        executeFilter();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchKeyword = e.target.value.toLowerCase().trim();
        executeFilter();
      });
    }

    function executeFilter() {
      suiteBoxes.forEach(suite => {
        let matchCount = 0;
        const tests = suite.querySelectorAll('.test-node');
        const suiteCategory = suite.getAttribute('data-category') || '';

        tests.forEach(test => {
          const status = test.getAttribute('data-status');
          const browser = test.getAttribute('data-browser');
          const title = (test.getAttribute('data-title') || '').toLowerCase();
          const file = (test.getAttribute('data-file') || '').toLowerCase();
          const error = (test.getAttribute('data-error') || '').toLowerCase();

          const matchesStatus = activeStatusFilter === 'all' || status === activeStatusFilter;
          const matchesBrowser = activeBrowserFilter === 'all' || browser === activeBrowserFilter;
          const matchesCategory = activeCategoryFilter === 'all' || suiteCategory === activeCategoryFilter;
          const matchesKeyword = !searchKeyword || title.includes(searchKeyword) || file.includes(searchKeyword) || error.includes(searchKeyword);

          if (matchesStatus && matchesBrowser && matchesCategory && matchesKeyword) {
            test.style.display = 'block';
            matchCount++;
          } else {
            test.style.display = 'none';
          }
        });

        suite.style.display = matchCount > 0 ? 'block' : 'none';
      });
    }

    // Expand / Collapse Drawer Handlers
    testNodes.forEach(node => {
      const headerBar = node.querySelector('.test-header-bar');
      if (headerBar) {
        headerBar.addEventListener('click', () => {
          node.classList.toggle('open');
        });
      }
    });

    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');

    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        testNodes.forEach(node => {
          if (node.style.display !== 'none') node.classList.add('open');
        });
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        testNodes.forEach(node => node.classList.remove('open'));
      });
    }

    // One-Click JIRA / Defect Ticket Copy
    document.querySelectorAll('.btn-copy-defect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = btn.getAttribute('data-defect-content');
        navigator.clipboard.writeText(content).then(() => {
          const prev = btn.textContent;
          btn.textContent = 'Copied to Clipboard!';
          setTimeout(() => {
            btn.textContent = prev;
          }, 2000);
        });
      });
    });

    // Screenshot Lightbox Modal
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');

    document.querySelectorAll('.gallery-img-thumb').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxImg.src = img.src;
        lightboxModal.classList.add('active');
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', () => {
        lightboxModal.classList.remove('active');
      });
    }

    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
          lightboxModal.classList.remove('active');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
        lightboxModal.classList.remove('active');
      }
    });
  </script>
</body>
</html>`;
  }

  renderSuiteBox(suite) {
    return `
    <div class="suite-box" data-category="${escapeHtml(suite.category)}">
      <div class="suite-box-header">
        <div class="suite-name-group">
          <span>📁</span>
          <span>${escapeHtml(suite.file)}</span>
          <span class="tag-category">${escapeHtml(suite.category)}</span>
        </div>
        <div class="suite-metrics">
          <span class="badge-chip pass">${suite.passed} passed</span>
          ${suite.failed > 0 ? `<span class="badge-chip fail">${suite.failed} failed</span>` : ''}
          ${suite.flaky > 0 ? `<span class="badge-chip flaky">${suite.flaky} flaky</span>` : ''}
          ${suite.skipped > 0 ? `<span class="badge-chip skip">${suite.skipped} skipped</span>` : ''}
          <span style="color: var(--text-dim); font-size: 11px;">(${escapeHtml(formatDuration(suite.duration))})</span>
        </div>
      </div>
      <div class="test-nodes-list">
        ${suite.tests.map((test) => this.renderTestNode(test)).join('\n')}
      </div>
    </div>`;
  }

  renderTestNode(test) {
    const errorText = test.errors.map((e) => `${e.message}\n${e.stack}`).join('\n\n');
    const isExpanded = test.status === 'failed';

    const jiraTicket = `h3. [AUTOMATION DEFECT] ${test.title}
*Module:* ${test.file}:${test.line}
*Browser / Project:* ${test.project}
*Execution Status:* Failed (Regression Audit)
*Root Cause:*
{code:none}
${test.errors[0]?.message || 'Unknown failure'}
{code}
*Stack Trace:*
{code:none}
${test.errors[0]?.stack || 'No stack trace'}
{code}`;

    return `
    <div class="test-node ${isExpanded ? 'open' : ''}"
         data-status="${escapeHtml(test.status)}"
         data-browser="${escapeHtml(test.project)}"
         data-title="${escapeHtml(test.title)}"
         data-file="${escapeHtml(test.file)}"
         data-error="${escapeHtml(errorText)}">
      <div class="test-header-bar">
        <div class="test-info-cell">
          <div class="test-status-indicator ${escapeHtml(test.status)}"></div>
          <div class="test-title-col">
            ${test.suiteName ? `<span class="test-suite-hierarchy">${escapeHtml(test.suiteName)}</span>` : ''}
            <span class="test-title-text">${escapeHtml(test.title)}</span>
          </div>
        </div>
        <div class="test-badges-col">
          <span class="browser-chip">${escapeHtml(test.project)}</span>
          <span class="latency-chip">${escapeHtml(formatDuration(test.duration))}</span>
          <svg class="chevron-icon" viewBox="0 0 24 24">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </div>

      <div class="test-drawer">
        ${
          test.errors.length > 0
            ? `
        <div class="defect-banner">
          <div class="defect-banner-head">
            <span class="defect-label">&#9888; Critical Exception Encountered (${escapeHtml(test.file)}:${test.line})</span>
            <div class="defect-buttons">
              <button class="btn-copy-defect" data-defect-content="${escapeHtml(jiraTicket)}">Copy JIRA Defect Ticket</button>
            </div>
          </div>
          <div class="stack-code-block">${escapeHtml(errorText)}</div>
        </div>`
            : ''
        }

        ${
          test.steps.length > 0
            ? `
        <div style="margin-top: 14px;">
          <div class="timeline-title">Scenario Execution Timeline (${test.steps.length} Steps)</div>
          <ul class="timeline-flow">
            ${test.steps
              .map(
                (step) => `
              <li class="timeline-step ${step.error ? 'fail' : ''}">
                <span class="step-desc">${escapeHtml(step.title)}</span>
                <span class="step-dur">${escapeHtml(formatDuration(step.duration))}</span>
              </li>`
              )
              .join('\n')}
          </ul>
        </div>`
            : ''
        }

        ${
          test.attachments.length > 0
            ? `
        <div class="screenshots-gallery">
          <div class="timeline-title">Attached Visual Evidence &amp; Artifacts</div>
          <div class="gallery-grid">
            ${test.attachments
              .filter((att) => att.base64)
              .map(
                (att) => `
              <img class="gallery-img-thumb" src="${att.base64}" alt="${escapeHtml(att.name)}" title="Click to inspect full view">`
              )
              .join('\n')}
          </div>
        </div>`
            : ''
        }
      </div>
    </div>`;
  }

  renderDefectCard(test, idx) {
    const errorText = test.errors.map((e) => `${e.message}\n${e.stack}`).join('\n\n');
    const jiraTicket = `h3. [AUTOMATION DEFECT] ${test.title}
*Module:* ${test.file}:${test.line}
*Browser / Project:* ${test.project}
*Category:* ${test.category}
*Root Cause:*
{code:none}
${test.errors[0]?.message || 'Unknown failure'}
{code}
*Stack Trace:*
{code:none}
${test.errors[0]?.stack || 'No stack trace'}
{code}`;

    return `
    <div class="defect-card">
      <div class="defect-header-line">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: var(--status-fail); text-transform: uppercase;">Defect #${idx + 1}</span>
          <h4 class="defect-title-text">${escapeHtml(test.title)}</h4>
          <span style="font-size: 12px; color: var(--text-dim); font-family: ui-monospace, SFMono-Regular, monospace;">${escapeHtml(test.file)}:${test.line}</span>
        </div>
        <div class="defect-meta-pills">
          <span class="tag-category">${escapeHtml(test.category)}</span>
          <span class="browser-chip">${escapeHtml(test.project)}</span>
          <button class="btn-copy-defect" data-defect-content="${escapeHtml(jiraTicket)}">Copy JIRA Ticket</button>
        </div>
      </div>
      <div class="stack-code-block">${escapeHtml(errorText)}</div>
      ${
        test.attachments.filter((a) => a.base64).length > 0
          ? `
      <div style="margin-top: 14px;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-dim);">Failure Screenshot</span>
        <div style="margin-top: 6px;">
          <img class="gallery-img-thumb" src="${test.attachments.find((a) => a.base64).base64}" alt="Failure screenshot">
        </div>
      </div>`
          : ''
      }
    </div>`;
  }
}
