// =========================
// КОМПОНЕНТ ПЕРВЫХ ДВУХ КОЛОНОК ТАБЛИЦЫ (№ и Тикер)
// Используется во всех таблицах вкладок математической модели Median
// =========================
// Компонент обеспечивает единообразие первых двух колонок (№ и Тикер) во всех таблицах.
// Это гарантирует синхронизацию отображения и поведения на всех вкладках.

window.cmpTableCoinRow = {
  template: '#table-coin-row-template',
  
  props: {
    // Индекс строки (для номера)
    index: {
      type: Number,
      required: true
    },
    // Объект монеты
    coin: {
      type: Object,
      required: true
    }
  },
  
  computed: {
    // Детерминированный хэш экземпляра на основе coin.id или индекса
    // Стабилен между сессиями - один и тот же coin.id всегда дает один и тот же хэш
    instanceHash() {
      if (!window.hashGenerator) {
        console.warn('hashGenerator not found, using fallback');
        return 'avto-00000000';
      }
      // Используем coin.id если есть, иначе комбинацию индекса и тикера
      const uniqueId = this.coin.id || `${this.coin.symbol || ''}-${this.index}` || `row-${this.index}`;
      return window.hashGenerator.generateMarkupClass(uniqueId);
    }
  },
  
  methods: {
    // Получить ссылку на Bybit для монеты
    getBybitLink(ticker) {
      return `https://www.bybit.com/trade/usdt/${ticker}USDT`;
    },
    
    // Получить тикер монеты
    getTicker() {
      return this.coin.symbol || this.coin.id || '';
    },
    
    // Получить название монеты
    getName() {
      return this.coin.name || this.getTicker();
    }
  }
};

