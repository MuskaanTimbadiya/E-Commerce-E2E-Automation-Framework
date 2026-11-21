// API Base Resolution (supports file:// and direct localhost access)
const API_BASE = (window.location.protocol === 'file:' || !window.location.host)
  ? 'http://127.0.0.1:4000'
  : '';

// State Management
let allSuites = [];
let selectedSpecFiles = new Set();
let selectedScenarios = new Set(); // set of unique keys: "file::title"
let isRunning = false;
let runTimerInterval = null;
let runSeconds = 0;
let activeCategoryFilter = 'all';
let activeBrowser = 'chromium';
let searchQuery = '';

// DOM Elements
const executionStatusPill = document.getElementById('executionStatusPill');
const statusText = document.getElementById('statusText');
const timerDisplay = document.getElementById('timerDisplay');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeSvg = document.getElementById('themeSvg');
const themeLabel = document.getElementById('themeLabel');

const totalTestsRibbon = document.getElementById('totalTestsRibbon');
const totalSuitesRibbon = document.getElementById('totalSuitesRibbon');

const browserSegmentBtns = document.querySelectorAll('#browserSegmentedControl .segment-btn');
const headedToggle = document.getElementById('headedToggle');
const workersSelect = document.getElementById('workersSelect');

const presetAllBtn = document.getElementById('presetAllBtn');
const presetE2EBtn = document.getElementById('presetE2EBtn');
const presetUIBtn = document.getElementById('presetUIBtn');
const presetAPIBtn = document.getElementById('presetAPIBtn');

const selectedCountBadge = document.getElementById('selectedCountBadge');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const scenarioSearchInput = document.getElementById('scenarioSearchInput');
const categoryTabs = document.querySelectorAll('.cat-tab');
const scenariosList = document.getElementById('scenariosList');

const totalTestsCount = document.getElementById('totalTestsCount');
const e2eTestsCount = document.getElementById('e2eTestsCount');
const uiTestsCount = document.getElementById('uiTestsCount');
const apiTestsCount = document.getElementById('apiTestsCount');

const launchBtn = document.getElementById('launchBtn');
const launchBtnText = document.getElementById('launchBtnText');
const stopBtn = document.getElementById('stopBtn');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const autoScrollToggle = document.getElementById('autoScrollToggle');

const commandPreviewText = document.getElementById('commandPreviewText');
const copyCmdBtn = document.getElementById('copyCmdBtn');
const activityBar = document.getElementById('activityBar');
const terminalBody = document.getElementById('terminalBody');
const linesCount = document.getElementById('linesCount');

const completionBanner = document.getElementById('completionBanner');
const bannerTitle = document.getElementById('bannerTitle');
const bannerMeta = document.getElementById('bannerMeta');
const historyList = document.getElementById('historyList');

// Modal Elements
const openReportModalBtn = document.getElementById('openReportModalBtn');
const reportModal = document.getElementById('reportModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const reportIframe = document.getElementById('reportIframe');

// Theme Toggle
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light') {
    html.classList.remove('theme-dark');
    html.classList.add('theme-light');
    themeSvg.innerHTML = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
    themeLabel.textContent = 'Dark';
  } else {
    html.classList.remove('theme-light');
    html.classList.add('theme-dark');
    themeSvg.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>';
    themeLabel.textContent = 'Light';
  }
  localStorage.setItem('dashboard_theme', theme);
}

const savedTheme = localStorage.getItem('dashboard_theme') || 'dark';
applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('theme-dark');
  applyTheme(isDark ? 'light' : 'dark');
});

// Modal Logic
if (openReportModalBtn) {
  openReportModalBtn.addEventListener('click', () => {
    reportIframe.src = `/reports/index.html?ts=${Date.now()}`;
    reportModal.classList.add('active');
  });
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    reportModal.classList.remove('active');
    reportIframe.src = 'about:blank';
  });
}

if (reportModal) {
  reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) {
      reportModal.classList.remove('active');
      reportIframe.src = 'about:blank';
    }
  });
}

// Browser Segmented Control
browserSegmentBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    browserSegmentBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeBrowser = btn.getAttribute('data-val');
    updateCommandPreview();
  });
});

// ANSI Escape Code Parser to Colored HTML
function ansiToHtml(text) {
  if (!text) return '';
  let str = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // ANSI color replacements
  str = str.replace(/\x1b\[0?m/g, '</span>');
  str = str.replace(/\x1b\[1m/g, '<span style="font-weight:bold">');
  str = str.replace(/\x1b\[2m/g, '<span style="opacity:0.7">');
  str = str.replace(/\x1b\[31m/g, '<span style="color:#ef4444;font-weight:bold">'); // Red
  str = str.replace(/\x1b\[32m/g, '<span style="color:#10b981;font-weight:bold">'); // Green
  str = str.replace(/\x1b\[33m/g, '<span style="color:#f59e0b">'); // Yellow
  str = str.replace(/\x1b\[34m/g, '<span style="color:#60a5fa">'); // Blue
  str = str.replace(/\x1b\[35m/g, '<span style="color:#c084fc">'); // Magenta
  str = str.replace(/\x1b\[36m/g, '<span style="color:#38bdf8">'); // Cyan
  str = str.replace(/\x1b\[90m/g, '<span style="color:#64748b">'); // Gray
  str = str.replace(/\x1b\[2K/g, ''); // Clear line
  str = str.replace(/\x1b\[1A/g, ''); // Move cursor up
  str = str.replace(/\x1b\[\d+;?\d*m/g, '');

  return str;
}

// Fetch and Render Scenarios
async function loadScenarios() {
  try {
    const res = await fetch(API_BASE + '/api/scenarios');
    const data = await res.json();
    if (data.success && Array.isArray(data.suites)) {
      allSuites = data.suites;

      let total = 0, e2e = 0, ui = 0, api = 0;
      for (const s of allSuites) {
        total += s.scenariosCount;
        if (s.category === 'E2E Flow') e2e += s.scenariosCount;
        else if (s.category === 'UI Regression') ui += s.scenariosCount;
        else if (s.category === 'API Contract') api += s.scenariosCount;
      }

      totalTestsRibbon.textContent = total;
      totalSuitesRibbon.textContent = allSuites.length;
      totalTestsCount.textContent = total;
      e2eTestsCount.textContent = e2e;
      uiTestsCount.textContent = ui;
      apiTestsCount.textContent = api;

      selectAllScenarios();
      renderScenarios();
      updateCommandPreview();
    }
  } catch (err) {
    scenariosList.innerHTML = `
      <div class="state-message" style="color:var(--status-fail); line-height: 1.6;">
        <strong>⚠️ Dashboard Server Offline</strong><br>
        Please start the test runner server by running in your terminal:<br>
        <code style="background:var(--bg-elevated); padding: 3px 8px; border-radius: 4px; display:inline-block; margin-top:6px; font-weight:700;">npm run dashboard</code><br>
        <small style="color:var(--text-dim); display:inline-block; margin-top:8px;">Then refresh this page at http://127.0.0.1:4000</small>
      </div>`;
  }
}

function selectAllScenarios() {
  selectedSpecFiles.clear();
  selectedScenarios.clear();
  for (const s of allSuites) {
    selectedSpecFiles.add(s.file);
    for (const sc of s.scenarios) {
      selectedScenarios.add(`${s.file}::${sc.title}`);
    }
  }
  updateSelectionCount();
}

function deselectAllScenarios() {
  selectedSpecFiles.clear();
  selectedScenarios.clear();
  updateSelectionCount();
}

function getExecutionTarget() {
  const total = allSuites.reduce((acc, s) => acc + s.scenariosCount, 0);
  const count = selectedScenarios.size;

  // Case 1: 0 selected or all selected -> run all scenarios
  if (count === 0 || count === total) {
    return {
      specFiles: undefined,
      grep: undefined,
      displayGrep: '',
    };
  }

  // Parse selected scenarios (key = "file::title")
  const filesSet = new Set();
  const titles = [];

  for (const key of selectedScenarios) {
    const idx = key.indexOf('::');
    if (idx !== -1) {
      const file = key.substring(0, idx);
      const title = key.substring(idx + 2);
      filesSet.add(file);
      titles.push(title);
    }
  }

  const specFiles = Array.from(filesSet);

  // Check if every scenario in the selected spec files is selected
  let allInSelectedFiles = true;
  for (const file of specFiles) {
    const suite = allSuites.find((s) => s.file === file);
    if (suite) {
      const allInSuite = suite.scenarios.every((sc) =>
        selectedScenarios.has(`${file}::${sc.title}`)
      );
      if (!allInSuite) {
        allInSelectedFiles = false;
        break;
      }
    }
  }

  // If complete spec files were selected, run by file without grep
  if (allInSelectedFiles) {
    return {
      specFiles,
      grep: undefined,
      displayGrep: '',
    };
  }

  // If specific individual scenario(s) were selected: use exact Playwright regex grep anchor
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const grep = titles.length === 1
    ? `${escapeRegex(titles[0])}$`
    : `(${titles.map(escapeRegex).join('|')})$`;

  const displayGrep = titles.length === 1
    ? `"${titles[0]}"`
    : `"${titles[0]} | +${titles.length - 1} more"`;

  return {
    specFiles,
    grep,
    displayGrep,
  };
}

function updateSelectionCount() {
  const count = selectedScenarios.size;
  const total = allSuites.reduce((acc, s) => acc + s.scenariosCount, 0);

  if (count === 0) {
    selectedCountBadge.textContent = '0 selected';
    launchBtnText.textContent = 'Launch All Scenarios';
  } else if (count === 1) {
    selectedCountBadge.textContent = '1 scenario selected';
    launchBtnText.textContent = 'Launch Selected (1)';
  } else if (count === total) {
    selectedCountBadge.textContent = `All (${count}) selected`;
    launchBtnText.textContent = `Launch All (${count})`;
  } else {
    selectedCountBadge.textContent = `${count} selected`;
    launchBtnText.textContent = `Launch Selected (${count})`;
  }

  updateCommandPreview();
}

function updateCommandPreview() {
  const browser = activeBrowser;
  const headed = headedToggle.value === 'true';
  const workers = workersSelect.value;
  const target = getExecutionTarget();

  let cmd = 'npx playwright test';
  if (target.specFiles && target.specFiles.length > 0) {
    cmd += ` ${target.specFiles.join(' ')}`;
  }
  if (target.grep) {
    cmd += ` -g ${target.displayGrep || `"${target.grep}"`}`;
  }
  if (browser !== 'all') {
    cmd += ` --project=${browser}`;
  }
  if (headed) {
    cmd += ' --headed';
  }
  if (workers !== '1') {
    cmd += ` --workers=${workers}`;
  }

  commandPreviewText.textContent = cmd;
}

function renderScenarios() {
  if (allSuites.length === 0) {
    scenariosList.innerHTML = '<div class="state-message">No scenarios found in tests/</div>';
    return;
  }

  const query = searchQuery.toLowerCase().trim();
  let html = '';

  for (const s of allSuites) {
    const matchesCategory = activeCategoryFilter === 'all' || s.category === activeCategoryFilter;
    if (!matchesCategory) continue;

    const filteredScenarios = s.scenarios.filter((sc) => {
      if (!query) return true;
      return sc.title.toLowerCase().includes(query) || s.file.toLowerCase().includes(query);
    });

    if (filteredScenarios.length === 0 && query) continue;

    const isSuiteSelected = selectedSpecFiles.has(s.file);
    const categoryClass =
      s.category === 'E2E Flow' ? 'e2e' : s.category === 'UI Regression' ? 'ui' : s.category === 'API Contract' ? 'api' : 'func';

    html += `
    <div class="suite-item" data-file="${escapeHtml(s.file)}">
      <div class="suite-title-bar">
        <div class="suite-checkbox-group">
          <input type="checkbox" class="custom-chk suite-chk" data-file="${escapeHtml(s.file)}" ${isSuiteSelected ? 'checked' : ''}>
          <span class="suite-name-text" title="${escapeHtml(s.file)}">${escapeHtml(s.file)}</span>
        </div>
        <span class="category-tag ${categoryClass}">${escapeHtml(s.category)}</span>
      </div>
      <div class="suite-tests-list">
        ${filteredScenarios
          .map((sc) => {
            const key = `${s.file}::${sc.title}`;
            const isChecked = selectedScenarios.has(key);
            return `
          <div class="scenario-row">
            <label class="scenario-label-wrap">
              <input type="checkbox" class="custom-chk scenario-chk" data-key="${escapeHtml(key)}" data-file="${escapeHtml(s.file)}" ${isChecked ? 'checked' : ''}>
              <span class="scenario-title" title="${escapeHtml(sc.title)}">${escapeHtml(sc.title)}</span>
            </label>
            <span class="scenario-line">:${sc.line}</span>
            <button class="run-single-btn" data-file="${escapeHtml(s.file)}" data-title="${escapeHtml(sc.title)}" title="Run this scenario isolated">
              <svg viewBox="0 0 24 24" class="btn-svg-xs"><path d="M8 5v14l11-7z"/></svg>
              <span>Run</span>
            </button>
          </div>`;
          })
          .join('')}
      </div>
    </div>`;
  }

  scenariosList.innerHTML = html || '<div class="state-message">No matching scenarios found</div>';
  attachScenarioEvents();
}

function attachScenarioEvents() {
  document.querySelectorAll('.suite-chk').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const file = e.target.getAttribute('data-file');
      const isChecked = e.target.checked;
      const suite = allSuites.find((s) => s.file === file);

      if (isChecked) {
        selectedSpecFiles.add(file);
        if (suite) {
          for (const sc of suite.scenarios) {
            selectedScenarios.add(`${file}::${sc.title}`);
          }
        }
      } else {
        selectedSpecFiles.delete(file);
        if (suite) {
          for (const sc of suite.scenarios) {
            selectedScenarios.delete(`${file}::${sc.title}`);
          }
        }
      }

      document.querySelectorAll(`.scenario-chk[data-file="${file}"]`).forEach((childChk) => {
        childChk.checked = isChecked;
      });

      updateSelectionCount();
    });
  });

  document.querySelectorAll('.scenario-chk').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const key = e.target.getAttribute('data-key');
      const file = e.target.getAttribute('data-file');
      if (e.target.checked) {
        selectedScenarios.add(key);
        selectedSpecFiles.add(file);
      } else {
        selectedScenarios.delete(key);
        const hasOtherInFile = Array.from(selectedScenarios).some((k) => k.startsWith(`${file}::`));
        if (!hasOtherInFile) {
          selectedSpecFiles.delete(file);
        }
      }

      const suiteChk = document.querySelector(`.suite-chk[data-file="${file}"]`);
      if (suiteChk) {
        suiteChk.checked = selectedSpecFiles.has(file);
      }

      updateSelectionCount();
    });
  });

  document.querySelectorAll('.run-single-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const file = btn.getAttribute('data-file');
      const title = btn.getAttribute('data-title');
      function escapeRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      executeTestRun({
        specFiles: [file],
        grep: `${escapeRegex(title)}$`,
      });
    });
  });
}



// Preset Handlers
function setActivePreset(btn) {
  document.querySelectorAll('.preset-pill').forEach((p) => p.classList.remove('active'));
  btn.classList.add('active');
}

presetAllBtn.addEventListener('click', () => {
  setActivePreset(presetAllBtn);
  selectAllScenarios();
  renderScenarios();
});

presetE2EBtn.addEventListener('click', () => {
  setActivePreset(presetE2EBtn);
  selectedSpecFiles.clear();
  selectedScenarios.clear();
  for (const s of allSuites) {
    if (s.category === 'E2E Flow') {
      selectedSpecFiles.add(s.file);
      for (const sc of s.scenarios) selectedScenarios.add(`${s.file}::${sc.title}`);
    }
  }
  updateSelectionCount();
  renderScenarios();
});

presetUIBtn.addEventListener('click', () => {
  setActivePreset(presetUIBtn);
  selectedSpecFiles.clear();
  selectedScenarios.clear();
  for (const s of allSuites) {
    if (s.category === 'UI Regression') {
      selectedSpecFiles.add(s.file);
      for (const sc of s.scenarios) selectedScenarios.add(`${s.file}::${sc.title}`);
    }
  }
  updateSelectionCount();
  renderScenarios();
});

presetAPIBtn.addEventListener('click', () => {
  setActivePreset(presetAPIBtn);
  selectedSpecFiles.clear();
  selectedScenarios.clear();
  for (const s of allSuites) {
    if (s.category === 'API Contract') {
      selectedSpecFiles.add(s.file);
      for (const sc of s.scenarios) selectedScenarios.add(`${s.file}::${sc.title}`);
    }
  }
  updateSelectionCount();
  renderScenarios();
});

selectAllBtn.addEventListener('click', () => {
  selectAllScenarios();
  renderScenarios();
});

deselectAllBtn.addEventListener('click', () => {
  deselectAllScenarios();
  renderScenarios();
});

categoryTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    categoryTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategoryFilter = tab.getAttribute('data-cat');
    renderScenarios();
  });
});

scenarioSearchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderScenarios();
});

// Config dropdown events
[headedToggle, workersSelect].forEach((el) => {
  el.addEventListener('change', updateCommandPreview);
});

// Copy CLI command
copyCmdBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(commandPreviewText.textContent).then(() => {
    const span = copyCmdBtn.querySelector('span');
    span.textContent = 'Copied!';
    setTimeout(() => {
      span.textContent = 'Copy';
    }, 2000);
  });
});

// Execution Trigger
launchBtn.addEventListener('click', () => {
  const target = getExecutionTarget();
  executeTestRun({
    specFiles: target.specFiles,
    grep: target.grep,
  });
});

stopBtn.addEventListener('click', async () => {
  try {
    stopBtn.disabled = true;
    stopBtn.innerHTML = '<svg viewBox="0 0 24 24" class="btn-svg"><path d="M6 6h12v12H6z"/></svg><span>Stopping...</span>';
    await fetch(API_BASE + '/api/stop', { method: 'POST' });
  } catch (err) {
    console.error('Failed to stop run:', err);
  }
});

clearConsoleBtn.addEventListener('click', () => {
  terminalBody.innerHTML = '';
  linesCount.textContent = '0 lines';
});

async function executeTestRun(overrides = {}) {
  if (isRunning) return;

  const payload = {
    specFiles: overrides.specFiles || (selectedSpecFiles.size > 0 ? Array.from(selectedSpecFiles) : undefined),
    grep: overrides.grep || undefined,
    project: activeBrowser,
    headed: headedToggle.value === 'true',
    workers: parseInt(workersSelect.value, 10),
  };

  try {
    setRunningState(true);
    completionBanner.classList.add('hidden');

    const res = await fetch(API_BASE + '/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setRunningState(false);
      appendTerminalLog(`\x1b[31m[ERROR] ${data.error || 'Failed to start execution'}\x1b[0m\n`);
    }
  } catch (err) {
    setRunningState(false);
    appendTerminalLog(`\x1b[31m[NETWORK ERROR] ${err.message}\x1b[0m\n`);
  }
}

function setRunningState(running, pid = null) {
  isRunning = running;
  launchBtn.disabled = running;
  stopBtn.disabled = !running;
  stopBtn.innerHTML = '<svg viewBox="0 0 24 24" class="btn-svg"><path d="M6 6h12v12H6z"/></svg><span>Stop Run</span>';

  if (running) {
    executionStatusPill.className = 'execution-status-pill running';
    statusText.textContent = pid ? `RUNNING (PID: ${pid})` : 'INITIALIZING';
    activityBar.classList.add('running');
    runSeconds = 0;
    timerDisplay.textContent = '00:00';
    clearInterval(runTimerInterval);
    runTimerInterval = setInterval(() => {
      runSeconds++;
      const mins = String(Math.floor(runSeconds / 60)).padStart(2, '0');
      const secs = String(runSeconds % 60).padStart(2, '0');
      timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
  } else {
    clearInterval(runTimerInterval);
    activityBar.classList.remove('running');
  }
}

// Server-Sent Events (SSE) Listener
function setupSSE() {
  if (window.location.protocol === 'file:') return; // EventSource not supported on file:// URLs
  const evtSource = new EventSource(API_BASE + '/api/events');

  evtSource.addEventListener('init', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.run && data.run.status === 'running') {
        setRunningState(true, data.run.pid);
      }
      fetchHistory();
    } catch {}
  });

  evtSource.addEventListener('start', (e) => {
    try {
      const data = JSON.parse(e.data);
      setRunningState(true, data.run.pid);
      terminalBody.innerHTML = '';
      appendTerminalLog(`\x1b[36m${'='.repeat(72)}\x1b[0m\n`);
      appendTerminalLog(`\x1b[32m🚀 TEST RUN INITIATED: ${data.message}\x1b[0m\n`);
      appendTerminalLog(`\x1b[36m${'='.repeat(72)}\x1b[0m\n\n`);
    } catch {}
  });

  evtSource.addEventListener('log', (e) => {
    try {
      const data = JSON.parse(e.data);
      appendTerminalLog(data.text);
    } catch {}
  });

  evtSource.addEventListener('finish', (e) => {
    try {
      const data = JSON.parse(e.data);
      setRunningState(false);

      const isSuccess = data.status === 'completed' && data.exitCode === 0;
      executionStatusPill.className = `execution-status-pill ${isSuccess ? 'completed' : 'failed'}`;
      statusText.textContent = isSuccess ? 'COMPLIANT' : `FAILED (${data.exitCode})`;

      completionBanner.className = `result-banner ${isSuccess ? 'success' : 'failure'}`;
      bannerTitle.textContent = isSuccess
        ? 'Test Execution Completed (All Passed)'
        : 'Test Execution Completed With Failures / Defects';
      const durSec = (data.duration / 1000).toFixed(1);
      bannerMeta.textContent = `Elapsed: ${durSec}s • Exit Code: ${data.exitCode} • Status: ${data.status.toUpperCase()}`;

      appendTerminalLog(`\n\x1b[36m${'='.repeat(72)}\x1b[0m\n`);
      appendTerminalLog(`\x1b[${isSuccess ? '32' : '31'}m🏁 SUITE EXECUTION SETTLED (${data.status.toUpperCase()}) in ${durSec}s\x1b[0m\n`);
      appendTerminalLog(`\x1b[36m${'='.repeat(72)}\x1b[0m\n`);

      fetchHistory();
    } catch {}
  });
}

let totalLines = 0;
function appendTerminalLog(rawText) {
  const html = ansiToHtml(rawText);
  terminalBody.insertAdjacentHTML('beforeend', html);

  totalLines += (rawText.match(/\n/g) || []).length;
  linesCount.textContent = `${totalLines} lines`;

  if (autoScrollToggle.checked) {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
}

async function fetchHistory() {
  try {
    const res = await fetch(API_BASE + '/api/status');
    const data = await res.json();
    if (data.success && Array.isArray(data.history)) {
      renderHistory(data.history);
    }
  } catch {}
}

function renderHistory(items) {
  if (items.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No executions recorded in this session.</p>';
    return;
  }

  historyList.innerHTML = items
    .map((item) => {
      const dur = (item.duration / 1000).toFixed(1);
      const timeStr = new Date(item.startTime).toLocaleTimeString();
      return `
    <div class="history-row">
      <div class="history-left-meta">
        <span class="history-badge ${item.status}">${item.status}</span>
        <span class="history-cmd-text" title="${escapeHtml(item.command)}">${escapeHtml(item.command)}</span>
      </div>
      <span class="history-time-stamp">${dur}s @ ${timeStr}</span>
    </div>`;
    })
    .join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Focus search when pressing '/'
  if (e.key === '/' && document.activeElement !== scenarioSearchInput) {
    e.preventDefault();
    scenarioSearchInput.focus();
    scenarioSearchInput.select();
  }

  // Close modal when pressing Esc
  if (e.key === 'Escape') {
    if (reportModal && reportModal.classList.contains('active')) {
      reportModal.classList.remove('active');
      reportIframe.src = 'about:blank';
    }
  }

  // Launch on Cmd+Enter or Ctrl+Enter
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    if (!isRunning) {
      e.preventDefault();
      launchBtn.click();
    }
  }
});

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
  loadScenarios();
  setupSSE();
});
