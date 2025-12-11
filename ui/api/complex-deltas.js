// =========================
// КОМПОНЕНТ ТАБЛИЦЫ "КОМПЛ. ДЕЛЬТЫ"
// Источник: old_app_not_write/ui.js (строки 493-545)
// =========================
// Компонент отображает таблицу с комплексными дельтами (CD) для всех монет.
// Колонки: №, Тикер, CDH, CD6, CD5, CD4, CD3, CD2, CD1
// CDH (CD на горизонте) выделяется цветом и вставляется динамически в зависимости от горизонта прогноза.
// 
// ВАЖНО: Пока используется заглушка для CD значений, так как функции расчета CD еще не мигрированы.
// После миграции Этапа 3 (CD) значения будут рассчитываться реально.

window.cmpComplexDeltas = {
  template: '#complex-deltas-template',
  mixins: [window.tableSortMixin], // Подключаем глобальный mixin для сортировки

  data() {
    return {
      // Горизонт прогноза в днях (по умолчанию 2 дня, как в старом приложении)
      horizonDays: 2,
      // Заглушка для CD значений (пока не мигрированы функции расчета)
      useStub: true
    };
  },

  computed: {
    // Получаем монеты из компонента CoinGecko
    coins() {
      // Пытаемся получить монеты из корневого компонента через $root
      const root = this.$root || window.appRoot;
      if (root && root.$children) {
        const coinGeckoComponent = root.$children.find(c => c.$options.name === 'cmpCoinGecko' || c.$options.__name === 'cmpCoinGecko');
        if (coinGeckoComponent && coinGeckoComponent.cgCoins) {
          return coinGeckoComponent.cgCoins;
        }
      }
      
      // Fallback: загружаем из localStorage
      const savedCoins = localStorage.getItem('cgCoins');
      if (savedCoins) {
        try {
          return JSON.parse(savedCoins);
        } catch (e) {
          console.error('Ошибка загрузки монет из localStorage:', e);
        }
      }
      
      return [];
    },

    // Отсортированные монеты (с учетом сортировки через mixin)
    sortedCoins() {
      let coins = [...this.coins];
      
      // Если есть активная сортировка через mixin - используем её
      if (this.sortColumn && this.sortOrder) {
        coins = coins.sort((a, b) => {
          const valueA = this.getCDValue(a, this.sortColumn);
          const valueB = this.getCDValue(b, this.sortColumn);
          const numA = parseFloat(valueA) || 0;
          const numB = parseFloat(valueB) || 0;
          const cmp = numA - numB;
          return this.sortOrder === 'asc' ? cmp : -cmp;
        });
      } else {
        // По умолчанию сортируем по CDH по убыванию, как в старом приложении
        coins = coins.sort((a, b) => {
          const cdhA = this.getCDH(a);
          const cdhB = this.getCDH(b);
          return cdhB - cdhA;
        });
      }
      
      return coins;
    },

    // Временные узлы для определения позиции CDH
    timeFramesDays() {
      return window.timeFramesDays || [1/24, 1, 7, 14, 30, 200];
    },

    // Позиция CDH в массиве заголовков (динамически вставляется в зависимости от горизонта)
    cdhPosition() {
      const timeFrames = this.timeFramesDays;
      let insertPos = timeFrames.length;
      for (let i = 0; i < timeFrames.length; i++) {
        if (timeFrames[i] > this.horizonDays) {
          insertPos = i;
          break;
        }
      }
      return insertPos;
    },

    // Заголовки колонок CD (CDH вставляется динамически)
    cdHeaders() {
      const headers = ['CD1', 'CD2', 'CD3', 'CD4', 'CD5', 'CD6'];
      // Вставляем CDH в правильную позицию
      headers.splice(this.cdhPosition, 0, 'CDH');
      // Переворачиваем порядок: CDH, CD6..CD1 (слева производные, справа первичные)
      headers.reverse();
      return headers;
    }
  },

  methods: {
    // Получить CDH (CD на горизонте) для монеты
    // ВАЖНО: Пока используется заглушка, после миграции Этапа 3 будет реальный расчет
    getCDH(coin) {
      if (this.useStub) {
        // Заглушка: используем сумму pvs как приблизительное значение CDH
        if (coin.pvs && Array.isArray(coin.pvs)) {
          return coin.pvs.reduce((sum, pv) => sum + (parseFloat(pv) || 0), 0);
        }
        return 0;
      }
      // После миграции: return parseFloat(coin.cdhw) || 0;
      return parseFloat(coin.cdhw) || 0;
    },

    // Получить CD значение по индексу (1-6)
    // ВАЖНО: Пока используется заглушка, после миграции Этапа 3 будет реальный расчет
    getCD(coin, index) {
      if (this.useStub) {
        // Заглушка: используем частичную сумму pvs
        if (coin.pvs && Array.isArray(coin.pvs)) {
          const sum = coin.pvs.slice(0, index).reduce((sum, pv) => sum + (parseFloat(pv) || 0), 0);
          return sum.toFixed(2);
        }
        return '—';
      }
      // После миграции: return coin[`cd${index}`] || coin[`cd${index}w`] || '—';
      const cdValue = coin[`cd${index}`] || coin[`cd${index}w`];
      return cdValue !== undefined ? cdValue : '—';
    },

    // Получить значение CD для отображения в таблице
    getCDValue(coin, header) {
      if (header === 'CDH') {
        const cdh = this.getCDH(coin);
        return cdh.toFixed(2);
      }
      // Извлекаем индекс из заголовка (CD1 -> 1, CD2 -> 2, и т.д.)
      const index = parseInt(header.replace('CD', ''));
      return this.getCD(coin, index);
    },

    // Форматирование значения для отображения
    formatValue(value) {
      if (value === '—' || value === null || value === undefined) {
        return '—';
      }
      const num = parseFloat(value);
      if (Number.isFinite(num)) {
        return num.toFixed(2);
      }
      return String(value);
    },

    // Получить ссылку на Bybit для монеты
    getBybitLink(ticker) {
      return `https://www.bybit.com/trade/usdt/${ticker}USDT`;
    }
  }
};

