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
    'remove-selected-coins',
    'search-input',
    'search-focus',
    'close-search-dropdown',
    'stop-adding-tickers',
    'add-coin',
    'toggle-favorites-dropdown',
    'close-favorites-dropdown',
    'add-favorite-to-table',
    'fetch-coins'
  ],
  
  computed: {
    // Динамический текст для кнопки обновления во время загрузки
    updateButtonLoadingText() {
      if (this.cgIsLoading && this.totalCoinsCount > 0) {
        return this.totalCoinsCount.toString();
      }
      return null;
    }
  },
  
  methods: {
    // Получение количества оставшихся тикеров
    getRemainingTickersCount() {
      const pendingCount = this.pendingTickers ? this.pendingTickers.length : 0;
      return pendingCount + this.failedTickers.length + (this.currentAddingTicker ? 1 : 0);
    },
    
    // Получение списка оставшихся тикеров для отображения
    getRemainingTickersDisplay() {
      const allTickers = [];
      if (this.currentAddingTicker) {
        allTickers.push(this.currentAddingTicker);
      }
      if (this.pendingTickers && this.pendingTickers.length > 0) {
        allTickers.push(...this.pendingTickers);
      }
      return allTickers;
    },
    
    // Получение ID монеты из избранного
    getFavoriteCoinId(favoriteCoin) {
      return typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
    },
    
    // Получение названия монеты из избранного
    getFavoriteCoinName(favoriteCoin) {
      if (typeof favoriteCoin === 'object' && favoriteCoin.name) {
        return favoriteCoin.name;
      }
      return typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
    },
    
    // Получение тикера монеты из избранного
    getFavoriteCoinSymbol(favoriteCoin) {
      if (typeof favoriteCoin === 'object' && favoriteCoin.symbol) {
        return favoriteCoin.symbol;
      }
      return typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
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
    
    handleToggleFavoritesDropdown() {
      this.$emit('toggle-favorites-dropdown');
    },
    
    handleAddFavoriteToTable(coinId) {
      this.$emit('add-favorite-to-table', coinId);
    },
    
    handleFetchCoins() {
      this.$emit('fetch-coins');
    }
  },
  
};

