(function(){
  const html = document.documentElement;
  const getSaved = () => localStorage.getItem('psv4-theme') || 'dark';
  const setTheme = (mode) => {
    html.setAttribute('data-theme', mode);
    localStorage.setItem('psv4-theme', mode);
    updateToggle(mode);
  };

  const updateToggle = (mode) => {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.innerHTML = mode === 'light'
        ? '☀️ light <small>light mode ig 😭</small>'
        : '🌙 dark <small>dark mode fr 🔥</small>';
    });
  };

  window.toggleTheme = () => {
    const next = (getSaved() === 'dark') ? 'light' : 'dark';
    setTheme(next);
  };

  window.ensureLogin = () => {
    const user = localStorage.getItem('psv4-user');
    if(!user && !location.pathname.endsWith('login.html')){
      location.href = 'login.html';
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    setTheme(getSaved());
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
    const burger = document.querySelector('.hamburger');
    if(burger){
      burger.addEventListener('click', () => {
        const nav = document.querySelector('.nav-links');
        nav?.classList.toggle('active');
      });
    }
  });
})();

