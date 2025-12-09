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
      quoteLoading: false,
      quoteError: false,
      showApiKeyTemporarily: false,
      loadingDots: 1,
      loadingDotsInterval: null,
      DEFAULT_PIN,
      PIN_LENGTH,
      STORAGE_KEY_PIN,
      STORAGE_KEY_API
    };
  },
  methods: {
    // Инициализация PIN по умолчанию (если не установлен)
    initDefaultPin() {
      if (!window.securityObfuscate) {
        console.warn('securityObfuscate not loaded yet');
        return;
      }
      
      try {
        if (!window.securityObfuscate.hasSecure(this.STORAGE_KEY_PIN)) {
          window.securityObfuscate.saveSecure(this.STORAGE_KEY_PIN, this.DEFAULT_PIN);
        }
      } catch (error) {
        console.error('Ошибка при инициализации PIN:', error);
        // Не блокируем работу компонента
      }
    },

    // Загрузка сохраненного API-ключа
    loadApiKey() {
      // Безопасная проверка наличия securityObfuscate
      if (!window.securityObfuscate) {
        console.warn('securityObfuscate not loaded yet');
        return;
      }
      
      try {
        const savedKey = window.securityObfuscate.loadSecure(this.STORAGE_KEY_API);
        if (savedKey) {
          this.apiKeyPerplexity = savedKey;
          this.apiKeyPerplexitySaved = true;
          // После загрузки ключа запрашиваем цитату для проверки Perplexity
          // Используем $nextTick чтобы убедиться, что props загружены
          this.$nextTick(() => {
            if (this.lastCommitMessage && this.lastCommitMessage.trim()) {
              this.fetchQuote();
            }
          });
        }
      } catch (error) {
        console.error('Ошибка при загрузке API ключа:', error);
        // Не блокируем работу компонента
      }
    },

    // Генерация псевдо-философского высказывания как продолжение коммита
    async fetchQuote() {
      // Безопасная проверка перед запросом
      if (!this.apiKeyPerplexity || !this.lastCommitMessage || !this.lastCommitMessage.trim()) {
        return;
      }

      this.quoteLoading = true;
      this.quoteError = false;
      this.quote = '';
      this.quoteAuthor = '';
      this.startLoadingDots();

      const apiHeaders = {
        'Authorization': `Bearer ${this.apiKeyPerplexity}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const model = this.perplexityModel || 'sonar-pro';

      try {
        // Генерируем псевдо-философское высказывание (одно длинное предложение) как продолжение коммита
        const quotePrompt = `Create a pseudo-philosophical statement (one longer sentence, approximately 30 words) that interprets, develops, or philosophically expands the meaning of the following text: "${this.lastCommitMessage}".

CRITICAL REQUIREMENTS:
- Your response must contain EXACTLY one sentence
- The sentence should be approximately 30 words (not less than 25, not more than 35)
- DO NOT repeat or quote the original text - develop the idea philosophically instead
- DO NOT start with the same words as the original text
- Interpret, expand, or create a philosophical narrative that relates to the original meaning
- Start with a capital letter
- End with a period
- Without quotation marks, without any additional explanations
- It should read as a philosophical continuation that develops the underlying idea, not a literal repetition

Example: If the original text is "Add feature to app", your response should be something like "For in the pursuit of understanding, we often discover that the path itself becomes the destination, and in this discovery we find ourselves questioning whether the journey was ever truly about reaching an end, or if the very act of seeking transforms us in ways we never anticipated."`;

        const quoteResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: quotePrompt
              }
            ]
          })
        });

        if (!quoteResponse.ok) {
          throw new Error(`HTTP ${quoteResponse.status}`);
        }

        const quoteData = await quoteResponse.json();

        if (!quoteData.choices || quoteData.choices.length === 0) {
          throw new Error('Empty response from API');
        }

        const quoteAnswer = quoteData.choices[0].message.content.trim();
        
        // Убираем кавычки если они есть, берем весь текст
        let cleanQuote = quoteAnswer.replace(/^["']|["']$/g, '').trim();
        
        // Убеждаемся, что цитата начинается с большой буквы
        if (cleanQuote && cleanQuote.length > 0) {
          cleanQuote = cleanQuote.charAt(0).toUpperCase() + cleanQuote.slice(1);
        }
        
        // Убеждаемся, что цитата заканчивается точкой
        if (cleanQuote && !cleanQuote.endsWith('.')) {
          cleanQuote = cleanQuote + '.';
        }
        
        if (cleanQuote && cleanQuote.length > 10) {
          this.quote = cleanQuote;
        } else {
          throw new Error('Failed to extract quote from response');
        }
      } catch (error) {
        console.error('fetchQuote: Error', error);
        this.quoteError = true;
        this.quote = '';
        // Не блокируем вход, просто не показываем цитату
      } finally {
        this.quoteLoading = false;
        this.stopLoadingDots();
      }
    },

    // Обработка вставки текста в поле API ключа - временно показываем текст
    handleApiKeyPaste(event) {
      // Временно показываем текст после вставки
      this.showApiKeyTemporarily = true;
      
      // Через 2 секунды скрываем обратно
      setTimeout(() => {
        this.showApiKeyTemporarily = false;
      }, 2000);
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
        if (this.lastCommitMessage && this.lastCommitMessage.trim()) {
          this.fetchQuote();
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

    // Индикатор загрузки из точек (1,2,3,4,5 циклично)
    startLoadingDots() {
      this.loadingDots = 1;
      if (this.loadingDotsInterval) {
        clearInterval(this.loadingDotsInterval);
      }
      this.loadingDotsInterval = setInterval(() => {
        this.loadingDots = (this.loadingDots % 5) + 1;
      }, 500); // Меняем каждые 500мс
    },

    stopLoadingDots() {
      if (this.loadingDotsInterval) {
        clearInterval(this.loadingDotsInterval);
        this.loadingDotsInterval = null;
      }
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
    try {
      // Гарантируем, что сплэш показывается при монтировании
      this.showSplash = true;
      this.passwordError = false;
      this.initDefaultPin();
      this.loadApiKey();
      this.focusInput();
      console.log('Splash screen mounted, showSplash:', this.showSplash);
    } catch (error) {
      console.error('Ошибка при монтировании сплэша:', error);
      // Гарантируем, что сплэш показывается даже при ошибке
      this.showSplash = true;
    }
  },

  computed: {
    loadingDotsString() {
      return '.'.repeat(this.loadingDots);
    }
  },

  watch: {
    showSplash(newValue) {
      if (newValue) {
        this.focusInput();
      }
    }
  },

  beforeUnmount() {
    // Очищаем интервал при размонтировании компонента
    this.stopLoadingDots();
  }
};
