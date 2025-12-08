let modalBack;
let modalBody;

const closeModal = () => modalBack?.classList.remove('active');

const percentClass = (v) => (v >= 0 ? 'up' : 'down');
const frameValue = (pair, frame) => {
  if (frame === '7d') {
    const pc = pair.priceChange || {};
    const candidates = [pc.d7, pc.w, pc['7d']];
    const fromField = candidates.find((v) => v !== undefined && v !== null);
    if (fromField !== undefined && fromField !== null) return Number(fromField);
    if (pair.sparkline && pair.sparkline.length > 1) {
      const first = Number(pair.sparkline[0]);
      const last = Number(pair.sparkline[pair.sparkline.length - 1]);
      if (first > 0) return ((last - first) / first) * 100;
    }
    return null;
  }
  const val = pair.priceChange?.[frame];
  return val === undefined || val === null ? null : Number(val);
};

const computeAgeText = (createdAtMs) => {
  if (!createdAtMs) return 'age n/a';
  const diff = Date.now() - createdAtMs;
  if (diff < 60 * 1000) return 'just launched';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min old`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h old`;
  const days = Math.floor(hrs / 24);
  return `${days} d old`;
};

const recentTraders = (txns = []) => {
  const buys = txns.filter((t) => t.side === 'buy');
  const sells = txns.filter((t) => t.side === 'sell');
  const whales = buys.filter((t) => Number(t.amountUsd || 0) > 5000);
  const normies = buys.filter((t) => Number(t.amountUsd || 0) <= 5000);
  return { buys, sells, whales, normies };
};

const socialsTemplate = (links = {}) => {
  const items = [];
  if (links.twitter) items.push(`<a href="${links.twitter}" target="_blank">twitter</a>`);
  if (links.telegram) items.push(`<a href="${links.telegram}" target="_blank">telegram</a>`);
  if (links.website) items.push(`<a href="${links.website}" target="_blank">site</a>`);
  return items.join(' · ') || 'no socials yet';
};

const formatMoney = (num, symbol) => {
  if (num === undefined || num === null) return `${symbol}—`;
  const clean = Number(num);
  if (clean >= 1e9) return `${symbol}${(clean / 1e9).toFixed(2)}b`;
  if (clean >= 1e6) return `${symbol}${(clean / 1e6).toFixed(2)}m`;
  if (clean >= 1e3) return `${symbol}${(clean / 1e3).toFixed(2)}k`;
  return `${symbol}${clean.toFixed(3)}`;
};

const renderModal = (pair, ctx = {}) => {
  if (!modalBody) return;
  const info = pair.info || {};
  const txns = pair.txns || [];
  const { buys, sells, whales, normies } = recentTraders(txns);
  const convert = ctx.convertAmount || window.convertDisplayAmount || ((v) => v);
  const symbol = ctx.currencySymbol || (window.getDisplayCurrencySymbol ? window.getDisplayCurrencySymbol() : '$');
  const logo = pair.logoUrl || ctx.genericLogo || window.genericTokenLogo;
  const price = convert(pair.priceUsd || pair.price || 0);
  const mcap = convert(pair.marketCap || pair.fdv);
  const liq = convert(pair.liquidity?.usd);
  const vol = convert(pair.volume?.h24);
  const titleSymbol = pair.baseToken?.symbol;
  const titleName = pair.baseToken?.name;
  const title = titleSymbol ? (titleName && titleName.toLowerCase() !== titleSymbol.toLowerCase() ? `$${titleSymbol} ${titleName}` : `$${titleSymbol}`) : titleName || 'unknown token';
  const age = computeAgeText(pair.createdAtMs);
  const frames = ['h1', 'h6', 'h24', '7d'];

  modalBody.innerHTML = `
    <div class="modal-section token-head">
      <img class="token-logo" src="${logo}" alt="${title}">
      <div>
        <div class="brand"><span class="dot"></span> ${title}</div>
        <div class="small muted">${pair.chainId || 'solana'} • ${age}</div>
      </div>
    </div>
    <div class="modal-section">
      <iframe src="https://dexscreener.com/${pair.chainId || 'solana'}/${pair.pairAddress}?embed=1&theme=${document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'}" style="width:100%;height:320px;border:1px solid var(--border);border-radius:16px;"></iframe>
    </div>
    <div class="modal-section stat-grid" id="shareCard">
      <div>price<br><strong>${symbol}${price !== null ? Number(price).toFixed(6) : '—'}</strong></div>
      <div>market cap<br><strong>${formatMoney(mcap, symbol)}</strong></div>
      <div>liq<br><strong>${formatMoney(liq, symbol)}</strong></div>
      <div>vol 24h<br><strong>${formatMoney(vol, symbol)}</strong></div>
    </div>
    <div class="modal-section tagged-list">
      ${frames
        .map((f) => {
          const val = frameValue(pair, f);
          if (val === null || Number.isNaN(val)) return '';
          return `<span class="badge percent ${percentClass(val)}">${f}: ${val >= 0 ? '+' : ''}${val.toFixed(2)}%</span>`;
        })
        .join('')}
    </div>
    <div class="modal-section">
      <div class="brand"><span class="dot"></span> trades</div>
      <div class="small">recent buys: ${buys.length} • sells: ${sells.length} • whales: ${whales.length} • normies: ${normies.length}</div>
    </div>
    <div class="modal-section tagged-list">
      ${buys.slice(0, 6).map((b) => `<span class="badge">buy $${Number(b.amountUsd || 0).toFixed(2)}</span>`).join('') || '<span class="small">no buys yet</span>'}
    </div>
    <div class="modal-section tagged-list">
      ${sells.slice(0, 6).map((s) => `<span class="badge">sell $${Number(s.amountUsd || 0).toFixed(2)}</span>`).join('') || '<span class="small">no sells yet</span>'}
    </div>
    <div class="modal-section">
      <div class="brand"><span class="dot"></span> socials</div>
      <div class="small">${socialsTemplate(info.socials || {})}</div>
    </div>
    <div class="modal-section meta-row">
      <a class="button" href="${pair.url}" target="_blank">open on dexscreener</a>
      ${pair.baseToken?.address ? `<a class="button" href="https://pump.fun/${pair.baseToken.address}" target="_blank">open on pump.fun</a>` : ''}
    </div>
    <div class="modal-section">
      <button class="button" id="shareToken">share card</button>
    </div>
  `;
  const shareBtn = document.getElementById('shareToken');
  shareBtn?.addEventListener('click', () => {
    const shareArea = document.getElementById('shareCard');
    if (!shareArea) return;
    html2canvas(shareArea).then((canvas) => {
      const link = document.createElement('a');
      link.download = `${pair.baseToken?.symbol || 'token'}-pumpScope.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  });
};

const openTokenModal = async (pair, ctx) => {
  modalBack = modalBack || document.getElementById('tokenModal');
  modalBody = modalBody || document.getElementById('modalBody');
  modalBack.classList.add('active');
  renderModal(pair, ctx);
};

window.addEventListener('DOMContentLoaded', () => {
  modalBack = document.getElementById('tokenModal');
  modalBody = document.getElementById('modalBody');
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  modalBack?.addEventListener('click', (e) => {
    if (e.target === modalBack) closeModal();
  });
});
