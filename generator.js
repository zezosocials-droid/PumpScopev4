const memeGrid = () => document.getElementById('memeGrid');

const renderMemes = (memes=[]) => {
  memeGrid().innerHTML = memes.map(m=>`
    <div class="glass meme-card">
      <img src="${m.url}" alt="meme" loading="lazy">
      <div class="meta-row"><span class="small">${m.title || 'meme'}</span><span class="badge">made w/ pumpScope v4</span></div>
    </div>
  `).join('');
};

const fetchImgflip = async () => {
  const res = await fetch('https://api.imgflip.com/get_memes');
  const data = await res.json();
  return (data.data?.memes || []).slice(0,12).map(m => ({ url: m.url, title: m.name }));
};

const fetchReddit = async () => {
  const res = await fetch('https://www.reddit.com/r/memes/hot.json?limit=12');
  const data = await res.json();
  return data.data.children
    .filter(c=>!c.data.over_18)
    .map(c=>({ url: c.data.url, title: c.data.title }));
};

const fetchChaos = async () => {
  const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=pump.fun');
  const data = await res.json();
  const vols = (data.pairs||[]).map(p=>p.volume?.h24 || 0);
  const spike = Math.max(...vols, 0);
  document.getElementById('chaosMeter').textContent = `chaos meter: ${spike ? '$'+spike.toLocaleString() : '--'}`;
};

const loadTrending = async () => {
  const [imgflip, reddit] = await Promise.all([fetchImgflip(), fetchReddit()]);
  renderMemes([...(imgflip||[]), ...(reddit||[])]);
  fetchChaos();
};

const randomMeme = async () => {
  const res = await fetch('https://meme-api.com/gimme');
  const data = await res.json();
  renderMemes([{url:data.url, title:data.title}]);
};

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshTrending')?.addEventListener('click', loadTrending);
  document.getElementById('randomMeme')?.addEventListener('click', randomMeme);
  loadTrending();
});
