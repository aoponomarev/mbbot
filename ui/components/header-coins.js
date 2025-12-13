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
    // Архив
    showArchiveDropdown: {
      type: Boolean,
      default: false
    },
    cgArchivedCoins: {
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
    // Кэш иконок для получения иконок монет из архива
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
    'delete-selected-coins',
    'archive-selected-coins',
    'search-input',
    'search-focus',
    'close-search-dropdown',
    'stop-adding-tickers',
    'add-coin',
    'toggle-archive-dropdown',
    'close-archive-dropdown',
    'restore-from-archive',
    'fetch-coins'
  ],
  
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
    
    // Получение ID монеты из архива
    getArchivedCoinId(archivedCoin) {
      return typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
    },
    
    // Получение названия монеты из архива
    getArchivedCoinName(archivedCoin) {
      if (typeof archivedCoin === 'object' && archivedCoin.name) {
        return archivedCoin.name;
      }
      return typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
    },
    
    // Получение тикера монеты из архива
    getArchivedCoinSymbol(archivedCoin) {
      if (typeof archivedCoin === 'object' && archivedCoin.symbol) {
        return archivedCoin.symbol;
      }
      return typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
    },
    
    // Получение иконки монеты из архива
    getArchivedCoinIcon(archivedCoin) {
      const coinId = typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
      if (coinId && typeof coinId === 'string' && coinId.startsWith('failed-')) {
        return null; // Не показываем иконку для неудачных попыток
      }
      // Получаем иконку из кэша
      return this.cgIconsCache[coinId] || null;
    },
    
    // Проверка, является ли монета неудачной попыткой
    isFailedArchivedCoin(archivedCoin) {
      const coinId = typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
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
    
    handleDeleteSelectedCoins() {
      this.$emit('delete-selected-coins');
    },
    
    handleArchiveSelectedCoins() {
      this.$emit('archive-selected-coins');
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
    
    handleToggleArchiveDropdown() {
      this.$emit('toggle-archive-dropdown');
    },
    
    handleRestoreFromArchive(coinId) {
      this.$emit('restore-from-archive', coinId);
    },
    
    handleFetchCoins() {
      this.$emit('fetch-coins');
    }
  },
  
};

