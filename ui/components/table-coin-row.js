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

