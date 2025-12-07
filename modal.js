let modalBack;
let modalBody;

const closeModal = () => modalBack?.classList.remove('active');

const recentTraders = (txns=[]) => {
  const buys = txns.filter(t=>t.side==='buy');
  const sells = txns.filter(t=>t.side==='sell');
  const whales = buys.filter(t=>Number(t.amountUsd||0) > 5000);
  const normies = buys.filter(t=>Number(t.amountUsd||0) <= 5000);
  return {buys, sells, whales, normies};
};

const socialsTemplate = (links={}) => {
  const items = [];
  if(links.twitter) items.push(`<a href="${links.twitter}" target="_blank">twitter</a>`);
  if(links.telegram) items.push(`<a href="${links.telegram}" target="_blank">telegram</a>`);
  if(links.website) items.push(`<a href="${links.website}" target="_blank">site</a>`);
  return items.join(' · ') || 'no socials yet';
};

const renderModal = (pair) => {
  if(!modalBody) return;
  const info = pair.info || {};
  const txns = pair.txns || [];
  const {buys, sells, whales, normies} = recentTraders(txns);
  modalBody.innerHTML = `
    <div class="modal-section">
      <div class="brand"><span class="dot"></span> ${pair.baseToken?.name || 'token'} / ${pair.baseToken?.symbol || ''}</div>
      <div class="small">fdv: $${(pair.fdv ? pair.fdv.toLocaleString() : '—')} · liq: $${pair.liquidity?.usd?.toLocaleString() || '—'} · vol 24h: $${pair.volume?.h24?.toLocaleString() || '—'}</div>
    </div>
    <div class="modal-section">
      <iframe src="https://dexscreener.com/${pair.chainId || 'solana'}/${pair.pairAddress}?embed=1&theme=${document.documentElement.getAttribute('data-theme')==='light'?'light':'dark'}" style="width:100%;height:320px;border:1px solid var(--border);border-radius:16px;"></iframe>
    </div>
    <div class="modal-section stat-grid" id="shareCard">
      <div>market cap<br><strong>$${(pair.marketCap||pair.fdv||0).toLocaleString()}</strong></div>
      <div>fdv<br><strong>$${(pair.fdv||0).toLocaleString()}</strong></div>
      <div>liq<br><strong>$${(pair.liquidity?.usd||0).toLocaleString()}</strong></div>
      <div>vol 24h<br><strong>$${(pair.volume?.h24||0).toLocaleString()}</strong></div>
    </div>
    <div class="modal-section">
      <div class="brand"><span class="dot"></span> trades</div>
      <div class="small">recent buys: ${buys.length} • sells: ${sells.length} • whales: ${whales.length} • normies: ${normies.length}</div>
    </div>
    <div class="modal-section tagged-list">
      ${buys.slice(0,6).map(b=>`<span class="badge">buy $${Number(b.amountUsd||0).toFixed(2)}</span>`).join('') || '<span class="small">no buys yet</span>'}
    </div>
    <div class="modal-section tagged-list">
      ${sells.slice(0,6).map(s=>`<span class="badge">sell $${Number(s.amountUsd||0).toFixed(2)}</span>`).join('') || '<span class="small">no sells yet</span>'}
    </div>
    <div class="modal-section">
      <div class="brand"><span class="dot"></span> socials</div>
      <div class="small">${socialsTemplate(info.socials || {})}</div>
    </div>
    <div class="modal-section">
      <button class="button" id="shareToken">share card</button>
    </div>
  `;
  const shareBtn = document.getElementById('shareToken');
  shareBtn?.addEventListener('click', () => {
    const shareArea = document.getElementById('shareCard');
    if(!shareArea) return;
    html2canvas(shareArea).then(canvas => {
      const link = document.createElement('a');
      link.download = `${pair.baseToken?.symbol || 'token'}-pumpScope.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  });
};

const openTokenModal = async (pair) => {
  modalBack = modalBack || document.getElementById('tokenModal');
  modalBody = modalBody || document.getElementById('modalBody');
  modalBack.classList.add('active');
  renderModal(pair);
};

window.addEventListener('DOMContentLoaded', () => {
  modalBack = document.getElementById('tokenModal');
  modalBody = document.getElementById('modalBody');
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  modalBack?.addEventListener('click', (e)=>{ if(e.target===modalBack) closeModal(); });
});

