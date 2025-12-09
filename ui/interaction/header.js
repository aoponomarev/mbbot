// Хэдер приложения с гамбургером, вкладками и кнопками управления
// Vue компонент с x-template шаблоном
// Всегда в темной теме (не реагирует на переключалку темы)
window.cmpHeader = {
  template: '#header-template',

  data() {
    return {
      // Выбранная математическая модель
      selectedModel: 'median', // 'median' или 'news'
      // Математические модели
      mathModels: [
        { id: 'median', label: 'Медиана' },
        { id: 'news', label: 'Новости' }
      ],
      // Активная вкладка отображения
      activeTab: 'percent',
      // Вкладки отображения (как радиокнопки Bootstrap)
      displayTabs: [
        { id: 'percent', label: '%' },
        { id: 'complex-deltas', label: 'Компл. дельты' },
        { id: 'gradients', label: 'Градиенты' },
        { id: 'max', label: 'MAX' },
        { id: 'min', label: 'min' },
        { id: 'balance-delta', label: 'Баланс Δ' }
      ]
    };
  },

  methods: {
    // Переключение вкладки отображения
    switchTab(tabId) {
      this.activeTab = tabId;
      // TODO: реализовать переключение контента
    },

    // Переключение математической модели
    switchModel(modelId) {
      this.selectedModel = modelId;
      // TODO: реализовать переключение модели
    },

    // Открытие меню (гамбургер)
    toggleMenu() {
      // TODO: реализовать открытие бокового меню
      console.log('Menu toggle');
    },

    // Передача методов из родительского компонента через this.$root (Vue 3)
    refreshPage() {
      // Вызываем метод из корневого компонента приложения через this.$root
      if (this.$root && typeof this.$root.refreshPage === 'function') {
        this.$root.refreshPage();
      } else if (window.appRoot && typeof window.appRoot.refreshPage === 'function') {
        // Fallback: через window.appRoot (сохраненный корневой компонент)
        window.appRoot.refreshPage();
      }
    },

    toggleTheme() {
      // Вызываем метод из корневого компонента приложения через this.$root
      if (this.$root && typeof this.$root.toggleTheme === 'function') {
        this.$root.toggleTheme();
      } else if (window.appRoot && typeof window.appRoot.toggleTheme === 'function') {
        // Fallback: через window.appRoot (сохраненный корневой компонент)
        window.appRoot.toggleTheme();
      }
    },

    // Получение текущей темы из родительского компонента
    getCurrentTheme() {
      // Получаем тему из корневого компонента приложения через this.$root
      if (this.$root && this.$root.theme) {
        return this.$root.theme;
      } else if (window.appRoot && window.appRoot.theme) {
        // Fallback: через window.appRoot (сохраненный корневой компонент)
        return window.appRoot.theme;
      }
      // Fallback: из localStorage
      return localStorage.getItem('theme') || 'light';
    }
  },

  computed: {
    // Иконка темы в зависимости от текущей темы (реактивно обновляется)
    themeIcon() {
      // Используем this.$root для реактивности
      const root = this.$root || window.appRoot;
      const theme = root && root.theme ? root.theme : (localStorage.getItem('theme') || 'light');
      return theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    },

    // Подсказка для кнопки темы (реактивно обновляется)
    themeTitle() {
      // Используем this.$root для реактивности
      const root = this.$root || window.appRoot;
      const theme = root && root.theme ? root.theme : (localStorage.getItem('theme') || 'light');
      return theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему';
    }
  },

  // Отслеживаем изменения темы для обновления computed свойств
  watch: {
    '$root.theme'() {
      // Принудительно обновляем computed свойства при изменении темы
      this.$forceUpdate();
    }
  },

  mounted() {
    // Подписываемся на изменения темы через watch корневого компонента
    if (this.$root && this.$root.$watch) {
      this.$root.$watch('theme', () => {
        this.$forceUpdate();
      });
    }
  }
};

