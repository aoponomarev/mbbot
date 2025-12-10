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
    // window.cmpPerplexitySettings больше не используется как часть - теперь это отдельный компонент
    // window.cmpChat удален - чат с Perplexity AI убран из интерфейса
    window.cmpImportExport && window.cmpImportExport()
    // window.cmpCoinGecko больше не используется как часть - теперь это отдельный компонент
  ].filter(Boolean);

  const baseData = {
    vueVersion: '3.5.25',
    lastCommitMessage: (cfg.lastCommitMessage || '').trim(),
    showSettings: false, // Показывать ли настройки (по умолчанию false - показываем CoinGecko)
    activeTab: 'percent' // Активная вкладка отображения (по умолчанию "%")
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

  // Регистрация компонента хэдера
  if (window.cmpHeader) {
    try {
      app.component('app-header', window.cmpHeader);
      console.log('Header component registered');
    } catch (error) {
      console.error('Ошибка при регистрации компонента хэдера:', error);
    }
  } else {
    console.warn('window.cmpHeader not found');
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

  // Регистрация компонента общих настроек проекта
  if (window.cmpSettings) {
    try {
      app.component('app-settings', window.cmpSettings);
      console.log('Settings component registered');
    } catch (error) {
      console.error('Ошибка при регистрации компонента настроек:', error);
    }
  } else {
    console.warn('window.cmpSettings not found');
  }

  // Регистрация компонента виджета CoinGecko
  if (window.cmpCoinGecko) {
    try {
      app.component('app-coingecko', window.cmpCoinGecko);
      console.log('CoinGecko component registered');
    } catch (error) {
      console.error('Ошибка при регистрации компонента CoinGecko:', error);
    }
  } else {
    console.warn('window.cmpCoinGecko not found');
  }

  // Сохраняем ссылку на приложение в window для доступа из компонентов
  window.app = app;

  // Монтируем приложение и сохраняем ссылку на корневой компонент
  const rootInstance = app.mount('#app');
  window.appRoot = rootInstance;
})();
