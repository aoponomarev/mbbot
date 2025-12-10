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
      lsrValue: null,
      // Состояние загрузки метрик
      isLoading: true,
      loadingSpinnerIndex: 0,
      loadingSpinnerInterval: null,
      // Символы для анимации загрузки (олдскульные слеши)
      loadingSpinnerChars: ['|', '/', '-', '\\']
    };
  },

  computed: {
    // Текущий символ анимации загрузки
    loadingSpinner() {
      return this.loadingSpinnerChars[this.loadingSpinnerIndex];
    },

    // Отображаемые значения метрик (с анимацией загрузки)
    displayFGI() {
      return this.isLoading && this.fgi === '—' ? this.loadingSpinner : this.fgi;
    },
    displayVIX() {
      return this.isLoading && this.vix === '—' ? this.loadingSpinner : this.vix;
    },
    displayBTCDom() {
      return this.isLoading && this.btcDom === '—' ? this.loadingSpinner : this.btcDom;
    },
    displayOI() {
      return this.isLoading && this.oi === '—' ? this.loadingSpinner : this.oi;
    },
    displayFR() {
      return this.isLoading && this.fr === '—' ? this.loadingSpinner : this.fr;
    },
    displayLSR() {
      return this.isLoading && this.lsr === '—' ? this.loadingSpinner : this.lsr;
    },

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
    // Запуск анимации загрузки (вращающиеся слеши)
    startLoadingSpinner() {
      if (this.loadingSpinnerInterval) return; // Уже запущена
      this.loadingSpinnerIndex = 0;
      this.loadingSpinnerInterval = setInterval(() => {
        this.loadingSpinnerIndex = (this.loadingSpinnerIndex + 1) % this.loadingSpinnerChars.length;
      }, 150); // Обновление каждые 150мс для плавной анимации
    },

    // Остановка анимации загрузки
    stopLoadingSpinner() {
      if (this.loadingSpinnerInterval) {
        clearInterval(this.loadingSpinnerInterval);
        this.loadingSpinnerInterval = null;
      }
    },

    // Загрузка индексов рынка через модуль market-metrics
    async fetchMarketIndices() {
      if (!window.marketMetrics) {
        console.error('marketMetrics module not loaded');
        return;
      }

      // Проверяем кэш метрик (не чаще 1 раза в час)
      const CACHE_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 час в миллисекундах
      const cachedMetrics = localStorage.getItem('marketMetricsCache');
      const cacheTimestamp = localStorage.getItem('marketMetricsCacheTimestamp');
      const now = Date.now();

      // Если есть кэш и прошло меньше часа - используем кэш
      if (cachedMetrics && cacheTimestamp) {
        const timeSinceUpdate = now - parseInt(cacheTimestamp);
        if (timeSinceUpdate < CACHE_UPDATE_INTERVAL) {
          try {
            const metrics = JSON.parse(cachedMetrics);
            // Фильтруем символы анимации из кэша (заменяем на "—")
            const filteredMetrics = this.filterSpinnerChars(metrics);
            
            // Проверяем, есть ли хотя бы одна валидная метрика
            const hasValidMetrics = Object.values(filteredMetrics).some(value => value !== '—' && value !== null && value !== undefined);
            
            if (hasValidMetrics) {
              // Применяем метрики из кэша
              this.applyMetrics(filteredMetrics);
              
              // Проверяем, есть ли неопределенные метрики (—)
              const hasUndefinedMetrics = Object.values(filteredMetrics).some(value => value === '—');
              
              // Если есть неопределенные метрики - продолжаем загрузку для них
              if (hasUndefinedMetrics) {
                // Устанавливаем состояние загрузки для неопределенных метрик
                this.isLoading = true;
                this.startLoadingSpinner();
                // Продолжаем выполнение - будет сделан запрос к API
              } else {
                // Все метрики определены - используем кэш, не делаем запрос
                return;
              }
            } else {
              // Кэш содержит только пустые значения - удаляем его и загружаем заново
              localStorage.removeItem('marketMetricsCache');
              localStorage.removeItem('marketMetricsCacheTimestamp');
            }
          } catch (error) {
            console.warn('Failed to parse cached metrics, fetching new data:', error);
            // Удаляем поврежденный кэш
            localStorage.removeItem('marketMetricsCache');
            localStorage.removeItem('marketMetricsCacheTimestamp');
          }
        }
      }

      // Устанавливаем состояние загрузки и запускаем анимацию
      this.isLoading = true;
      this.startLoadingSpinner();

      try {
        const metrics = await window.marketMetrics.fetchAll();
        
        // Фильтруем символы анимации перед сохранением в кэш
        const filteredMetrics = this.filterSpinnerChars(metrics);
        
        // Проверяем, есть ли хотя бы одна метрика с реальным значением (не "—")
        const hasValidMetrics = Object.values(filteredMetrics).some(value => value !== '—' && value !== null && value !== undefined);
        
        // Кэшируем только если есть хотя бы одна успешно загруженная метрика
        // При этом фильтруем символы анимации - они не должны попадать в кэш
        if (hasValidMetrics) {
          localStorage.setItem('marketMetricsCache', JSON.stringify(filteredMetrics));
          localStorage.setItem('marketMetricsCacheTimestamp', now.toString());
        }
        
        // Применяем метрики (даже если они пустые, чтобы показать состояние загрузки)
        this.applyMetrics(filteredMetrics);

        // Останавливаем анимацию после загрузки
        this.isLoading = false;
        this.stopLoadingSpinner();
      } catch (error) {
        console.error('Market indices fetch error:', error);
        // Останавливаем анимацию даже при ошибке
        this.isLoading = false;
        this.stopLoadingSpinner();
      }
    },

    // Фильтрация символов анимации из метрик (заменяет на "—")
    filterSpinnerChars(metrics) {
      const spinnerChars = ['|', '/', '-', '\\'];
      const filtered = {};
      
      Object.keys(metrics).forEach(key => {
        const value = metrics[key];
        // Если значение является символом анимации - заменяем на "—"
        if (spinnerChars.includes(value)) {
          filtered[key] = '—';
        } else {
          filtered[key] = value;
        }
      });
      
      return filtered;
    },

    // Применение метрик к компоненту (используется и для кэша, и для новых данных)
    applyMetrics(metrics) {
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

    // Проверяем необходимость обновления каждые 5 минут (обновление произойдет только если прошло больше часа)
    setInterval(() => {
      if (window.appUnlocked) {
        this.fetchMarketIndices();
      }
    }, 5 * 60 * 1000);
  },

  beforeUnmount() {
    // Очищаем интервал при размонтировании компонента
    this.stopLoadingSpinner();
  }
};

