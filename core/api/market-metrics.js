// Утилита для получения метрик рынка
// Независимый модуль (не Vue компонент), экспортирует функции через window
// Глобальные переменные для хранения числовых значений метрик (совместимость с первоисточником)
let fgiVal = 0, vixVal = null, btcDomVal = 0, oiVal = 0, frVal = 0, lsrVal = 0;
let vixAvailable = false;

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

  // Обновление глобальных переменных в window (совместимость с первоисточником)
  updateWindowMetrics() {
    window.fgiVal = fgiVal;
    window.vixVal = vixVal;
    window.btcDomVal = btcDomVal;
    window.oiVal = oiVal;
    window.frVal = frVal;
    window.lsrVal = lsrVal;
    window.vixAvailable = vixAvailable;
  },

  // Получение FGI (Fear & Greed Index)
  async fetchFGI() {
    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      const data = await response.json();
      fgiVal = this.clamp(parseInt(data?.data?.[0]?.value), 0, 100);
      this.updateWindowMetrics();
      return { success: true, value: fgiVal.toString(), numericValue: fgiVal };
    } catch (error) {
      console.error('FGI fetch error:', error);
      fgiVal = 0;
      this.updateWindowMetrics();
      return { success: false, value: null, numericValue: 0 };
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
      },
      async () => {
        const resp = await fetch('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=^VIX&apikey=demo');
        const data = await resp.json();
        const series = data['Time Series (Daily)'];
        const lastKey = series ? Object.keys(series)[0] : null;
        return this.safeNumber(lastKey ? parseFloat(series[lastKey]['4. close']) : null, null);
      }
    ];

    for (const getter of sources) {
      try {
        const val = await getter.call(this);
        if (val !== null && Number.isFinite(val) && val > 0 && val < 1000) {
          vixVal = val;
          vixAvailable = true;
          this.updateWindowMetrics();
          return { success: true, value: val.toFixed(2), numericValue: val };
        }
      } catch (error) {
        // Пробуем следующий источник
      }
    }
    vixVal = null;
    vixAvailable = false;
    this.updateWindowMetrics();
    return { success: false, value: null, numericValue: null };
  },

  // Получение BTC Dominance
  async fetchBTCDominance() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      const data = await response.json();
      btcDomVal = this.clamp(parseFloat(data?.data?.market_cap_percentage?.btc), 0, 100);
      this.updateWindowMetrics();
      return { success: true, value: btcDomVal.toFixed(2) + '%', numericValue: btcDomVal };
    } catch (error) {
      console.error('BTC Dominance fetch error:', error);
      btcDomVal = 0;
      this.updateWindowMetrics();
      return { success: false, value: null, numericValue: 0 };
    }
  },

  // Получение Open Interest
  async fetchOpenInterest() {
    try {
      const response = await fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=1');
      const data = await response.json();
      oiVal = this.safeNumber(data?.[0]?.sumOpenInterestValue, 0);
      this.updateWindowMetrics();
      return { 
        success: true, 
        value: oiVal ? ('$' + oiVal.toFixed(2)) : '—',
        numericValue: oiVal
      };
    } catch (error) {
      console.error('Open Interest fetch error:', error);
      oiVal = 0;
      this.updateWindowMetrics();
      return { success: false, value: null, numericValue: 0 };
    }
  },

  // Получение Funding Rate
  async fetchFundingRate() {
    try {
      const response = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
      const data = await response.json();
      frVal = Array.isArray(data) && data.length > 0
        ? data.reduce((sum, item) => sum + this.safeNumber(item.lastFundingRate, 0), 0) / data.length * 100
        : 0;
      this.updateWindowMetrics();
      return { success: true, value: frVal.toFixed(4) + '%', numericValue: frVal };
    } catch (error) {
      console.error('Funding Rate fetch error:', error);
      frVal = 0;
      this.updateWindowMetrics();
      return { success: false, value: null, numericValue: 0 };
    }
  },

  // Получение Long/Short Ratio
  async fetchLongShortRatio() {
    try {
      const response = await fetch('https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=5m&limit=1');
      const data = await response.json();
      lsrVal = this.safeNumber(data?.[0]?.longShortRatio, 1);
      this.updateWindowMetrics();
      return { success: true, value: lsrVal.toFixed(2), numericValue: lsrVal };
    } catch (error) {
      console.error('Long/Short Ratio fetch error:', error);
      lsrVal = 0;
      this.updateWindowMetrics();
      return { success: false, value: null, numericValue: 0 };
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

    // Обновляем window после всех загрузок
    this.updateWindowMetrics();

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

// Инициализируем window при загрузке модуля
window.marketMetrics.updateWindowMetrics();

