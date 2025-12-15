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
    // window.cmpCoinsManager больше не используется как часть - теперь это отдельный компонент
  ].filter(Boolean);

  // Загружаем сохраненную активную вкладку из localStorage
  const savedActiveTab = localStorage.getItem('activeTab');
  const initialActiveTab = savedActiveTab || 'percent';

  // Загружаем сохраненный горизонт прогноза из localStorage
  const savedHorizonDays = parseInt(localStorage.getItem('horizonDays')) || 2;
  const initialHorizonDays = (savedHorizonDays >= 1 && savedHorizonDays <= 90) ? savedHorizonDays : 2;

  const baseData = {
    vueVersion: '3.5.25',
    lastCommitMessage: (cfg.lastCommitMessage || '').trim(),
    showSettings: false, // Показывать ли настройки (по умолчанию false - показываем CoinGecko)
    activeTab: initialActiveTab, // Активная вкладка отображения (загружается из localStorage)
    horizonDays: initialHorizonDays // Горизонт прогноза в днях (загружается из localStorage)
  };
  const data = Object.assign(baseData, ...parts.map(p => p.data || {}));
  const methods = Object.assign({
    // Глобальный метод закрытия всех выпадающих списков при клике вне их области
    // Используется для консистентного UX - все выпадающие элементы закрываются одновременно
    closeAllDropdowns(event) {
      if (!event) return;
      
      // Селекторы всех выпадающих элементов и их триггеров
      const clickableSelectors = [
      '.cg-coin-sort-dropdown', // Выпадающее меню сортировки монет
        '.cg-search-dropdown', // Выпадающий список результатов поиска
        '.cg-favorites-dropdown', // Выпадающий список избранного
        '.cg-context-menu', // Контекстное меню монеты
        '.cg-counter-dropdown', // Выпадающее меню счетчика монет
        '.dropdown-menu', // Bootstrap dropdown меню (в хедере)
        'input[type="text"]', // Поля ввода (включая поле поиска)
        'input[type="checkbox"]', // Чекбоксы (не должны закрывать выпадающие списки)
        'button[type="button"]', // Кнопки, открывающие dropdown
        '.cg-coin-block', // Блок монеты для контекстного меню
        '.cg-coins-counter', // Кнопка счетчика монет
        '.app-header-hamburger' // Гамбургер меню
      ];
      
      // Проверяем, был ли клик внутри любого из выпадающих элементов или их триггеров
      const clickedInside = clickableSelectors.some(selector => {
        return event.target.closest(selector);
      });
      
      // Если клик вне всех выпадающих элементов - закрываем их все
      if (!clickedInside) {
        // Закрываем выпадающие списки через дочерние компоненты
        // Используем событие для уведомления всех компонентов
        document.dispatchEvent(new CustomEvent('close-all-dropdowns'));
      }
    }
  }, ...parts.map(p => p.methods || {}));
  const watch = Object.assign({
    // Сохраняем активную вкладку в localStorage при изменении
    activeTab(newTab) {
      localStorage.setItem('activeTab', newTab);
    },
    // Сохраняем горизонт прогноза в localStorage при изменении
    horizonDays(newValue, oldValue) {
      if (newValue !== oldValue && newValue >= 1 && newValue <= 90) {
        localStorage.setItem('horizonDays', newValue.toString());
      }
    }
  }, ...parts.map(p => p.watch || {}));
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
      
      // Устанавливаем глобальный обработчик клика для закрытия всех выпадающих списков
      document.addEventListener('click', this.closeAllDropdowns);
      
    },
    
    beforeUnmount() {
      // Удаляем глобальный обработчик при размонтировании
      document.removeEventListener('click', this.closeAllDropdowns);
    }
  });

  // Регистрация компонента сплэш-экрана
  if (window.cmpSplash) {
    try {
      app.component('splash-screen', window.cmpSplash);
    } catch (error) {
      console.error('Ошибка при регистрации компонента сплэша:', error);
    }
  }

  // Регистрация компонента хэдера
  if (window.cmpHeader) {
    try {
      app.component('app-header', window.cmpHeader);
    } catch (error) {
      console.error('Ошибка при регистрации компонента хэдера:', error);
    }
  }

  // Регистрация компонента футера
  if (window.cmpFooter) {
    try {
      app.component('app-footer', window.cmpFooter);
    } catch (error) {
      console.error('Ошибка при регистрации компонента футера:', error);
    }
  }

  // Регистрация компонента общих настроек проекта
  if (window.cmpSettings) {
    try {
      app.component('app-settings', window.cmpSettings);
    } catch (error) {
      console.error('Ошибка при регистрации компонента настроек:', error);
    }
  }

  // Регистрация компонента менеджера монет
  if (window.cmpCoinsManager) {
    try {
      app.component('app-coins-manager', window.cmpCoinsManager);
    } catch (error) {
      console.error('Ошибка при регистрации компонента Coins Manager:', error);
    }
  }

  // Регистрация компонента хедера индикатора монет
  if (window.cmpHeaderCoins) {
    try {
      app.component('header-coins', window.cmpHeaderCoins);
    } catch (error) {
      console.error('Ошибка при регистрации компонента хедера индикатора:', error);
    }
  }

  // Регистрация компонента сортируемого заголовка
  if (window.cmpSortableHeader) {
    try {
      app.component('sortable-header', window.cmpSortableHeader);
    } catch (error) {
      console.error('Ошибка при регистрации компонента сортируемого заголовка:', error);
    }
  }

  // Регистрация компонента заголовка колонки
  if (window.cmpHeaderCell) {
    try {
      app.component('header-cell', window.cmpHeaderCell);
    } catch (error) {
      console.error('Ошибка при регистрации компонента заголовка колонки:', error);
    }
  }

  // Регистрация компонента заголовка колонки с чекбоксом
  if (window.cmpHeaderCellCheck) {
    try {
      app.component('header-cell-check', window.cmpHeaderCellCheck);
    } catch (error) {
      console.error('Ошибка при регистрации компонента заголовка колонки с чекбоксом:', error);
    }
  }

  // Регистрация компонента ячейки выбора строки
  if (window.cmpCellRowSelect) {
    try {
      app.component('cell-row-select', window.cmpCellRowSelect);
    } catch (error) {
      console.error('Ошибка при регистрации компонента ячейки выбора строки:', error);
    }
  }

  // Регистрация компонента числовой ячейки
  if (window.cmpCellNum) {
    try {
      app.component('cell-num', window.cmpCellNum);
    } catch (error) {
      console.error('Ошибка при регистрации компонента числовой ячейки:', error);
    }
  }

  // Регистрация компонента ячейки монеты
  if (window.cmpCellCoin) {
    try {
      app.component('cell-coin', window.cmpCellCoin);
    } catch (error) {
      console.error('Ошибка при регистрации компонента ячейки монеты:', error);
    }
  }

  // Регистрация компонента таблицы данных
  if (window.cmpTableData) {
    try {
      app.component('table-data', window.cmpTableData);
    } catch (error) {
      console.error('Ошибка при регистрации компонента таблицы данных:', error);
    }
  }

  // Регистрация компонента кнопки
  if (window.cmpButton) {
    try {
      app.component('cmp-button', window.cmpButton);
    } catch (error) {
      console.error('Ошибка при регистрации компонента кнопки:', error);
    }
  }

  // Регистрация компонента пункта меню
  if (window.cmpMenuItem) {
    try {
      app.component('menu-item', window.cmpMenuItem);
    } catch (error) {
      console.error('Ошибка при регистрации компонента пункта меню:', error);
    }
  }

  // Регистрация компонента выпадающего меню
  if (window.cmpDropdownMenu) {
    try {
      app.component('dropdown-menu', window.cmpDropdownMenu);
    } catch (error) {
      console.error('Ошибка при регистрации компонента выпадающего меню:', error);
    }
  }

  // Регистрация компонента поля ввода горизонта прогноза
  if (window.cmpHorizonInput) {
    try {
      app.component('horizon-input', window.cmpHorizonInput);
    } catch (error) {
      console.error('Ошибка при регистрации компонента поля ввода горизонта прогноза:', error);
    }
  }

  // Сохраняем ссылку на приложение в window для доступа из компонентов
  window.app = app;

  // Монтируем приложение и сохраняем ссылку на корневой компонент
  const rootInstance = app.mount('#app');
  window.appRoot = rootInstance;
})();
