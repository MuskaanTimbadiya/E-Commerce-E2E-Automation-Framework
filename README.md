# Enterprise E-Commerce Automation Platform & E2E Testing Framework

[![Playwright](https://img.shields.io/badge/Playwright-v1.63.0-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Page%20Object%20Model%20(POM)-blue)]()
[![Report](https://img.shields.io/badge/Audit%20Report-Executive%20HTML5-purple)]()
[![Dashboard](https://img.shields.io/badge/Local%20Runner-Interactive%20Hub-orange)]()
[![Security](https://img.shields.io/badge/OWASP-A03%20%2F%20LLM05%20Compliant-red)]()

A production-grade, enterprise-ready end-to-end automation framework built for robust, scalable web and API testing against modern e-commerce applications. Designed to comply with multinational corporation (MNC) engineering standards, featuring pure-JSON locator abstractions, API-seeded authentication flows, self-contained executive audit reporting, and a live local execution hub.

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Key Capabilities & Innovations](#key-capabilities--innovations)
3. [Framework Structure](#framework-structure)
4. [Test Scenarios & Coverage Matrix](#test-scenarios--coverage-matrix)
5. [Local Scenario Execution Dashboard](#local-scenario-execution-dashboard)
6. [MNC Executive Quality Audit Reporter](#mnc-executive-quality-audit-reporter)
7. [Getting Started & Installation](#getting-started--installation)
8. [CLI Execution Commands](#cli-execution-commands)
9. [Agentic Threat Modeling & Security Directives](#agentic-threat-modeling--security-directives)
10. [Google Cloud Run & Cloud Native Deployment Guide](#google-cloud-run--cloud-native-deployment-guide)
11. [CI/CD Integration & GitHub Actions Workflow](#cicd-integration--github-actions-workflow)

---

## Architectural Overview

This framework implements an enterprise **Page Object Model (POM)** pattern enhanced by declarative separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                 TEST SUITES (tests/)                        │
│   e2e.spec.js  │  ui.spec.js  │  api.spec.js                │
└──────────────────────────────┬──────────────────────────────┘
                               │ invokes
┌──────────────────────────────▼──────────────────────────────┐
│             PAGE OBJECT SCRIPTS (scripts/)                  │
│   login.page.js  │  cart.page.js  │  home.page.js  ...       │
└──────────────┬──────────────────────────────┬───────────────┘
               │ imports                      │ seeds auth via
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│   LOCATOR REPO (pages/)     ││    API SEEDING (utils/)      │
│   login.json  │ cart.json   ││    userApi.js                │
│   home.json   │ account.json││    Dynamic Registration API  │
└─────────────────────────────┘└──────────────────────────────┘
```

1. **Declarative Locators (`pages/*.json`)**: UI locators are separated into structured JSON files, ensuring zero locator hardcoding in page logic and instant maintenance without modifying JavaScript classes.
2. **Action-Driven Page Classes (`scripts/*.page.js`)**: Encapsulate high-level user workflows (checkout, invoice download, navigation, product filtering).
3. **API-First Dynamic Auth Seeding (`utils/userApi.js`)**: Eliminates flake and static account dependency by dynamically generating, registering, and deleting test users through the backend API before executing browser journeys.

---

## Key Capabilities & Innovations

* **Fast, Flake-Free Authentication**: Automatically provisions unique accounts (`POST /api/createAccount`) before testing signed-in checkout, address validation, and invoice downloads.
* **Interactive Local Scenario Runner Dashboard**: Modern web UI on `http://127.0.0.1:4000` for exploring suites, selecting individual scenarios, choosing browser engines, and monitoring live ANSI-colored logs.
* **MNC-Grade Executive HTML Audit Report**: Self-contained, single-file HTML report with SLA quality gates, SVG donut analytics, module performance tables, and 1-click JIRA defect ticket generation.
* **Air-Gap & Zero-CDN Security**: 100% offline functionality with zero external fonts or CDN trackers, and strict HTML sanitization against XSS.

---

## Framework Structure

```
.
├── dashboard/                     # Local Scenario Execution Dashboard
│   ├── server.js                  # Hardened local HTTP & SSE streaming server
│   └── public/
│       ├── index.html             # Executive 2-column runner UI
│       ├── style.css              # Obsidian Dark & Pearl Light themes
│       └── app.js                 # Reactive scenario selector & SSE client
├── pages/                         # Declarative UI Locator Schemas
│   ├── account-information.json   # Account setup form selectors
│   ├── account.json               # Profile & status selectors
│   ├── cart.json                  # Shopping cart & checkout selectors
│   ├── home.json                  # Navbar & homepage selectors
│   ├── login.json                 # Sign-in & sign-up input selectors
│   ├── product-details.json       # Product view & review selectors
│   └── productDetails.json        # Alternative product selectors
├── reports/                       # Executive Audit Reports
│   └── index.html                 # Self-contained audit dashboard
├── reporters/                     # Custom Playwright Reporters
│   └── custom-reporter.js         # Enterprise HTML reporter implementation
├── scripts/                       # Page Object Classes
│   ├── account.page.js            # Account actions
│   ├── cart.page.js               # Cart & checkout flows
│   ├── home.page.js               # Navigation & home flows
│   ├── login.page.js              # Authentication journeys
│   └── product-details.page.js    # Product & catalog actions
├── test-data/                     # Test Fixtures & Static Payloads
│   └── user.json                  # Baseline user demographic attributes
├── tests/                         # Playwright Test Suites (38 Scenarios)
│   ├── api/api.spec.js            # Backend API contracts (14 tests)
│   ├── e2e/e2e.spec.js            # Multi-step checkout & orders (4 tests)
│   └── ui/ui.spec.js              # UI regression scenarios (20 tests)
├── utils/                         # Shared Utilities & API Helpers
│   ├── api.js                     # Common API exports
│   └── userApi.js                 # API account creation & cleanup helpers
├── package.json                   # Project metadata & npm scripts
└── playwright.config.js           # Playwright framework configuration
```

---

## Test Scenarios & Coverage Matrix

The framework provides comprehensive test coverage across 40 distinct scenarios:

| Suite / Spec File | Domain Category | Count | Coverage Highlights |
| :--- | :--- | :---: | :--- |
| [tests/e2e/e2e.spec.js](file:///Users/muskaantimbadiya/E-Commerce-E2E-Automation-Framework/tests/e2e/e2e.spec.js) | **E2E Flow** | 4 | Complete guest/registered order placement, invoice PDF download, multi-step checkout. |
| [tests/ui/ui.spec.js](file:///Users/muskaantimbadiya/E-Commerce-E2E-Automation-Framework/tests/ui/ui.spec.js) | **UI Regression** | 20 | Authentication validation, duplicate account prevention, cart quantity editing, address verification, category browsing, product review submission, recommended items. |
| [tests/api/api.spec.js](file:///Users/muskaantimbadiya/E-Commerce-E2E-Automation-Framework/tests/api/api.spec.js) | **API Contract** | 14 | Products list validation, brands verification, product search endpoints, credential authentication APIs, user creation/update/deletion endpoints. |

---

## Local Scenario Execution Dashboard

An interactive developer and QA hub for running tests locally without remembering complex CLI flags.

```bash
# Start the local dashboard
npm run dashboard
```

Open **`http://127.0.0.1:4000`** in your browser.

### Key Capabilities

* **Scenario Catalog & Multi-Select**: Dynamic tree of all 40 scenarios with checkboxes, suite tags, and line numbers.
* **Precision Targeting**: Select any single testcase or subset; the runner automatically attaches exact Playwright anchors (`-g "<Title>$"`).
* **CLI Command Preview**: Live `$ npx playwright test ...` command bar updates dynamically as you adjust parameters.
* **Browser Engine Selection**: One-click toggling between `Chromium`, `Firefox`, `WebKit`, and `All Browsers`.
* **Execution Options**: Configurable Headless/Headed modes and worker thread pools (`1x`, `2x`, `4x`).
* **Live Streaming Console**: Real-time terminal with ANSI color highlighting (green passes, red failures, cyan headers) powered by Server-Sent Events (SSE).
* **Embedded Audit Report Modal**: View the full executive HTML report directly inside a backdrop-blurred overlay modal without navigating away.
* **Developer Hotkeys**:
  * <kbd>/</kbd> — Focus scenario search input.
  * <kbd>Cmd</kbd> + <kbd>Enter</kbd> (or <kbd>Ctrl</kbd> + <kbd>Enter</kbd>) — Launch selected scenarios.
  * <kbd>Esc</kbd> — Dismiss report modal dialog.

---

## MNC Executive Quality Audit Reporter

The framework replaces standard test outputs with an executive-level quality audit report located at [reports/index.html](file:///Users/muskaantimbadiya/E-Commerce-E2E-Automation-Framework/reports/index.html).

### Report Features

1. **Quality Gate Compliance**: Automatic SLA calculation (`PASSED [COMPLIANT]` when Pass Rate $\ge$ 95% with 0 critical defects).
2. **Pure-SVG Analytical Donut**: Math-driven SVG chart illustrating pass/fail/flaky distributions without external chart libraries.
3. **Module Performance Matrix**: Spec file table showing pass ratios, proportional progress bars, and execution latencies.
4. **Defect Center & Root Cause Analysis (RCA)**: Groups failed tests with sanitized stack traces and a 1-click **"Copy JIRA Ticket"** button.
5. **Self-Contained Visual Evidence**: Encodes test failure screenshots directly in Base64 with an interactive click-to-zoom Lightbox modal.
6. **Executive Print-to-PDF**: Dedicated `@media print` styling for generating PDF reports for management and stakeholders.
7. **Zero-Hang Process**: Exits cleanly (`exit code 0`) without hanging on local server ports.

---

## Getting Started & Installation

### Prerequisites

* **Node.js**: `v20.x` or higher
* **npm**: `v9.x` or higher
* **Supported Platforms**: macOS, Linux, Windows

### Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/E-Commerce-E2E-Automation-Framework.git
cd E-Commerce-E2E-Automation-Framework

# 2. Install dependencies
npm install

# 3. Install Playwright browser binaries
npx playwright install --with-deps
```

---

## CLI Execution Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dashboard` | Launches the interactive local scenario execution web dashboard on `http://127.0.0.1:4000` |
| `npm run test:api` | Runs backend REST API contract test suite (14 tests on Chromium) |
| `npm run test:smoke` | Runs high-priority smoke suite (4 core checkout E2E scenarios on Chromium) |
| `npm test` | Executes all 38 scenarios across all configured browser projects |
| `npm run test:e2e` | Runs E2E checkout and order placement flows (`tests/e2e`) |
| `npm run test:ui` | Runs UI regression scenarios (`tests/ui`) |
| `npm run test:api` | Runs backend API contract validation suites (`tests/api`) |
| `npm run report:open` | Opens the executive HTML audit report in your default browser |

### Custom CLI Invocations

```bash
# Run a specific spec file in headed Chromium
npx playwright test tests/e2e/e2e.spec.js --project=chromium --headed

# Run an individual test scenario using exact grep matching
npx playwright test tests/ui/ui.spec.js -g "User can login with valid credentials$" --project=chromium

# Run with increased worker parallelism
npx playwright test tests/api/api.spec.js --workers=4
```

---

## Agentic Threat Modeling & Security Directives

| Threat Zone | Identified Risk Scenario | Countermeasure & Mitigations |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious payloads injected into test titles, assertion logs, or runner API parameters (Stored XSS). | Strict HTML escaping (`escapeHtml`) on all dynamic titles, error stacks, and step timelines (OWASP LLM05 / A03). |
| **Planning & Reasoning** | Concurrent runner execution races or state tampering via parameter manipulation. | Single-flight execution lock in `dashboard/server.js`; strict schema whitelisting for all execution options. |
| **Tool Execution** | Arbitrary shell command injection or directory traversal attacks. | Parameterized child process spawning (`spawn('npx', args, { shell: false })`) with zero shell string interpolation. Normalized path validation against directory traversal (OWASP A01). |
| **Memory & State** | Log buffer exhaustion or zombie browser processes lingering after test cancellations. | Capped 2,000-item ring buffer; progressive `SIGINT` with 2-second fallback to `SIGKILL` on runner stop triggers. |
| **Inter-System Comm** | Token or secret leakage via third-party CDN scripts, fonts, or tracking beacons. | **100% self-contained single-file HTML reports** with zero external network requests; localhost-only binding (`127.0.0.1`). |

---

## Google Cloud Run & Cloud Native Deployment Guide

This section outlines how to configure, secure, and deploy the automation dashboard and test runner as a containerized service on **Google Cloud Run**, fully compliant with Google Cloud security benchmarks.

### Architecture

```
┌────────────────────────────────────────────────────────┐
│                   GOOGLE CLOUD RUN                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Container: Node.js 20 Alpine + Playwright Engine │  │
│  │ Port: 8080 (Mapped via PORT env)                 │  │
│  └──────────────────────────┬───────────────────────┘  │
└─────────────────────────────┼──────────────────────────┘
                              │ Accesses Secrets
┌─────────────────────────────▼──────────────────────────┐
│              GOOGLE CLOUD SECRET MANAGER               │
│  GEMINI_API_KEY / TEST_AUTH_CREDENTIALS                │
└────────────────────────────────────────────────────────┘
```

### 1. Prerequisites & Environment Setup

Install the Google Cloud SDK (`gcloud`) and enable the required service APIs:

```bash
# Log in to Google Cloud
gcloud auth login

# Set your active Google Cloud Project
gcloud config set project YOUR_PROJECT_ID

# Enable Cloud Run, Secret Manager, and Container Registry APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  firestore.googleapis.com
```

### 2. Secret Management Setup (Zero-Hardcoding Hygiene)

Provision sensitive operational credentials (such as API keys or test credentials) through Google Cloud Secret Manager rather than baking them into source code or container images:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run default compute service account access to read secrets
export PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Database Security Configuration (Cloud Firestore)

If persisting execution history, test metrics, or interaction telemetry to Cloud Firestore, deploy owner-bound security rules to isolate data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Owner-bound path checking for user test sessions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

### 4. Containerization (`Dockerfile`)

Create a container image optimized for Playwright and Node.js:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.63.0-jammy

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Cloud Run binds to PORT environment variable (default: 8080)
ENV PORT=8080
EXPOSE 8080

# Start the dashboard server
CMD ["node", "dashboard/server.js"]
```

### 5. Cloud Run Deployment Flow

Build the container image and deploy the service to Google Cloud Run:

```bash
# Build container image with Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ecommerce-automation-hub

# Deploy to Cloud Run with Secret Manager binding
gcloud run deploy ecommerce-automation-hub \
  --image gcr.io/YOUR_PROJECT_ID/ecommerce-automation-hub \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --memory 2Gi \
  --cpu 2
```

### 6. Mandatory Campaign Verification Labeling

Apply the mandatory resource label to register the Cloud Run deployment for automated challenge and compliance verification:

```bash
gcloud run services update ecommerce-automation-hub \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## Quality Assurance & Verification

Every feature, page class, runner control, and reporter feature has been thoroughly verified through automated tests:

* **Page Object Refactoring**: Verified against live e-commerce endpoints with zero locator collisions.
* **API Dynamic User Seeding**: Verified account provisioning and order placement without static credential drift.
* **Executive HTML Audit Report**: Verified zero process hangs, Base64 screenshot embeddings, and pure-SVG donut rendering.
* **Interactive Dashboard**: Verified real-time SSE log streaming, single-scenario isolated execution (`-g`), and live parameter synchronization.

---

## CI/CD Integration & GitHub Actions Workflow

The framework includes a fully automated, production-hardened **GitHub Actions workflow** ([`.github/workflows/playwright.yml`](file:///.github/workflows/playwright.yml)):

### Key Pipeline Features:
* **Automated CI/CD Verification**: Executes on every `push` and `pull_request` targeting `main` or `master`.
* **Headless Auto-Detection**: Dynamic evaluation of `headless: !!process.env.CI` in `playwright.config.js` ensures reliable execution across Ubuntu Linux runners without requiring a physical or virtual display server.
* **Native GitHub Annotations**: Ingests Playwright's native `github` reporter in CI to provide inline annotations on Pull Request diffs and workflow logs.
* **Executive Quality Audit Upload**: Automatically packages and uploads the MNC Executive HTML report (`reports/index.html`) and failure traces (`test-results/`) as workflow artifacts with a 30-day retention window.
* **Deterministic Dependency Caching**: Caches `npm` packages keyed against `package-lock.json` for rapid pipeline execution.

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:
    inputs:
      test_suite:
        description: 'Select test suite to run'
        required: true
        default: 'api'
        type: choice
        options: [api, e2e, smoke, ui, all]

jobs:
  test:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium
    - name: Run Playwright tests
      run: npx playwright test tests/api/api.spec.js --project=chromium
    - name: Upload Test Report & Artifacts
      uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: executive-audit-report
        path: |
          reports/
          test-results/
        retention-days: 30
```

---

## License

This project is licensed under the [ISC License](LICENSE).
