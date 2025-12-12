// =========================
// КОМПОНЕНТ ЯЧЕЙКИ МОНЕТЫ
// Переиспользуемый компонент для отображения монеты в таблице
// =========================
// Компонент обеспечивает:
// - Отображение иконки монеты
// - Отображение тикера монеты
// - Полное название во всплывающей подсказке (title)
// - Обработку кликов и контекстного меню
// - Кастомизацию через CSS-классы

window.cmpCellCoin = {
  template: '#cell-coin-template',
  
  props: {
    // URL иконки монеты
    iconUrl: {
      type: String,
      default: ''
    },
    // Тикер монеты (BTC, ETH, USDT)
    ticker: {
      type: String,
      default: '',
      required: true
    },
    // Полное название монеты (Bitcoin, Ethereum) - для title
    fullName: {
      type: String,
      default: ''
    },
    // ID монеты (для событий)
    coinId: {
      type: String,
      required: true
    },
    // CSS-классы для частей компонента
    cssClasses: {
      type: Object,
      default: () => ({
        cell: '',
        icon: '',
        ticker: ''
      })
    }
  },
  
  computed: {
    // Детерминированный хэш экземпляра на основе coinId
    // Стабилен между сессиями - один и тот же coinId всегда дает один и тот же хэш
    instanceHash() {
      if (!window.hashGenerator) {
        console.warn('hashGenerator not found, using fallback');
        return 'avto-00000000';
      }
      return window.hashGenerator.generateMarkupClass(this.coinId);
    }
  },
  
  methods: {
    // Обработка клика - эмитим событие для открытия контекстного меню
    handleClick(event) {
      this.$emit('context-menu', event, this.coinId);
    },
    
    // Обработка контекстного меню (ПКМ) - эмитим событие
    handleContextMenu(event) {
      this.$emit('context-menu', event, this.coinId);
    }
  }
};

