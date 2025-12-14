// Компонент хедера для карточек с индикатором монет
// Vue компонент с x-template шаблоном
window.cmpHeaderCoins = {
  template: '#header-coins-template',
  
  props: {
    // Счетчик монет
    selectedCoinsCount: {
      type: Number,
      required: true
    },
    totalCoinsCount: {
      type: Number,
      required: true
    },
    selectedCoinsPercentage: {
      type: Number,
      required: true
    },
    showCounterDropdown: {
      type: Boolean,
      default: false
    },
    // Поиск
    searchQueryDisplay: {
      type: String,
      default: ''
    },
    isAddingTickers: {
      type: Boolean,
      default: false
    },
    currentAddingTicker: {
      type: String,
      default: null
    },
    failedTickers: {
      type: Array,
      default: () => []
    },
    tickerAttempts: {
      type: Object,
      default: () => ({})
    },
    cgSearchResults: {
      type: Array,
      default: () => []
    },
    cgSelectedCoins: {
      type: Array,
      default: () => []
    },
    cgCoins: {
      type: Array,
      default: () => []
    },
    // Избранное
    showFavoritesDropdown: {
      type: Boolean,
      default: false
    },
    cgFavoriteCoins: {
      type: Array,
      default: () => []
    },
    // Обновление
    cgLastUpdated: {
      type: String,
      default: null
    },
    cgIsLoading: {
      type: Boolean,
      default: false
    },
    // Дополнительные данные для вычислений
    pendingTickers: {
      type: Array,
      default: () => []
    },
    // Кэш иконок для получения иконок монет из избранного
    cgIconsCache: {
      type: Object,
      default: () => ({})
    }
  },
  
  emits: [
    'toggle-counter-dropdown',
    'close-counter-dropdown',
    'select-all-coins',
    'deselect-all-coins',
    'select-favorites',
    'delete-selected-coins',
    'search-input',
    'search-focus',
    'close-search-dropdown',
    'stop-adding-tickers',
    'add-coin',
    'toggle-favorites-dropdown',
    'close-favorites-dropdown',
    'add-favorite-to-table',
    'remove-favorite-from-favorites',
    'fetch-coins'
  ],
  
  data() {
    return {
      isTogglingFavorites: false // Флаг для предотвращения двойной обработки события
    };
  },
  
  computed: {
    // Динамический текст для кнопки обновления во время загрузки
    updateButtonLoadingText() {
      if (this.cgIsLoading && this.totalCoinsCount > 0) {
        return this.totalCoinsCount.toString();
      }
      return null;
    },
    
    // Количество оставшихся тикеров для добавления
    remainingTickersCount() {
      const pendingCount = this.pendingTickers ? this.pendingTickers.length : 0;
      return pendingCount + this.failedTickers.length + (this.currentAddingTicker ? 1 : 0);
    },
    
    // Список оставшихся тикеров для отображения
    remainingTickersDisplay() {
      const allTickers = [];
      if (this.currentAddingTicker) {
        allTickers.push(this.currentAddingTicker);
      }
      if (this.pendingTickers && this.pendingTickers.length > 0) {
        allTickers.push(...this.pendingTickers);
      }
      return allTickers;
    }
  },
  
  methods: {
    // Вспомогательный метод для получения данных монеты из избранного
    _getFavoriteCoinData(favoriteCoin) {
      if (typeof favoriteCoin === 'object') {
        return {
          id: favoriteCoin.id,
          name: favoriteCoin.name || favoriteCoin.id,
          symbol: favoriteCoin.symbol || favoriteCoin.id
        };
      }
      return { id: favoriteCoin, name: favoriteCoin, symbol: favoriteCoin };
    },
    
    // Получение ID монеты из избранного
    getFavoriteCoinId(favoriteCoin) {
      return this._getFavoriteCoinData(favoriteCoin).id;
    },
    
    // Получение названия монеты из избранного
    getFavoriteCoinName(favoriteCoin) {
      return this._getFavoriteCoinData(favoriteCoin).name;
    },
    
    // Получение тикера монеты из избранного
    getFavoriteCoinSymbol(favoriteCoin) {
      return this._getFavoriteCoinData(favoriteCoin).symbol;
    },
    
    // Получение иконки монеты из избранного
    getFavoriteCoinIcon(favoriteCoin) {
      const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
      if (coinId && typeof coinId === 'string' && coinId.startsWith('failed-')) {
        return null; // Не показываем иконку для неудачных попыток
      }
      // Получаем иконку из кэша
      return this.cgIconsCache[coinId] || null;
    },
    
    // Проверка, является ли монета неудачной попыткой
    isFailedFavoriteCoin(favoriteCoin) {
      const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
      return coinId && typeof coinId === 'string' && coinId.startsWith('failed-');
    },
    
    // Форматирование даты обновления
    formatLastUpdatedDate(dateValue) {
      if (!dateValue) return '';
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    
    // Форматирование времени обновления
    formatLastUpdatedTime(dateValue) {
      if (!dateValue) return '';
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },
    
    // Обработчики событий
    handleToggleCounterDropdown() {
      this.$emit('toggle-counter-dropdown');
    },
    
    handleSelectAllCoins() {
      this.$emit('select-all-coins');
    },
    
    handleDeselectAllCoins() {
      this.$emit('deselect-all-coins');
    },
    
    handleSelectFavorites() {
      this.$emit('select-favorites');
    },
    
    handleDeleteSelectedCoins() {
      this.$emit('delete-selected-coins');
    },
    
    handleSearchInput(event) {
      this.$emit('search-input', event.target.value);
    },
    
    handleSearchFocus() {
      this.$emit('search-focus');
    },
    
    handleStopAddingTickers() {
      this.$emit('stop-adding-tickers');
    },
    
    handleAddCoin(coinId) {
      this.$emit('add-coin', coinId);
    },
    
    handleToggleFavoritesDropdown(event) {
      // Предотвращаем двойную обработку события
      if (this.isTogglingFavorites) {
        return;
      }
      
      // Устанавливаем флаг
      this.isTogglingFavorites = true;
      
      // Если передан объект события, останавливаем всплытие
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      
      // Эмитим событие для родительского компонента
      this.$emit('toggle-favorites-dropdown');
      
      // Задержка для предотвращения повторной обработки события (время анимации открытия меню)
      const TOGGLE_FAVORITES_DELAY = 100;
      setTimeout(() => {
        this.isTogglingFavorites = false;
      }, TOGGLE_FAVORITES_DELAY);
    },
    
    handleAddFavoriteToTable(coinId) {
      this.$emit('add-favorite-to-table', coinId);
    },
    
    handleRemoveFavoriteFromFavorites(coinId) {
      this.$emit('remove-favorite-from-favorites', coinId);
    },
    
    // Проверка, есть ли монета в таблице
    isCoinInTable(coinId) {
      return this.cgCoins.some(coin => coin.id === coinId);
    },
    
    handleFetchCoins() {
      this.$emit('fetch-coins');
    }
  },
  
};

