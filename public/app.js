import { makeReader, write, connectWallet, activeAccount, balanceOf, short, toGen, GEN, fmtErr }
  from "./shared/genlayer-lite.js";

const CONTRACT = "0x0946408990Be34450e9438BeEdB9cF5f3dFAd1e0";
const EXPLORER = "https://explorer-studio.genlayer.com/address/0x0946408990Be34450e9438BeEdB9cF5f3dFAd1e0";
const { read } = makeReader(CONTRACT);
const A_OPEN = 0, A_SETTLED = 1, A_VOIDED = 2;
const STLABEL = ["Open", "Settled", "Voided"];
const ACLS = ["as-open", "as-settled", "as-voided"];
const HCLS = ["", "settled", "voided"];
let account = null, ags = [];
const $ = (id) => document.getElementById(id);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("contractLink").href = "https://explorer-studio.genlayer.com/address/0x0946408990Be34450e9438BeEdB9cF5f3dFAd1e0";
$("contractLink").textContent = "Contract " + short(CONTRACT) + " \u2197";

function toast(msg, kind = "", title = "concord") {
  const el = document.createElement("div"); el.className = "toast " + kind;
  el.innerHTML = `<span class="tt">${title}</span>`; el.appendChild(document.createTextNode(msg));
  $("log").appendChild(el); setTimeout(() => el.remove(), kind === "err" ? 15000 : 5000);
}

async function refreshWallet() {
  account = await activeAccount();
  const slot = $("walletslot");
  if (account) { let bal = 0n; try { bal = await balanceOf(account); } catch (_) {} slot.innerHTML = `<span class="mono" style="font-size:13px;color:var(--grey)">${short(account)} \u00b7 ${toGen(bal)} GEN</span>`; }
  else { slot.innerHTML = `<button class="btn ghost sm" id="connectBtn">Connect</button>`; $("connectBtn").onclick = doConnect; }
}
async function doConnect() { try { account = await connectWallet(); toast("Connected on studionet.", "ok"); await refreshWallet(); } catch (e) { toast(fmtErr(e), "err"); } }
async function ensureWallet() { if (!account) account = await connectWallet(); await refreshWallet(); }

async function load() {
  try {
    const count = Number(await read("get_agreement_count"));
    const out = [];
    for (let i = 0; i < count; i++) out.push({ id: i, ...(await read("get_agreement", [i])) });
    ags = out; renderList(); renderCard();
    $("agCount").textContent = count + (count === 1 ? " agreement" : " agreements");
    $("stOpen").textContent = out.filter((a) => Number(a.status) === A_OPEN).length;
    $("stEscrow").textContent = toGen(out.filter((a) => Number(a.status) === A_OPEN).reduce((s, a) => s + BigInt(a.amount), 0n).toString());
    $("stSettled").textContent = out.filter((a) => Number(a.status) === A_SETTLED).length;
  } catch (e) { $("agList").innerHTML = `<div class="a-empty">Could not reach the chain. ${fmtErr(e)}</div>`; }
}

function renderCard() {
  const feat = ags.find((a) => Number(a.status) === A_SETTLED) || ags[ags.length - 1];
  if (!feat) { $("hcTerms").textContent = "No agreements yet"; $("hcCond").textContent = "-"; return; }
  const st = Number(feat.status);
  $("hcTerms").textContent = feat.terms;
  $("hcCond").textContent = feat.condition;
  $("hcAmt").textContent = toGen(feat.amount);
  const el = $("hcStatus"); el.textContent = STLABEL[st]; el.className = "hc-status " + HCLS[st];
}

function renderList() {
  const el = $("agList");
  if (!ags.length) { el.innerHTML = `<div class="a-empty">No agreements yet. Start the first one.</div>`; return; }
  el.innerHTML = "";
  [...ags].reverse().forEach((a) => {
    const st = Number(a.status);
    const row = document.createElement("div"); row.className = "ag";
    row.innerHTML = `<div class="ag-l">
        <div class="ag-terms">${esc(a.terms)}</div>
        <div class="ag-cond">Settles when <b>${esc(a.condition)}</b></div>
        <div class="ag-parties">${short(a.payer)} \u2192 ${short(a.payee)}</div>
      </div>
      <div class="ag-r"><span class="ag-amt">${toGen(a.amount)} GEN</span><span class="astatus ${ACLS[st]}">${STLABEL[st]}</span></div>
      ${(st !== A_OPEN && a.rationale) ? `<div class="ag-reason">${esc(a.rationale)}</div>` : ""}`;
    row.onclick = () => openDetail(a.id);
    el.appendChild(row);
  });
}

function openDrawer() { $("scrim").classList.add("on"); $("drawer").classList.add("on"); }
function closeDrawer() { $("scrim").classList.remove("on"); $("drawer").classList.remove("on"); }

function openNew() {
  $("drawerTitle").textContent = "New agreement";
  $("drawerBody").innerHTML = `
    <div class="letter">
      <div class="letter-h">Agreement</div>
      <p class="letter-body">I agree to pay <input id="nPayee" class="lf" placeholder="payee 0x\u2026" autocomplete="off" /> the sum of <input id="nAmount" class="lf sm" type="number" min="0" step="0.5" value="4" /> GEN for <input id="nTerms" class="lf wide" placeholder="the agreed work" autocomplete="off" />, to be released when <input id="nCond" class="lf wide" placeholder="the condition is met" autocomplete="off" />, verifiable at <input id="nUrl" class="lf" placeholder="https://source" autocomplete="off" />.</p>
      <button class="btn primary block" id="createBtn">Escrow &amp; sign</button>
    </div>`;
  $("createBtn").onclick = doCreate; openDrawer();
}

function openDetail(id) {
  const a = ags.find((x) => x.id === id); if (!a) return;
  const st = Number(a.status);
  $("drawerTitle").textContent = "Agreement #" + id;
  let verdict = "";
  if (st === A_SETTLED) verdict = `<div class="verdict-box vb-ok"><b>Settled - paid to the payee.</b> ${a.rationale ? esc(a.rationale) : "The condition was read as met."}</div>`;
  if (st === A_VOIDED) verdict = `<div class="verdict-box vb-no"><b>Voided - refunded to the payer.</b> ${a.rationale ? esc(a.rationale) : "The condition was read as not met."}</div>`;
  const actions = st === A_OPEN
    ? `<button class="btn primary block" id="settleBtn"><i class="ph-bold ph-scales"></i> Settle from the source</button><div class="hint" style="text-align:center;margin-top:8px">Validators read the source URL and agree if the condition is met. Calls a real LLM.</div>`
    : "";
  $("drawerBody").innerHTML = `
    <div class="d-terms">${esc(a.terms)}</div>
    <div class="d-amt">${toGen(a.amount)} GEN</div>
    ${verdict}
    <div class="kv"><span class="k">Settles when</span><span class="v">${esc(a.condition)}</span></div>
    <div class="kv"><span class="k">Source</span><span class="v"><a href="${esc(a.source_url)}" target="_blank" rel="noopener">link \u2197</a></span></div>
    <div class="kv"><span class="k">Payer</span><span class="v mono">${short(a.payer)}</span></div>
    <div class="kv"><span class="k">Payee</span><span class="v mono">${short(a.payee)}</span></div>
    <div class="kv"><span class="k">Status</span><span class="v">${STLABEL[st]}</span></div>
    <div style="margin-top:16px">${actions}</div>`;
  openDrawer();
  if (st === A_OPEN && $("settleBtn")) $("settleBtn").onclick = () => doSettle(id);
}

async function doCreate() {
  const payee = $("nPayee").value.trim(), terms = $("nTerms").value.trim(), cond = $("nCond").value.trim(), url = $("nUrl").value.trim();
  const amount = parseFloat($("nAmount").value);
  if (!/^0x[0-9a-fA-F]{40}$/.test(payee)) return toast("Enter a valid payee address.", "err");
  if (!terms) return toast("State the terms.", "err");
  if (!cond) return toast("State the settlement condition.", "err");
  if (!url) return toast("Cite a source URL.", "err");
  if (!(amount > 0)) return toast("Escrow must be above zero.", "err");
  const btn = $("createBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> opening';
  try { await ensureWallet(); await write(CONTRACT, "open_agreement", [payee, terms, cond, url], GEN(amount)); toast("Agreement opened.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Escrow & open"; }
}
async function doSettle(id) {
  if (!confirm("Settle now? Validators read the source URL and agree whether the condition is met. Calls a real LLM.")) return;
  const btn = $("settleBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> reading the source';
  try { await ensureWallet(); toast("Validators reading the source\u2026", "", "settle"); await write(CONTRACT, "settle", [id]); toast("Settled on-chain.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); if (btn) { btn.disabled = false; btn.textContent = "Settle from the source"; } }
}

$("heroPostBtn").onclick = openNew;
$("ctaPostBtn").onclick = openNew;
$("navPostBtn").onclick = openNew;
$("refreshBtn").onclick = load;
$("closeDrawer").onclick = closeDrawer;
$("scrim").onclick = closeDrawer;
const _cb = $("connectBtn"); if (_cb) _cb.onclick = doConnect;
if (window.ethereum) window.ethereum.on?.("accountsChanged", refreshWallet);

refreshWallet();
load();

// ====== two interlocking rings (Three.js, calm) ======
(function rings() {
  const canvas = $("ringCanvas"); if (!canvas || !window.THREE) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 13);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight || 500; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

  const INK = 0x15140f, LIME = 0xcdf03a;
  const matLine = (c) => new THREE.MeshStandardMaterial({ color: c, metalness: .3, roughness: .5 });
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.18, 16, 80), matLine(INK)); r1.position.x = -1.1; scene.add(r1);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.18, 16, 80), matLine(LIME)); r2.position.x = 1.1; r2.rotation.y = Math.PI / 2; scene.add(r2);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(4, 6, 8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.3); fill.position.set(-5, -2, 4); scene.add(fill);

  resize(); addEventListener("resize", resize);
  let t = 0, running = true;
  const vis = new IntersectionObserver((es) => { running = es[0].isIntersecting; if (running) loop(); }, { threshold: 0 });
  vis.observe(canvas);
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop); t += 0.008;
    r1.rotation.x = t * 0.5; r1.rotation.z = t * 0.3;
    r2.rotation.x = t * 0.4; r2.rotation.z = -t * 0.35;
    scene.rotation.y = Math.sin(t * 0.3) * 0.25;
    renderer.render(scene, camera);
  }
  loop();
})();
