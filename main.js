const grid = () => document.getElementById('tokenGrid');
const tabs = () => document.querySelectorAll('#timeTabs .tab');
let currentFrame = 'h1';
let pairsCache = [];

const formatMoney = (num) => {
  if(num === undefined || num === null) return '—';
  if(num > 1e9) return (num/1e9).toFixed(2)+'b';
  if(num > 1e6) return (num/1e6).toFixed(2)+'m';
  if(num > 1e3) return (num/1e3).toFixed(2)+'k';
  return (+num).toFixed(3);
};

const ageText = (pair) => {
  if(!pair.age) return 'unknown age';
  const mins = pair.age/60;
  if(mins < 60) return `${mins.toFixed(0)}m old`;
  const hrs = mins/60;
  if(hrs < 24) return `${hrs.toFixed(1)}h old`;
  const days = hrs/24;
  return `${days.toFixed(1)}d old`;
};

const percentClass = (v) => v >= 0 ? 'up' : 'down';

const compute7d = (pair) => {
  const pc = pair.priceChange || {};
  if(pc.d7) return pc.d7;
  if(pc.w) return pc.w;
  if(pc['7d']) return pc['7d'];
  if(pair.sparkline && pair.sparkline.length > 1){
    const first = Number(pair.sparkline[0]);
    const last = Number(pair.sparkline[pair.sparkline.length-1]);
    if(first>0) return ((last-first)/first*100).toFixed(2);
  }
  return null;
};

const renderPairs = () => {
  if(!grid()) return;
  grid().innerHTML = '';
  const sorted = [...pairsCache].sort((a,b)=>{
    const aVal = currentFrame==='7d' ? compute7d(a) : a.priceChange?.[currentFrame];
    const bVal = currentFrame==='7d' ? compute7d(b) : b.priceChange?.[currentFrame];
    return (Number(bVal)||0) - (Number(aVal)||0);
  });
  sorted.slice(0,48).forEach(pair => {
    const pct = currentFrame==='7d' ? compute7d(pair) : pair.priceChange?.[currentFrame];
    const change = pct!==null && pct!==undefined ? `${Number(pct).toFixed(2)}%` : 'n/a';
    const el = document.createElement('div');
    el.className = 'glass token-card';
    el.innerHTML = `
      <div class="meta-row">
        <h3>${pair.baseToken?.name || 'unknown'} <span class="small">${pair.baseToken?.symbol || ''}</span></h3>
        <span class="badge">${ageText(pair)}</span>
      </div>
      <div class="stat-grid">
        <div>price<br><strong>$${Number(pair.priceUsd||pair.price||0).toFixed(6)}</strong></div>
        <div>mcap<br><strong>$${formatMoney(pair.fdv || pair.marketCap)}</strong></div>
        <div>liq<br><strong>$${formatMoney(pair.liquidity?.usd)}</strong></div>
        <div>vol 24h<br><strong>$${formatMoney(pair.volume?.h24)}</strong></div>
      </div>
      <div class="meta-row" style="margin-top:8px;">
        <span class="percent ${percentClass(Number(pct||0))}">${change}</span>
        <a href="${pair.url}" class="small" target="_blank">dex</a>
        <a href="https://pump.fun/${pair.baseToken?.address || ''}" class="small" target="_blank">pump.fun</a>
      </div>
    `;
    el.addEventListener('click', ()=> openTokenModal(pair));
    grid().appendChild(el);
  });
};

const fetchPairs = async () => {
  const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana');
  const data = await res.json();
  pairsCache = data?.pairs?.map(p => ({
    ...p,
    age: p.info?.ageSeconds || p.age || null,
    sparkline: p.info?.priceChange?.sparkline7d || p.sparkline || null
  })) || [];
  renderPairs();
};

const setupTabs = () => {
  let startX = 0;
  tabs().forEach(tab => {
    tab.addEventListener('click', () => {
      tabs().forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      currentFrame = tab.dataset.frame;
      renderPairs();
    });
  });
  const tabRow = document.getElementById('timeTabs');
  tabRow.addEventListener('touchstart', e=> startX = e.touches[0].clientX);
  tabRow.addEventListener('touchend', e=>{
    const diff = e.changedTouches[0].clientX - startX;
    const idx = Array.from(tabs()).findIndex(t=>t.classList.contains('active'));
    if(Math.abs(diff) > 60){
      const nextIdx = diff < 0 ? Math.min(tabs().length-1, idx+1) : Math.max(0, idx-1);
      tabs().forEach(t=>t.classList.remove('active'));
      tabs()[nextIdx].classList.add('active');
      currentFrame = tabs()[nextIdx].dataset.frame;
      renderPairs();
    }
  });
};

window.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  fetchPairs();
  setInterval(fetchPairs, 30000);
});
