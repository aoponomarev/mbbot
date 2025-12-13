// =========================
// УТИЛИТА: Трансформация данных CoinGecko в формат со старыми переменными
// Источник: old_app_not_write/parsing.js (строки 62-70)
// =========================
// Преобразует данные CoinGecko API в формат, совместимый со старым приложением:
// - Создает массив pvs (Price Variations) из 6 интервалов времени
// - Сохраняет структуру данных для совместимости с математической моделью
// 
// Маппинг интервалов CoinGecko → Старые переменные:
// - price_change_percentage_1h_in_currency → PV1h (pvs[0])
// - price_change_percentage_24h_in_currency → PV24h (pvs[1])
// - price_change_percentage_7d_in_currency → PV7d (pvs[2])
// - price_change_percentage_14d_in_currency → PV14d (pvs[3]) - НОВЫЙ интервал (заменяет 30d в старом индексе)
// - price_change_percentage_30d_in_currency → PV30d (pvs[4]) - НОВЫЙ индекс (был pvs[3] в старом)
// - price_change_percentage_200d_in_currency → PV200d (pvs[5]) - НОВЫЙ интервал (заменяет 60d и 90d)
// 
// ВАЖНО: Замененные интервалы (14d вместо 30d в индексе 3, 200d вместо 60d/90d в индексе 5)
// потребуют анализа и пересмотра весов и коэффициентов в математической модели.
// 
// @param {Object} coinGeckoCoin - Объект монеты из CoinGecko API
// @returns {Object} Объект монеты с добавленными полями pvs и отдельными переменными PV
function transformCoinGeckoToPV(coinGeckoCoin) {
  // Безопасное извлечение значений с fallback на 0
  const safeValue = (value) => {
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : 0;
  };
  
  // Создаем массив pvs (Price Variations) - совместимый со старым форматом
  // Источник: old_app_not_write/parsing.js, строка 70: pvs: values
  const pvs = [
    safeValue(coinGeckoCoin.price_change_percentage_1h_in_currency),   // pvs[0] - PV1h (1 час)
    safeValue(coinGeckoCoin.price_change_percentage_24h_in_currency), // pvs[1] - PV24h (24 часа)
    safeValue(coinGeckoCoin.price_change_percentage_7d_in_currency),  // pvs[2] - PV7d (7 дней)
    safeValue(coinGeckoCoin.price_change_percentage_14d_in_currency), // pvs[3] - PV14d (14 дней) - НОВЫЙ интервал
    safeValue(coinGeckoCoin.price_change_percentage_30d_in_currency), // pvs[4] - PV30d (30 дней) - сдвинут с индекса 3
    safeValue(coinGeckoCoin.price_change_percentage_200d_in_currency)  // pvs[5] - PV200d (200 дней) - НОВЫЙ интервал (заменяет 60d и 90d)
  ];
  
  // Добавляем pvs к объекту монеты для совместимости со старым форматом
  // Также добавляем отдельные переменные для удобства (опционально, для совместимости)
  return {
    ...coinGeckoCoin,
    pvs, // Массив дельт изменения цены (совместим со старым форматом)
    // Отдельные переменные для удобства (совместимость со старым кодом)
    PV1h: pvs[0],
    PV24h: pvs[1],
    PV7d: pvs[2],
    PV14d: pvs[3],
    PV30d: pvs[4],
    PV200d: pvs[5]
  };
}

// Компонент виджета CoinGecko
// Vue компонент с x-template шаблоном
window.cmpCoinGecko = {
  template: '#coingecko-template',
  mixins: [
    window.tableSortMixin, // Подключаем глобальный mixin для сортировки
    window.columnVisibilityMixin // Подключаем mixin для управления видимостью колонок
  ],

  data() {
    // Загружаем сохраненные данные монет из localStorage
    const savedCoins = localStorage.getItem('cgCoins');
    const savedLastUpdated = localStorage.getItem('cgLastUpdated');
    
    // Загружаем список выбранных монет
    const savedSelectedCoins = localStorage.getItem('cgSelectedCoins');
    
    // Загружаем кэш иконок
    const iconsCache = JSON.parse(localStorage.getItem('cgIconsCache') || '{}');
    
    // Загружаем избранные монеты (хранилище избранного)
    // Миграция: проверяем оба ключа (старый cgFavoriteCoins и новый cgFavoriteCoins)
    const savedFavoriteCoins = localStorage.getItem('cgFavoriteCoins');
    const savedArchivedCoins = localStorage.getItem('cgArchivedCoins'); // Старый ключ для миграции
    let favoriteCoins = [];
    
    // Если есть новый ключ - используем его
    if (savedFavoriteCoins) {
      const parsed = JSON.parse(savedFavoriteCoins);
      // Обратная совместимость: если массив строк (старый формат) - преобразуем в объекты
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'string') {
          // Старый формат: массив ID
          favoriteCoins = parsed.map(id => ({ id, symbol: id.toUpperCase(), name: id }));
        } else {
          // Новый формат: массив объектов
          favoriteCoins = parsed;
        }
      }
    }
    // Если нет нового ключа, но есть старый - мигрируем
    else if (savedArchivedCoins) {
      const parsed = JSON.parse(savedArchivedCoins);
      // Обратная совместимость: если массив строк (старый формат) - преобразуем в объекты
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'string') {
          // Старый формат: массив ID
          favoriteCoins = parsed.map(id => ({ id, symbol: id.toUpperCase(), name: id }));
        } else {
          // Новый формат: массив объектов
          favoriteCoins = parsed;
        }
      }
      // Сохраняем в новый ключ
      localStorage.setItem('cgFavoriteCoins', JSON.stringify(favoriteCoins));
      // Опционально: можно удалить старый ключ после миграции (закомментировано для безопасности)
      // localStorage.removeItem('cgFavoriteCoins');
    }
    
    // Миграция: объединяем старый favoriteCoinIds с избранным (если еще не было миграции)
    const savedFavoriteCoinIds = localStorage.getItem('cgFavoriteCoinIds');
    if (savedFavoriteCoinIds) {
      const favoriteCoinIds = JSON.parse(savedFavoriteCoinIds);
      if (Array.isArray(favoriteCoinIds) && favoriteCoinIds.length > 0) {
        // Для каждого ID из избранного проверяем, есть ли он уже в избранном
        favoriteCoinIds.forEach(coinId => {
          const existsInFavorites = favoriteCoins.some(fav => fav.id === coinId);
          if (!existsInFavorites) {
            // Добавляем в избранное как объект
            favoriteCoins.push({
              id: coinId,
              symbol: coinId.toUpperCase(), // Временное значение, будет обновлено при первой загрузке
              name: coinId // Временное значение
            });
          }
        });
        // Сохраняем объединенный список
        localStorage.setItem('cgFavoriteCoins', JSON.stringify(favoriteCoins));
        // Удаляем старый ключ избранного (миграция завершена)
        localStorage.removeItem('cgFavoriteCoinIds');
      }
    }
    
    // Загружаем состояние чекнутости монет
    const savedSelectedCoinIds = localStorage.getItem('cgSelectedCoinIds');
    const selectedCoinIds = savedSelectedCoinIds ? JSON.parse(savedSelectedCoinIds) : [];
    
    // Загружаем тип сортировки колонки монет
    const savedCoinSortType = localStorage.getItem('cgCoinSortType');
    const coinSortType = savedCoinSortType || null;
    
      // Загружаем состояние сортировки других колонок
      const savedSortBy = localStorage.getItem('cgSortBy');
      const savedSortOrder = localStorage.getItem('cgSortOrder');
      
    // Загружаем и трансформируем данные из localStorage (если они есть)
    // Если данные уже имеют формат со старыми переменными (pvs) - оставляем как есть
    // Если нет - трансформируем (для обратной совместимости)
    let loadedCoins = savedCoins ? JSON.parse(savedCoins) : [];
    // Проверяем, нужно ли трансформировать данные (если у первой монеты нет поля pvs)
    // Источник трансформации: old_app_not_write/parsing.js
    if (loadedCoins.length > 0 && !loadedCoins[0].pvs) {
      // Трансформируем данные из старого формата CoinGecko в формат со старыми переменными
      loadedCoins = loadedCoins.map(coin => transformCoinGeckoToPV(coin));
    }
    
    // Рассчитываем CPT для загруженных монет (если еще не рассчитан)
    // Источник: Этап 2 миграции математической модели
    // ВАЖНО: В data() нет доступа к this, поэтому используем прямую функцию из window
    if (loadedCoins.length > 0 && window.mmMedianCPT && window.mmMedianCPT.computeEnhancedCPT) {
      const horizonDays = 2;
      loadedCoins = loadedCoins.map(coin => {
        // Если CPT уже рассчитан - не пересчитываем
        if (coin.enhancedCpt !== undefined && coin.enhancedCptFormatted !== undefined) {
          return coin;
        }
        // Проверяем наличие массива pvs
        if (!coin.pvs || !Array.isArray(coin.pvs) || coin.pvs.length !== 6) {
          return coin;
        }
        // Рассчитываем CPT
        const cptValue = window.mmMedianCPT.computeEnhancedCPT(coin.pvs, horizonDays);
        const cptFormatted = window.mmMedianCPT.formatEnhancedCPT(cptValue);
    return {
          ...coin,
          enhancedCpt: cptValue,
          enhancedCptFormatted: cptFormatted
        };
      });
    }
    
    return {
      // Состояние сортировки (переопределяем из mixin для загрузки из localStorage)
      sortBy: savedSortBy || null,
      sortOrder: savedSortOrder || null,
      cgCoins: loadedCoins,
      cgIsLoading: false,
      cgError: null,
      cgLastUpdated: savedLastUpdated || null,
      cgSelectedCoins: savedSelectedCoins ? JSON.parse(savedSelectedCoins) : [],
      cgFavoriteCoins: favoriteCoins, // Избранные монеты (хранилище избранного): массив объектов {id, symbol, name}
      cgIconsCache: iconsCache, // Кэш иконок в data для реактивности
      // Поиск монет
      cgSearchQuery: '',
      cgSearchResults: [],
      cgSearching: false,
      // Контекстное меню
      contextMenuCoin: null, // ID монеты для контекстного меню
      contextMenuX: 0,
      contextMenuY: 0,
      showContextMenu: false,
      // Избранное
      selectedFavoriteCoin: '', // Выбранная монета из избранного для добавления в таблицу
      showFavoritesDropdown: false, // Показать/скрыть выпадающий список избранного
      // Отмеченные чекбоксами монеты
      selectedCoinIds: selectedCoinIds, // Массив ID отмеченных монет (загружается из localStorage)
      // Выпадающее меню кнопки счетчика
      showCounterDropdown: false, // Показать/скрыть выпадающее меню счетчика
      // Сортировка колонки монет
      showCoinSortDropdown: false, // Показать/скрыть выпадающее меню сортировки монет
      coinSortType: coinSortType, // Тип сортировки: null | 'market_cap' | 'total_volume' | 'alphabet' | 'selected' (загружается из localStorage)
      // Режим добавления тикеров (парсинг списка)
      isAddingTickers: false, // Флаг процесса добавления
      pendingTickers: [], // Очередь тикеров для добавления (массив строк-тикеров)
      currentAddingTicker: null, // Текущий тикер, который добавляется
      failedTickers: [], // Тикеры, которые не удалось добавить (для повторной попытки)
      displayPendingTickers: '', // Строка для отображения оставшихся тикеров в поле поиска
      tickerAttempts: {}, // Счетчик попыток для каждого тикера (объект: ticker -> количество попыток)
      // Адаптивный таймаут для обработки rate limiting CoinGecko API
      adaptiveTimeout: 300, // Текущий таймаут в миллисекундах (базовое значение)
      adaptiveTimeoutBase: 300, // Базовое значение таймаута (300ms)
      adaptiveTimeoutMax: 10000, // Максимальный таймаут (10 секунд)
      lastSuccessfulRequest: null, // Время последнего успешного запроса (для постепенного уменьшения таймаута)
      // Горизонт прогноза в днях (по умолчанию 2 дня, как в старом приложении)
      horizonDays: 2,
      // Заглушка для CD значений (пока не мигрированы функции расчета)
      useStub: true,
      // Конфигурация видимости колонок в зависимости от активной вкладки
      // Используется mixin columnVisibilityMixin для управления видимостью
      columnVisibilityConfig: {
        'percent': { 
          // На вкладке "%" скрыть все колонки CD
          hide: ['col-cd'] 
        },
        'complex-deltas': { 
          // На вкладке "Компл. дельты" скрыть все колонки процентов
          hide: ['col-percent'] 
        }
      },
      // =========================
      // КОНФИГУРАЦИЯ КОЛОНОК ТАБЛИЦЫ
      // Централизованная конфигурация для будущего компонента таблицы
      // Определяет: заголовки, поля сортировки, форматирование, видимость
      // =========================
      tableColumns: [
        // Колонка чекбоксов - СПЕЦИАЛЬНАЯ (не через конфигурацию форматирования)
        {
          id: 'checkbox',
          type: 'checkbox',
          cssClass: 'col-checkbox',
          width: '40px'
        },
        // Колонка монет - СПЕЦИАЛЬНАЯ (не через sortable-header)
        {
          id: 'coin',
          type: 'coin',
          label: 'Монета',
          cssClass: 'col-coin',
          sortable: false, // Использует кастомную сортировку через coinSortType
          showSortIndicator: false, // Отключаем индикацию сортировки для кастомной сортировки
          menuItems: [
            { id: 'market_cap', label: 'По капитализации' },
            { id: 'total_volume', label: 'По дневному объему' },
            { id: 'alphabet', label: 'По алфавиту' },
            { id: 'selected', label: 'Выбранные' }
          ],
          customSort: {
            enabled: true,
            sortType: 'custom'
          }
        },
        // Процентные колонки - через конфигурацию форматирования
        {
          id: 'percent-1h',
          type: 'numeric',
          label: '1h %',
          field: 'price_change_percentage_1h_in_currency',
          cssClass: 'col-percent-1h',
          sortable: true,
          format: {
            component: 'cell-num',
            type: 'decimal',
            precision: 2,
            rounding: 'precision',
            unit: '%',
            colorize: true,
            roundToHalf: true,
            sectors: [
              { range: [-Infinity, 0], cssClass: 'text-danger' },
              { range: [0, Infinity], cssClass: 'text-success' }
            ],
            decimalSeparator: ',',
            thousandsSeparator: ' '
          }
        },
        {
          id: 'percent-24h',
          type: 'numeric',
          label: '24h %',
          field: 'price_change_percentage_24h_in_currency',
          cssClass: 'col-percent-24h',
          sortable: true,
          format: {
            component: 'cell-num',
            type: 'decimal',
            precision: 2,
            rounding: 'precision',
            unit: '%',
            colorize: true,
            roundToHalf: true,
            sectors: [
              { range: [-Infinity, 0], cssClass: 'text-danger' },
              { range: [0, Infinity], cssClass: 'text-success' }
            ],
            decimalSeparator: ',',
            thousandsSeparator: ' '
          }
        },
        {
          id: 'percent-7d',
          type: 'numeric',
          label: '7d %',
          field: 'price_change_percentage_7d_in_currency',
          cssClass: 'col-percent-7d',
          sortable: true,
          format: {
            component: 'cell-num',
            type: 'decimal',
            precision: 2,
            rounding: 'precision',
            unit: '%',
            colorize: true,
            roundToHalf: true,
            sectors: [
              { range: [-Infinity, 0], cssClass: 'text-danger' },
              { range: [0, Infinity], cssClass: 'text-success' }
            ],
            decimalSeparator: ',',
            thousandsSeparator: ' '
          }
        },
        {
          id: 'percent-14d',
          type: 'numeric',
          label: '14d %',
          field: 'price_change_percentage_14d_in_currency',
          cssClass: 'col-percent-14d',
          sortable: true,
          format: {
            component: 'cell-num',
            type: 'decimal',
            precision: 2,
            rounding: 'precision',
            unit: '%',
            colorize: true,
            roundToHalf: true,
            sectors: [
              { range: [-Infinity, 0], cssClass: 'text-danger' },
              { range: [0, Infinity], cssClass: 'text-success' }
            ],
            decimalSeparator: ',',
            thousandsSeparator: ' '
          }
        },
        {
          id: 'percent-30d',
          type: 'numeric',
          label: '30d %',
          field: 'price_change_percentage_30d_in_currency',
          cssClass: 'col-percent-30d',
          sortable: true,
          format: {
            component: 'cell-num',
            type: 'decimal',
            precision: 2,
            rounding: 'precision',
            unit: '%',
            colorize: true,
            roundToHalf: true,
            sectors: [
              { range: [-Infinity, 0], cssClass: 'text-danger' },
              { range: [0, Infinity], cssClass: 'text-success' }
            ],
            decimalSeparator: ',',
            thousandsSeparator: ' '
          }
        },
        {
          id: 'percent-200d',
          type: 'numeric',
          label: '200d %',
          field: 'price_change_percentage_200d_in_currency',
          cssClass: 'col-percent-200d',
          sortable: true,
          format: {
            component: 'cell-num',
            type: 'decimal',
            precision: 2,
            rounding: 'precision',
            unit: '%',
            colorize: true,
            roundToHalf: true,
            sectors: [
              { range: [-Infinity, 0], cssClass: 'text-danger' },
              { range: [0, Infinity], cssClass: 'text-success' }
            ],
            decimalSeparator: ',',
            thousandsSeparator: ' '
          }
        },
        // CD колонки - динамические (будут развернуты через cdHeaders)
        {
          id: 'cd-dynamic',
          type: 'numeric',
          label: null, // Будет браться из cdHeaders
          field: null, // Будет вычисляться через getCDField
          cssClass: 'col-cd',
          sortable: true,
          dynamic: true, // Флаг для динамических колонок
          format: {
            component: 'cell-num',
            type: 'decimal',
            precision: 2,
            rounding: 'precision',
            colorize: true,
            roundToHalf: true,
            sectors: [
              { range: [-Infinity, 0], cssClass: 'text-danger' },
              { range: [0, Infinity], cssClass: 'text-success' }
            ],
            decimalSeparator: ',',
            thousandsSeparator: ' ',
            emptyValue: '—'
          }
        }
      ]
    };
  },
  
  computed: {
    // Сортированный список монет
    sortedCoins() {
      // Если выбрана сортировка колонки монет - используем специальную логику
      if (this.coinSortType) {
        return this.sortCoinsByType(this.cgCoins);
      }
      // Для остальных колонок используем стандартную сортировку
      return this.sortData(this.cgCoins, this.cgCoins);
    },
    
    // Количество отмеченных монет
    selectedCoinsCount() {
      return this.selectedCoinIds.length;
    },
    
    // Общее количество монет
    totalCoinsCount() {
      return this.sortedCoins.length;
    },
    
    // Процент выбранных монет для круговой диаграммы (0-1)
    selectedCoinsPercentage() {
      if (this.totalCoinsCount === 0) return 0;
      return this.selectedCoinsCount / this.totalCoinsCount;
    },
    
    // Отображение значения в поле поиска (реактивное)
    searchQueryDisplay() {
      return this.isAddingTickers ? this.displayPendingTickers : this.cgSearchQuery;
    },
    
    // =========================
    // COMPUTED СВОЙСТВА ДЛЯ ЗАГОЛОВКОВ CD (Cumulative Delta)
    // =========================
    
    // Заголовки колонок CD (статический порядок)
    cdHeaders() {
      return ['CDH', 'CD6', 'CD5', 'CD4', 'CD3', 'CD2', 'CD1'];
    },
    
    // =========================
    // COMPUTED СВОЙСТВА ДЛЯ РАБОТЫ С КОНФИГУРАЦИЕЙ КОЛОНОК
    // =========================
    
    // Получить все статические колонки (не динамические)
    staticColumns() {
      return this.tableColumns.filter(col => !col.dynamic);
    },
    
    // Получить все динамические колонки с развернутыми заголовками
    dynamicColumns() {
      const dynamicCol = this.tableColumns.find(col => col.dynamic);
      if (!dynamicCol) return [];
      
      return this.cdHeaders.map((header, index) => ({
        ...dynamicCol,
        id: `${dynamicCol.id}-${index}`,
        label: header,
        field: this.getCDField(header, index)
      }));
    },
    
    // Все колонки (статические + динамические)
    allColumns() {
      return [...this.staticColumns, ...this.dynamicColumns];
    }
  },

  methods: {
    // Получить все классы колонок для управления видимостью
    // Используется mixin columnVisibilityMixin для определения, какие колонки скрывать
    getColumnClasses() {
      return [
        'col-checkbox',
        'col-coin',
        'col-percent-1h',
        'col-percent-24h',
        'col-percent-7d',
        'col-percent-14d',
        'col-percent-30d',
        'col-percent-200d',
        'col-cd' // Префикс для всех CD колонок (col-cd применяется ко всем через v-for)
      ];
    },
    
    // Переопределяем handleSort из mixin для сброса сортировки монет при сортировке других колонок
    handleSort(field) {
      // Если сортируем не колонку монет - сбрасываем сортировку монет
      if (field !== 'symbol') {
        this.coinSortType = null;
        localStorage.removeItem('cgCoinSortType');
      }
      // Вызываем оригинальный метод из mixin
      window.tableSortMixin.methods.handleSort.call(this, field);
      // Сохраняем состояние сортировки
      if (this.sortBy) {
        localStorage.setItem('cgSortBy', this.sortBy);
      } else {
        localStorage.removeItem('cgSortBy');
      }
      if (this.sortOrder) {
        localStorage.setItem('cgSortOrder', this.sortOrder);
      } else {
        localStorage.removeItem('cgSortOrder');
      }
    },
    
    // Переопределяем getSortValue из mixin для обработки CD полей
    getSortValue(item, field) {
      // Если поле начинается с 'cd' (cdh, cd1, cd2, и т.д.) - используем getCDValue
      if (field && field.toLowerCase().startsWith('cd')) {
        return this.getCDValue(item, field);
      }
      // Для остальных полей используем стандартную логику из mixin
      return window.tableSortMixin.methods.getSortValue.call(this, item, field);
    },
    
    async fetchCoinGecko() {
      if (!window.appUnlocked) {
        return;
      }
      if (this.cgIsLoading) return;
      this.cgError = null;
      this.cgIsLoading = true;
      try {
        const priceChangeParams = '1h,24h,7d,14d,30d,200d';
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${this.cgSelectedCoins.join(',')}&price_change_percentage=${priceChangeParams}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          // Обработка rate limiting (429)
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
            throw new Error(`HTTP ${res.status}`);
          }
          throw new Error(`HTTP ${res.status}`);
        }
        
        // Успешный запрос - уменьшаем таймаут
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        // Трансформируем данные CoinGecko в формат со старыми переменными (pvs, PV1h и т.д.)
        // Источник трансформации: old_app_not_write/parsing.js
        // Это обеспечивает преемственность с математической моделью из старого приложения
        this.cgCoins = Array.isArray(data) ? data.map(coin => transformCoinGeckoToPV(coin)) : [];
        
        // Рассчитываем CPT (Coin Potential) для каждой монеты
        // Источник: Этап 2 миграции математической модели
        // Используем горизонт прогноза по умолчанию 2 дня (как в старом приложении)
        const horizonDays = 2;
        this.cgCoins = this.cgCoins.map(coin => this.calculateCPT(coin, horizonDays));
        
        this.cgLastUpdated = new Date().toISOString(); // Сохраняем ISO строку для парсинга
        
        // Очищаем выбранные монеты, так как список мог измениться
        this.selectedCoinIds = [];
        localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
        
        // Кэшируем иконки монет для быстрой загрузки
        this.cacheCoinsIcons(this.cgCoins);
        
        // Сохраняем полный набор данных в localStorage
        localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
        localStorage.setItem('cgLastUpdated', this.cgLastUpdated);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      } catch (error) {
        console.error('CoinGecko fetch error', error);
        this.cgError = error.message || 'Не удалось загрузить данные';
        // Если это не 429, сбрасываем таймаут (возможно, другая ошибка)
        if (!error.message || !error.message.includes('429')) {
          this.decreaseAdaptiveTimeout();
        }
      } finally {
        this.cgIsLoading = false;
      }
    },
    cgFormatPrice(value) {
      if (value === null || value === undefined) return '—';
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    },
    cgFormatPercent(value) {
      if (value === null || value === undefined) return '—';
      return `${value.toFixed(2)}%`;
    },
    cgChangeClass(value) {
      if (value === null || value === undefined) return '';
      if (value > 0) return 'text-success';
      if (value < 0) return 'text-danger';
      return '';
    },
    
    // =========================
    // МЕТОДЫ ПОЛУЧЕНИЯ CD (Cumulative Delta) - ВРЕМЕННО ИСПОЛЬЗУЮТ ЗАГЛУШКИ
    // Источник: ui/api/complex-deltas.js (методы getCDH, getCD, getCDValue)
    // ВАЖНО: После миграции Этапа 3 будут использоваться реальные вычисления
    // =========================
    
    /**
     * getCDH(coin)
     * Получить CDH (CD на горизонте) для монеты
     * ВАЖНО: Пока используется заглушка, после миграции Этапа 3 будет реальный расчет
     * 
     * @param {Object} coin - Объект монеты с полем pvs
     * @returns {number} CDH значение (пока сумма всех pvs как заглушка)
     */
    getCDH(coin) {
      if (this.useStub) {
        // Заглушка: используем сумму pvs как приблизительное значение CDH
        if (coin.pvs && Array.isArray(coin.pvs)) {
          return coin.pvs.reduce((sum, pv) => sum + (parseFloat(pv) || 0), 0);
        }
        return 0;
      }
      // После миграции: return parseFloat(coin.cdhw) || 0;
      return parseFloat(coin.cdhw) || 0;
    },
    
    /**
     * getCD(coin, index)
     * Получить CD значение по индексу (1-6)
     * ВАЖНО: Пока используется заглушка, после миграции Этапа 3 будет реальный расчет
     * 
     * @param {Object} coin - Объект монеты с полем pvs
     * @param {number} index - Индекс CD (1-6)
     * @returns {number|string} CD значение (пока частичная сумма pvs как заглушка)
     */
    getCD(coin, index) {
      if (this.useStub) {
        // Заглушка: используем частичную сумму pvs
        if (coin.pvs && Array.isArray(coin.pvs)) {
          const sum = coin.pvs.slice(0, index).reduce((sum, pv) => sum + (parseFloat(pv) || 0), 0);
          return sum;
        }
        return 0;
      }
      // После миграции: return coin[`cd${index}`] || coin[`cd${index}w`] || 0;
      const cdValue = coin[`cd${index}`] || coin[`cd${index}w`];
      return cdValue !== undefined ? cdValue : 0;
    },
    
    /**
     * getCDValue(coin, field)
     * Получить значение CD для отображения в таблице по полю сортировки
     * 
     * @param {Object} coin - Объект монеты
     * @param {string} field - Поле сортировки ('cdh', 'cd1', 'cd2', 'cd3', 'cd4', 'cd5', 'cd6')
     * @returns {number} CD значение
     */
    getCDValue(coin, field) {
      if (field === 'cdh') {
        return this.getCDH(coin);
      }
      // Извлекаем индекс из поля (cd1 -> 1, cd2 -> 2, и т.д.)
      const index = parseInt(field.replace('cd', ''));
      if (index >= 1 && index <= 6) {
        return this.getCD(coin, index);
      }
      return 0;
    },
    
    /**
     * cgFormatCD(value)
     * Форматирование CD значения для отображения
     * 
     * @param {number} value - CD значение
     * @returns {string} Отформатированное значение
     */
    cgFormatCD(value) {
      if (value === null || value === undefined || value === 0) return '—';
      const num = parseFloat(value);
      if (Number.isFinite(num)) {
        return num.toFixed(2);
      }
      return '—';
    },
    
    /**
     * getCDField(header, index)
     * Получить поле для сортировки по заголовку CD колонки
     * 
     * @param {string} header - Заголовок колонки ('CDH', 'CD1', 'CD2', и т.д.)
     * @param {number} index - Индекс колонки в массиве cdHeaders (не используется, оставлен для совместимости)
     * @returns {string} Поле для сортировки ('cdh', 'cd1', 'cd2', и т.д.)
     */
    getCDField(header, index) {
      return header.toLowerCase();
    },
    
    // =========================
    // МЕТОДЫ ДЛЯ РАБОТЫ С КОНФИГУРАЦИЕЙ КОЛОНОК
    // =========================
    
    /**
     * getCellValue(coin, column)
     * Получить значение для ячейки колонки
     * 
     * @param {Object} coin - Объект монеты
     * @param {Object} column - Конфигурация колонки
     * @returns {*} Значение для отображения
     */
    getCellValue(coin, column) {
      // Для динамических CD колонок
      if (column.dynamic) {
        return this.getCDValue(coin, column.field);
      }
      // Для обычных колонок - используем field
      if (column.field) {
        return coin[column.field];
      }
      return null;
    },
    
    /**
     * getColumnFormatProps(column)
     * Получить настройки форматирования для колонки (props для cell-num)
     * 
     * @param {Object} column - Конфигурация колонки
     * @returns {Object} Props для компонента форматирования
     */
    getColumnFormatProps(column) {
      if (!column.format) return {};
      // Копируем все свойства format, кроме component
      const { component, ...formatProps } = column.format;
      return formatProps;
    },
    
    /**
     * getPercentFormat(precision)
     * Получить формат для процентных колонок (helper для изменения precision)
     * 
     * @param {number} precision - Количество знаков после запятой (по умолчанию 2)
     * @returns {Object} Конфигурация форматирования
     */
    getPercentFormat(precision = 2) {
      return {
        component: 'cell-num',
        type: 'decimal',
        precision: precision,
        rounding: 'precision',
        unit: '%',
        sectors: [
          { range: [-Infinity, 0], cssClass: 'text-danger' },
          { range: [0, Infinity], cssClass: 'text-success' }
        ],
        decimalSeparator: ',',
        thousandsSeparator: ' '
      };
    },
    
    /**
     * getCDFormat()
     * Получить формат для CD колонок
     * 
     * @returns {Object} Конфигурация форматирования
     */
    getCDFormat() {
      return {
        component: 'cell-num',
        type: 'decimal',
        precision: 2,
        rounding: 'precision',
        colorize: true,
        roundToHalf: true,
        sectors: [
          { range: [-Infinity, 0], cssClass: 'text-danger' },
          { range: [0, Infinity], cssClass: 'text-success' }
        ],
        decimalSeparator: ',',
        thousandsSeparator: ' ',
        emptyValue: '—'
      };
    },
    
    /**
     * calculateCPT(coin, hDays)
     * Расчет CPT (Coin Potential) для монеты
     * Источник: Этап 2 миграции математической модели
     * 
     * @param {Object} coin - Объект монеты с полем pvs (массив из 6 значений PV)
     * @param {number} hDays - Горизонт прогноза в днях (по умолчанию 2 дня)
     * @returns {Object} Объект монеты с добавленными полями enhancedCpt и enhancedCptFormatted
     */
    calculateCPT(coin, hDays = 2) {
      // Проверяем доступность функции расчета CPT
      if (!window.mmMedianCPT || !window.mmMedianCPT.computeEnhancedCPT) {
        console.warn('mmMedianCPT.computeEnhancedCPT не доступна. CPT не будет рассчитан.');
        return coin;
      }
      
      // Проверяем наличие массива pvs
      if (!coin.pvs || !Array.isArray(coin.pvs) || coin.pvs.length !== 6) {
        console.warn('Монета не содержит корректный массив pvs. CPT не будет рассчитан.', coin);
        return coin;
      }
      
      // Рассчитываем CPT используя функцию из математической модели
      const cptValue = window.mmMedianCPT.computeEnhancedCPT(coin.pvs, hDays);
      
      // Форматируем значение CPT
      const cptFormatted = window.mmMedianCPT.formatEnhancedCPT(cptValue);
      
      // Добавляем поля к объекту монеты
      return {
        ...coin,
        enhancedCpt: cptValue,
        enhancedCptFormatted: cptFormatted
      };
    },
    
    // Парсинг строки на тикеры (разделители: любые символы кроме букв)
    parseTickersFromString(str) {
      if (!str || str.trim().length === 0) return [];
      
      // Разбиваем строку на тикеры: разделители - любые символы кроме букв (a-z, A-Z)
      // Это означает, что цифры считаются частью тикера, а все остальное - разделителями
      const tickers = str
        .split(/[^a-zA-Z]+/)
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0); // Убираем пустые строки
      
      // Убираем дубликаты
      return [...new Set(tickers)];
    },
    
    // Проверка, является ли строка режимом парсинга (линейный список тикеров)
    isParseMode(query) {
      if (!query || query.length < 2) return false;
      
      // Режим парсинга определяется наличием разделителей (любые символы кроме букв)
      // Если в строке есть хотя бы один разделитель - это режим парсинга
      return /[^a-zA-Z]/.test(query);
    },
    
    // Получение CoinGecko ID по тикеру (symbol)
    async getCoinIdBySymbol(ticker) {
      try {
        // Используем поиск CoinGecko для получения ID монеты по тикеру
        const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker)}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          // Обработка rate limiting (429)
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
            return null;
          }
          return null;
        }
        
        // Успешный запрос - уменьшаем таймаут
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        const coins = data.coins || [];
        
        // Ищем точное совпадение по тикеру (case-insensitive)
        const tickerUpper = ticker.toUpperCase();
        const exactMatch = coins.find(coin => coin.symbol && coin.symbol.toUpperCase() === tickerUpper);
        
        if (exactMatch) {
          return exactMatch.id;
        }
        
        // Если точного совпадения нет, возвращаем первый результат (самый популярный)
        return coins.length > 0 ? coins[0].id : null;
      } catch (error) {
        console.error(`Error getting coin ID for ticker ${ticker}:`, error);
        return null;
      }
    },
    
    // Обработка парсинга строки с тикерами (режим добавления монет линейным списком)
    async parseAndAddTickers(query) {
      // Парсим строку на тикеры
      const tickers = this.parseTickersFromString(query);
      
      if (tickers.length === 0) {
        this.cgSearchResults = [];
        return;
      }
      
      // Если уже идет процесс добавления - не начинаем новый
      if (this.isAddingTickers) {
        return;
      }
      
      // Фильтруем тикеры, уже присутствующие в таблице
      const existingTickers = this.cgCoins.map(coin => coin.symbol.toUpperCase());
      const newTickers = tickers.filter(ticker => !existingTickers.includes(ticker));
      
      if (newTickers.length === 0) {
        // Все тикеры уже в таблице
        this.cgSearchResults = [];
        this.cgSearchQuery = '';
        return;
      }
      
      // Начинаем процесс последовательного добавления
      this.isAddingTickers = true;
      this.pendingTickers = [...newTickers];
      this.currentAddingTicker = null;
      this.failedTickers = [];
      this.cgSearchResults = []; // Очищаем результаты поиска
      this.tickerAttempts = {}; // Инициализируем счетчик попыток
      this.resetAdaptiveTimeout(); // Сбрасываем таймаут при начале нового процесса
      this.updateDisplayPendingTickers(); // Инициализируем отображение
      
      // Запускаем последовательное добавление
      await this.processTickersQueue();
    },
    
    // Остановка процесса добавления тикеров
    stopAddingTickers() {
      if (!this.isAddingTickers) return;
      
      // Помечаем все оставшиеся тикеры как неудачные для возможного продолжения позже
      // Или просто останавливаем процесс
      this.isAddingTickers = false;
      this.currentAddingTicker = null;
      this.pendingTickers = [];
      this.failedTickers = [];
      this.tickerAttempts = {};
      this.displayPendingTickers = '';
      this.cgSearchQuery = '';
      this.cgSearchResults = [];
      // Не сбрасываем таймаут при остановке - он может быть увеличен из-за rate limiting
    },
    
    // Последовательное добавление тикеров из очереди
    async processTickersQueue() {
      // Продолжаем пока есть тикеры в очереди или в списке неудачных, и процесс не остановлен
      while (this.isAddingTickers && (this.pendingTickers.length > 0 || this.failedTickers.length > 0)) {
        // Сначала обрабатываем обычную очередь
        if (this.pendingTickers.length > 0) {
          const ticker = this.pendingTickers.shift();
          this.currentAddingTicker = ticker;
          
          // Обновляем отображение списка в поле поиска
          this.updateDisplayPendingTickers();
          
          try {
            // Проверяем, не появилась ли монета в таблице во время обработки
            const existingTickers = this.cgCoins.map(coin => coin.symbol.toUpperCase());
            if (existingTickers.includes(ticker)) {
              // Тикер уже добавлен - пропускаем
              this.currentAddingTicker = null;
              this.updateDisplayPendingTickers();
              continue;
            }
            
            // Увеличиваем счетчик попыток для этого тикера
            const attempts = (this.tickerAttempts[ticker] || 0) + 1;
            // Используем Vue.set для реактивности (или прямое присваивание, так как объект уже в data)
            this.tickerAttempts[ticker] = attempts;
            
            // Получаем CoinGecko ID для тикера
            const coinId = await this.getCoinIdBySymbol(ticker);
            
            if (!coinId) {
              // Тикер не найден
              if (attempts >= 5) {
                // Достигли лимита попыток - добавляем в избранное как неудачный тикер
                await this.archiveFailedTicker(ticker);
                // Удаляем из счетчика попыток
                delete this.tickerAttempts[ticker];
                this.currentAddingTicker = null;
                this.updateDisplayPendingTickers();
                // Адаптивная задержка перед следующим тикером
                await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
                continue;
              } else {
                // Еще есть попытки - добавляем в список неудачных для повторной попытки
                this.failedTickers.push(ticker);
                this.currentAddingTicker = null;
                this.updateDisplayPendingTickers();
                // Адаптивная задержка перед следующим тикером
                await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
                continue;
              }
            }
            
            // Проверяем, не добавлена ли уже монета (на случай параллельных операций)
            const existingCoinIds = new Set(this.cgSelectedCoins);
            if (existingCoinIds.has(coinId)) {
              // Монета уже в списке - пропускаем
              this.currentAddingTicker = null;
              this.updateDisplayPendingTickers();
              continue;
            }
            
            // Синхронизация: избранное не удаляется при добавлении в таблицу
            this.syncCoinWithFavorites(coinId, 'add');
            
            // Добавляем монету в список выбранных
            this.cgSelectedCoins.push(coinId);
            localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
            
            // Удаляем счетчик попыток для успешно добавленного тикера
            delete this.tickerAttempts[ticker];
            
            // Загружаем данные для добавленной монеты (обновляем таблицу)
            try {
              await this.fetchCoinGecko();
            } catch (fetchError) {
              console.error(`Error fetching data for ${ticker}:`, fetchError);
              // Продолжаем со следующим тикером даже если загрузка не удалась
            }
            
            // Адаптивная задержка для обработки rate limiting
            await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
            
          } catch (error) {
            console.error(`Error processing ticker ${ticker}:`, error);
            
            // Проверяем количество попыток
            const attempts = this.tickerAttempts[ticker] || 0;
            if (attempts >= 5) {
              // Достигли лимита попыток - добавляем в избранное как неудачный тикер
              await this.archiveFailedTicker(ticker);
              // Удаляем из счетчика попыток
              delete this.tickerAttempts[ticker];
            } else {
              // Еще есть попытки - добавляем в список неудачных
              this.failedTickers.push(ticker);
            }
          } finally {
            this.currentAddingTicker = null;
            this.updateDisplayPendingTickers();
          }
        } else if (this.failedTickers.length > 0) {
          // Если обычная очередь закончилась, пробуем неудачные еще раз
          this.pendingTickers = [...this.failedTickers];
          this.failedTickers = [];
          // Адаптивная задержка перед повторной попыткой
          await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
        }
      }
      
      // Все тикеры обработаны (если процесс не был остановлен вручную)
      if (this.isAddingTickers) {
        this.isAddingTickers = false;
        this.currentAddingTicker = null;
        this.pendingTickers = [];
        this.failedTickers = [];
        this.tickerAttempts = {};
        this.displayPendingTickers = '';
        this.cgSearchQuery = '';
        this.cgSearchResults = [];
      }
    },
    
    // Добавление неудачного тикера в избранное (после 5 попыток)
    async archiveFailedTicker(ticker) {
      try {
        // Пытаемся найти монету через поиск CoinGecko (даже если точного совпадения нет)
        const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker)}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          // Обработка rate limiting (429) - пропускаем добавление в избранное через API
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
          }
          // При любой ошибке API - все равно сохраняем в избранное с тикером как ID
          const failedId = `failed-${ticker.toLowerCase()}`;
          const existsInFavorites = this.cgFavoriteCoins.some(favorite => favorite.id === failedId);
          if (!existsInFavorites) {
            this.cgFavoriteCoins.push({
              id: failedId,
              symbol: ticker.toUpperCase(),
              name: ticker
            });
            localStorage.setItem('cgFavoriteCoins', JSON.stringify(this.cgFavoriteCoins));
          }
          return;
        }
        
        // Успешный запрос - уменьшаем таймаут
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        const coins = data.coins || [];
        
        if (coins.length > 0) {
          // Используем первый результат поиска (самый популярный)
          const coin = coins[0];
          
          // Проверяем, нет ли уже этой монеты в избранном
          const existsInFavorites = this.cgFavoriteCoins.some(favorite => favorite.id === coin.id);
          if (!existsInFavorites) {
            // Сохраняем объект с id, symbol (тикер) и name (полное название)
            this.cgFavoriteCoins.push({
              id: coin.id,
              symbol: (coin.symbol || ticker).toUpperCase(),
              name: coin.name || ticker
            });
            localStorage.setItem('cgFavoriteCoins', JSON.stringify(this.cgFavoriteCoins));
          }
        } else {
          // Если ничего не найдено - все равно сохраняем в избранное с тикером как ID
          const failedId = `failed-${ticker.toLowerCase()}`;
          const existsInFavorites = this.cgFavoriteCoins.some(favorite => favorite.id === failedId);
          if (!existsInFavorites) {
            this.cgFavoriteCoins.push({
              id: failedId,
              symbol: ticker.toUpperCase(),
              name: ticker
            });
            localStorage.setItem('cgFavoriteCoins', JSON.stringify(this.cgFavoriteCoins));
          }
        }
      } catch (error) {
        console.error(`Error archiving failed ticker ${ticker}:`, error);
        // Даже при ошибке пытаемся сохранить тикер в избранное
        const failedId = `failed-${ticker.toLowerCase()}`;
        const existsInFavorites = this.cgFavoriteCoins.some(favorite => favorite.id === failedId);
          if (!existsInFavorites) {
            this.cgFavoriteCoins.push({
              id: failedId,
            symbol: ticker.toUpperCase(),
            name: ticker
          });
          localStorage.setItem('cgFavoriteCoins', JSON.stringify(this.cgFavoriteCoins));
        }
      }
    },
    
    // Обновление отображения списка тикеров в поле поиска
    updateDisplayPendingTickers() {
      const allTickers = [];
      if (this.currentAddingTicker) {
        allTickers.push(this.currentAddingTicker);
      }
      allTickers.push(...this.pendingTickers);
      allTickers.push(...this.failedTickers);
      
      this.displayPendingTickers = allTickers.join(', ');
    },
    
    // Поиск монет по названию или тикеру (поддерживает множественный поиск через разделители)
    async searchCoins(query) {
      if (!query || query.length < 2) {
        this.cgSearchResults = [];
        return;
      }
      
      // Проверяем, является ли запрос числом (для загрузки топ N монет)
      const trimmedQuery = query.trim();
      const numberMatch = trimmedQuery.match(/^\d+$/);
      if (numberMatch) {
        const count = parseInt(numberMatch[0], 10);
        if (count > 0 && count <= 250) { // CoinGecko API ограничивает до 250
          // Показываем кастомные пункты для выбора типа сортировки
          this.cgSearchResults = [
            {
              id: 'top-by-cap',
              type: 'top-by-cap',
              count: count,
              symbol: 'TOP',
              name: `Топ ${count} по капитализации`,
              thumb: null
            },
            {
              id: 'top-by-volume',
              type: 'top-by-volume',
              count: count,
              symbol: 'TOP',
              name: `Топ ${count} по дневному объему`,
              thumb: null
            }
          ];
          this.cgSearching = false;
          return;
        }
      }
      
      // Проверяем, является ли запрос режимом парсинга
      if (this.isParseMode(query)) {
        // Если это режим парсинга - запускаем парсинг вместо поиска
        await this.parseAndAddTickers(query);
        return;
      }
      
      this.cgSearching = true;
      try {
        // Разбиваем запрос на отдельные поисковые термины (разделители: все кроме букв и цифр)
        const searchTerms = query.split(/[^a-zA-Z0-9]+/).filter(term => term.length >= 2);
        
        if (searchTerms.length === 0) {
          this.cgSearchResults = [];
          this.cgSearching = false;
          return;
        }
        
        // Если один термин - используем обычный поиск
        if (searchTerms.length === 1) {
          const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(searchTerms[0])}`;
          const res = await fetch(url);
          
          if (!res.ok) {
            // Обработка rate limiting (429)
            if (res.status === 429) {
              this.increaseAdaptiveTimeout();
              this.cgSearchResults = [];
              return;
            }
            throw new Error(`HTTP ${res.status}`);
          }
          
          // Успешный запрос - уменьшаем таймаут
          this.decreaseAdaptiveTimeout();
          
          const data = await res.json();
          let coins = data.coins || [];
          
          // Сортируем результаты: полные совпадения с тикером вверху
          const queryLower = searchTerms[0].toLowerCase();
          coins.sort((a, b) => {
            const aSymbol = a.symbol.toLowerCase();
            const bSymbol = b.symbol.toLowerCase();
            
            // Полное совпадение тикера - в начало
            const aExactMatch = aSymbol === queryLower ? 1 : 0;
            const bExactMatch = bSymbol === queryLower ? 1 : 0;
            if (aExactMatch !== bExactMatch) {
              return bExactMatch - aExactMatch;
            }
            
            // Тикер начинается с запроса - выше
            const aStartsWith = aSymbol.startsWith(queryLower) ? 1 : 0;
            const bStartsWith = bSymbol.startsWith(queryLower) ? 1 : 0;
            if (aStartsWith !== bStartsWith) {
              return bStartsWith - aStartsWith;
            }
            
            // Остальные по market_cap_rank (популярности)
            return (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999);
          });
          
          this.cgSearchResults = coins.slice(0, 10);
        } else {
          // Множественный поиск: ищем каждую монету отдельно и объединяем результаты
          const allResults = new Map(); // Используем Map для уникальности по ID
          
          for (const term of searchTerms) {
            const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(term)}`;
            const res = await fetch(url);
            
            if (!res.ok) {
              // Обработка rate limiting (429)
              if (res.status === 429) {
                this.increaseAdaptiveTimeout();
                // Добавляем задержку перед следующей попыткой
                await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
                continue; // Пропускаем этот термин и переходим к следующему
              }
              continue; // Пропускаем этот термин при других ошибках
            }
            
            // Успешный запрос - уменьшаем таймаут
            this.decreaseAdaptiveTimeout();
            
            const data = await res.json();
            const coins = data.coins || [];
            
            // Добавляем результаты в общую карту (приоритет первым найденным)
            coins.forEach(coin => {
              if (!allResults.has(coin.id)) {
                allResults.set(coin.id, coin);
              }
            });
            
            // Небольшая задержка между запросами при множественном поиске
            if (searchTerms.length > 1) {
              await new Promise(resolve => setTimeout(resolve, Math.min(this.adaptiveTimeout, 500)));
            }
          }
          
          // Преобразуем Map в массив и сортируем по популярности
          let coins = Array.from(allResults.values());
          coins.sort((a, b) => {
            return (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999);
          });
          
          this.cgSearchResults = coins.slice(0, 10);
        }
      } catch (error) {
        console.error('CoinGecko search error', error);
        this.cgSearchResults = [];
      } finally {
        this.cgSearching = false;
      }
    },
    
    // Синхронизация монеты между таблицей и избранным
    // При добавлении в таблицу - НЕ удаляем из избранного (избранное - хранилище)
    // При удалении из таблицы - удаляем из таблицы, но добавляем в избранное
    syncCoinWithFavorites(coinId, action) {
      if (!coinId) return;
      
      if (action === 'add') {
        // При добавлении в таблицу - НЕ удаляем из избранного
        // Избранное теперь хранилище, монета может быть и в таблице, и в избранном одновременно
        // Ничего не делаем
      } else if (action === 'remove') {
        // При удалении из таблицы - удаляем из таблицы
        const tableIndex = this.cgSelectedCoins.indexOf(coinId);
        if (tableIndex > -1) {
          this.cgSelectedCoins.splice(tableIndex, 1);
          localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
        }
        // Удаляем из отображаемых данных таблицы
        this.cgCoins = this.cgCoins.filter(coin => coin.id !== coinId);
        localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
      }
    },
    
    // Проверка и очистка дубликатов между таблицей и избранным при загрузке
    // НЕ удаляем из избранного монеты, которые есть в таблице (избранное - хранилище)
    syncAllCoinsWithFavorites() {
      // Избранное теперь хранилище - монета может быть и в таблице, и в избранном одновременно
      // Ничего не делаем - оставляем как есть
    },
    
    // Увеличение таймаута при получении 429 ошибки (rate limiting)
    increaseAdaptiveTimeout() {
      // Удваиваем таймаут, но не превышаем максимальное значение
      this.adaptiveTimeout = Math.min(this.adaptiveTimeout * 2, this.adaptiveTimeoutMax);
      console.log(`Rate limit detected. Increasing timeout to ${this.adaptiveTimeout}ms`);
    },
    
    // Уменьшение таймаута при успешных запросах (постепенное восстановление)
    decreaseAdaptiveTimeout() {
      const now = Date.now();
      
      // Если прошло более 5 секунд без ошибок - начинаем уменьшать таймаут
      if (this.lastSuccessfulRequest && (now - this.lastSuccessfulRequest) > 5000) {
        // Уменьшаем на 20%, но не ниже базового значения
        this.adaptiveTimeout = Math.max(this.adaptiveTimeout * 0.8, this.adaptiveTimeoutBase);
      }
      
      this.lastSuccessfulRequest = now;
    },
    
    // Сброс таймаута к базовому значению
    resetAdaptiveTimeout() {
      this.adaptiveTimeout = this.adaptiveTimeoutBase;
      this.lastSuccessfulRequest = Date.now();
    },
    
    // Добавление монеты в список
    addCoin(coinId) {
      if (!this.cgSelectedCoins.includes(coinId)) {
        // Синхронизация: избранное не удаляется при добавлении в таблицу
        this.syncCoinWithFavorites(coinId, 'add');
        
        this.cgSelectedCoins.push(coinId);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
        
        // Кэшируем иконку добавленной монеты из результатов поиска
        const coinFromSearch = this.cgSearchResults.find(c => c.id === coinId);
        if (coinFromSearch && coinFromSearch.thumb) {
          this.cacheCoinsIcons([{ id: coinId, image: coinFromSearch.thumb }]);
        }
        
        // Обновляем данные для добавленной монеты
        this.fetchCoinGecko();
      }
      // Очищаем поиск
      this.cgSearchQuery = '';
      this.cgSearchResults = [];
    },
    
    // Добавление топ N монет по капитализации
    async addTopCoinsByMarketCap(count) {
      if (!count || count <= 0 || count > 250) return;
      
      if (this.cgIsLoading) return;
      this.cgError = null;
      
      try {
        const priceChangeParams = '1h,24h,7d,14d,30d,200d';
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&page=1&price_change_percentage=${priceChangeParams}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
            throw new Error(`HTTP ${res.status}`);
          }
          throw new Error(`HTTP ${res.status}`);
        }
        
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        // Трансформируем данные CoinGecko в формат со старыми переменными (pvs, PV1h и т.д.)
        // Источник трансформации: old_app_not_write/parsing.js
        const coins = Array.isArray(data) ? data.map(coin => transformCoinGeckoToPV(coin)) : [];
        
        // Рассчитываем CPT (Coin Potential) для каждой монеты
        // Источник: Этап 2 миграции математической модели
        const horizonDays = 2;
        const coinsWithCPT = coins.map(coin => this.calculateCPT(coin, horizonDays));
        
        // Добавляем все монеты в список выбранных (если их еще нет)
        const newCoinIds = [];
        coinsWithCPT.forEach(coin => {
          if (!this.cgSelectedCoins.includes(coin.id)) {
            this.cgSelectedCoins.push(coin.id);
            newCoinIds.push(coin.id);
            // Синхронизация: избранное не удаляется при добавлении в таблицу
            this.syncCoinWithFavorites(coin.id, 'add');
          }
        });
        
        if (newCoinIds.length > 0) {
          localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
          // Обновляем данные (не устанавливаем cgIsLoading, так как fetchCoinGecko сам управляет этим флагом)
          await this.fetchCoinGecko();
        }
        
        // Очищаем поиск
        this.cgSearchQuery = '';
        this.cgSearchResults = [];
      } catch (error) {
        console.error('Error adding top coins by market cap:', error);
        this.cgError = error.message || 'Ошибка загрузки топ монет';
      }
    },
    
    // Добавление топ N монет по дневному объему
    async addTopCoinsByVolume(count) {
      if (!count || count <= 0 || count > 250) return;
      
      if (this.cgIsLoading) return;
      this.cgError = null;
      
      try {
        const priceChangeParams = '1h,24h,7d,14d,30d,200d';
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=${count}&page=1&price_change_percentage=${priceChangeParams}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
            throw new Error(`HTTP ${res.status}`);
          }
          throw new Error(`HTTP ${res.status}`);
        }
        
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        // Трансформируем данные CoinGecko в формат со старыми переменными (pvs, PV1h и т.д.)
        // Источник трансформации: old_app_not_write/parsing.js
        const coins = Array.isArray(data) ? data.map(coin => transformCoinGeckoToPV(coin)) : [];
        
        // Рассчитываем CPT (Coin Potential) для каждой монеты
        // Источник: Этап 2 миграции математической модели
        const horizonDays = 2;
        const coinsWithCPT = coins.map(coin => this.calculateCPT(coin, horizonDays));
        
        // Добавляем все монеты в список выбранных (если их еще нет)
        const newCoinIds = [];
        coinsWithCPT.forEach(coin => {
          if (!this.cgSelectedCoins.includes(coin.id)) {
            this.cgSelectedCoins.push(coin.id);
            newCoinIds.push(coin.id);
            // Синхронизация: избранное не удаляется при добавлении в таблицу
            this.syncCoinWithFavorites(coin.id, 'add');
          }
        });
        
        if (newCoinIds.length > 0) {
          localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
          // Обновляем данные (не устанавливаем cgIsLoading, так как fetchCoinGecko сам управляет этим флагом)
          await this.fetchCoinGecko();
        }
        
        // Очищаем поиск
        this.cgSearchQuery = '';
        this.cgSearchResults = [];
      } catch (error) {
        console.error('Error adding top coins by volume:', error);
        this.cgError = error.message || 'Ошибка загрузки топ монет';
      }
    },
    
    // Обработчик добавления монеты (для использования в шаблоне)
    handleAddCoin(coinId) {
      // Проверяем, является ли это кастомным пунктом (топ N монет)
      const result = this.cgSearchResults.find(r => r.id === coinId);
      if (result && result.type) {
        if (result.type === 'top-by-cap') {
          this.addTopCoinsByMarketCap(result.count);
        } else if (result.type === 'top-by-volume') {
          this.addTopCoinsByVolume(result.count);
        }
        return;
      }
      // Обычное добавление монеты
      this.addCoin(coinId);
    },
    
    // Удаление монеты из списка
    removeCoin(coinId) {
      const index = this.cgSelectedCoins.indexOf(coinId);
      if (index > -1) {
        this.cgSelectedCoins.splice(index, 1);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
        // Удаляем монету из отображаемых данных
        this.cgCoins = this.cgCoins.filter(coin => coin.id !== coinId);
        localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
        // Удаляем монету из выбранных чекбоксами, если она была отмечена
        const selectedIndex = this.selectedCoinIds.indexOf(coinId);
        if (selectedIndex > -1) {
          this.selectedCoinIds.splice(selectedIndex, 1);
          localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
        }
      }
      this.closeContextMenu();
    },
    
    // Контекстное меню: открытие
    openContextMenu(event, coinId) {
      event.stopPropagation(); // Предотвращаем всплытие события
      this.contextMenuCoin = coinId;
      this.contextMenuX = event.clientX;
      this.contextMenuY = event.clientY;
      this.showContextMenu = true;
    },
    
    // Проверка, является ли монета избранной (проверяет cgFavoriteCoins)
    isFavorite(coinId) {
      if (!coinId) return false;
      return this.cgFavoriteCoins.some(favorite => favorite.id === coinId);
    },
    
    // Переключение избранного статуса монеты (работает с cgFavoriteCoins)
    toggleFavorite(coinId) {
      if (!coinId) return;
      
      // Находим монету в текущих данных для получения symbol и name
      const coin = this.cgCoins.find(c => c.id === coinId);
      
      const favoriteIndex = this.cgFavoriteCoins.findIndex(favorite => favorite.id === coinId);
      if (favoriteIndex > -1) {
        // Убираем из избранного
        this.cgFavoriteCoins.splice(favoriteIndex, 1);
      } else {
        // Добавляем в избранное
        if (coin) {
          // Если монета есть в таблице - берем данные оттуда
          this.cgFavoriteCoins.push({
            id: coin.id,
            symbol: (coin.symbol || '').toUpperCase(),
            name: coin.name || coin.id
          });
        } else {
          // Если монеты нет в таблице - создаем минимальный объект
          this.cgFavoriteCoins.push({
            id: coinId,
            symbol: coinId.toUpperCase(),
            name: coinId
          });
        }
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('cgFavoriteCoins', JSON.stringify(this.cgFavoriteCoins));
      
      // Закрываем контекстное меню
      this.closeContextMenu();
    },
    
    // Открытие/закрытие dropdown избранного
    toggleFavoritesDropdown() {
      this.showFavoritesDropdown = !this.showFavoritesDropdown;
    },
    
    // Контекстное меню: закрытие
    closeContextMenu() {
      this.showContextMenu = false;
      this.contextMenuCoin = null;
    },
    
    // Закрытие выпадающего списка избранного
    closeFavoritesDropdown() {
      this.showFavoritesDropdown = false;
    },
    
    // Закрытие выпадающего списка поиска
    closeSearchDropdown() {
      this.cgSearchResults = [];
    },
    
    // Открытие/закрытие выпадающего меню счетчика
    toggleCounterDropdown() {
      this.showCounterDropdown = !this.showCounterDropdown;
    },
    
    // Закрытие выпадающего меню счетчика
    closeCounterDropdown() {
      this.showCounterDropdown = false;
    },
    
    // Обработчик глобального события закрытия всех выпадающих списков
    handleCloseAllDropdowns() {
      this.closeContextMenu();
      this.closeFavoritesDropdown();
      this.closeSearchDropdown();
      this.closeCounterDropdown();
      this.closeCoinSortDropdown();
    },
    
    // Открытие/закрытие выпадающего меню сортировки монет
    toggleCoinSortDropdown(newState) {
      // Если передан новый state - устанавливаем его, иначе переключаем
      if (typeof newState === 'boolean') {
        this.showCoinSortDropdown = newState;
      } else {
        this.showCoinSortDropdown = !this.showCoinSortDropdown;
      }
    },
    
    // Закрытие выпадающего меню сортировки монет
    closeCoinSortDropdown() {
      this.showCoinSortDropdown = false;
    },
    
    // Установка типа сортировки монет
    setCoinSortType(type) {
      this.coinSortType = type;
      // Сбрасываем стандартную сортировку при выборе сортировки монет
      this.sortBy = null;
      this.sortOrder = null;
      // Сохраняем состояние сортировки
      if (type) {
        localStorage.setItem('cgCoinSortType', type);
      } else {
        localStorage.removeItem('cgCoinSortType');
      }
      localStorage.removeItem('cgSortBy');
      localStorage.removeItem('cgSortOrder');
      this.closeCoinSortDropdown();
    },
    
    // Сортировка монет по типу (только по убыванию)
    sortCoinsByType(coins) {
      if (!this.coinSortType || !coins || coins.length === 0) {
        return coins.slice();
      }
      
      const sorted = coins.slice();
      
      switch (this.coinSortType) {
        case 'market_cap':
          // Сортировка по капитализации (по убыванию)
          sorted.sort((a, b) => {
            const aVal = a.market_cap || 0;
            const bVal = b.market_cap || 0;
            return bVal - aVal; // По убыванию
          });
          break;
          
        case 'total_volume':
          // Сортировка по дневному объему (по убыванию)
          sorted.sort((a, b) => {
            const aVal = a.total_volume || 0;
            const bVal = b.total_volume || 0;
            return bVal - aVal; // По убыванию
          });
          break;
          
        case 'alphabet':
          // Сортировка по алфавиту (по возрастанию - от A к Z)
          sorted.sort((a, b) => {
            const aSymbol = (a.symbol || '').toUpperCase();
            const bSymbol = (b.symbol || '').toUpperCase();
            return aSymbol.localeCompare(bSymbol); // По возрастанию (A-Z)
          });
          break;
          
        case 'selected':
          // Сортировка выбранных монет вверх
          sorted.sort((a, b) => {
            const aSelected = this.selectedCoinIds.includes(a.id) ? 1 : 0;
            const bSelected = this.selectedCoinIds.includes(b.id) ? 1 : 0;
            return bSelected - aSelected; // Выбранные вверх
          });
          break;
          
        default:
          return sorted;
      }
      
      return sorted;
    },
    
    // Переключение выбора всех монет через чекбокс в заголовке
    toggleAllCoins(event) {
      if (event.target.checked) {
        // Выбираем все монеты
        this.selectedCoinIds = this.sortedCoins.map(coin => coin.id);
      } else {
        // Снимаем выбор со всех монет
        this.selectedCoinIds = [];
      }
      // Сохраняем состояние чекнутости монет
      localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
    },
    
    // Переключение выбора отдельной монеты через чекбокс
    toggleCoinSelection(coinId, isChecked) {
      if (isChecked) {
        // Добавляем монету в выбранные, если её там еще нет
        if (!this.selectedCoinIds.includes(coinId)) {
          this.selectedCoinIds.push(coinId);
        }
      } else {
        // Удаляем монету из выбранных
        const index = this.selectedCoinIds.indexOf(coinId);
        if (index > -1) {
          this.selectedCoinIds.splice(index, 1);
        }
      }
      // Сохраняем состояние чекнутости монет
      localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
    },
    
    // Выбрать все монеты
    selectAllCoins() {
      this.selectedCoinIds = this.sortedCoins.map(coin => coin.id);
      // Сохраняем состояние чекнутости монет
      localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
      this.closeCounterDropdown();
    },
    
    // Отменить выбор всех монет
    deselectAllCoins() {
      this.selectedCoinIds = [];
      // Сохраняем состояние чекнутости монет
      localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
      this.closeCounterDropdown();
    },
    
    // Удалить отмеченные монеты
    deleteSelectedCoins() {
      if (this.selectedCoinIds.length === 0) return;
      
      // Сохраняем копию списка, так как removeCoin будет изменять selectedCoinIds
      const coinsToDelete = [...this.selectedCoinIds];
      
      // Удаляем каждую отмеченную монету из списка выбранных для запроса
      coinsToDelete.forEach(coinId => {
        const index = this.cgSelectedCoins.indexOf(coinId);
        if (index > -1) {
          this.cgSelectedCoins.splice(index, 1);
        }
      });
      
      // Удаляем монеты из отображаемых данных
      this.cgCoins = this.cgCoins.filter(coin => !coinsToDelete.includes(coin.id));
      
      // Очищаем список отмеченных
      this.selectedCoinIds = [];
      
      // Сохраняем изменения
      localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
      localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
      
      this.closeCounterDropdown();
    },
    
    // Удалить отмеченные монеты из таблицы и добавить в избранное
    removeSelectedFromTable() {
      if (this.selectedCoinIds.length === 0) return;
      
      // Сохраняем копию списка
      const coinsToRemove = [...this.selectedCoinIds];
      
      // Удаляем каждую отмеченную монету из таблицы и добавляем в избранное
      coinsToRemove.forEach(coinId => {
        // Находим монету в текущих данных ПЕРЕД синхронизацией (которая удалит её из cgCoins)
        const coin = this.cgCoins.find(c => c.id === coinId);
        
        // Синхронизация: удаляем из таблицы, если монета там есть
        this.syncCoinWithFavorites(coinId, 'remove');
        
        // Добавляем в избранное, если монета была найдена
        if (coin) {
          // Проверяем, нет ли уже этой монеты в избранном
          const existsInFavorites = this.cgFavoriteCoins.some(favorite => favorite.id === coinId);
          if (!existsInFavorites) {
            // Сохраняем объект с id, symbol (тикер) и name (полное название)
            this.cgFavoriteCoins.push({
              id: coin.id,
              symbol: (coin.symbol || '').toUpperCase(),
              name: coin.name || coin.id
            });
          }
        }
      });
      
      // Сохраняем избранное
      localStorage.setItem('cgFavoriteCoins', JSON.stringify(this.cgFavoriteCoins));
      
      // Удаляем монеты из списка выбранных для запроса (если еще не удалены синхронизацией)
      coinsToRemove.forEach(coinId => {
        const index = this.cgSelectedCoins.indexOf(coinId);
        if (index > -1) {
          this.cgSelectedCoins.splice(index, 1);
        }
      });
      
      // Сохраняем изменения (cgCoins уже обновлен в syncCoinWithFavorites)
      localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
      
      // Очищаем список отмеченных
      this.selectedCoinIds = [];
      localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
      
      this.closeCounterDropdown();
    },
    
    // Открытие монеты на Bybit в новой вкладке
    openCoinOnBybit() {
      if (!this.contextMenuCoin) return;
      
      // Находим монету в списке для получения тикера
      const coin = this.cgCoins.find(c => c.id === this.contextMenuCoin);
      if (!coin || !coin.symbol) {
        console.error('Монета не найдена или отсутствует тикер');
        this.closeContextMenu();
        return;
          }
      
      // Формируем ссылку: https://www.bybit.com/trade/usdt/{тикер}USDT
      const ticker = coin.symbol.toUpperCase();
      const url = `https://www.bybit.com/trade/usdt/${ticker}USDT`;
      
      // Открываем в новой вкладке
      window.open(url, '_blank');
      
      this.closeContextMenu();
    },
    
    // Удаление монеты из таблицы и добавление в избранное
    removeFromTable() {
      if (!this.contextMenuCoin) return;
      
      // Находим монету в текущих данных
      const coin = this.cgCoins.find(c => c.id === this.contextMenuCoin);
      if (!coin) return;
      
      // Синхронизация: удаляем из таблицы, если монета там есть
      this.syncCoinWithFavorites(this.contextMenuCoin, 'remove');
      
      // Добавляем в избранное, если монеты там еще нет
      const existsInFavorites = this.cgFavoriteCoins.some(favorite => favorite.id === this.contextMenuCoin);
      if (!existsInFavorites) {
        // Сохраняем объект с id, symbol (тикер) и name (полное название)
        // В CoinGecko API: coin.symbol - это тикер, coin.name - это полное название
        this.cgFavoriteCoins.push({
          id: coin.id,
          symbol: (coin.symbol || '').toUpperCase(), // Тикер в верхнем регистре (BTC, ETH)
          name: coin.name || coin.id // Полное название монеты (Bitcoin, Ethereum)
        });
        localStorage.setItem('cgFavoriteCoins', JSON.stringify(this.cgFavoriteCoins));
      }
      
      // Удаляем монету из выбранных чекбоксами, если она была отмечена
      const selectedIndex = this.selectedCoinIds.indexOf(this.contextMenuCoin);
      if (selectedIndex > -1) {
        this.selectedCoinIds.splice(selectedIndex, 1);
        localStorage.setItem('cgSelectedCoinIds', JSON.stringify(this.selectedCoinIds));
      }
      
      // Закрываем контекстное меню
      this.closeContextMenu();
    },
    
    // Добавление монеты из избранного в таблицу (старый метод для совместимости)
    addFavoriteToTable() {
      if (!this.selectedFavoriteCoin) return;
      this.addFavoriteToTableById(this.selectedFavoriteCoin);
      this.selectedFavoriteCoin = '';
    },
    
    // Добавление монеты из избранного в таблицу по ID
    // Если монета уже в таблице - просто закрываем dropdown (отметка показывается в UI)
    // Если монеты нет - добавляем её в таблицу
    async addFavoriteToTableById(coinId) {
      if (!coinId) return;
      
      // Проверяем, есть ли монета уже в таблице
      if (this.cgSelectedCoins.includes(coinId)) {
        // Монета уже в таблице - просто закрываем dropdown
        // Отметка уже показывается в выпадающем списке избранного
        this.closeFavoritesDropdown();
        return;
      }
      
      // Находим монету в избранном, чтобы получить тикер для failed- монет
      const favoriteCoin = this.cgFavoriteCoins.find(favorite => favorite.id === coinId);
      if (!favoriteCoin) return;
      
      let realCoinId = coinId;
      
      // Если это автоматически добавленная монета с неудачным тикером (failed-{ticker})
      if (coinId && typeof coinId === 'string' && coinId.startsWith('failed-')) {
        // Извлекаем тикер из ID (убираем префикс "failed-")
        const ticker = favoriteCoin.symbol || coinId.replace('failed-', '').toUpperCase();
        
        // Пытаемся найти реальный CoinGecko ID по тикеру
        try {
          realCoinId = await this.getCoinIdBySymbol(ticker);
          
          if (!realCoinId) {
            // Не удалось найти монету - возвращаем в избранное
            console.warn(`Failed to restore coin ${ticker}: not found on CoinGecko`);
            // Монета уже в избранном, просто не удаляем её
            return;
          }
        } catch (error) {
          console.error(`Error finding coin ID for ticker ${ticker}:`, error);
          // При ошибке - возвращаем в избранное
          return;
        }
      }
      
      // Сохраняем монету обратно в избранное на случай ошибки
      const favoriteCoinBackup = { ...favoriteCoin };
      
      // Синхронизация: удаляем из избранного и добавляем в таблицу (используем realCoinId)
      // НО: не удаляем из избранного, так как это хранилище избранного
      // this.syncCoinWithFavorites(realCoinId, 'add'); // УБРАНО: избранное не удаляется при добавлении в таблицу
      
      // Добавляем в активный список (используем realCoinId)
      if (!this.cgSelectedCoins.includes(realCoinId)) {
        this.cgSelectedCoins.push(realCoinId);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      }
      
      // Закрываем dropdown
      this.closeFavoritesDropdown();
      
      // Пытаемся обновить данные - при ошибке удаляем из таблицы (но оставляем в избранном)
      let restoreFailed = false;
      
      try {
        // Сохраняем состояние ошибки перед вызовом
        const errorBefore = this.cgError;
        
        await this.fetchCoinGecko();
        
        // Проверяем, что монета действительно появилась в таблице после загрузки
        // Ждем небольшую задержку, чтобы дать Vue время обновить реактивные данные
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const coinInTable = this.cgCoins.find(c => c.id === realCoinId);
        
        // Если монета не найдена в таблице ИЛИ возникла ошибка при загрузке
        if (!coinInTable || this.cgError) {
          restoreFailed = true;
          throw new Error(`Coin ${realCoinId} not found in table after fetch${this.cgError ? `: ${this.cgError}` : ''}`);
        }
      } catch (error) {
        restoreFailed = true;
        console.error(`Error fetching coin data for ${realCoinId}:`, error);
      }
      
      // Если добавление не удалось - удаляем из таблицы (но оставляем в избранном)
      if (restoreFailed) {
        // Удаляем из таблицы
        const tableIndex = this.cgSelectedCoins.indexOf(realCoinId);
        if (tableIndex > -1) {
          this.cgSelectedCoins.splice(tableIndex, 1);
          localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
        }
        // Монета остается в избранном (не возвращаем её туда, так как она там уже есть)
      }
    },
    
    // Получение названия монеты из избранного
    getFavoriteCoinName(favoriteCoin) {
      // favoriteCoin может быть объектом {id, symbol, name} или строкой (старый формат)
      if (typeof favoriteCoin === 'object' && favoriteCoin.name) {
        return favoriteCoin.name;
      }
      // Fallback: ищем в текущих данных или возвращаем ID
      const coin = this.cgCoins.find(c => c.id === (favoriteCoin.id || favoriteCoin));
      return coin ? coin.name : (favoriteCoin.id || favoriteCoin);
    },
    
    // Получение тикера монеты из избранного
    getFavoriteCoinSymbol(favoriteCoin) {
      // favoriteCoin может быть объектом {id, symbol, name} или строкой (старый формат)
      if (typeof favoriteCoin === 'object' && favoriteCoin.symbol) {
        return favoriteCoin.symbol;
      }
      // Fallback: ищем в текущих данных или возвращаем ID
      const coin = this.cgCoins.find(c => c.id === (favoriteCoin.id || favoriteCoin));
      return coin ? coin.symbol.toUpperCase() : (favoriteCoin.id || favoriteCoin).toUpperCase();
    },
    
    // Получение ID монеты из избранного
    getFavoriteCoinId(favoriteCoin) {
      // favoriteCoin может быть объектом {id, symbol, name} или строкой (старый формат)
      return typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
    },
    
    // Получение иконки монеты из избранного
    getFavoriteCoinIcon(favoriteCoin) {
      const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
      
      // Если это автоматически добавленная монета с неудачным тикером (неудачная попытка добавления)
      // определяем по префиксу "failed-" в ID
      if (coinId && typeof coinId === 'string' && coinId.startsWith('failed-')) {
        return null; // Возвращаем null, чтобы показать иконку рефреша в шаблоне
      }
      
      const coin = this.cgCoins.find(c => c.id === coinId);
      if (coin) {
        return this.getCoinIcon(coin);
      }
      // Пытаемся получить из кэша
      return this.cgIconsCache[coinId] || null;
    },
    
    // Проверка, является ли монета из избранного автоматически добавленной с неудачным тикером (неудачной попыткой)
    isFailedFavoriteCoin(favoriteCoin) {
      const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
      return coinId && typeof coinId === 'string' && coinId.startsWith('failed-');
    },
    
    // Форматирование даты обновления (дата)
    formatLastUpdatedDate(dateValue) {
      if (!dateValue) return '';
      // Поддержка как ISO строки, так и старого формата toLocaleString
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    
    // Форматирование времени обновления (время)
    formatLastUpdatedTime(dateValue) {
      if (!dateValue) return '';
      // Поддержка как ISO строки, так и старого формата toLocaleString
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },
    
    // Склонение слова "монета" для числа
    pluralizeCoins(count) {
      return window.pluralize(count, ['монета', 'монеты', 'монет']);
    },
    
    // Кэширование иконок монет в localStorage
    cacheCoinsIcons(coins) {
      if (!Array.isArray(coins) || coins.length === 0) return;
      
      // Проверяем время последнего обновления кэша (не чаще 1 раза в час)
      const CACHE_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 час в миллисекундах
      const lastUpdateTime = localStorage.getItem('cgIconsCacheTimestamp');
      const now = Date.now();
      
      // Если прошло меньше часа с последнего обновления - не обновляем
      if (lastUpdateTime && (now - parseInt(lastUpdateTime)) < CACHE_UPDATE_INTERVAL) {
        return;
      }
      
      let updated = false;
      
      coins.forEach(coin => {
        if (coin.image && !this.cgIconsCache[coin.id]) {
          this.cgIconsCache[coin.id] = coin.image;
          updated = true;
        }
      });
      
      // Сохраняем обновленный кэш в localStorage только если были изменения
      if (updated) {
        localStorage.setItem('cgIconsCache', JSON.stringify(this.cgIconsCache));
        localStorage.setItem('cgIconsCacheTimestamp', now.toString());
      }
    },
    
    // Получение иконки монеты из кэша (с fallback на coin.image)
    getCoinIcon(coin) {
      // Сначала проверяем кэш
      if (this.cgIconsCache[coin.id]) {
        return this.cgIconsCache[coin.id];
      }
      // Если в кэше нет - используем текущую иконку и кэшируем её
      if (coin.image) {
        this.cgIconsCache[coin.id] = coin.image;
        localStorage.setItem('cgIconsCache', JSON.stringify(this.cgIconsCache));
        return coin.image;
      }
      return null;
    },
    
    // Обработчик ввода в поле поиска
    // Обработчик фокуса на поле поиска
    handleSearchFocus() {
      if (!this.isAddingTickers && this.cgSearchResults.length > 0) {
        return; // Не выполняем поиск, если уже есть результаты
      }
      // Выполняем поиск, если поле не пустое
      if (this.cgSearchQuery) {
        this.searchCoins(this.cgSearchQuery);
      }
    },
    
    handleSearchInput(value) {
      // Если идет процесс добавления - игнорируем ввод
      if (this.isAddingTickers) {
        return;
      }
      // Иначе обновляем обычный запрос поиска
      // value может быть строкой (из header-coins) или объектом события (для обратной совместимости)
      const query = typeof value === 'string' ? value : (value?.target?.value || '');
      this.cgSearchQuery = query;
    },
    
    // Получение отображения оставшихся тикеров для поля поиска
    getPendingTickersDisplay() {
      return this.displayPendingTickers;
    },
    
    // Получение массива оставшихся тикеров для отображения
    getRemainingTickersDisplay() {
      const allTickers = [];
      if (this.currentAddingTicker) {
        allTickers.push(this.currentAddingTicker);
      }
      allTickers.push(...this.pendingTickers);
      allTickers.push(...this.failedTickers);
      return allTickers;
    },
    
    // Получение количества оставшихся тикеров
    getRemainingTickersCount() {
      return this.pendingTickers.length + this.failedTickers.length + (this.currentAddingTicker ? 1 : 0);
    }
  },
  
  watch: {
    // Поиск с задержкой для уменьшения количества запросов
    cgSearchQuery(newQuery) {
      clearTimeout(this.searchTimeout);
      
      // Если идет процесс добавления тикеров - не обрабатываем изменения
      if (this.isAddingTickers) {
        return;
      }
      
      if (!newQuery || newQuery.length < 1) {
        this.cgSearchResults = [];
        return;
      }
      
      // Проверяем, является ли запрос числом (для загрузки топ N монет)
      const trimmedQuery = newQuery.trim();
      const numberMatch = trimmedQuery.match(/^\d+$/);
      if (numberMatch) {
        const count = parseInt(numberMatch[0], 10);
        if (count > 0 && count <= 250) {
          // Показываем кастомные пункты сразу без задержки
          this.cgSearchResults = [
            {
              id: 'top-by-cap',
              type: 'top-by-cap',
              count: count,
              symbol: 'TOP',
              name: `Топ ${count} по капитализации`,
              thumb: null
            },
            {
              id: 'top-by-volume',
              type: 'top-by-volume',
              count: count,
              symbol: 'TOP',
              name: `Топ ${count} по дневному объему`,
              thumb: null
            }
          ];
          return;
        }
      }
      
      if (newQuery.length < 2) {
        this.cgSearchResults = [];
        return;
      }
      
      // Проверяем режим парсинга: если есть разделители (не буквы) - это режим парсинга
      // В режиме парсинга не делаем задержку, сразу парсим
      if (this.isParseMode(newQuery)) {
        // Режим парсинга: запускаем сразу без задержки
        this.parseAndAddTickers(newQuery);
      } else {
        // Обычный режим поиска: с задержкой
        this.searchTimeout = setTimeout(() => {
          this.searchCoins(newQuery);
        }, 500); // Задержка 500ms после ввода
      }
    }
  },

  mounted() {
    console.log('🔍 CoinGecko component mounted');
    // Проверяем и очищаем дубликаты между таблицей и избранным при загрузке
    this.syncAllCoinsWithFavorites();
    
    // Рассчитываем CPT для монет, загруженных из localStorage (если еще не рассчитан)
    // Источник: Этап 2 миграции математической модели
    // ВАЖНО: Выполняем в mounted(), чтобы гарантировать загрузку всех модулей
    // Используем setTimeout для гарантии, что все модули загружены
    setTimeout(() => {
      console.log('🔍 Проверка расчета CPT в mounted():');
      console.log('  - Монет в cgCoins:', this.cgCoins?.length || 0);
      console.log('  - mmMedianCPT доступен:', !!window.mmMedianCPT);
      console.log('  - computeEnhancedCPT доступен:', !!window.mmMedianCPT?.computeEnhancedCPT);
      
      if (this.cgCoins && this.cgCoins.length > 0) {
        if (!window.mmMedianCPT || !window.mmMedianCPT.computeEnhancedCPT) {
          console.warn('⚠️ mmMedianCPT не доступен. CPT не будет рассчитан.');
          return;
        }
        
        const horizonDays = 2;
        let needsUpdate = false;
        let calculatedCount = 0;
        const updatedCoins = this.cgCoins.map(coin => {
          // Если CPT уже рассчитан - не пересчитываем
          if (coin.enhancedCpt !== undefined && coin.enhancedCptFormatted !== undefined) {
            return coin;
          }
          // Проверяем наличие массива pvs
          if (!coin.pvs || !Array.isArray(coin.pvs) || coin.pvs.length !== 6) {
            console.warn(`⚠️ Монета ${coin.symbol || coin.id} не содержит корректный массив pvs. CPT не будет рассчитан.`);
            return coin;
          }
          // Рассчитываем CPT
          const cptValue = window.mmMedianCPT.computeEnhancedCPT(coin.pvs, horizonDays);
          const cptFormatted = window.mmMedianCPT.formatEnhancedCPT(cptValue);
          needsUpdate = true;
          calculatedCount++;
          return {
            ...coin,
            enhancedCpt: cptValue,
            enhancedCptFormatted: cptFormatted
          };
        });
        
        // Обновляем реактивные данные
        this.cgCoins = updatedCoins;
        
        // Сохраняем обновленные данные в localStorage, если были изменения
        if (needsUpdate) {
          localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
          console.log(`✅ CPT рассчитан для ${calculatedCount} монет из ${updatedCoins.length}`);
        } else {
          console.log('ℹ️ CPT уже рассчитан для всех монет или нет монет для расчета');
        }
      } else {
        console.log('ℹ️ Нет монет для расчета CPT');
      }
    }, 100); // Небольшая задержка для гарантии загрузки всех модулей
    
    this.handleUnlock = () => {
      // Загружаем данные только если нет сохраненных данных
      if (this.cgCoins.length === 0) {
        this.fetchCoinGecko();
      }
    };
    window.addEventListener('app-unlocked', this.handleUnlock);
    if (window.appUnlocked && this.cgCoins.length === 0) {
      this.fetchCoinGecko();
    }
    
    // Подписываемся на глобальное событие закрытия всех выпадающих списков
    this.handleCloseAllDropdownsBound = this.handleCloseAllDropdowns.bind(this);
    document.addEventListener('close-all-dropdowns', this.handleCloseAllDropdownsBound);
  },

  beforeUnmount() {
    if (this.handleUnlock) {
      window.removeEventListener('app-unlocked', this.handleUnlock);
    }
    
    // Отписываемся от глобального события
    if (this.handleCloseAllDropdownsBound) {
      document.removeEventListener('close-all-dropdowns', this.handleCloseAllDropdownsBound);
    }
  }
};
