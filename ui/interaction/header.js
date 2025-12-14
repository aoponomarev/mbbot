// Хэдер приложения с гамбургером, вкладками и кнопками управления
// Vue компонент с x-template шаблоном
// Всегда в темной теме (не реагирует на переключалку темы)
window.cmpHeader = {
  template: '#header-template',

  props: {
    // Горизонт прогноза (передается из корневого компонента)
    horizonDays: {
      type: Number,
      default: 2,
      validator: (value) => value >= 1 && value <= 90
    }
  },

  emits: ['update:horizonDays'],

  data() {
    return {
      // Выбранная математическая модель
      selectedModel: 'median', // 'median' или 'news'
      // Математические модели
      mathModels: [
        { id: 'median', label: 'Медиана' },
        { id: 'news', label: 'Новости' }
      ],
      // Активная вкладка отображения (синхронизируется с корневым компонентом)
      // activeTab теперь хранится в корневом компоненте
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
      tabDropdownId: 'tabDropdown-' + Math.random().toString(36).substr(2, 9),
      // Экземпляры Bootstrap tooltips для управления
      tooltipInstances: []
    };
  },

  methods: {
    // Обработка изменения горизонта прогноза
    handleHorizonChange(newValue) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e7733f3e-f060-46bf-8fe8-79b2bd25ac6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'header.js:51',message:'handleHorizonChange called',data:{newValue,currentHorizonDays:this.horizonDays},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      this.$emit('update:horizonDays', newValue);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e7733f3e-f060-46bf-8fe8-79b2bd25ac6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'header.js:54',message:'handleHorizonChange emitted',data:{newValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    },
    
    // Переключение вкладки отображения
    switchTab(tabId) {
      const root = this.$root || window.appRoot;
      if (root) {
        root.activeTab = tabId;
        
        // При переключении на вкладку "%" или "Компл. дельты" всегда показываем CoinGecko (закрываем настройки)
        if (tabId === 'percent' || tabId === 'complex-deltas') {
          root.showSettings = false;
        }
      }
      
      this.showTabDropdown = false;
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

    // Открытие меню (гамбургер) - открывает настройки
    toggleMenu() {
      const root = this.$root || window.appRoot;
      if (root) {
        // Гамбургер только открывает настройки, не переключает
        // Настройки закрываются только при переключении на вкладку "%"
        root.showSettings = true;
      }
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

    // Получение инверсной темы для dropdown и tooltips (инверсны включенной теме)
    getInverseTheme() {
      const currentTheme = this.getCurrentTheme();
      return currentTheme === 'light' ? 'dark' : 'light';
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
    },

    // Инициализация Bootstrap tooltips с инверсной темой
    initTooltips() {
      // Уничтожаем существующие tooltips
      if (this.tooltipInstances && this.tooltipInstances.length > 0) {
        this.tooltipInstances.forEach(instance => {
          if (instance && typeof instance.dispose === 'function') {
            instance.dispose();
          }
        });
      }
      this.tooltipInstances = [];

      // Находим все элементы с атрибутом title в хедере
      const tooltipElements = this.$el?.querySelectorAll('[title]');
      if (!tooltipElements || tooltipElements.length === 0) return;

      const inverseTheme = this.inverseTheme;

      // Инициализируем tooltips для каждого элемента
      tooltipElements.forEach(element => {
        // Пропускаем элементы, которые уже имеют data-bs-toggle="tooltip"
        if (element.getAttribute('data-bs-toggle') === 'tooltip') {
          return;
        }

        // Устанавливаем инверсную тему через data-bs-theme
        element.setAttribute('data-bs-theme', inverseTheme);

        // Создаем tooltip
        const tooltip = new bootstrap.Tooltip(element, {
          trigger: 'hover focus'
        });

        this.tooltipInstances.push(tooltip);
      });
    }
  },

  computed: {
    // Активная вкладка из корневого компонента (для реактивности)
    activeTab() {
      const root = this.$root || window.appRoot;
      return root && root.activeTab ? root.activeTab : 'percent';
    },

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
      const root = this.$root || window.appRoot;
      const activeTab = root && root.activeTab ? root.activeTab : 'percent';
      const tab = this.displayTabs.find(t => t.id === activeTab);
      if (!tab) return '%';
      return tab.label;
    },


    // Инверсная тема для dropdown и tooltips (реактивно обновляется)
    inverseTheme() {
      const currentTheme = this.getCurrentTheme();
      return currentTheme === 'light' ? 'dark' : 'light';
    }
  },

  // Отслеживаем изменения темы для обновления computed свойств
  watch: {
    '$root.theme'() {
      // Принудительно обновляем computed свойства при изменении темы
      this.$forceUpdate();
    },
    '$root.activeTab'() {
      // Обновляем computed свойства при изменении активной вкладки
      this.$forceUpdate();
      this.$nextTick(() => {
        this.adjustSelectWidths();
      });
    },
    // Отслеживаем изменения выбранных значений для обновления ширины
    selectedModel() {
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
        // Обновляем tooltips при изменении темы
        this.$nextTick(() => {
          this.initTooltips();
        });
      });
    }
    
    // Устанавливаем точную ширину селектов на основе выбранного значения
    this.$nextTick(() => {
      this.adjustSelectWidths();
      // Инициализируем tooltips
      this.initTooltips();
    });
  },

  beforeUnmount() {
    // Уничтожаем все tooltips при размонтировании компонента
    if (this.tooltipInstances && this.tooltipInstances.length > 0) {
      this.tooltipInstances.forEach(instance => {
        if (instance && typeof instance.dispose === 'function') {
          instance.dispose();
        }
      });
      this.tooltipInstances = [];
    }
  }
};
