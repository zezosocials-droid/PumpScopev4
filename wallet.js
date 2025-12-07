const heliusKeyInput = () => document.getElementById('heliusKey');
const walletInput = () => document.getElementById('walletInput');
const balanceInfo = () => document.getElementById('balanceInfo');
const holdings = () => document.getElementById('holdings');
const activity = () => document.getElementById('activity');
const vibe = () => document.getElementById('vibe');

const getKey = () => heliusKeyInput().value.trim();

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if(!res.ok) throw new Error('api fail');
  return res.json();
};

const renderBalances = (data) => {
  const sol = (data.nativeBalance?.lamports || 0) / 1e9;
  const spl = data.tokens || [];
  balanceInfo().innerHTML = `sol: <strong>${sol.toFixed(4)}</strong><br>${spl.length} spl tokens`;
  const sorted = spl.sort((a,b)=> (b.amount || 0) - (a.amount || 0));
  holdings().innerHTML = sorted.slice(0,6).map(t=>{
    const ui = (t.amount || 0) / (10**(t.decimals || 0));
    return `<div class="badge">${t.tokenAccount||''} · ${ui.toFixed(4)}</div>`;
  }).join('') || 'no tokens?';
};

const renderTxns = (txns) => {
  activity().innerHTML = txns.slice(0,10).map(t=>{
    const side = t.type || t.description || 'tx';
    return `<div class="glass" style="padding:8px;">${side} · ${new Date(t.timestamp*1000).toLocaleString()}</div>`;
  }).join('');
};

const vibeCheck = (sol, txns) => {
  const buys = txns.filter(t=> (t.tokenTransfers||[]).some(x=>x.type==='token')); 
  const sells = txns.filter(t=> (t.tokenTransfers||[]).some(x=>x.type==='sale'));
  let text = 'ok this wallet kinda quiet rn';
  if(txns.length > 50) text = 'ok this wallet kinda degen but i respect it ngl';
  if(buys.length > sells.length*2) text = 'bro buys ANYTHING shiny 😭';
  if(sol > 100 && txns.length < 10) text = 'whale watching from the shadows fr';
  vibe().textContent = text;
};

const analyze = async () => {
  const addr = walletInput().value.trim();
  if(!addr) return alert('drop a wallet fr');
  const key = getKey();
  if(!key) return alert('need helius api key');
  const balancesUrl = `https://api.helius.xyz/v0/addresses/${addr}/balances?api-key=${key}`;
  const txUrl = `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${key}`;
  try {
    const [balData, txData] = await Promise.all([
      fetchJSON(balancesUrl),
      fetchJSON(txUrl)
    ]);
    renderBalances(balData);
    renderTxns(txData);
    const sol = (balData.nativeBalance?.lamports||0)/1e9;
    vibeCheck(sol, txData);
  } catch(err){
    balanceInfo().textContent = 'api hit failed. double check key & address';
  }
};

const shareWallet = () => {
  const area = document.getElementById('walletGrid');
  if(!area) return;
  html2canvas(area).then(canvas => {
    const link = document.createElement('a');
    link.download = 'pumpScope-wallet.png';
    link.href = canvas.toDataURL();
    link.click();
  });
};

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('analyzeBtn')?.addEventListener('click', analyze);
  document.getElementById('shareWallet')?.addEventListener('click', shareWallet);
});

