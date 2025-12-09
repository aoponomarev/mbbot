// Футер приложения с версиями фреймворков и индексами рынка
// Vue компонент с x-template шаблоном
window.cmpFooter = {
  template: '#footer-template',

  data() {
    return {
      vueVersion: '3.5.25',
      bootstrapVersion: '5.3.8',
      // Индексы рынка
      fgi: '—',
      vix: '—',
      btcDom: '—',
      oi: '—',
      fr: '—',
      lsr: '—',
      // Числовые значения для расчета цветов
      fgiValue: null,
      vixValue: null,
      btcDomValue: null,
      frValue: null,
      lsrValue: null
    };
  },

  computed: {
    // Цвет иконки BTC: цветная если доминирует (>50%), серая если нет
    btcDomColor() {
      if (this.btcDomValue === null) return '#6c757d'; // серый по умолчанию
      return this.btcDomValue > 50 ? '#F7931A' : '#6c757d'; // оранжевый если доминирует, иначе серый
    },

    // Цвет FGI: красный (0-25), оранжевый (26-45), серый (46-55), зеленый (56-75), яркий зеленый (76-100)
    fgiColor() {
      if (this.fgiValue === null) return '#6c757d';
      if (this.fgiValue <= 25) return '#dc3545'; // красный - Extreme Fear
      if (this.fgiValue <= 45) return '#fd7e14'; // оранжевый - Fear
      if (this.fgiValue <= 55) return '#6c757d'; // серый - Neutral
      if (this.fgiValue <= 75) return '#28a745'; // зеленый - Greed
      return '#20c997'; // яркий зеленый - Extreme Greed
    },

    // Цвет VIX: зеленый (<20), серый (20-30), красный (>30)
    vixColor() {
      if (this.vixValue === null) return '#6c757d';
      if (this.vixValue < 20) return '#28a745'; // зеленый - Low volatility
      if (this.vixValue <= 30) return '#6c757d'; // серый - Normal
      return '#dc3545'; // красный - High volatility
    },

    // Цвет Open Interest: всегда серый (нейтральный индикатор)
    oiColor() {
      return '#6c757d';
    },

    // Цвет Funding Rate: зеленый (отрицательный), серый (около 0), красный (положительный)
    frColor() {
      if (this.frValue === null) return '#6c757d';
      const fr = this.frValue;
      if (fr < -0.01) return '#28a745'; // зеленый - отрицательный (медвежий)
      if (fr <= 0.01) return '#6c757d'; // серый - нейтральный
      return '#dc3545'; // красный - положительный (бычий)
    },

    // Цвет Long/Short Ratio: красный (<1.0), серый (1.0), зеленый (>1.0)
    lsrColor() {
      if (this.lsrValue === null) return '#6c757d';
      if (this.lsrValue < 1.0) return '#dc3545'; // красный - больше шортов
      if (this.lsrValue === 1.0) return '#6c757d'; // серый - равновесие
      return '#28a745'; // зеленый - больше лонгов
    }
  },

  methods: {
    // Загрузка индексов рынка через модуль market-metrics
    async fetchMarketIndices() {
      if (!window.marketMetrics) {
        console.error('marketMetrics module not loaded');
        return;
      }

      try {
        const metrics = await window.marketMetrics.fetchAll();
        this.fgi = metrics.fgi;
        this.vix = metrics.vix;
        this.btcDom = metrics.btcDom;
        this.oi = metrics.oi;
        this.fr = metrics.fr;
        this.lsr = metrics.lsr;

        // Парсим числовые значения для расчета цветов
        this.fgiValue = metrics.fgi !== '—' ? parseFloat(metrics.fgi) : null;
        this.vixValue = metrics.vix !== '—' ? parseFloat(metrics.vix) : null;
        
        // BTC Dominance: убираем % и парсим
        if (metrics.btcDom !== '—') {
          this.btcDomValue = parseFloat(metrics.btcDom.replace('%', ''));
        } else {
          this.btcDomValue = null;
        }

        // Funding Rate: убираем % и парсим
        if (metrics.fr !== '—') {
          this.frValue = parseFloat(metrics.fr.replace('%', ''));
        } else {
          this.frValue = null;
        }

        // Long/Short Ratio: парсим напрямую
        this.lsrValue = metrics.lsr !== '—' ? parseFloat(metrics.lsr) : null;
      } catch (error) {
        console.error('Market indices fetch error:', error);
      }
    }
  },

  mounted() {
    // Получаем версию Vue из глобального объекта
    if (typeof Vue !== 'undefined' && Vue.version) {
      this.vueVersion = Vue.version;
    }

    // Загружаем индексы рынка только если приложение разблокировано
    if (window.appUnlocked) {
      this.fetchMarketIndices();
    } else {
      // Ждем разблокировки приложения
      const checkUnlocked = () => {
        if (window.appUnlocked) {
          this.fetchMarketIndices();
        } else {
          setTimeout(checkUnlocked, 100);
        }
      };
      checkUnlocked();
    }

    // Обновляем индексы каждые 5 минут
    setInterval(() => {
      if (window.appUnlocked) {
        this.fetchMarketIndices();
      }
    }, 5 * 60 * 1000);
  }
};

