// Настройки Perplexity: ключ, модель, список моделей
// Примечание: API-ключ хранится обфусцированным через u-sec-obfuscate.js
window.cmpPerplexitySettings = function (defaults, modelsList) {
  const STORAGE_KEY_API = 'perplexity-api-key';
  const fallback = {
    model: 'sonar-pro',
    apiKey: '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'
  };

  const models = Array.isArray(modelsList) && modelsList.length > 0 ? modelsList : [
    { value: 'sonar-pro', label: 'sonar-pro' },
    { value: 'sonar', label: 'sonar' }
  ];

  return {
    data: {
      perplexityApiKey: '',
      perplexityModel: (defaults && defaults.perplexityModel) || fallback.model,
      models,
      showApiKey: false
    },
    methods: {
      saveApiKey() {
        if (this.perplexityApiKey) {
          // Используем обфусцированное хранилище для безопасности
          window.securityObfuscate.saveSecure(STORAGE_KEY_API, this.perplexityApiKey);
        } else {
          window.securityObfuscate.removeSecure(STORAGE_KEY_API);
        }
      },
      toggleApiKeyVisibility() {
        this.showApiKey = !this.showApiKey;
        const input = document.getElementById('apiKey');
        if (input) {
          input.type = this.showApiKey ? 'text' : 'password';
        }
      }
    },
    mounted(app) {
      // Загружаем API-ключ из обфусцированного хранилища
      const savedApiKey = window.securityObfuscate.loadSecure(STORAGE_KEY_API);
      if (savedApiKey) {
        app.perplexityApiKey = savedApiKey;
      } else if (defaults && defaults.defaultApiKey) {
        app.perplexityApiKey = defaults.defaultApiKey;
        window.securityObfuscate.saveSecure(STORAGE_KEY_API, defaults.defaultApiKey);
      } else {
        app.perplexityApiKey = fallback.apiKey;
        window.securityObfuscate.saveSecure(STORAGE_KEY_API, fallback.apiKey);
      }

      const savedModel = localStorage.getItem('perplexityModel');
      if (savedModel) {
        app.perplexityModel = savedModel;
      }
    },
    watch: {
      perplexityModel(newModel) {
        localStorage.setItem('perplexityModel', newModel);
      }
    }
  };
};
