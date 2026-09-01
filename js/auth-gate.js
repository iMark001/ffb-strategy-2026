/**
 * Fulfillment-Box Strategy 2026 — Security Access Gate
 * Cryptographic SHA-256 session protection for confidential company data.
 */

(function() {
  const VALID_HASHES = [
    'a9cd6b3d2f04f5dc398b5ec1c34e1d44efde9e88337d67670c24e7c816b6d942', // FFB2026
    '5202c0dca360c1af1d94e31b5964e9e8f7da6081108f9bd3e30f969380e7dcaf'  // ffb2026
  ];

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isAuthorized() {
    const token = sessionStorage.getItem('ffb_auth_token');
    return token && VALID_HASHES.includes(token);
  }

  // If already authorized, let page render
  if (isAuthorized()) {
    return;
  }

  // If not authorized, hide content and create modal
  const hideStyle = document.createElement('style');
  hideStyle.id = 'auth-gate-style';
  hideStyle.textContent = `
    body > *:not(#authGateModal) {
      display: none !important;
    }
    #authGateModal {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #090a0f 70%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .auth-card {
      background: rgba(17, 19, 26, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 36px 32px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      text-align: center;
      animation: authFadeIn 0.3s ease-out;
    }
    @keyframes authFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .auth-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #a5b4fc;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
    }
    .auth-title {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0 0 8px;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .auth-desc {
      font-size: 0.86rem;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0 0 24px;
    }
    .auth-input-wrap {
      position: relative;
      margin-bottom: 16px;
    }
    .auth-input {
      width: 100%;
      box-sizing: border-box;
      background: #090a0f;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 13px 16px;
      font-size: 1rem;
      color: #f8fafc;
      outline: none;
      transition: all 0.2s ease;
      text-align: center;
      letter-spacing: 0.1em;
    }
    .auth-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }
    .auth-btn {
      width: 100%;
      background: #6366f1;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 13px;
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }
    .auth-btn:hover {
      background: #4f46e5;
      transform: translateY(-1px);
    }
    .auth-btn:active {
      transform: translateY(0);
    }
    .auth-error {
      margin-top: 12px;
      font-size: 0.8rem;
      color: #ef4444;
      display: none;
      font-weight: 600;
    }
    .auth-error.visible {
      display: block;
      animation: authShake 0.3s ease;
    }
    @keyframes authShake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(hideStyle);

  document.addEventListener('DOMContentLoaded', () => {
    if (isAuthorized()) {
      const s = document.getElementById('auth-gate-style');
      if (s) s.remove();
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'authGateModal';
    modal.innerHTML = `
      <div class="auth-card">
        <div class="auth-badge">🔒 Конфиденциальный доступ</div>
        <div class="auth-title">Fulfillment-Box 2026</div>
        <div class="auth-desc">Управленческий аудит и коммерческая стратегия.<br>Введите пароль для доступа к материалам:</div>
        <form id="authGateForm">
          <div class="auth-input-wrap">
            <input type="password" id="authPassInput" class="auth-input" placeholder="Введите пароль" autofocus required autocomplete="current-password">
          </div>
          <button type="submit" class="auth-btn">Войти в стратегию &rarr;</button>
          <div class="auth-error" id="authErrorMsg">⚠️ Неверный пароль доступа. Попробуйте еще раз.</div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const form = document.getElementById('authGateForm');
    const input = document.getElementById('authPassInput');
    const errorMsg = document.getElementById('authErrorMsg');

    input.focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = input.value;
      const hash = await sha256(val);

      if (VALID_HASHES.includes(hash)) {
        sessionStorage.setItem('ffb_auth_token', hash);
        modal.remove();
        const s = document.getElementById('auth-gate-style');
        if (s) s.remove();
      } else {
        errorMsg.classList.add('visible');
        input.value = '';
        input.focus();
      }
    });
  });
})();
