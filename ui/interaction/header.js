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
      showSettingsDropdown: false,
      // Флаг для предотвращения двойной обработки клика в меню настроек
      isProcessingSettingsClick: false,
      // Уникальные ID для dropdown
      modelDropdownId: 'modelDropdown-' + Math.random().toString(36).substr(2, 9),
      tabDropdownId: 'tabDropdown-' + Math.random().toString(36).substr(2, 9)
    };
  },

  methods: {
    // Обработка изменения горизонта прогноза
    handleHorizonChange(newValue) {
      this.$emit('update:horizonDays', newValue);
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
      // Закрываем выпадающее меню после обновления страницы
      this.showSettingsDropdown = false;
    },

    toggleTheme() {
      // Вызываем метод из корневого компонента приложения через this.$root
      if (this.$root && typeof this.$root.toggleTheme === 'function') {
        this.$root.toggleTheme();
      } else if (window.appRoot && typeof window.appRoot.toggleTheme === 'function') {
        // Fallback: через window.appRoot (сохраненный корневой компонент)
        window.appRoot.toggleTheme();
      }
      // Закрываем выпадающее меню после переключения темы
      this.showSettingsDropdown = false;
    },
    
    // Переключение выпадающего меню настроек
    toggleSettingsDropdown() {
      this.showSettingsDropdown = !this.showSettingsDropdown;
    },
    
    // Закрытие выпадающего меню настроек
    closeSettingsDropdown() {
      this.showSettingsDropdown = false;
    },
    
    // Обработчик клика по пункту меню переключения темы
    handleThemeMenuClick(event) {
      // Защита от двойной обработки события
      if (this.isProcessingSettingsClick) {
        return;
      }
      
      this.isProcessingSettingsClick = true;
      this.toggleTheme();
      
      // Сбрасываем флаг через небольшую задержку (время обработки события)
      setTimeout(() => {
        this.isProcessingSettingsClick = false;
      }, 100);
    },
    
    // Обработчик клика по пункту меню обновления страницы
    handleRefreshMenuClick() {
      // Защита от двойной обработки события
      if (this.isProcessingSettingsClick) {
        return;
      }
      
      this.isProcessingSettingsClick = true;
      this.refreshPage();
      
      // Сбрасываем флаг через небольшую задержку (время обработки события)
      setTimeout(() => {
        this.isProcessingSettingsClick = false;
      }, 100);
    },
    
    // Обработчик клика по пункту меню экспорта настроек
    handleExportMenuClick() {
      // Защита от двойной обработки события
      if (this.isProcessingSettingsClick) {
        return;
      }
      
      this.isProcessingSettingsClick = true;
      
      // Вызываем метод экспорта из корневого компонента
      if (this.$root && typeof this.$root.exportSettings === 'function') {
        this.$root.exportSettings();
      } else if (window.appRoot && typeof window.appRoot.exportSettings === 'function') {
        window.appRoot.exportSettings();
      }
      
      // Закрываем выпадающее меню
      this.showSettingsDropdown = false;
      
      // Сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        this.isProcessingSettingsClick = false;
      }, 100);
    },
    
    // Обработчик клика по пункту меню импорта настроек
    handleImportMenuClick() {
      // Защита от двойной обработки события
      if (this.isProcessingSettingsClick) {
        return;
      }
      
      this.isProcessingSettingsClick = true;
      
      // Вызываем метод импорта из корневого компонента
      if (this.$root && typeof this.$root.triggerImport === 'function') {
        this.$root.triggerImport();
      } else if (window.appRoot && typeof window.appRoot.triggerImport === 'function') {
        window.appRoot.triggerImport();
      }
      
      // Закрываем выпадающее меню
      this.showSettingsDropdown = false;
      
      // Сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        this.isProcessingSettingsClick = false;
      }, 100);
    },

    // Получение темы для dropdown (всегда темная)
    // Хедер всегда в темной теме, не реагирует на переключение темы приложения
    getInverseTheme() {
      return 'dark';
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


    // Тема для dropdown и tooltips (всегда темная)
    inverseTheme() {
      // Хедер всегда в темной теме, не реагирует на переключение темы приложения
      return 'dark';
    },
    
    // Текст для пункта меню переключения темы
    themeMenuLabel() {
      const root = this.$root || window.appRoot;
      const theme = root && root.theme ? root.theme : (localStorage.getItem('theme') || 'light');
      // Используем неразрывные пробелы (\u00A0) вокруг вертикальной черты
      return theme === 'light' ? 'Dark\u00A0|\u00A0Light' : 'Light\u00A0|\u00A0Dark';
    }
  },

  // Отслеживаем изменения активной вкладки
  watch: {
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
    // Устанавливаем точную ширину селектов на основе выбранного значения
    this.$nextTick(() => {
      this.adjustSelectWidths();
    });
  },

  beforeUnmount() {
    // Компонент размонтирован
  }
};
