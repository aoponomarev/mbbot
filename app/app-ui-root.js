// Инициализация приложения: сборка из компонентных скриптов (обычные <script>, без module/fetch)
(function () {
  const fallbackConfig = {
    defaults: {
      theme: 'light',
      perplexityModel: 'sonar-pro',
      defaultApiKey: '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'
    },
    models: [
      { value: 'sonar-pro', label: 'sonar-pro' },
      { value: 'sonar', label: 'sonar' },
      { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
      { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
    ]
  };

  const cfg = window.appConfig || fallbackConfig;
  const defaults = cfg.defaults || fallbackConfig.defaults;
  const models = Array.isArray(cfg.models) ? cfg.models : fallbackConfig.models;

  const parts = [
    window.cmpTheme && window.cmpTheme(defaults),
    // window.cmpSplash больше не используется как часть - теперь это отдельный компонент
    window.cmpPerplexitySettings && window.cmpPerplexitySettings(defaults, models),
    window.cmpChat && window.cmpChat(),
    window.cmpImportExport && window.cmpImportExport(),
    window.cmpCoinGecko && window.cmpCoinGecko()
  ].filter(Boolean);

  const baseData = {
    vueVersion: '3.5.25',
    lastCommitMessage: (cfg.lastCommitMessage || '').trim()
  };
  const data = Object.assign(baseData, ...parts.map(p => p.data || {}));
  const methods = Object.assign({}, ...parts.map(p => p.methods || {}));
  const watch = Object.assign({}, ...parts.map(p => p.watch || {}));
  const mountedFns = parts.map(p => p.mounted).filter(Boolean);

  const { createApp } = Vue;

  const app = createApp({
    data() {
      return Object.assign({}, data);
    },
    methods,
    watch,
    mounted() {
      this.vueVersion = Vue.version || '3.x';
      mountedFns.forEach(fn => {
        if (typeof fn === 'function') {
          fn.call(this, this);
        }
      });
      console.log('Vue.js загружен:', this.vueVersion);
      console.log('Bootstrap загружен');
      console.log('Font Awesome загружен');
    }
  });

  // Регистрация компонента сплэш-экрана
  if (window.cmpSplash) {
    try {
      app.component('splash-screen', window.cmpSplash);
      console.log('Splash screen component registered');
    } catch (error) {
      console.error('Ошибка при регистрации компонента сплэша:', error);
    }
  } else {
    console.warn('window.cmpSplash not found');
  }

  // Регистрация компонента футера
  if (window.cmpFooter) {
    try {
      app.component('app-footer', window.cmpFooter);
      console.log('Footer component registered');
    } catch (error) {
      console.error('Ошибка при регистрации компонента футера:', error);
    }
  } else {
    console.warn('window.cmpFooter not found');
  }

  app.mount('#app');
})();
