diff --git a/login.js b/login.js
new file mode 100644
index 0000000000000000000000000000000000000000..5329c520cfd8218d4646f903454c973cc11a58a1
--- /dev/null
+++ b/login.js
@@ -0,0 +1,26 @@
+window.addEventListener('DOMContentLoaded', () => {
+  const access = document.getElementById('accessCode');
+  const enterBtn = document.getElementById('enterAccess');
+  const error = document.getElementById('loginError');
+
+  const goHome = () => {
+    document.body.style.opacity = '0.6';
+    setTimeout(() => (window.location.href = 'index.html'), 250);
+  };
+
+  const validate = () => {
+    const code = (access.value || '').trim().toLowerCase();
+    if (code === 'zezombie') {
+      localStorage.setItem('pumpscope_authed', 'true');
+      goHome();
+    } else {
+      error.textContent = 'wrong code bro 💀';
+      error.classList.add('show');
+    }
+  };
+
+  enterBtn?.addEventListener('click', validate);
+  access?.addEventListener('keypress', (e) => {
+    if (e.key === 'Enter') validate();
+  });
+});

