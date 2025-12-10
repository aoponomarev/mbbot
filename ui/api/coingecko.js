// Компонент виджета CoinGecko
// Vue компонент с x-template шаблоном
window.cmpCoinGecko = {
  template: '#coingecko-template',

  data() {
    // Загружаем сохраненные данные монет из localStorage
    const savedCoins = localStorage.getItem('cgCoins');
    const savedLastUpdated = localStorage.getItem('cgLastUpdated');
    
    // Загружаем список выбранных монет (по умолчанию топ-10)
    const savedSelectedCoins = localStorage.getItem('cgSelectedCoins');
    const defaultCoins = [
      'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
      'cardano', 'dogecoin', 'tron', 'avalanche-2', 'polkadot'
    ];
    
    return {
      cgCoins: savedCoins ? JSON.parse(savedCoins) : [],
      cgIsLoading: false,
      cgError: null,
      cgLastUpdated: savedLastUpdated || null,
      cgSelectedCoins: savedSelectedCoins ? JSON.parse(savedSelectedCoins) : defaultCoins,
      // Поиск монет
      cgSearchQuery: '',
      cgSearchResults: [],
      cgSearching: false
    };
  },

  methods: {
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
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        this.cgCoins = Array.isArray(data) ? data : [];
        this.cgLastUpdated = new Date().toLocaleString();
        
        // Сохраняем полный набор данных в localStorage
        localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
        localStorage.setItem('cgLastUpdated', this.cgLastUpdated);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      } catch (error) {
        console.error('CoinGecko fetch error', error);
        this.cgError = error.message || 'Не удалось загрузить данные';
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
    
    // Поиск монет по названию или тикеру
    async searchCoins(query) {
      if (!query || query.length < 2) {
        this.cgSearchResults = [];
        return;
      }
      
      this.cgSearching = true;
      try {
        const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        // Ограничиваем результаты первыми 10 для удобства
        this.cgSearchResults = data.coins ? data.coins.slice(0, 10) : [];
      } catch (error) {
        console.error('CoinGecko search error', error);
        this.cgSearchResults = [];
      } finally {
        this.cgSearching = false;
      }
    },
    
    // Добавление монеты в список
    addCoin(coinId) {
      if (!this.cgSelectedCoins.includes(coinId)) {
        this.cgSelectedCoins.push(coinId);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
        // Обновляем данные для добавленной монеты
        this.fetchCoinGecko();
      }
      // Очищаем поиск
      this.cgSearchQuery = '';
      this.cgSearchResults = [];
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
      }
    }
  },
  
  watch: {
    // Поиск с задержкой для уменьшения количества запросов
    cgSearchQuery(newQuery) {
      clearTimeout(this.searchTimeout);
      if (newQuery && newQuery.length >= 2) {
        this.searchTimeout = setTimeout(() => {
          this.searchCoins(newQuery);
        }, 500); // Задержка 500ms после ввода
      } else {
        this.cgSearchResults = [];
      }
    }
  },

  mounted() {
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
  },

  beforeUnmount() {
    if (this.handleUnlock) {
      window.removeEventListener('app-unlocked', this.handleUnlock);
    }
  }
};
