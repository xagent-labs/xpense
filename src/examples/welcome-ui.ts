import { createServer } from "node:http";

const PORT = Number(process.env.XPENSE_WELCOME_PORT ?? 4700);

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>xpense — give your agent a wallet, on a leash</title>
<meta name="description" content="xpense is a TypeScript SDK that lets AI agents pay for capabilities: emit a structured Payment Intent, enforce spend policy, settle on X Layer. No keys passed to the model." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;680;700&family=Newsreader:ital,wght@1,500;1,600&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #fafafa; --surface: #ffffff; --subtle: #f6f6f6;
    --border: #ededed; --border-input: #e3e3e3;
    --ink: #161616; --muted: #6f6f6f; --faint: #a3a3a3;
    --accent: #161616; --accent-hover: #000000;
    --hero-size: clamp(46px, 7vw, 88px);
    --hero-tracking: -0.045em;
  }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg); color: var(--ink);
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
  .wordmark { font-family: "Newsreader", "Times New Roman", serif; font-style: italic; font-weight: 600; font-size: 21px; letter-spacing: -0.02em; }
  header {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 56px; border-bottom: 1px solid transparent;
    background: rgba(250, 250, 250, 0.8); backdrop-filter: saturate(180%) blur(8px);
  }
  header.scrolled { border-bottom-color: var(--border); }
  .nav-left { display: flex; align-items: center; gap: 11px; }
  .logo { width: 28px; height: 28px; border-radius: 8px; background: var(--ink); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 15px; letter-spacing: -0.02em; }
  nav { display: flex; align-items: center; gap: 26px; font-size: 14px; }
  nav a { color: var(--muted); text-decoration: none; transition: color 0.15s; }
  nav a:hover { color: var(--ink); }
  nav a.cta { color: #fff; background: var(--accent); padding: 8px 15px; border-radius: 8px; font-weight: 550; box-shadow: 0 1px 2px rgba(0,0,0,.18); }
  nav a.cta:hover { background: var(--accent-hover); }

  .hero { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 64px; align-items: center; padding: 130px 56px 96px; }
  .hero h1 { font-size: var(--hero-size); font-weight: 680; letter-spacing: var(--hero-tracking); line-height: 0.98; margin-bottom: 24px; }
  .hero h1 em { font-family: "Newsreader", serif; font-style: italic; font-weight: 500; }
  .lede { font-size: 19px; font-weight: 400; line-height: 1.5; color: var(--muted); max-width: 470px; letter-spacing: -0.01em; }
  .cta-row { display: flex; gap: 12px; margin-top: 36px; }
  .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 13px 22px; font-size: 14.5px; font-weight: 550; letter-spacing: -0.01em; color: #fff; background: var(--accent); border: 0; border-radius: 9px; cursor: pointer; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: background .15s, box-shadow .15s, transform .06s; }
  .btn-primary:hover { background: #000; box-shadow: 0 2px 10px rgba(0,0,0,.18); }
  .btn-primary .arrow { transition: transform .15s; }
  .btn-primary:hover .arrow { transform: translateX(3px); }
  .btn-ghost { display: inline-flex; align-items: center; padding: 13px 22px; font-size: 14.5px; font-weight: 500; color: var(--ink); background: transparent; border: 1px solid var(--border-input); border-radius: 9px; cursor: pointer; text-decoration: none; transition: border-color .15s, background .15s; }
  .btn-ghost:hover { border-color: #c8c8c8; background: #f3f3f3; }
  .powered { margin-top: 28px; font-size: 12.5px; color: var(--faint); }
  .powered a { color: var(--muted); text-decoration: underline; text-underline-offset: 2px; }

  /* right demo card */
  .demo { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.025), 0 14px 44px rgba(0,0,0,.07); overflow: hidden; }
  .demo-head { display: flex; align-items: center; gap: 7px; padding: 13px 16px; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--faint); }
  .demo-head .d { width: 9px; height: 9px; border-radius: 50%; background: #e4e4e4; }
  .demo-body { padding: 18px; }
  .drow { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; font-size: 13px; }
  .drow .k { color: var(--muted); }
  .drow .v { font-weight: 500; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .badge { display: inline-flex; align-items: center; gap: 7px; padding: 6px 13px; border-radius: 8px; font-size: 12.5px; font-weight: 550; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .badge .dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; }
  .demo-foot { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
  .demo-foot .lbl { font-size: 10.5px; font-weight: 600; color: var(--faint); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; }
  .demo-foot pre { background: var(--subtle); border: 1px solid #f0f0f0; border-radius: 8px; padding: 11px 13px; font: 11.5px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; color: #3f3f46; overflow: auto; }

  /* proof */
  .proof { max-width: 1200px; margin: 0 auto; padding: 44px 56px 104px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; border-top: 1px solid var(--border); }
  .feat .ico { width: 32px; height: 32px; border-radius: 8px; background: var(--subtle); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 15px; margin-bottom: 14px; }
  .feat h3 { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
  .feat p { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin-top: 8px; }

  footer { max-width: 1200px; margin: 0 auto; padding: 28px 56px 56px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--faint); }
  footer a { color: var(--muted); text-decoration: none; }
  footer a:hover { color: var(--ink); }
  footer .links { display: flex; gap: 22px; }

  @media (max-width: 880px) {
    header, .hero, .proof, footer { padding-left: 24px; padding-right: 24px; }
    .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 84px; padding-bottom: 64px; }
    .proof { grid-template-columns: 1fr; gap: 32px; }
    nav .hide { display: none; }
  }
</style>
</head>
<body>
<header id="hdr">
  <div class="nav-left"><div class="logo">x</div><span class="wordmark">xpense</span></div>
  <nav>
    <a class="hide" href="/docs">Docs</a>
    <a class="hide" href="http://localhost:4500">Test bench</a>
    <a class="cta" href="http://localhost:4600">Sign in</a>
  </nav>
</header>

<main class="hero">
  <div class="hero-copy">
    <h1>Pay for capabilities,<br />one <em>intent</em> at a time.</h1>
    <p class="lede">Drop payment into any agent. xpense emits a structured Payment Intent, enforces your spend policy, and settles on-chain — no keys ever passed to the model.</p>
    <div class="cta-row">
      <a class="btn-primary" href="http://localhost:4500">Open test bench <span class="arrow">→</span></a>
      <a class="btn-ghost" href="/docs">Read the docs</a>
    </div>
    <div class="powered">Powered by MPP · settles through <a href="#">xerpaai-go</a> on X Layer</div>
  </div>

  <div class="demo">
    <div class="demo-head"><span class="d"></span><span class="d"></span><span class="d"></span>&nbsp;&nbsp;agent → xpense.emit()</div>
    <div class="demo-body">
      <div class="drow"><span class="k">Amount</span><span class="v">0.25 USDC</span></div>
      <div class="drow"><span class="k">Reason</span><span class="v">Weather data API call</span></div>
      <div class="drow"><span class="k">Counterparty</span><span class="v">weatherapi.com</span></div>
      <div class="drow"><span class="k">Scheme</span><span class="v mono">x402 · exact</span></div>
      <div class="drow" style="margin-top:6px"><span class="k">Governance</span><span class="badge"><span class="dot"></span>authorized</span></div>
      <div class="demo-foot">
        <div class="lbl">settles → X Layer</div>
        <pre>POST /user/onchainos/x402/sign
{ "accepts": [{ "amount": "0.25", "currency": "USDC" }] }</pre>
      </div>
    </div>
  </div>
</main>

<section class="proof">
  <div class="feat">
    <div class="ico">◇</div>
    <h3>Emit an intent</h3>
    <p>Every spend is a typed Payment Intent — amount, reason, counterparty, scheme. Auditable by default, never a raw transaction.</p>
  </div>
  <div class="feat">
    <div class="ico">⛨</div>
    <h3>Governed spend</h3>
    <p>Per-transaction, daily and total budgets. Auto, policy or human approval. The model proposes; your policy decides.</p>
  </div>
  <div class="feat">
    <div class="ico">⇄</div>
    <h3>Settle on-chain</h3>
    <p>Voucher, stream or x402. Custodied by xerpaai-go on X Layer. Mock mode for safe local dev — nothing real moves.</p>
  </div>
</section>

<footer>
  <span class="wordmark">xpense</span>
  <div class="links">
    <a href="/docs">Docs</a>
    <a href="/guides">Guides</a>
    <a href="https://github.com/xagent-labs/xpense">GitHub</a>
  </div>
</footer>

<script>
const hdr = document.getElementById("hdr");
addEventListener("scroll", () => hdr.classList.toggle("scrolled", scrollY > 8));
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(PAGE);
});

server.listen(PORT, () => {
  process.stdout.write(`xpense welcome → http://localhost:${PORT}\n`);
});
