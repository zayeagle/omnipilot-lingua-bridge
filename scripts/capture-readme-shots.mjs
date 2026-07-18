/**
 * Capture README screenshots from built extension UI (or source CSS fallback).
 * Usage: node scripts/capture-readme-shots.mjs
 */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'docs', 'images');
const chromeOut = join(root, '.output', 'chrome-mv3');
const staticRoot = existsSync(join(chromeOut, 'popup.html'))
  ? chromeOut
  : join(root, 'entrypoints');

mkdirSync(outDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

function startServer(dir) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = (req.url || '/').split('?')[0];
      let path = url === '/' ? '/popup.html' : url;
      // Demo pages served from memory
      if (path === '/demo-popup.html') {
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(demoPopupHtml());
        return;
      }
      if (path === '/demo-options.html') {
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(demoOptionsHtml());
        return;
      }
      if (path === '/demo-caption.html') {
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(demoCaptionHtml());
        return;
      }
      if (path === '/demo-bubble.html') {
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(demoBubbleHtml());
        return;
      }
      const file = join(dir, path.replace(/^\//, ''));
      if (!existsSync(file)) {
        // fall back to public icons / entrypoints styles
        const alt =
          path.startsWith('/icon')
            ? join(root, 'public', path.replace(/^\//, ''))
            : path.endsWith('.css')
              ? join(
                  root,
                  'entrypoints',
                  path.includes('options') ? 'options' : 'popup',
                  'style.css',
                )
              : null;
        if (alt && existsSync(alt)) {
          const buf = readFileSync(alt);
          res.writeHead(200, {
            'Content-Type': MIME[extname(alt)] || 'application/octet-stream',
          });
          res.end(buf);
          return;
        }
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const buf = readFileSync(file);
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      });
      res.end(buf);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

function demoPopupHtml() {
  const css = readFileSync(join(root, 'entrypoints/popup/style.css'), 'utf8');
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Lingua Bridge</title>
<style>${css}</style></head>
<body>
<main class="panel">
  <header class="head">
    <img class="logo" src="/icon-32.png" width="28" height="28" alt=""/>
    <div>
      <h1>Lingua Bridge</h1>
      <p class="sub">Chinese↔English only · selection bubble · video SI</p>
    </div>
  </header>
  <label class="switch-row">
    <span>
      <strong>Master switch</strong>
      <small>When on, selecting text shows the bubble (ZH↔EN)</small>
    </span>
    <input type="checkbox" class="switch" checked/>
  </label>
  <section class="status-card foldable" aria-labelledby="liveTitle">
    <button type="button" class="fold-toggle" aria-expanded="true">
      <h2 id="liveTitle" class="modes-title">Live status</h2>
      <span class="fold-chevron" aria-hidden="true">▾</span>
    </button>
    <div class="fold-body">
      <dl class="live">
        <div><dt>Master switch</dt><dd>On</dd></div>
        <div><dt>Direction</dt><dd>Chinese ↔ English</dd></div>
        <div><dt>Provider</dt><dd>iFlytek · key set</dd></div>
        <div><dt>Capability</dt><dd>SI (integrated)</dd></div>
        <div><dt>SI style</dt><dd>Voice</dd></div>
        <div><dt>Video SI on this page</dt><dd class="on">On (this page)</dd></div>
        <div><dt>Video on this page</dt><dd>Detected</dd></div>
      </dl>
    </div>
  </section>
  <section class="modes foldable">
    <div class="modes-head">
      <h2 class="modes-title">SI output</h2>
      <div class="modes-head-actions">
        <button type="button" class="si-btn active">Stop SI</button>
        <button type="button" class="fold-toggle fold-toggle-icon" aria-expanded="true">
          <span class="fold-chevron" aria-hidden="true">▾</span>
        </button>
      </div>
    </div>
    <div class="fold-body">
      <p class="modes-desc">Chinese↔English only. Pick a style, then start video SI on this page.</p>
      <label class="mode">
        <input type="radio" name="speechMode" value="caption"/>
        <span>
          <strong>Silent captions</strong>
          <small>Overlay bilingual captions during SI (draggable / history)</small>
        </span>
      </label>
      <label class="mode">
        <input type="radio" name="speechMode" value="voice" checked/>
        <span>
          <strong>Voice interpretation</strong>
          <small>Read the translation aloud during SI (captions still shown)</small>
        </span>
      </label>
    </div>
  </section>
  <p class="status ok" role="status">On · iFlytek · SI (integrated) · Voice · SI on · Video detected</p>
  <a class="link" href="#">Open settings</a>
</main>
</body></html>`;
}

function demoOptionsHtml() {
  const css = readFileSync(join(root, 'entrypoints/options/style.css'), 'utf8');
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Lingua Bridge Settings</title>
<style>${css}
body{max-width:720px;margin:0 auto}
</style></head>
<body>
<main class="wrap">
  <header class="hero">
    <div class="brand">
      <img class="logo" src="/icon-48.png" width="40" height="40" alt=""/>
      <div>
        <h1>Lingua Bridge</h1>
        <p class="tagline">Scope: Chinese↔English only · works without a key · optional API key</p>
      </div>
    </div>
  </header>
  <form class="card">
    <section class="section">
      <h2>Provider</h2>
      <p class="section-desc">Pick a vendor preset or a custom OpenAI-compatible gateway.</p>
      <div class="provider-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${['OpenAI', 'DeepSeek', 'iFlytek', 'OpenRouter', 'Anthropic', 'Custom']
          .map(
            (n, i) =>
              `<label style="border:1px solid ${i === 2 ? '#0ea5e9' : 'rgba(14,165,233,.2)'};border-radius:12px;padding:12px;background:${i === 2 ? 'rgba(14,165,233,.08)' : '#fff'};text-align:center;font-weight:600">${n}</label>`,
          )
          .join('')}
      </div>
    </section>
    <section class="section">
      <h2>Credentials (optional)</h2>
      <p class="section-desc">Key is optional. Without it, free translation works; with a key you get full AI / video SI.</p>
      <div class="field">
        <label>APPID / APIKey / APISecret</label>
        <p class="field-desc">Stored locally. Enable vault hardening to encrypt at rest.</p>
        <input type="password" value="••••••••••••" readonly style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(14,165,233,.25)"/>
      </div>
    </section>
    <section class="section">
      <h2>Security hardening</h2>
      <p class="section-desc">Optional PBKDF2 + AES-GCM vault. Unlock for the browser session only.</p>
      <label class="check" style="display:flex;gap:8px;align-items:flex-start">
        <input type="checkbox" checked/>
        <span>Encrypt API secrets on this device</span>
      </label>
    </section>
  </form>
</main>
</body></html>`;
}

function demoCaptionHtml() {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SI captions</title>
<style>
html,body{margin:0;height:100%;font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
.stage{
  min-height:420px;position:relative;overflow:hidden;
  background:
    linear-gradient(180deg,rgba(2,6,23,.55),rgba(2,6,23,.75)),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%230f172a' width='80' height='80'/%3E%3Cpath d='M0 40h80M40 0v80' stroke='%231e293b' stroke-width='1'/%3E%3C/svg%3E");
  background-size:cover,80px 80px;
}
.video-fake{
  position:absolute;inset:40px 48px 120px;border-radius:16px;
  background:linear-gradient(135deg,#1e293b,#0f172a 55%,#134e4a);
  box-shadow:0 20px 60px rgba(0,0,0,.45);
  display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:15px;
}
.video-fake::before{
  content:"";width:64px;height:64px;border-radius:50%;
  background:rgba(14,165,233,.25);border:2px solid rgba(56,189,248,.5);
  box-shadow:inset 0 0 0 12px transparent;
  clip-path:polygon(35% 25%, 80% 50%, 35% 75%);
  background:rgba(56,189,248,.85);
}
#lingua-bridge-caption-root{
  position:absolute;left:50%;bottom:36px;transform:translateX(-50%);
  z-index:10;width:min(520px,92%);border-radius:14px;
  background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(2,6,23,.92));
  color:#f2f6fa;box-shadow:0 12px 40px rgba(0,0,0,.45),0 0 0 1px rgba(56,189,248,.18);
  overflow:hidden;display:flex;flex-direction:column;
}
.hdr{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:default;
  border-bottom:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.5)}
.hdr strong{flex:1;font:600 13px/1.2 "Segoe UI","PingFang SC",sans-serif}
.hdr button{border:0;background:rgba(255,255,255,.12);color:#e2e8f0;border-radius:8px;
  width:28px;height:28px;cursor:default;font-size:14px}
.body{padding:12px 14px 14px;text-align:left}
.src{font:400 13px/1.45 "Segoe UI",sans-serif;color:#94a3b8;margin-bottom:6px}
.dst{font:550 15px/1.45 "Segoe UI","PingFang SC",sans-serif;color:#f1f5f9}
.badge{position:absolute;top:18px;left:24px;padding:6px 10px;border-radius:999px;
  background:rgba(15,23,42,.7);color:#e2e8f0;font-size:12px;border:1px solid rgba(56,189,248,.3)}
</style></head>
<body>
<div class="stage">
  <div class="badge">Lingua Bridge · Video SI</div>
  <div class="video-fake"></div>
  <div id="lingua-bridge-caption-root">
    <div class="hdr">
      <strong>同传字幕</strong>
      <button type="button" title="History">史</button>
      <button type="button" title="Fold">–</button>
      <button type="button" title="Close">×</button>
    </div>
    <div class="body">
      <div class="src">In this talk, we'll show you why we stop to be.</div>
      <div class="dst">在这个演讲中，我们将向你展示我们为什么要停止。</div>
    </div>
  </div>
</div>
</body></html>`;
}

function demoBubbleHtml() {
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Selection bubble</title>
<style>
html,body{margin:0;height:100%;font-family:"Segoe UI","PingFang SC",sans-serif}
.page{min-height:360px;padding:48px 56px;background:linear-gradient(180deg,#f8fafc,#e2e8f0);
  color:#0f172a;position:relative}
.article{max-width:560px;line-height:1.7;font-size:16px}
mark{background:rgba(14,165,233,.25);border-radius:4px;padding:0 2px}
.bubble{
  position:absolute;left:220px;top:150px;width:300px;border-radius:14px;
  background:#fff;box-shadow:0 16px 40px rgba(15,23,42,.18),0 0 0 1px rgba(14,165,233,.2);
  overflow:hidden;
}
.bh{display:flex;align-items:center;gap:8px;padding:10px 12px;background:linear-gradient(135deg,#0ea5e9,#14b8a6);color:#fff}
.bh img{width:20px;height:20px;border-radius:4px;background:#fff}
.bh strong{flex:1;font-size:13px}
.bb{padding:12px 14px}
.bb .src{font-size:12px;color:#64748b;margin-bottom:6px}
.bb .dst{font-size:15px;font-weight:600;color:#0f172a;margin-bottom:10px}
.actions{display:flex;gap:8px}
.actions button{flex:1;border:0;border-radius:10px;padding:8px 10px;font-weight:600;cursor:default}
.actions .p{background:linear-gradient(135deg,#0ea5e9,#14b8a6);color:#fff}
.actions .s{background:#f1f5f9;color:#0f172a}
.note{margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:12px;color:#475569}
</style></head>
<body>
<div class="page">
  <div class="article">
    <p>Modern teams ship faster when language is not a blocker.
    <mark>Simultaneous interpretation</mark> keeps everyone aligned in real time.</p>
  </div>
  <div class="bubble">
    <div class="bh">
      <img src="/icon-32.png" alt=""/>
      <strong>Lingua Bridge</strong>
    </div>
    <div class="bb">
      <div class="src">Simultaneous interpretation</div>
      <div class="dst">同声传译</div>
      <div class="actions">
        <button class="p" type="button">Translate</button>
        <button class="s" type="button">Full page</button>
      </div>
      <div class="note">Term · /ˌsɪmlˈteɪniəs/ · real-time spoken translation</div>
    </div>
  </div>
</div>
</body></html>`;
}

const { server, base } = await startServer(staticRoot);
const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(path, file, size) {
  await page.setViewportSize(size);
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const target = join(outDir, file);
  await page.screenshot({ path: target, type: 'png' });
  console.log('wrote', target);
}

try {
  await shot('/demo-popup.html', 'popup.png', { width: 380, height: 640 });
  await shot('/demo-options.html', 'options.png', { width: 780, height: 720 });
  await shot('/demo-caption.html', 'si-caption.png', { width: 880, height: 480 });
  await shot('/demo-bubble.html', 'selection-bubble.png', { width: 720, height: 400 });
  writeFileSync(
    join(outDir, 'README.md'),
    'Screenshots generated by `node scripts/capture-readme-shots.mjs`.\n',
  );
} finally {
  await browser.close();
  server.close();
}
