// Сплэш-экран с защитой паролем и настройкой API-ключа
// Vue компонент с x-template шаблоном
window.cmpSplash = {
  template: '#splash-template',
  
  props: {
    lastCommitMessage: {
      type: String,
      default: ''
    }
  },
  
  data() {
    const DEFAULT_PIN = '2211';
    const PIN_LENGTH = DEFAULT_PIN.length;
    const STORAGE_KEY_PIN = 'app-pin';
    const STORAGE_KEY_API = 'perplexity-api-key';
    
    // Инициализация глобальной переменной разблокировки
    if (typeof window.appUnlocked === 'undefined') {
      window.appUnlocked = false;
    }
    
    return {
      showSplash: true,
      passwordInput: '',
      passwordError: false,
      apiKeyPerplexity: '',
      apiKeyPerplexitySaved: false,
      DEFAULT_PIN,
      PIN_LENGTH,
      STORAGE_KEY_PIN,
      STORAGE_KEY_API
    };
  },
  methods: {
    // Инициализация PIN по умолчанию (если не установлен)
    initDefaultPin() {
      if (!window.securityObfuscate.hasSecure(this.STORAGE_KEY_PIN)) {
        window.securityObfuscate.saveSecure(this.STORAGE_KEY_PIN, this.DEFAULT_PIN);
      }
    },

    // Загрузка сохраненного API-ключа
    loadApiKey() {
      const savedKey = window.securityObfuscate.loadSecure(this.STORAGE_KEY_API);
      if (savedKey) {
        this.apiKeyPerplexity = savedKey;
        this.apiKeyPerplexitySaved = true;
      }
    },

    // Сохранение API-ключа с обфускацией
    saveApiKey() {
      if (this.apiKeyPerplexity.trim()) {
        window.securityObfuscate.saveSecure(this.STORAGE_KEY_API, this.apiKeyPerplexity.trim());
        this.apiKeyPerplexitySaved = true;

        // Обновляем конфиг приложения (если нужно передать ключ в другие компоненты)
        if (window.appConfig) {
          window.appConfig.defaults.defaultApiKey = this.apiKeyPerplexity.trim();
        }

        setTimeout(() => {
          this.apiKeyPerplexitySaved = false;
        }, 2000);
      }
    },

    handlePinInput(event) {
      this.passwordInput = event.target.value;
      if (this.passwordInput.length >= this.PIN_LENGTH) {
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

      if (this.passwordInput.length < this.PIN_LENGTH) {
        return;
      }

      // Получаем сохраненный PIN из обфусцированного хранилища
      const correctPin = window.securityObfuscate.loadSecure(this.STORAGE_KEY_PIN) || this.DEFAULT_PIN;

      if (this.passwordInput === correctPin) {
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
    this.initDefaultPin();
    this.loadApiKey();
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
