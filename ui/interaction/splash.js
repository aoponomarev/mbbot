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

    // Определяем язык системы
    const systemLanguage = navigator.language || navigator.userLanguage || 'en';
    const languageCode = systemLanguage.split('-')[0].toLowerCase(); // "ru" из "ru-RU"
    
    // Маппинг кодов языков на названия для промпта
    const languageNames = {
      'ru': 'Russian',
      'en': 'English',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ko': 'Korean'
    };
    
    const targetLanguage = languageNames[languageCode] || 'English';

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
      systemLanguage: languageCode,
      targetLanguage: targetLanguage,
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
        // Генерируем одно предложение: начинается с философии, заканчивается предсказанием для пользователя
        const quotePrompt = `Create ONE sentence in ${this.targetLanguage} (approximately 40 words, but prioritize beauty and meaning over strict word count) based on the following text: "${this.lastCommitMessage}".

STRUCTURE REQUIREMENTS:
- The sentence must START with a philosophical reflection that interprets, develops, or philosophically expands the meaning of the original text
- The sentence must END with a personal prediction addressed directly to the user ("you", "your")
- The prediction must relate to the original text's theme but apply it to a DIFFERENT life sphere: medicine, economics, relationships, education, career, health, family, personal growth, creativity, spirituality, or other meaningful life areas
- The transition from philosophy to prediction should be smooth and logical

CRITICAL REQUIREMENTS:
- Your response must be written in ${this.targetLanguage}
- Your response must contain EXACTLY ONE sentence
- The sentence should be approximately 40 words, but can be slightly longer or shorter if it makes the statement more beautiful and meaningful
- DO NOT repeat or quote the original text - develop the idea philosophically instead
- DO NOT start with the same words as the original text
- The prediction must be POSITIVE, inspiring, and give hope
- Start with a capital letter
- End with a period
- Without quotation marks, without any additional explanations
- Address the user directly in the prediction part (use "you", "your", "your life", etc.)

Example structure: "For in the pursuit of understanding, we often discover that the path itself becomes the destination, and in this discovery you will find that your relationships will deepen in ways that mirror this same principle of growth through journey rather than destination."`;

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
      // Проверяем флаг пропуска сплэша (устанавливается при обновлении страницы через кнопку)
      const skipSplash = sessionStorage.getItem('skipSplash');
      if (skipSplash === 'true') {
        // Пропускаем сплэш и сразу разблокируем приложение
        this.showSplash = false;
        window.appUnlocked = true;
        sessionStorage.removeItem('skipSplash'); // Удаляем флаг после использования
        return;
      }
      
      // Гарантируем, что сплэш показывается при монтировании
      this.showSplash = true;
      this.passwordError = false;
      this.initDefaultPin();
      this.loadApiKey();
      this.focusInput();
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
      } else {
        // Level 2 migration (Step 3, case 2): при закрытии сплэша чистим его сообщения
        try {
          window.AppMessages?.clear?.('splash');
        } catch (e) {
          // ignore
        }
      }
    },

    // Level 2 migration (Step 3, case 2): passwordError -> AppMessages (scope: splash)
    passwordError(newValue) {
      if (!window.AppMessages) return;
      const id = 'splash_pin_error';
      if (newValue) {
        window.AppMessages.replace?.(id, { scope: 'splash', type: 'danger', text: 'Неверный код.' });
      } else {
        window.AppMessages.dismiss?.(id);
      }
    },

    // Level 2 migration (Step 3, case 2): quoteError -> AppMessages (scope: splash)
    quoteError(newValue) {
      if (!window.AppMessages) return;
      const id = 'splash_quote_error';
      if (newValue && !this.quoteLoading) {
        window.AppMessages.replace?.(id, { scope: 'splash', type: 'warning', text: 'Не удалось загрузить цитату.' });
      } else {
        window.AppMessages.dismiss?.(id);
      }
    },

    // Level 2 migration (Step 3, case 2): гарантируем, что сообщение quoteError появится
    // ПОСЛЕ завершения загрузки (quoteLoading=false), даже если quoteError выставился раньше.
    quoteLoading(newValue) {
      if (!window.AppMessages) return;
      const id = 'splash_quote_error';
      const shouldShow = Boolean(this.quoteError) && !Boolean(newValue);
      if (shouldShow) {
        window.AppMessages.replace?.(id, { scope: 'splash', type: 'warning', text: 'Не удалось загрузить цитату.' });
      } else {
        window.AppMessages.dismiss?.(id);
      }
    }
  },

  beforeUnmount() {
    // Очищаем интервал при размонтировании компонента
    this.stopLoadingDots();
  }
};
