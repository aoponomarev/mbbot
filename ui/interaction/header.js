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
      ],
      // Состояние открытия dropdown для мобильной версии
      showModelDropdown: false,
      showTabDropdown: false,
      // Уникальные ID для dropdown
      modelDropdownId: 'modelDropdown-' + Math.random().toString(36).substr(2, 9),
      tabDropdownId: 'tabDropdown-' + Math.random().toString(36).substr(2, 9)
    };
  },

  methods: {
    // Переключение вкладки отображения
    switchTab(tabId) {
      this.activeTab = tabId;
      this.showTabDropdown = false;
      // TODO: реализовать переключение контента
      this.$nextTick(() => {
        this.adjustSelectWidths();
      });
    },

    // Переключение математической модели
    switchModel(modelId) {
      this.selectedModel = modelId;
      this.showModelDropdown = false;
      // TODO: реализовать переключение модели
      this.$nextTick(() => {
        this.adjustSelectWidths();
      });
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
    },

    // Установка точной ширины селектов и dropdown кнопок на основе выбранного значения
    adjustSelectWidths() {
      // Создаем временный элемент для измерения ширины текста
      const measureEl = document.createElement('span');
      measureEl.style.visibility = 'hidden';
      measureEl.style.position = 'absolute';
      measureEl.style.whiteSpace = 'nowrap';
      measureEl.style.fontSize = '0.875rem'; // form-select-sm / btn-sm
      measureEl.style.fontFamily = 'inherit';
      measureEl.style.fontWeight = '400';
      document.body.appendChild(measureEl);

      // Устанавливаем ширину для селекта математической модели (десктоп)
      const modelSelect = this.$el?.querySelector('select.header-select-model');
      if (modelSelect) {
        measureEl.textContent = this.selectedModelLabel;
        const textWidth = measureEl.offsetWidth;
        modelSelect.style.width = (textWidth + 48) + 'px'; // +48px для padding и стрелки
      }

      // Устанавливаем ширину для dropdown кнопки математической модели (мобильная версия)
      const modelDropdownBtn = this.$el?.querySelector('button.header-select-model');
      if (modelDropdownBtn) {
        measureEl.textContent = this.selectedModelLabel;
        const textWidth = measureEl.offsetWidth;
        modelDropdownBtn.style.width = (textWidth + 24) + 'px'; // +24px для padding и стрелки (уменьшено)
      }

      // Устанавливаем ширину для dropdown кнопки вкладок (мобильная версия)
      const tabDropdownBtn = this.$el?.querySelector('button.header-select-tab');
      if (tabDropdownBtn) {
        measureEl.textContent = this.selectedTabLabel;
        const textWidth = measureEl.offsetWidth;
        tabDropdownBtn.style.width = (textWidth + 24) + 'px'; // +24px для padding и стрелки (уменьшено)
      }

      document.body.removeChild(measureEl);
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
    },

    // Текущая метка выбранной математической модели
    selectedModelLabel() {
      const model = this.mathModels.find(m => m.id === this.selectedModel);
      return model ? model.label : 'Медиана';
    },

    // Текущая метка выбранной вкладки
    selectedTabLabel() {
      const tab = this.displayTabs.find(t => t.id === this.activeTab);
      if (!tab) return '%';
      // В мобильной версии "Компл. дельты" заменяем на "Дельты"
      if (tab.id === 'complex-deltas') {
        return 'Дельты';
      }
      return tab.label;
    }
  },

  // Отслеживаем изменения темы для обновления computed свойств
  watch: {
    '$root.theme'() {
      // Принудительно обновляем computed свойства при изменении темы
      this.$forceUpdate();
    },
    // Отслеживаем изменения выбранных значений для обновления ширины
    selectedModel() {
      this.$nextTick(() => {
        this.adjustSelectWidths();
      });
    },
    activeTab() {
      this.$nextTick(() => {
        this.adjustSelectWidths();
      });
    }
  },

  mounted() {
    // Подписываемся на изменения темы через watch корневого компонента
    if (this.$root && this.$root.$watch) {
      this.$root.$watch('theme', () => {
        this.$forceUpdate();
      });
    }
    
    // Устанавливаем точную ширину селектов на основе выбранного значения
    this.$nextTick(() => {
      this.adjustSelectWidths();
    });
  }
};
