// Сплэш-экран с защитой паролем
window.cmpSplash = function () {
  const PASSWORD = '2211';
  const PIN_LENGTH = PASSWORD.length;
  window.appUnlocked = false;

  return {
    data: {
      showSplash: true,
      passwordInput: '',
      passwordError: false
    },
    methods: {
      handlePinInput(event) {
        this.passwordInput = event.target.value;
        if (this.passwordInput.length >= PIN_LENGTH) {
          this.checkPassword();
        }
      },
      focusInput() {
        this.$nextTick(() => {
          const input = this.$refs.passwordField;
          if (input) {
            input.focus();
          }
        });
      },
      checkPassword() {
        if (!this.passwordInput.trim()) {
          return;
        }

        if (this.passwordInput.length < PIN_LENGTH) {
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
      this.focusInput();
    },
    watch: {
      showSplash(newValue) {
        if (newValue) {
          this.focusInput();
        }
      }
    }
  };
};
