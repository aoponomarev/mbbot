// Компонент общих настроек проекта
// Vue компонент с x-template шаблоном
window.cmpSettings = {
  template: '#settings-template',

  data() {
    const STORAGE_KEY_API = 'perplexity-api-key';
    const fallback = {
      model: 'sonar-pro',
      apiKey: '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'
    };

    // Получаем конфигурацию из window.appConfig или используем fallback
    const cfg = window.appConfig || {};
    const defaults = cfg.defaults || fallback;
    const modelsList = cfg.models || [
      { value: 'sonar-pro', label: 'sonar-pro' },
      { value: 'sonar', label: 'sonar' }
    ];

    const models = Array.isArray(modelsList) && modelsList.length > 0 ? modelsList : [
      { value: 'sonar-pro', label: 'sonar-pro' },
      { value: 'sonar', label: 'sonar' }
    ];

    // Загружаем API-ключ из обфусцированного хранилища
    let initialApiKey = '';
    const savedApiKey = window.securityObfuscate?.loadSecure(STORAGE_KEY_API);
    if (savedApiKey) {
      initialApiKey = savedApiKey;
    } else if (defaults && defaults.defaultApiKey) {
      initialApiKey = defaults.defaultApiKey;
      window.securityObfuscate?.saveSecure(STORAGE_KEY_API, defaults.defaultApiKey);
    } else {
      initialApiKey = fallback.apiKey;
      window.securityObfuscate?.saveSecure(STORAGE_KEY_API, fallback.apiKey);
    }

    // Загружаем модель из localStorage
    const savedModel = localStorage.getItem('perplexityModel');
    const initialModel = savedModel || ((defaults && defaults.perplexityModel) || fallback.model);

    return {
      perplexityApiKey: initialApiKey,
      perplexityModel: initialModel,
      models,
      showApiKey: false,
      STORAGE_KEY_API
    };
  },

  methods: {
    syncApiKeyMessage() {
      if (!window.AppMessages) return;
      const id = 'settings_api_key_status';
      const hasKey = Boolean(String(this.perplexityApiKey || '').trim());
      if (hasKey) {
        window.AppMessages.replace?.(id, { scope: 'settings', type: 'success', text: 'API ключ настроен' });
      } else {
        window.AppMessages.replace?.(id, { scope: 'settings', type: 'warning', text: 'Для работы необходимо указать API ключ' });
      }
    },
    saveApiKey() {
      if (this.perplexityApiKey) {
        // Используем обфусцированное хранилище для безопасности
        window.securityObfuscate?.saveSecure(this.STORAGE_KEY_API, this.perplexityApiKey);
      } else {
        window.securityObfuscate?.removeSecure(this.STORAGE_KEY_API);
      }
    },
    toggleApiKeyVisibility() {
      this.showApiKey = !this.showApiKey;
      const input = this.$refs.apiKeyInput;
      if (input) {
        input.type = this.showApiKey ? 'text' : 'password';
      }
    },
    // Методы экспорта/импорта из корневого компонента
    exportSettings() {
      if (this.$root && typeof this.$root.exportSettings === 'function') {
        this.$root.exportSettings();
      } else if (window.appRoot && typeof window.appRoot.exportSettings === 'function') {
        window.appRoot.exportSettings();
      }
    },
    triggerImport() {
      if (this.$root && typeof this.$root.triggerImport === 'function') {
        this.$root.triggerImport();
      } else if (window.appRoot && typeof window.appRoot.triggerImport === 'function') {
        window.appRoot.triggerImport();
      }
    },
    importSettings(event) {
      if (this.$root && typeof this.$root.importSettings === 'function') {
        this.$root.importSettings(event);
      } else if (window.appRoot && typeof window.appRoot.importSettings === 'function') {
        window.appRoot.importSettings(event);
      }
    },
    closeImportStatus() {
      const root = this.$root || window.appRoot;
      if (root) {
        root.importStatus = null;
      }
    }
  },

  mounted() {
    this.syncApiKeyMessage();
  },

  computed: {
    importStatus() {
      const root = this.$root || window.appRoot;
      return root && root.importStatus ? root.importStatus : null;
    }
  },

  watch: {
    '$root.importStatus'() {
      this.$forceUpdate();
    },
    perplexityApiKey() {
      this.syncApiKeyMessage();
    },
    perplexityModel(newModel) {
      localStorage.setItem('perplexityModel', newModel);
    }
  }
};
