// Сплэш-экран с защитой паролем
window.cmpSplash = function () {
  const PASSWORD = '2211';
  window.appUnlocked = false;

  return {
    data: {
      showSplash: true,
      passwordInput: '',
      passwordError: false
    },
    methods: {
      checkPassword() {
        if (!this.passwordInput.trim()) {
          return;
        }

        if (this.passwordInput === PASSWORD) {
          this.passwordError = false;
          const splashElement = document.getElementById('splash-screen');
          if (splashElement) {
            splashElement.style.transition = 'transform 0.5s ease-out';
            splashElement.style.transform = 'translateY(100%)';
            setTimeout(() => {
              this.showSplash = false;
              window.appUnlocked = true;
              window.dispatchEvent(new Event('app-unlocked'));
            }, 500);
          }
        } else {
          this.passwordError = true;
          this.passwordInput = '';
          setTimeout(() => {
            this.passwordError = false;
          }, 2000);
        }
      }
    },
    mounted() {
      this.passwordError = false;
    }
  };
};
