window.addEventListener('DOMContentLoaded', () => {
  const access = document.getElementById('accessCode');
  const enterBtn = document.getElementById('enterAccess');
  const error = document.getElementById('loginError');

  const goHome = () => {
    document.body.style.opacity = '0.6';
    setTimeout(() => (window.location.href = 'index.html'), 250);
  };

  const validate = () => {
    const code = (access.value || '').trim().toLowerCase();
    if (code === 'zezombie') {
      localStorage.setItem('pumpscope_authed', 'true');
      goHome();
    } else {
      error.textContent = 'wrong code bro 💀';
      error.classList.add('show');
    }
  };

  enterBtn?.addEventListener('click', validate);
  access?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validate();
  });
});
