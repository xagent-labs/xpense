import { createServer } from "node:http";

const PORT = Number(process.env.XPENSE_ACCOUNTS_PORT ?? 4600);

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>xpense · accounts</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #ffffff; --surface: #ffffff; --subtle: #fafafa;
    --border: #ededed; --border-input: #e3e3e3;
    --ink: #161616; --muted: #6f6f6f; --faint: #a3a3a3;
    --accent: #161616; --accent-hover: #000000;
  }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg); color: var(--ink);
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
  header {
    border-bottom: 1px solid #f1f1f1; padding: 20px 56px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; background: rgba(255, 255, 255, 0.85);
    backdrop-filter: saturate(180%) blur(8px); z-index: 10;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo {
    width: 30px; height: 30px; border-radius: 8px; background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 600; font-size: 15px; letter-spacing: -0.02em;
  }
  .brand h1 { font-size: 15px; font-weight: 600; letter-spacing: -0.02em; }
  .who { display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--muted); }
  .who a { color: var(--ink); text-decoration: none; font-weight: 500; cursor: pointer; }
  .who a:hover { text-decoration: underline; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 44px 56px; }
  .page-title { font-size: 24px; font-weight: 600; letter-spacing: -0.025em; }
  .page-sub { color: var(--muted); font-size: 14px; margin-top: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 32px; }
  .card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 24px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.025), 0 4px 16px rgba(0, 0, 0, 0.016);
  }
  .card.full { grid-column: 1 / -1; }
  .card h2 { font-size: 12px; font-weight: 600; color: var(--faint); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 18px; }
  .row { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid #f4f4f4; }
  .row:last-child { border-bottom: 0; padding-bottom: 0; }
  .row:first-of-type { padding-top: 0; }
  .k { color: var(--muted); font-size: 13.5px; }
  .v { font-size: 13.5px; font-weight: 500; letter-spacing: -0.005em; }
  .v.mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace; font-size: 12.5px; }
  .pill { display: inline-flex; align-items: center; gap: 7px; padding: 4px 11px; border-radius: 7px; font-size: 12.5px; font-weight: 550; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
  .big { font-size: 30px; font-weight: 600; letter-spacing: -0.03em; }
  .big span { font-size: 16px; color: var(--muted); font-weight: 500; }
  .tokens { margin-top: 16px; }
  .chip { color: var(--ink); cursor: pointer; font-weight: 500; }
  .chip:hover { text-decoration: underline; }
  /* login */
  .login-wrap { max-width: 380px; margin: 96px auto 0; }
  .login-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 32px; box-shadow: 0 1px 2px rgba(0,0,0,.025), 0 8px 32px rgba(0,0,0,.04); }
  .login-card h2 { font-size: 19px; font-weight: 600; letter-spacing: -0.02em; }
  .login-card p { color: var(--muted); font-size: 13.5px; margin-top: 7px; line-height: 1.55; }
  label { display: block; font-size: 12.5px; font-weight: 450; color: var(--muted); margin: 22px 0 7px; }
  input { width: 100%; padding: 11px 13px; font: inherit; font-size: 14px; color: var(--ink); border: 1px solid var(--border-input); border-radius: 9px; transition: border-color .15s, box-shadow .15s; }
  input:focus { outline: none; border-color: var(--ink); box-shadow: 0 0 0 3.5px rgba(0,0,0,.06); }
  button { margin-top: 20px; width: 100%; padding: 12px; font: inherit; font-size: 14px; font-weight: 550; letter-spacing: -0.01em; color: #fff; background: var(--accent); border: 0; border-radius: 9px; cursor: pointer; transition: background .15s; box-shadow: 0 1px 2px rgba(0,0,0,.18); }
  button:hover { background: var(--accent-hover); }
  .alt { margin-top: 16px; text-align: center; font-size: 12.5px; color: var(--faint); }
  .hidden { display: none; }
</style>
</head>
<body>
<header>
  <div class="brand"><div class="logo">x</div><h1>xpense · accounts</h1></div>
  <div class="who hidden" id="who"><span id="email">agent@xagent.dev</span><a id="logout">Sign out</a></div>
</header>

<div class="login-wrap" id="login">
  <div class="login-card">
    <h2>Sign in to xpense</h2>
    <p>One account for your agent's wallet, spend policy and settlement, backed by the xerpaai-go onchainos wallet.</p>
    <label>Email</label>
    <input id="loginEmail" value="agent@xagent.dev" />
    <button id="continue">Continue with email</button>
    <div class="alt">or use the CLI · <code>xpense login --device</code></div>
  </div>
</div>

<div class="wrap hidden" id="dash">
  <div class="page-title">Account</div>
  <div class="page-sub">Wallet, balances, default asset and spend policy for this agent.</div>
  <div class="grid">
    <div class="card">
      <h2>Wallet</h2>
      <div class="row"><span class="k">Status</span><span class="pill"><span class="dot"></span>Connected</span></div>
      <div class="row"><span class="k">Address</span><span class="v mono">0x1a2b…9f4d</span></div>
      <div class="row"><span class="k">Network</span><span class="v">X Layer · eip155:196</span></div>
      <div class="row"><span class="k">Custody</span><span class="v">xerpaai-go</span></div>
    </div>
    <div class="card">
      <h2>Balance</h2>
      <div class="big">124.50 <span>USDC</span></div>
      <div class="tokens">
        <div class="row"><span class="k">USDC · Base</span><span class="v">124.50</span></div>
        <div class="row"><span class="k">USDT · Base</span><span class="v">18.20</span></div>
      </div>
    </div>
    <div class="card">
      <h2>Default asset</h2>
      <div class="row"><span class="k">Asset</span><span class="v">USDC</span></div>
      <div class="row"><span class="k">Chain</span><span class="v">X Layer · eip155:196</span></div>
      <div class="row"><span class="k">Tier</span><span class="v">basic</span></div>
      <div class="row"><span class="k"></span><span class="chip">Change default</span></div>
    </div>
    <div class="card">
      <h2>Spend policy</h2>
      <div class="row"><span class="k">Per transaction</span><span class="v">5.00 USDC</span></div>
      <div class="row"><span class="k">Daily</span><span class="v">50.00 USDC</span></div>
      <div class="row"><span class="k">Total</span><span class="v">500.00 USDC</span></div>
      <div class="row"><span class="k">Approval</span><span class="v">policy · human above 100</span></div>
    </div>
    <div class="card full">
      <h2>Session</h2>
      <div class="row"><span class="k">Access token</span><span class="v mono">jwt · expires in 53m (auto-refresh)</span></div>
      <div class="row"><span class="k">Stored at</span><span class="v mono">~/.config/xagent/credentials.json · 0600</span></div>
      <div class="row"><span class="k">Scopes</span><span class="v">wallet · x402 · mpp · default-asset</span></div>
    </div>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id);
function show(authed) {
  $("login").classList.toggle("hidden", authed);
  $("dash").classList.toggle("hidden", !authed);
  $("who").classList.toggle("hidden", !authed);
}
$("continue").addEventListener("click", () => { $("email").textContent = $("loginEmail").value || "agent@xagent.dev"; show(true); });
$("logout").addEventListener("click", () => show(false));
show(false);
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(PAGE);
});

server.listen(PORT, () => {
  process.stdout.write(`xpense accounts → http://localhost:${PORT}\n`);
});
