// Настройки Perplexity: ключ, модель, список моделей
window.cmpPerplexitySettings = function (defaults, modelsList) {
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
          localStorage.setItem('perplexityApiKey', this.perplexityApiKey);
        } else {
          localStorage.removeItem('perplexityApiKey');
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
      const savedApiKey = localStorage.getItem('perplexityApiKey');
      if (savedApiKey) {
        app.perplexityApiKey = savedApiKey;
      } else if (defaults && defaults.defaultApiKey) {
        app.perplexityApiKey = defaults.defaultApiKey;
        localStorage.setItem('perplexityApiKey', defaults.defaultApiKey);
      } else {
        app.perplexityApiKey = fallback.apiKey;
        localStorage.setItem('perplexityApiKey', fallback.apiKey);
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
