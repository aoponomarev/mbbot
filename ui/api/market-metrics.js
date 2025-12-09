// Утилита для получения метрик рынка
// Независимый модуль (не Vue компонент), экспортирует функции через window
window.marketMetrics = {
  // Утилита для ограничения значения в диапазоне
  clamp(value, min, max) {
    if (value === null || value === undefined || isNaN(value)) return min;
    return Math.max(min, Math.min(max, parseFloat(value)));
  },

  // Утилита для безопасного преобразования в число
  safeNumber(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  },

  // Получение FGI (Fear & Greed Index)
  async fetchFGI() {
    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      const data = await response.json();
      const value = this.clamp(parseInt(data?.data?.[0]?.value), 0, 100);
      return { success: true, value: value.toString() };
    } catch (error) {
      console.error('FGI fetch error:', error);
      return { success: false, value: null };
    }
  },

  // Получение VIX из нескольких источников (fallback стратегия)
  async fetchVIX() {
    const sources = [
      async () => {
        const resp = await fetch('https://api.allorigins.win/raw?url=https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d');
        const data = await resp.json();
        return this.safeNumber(data?.chart?.result?.[0]?.meta?.regularMarketPrice, null);
      },
      async () => {
        const resp = await fetch('https://stooq.com/q/d/l/?s=^vix&i=d');
        const text = await resp.text();
        const lines = text.trim().split('\n');
        const last = lines[lines.length - 1]?.split(',');
        return this.safeNumber(last ? parseFloat(last[4]) : null, null);
      }
    ];

    for (const getter of sources) {
      try {
        const val = await getter.call(this);
        if (val !== null && Number.isFinite(val) && val > 0 && val < 1000) {
          return { success: true, value: val.toFixed(2) };
        }
      } catch (error) {
        // Пробуем следующий источник
      }
    }
    return { success: false, value: null };
  },

  // Получение BTC Dominance
  async fetchBTCDominance() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      const data = await response.json();
      const value = this.clamp(parseFloat(data?.data?.market_cap_percentage?.btc), 0, 100);
      return { success: true, value: value.toFixed(1) + '%' };
    } catch (error) {
      console.error('BTC Dominance fetch error:', error);
      return { success: false, value: null };
    }
  },

  // Получение Open Interest
  async fetchOpenInterest() {
    try {
      const response = await fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=1');
      const data = await response.json();
      const value = this.safeNumber(data?.[0]?.sumOpenInterestValue, 0);
      return { 
        success: true, 
        value: value ? ('$' + (value / 1e9).toFixed(2) + 'B') : null 
      };
    } catch (error) {
      console.error('Open Interest fetch error:', error);
      return { success: false, value: null };
    }
  },

  // Получение Funding Rate
  async fetchFundingRate() {
    try {
      const response = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
      const data = await response.json();
      const value = Array.isArray(data) && data.length > 0
        ? data.reduce((sum, item) => sum + this.safeNumber(item.lastFundingRate, 0), 0) / data.length * 100
        : 0;
      return { success: true, value: value.toFixed(4) + '%' };
    } catch (error) {
      console.error('Funding Rate fetch error:', error);
      return { success: false, value: null };
    }
  },

  // Получение Long/Short Ratio
  async fetchLongShortRatio() {
    try {
      const response = await fetch('https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=5m&limit=1');
      const data = await response.json();
      const value = this.safeNumber(data?.[0]?.longShortRatio, 1);
      return { success: true, value: value.toFixed(2) };
    } catch (error) {
      console.error('Long/Short Ratio fetch error:', error);
      return { success: false, value: null };
    }
  },

  // Загрузка всех метрик одновременно
  async fetchAll() {
    const [fgi, vix, btcDom, oi, fr, lsr] = await Promise.all([
      this.fetchFGI(),
      this.fetchVIX(),
      this.fetchBTCDominance(),
      this.fetchOpenInterest(),
      this.fetchFundingRate(),
      this.fetchLongShortRatio()
    ]);

    return {
      fgi: fgi.success ? fgi.value : '—',
      vix: vix.success ? vix.value : '—',
      btcDom: btcDom.success ? btcDom.value : '—',
      oi: oi.success ? oi.value : '—',
      fr: fr.success ? fr.value : '—',
      lsr: lsr.success ? lsr.value : '—'
    };
  }
};

