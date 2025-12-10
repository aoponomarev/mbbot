// Компонент виджета CoinGecko
// Vue компонент с x-template шаблоном
window.cmpCoinGecko = {
  template: '#coingecko-template',
  mixins: [window.tableSortMixin], // Подключаем глобальный mixin для сортировки

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
    
    // Загружаем кэш иконок
    const iconsCache = JSON.parse(localStorage.getItem('cgIconsCache') || '{}');
    
    // Загружаем архив монет
    const savedArchivedCoins = localStorage.getItem('cgArchivedCoins');
    
    return {
      cgCoins: savedCoins ? JSON.parse(savedCoins) : [],
      cgIsLoading: false,
      cgError: null,
      cgLastUpdated: savedLastUpdated || null,
      cgSelectedCoins: savedSelectedCoins ? JSON.parse(savedSelectedCoins) : defaultCoins,
      cgArchivedCoins: savedArchivedCoins ? JSON.parse(savedArchivedCoins) : [], // Архив монет
      cgIconsCache: iconsCache, // Кэш иконок в data для реактивности
      // Поиск монет
      cgSearchQuery: '',
      cgSearchResults: [],
      cgSearching: false,
      // Контекстное меню
      contextMenuCoin: null, // ID монеты для контекстного меню
      contextMenuX: 0,
      contextMenuY: 0,
      showContextMenu: false,
      // Архив
      selectedArchivedCoin: '' // Выбранная монета из архива для восстановления
    };
  },
  
  computed: {
    // Сортированный список монет
    sortedCoins() {
      return this.sortData(this.cgCoins, this.cgCoins);
    }
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
        
        // Кэшируем иконки монет для быстрой загрузки
        this.cacheCoinsIcons(this.cgCoins);
        
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
        
        // Сортируем результаты: полные совпадения с тикером вверху
        let coins = data.coins || [];
        const queryLower = query.toLowerCase();
        coins.sort((a, b) => {
          const aSymbol = a.symbol.toLowerCase();
          const bSymbol = b.symbol.toLowerCase();
          
          // Полное совпадение тикера - в начало
          const aExactMatch = aSymbol === queryLower ? 1 : 0;
          const bExactMatch = bSymbol === queryLower ? 1 : 0;
          if (aExactMatch !== bExactMatch) {
            return bExactMatch - aExactMatch; // Точные совпадения первыми
          }
          
          // Тикер начинается с запроса - выше
          const aStartsWith = aSymbol.startsWith(queryLower) ? 1 : 0;
          const bStartsWith = bSymbol.startsWith(queryLower) ? 1 : 0;
          if (aStartsWith !== bStartsWith) {
            return bStartsWith - aStartsWith;
          }
          
          // Остальные по market_cap_rank (популярности)
          return (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999);
        });
        
        // Ограничиваем результаты первыми 10 для удобства
        this.cgSearchResults = coins.slice(0, 10);
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
        
        // Кэшируем иконку добавленной монеты из результатов поиска
        const coinFromSearch = this.cgSearchResults.find(c => c.id === coinId);
        if (coinFromSearch && coinFromSearch.thumb) {
          this.cacheCoinsIcons([{ id: coinId, image: coinFromSearch.thumb }]);
        }
        
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
      this.closeContextMenu();
    },
    
    // Контекстное меню: открытие
    openContextMenu(event, coinId) {
      event.stopPropagation(); // Предотвращаем всплытие события
      this.contextMenuCoin = coinId;
      this.contextMenuX = event.clientX;
      this.contextMenuY = event.clientY;
      this.showContextMenu = true;
      
      // Закрываем меню при клике вне его (с небольшой задержкой, чтобы не закрыть сразу)
      setTimeout(() => {
        document.addEventListener('click', this.closeContextMenuOnOutside.bind(this));
      }, 100);
    },
    
    // Контекстное меню: закрытие при клике вне
    closeContextMenuOnOutside(event) {
      if (!event.target.closest('.cg-context-menu') && !event.target.closest('.cg-coin-block')) {
        this.closeContextMenu();
      }
    },
    
    // Контекстное меню: закрытие
    closeContextMenu() {
      this.showContextMenu = false;
      this.contextMenuCoin = null;
      document.removeEventListener('click', this.closeContextMenuOnOutside);
    },
    
    // Перемещение монеты в списке
    moveToPosition(position) {
      const index = this.cgSelectedCoins.indexOf(this.contextMenuCoin);
      if (index === -1) return;
      
      const coin = this.cgSelectedCoins.splice(index, 1)[0];
      
      switch (position) {
        case 'start':
          this.cgSelectedCoins.unshift(coin);
          break;
        case 'up':
          if (index > 0) {
            this.cgSelectedCoins.splice(index - 1, 0, coin);
          } else {
            this.cgSelectedCoins.push(coin); // Если первый - перемещаем в конец
          }
          break;
        case 'down':
          if (index < this.cgSelectedCoins.length) {
            this.cgSelectedCoins.splice(index + 1, 0, coin);
          } else {
            this.cgSelectedCoins.unshift(coin); // Если последний - перемещаем в начало
          }
          break;
        case 'end':
          this.cgSelectedCoins.push(coin);
          break;
      }
      
      localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      this.fetchCoinGecko(); // Обновляем данные для новой сортировки
      this.closeContextMenu();
    },
    
    // Архивирование монеты
    archiveCoin() {
      if (!this.contextMenuCoin) return;
      
      // Переносим монету в архив
      if (!this.cgArchivedCoins.includes(this.contextMenuCoin)) {
        this.cgArchivedCoins.push(this.contextMenuCoin);
        localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      }
      
      // Удаляем из активного списка
      this.removeCoin(this.contextMenuCoin);
    },
    
    // Восстановление монеты из архива
    restoreFromArchive() {
      if (!this.selectedArchivedCoin) return;
      
      const coinId = this.selectedArchivedCoin;
      
      // Удаляем из архива
      const archiveIndex = this.cgArchivedCoins.indexOf(coinId);
      if (archiveIndex > -1) {
        this.cgArchivedCoins.splice(archiveIndex, 1);
        localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      }
      
      // Добавляем в активный список
      if (!this.cgSelectedCoins.includes(coinId)) {
        this.cgSelectedCoins.push(coinId);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      }
      
      // Сбрасываем выбор и обновляем данные
      this.selectedArchivedCoin = '';
      this.fetchCoinGecko();
    },
    
    // Получение названия монеты из архива (из кэша данных или по ID)
    getArchivedCoinName(coinId) {
      // Пытаемся найти в текущих данных
      const coin = this.cgCoins.find(c => c.id === coinId);
      if (coin) return coin.name;
      
      // Если нет в данных - возвращаем ID как fallback
      return coinId;
    },
    
    // Кэширование иконок монет в localStorage
    cacheCoinsIcons(coins) {
      if (!Array.isArray(coins) || coins.length === 0) return;
      
      let updated = false;
      
      coins.forEach(coin => {
        if (coin.image && !this.cgIconsCache[coin.id]) {
          this.cgIconsCache[coin.id] = coin.image;
          updated = true;
        }
      });
      
      // Сохраняем обновленный кэш в localStorage
      if (updated) {
        localStorage.setItem('cgIconsCache', JSON.stringify(this.cgIconsCache));
      }
    },
    
    // Получение иконки монеты из кэша (с fallback на coin.image)
    getCoinIcon(coin) {
      // Сначала проверяем кэш
      if (this.cgIconsCache[coin.id]) {
        return this.cgIconsCache[coin.id];
      }
      // Если в кэше нет - используем текущую иконку и кэшируем её
      if (coin.image) {
        this.cgIconsCache[coin.id] = coin.image;
        localStorage.setItem('cgIconsCache', JSON.stringify(this.cgIconsCache));
        return coin.image;
      }
      return null;
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
