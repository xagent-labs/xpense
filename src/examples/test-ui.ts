import { createServer } from "node:http";
import { Xpense } from "../index.ts";
import type { ApprovalMode, SettlementScheme } from "../index.ts";

const PORT = Number(process.env.XPENSE_UI_PORT ?? 4500);

interface EmitRequest {
  amount: string;
  currency: string;
  reason: string;
  counterparty: string;
  budgetTotal?: string;
  approval: ApprovalMode;
  scheme: SettlementScheme;
}

function settlementPreview(req: EmitRequest) {
  if (req.scheme === "voucher" || req.scheme === "stream") {
    return {
      endpoint: "POST /user/onchainos/mpp/charge",
      body: { challenge: "<from 402/MPP challenge>", from: "<wallet address>" }
    };
  }
  return {
    endpoint: "POST /user/onchainos/x402/sign",
    body: {
      accepts: [{ scheme: "exact", amount: req.amount, currency: req.currency }],
      resource: req.counterparty
    }
  };
}

async function handleEmit(req: EmitRequest) {
  const budget = req.budgetTotal
    ? { total: { amount: req.budgetTotal, currency: req.currency } }
    : {};
  const xp = new Xpense({ mode: "mock", budget });
  const intent = xp.createPaymentIntent({
    reason: { category: "demo", description: req.reason },
    counterparty: { kind: "api", name: req.counterparty },
    amount: { kind: "fixed", value: { amount: req.amount, currency: req.currency } },
    approval: { mode: req.approval },
    policy: {},
    scheme: req.scheme
  });

  let outcome = "authorized";
  let submit: unknown = null;
  let errorMsg: string | null = null;
  try {
    submit = await xp.submitPaymentIntent(intent);
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : String(error);
    outcome = /approval/i.test(errorMsg) ? "requires_approval" : "rejected";
  }
  return { outcome, intent, submit, errorMsg, settlement: settlementPreview(req) };
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>xpense · test bench</title>
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
    --radius: 11px;
  }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg); color: var(--ink);
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
  header {
    border-bottom: 1px solid #f1f1f1; padding: 26px 56px;
    position: sticky; top: 0; background: rgba(255, 255, 255, 0.85);
    backdrop-filter: saturate(180%) blur(8px); z-index: 10;
  }
  .brand { display: flex; align-items: center; gap: 13px; }
  .logo {
    width: 32px; height: 32px; border-radius: 9px; background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 600; font-size: 16px; letter-spacing: -0.02em;
  }
  header h1 { font-size: 16px; font-weight: 600; letter-spacing: -0.02em; }
  header .sub { color: var(--muted); font-size: 13px; margin-top: 3px; letter-spacing: -0.005em; }
  main {
    max-width: 1160px; margin: 0 auto; display: grid;
    grid-template-columns: 352px 1fr; gap: 40px; padding: 48px 56px;
  }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 30px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.025), 0 4px 16px rgba(0, 0, 0, 0.018);
  }
  form { align-self: start; }
  label {
    display: block; font-size: 12.5px; font-weight: 450;
    color: var(--muted); margin: 20px 0 7px; letter-spacing: -0.005em;
  }
  form > .row:first-child label, form > label:first-of-type { margin-top: 0; }
  input, select {
    width: 100%; padding: 11px 13px; font: inherit; font-size: 14px;
    color: var(--ink); background: var(--surface);
    border: 1px solid var(--border-input); border-radius: 9px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input::placeholder { color: var(--faint); }
  input:hover, select:hover { border-color: #d0d0d0; }
  input:focus, select:focus {
    outline: none; border-color: var(--ink);
    box-shadow: 0 0 0 3.5px rgba(0, 0, 0, 0.06);
  }
  .row { display: grid; grid-template-columns: 1fr 104px; gap: 12px; }
  button {
    margin-top: 26px; width: 100%; padding: 12px; font: inherit;
    font-size: 14px; font-weight: 550; letter-spacing: -0.01em; color: #fff;
    background: var(--accent); border: 0; border-radius: 9px; cursor: pointer;
    transition: background 0.15s, transform 0.06s, box-shadow 0.15s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  }
  button:hover { background: var(--accent-hover); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16); }
  button:active { transform: translateY(0.5px); }
  .hint { color: var(--faint); font-size: 12px; margin-top: 18px; line-height: 1.65; }
  .section-label {
    font-size: 11px; font-weight: 600; color: var(--faint);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;
  }
  .section-label:not(:first-child) { margin-top: 30px; }
  .empty { color: var(--faint); font-size: 14px; line-height: 1.6; }
  .badge {
    display: inline-flex; align-items: center; gap: 8px; padding: 7px 15px;
    border-radius: 9px; font-size: 13px; font-weight: 550; border: 1px solid;
    letter-spacing: -0.005em;
  }
  .badge .dot { width: 7px; height: 7px; border-radius: 50%; }
  .authorized { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
  .authorized .dot { background: #22c55e; }
  .rejected { background: #fef2f2; color: #be123c; border-color: #fecdd3; }
  .rejected .dot { background: #f43f5e; }
  .requires_approval { background: #fffbeb; color: #b45309; border-color: #fde68a; }
  .requires_approval .dot { background: #f59e0b; }
  pre {
    background: var(--subtle); border: 1px solid #f0f0f0; border-radius: 10px;
    padding: 17px 19px; overflow: auto;
    font: 12.5px/1.7 ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    color: #3f3f46;
  }
  .err { color: #be123c; font-size: 13px; margin-top: 11px; line-height: 1.5; }
</style>
</head>
<body>
<header>
  <div class="brand">
    <div class="logo">x</div>
    <div>
      <h1>xpense · test bench</h1>
      <div class="sub">Emit a Payment Intent, see the governance decision and the payload that settles through xerpaai-go. Mock mode — nothing real moves.</div>
    </div>
  </div>
</header>
<main>
  <form class="card" id="form">
    <div class="row">
      <div><label>Amount</label><input id="amount" value="0.25" /></div>
      <div><label>Currency</label><input id="currency" value="USDC" /></div>
    </div>
    <label>Reason</label><input id="reason" value="Weather data API call" />
    <label>Counterparty</label><input id="counterparty" value="weatherapi.com" />
    <label>Budget total (blank = unlimited)</label><input id="budgetTotal" value="1" />
    <label>Approval mode</label>
    <select id="approval"><option value="policy">policy</option><option value="auto">auto</option><option value="human">human</option></select>
    <label>Settlement scheme</label>
    <select id="scheme"><option value="exact">exact · x402/sign</option><option value="voucher">voucher · mpp/charge</option><option value="stream">stream · mpp/charge</option></select>
    <button type="submit">Emit Payment Intent</button>
    <div class="hint">Try amount 2 with budget 1 → rejected. Approval mode human → requires approval.</div>
  </form>
  <div class="card" id="out">
    <div class="section-label">Result</div>
    <p class="empty">Fill the form and emit to see the decision, the Payment Intent, and the settlement payload.</p>
  </div>
</main>
<script>
const $ = (id) => document.getElementById(id);
$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    amount: $("amount").value, currency: $("currency").value, reason: $("reason").value,
    counterparty: $("counterparty").value, budgetTotal: $("budgetTotal").value || undefined,
    approval: $("approval").value, scheme: $("scheme").value
  };
  const res = await fetch("/api/emit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await res.json();
  $("out").innerHTML =
    '<div class="section-label">Governance decision</div>' +
    '<span class="badge ' + data.outcome + '"><span class="dot"></span>' + data.outcome.replace(/_/g, " ") + '</span>' +
    (data.errorMsg ? '<div class="err">' + data.errorMsg + '</div>' : '') +
    '<div class="section-label">Payment Intent</div><pre>' + JSON.stringify(data.intent, null, 2) + '</pre>' +
    '<div class="section-label">Settlement preview · live → xerpaai-go</div>' +
    '<pre>' + data.settlement.endpoint + '\\n' + JSON.stringify(data.settlement.body, null, 2) + '</pre>' +
    '<div class="section-label">submit() result</div><pre>' + JSON.stringify(data.submit, null, 2) + '</pre>';
});
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(PAGE);
    return;
  }
  if (req.method === "POST" && req.url === "/api/emit") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", async () => {
      try {
        const result = await handleEmit(JSON.parse(raw) as EmitRequest);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
    });
    return;
  }
  res.statusCode = 404;
  res.end("not found");
});

server.listen(PORT, () => {
  process.stdout.write(`xpense test bench → http://localhost:${PORT}\n`);
});
