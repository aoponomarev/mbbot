// Сплэш-экран с защитой паролем
window.cmpSplash = function () {
  // Хеш пароля "2211" (SHA-256)
  const PASSWORD_HASH = 'ac1964eb089654e01f7bfb4871e0cd31ea4d2aa6e6e48774b6b9917b1341dbf6';

  // Функция хеширования пароля (SHA-256)
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  return {
    data: {
      showSplash: true,
      passwordInput: '',
      passwordError: false
    },
    methods: {
      async checkPassword() {
        if (!this.passwordInput.trim()) {
          return;
        }

        const inputHash = await hashPassword(this.passwordInput);
        
        if (inputHash === PASSWORD_HASH) {
          // Пароль верный - запускаем анимацию сползания
          this.passwordError = false;
          const splashElement = document.getElementById('splash-screen');
          if (splashElement) {
            splashElement.style.transition = 'transform 0.5s ease-out';
            splashElement.style.transform = 'translateY(100%)';
            setTimeout(() => {
              this.showSplash = false;
            }, 500);
          }
        } else {
          // Пароль неверный
          this.passwordError = true;
          this.passwordInput = '';
          setTimeout(() => {
            this.passwordError = false;
          }, 2000);
        }
      },
      handleKeyPress(event) {
        if (event.key === 'Enter') {
          this.checkPassword();
        }
      }
    },
    mounted(app) {
      // Проверяем, был ли уже введён пароль в этой сессии
      const sessionAuth = sessionStorage.getItem('app_authenticated');
      if (sessionAuth === 'true') {
        this.showSplash = false;
      }
    },
    watch: {
      showSplash(newValue) {
        if (!newValue) {
          // Сохраняем в sessionStorage, чтобы не показывать сплэш при перезагрузке в той же сессии
          sessionStorage.setItem('app_authenticated', 'true');
        }
      }
    }
  };
};
