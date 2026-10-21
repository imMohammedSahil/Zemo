/**
 * Zemo API Gateway - Production Landing Page & Status Dashboard
 * Flat, minimalist developer-grade design.
 * Zero emojis, zero icons, zero glowing dots, zero out-of-border glows.
 */

function renderLandingPage(data = {}) {
  const {
    dbConnected = true,
    port = 5000,
    nodeVersion = process.version,
    uptime = Math.floor(process.uptime()),
    env = "production",
    version = "1.0.0"
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zemo API Gateway • Production Price Intelligence Cloud</title>
  <meta name="description" content="Autonomous E-Commerce Price Intelligence, Cross-Store Arbitrage & Aspect-Based Sentiment Analysis Platform API Gateway." />
  <link rel="icon" type="image/png" href="/assets/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

  <style>
    :root {
      --bg: #070908;
      --surface: #0B110D;
      --surface-hover: #0F1712;
      --border: #16241C;
      --border-hover: #2B4434;
      --border-focus: #CEFF00;
      --primary: #CEFF00;
      --primary-hover: #D8FF26;
      --text: #F3F4F6;
      --text-muted: #8E9892;
      --text-stone: #D1CCC2;
      --pine: #0E2A1B;
      --emerald: #10B981;
      --cyan: #38BDF8;
      --amber: #FBBF24;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Custom Themed Scrollbar */
    html {
      scroll-padding-top: 16px;
      scrollbar-width: thin;
      scrollbar-color: #0E2A1B #070908;
    }

    ::-webkit-scrollbar {
      width: 11px;
      height: 11px;
    }

    ::-webkit-scrollbar-track {
      background: #070908;
      border-left: 1px solid #101B14;
    }

    ::-webkit-scrollbar-thumb {
      background: #0E2A1B;
      border-radius: 5px;
      border: 1px solid #1E4D30;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #CEFF00 !important;
      border-color: #CEFF00 !important;
    }

    ::-webkit-scrollbar-thumb:active {
      background: #D4FF1A !important;
      border-color: #D4FF1A !important;
    }

    ::-webkit-scrollbar-corner {
      background: #070908;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.5;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Clean Subtle Grid */
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 36px 36px;
      pointer-events: none;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
      padding: 0 clamp(24px, 4vw, 64px) 80px clamp(24px, 4vw, 64px);
    }

    /* Header */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 48px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }

    .brand-mark {
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-mark img {
      height: 24px;
      width: auto;
      max-width: 120px;
      object-fit: contain;
      display: block;
    }

    .brand-slash {
      color: #36493E;
      font-size: 15px;
      font-weight: 400;
      font-family: var(--font-mono);
      user-select: none;
    }

    .brand-label {
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
      font-family: var(--font-mono);
      letter-spacing: -0.2px;
    }

    .brand-version {
      font-size: 10px;
      font-weight: 700;
      color: var(--primary);
      background: rgba(206, 255, 0, 0.08);
      border: 1px solid rgba(206, 255, 0, 0.22);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--font-mono);
      letter-spacing: 0.5px;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-nav {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      padding: 7px 12px;
      border-radius: 6px;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .btn-nav:hover {
      color: #FFF;
      background: rgba(255, 255, 255, 0.04);
    }

    .btn-primary {
      background: var(--primary);
      color: #000000;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      padding: 8px 18px;
      border-radius: 6px;
      border: 1px solid var(--primary);
      cursor: pointer;
      transition: background 0.15s ease;
      display: inline-block;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }

    /* Section Kickers */
    .kicker {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--primary);
      margin-bottom: 8px;
      font-family: var(--font-mono);
    }

    /* Hero Section */
    .hero {
      text-align: center;
      max-width: 1080px;
      margin: 0 auto 64px auto;
    }

    .status-pill {
      display: inline-block;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 5px 14px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-stone);
      margin-bottom: 22px;
      font-family: var(--font-mono);
    }

    .hero-title {
      font-size: clamp(34px, 4.6vw, 60px);
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -1.4px;
      margin-bottom: 18px;
      color: #FFFFFF;
    }

    .hero-title span {
      color: var(--primary);
    }

    .hero-desc {
      font-size: 17px;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 820px;
      margin: 0 auto 36px auto;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-secondary {
      background: var(--surface);
      border: 1px solid var(--border);
      color: #FFF;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.18s, border-color 0.18s, color 0.18s;
    }

    .btn-secondary:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: #000000;
    }

    /* Metrics Grid */
    .metrics-section {
      margin-bottom: 60px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    @media (max-width: 1100px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }

    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      transition: background 0.18s ease, border-color 0.18s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: default;
    }

    .metric-card, .metric-card * {
      transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;
    }

    .metric-card:hover {
      background: var(--primary);
      border-color: var(--primary);
    }

    .metric-card:hover .metric-label,
    .metric-card:hover .metric-value,
    .metric-card:hover .metric-value span,
    .metric-card:hover .metric-sub,
    .metric-card:hover .metric-sub span {
      color: #000000 !important;
    }

    .metric-header {
      margin-bottom: 14px;
    }

    .metric-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-family: var(--font-mono);
    }

    .metric-value {
      font-size: 22px;
      font-weight: 800;
      color: #FFF;
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-family: var(--font-mono);
    }

    .metric-sub {
      font-size: 12px;
      color: var(--text-stone);
      margin-top: 8px;
      font-family: var(--font-mono);
    }

    /* API Endpoints & Interactive Playground */
    #endpoints,
    #architecture {
      scroll-margin-top: 16px;
    }

    .section-header {
      margin-bottom: 22px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.4px;
      margin-bottom: 6px;
      color: #FFF;
    }

    .section-subtitle {
      font-size: 14px;
      color: var(--text-muted);
    }

    .api-layout {
      display: grid;
      grid-template-columns: 1.25fr 0.95fr;
      gap: 24px;
      margin-bottom: 64px;
    }

    @media (max-width: 1080px) {
      .api-layout {
        grid-template-columns: 1fr;
      }
    }

    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .endpoint-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: background 0.18s ease, border-color 0.18s ease;
    }

    .endpoint-card, .endpoint-card * {
      transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;
    }

    .endpoint-card:hover {
      background: var(--primary);
      border-color: var(--primary);
    }

    .endpoint-card:hover .endpoint-path,
    .endpoint-card:hover .endpoint-desc {
      color: #000000 !important;
    }

    .endpoint-card:hover .badge-method {
      background: #000000;
      color: var(--primary);
      border-color: #000000;
    }

    .endpoint-card:hover .btn-test {
      border-color: #000000;
      color: #000000;
    }

    .endpoint-card:hover .btn-test:hover {
      background: #000000;
      color: var(--primary);
    }

    .endpoint-card:hover .btn-copy-curl {
      border-color: rgba(0, 0, 0, 0.4);
      color: #000000;
    }

    .endpoint-card:hover .btn-copy-curl:hover {
      background: #000000;
      color: #FFF;
      border-color: #000000;
    }

    .endpoint-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .endpoint-uri-group {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-mono);
      font-size: 13px;
    }

    .badge-method {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .method-get {
      background: rgba(206, 255, 0, 0.1);
      color: var(--primary);
      border: 1px solid rgba(206, 255, 0, 0.3);
    }

    .method-post {
      background: rgba(56, 189, 248, 0.1);
      color: var(--cyan);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .endpoint-path {
      color: #FFF;
      font-weight: 600;
      word-break: break-all;
    }

    .endpoint-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-test {
      background: transparent;
      border: 1px solid rgba(206, 255, 0, 0.3);
      color: var(--primary);
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: var(--font-mono);
      transition: background 0.15s, color 0.15s;
    }

    .btn-test:hover {
      background: var(--primary);
      color: #000;
    }

    .btn-copy-curl {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-mono);
      transition: color 0.15s, border-color 0.15s;
    }

    .btn-copy-curl:hover {
      color: #FFF;
      border-color: var(--border-hover);
    }

    .endpoint-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Console Inspector */
    .console-box {
      background: #040605;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 24px;
      height: fit-content;
      max-height: calc(100vh - 48px);
    }

    .console-header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .console-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-stone);
      font-family: var(--font-mono);
    }

    .console-status-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }

    .status-ok {
      background: rgba(206, 255, 0, 0.1);
      color: var(--primary);
      border: 1px solid rgba(206, 255, 0, 0.3);
    }

    .console-body {
      padding: 16px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 12px;
      color: #D1D5DB;
      background: #040605;
      max-height: 440px;
      scrollbar-width: thin;
      scrollbar-color: #0E2A1B #040605;
    }

    .console-body::-webkit-scrollbar {
      width: 7px;
      height: 7px;
    }

    .console-body::-webkit-scrollbar-track {
      background: #040605;
    }

    .console-body::-webkit-scrollbar-thumb {
      background: #0E2A1B;
      border: 1px solid #1E4D30;
      border-radius: 4px;
    }

    .console-body::-webkit-scrollbar-thumb:hover {
      background: #CEFF00 !important;
      border-color: #CEFF00 !important;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-all;
    }

    .json-key { color: #93C5FD; }
    .json-string { color: #86EFAC; }
    .json-number { color: #FDE047; }
    .json-bool { color: #F472B6; }

    .console-footer {
      padding: 8px 16px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    /* Architecture Section */
    .arch-section {
      margin-bottom: 60px;
    }

    .arch-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 1100px) {
      .arch-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .arch-grid {
        grid-template-columns: 1fr;
      }
    }

    .arch-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      transition: background 0.18s ease, border-color 0.18s ease;
      cursor: default;
    }

    .arch-card, .arch-card * {
      transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;
    }

    .arch-card:hover {
      background: var(--primary);
      border-color: var(--primary);
    }

    .arch-card:hover .arch-index,
    .arch-card:hover .arch-title,
    .arch-card:hover .arch-text {
      color: #000000 !important;
    }

    .arch-card:hover .arch-text code {
      color: #000000 !important;
      background: rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(0, 0, 0, 0.25);
    }

    .arch-index {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 6px;
      letter-spacing: 0.8px;
    }

    .arch-title {
      font-size: 15px;
      font-weight: 700;
      color: #FFF;
      margin-bottom: 6px;
    }

    .arch-text {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border);
      padding-top: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      color: var(--text-muted);
    }

    .footer-links {
      display: flex;
      gap: 20px;
    }

    .footer-link {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
    }

    .footer-link:hover {
      color: var(--primary);
    }

    /* Toast notification */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--surface);
      color: #FFF;
      border: 1px solid var(--border-hover);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-mono);
      transform: translateY(80px);
      opacity: 0;
      transition: all 0.2s ease;
      z-index: 1000;
    }

    #toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>

  <div class="container">
    <!-- Top Navigation -->
    <header>
      <a href="/" class="brand">
        <div class="brand-mark">
          <img src="/assets/logo.png" alt="Zemo" />
        </div>
        <span class="brand-slash">/</span>
        <span class="brand-label">api-gateway</span>
        <span class="brand-version">v${version}</span>
      </a>

      <div class="nav-links">
        <a href="#endpoints" class="btn-nav">Endpoints</a>
        <a href="#architecture" class="btn-nav">Architecture</a>
        <a href="https://github.com/imMohammedSahil/Zemo" target="_blank" rel="noopener noreferrer" class="btn-nav">
          GitHub
        </a>
        <a href="https://zemo-official.vercel.app" target="_blank" rel="noopener noreferrer" class="btn-primary">
          Launch App
        </a>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="status-pill">
        STATUS: OPERATIONAL • PRODUCTION RENDER CLUSTER
      </div>

      <h1 class="hero-title">
        Autonomous E-Commerce<br />
        <span>Price Intelligence & Arbitrage API</span>
      </h1>

      <p class="hero-desc">
        High-throughput asynchronous REST gateway powering multi-store automated scraping, longitudinal price trajectory modeling, and cognitive LLM aspect distillation.
      </p>

      <div class="hero-actions">
        <a href="https://zemo-official.vercel.app" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 10px 22px; font-size: 13px;">
          Open Web Application
        </a>
        <button onclick="runHeroDiagnostics(this)" class="btn-secondary" style="padding: 10px 20px; font-size: 13px;">
          Run Diagnostics
        </button>
      </div>
    </section>

    <!-- Realtime System Metrics -->
    <section class="metrics-section">
      <div class="kicker">
        SYSTEM TELEMETRY
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Gateway Latency</span>
          </div>
          <div class="metric-value" id="ping-display">
            <span id="ping-ms">--</span> <span style="font-size: 13px; font-weight: 500; color: var(--text-muted);">ms</span>
          </div>
          <div class="metric-sub">
            <span style="color: var(--primary); font-weight: 700;">200 OK</span> • Express 5.x
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Persistence Tier</span>
          </div>
          <div class="metric-value" style="font-size: 19px;">
            ${dbConnected ? 'CONNECTED' : 'STANDBY'}
          </div>
          <div class="metric-sub">
            MongoDB Atlas Production
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Cognitive AI</span>
          </div>
          <div class="metric-value" style="font-size: 18px;">
            GEMINI + LLAMA
          </div>
          <div class="metric-sub">
            Dual-LLM Arbitrage Pipeline
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Daemon Scheduler</span>
          </div>
          <div class="metric-value" style="font-size: 19px;">
            15-MIN CRON
          </div>
          <div class="metric-sub">
            Mutex Reentrant Protected
          </div>
        </div>
      </div>
    </section>

    <!-- API Endpoints & Interactive Console Section -->
    <section id="endpoints">
      <div class="section-header">
        <div class="kicker">
          API SPECIFICATION
        </div>
        <h2 class="section-title">
          REST Endpoints & Interactive Playground
        </h2>
        <p class="section-subtitle">
          Execute real HTTP requests directly against this server instance or copy reproducible cURL snippets.
        </p>
      </div>

      <div class="api-layout">
        <!-- Endpoint Directory -->
        <div class="endpoint-list">

          <!-- GET /health -->
          <div class="endpoint-card">
            <div class="endpoint-main">
              <div class="endpoint-uri-group">
                <span class="badge-method method-get">GET</span>
                <span class="endpoint-path">/health</span>
              </div>
              <div class="endpoint-actions">
                <button class="btn-test" onclick="testEndpoint('/health', 'GET', this)">
                  Test
                </button>
                <button class="btn-copy-curl" onclick="copyCurl('/health', 'GET')">
                  cURL
                </button>
              </div>
            </div>
            <p class="endpoint-desc">
              Returns real-time gateway heartbeat, database connectivity, runtime uptime, and subsystem status.
            </p>
          </div>

          <!-- GET /product -->
          <div class="endpoint-card">
            <div class="endpoint-main">
              <div class="endpoint-uri-group">
                <span class="badge-method method-get">GET</span>
                <span class="endpoint-path">/product</span>
              </div>
              <div class="endpoint-actions">
                <button class="btn-test" onclick="testEndpoint('/product', 'GET', this)">
                  Test
                </button>
                <button class="btn-copy-curl" onclick="copyCurl('/product', 'GET')">
                  cURL
                </button>
              </div>
            </div>
            <p class="endpoint-desc">
              Fetches all tracked products in the catalog along with current prices, historic lows, and Deal Grab scores.
            </p>
          </div>

          <!-- GET /product/compare-stores/:id -->
          <div class="endpoint-card">
            <div class="endpoint-main">
              <div class="endpoint-uri-group">
                <span class="badge-method method-get">GET</span>
                <span class="endpoint-path">/product/compare-stores/:id</span>
              </div>
              <div class="endpoint-actions">
                <button class="btn-test" onclick="testDemoStoreComparison(this)">
                  Demo Product
                </button>
                <button class="btn-copy-curl" onclick="copyCurl('/product/compare-stores/6ad71e366b2c6422ae682ab4', 'GET')">
                  cURL
                </button>
              </div>
            </div>
            <p class="endpoint-desc">
              Executes Gemini cross-store arbitrage comparison between Amazon India and Flipkart with cached fallback.
            </p>
          </div>

          <!-- GET /product/reviews/:id -->
          <div class="endpoint-card">
            <div class="endpoint-main">
              <div class="endpoint-uri-group">
                <span class="badge-method method-get">GET</span>
                <span class="endpoint-path">/product/reviews/:id</span>
              </div>
              <div class="endpoint-actions">
                <button class="btn-test" onclick="testDemoReviews(this)">
                  Demo Product
                </button>
                <button class="btn-copy-curl" onclick="copyCurl('/product/reviews/6ad71e366b2c6422ae682ab4', 'GET')">
                  cURL
                </button>
              </div>
            </div>
            <p class="endpoint-desc">
              Aspect-based consumer sentiment mining extracting pros, cons, and customer purchase telemetry.
            </p>
          </div>

          <!-- GET /product/offers/:id -->
          <div class="endpoint-card">
            <div class="endpoint-main">
              <div class="endpoint-uri-group">
                <span class="badge-method method-get">GET</span>
                <span class="endpoint-path">/product/offers/:id</span>
              </div>
              <div class="endpoint-actions">
                <button class="btn-test" onclick="testDemoOffers(this)">
                  Demo Product
                </button>
                <button class="btn-copy-curl" onclick="copyCurl('/product/offers/6ad71e366b2c6422ae682ab4', 'GET')">
                  cURL
                </button>
              </div>
            </div>
            <p class="endpoint-desc">
              Cognitive bank and credit card discount deduction engine calculating optimal payment routes.
            </p>
          </div>

          <!-- GET /product/grab-meter/:id -->
          <div class="endpoint-card">
            <div class="endpoint-main">
              <div class="endpoint-uri-group">
                <span class="badge-method method-get">GET</span>
                <span class="endpoint-path">/product/grab-meter/:id</span>
              </div>
              <div class="endpoint-actions">
                <button class="btn-test" onclick="testDemoGrabMeter(this)">
                  Demo Product
                </button>
                <button class="btn-copy-curl" onclick="copyCurl('/product/grab-meter/6ad71e366b2c6422ae682ab4', 'GET')">
                  cURL
                </button>
              </div>
            </div>
            <p class="endpoint-desc">
              Algorithmic 0–100 Deal Grab Meter score weighing historic lows, price drops, and rating velocity.
            </p>
          </div>

          <!-- POST /product/add -->
          <div class="endpoint-card">
            <div class="endpoint-main">
              <div class="endpoint-uri-group">
                <span class="badge-method method-post">POST</span>
                <span class="endpoint-path">/product/add</span>
              </div>
              <div class="endpoint-actions">
                <button class="btn-copy-curl" onclick="copyAddProductCurl()">
                  cURL
                </button>
              </div>
            </div>
            <p class="endpoint-desc">
              Ingests an Amazon or Flipkart URL, extracts metadata via Playwright Chromium, and initializes price surveillance.
            </p>
          </div>

        </div>

        <!-- Live Response Inspector -->
        <div class="console-box">
          <div class="console-header">
            <div class="console-title">
              Live Response Inspector
            </div>
            <div id="console-status-badge" class="console-status-pill status-ok">
              200 OK • 0ms
            </div>
          </div>

          <div class="console-body" id="console-body">
            <pre><code id="console-code">// Fetching initial gateway health telemetry...</code></pre>
          </div>

          <div class="console-footer">
            <span id="console-timestamp">Requested: Initializing</span>
            <button class="btn-copy-curl" onclick="copyResponseJson()" style="font-size: 11px; padding: 3px 6px;">
              Copy JSON
            </button>
          </div>
        </div>

      </div>
    </section>

    <!-- Architecture Overview -->
    <section id="architecture" class="arch-section">
      <div class="section-header">
        <div class="kicker">
          SYSTEM ARCHITECTURE
        </div>
        <h2 class="section-title">
          Subsystems & Engineering Specifications
        </h2>
        <p class="section-subtitle">
          Engineered for distributed reliability, headless browser resiliency, and zero-delay recruiter demos.
        </p>
      </div>

      <div class="arch-grid">
        <div class="arch-card">
          <div class="arch-index">SUBSYSTEM 01</div>
          <div class="arch-title">Headless Browser Cluster</div>
          <p class="arch-text">
            Playwright 1.58 running bundled Chromium inside production container. Handles dynamic DOM cascades, anti-bot bypass, and network XHR interception.
          </p>
        </div>

        <div class="arch-card">
          <div class="arch-index">SUBSYSTEM 02</div>
          <div class="arch-title">Dual-Model Cognitive Tier</div>
          <p class="arch-text">
            Google Gemini 2.5 Flash for multi-store price comparisons and credit card discount trees, combined with Meta-Llama-3-8B for aspect-based sentiment distillation.
          </p>
        </div>

        <div class="arch-card">
          <div class="arch-index">SUBSYSTEM 03</div>
          <div class="arch-title">Deterministic Zero-Delay Cache</div>
          <p class="arch-text">
            High-throughput local JSON store in <code style="color: var(--primary);">/.zemo_cache</code> ensuring instant, zero-latency inference for demo products without burning API tokens.
          </p>
        </div>

        <div class="arch-card">
          <div class="arch-index">SUBSYSTEM 04</div>
          <div class="arch-title">Mutex-Guarded Cron Engine</div>
          <p class="arch-text">
            Node-Cron daemon running on 15-minute cycles with re-entrant mutex guards to prevent parallel execution overlaps during heavy scraping runs.
          </p>
        </div>

        <div class="arch-card">
          <div class="arch-index">SUBSYSTEM 05</div>
          <div class="arch-title">Transactional SMTP Alerting</div>
          <p class="arch-text">
            Nodemailer engine delivering multipart HTML alert emails with embedded inline CID assets whenever target price thresholds are broken.
          </p>
        </div>

        <div class="arch-card">
          <div class="arch-index">SUBSYSTEM 06</div>
          <div class="arch-title">Reactive Client Application</div>
          <p class="arch-text">
            React 19 SPA built with Vite 7 and Tailwind CSS, featuring procedural rainy glass WebGL canvas shaders and fluid Lenis audio engine.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer>
      <div>
        <strong>Zemo Price Intelligence Platform</strong> • Distributed Autonomous Arbitrage Engine
      </div>
      <div class="footer-links">
        <a href="https://zemo-official.vercel.app" target="_blank" rel="noopener noreferrer" class="footer-link">
          Frontend App
        </a>
        <a href="/health" target="_blank" class="footer-link">
          Health API
        </a>
        <a href="https://github.com/imMohammedSahil/Zemo" target="_blank" rel="noopener noreferrer" class="footer-link">
          GitHub Repository
        </a>
      </div>
    </footer>
  </div>

  <div id="toast">Copied to clipboard</div>

  <script>
    let latestJsonResponse = "";
    let activeAbortController = null;
    let isRequestInProgress = false;

    function showToast(message) {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function syntaxHighlight(json) {
      if (typeof json !== 'string') {
        json = JSON.stringify(json, undefined, 2);
      }
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (/null/.test(match)) {
          cls = 'json-bool';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      });
    }

    async function testEndpoint(endpoint, method = 'GET', triggerBtn = null) {
      // Cooldown prevention: prevent spamming if request is currently running
      if (isRequestInProgress && !triggerBtn) {
        return;
      }

      // If user clicked a button, enforce 1.5s cooldown UI state
      if (triggerBtn) {
        const prevText = triggerBtn.textContent;
        triggerBtn.disabled = true;
        triggerBtn.style.opacity = '0.5';
        triggerBtn.style.pointerEvents = 'none';
        triggerBtn.textContent = 'Testing...';

        setTimeout(() => {
          triggerBtn.disabled = false;
          triggerBtn.style.opacity = '1';
          triggerBtn.style.pointerEvents = 'auto';
          triggerBtn.textContent = prevText;
        }, 1500);
      }

      // In-flight request cancellation: abort previous request if still running
      if (activeAbortController) {
        activeAbortController.abort();
      }
      activeAbortController = new AbortController();
      isRequestInProgress = true;

      const consoleCode = document.getElementById("console-code");
      const statusBadge = document.getElementById("console-status-badge");
      const timestamp = document.getElementById("console-timestamp");

      consoleCode.innerHTML = '// Executing ' + method + ' ' + endpoint + ' ...';
      statusBadge.className = 'console-status-pill';
      statusBadge.textContent = 'FETCHING...';
      statusBadge.style.background = 'rgba(255,255,255,0.06)';
      statusBadge.style.color = '#FFF';

      const t0 = performance.now();
      try {
        const response = await fetch(endpoint, {
          method: method,
          headers: { 'Accept': 'application/json' },
          signal: activeAbortController.signal
        });
        const duration = Math.round(performance.now() - t0);
        const data = await response.json();
        latestJsonResponse = JSON.stringify(data, null, 2);

        consoleCode.innerHTML = syntaxHighlight(data);
        statusBadge.textContent = response.status + ' ' + response.statusText + ' • ' + duration + 'ms';
        if (response.ok) {
          statusBadge.className = 'console-status-pill status-ok';
          if (triggerBtn) showToast(endpoint + ' executed • ' + response.status + ' OK');
        } else {
          statusBadge.style.background = 'rgba(239, 68, 68, 0.15)';
          statusBadge.style.color = '#F87171';
        }
        timestamp.textContent = 'Requested: ' + new Date().toLocaleTimeString();

        // Update top ping badge if health was requested
        if (endpoint === '/health') {
          const pingEl = document.getElementById('ping-ms');
          if (pingEl) pingEl.textContent = duration;
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return; // Quietly ignore cancelled in-flight requests
        }
        consoleCode.innerHTML = '// Request failed: ' + err.message;
        statusBadge.textContent = 'NETWORK ERROR';
        statusBadge.style.background = 'rgba(239, 68, 68, 0.15)';
        statusBadge.style.color = '#F87171';
      } finally {
        isRequestInProgress = false;
      }
    }

    async function testDemoStoreComparison(btn) {
      try {
        const res = await fetch('/product');
        const products = await res.json();
        const id = products && products.length > 0 ? products[0]._id : '6ad71e366b2c6422ae682ab4';
        testEndpoint('/product/compare-stores/' + id, 'GET', btn);
      } catch (e) {
        testEndpoint('/product/compare-stores/6ad71e366b2c6422ae682ab4', 'GET', btn);
      }
    }

    async function testDemoReviews(btn) {
      try {
        const res = await fetch('/product');
        const products = await res.json();
        const id = products && products.length > 0 ? products[0]._id : '6ad71e366b2c6422ae682ab4';
        testEndpoint('/product/reviews/' + id, 'GET', btn);
      } catch (e) {
        testEndpoint('/product/reviews/6ad71e366b2c6422ae682ab4', 'GET', btn);
      }
    }

    async function testDemoOffers(btn) {
      try {
        const res = await fetch('/product');
        const products = await res.json();
        const id = products && products.length > 0 ? products[0]._id : '6ad71e366b2c6422ae682ab4';
        testEndpoint('/product/offers/' + id, 'GET', btn);
      } catch (e) {
        testEndpoint('/product/offers/6ad71e366b2c6422ae682ab4', 'GET', btn);
      }
    }

    async function testDemoGrabMeter(btn) {
      try {
        const res = await fetch('/product');
        const products = await res.json();
        const id = products && products.length > 0 ? products[0]._id : '6ad71e366b2c6422ae682ab4';
        testEndpoint('/product/grab-meter/' + id, 'GET', btn);
      } catch (e) {
        testEndpoint('/product/grab-meter/6ad71e366b2c6422ae682ab4', 'GET', btn);
      }
    }

    function copyCurl(endpoint, method) {
      const fullUrl = window.location.origin + endpoint;
      const cmd = 'curl -X ' + method + ' "' + fullUrl + '" -H "Accept: application/json"';
      navigator.clipboard.writeText(cmd);
      showToast("cURL command copied");
    }

    function copyAddProductCurl() {
      const fullUrl = window.location.origin + '/product/add';
      const q = String.fromCharCode(39);
      const cmd = 'curl -X POST "' + fullUrl + '" -H "Content-Type: application/json" -d ' + q + '{"productUrl":"https://www.amazon.in/dp/B0DG26ZJNP"}' + q;
      navigator.clipboard.writeText(cmd);
      showToast("POST /product/add cURL copied");
    }

    function copyResponseJson() {
      if (!latestJsonResponse) {
        showToast("No JSON response to copy yet");
        return;
      }
      navigator.clipboard.writeText(latestJsonResponse);
      showToast("JSON payload copied");
    }

    function runHeroDiagnostics(btn) {
      testEndpoint('/health', 'GET', btn);
      showToast('Running health diagnostics...');
      const targetEl = document.querySelector('#endpoints');
      if (targetEl) {
        const headerOffset = 16;
        const y = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }

    // Ensure refresh maintains exact scroll position without hash-jumping
    if (window.location.hash) {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    }

    // Measure live latency on load and pause background ping when tab is inactive
    window.addEventListener('DOMContentLoaded', () => {
      // Deterministic smooth scroll with 16px offset without polluting the URL with #hash
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
          const targetId = this.getAttribute('href');
          if (targetId && targetId.length > 1) {
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
              e.preventDefault();
              const headerOffset = 16;
              const y = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
              window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
          }
        });
      });

      testEndpoint('/health', 'GET');

      // Smart ping: only fires when tab is active in foreground
      setInterval(() => {
        if (document.hidden) return; // Completely idle when tab is minimized or hidden

        const t0 = performance.now();
        fetch('/health', { headers: { 'Accept': 'application/json' } })
          .then(res => {
            if (res.ok) {
              const ms = Math.round(performance.now() - t0);
              const pingEl = document.getElementById('ping-ms');
              if (pingEl) pingEl.textContent = ms;
            }
          })
          .catch(() => {});
      }, 20000);
    });
  </script>
</body>
</html>`;
}

module.exports = { renderLandingPage };
