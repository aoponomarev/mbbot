// CoinGecko виджет топ-10: цена и изменения 1h/24h/7d/30d/60d
window.cmpCoinGecko = function () {
  const ids = [
    'bitcoin',
    'ethereum',
    'solana',
    'binancecoin',
    'ripple',
    'cardano',
    'dogecoin',
    'tron',
    'avalanche-2',
    'polkadot'
  ];

  const priceChangeParams = '1h,24h,7d,30d,60d';

  return {
    data: {
      cgCoins: [],
      cgIsLoading: false,
      cgError: null,
      cgLastUpdated: null
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
          const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&price_change_percentage=${priceChangeParams}`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const data = await res.json();
          this.cgCoins = Array.isArray(data) ? data : [];
          this.cgLastUpdated = new Date().toLocaleString();
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
      }
    },
    mounted() {
      this.handleUnlock = () => {
        this.fetchCoinGecko();
      };
      window.addEventListener('app-unlocked', this.handleUnlock);
      if (window.appUnlocked) {
        this.fetchCoinGecko();
      }
    },
    beforeUnmount() {
      window.removeEventListener('app-unlocked', this.handleUnlock);
    }
  };
};
