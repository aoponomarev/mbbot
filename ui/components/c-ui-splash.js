// Сплэш-экран с защитой паролем и настройкой API-ключа
// Vue компонент с x-template шаблоном
window.cmpSplash = {
  template: '#splash-template',

  props: {
    lastCommitMessage: {
      type: String,
      default: ''
    },
    perplexityModel: {
      type: String,
      default: 'sonar-pro'
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
      quote: '',
      quoteAuthor: '',
      quoteLoading: false,
      quoteError: false,
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
        // После загрузки ключа запрашиваем цитату для проверки Perplexity
        this.fetchQuote();
      }
    },

    // Запрос цитаты из классических произведений для проверки работы Perplexity
    async fetchQuote() {
      if (!this.apiKeyPerplexity || !this.lastCommitMessage) {
        return;
      }

      this.quoteLoading = true;
      this.quoteError = false;

      try {
        const prompt = `Найди в классических произведениях (литература, философия, медицина, политика, финансы, etc...) остроумную цитату, которая продолжает или дополняет смысл следующего текста: "${this.lastCommitMessage}". Ответ должен быть в формате: сначала цитата в кавычках, затем через тире автор. Пример: "Текст цитаты" — Автор. Цитата должна быть короткой (1-2 предложения) и действительно остроумно дополнять смысл.`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKeyPerplexity}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model: this.perplexityModel || 'sonar-pro',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
          const answer = data.choices[0].message.content.trim();
          
          // Парсим ответ: ищем цитату в кавычках и автора после тире
          // Поддерживаем разные форматы: "цитата" — Автор или "цитата" - Автор
          const quoteMatch = answer.match(/"([^"]+)"/);
          const authorMatch = answer.match(/[—–-]\s*([^—–-\n]+?)(?:\.|$)/);
          
          if (quoteMatch) {
            this.quote = quoteMatch[1].trim();
            if (authorMatch) {
              this.quoteAuthor = authorMatch[1].trim().replace(/\.$/, '');
            } else {
              // Пытаемся найти автора после кавычек
              const afterQuote = answer.substring(answer.indexOf('"') + quoteMatch[0].length);
              const authorMatch2 = afterQuote.match(/[—–-]\s*([^—–-\n]+?)(?:\.|$)/);
              if (authorMatch2) {
                this.quoteAuthor = authorMatch2[1].trim().replace(/\.$/, '');
              }
            }
          } else {
            // Если формат не распознан, пытаемся извлечь цитату и автора другим способом
            const parts = answer.split(/[—–-]/);
            if (parts.length >= 2) {
              this.quote = parts[0].replace(/"/g, '').trim();
              this.quoteAuthor = parts[1].trim().replace(/\.$/, '');
            } else {
              // Используем весь ответ как цитату
              this.quote = answer.replace(/"/g, '').trim();
            }
          }
        } else {
          throw new Error('Пустой ответ от API');
        }
      } catch (error) {
        console.error('Ошибка при запросе цитаты:', error);
        this.quoteError = true;
        // Не блокируем вход, просто не показываем цитату
      } finally {
        this.quoteLoading = false;
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

        // После сохранения ключа запрашиваем цитату для проверки Perplexity
        this.fetchQuote();

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
