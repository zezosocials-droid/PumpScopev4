diff --git a/main.js b/main.js
index 8b137891791fe96927ad78e64b0aad7bded08bdc..2849155f836a97d0149084518b0f6bf27bab89e3 100644
--- a/main.js
+++ b/main.js
@@ -1 +1,227 @@
+// auth gate
+if (localStorage.getItem('pumpscope_authed') !== 'true') {
+  window.location.href = 'login.html';
+}
 
+const grid = () => document.getElementById('tokenGrid');
+const tabs = () => document.querySelectorAll('#timeTabs .tab');
+const currencyButtons = () => document.querySelectorAll('[data-currency]');
+let currentFrame = 'h1';
+let pairsCache = [];
+let currency = 'usd';
+let rates = { usd: 1, eur: 1, sol: 1 };
+let lastRateFetch = 0;
+
+const genericLogo =
+  'data:image/svg+xml;utf8,' +
+  encodeURIComponent(
+    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">' +
+      '<defs><linearGradient id="g" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="#4de3c1"/><stop offset="1" stop-color="#9a5bff"/></linearGradient></defs>' +
+      '<rect x="10" y="10" width="100" height="100" rx="24" fill="url(#g)" opacity="0.16" stroke="#4de3c1" stroke-width="3"/>' +
+      '<circle cx="60" cy="60" r="26" stroke="#9a5bff" stroke-width="8" opacity="0.8"/>' +
+      '<circle cx="60" cy="60" r="12" fill="#4de3c1" opacity="0.8"/>' +
+    '</svg>'
+  );
+
+const currencySymbol = () => (currency === 'usd' ? '$' : currency === 'eur' ? '€' : '◎');
+const convertAmount = (usdVal) => {
+  if (usdVal === undefined || usdVal === null) return null;
+  return Number(usdVal) * (rates[currency] || 1);
+};
+const formatMoney = (num) => {
+  if (num === undefined || num === null) return '—';
+  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'b';
+  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'm';
+  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
+  return Number(num).toFixed(3);
+};
+
+const fetchRates = async () => {
+  const now = Date.now();
+  if (now - lastRateFetch < 5 * 60 * 1000) return; // 5 minutes cache
+  try {
+    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,eur');
+    const data = await res.json();
+    const sol = data.solana;
+    if (sol?.usd && sol?.eur) {
+      rates = {
+        usd: 1,
+        eur: sol.eur / sol.usd,
+        sol: 1 / sol.usd,
+      };
+      lastRateFetch = now;
+    }
+  } catch (err) {
+    console.warn('rate fetch failed', err);
+  }
+};
+
+const buildTitle = (pair) => {
+  const symbol = pair.baseToken?.symbol;
+  const name = pair.baseToken?.name;
+  if (symbol) {
+    if (name && name.toLowerCase() !== symbol.toLowerCase()) return `$${symbol} ${name}`;
+    return `$${symbol}`;
+  }
+  return name || 'unknown token';
+};
+
+const computeAgeText = (createdAtMs) => {
+  if (!createdAtMs) return 'age n/a';
+  const diff = Date.now() - createdAtMs;
+  if (diff < 60 * 1000) return 'just launched';
+  const mins = Math.floor(diff / 60000);
+  if (mins < 60) return `${mins} min old`;
+  const hrs = Math.floor(mins / 60);
+  if (hrs < 24) return `${hrs} h old`;
+  const days = Math.floor(hrs / 24);
+  return `${days} d old`;
+};
+
+const percentClass = (v) => (v >= 0 ? 'up' : 'down');
+
+const compute7d = (pair) => {
+  const pc = pair.priceChange || {};
+  const candidates = [pc.d7, pc.w, pc['7d']];
+  const fromField = candidates.find((v) => v !== undefined && v !== null);
+  if (fromField !== undefined && fromField !== null) return Number(fromField);
+  if (pair.sparkline && pair.sparkline.length > 1) {
+    const first = Number(pair.sparkline[0]);
+    const last = Number(pair.sparkline[pair.sparkline.length - 1]);
+    if (first > 0) return ((last - first) / first) * 100;
+  }
+  return null;
+};
+
+const timeframeValue = (pair, frame) => {
+  if (frame === '7d') return compute7d(pair);
+  const val = pair.priceChange?.[frame];
+  return val === undefined || val === null ? null : Number(val);
+};
+
+const renderPairs = () => {
+  if (!grid()) return;
+  grid().innerHTML = '';
+  const filtered = pairsCache.filter((pair) => {
+    const val = timeframeValue(pair, currentFrame);
+    return val !== null && !Number.isNaN(val);
+  });
+  const sorted = filtered.sort((a, b) => timeframeValue(b, currentFrame) - timeframeValue(a, currentFrame));
+  sorted.slice(0, 48).forEach((pair) => {
+    const pct = timeframeValue(pair, currentFrame);
+    const pctText = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
+    const price = convertAmount(pair.priceUsd || pair.price || 0);
+    const mcap = convertAmount(pair.fdv || pair.marketCap);
+    const liq = convertAmount(pair.liquidity?.usd);
+    const vol = convertAmount(pair.volume?.h24);
+    const title = buildTitle(pair);
+    const logo = pair.logoUrl || genericLogo;
+    const age = computeAgeText(pair.createdAtMs);
+    const el = document.createElement('div');
+    el.className = 'glass token-card';
+    el.innerHTML = `
+      <div class="token-head">
+        <img class="token-logo" src="${logo}" alt="${title}">
+        <div>
+          <h3>${title}</h3>
+          <div class="small muted">${pair.chainId || 'solana'}</div>
+        </div>
+        <span class="badge">${age}</span>
+      </div>
+      <div class="stat-grid">
+        <div>price<br><strong>${currencySymbol()}${price !== null ? price.toFixed(6) : '—'}</strong></div>
+        <div>mcap<br><strong>${currencySymbol()}${formatMoney(mcap)}</strong></div>
+        <div>liq<br><strong>${currencySymbol()}${formatMoney(liq)}</strong></div>
+        <div>vol 24h<br><strong>${currencySymbol()}${formatMoney(vol)}</strong></div>
+      </div>
+      <div class="meta-row" style="margin-top:8px;">
+        <span class="percent ${percentClass(Number(pct || 0))}">${pctText}</span>
+        <div class="meta-links">
+          <a href="${pair.url}" class="small" target="_blank">dex</a>
+          <a href="https://pump.fun/${pair.baseToken?.address || ''}" class="small" target="_blank">pump.fun</a>
+        </div>
+      </div>
+    `;
+    el.addEventListener('click', () =>
+      openTokenModal(pair, {
+        currency,
+        currencySymbol: currencySymbol(),
+        convertAmount,
+        genericLogo,
+      })
+    );
+    grid().appendChild(el);
+  });
+};
+
+const fetchPairs = async () => {
+  const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana');
+  const data = await res.json();
+  pairsCache =
+    data?.pairs?.map((p) => {
+      const createdAtMs =
+        p.pairCreatedAt ||
+        (p.info?.createdAt ? Number(p.info.createdAt) * 1000 : null) ||
+        (p.info?.ageSeconds ? Date.now() - Number(p.info.ageSeconds) * 1000 : null) ||
+        null;
+      const logoUrl = p.info?.imageUrl || p.baseToken?.logoURI || p.icon || null;
+      const sparkline = p.info?.priceChange?.sparkline7d || p.sparkline || null;
+      return {
+        ...p,
+        createdAtMs,
+        logoUrl,
+        sparkline,
+      };
+    }) || [];
+  renderPairs();
+};
+
+const setupTabs = () => {
+  let startX = 0;
+  tabs().forEach((tab) => {
+    tab.addEventListener('click', () => {
+      tabs().forEach((t) => t.classList.remove('active'));
+      tab.classList.add('active');
+      currentFrame = tab.dataset.frame;
+      renderPairs();
+    });
+  });
+  const tabRow = document.getElementById('timeTabs');
+  tabRow.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX));
+  tabRow.addEventListener('touchend', (e) => {
+    const diff = e.changedTouches[0].clientX - startX;
+    const idx = Array.from(tabs()).findIndex((t) => t.classList.contains('active'));
+    if (Math.abs(diff) > 60) {
+      const nextIdx = diff < 0 ? Math.min(tabs().length - 1, idx + 1) : Math.max(0, idx - 1);
+      tabs().forEach((t) => t.classList.remove('active'));
+      tabs()[nextIdx].classList.add('active');
+      currentFrame = tabs()[nextIdx].dataset.frame;
+      renderPairs();
+    }
+  });
+};
+
+const setupCurrencySelector = () => {
+  currencyButtons().forEach((btn) => {
+    btn.addEventListener('click', async () => {
+      currencyButtons().forEach((b) => b.classList.remove('active'));
+      btn.classList.add('active');
+      currency = btn.dataset.currency;
+      await fetchRates();
+      renderPairs();
+    });
+  });
+};
+
+window.addEventListener('DOMContentLoaded', async () => {
+  await fetchRates();
+  setupTabs();
+  setupCurrencySelector();
+  fetchPairs();
+  setInterval(fetchPairs, 30000);
+});
+
+// expose currency helpers for modal
+window.getDisplayCurrencySymbol = currencySymbol;
+window.convertDisplayAmount = convertAmount;
+window.genericTokenLogo = genericLogo;
