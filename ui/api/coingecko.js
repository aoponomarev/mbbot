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
    let archivedCoins = [];
    if (savedArchivedCoins) {
      const parsed = JSON.parse(savedArchivedCoins);
      // Обратная совместимость: если массив строк (старый формат) - преобразуем в объекты
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'string') {
          // Старый формат: массив ID
          archivedCoins = parsed.map(id => ({ id, symbol: id.toUpperCase(), name: id }));
        } else {
          // Новый формат: массив объектов
          archivedCoins = parsed;
        }
      }
    }
    
    return {
      cgCoins: savedCoins ? JSON.parse(savedCoins) : [],
      cgIsLoading: false,
      cgError: null,
      cgLastUpdated: savedLastUpdated || null,
      cgSelectedCoins: savedSelectedCoins ? JSON.parse(savedSelectedCoins) : defaultCoins,
      cgArchivedCoins: archivedCoins, // Архив монет: массив объектов {id, symbol, name}
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
      selectedArchivedCoin: '', // Выбранная монета из архива для восстановления
      showArchiveDropdown: false, // Показать/скрыть выпадающий список архива
      // Отмеченные чекбоксами монеты
      selectedCoinIds: [], // Массив ID отмеченных монет
      // Выпадающее меню кнопки счетчика
      showCounterDropdown: false, // Показать/скрыть выпадающее меню счетчика
      // Режим добавления тикеров (парсинг списка)
      isAddingTickers: false, // Флаг процесса добавления
      pendingTickers: [], // Очередь тикеров для добавления (массив строк-тикеров)
      currentAddingTicker: null, // Текущий тикер, который добавляется
      failedTickers: [], // Тикеры, которые не удалось добавить (для повторной попытки)
      displayPendingTickers: '', // Строка для отображения оставшихся тикеров в поле поиска
      tickerAttempts: {}, // Счетчик попыток для каждого тикера (объект: ticker -> количество попыток)
      // Адаптивный таймаут для обработки rate limiting CoinGecko API
      adaptiveTimeout: 300, // Текущий таймаут в миллисекундах (базовое значение)
      adaptiveTimeoutBase: 300, // Базовое значение таймаута (300ms)
      adaptiveTimeoutMax: 10000, // Максимальный таймаут (10 секунд)
      lastSuccessfulRequest: null // Время последнего успешного запроса (для постепенного уменьшения таймаута)
    };
  },
  
  computed: {
    // Сортированный список монет
    sortedCoins() {
      return this.sortData(this.cgCoins, this.cgCoins);
    },
    
    // Количество отмеченных монет
    selectedCoinsCount() {
      return this.selectedCoinIds.length;
    },
    
    // Общее количество монет
    totalCoinsCount() {
      return this.sortedCoins.length;
    },
    
    // Отображение значения в поле поиска (реактивное)
    searchQueryDisplay() {
      return this.isAddingTickers ? this.displayPendingTickers : this.cgSearchQuery;
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
          // Обработка rate limiting (429)
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
            throw new Error(`HTTP ${res.status}`);
          }
          throw new Error(`HTTP ${res.status}`);
        }
        
        // Успешный запрос - уменьшаем таймаут
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        this.cgCoins = Array.isArray(data) ? data : [];
        this.cgLastUpdated = new Date().toISOString(); // Сохраняем ISO строку для парсинга
        
        // Очищаем выбранные монеты, так как список мог измениться
        this.selectedCoinIds = [];
        
        // Кэшируем иконки монет для быстрой загрузки
        this.cacheCoinsIcons(this.cgCoins);
        
        // Сохраняем полный набор данных в localStorage
        localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
        localStorage.setItem('cgLastUpdated', this.cgLastUpdated);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      } catch (error) {
        console.error('CoinGecko fetch error', error);
        this.cgError = error.message || 'Не удалось загрузить данные';
        // Если это не 429, сбрасываем таймаут (возможно, другая ошибка)
        if (!error.message || !error.message.includes('429')) {
          this.decreaseAdaptiveTimeout();
        }
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
    
    // Парсинг строки на тикеры (разделители: любые символы кроме букв)
    parseTickersFromString(str) {
      if (!str || str.trim().length === 0) return [];
      
      // Разбиваем строку на тикеры: разделители - любые символы кроме букв (a-z, A-Z)
      // Это означает, что цифры считаются частью тикера, а все остальное - разделителями
      const tickers = str
        .split(/[^a-zA-Z]+/)
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0); // Убираем пустые строки
      
      // Убираем дубликаты
      return [...new Set(tickers)];
    },
    
    // Проверка, является ли строка режимом парсинга (линейный список тикеров)
    isParseMode(query) {
      if (!query || query.length < 2) return false;
      
      // Режим парсинга определяется наличием разделителей (любые символы кроме букв)
      // Если в строке есть хотя бы один разделитель - это режим парсинга
      return /[^a-zA-Z]/.test(query);
    },
    
    // Получение CoinGecko ID по тикеру (symbol)
    async getCoinIdBySymbol(ticker) {
      try {
        // Используем поиск CoinGecko для получения ID монеты по тикеру
        const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker)}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          // Обработка rate limiting (429)
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
            return null;
          }
          return null;
        }
        
        // Успешный запрос - уменьшаем таймаут
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        const coins = data.coins || [];
        
        // Ищем точное совпадение по тикеру (case-insensitive)
        const tickerUpper = ticker.toUpperCase();
        const exactMatch = coins.find(coin => coin.symbol && coin.symbol.toUpperCase() === tickerUpper);
        
        if (exactMatch) {
          return exactMatch.id;
        }
        
        // Если точного совпадения нет, возвращаем первый результат (самый популярный)
        return coins.length > 0 ? coins[0].id : null;
      } catch (error) {
        console.error(`Error getting coin ID for ticker ${ticker}:`, error);
        return null;
      }
    },
    
    // Обработка парсинга строки с тикерами (режим добавления монет линейным списком)
    async parseAndAddTickers(query) {
      // Парсим строку на тикеры
      const tickers = this.parseTickersFromString(query);
      
      if (tickers.length === 0) {
        this.cgSearchResults = [];
        return;
      }
      
      // Если уже идет процесс добавления - не начинаем новый
      if (this.isAddingTickers) {
        return;
      }
      
      // Фильтруем тикеры, уже присутствующие в таблице
      const existingTickers = this.cgCoins.map(coin => coin.symbol.toUpperCase());
      const newTickers = tickers.filter(ticker => !existingTickers.includes(ticker));
      
      if (newTickers.length === 0) {
        // Все тикеры уже в таблице
        this.cgSearchResults = [];
        this.cgSearchQuery = '';
        return;
      }
      
      // Начинаем процесс последовательного добавления
      this.isAddingTickers = true;
      this.pendingTickers = [...newTickers];
      this.currentAddingTicker = null;
      this.failedTickers = [];
      this.cgSearchResults = []; // Очищаем результаты поиска
      this.tickerAttempts = {}; // Инициализируем счетчик попыток
      this.resetAdaptiveTimeout(); // Сбрасываем таймаут при начале нового процесса
      this.updateDisplayPendingTickers(); // Инициализируем отображение
      
      // Запускаем последовательное добавление
      await this.processTickersQueue();
    },
    
    // Остановка процесса добавления тикеров
    stopAddingTickers() {
      if (!this.isAddingTickers) return;
      
      // Помечаем все оставшиеся тикеры как неудачные для возможного продолжения позже
      // Или просто останавливаем процесс
      this.isAddingTickers = false;
      this.currentAddingTicker = null;
      this.pendingTickers = [];
      this.failedTickers = [];
      this.tickerAttempts = {};
      this.displayPendingTickers = '';
      this.cgSearchQuery = '';
      this.cgSearchResults = [];
      // Не сбрасываем таймаут при остановке - он может быть увеличен из-за rate limiting
    },
    
    // Последовательное добавление тикеров из очереди
    async processTickersQueue() {
      // Продолжаем пока есть тикеры в очереди или в списке неудачных, и процесс не остановлен
      while (this.isAddingTickers && (this.pendingTickers.length > 0 || this.failedTickers.length > 0)) {
        // Сначала обрабатываем обычную очередь
        if (this.pendingTickers.length > 0) {
          const ticker = this.pendingTickers.shift();
          this.currentAddingTicker = ticker;
          
          // Обновляем отображение списка в поле поиска
          this.updateDisplayPendingTickers();
          
          try {
            // Проверяем, не появилась ли монета в таблице во время обработки
            const existingTickers = this.cgCoins.map(coin => coin.symbol.toUpperCase());
            if (existingTickers.includes(ticker)) {
              // Тикер уже добавлен - пропускаем
              this.currentAddingTicker = null;
              this.updateDisplayPendingTickers();
              continue;
            }
            
            // Увеличиваем счетчик попыток для этого тикера
            const attempts = (this.tickerAttempts[ticker] || 0) + 1;
            // Используем Vue.set для реактивности (или прямое присваивание, так как объект уже в data)
            this.tickerAttempts[ticker] = attempts;
            
            // Получаем CoinGecko ID для тикера
            const coinId = await this.getCoinIdBySymbol(ticker);
            
            if (!coinId) {
              // Тикер не найден
              if (attempts >= 5) {
                // Достигли лимита попыток - отправляем в архив
                await this.archiveFailedTicker(ticker);
                // Удаляем из счетчика попыток
                delete this.tickerAttempts[ticker];
                this.currentAddingTicker = null;
                this.updateDisplayPendingTickers();
                // Адаптивная задержка перед следующим тикером
                await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
                continue;
              } else {
                // Еще есть попытки - добавляем в список неудачных для повторной попытки
                this.failedTickers.push(ticker);
                this.currentAddingTicker = null;
                this.updateDisplayPendingTickers();
                // Адаптивная задержка перед следующим тикером
                await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
                continue;
              }
            }
            
            // Проверяем, не добавлена ли уже монета (на случай параллельных операций)
            const existingCoinIds = new Set(this.cgSelectedCoins);
            if (existingCoinIds.has(coinId)) {
              // Монета уже в списке - пропускаем
              this.currentAddingTicker = null;
              this.updateDisplayPendingTickers();
              continue;
            }
            
            // Синхронизация: удаляем из архива, если монета там есть
            this.syncCoinWithArchive(coinId, 'add');
            
            // Добавляем монету в список выбранных
            this.cgSelectedCoins.push(coinId);
            localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
            
            // Удаляем счетчик попыток для успешно добавленного тикера
            delete this.tickerAttempts[ticker];
            
            // Загружаем данные для добавленной монеты (обновляем таблицу)
            try {
              await this.fetchCoinGecko();
            } catch (fetchError) {
              console.error(`Error fetching data for ${ticker}:`, fetchError);
              // Продолжаем со следующим тикером даже если загрузка не удалась
            }
            
            // Адаптивная задержка для обработки rate limiting
            await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
            
          } catch (error) {
            console.error(`Error processing ticker ${ticker}:`, error);
            
            // Проверяем количество попыток
            const attempts = this.tickerAttempts[ticker] || 0;
            if (attempts >= 5) {
              // Достигли лимита попыток - отправляем в архив
              await this.archiveFailedTicker(ticker);
              // Удаляем из счетчика попыток
              delete this.tickerAttempts[ticker];
            } else {
              // Еще есть попытки - добавляем в список неудачных
              this.failedTickers.push(ticker);
            }
          } finally {
            this.currentAddingTicker = null;
            this.updateDisplayPendingTickers();
          }
        } else if (this.failedTickers.length > 0) {
          // Если обычная очередь закончилась, пробуем неудачные еще раз
          this.pendingTickers = [...this.failedTickers];
          this.failedTickers = [];
          // Адаптивная задержка перед повторной попыткой
          await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
        }
      }
      
      // Все тикеры обработаны (если процесс не был остановлен вручную)
      if (this.isAddingTickers) {
        this.isAddingTickers = false;
        this.currentAddingTicker = null;
        this.pendingTickers = [];
        this.failedTickers = [];
        this.tickerAttempts = {};
        this.displayPendingTickers = '';
        this.cgSearchQuery = '';
        this.cgSearchResults = [];
      }
    },
    
    // Архивирование неудачного тикера (после 5 попыток)
    async archiveFailedTicker(ticker) {
      try {
        // Пытаемся найти монету через поиск CoinGecko (даже если точного совпадения нет)
        const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker)}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          // Обработка rate limiting (429) - пропускаем архивирование через API
          if (res.status === 429) {
            this.increaseAdaptiveTimeout();
          }
          // При любой ошибке API - все равно сохраняем в архив с тикером как ID
          const archiveId = `failed-${ticker.toLowerCase()}`;
          const existsInArchive = this.cgArchivedCoins.some(archived => archived.id === archiveId);
          if (!existsInArchive) {
            this.cgArchivedCoins.push({
              id: archiveId,
              symbol: ticker.toUpperCase(),
              name: ticker
            });
            localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
          }
          return;
        }
        
        // Успешный запрос - уменьшаем таймаут
        this.decreaseAdaptiveTimeout();
        
        const data = await res.json();
        const coins = data.coins || [];
        
        if (coins.length > 0) {
          // Используем первый результат поиска (самый популярный)
          const coin = coins[0];
          
          // Проверяем, нет ли уже этой монеты в архиве
          const existsInArchive = this.cgArchivedCoins.some(archived => archived.id === coin.id);
          if (!existsInArchive) {
            // Сохраняем объект с id, symbol (тикер) и name (полное название)
            this.cgArchivedCoins.push({
              id: coin.id,
              symbol: (coin.symbol || ticker).toUpperCase(),
              name: coin.name || ticker
            });
            localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
          }
        } else {
          // Если ничего не найдено - все равно сохраняем в архив с тикером как ID
          const archiveId = `failed-${ticker.toLowerCase()}`;
          const existsInArchive = this.cgArchivedCoins.some(archived => archived.id === archiveId);
          if (!existsInArchive) {
            this.cgArchivedCoins.push({
              id: archiveId,
              symbol: ticker.toUpperCase(),
              name: ticker
            });
            localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
          }
        }
      } catch (error) {
        console.error(`Error archiving failed ticker ${ticker}:`, error);
        // Даже при ошибке пытаемся сохранить тикер в архив
        const archiveId = `failed-${ticker.toLowerCase()}`;
        const existsInArchive = this.cgArchivedCoins.some(archived => archived.id === archiveId);
        if (!existsInArchive) {
          this.cgArchivedCoins.push({
            id: archiveId,
            symbol: ticker.toUpperCase(),
            name: ticker
          });
          localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
        }
      }
    },
    
    // Обновление отображения списка тикеров в поле поиска
    updateDisplayPendingTickers() {
      const allTickers = [];
      if (this.currentAddingTicker) {
        allTickers.push(this.currentAddingTicker);
      }
      allTickers.push(...this.pendingTickers);
      allTickers.push(...this.failedTickers);
      
      this.displayPendingTickers = allTickers.join(', ');
    },
    
    // Поиск монет по названию или тикеру (поддерживает множественный поиск через разделители)
    async searchCoins(query) {
      if (!query || query.length < 2) {
        this.cgSearchResults = [];
        return;
      }
      
      // Проверяем, является ли запрос режимом парсинга
      if (this.isParseMode(query)) {
        // Если это режим парсинга - запускаем парсинг вместо поиска
        await this.parseAndAddTickers(query);
        return;
      }
      
      this.cgSearching = true;
      try {
        // Разбиваем запрос на отдельные поисковые термины (разделители: все кроме букв и цифр)
        const searchTerms = query.split(/[^a-zA-Z0-9]+/).filter(term => term.length >= 2);
        
        if (searchTerms.length === 0) {
          this.cgSearchResults = [];
          this.cgSearching = false;
          return;
        }
        
        // Если один термин - используем обычный поиск
        if (searchTerms.length === 1) {
          const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(searchTerms[0])}`;
          const res = await fetch(url);
          
          if (!res.ok) {
            // Обработка rate limiting (429)
            if (res.status === 429) {
              this.increaseAdaptiveTimeout();
              this.cgSearchResults = [];
              return;
            }
            throw new Error(`HTTP ${res.status}`);
          }
          
          // Успешный запрос - уменьшаем таймаут
          this.decreaseAdaptiveTimeout();
          
          const data = await res.json();
          let coins = data.coins || [];
          
          // Сортируем результаты: полные совпадения с тикером вверху
          const queryLower = searchTerms[0].toLowerCase();
          coins.sort((a, b) => {
            const aSymbol = a.symbol.toLowerCase();
            const bSymbol = b.symbol.toLowerCase();
            
            // Полное совпадение тикера - в начало
            const aExactMatch = aSymbol === queryLower ? 1 : 0;
            const bExactMatch = bSymbol === queryLower ? 1 : 0;
            if (aExactMatch !== bExactMatch) {
              return bExactMatch - aExactMatch;
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
          
          this.cgSearchResults = coins.slice(0, 10);
        } else {
          // Множественный поиск: ищем каждую монету отдельно и объединяем результаты
          const allResults = new Map(); // Используем Map для уникальности по ID
          
          for (const term of searchTerms) {
            const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(term)}`;
            const res = await fetch(url);
            
            if (!res.ok) {
              // Обработка rate limiting (429)
              if (res.status === 429) {
                this.increaseAdaptiveTimeout();
                // Добавляем задержку перед следующей попыткой
                await new Promise(resolve => setTimeout(resolve, this.adaptiveTimeout));
                continue; // Пропускаем этот термин и переходим к следующему
              }
              continue; // Пропускаем этот термин при других ошибках
            }
            
            // Успешный запрос - уменьшаем таймаут
            this.decreaseAdaptiveTimeout();
            
            const data = await res.json();
            const coins = data.coins || [];
            
            // Добавляем результаты в общую карту (приоритет первым найденным)
            coins.forEach(coin => {
              if (!allResults.has(coin.id)) {
                allResults.set(coin.id, coin);
              }
            });
            
            // Небольшая задержка между запросами при множественном поиске
            if (searchTerms.length > 1) {
              await new Promise(resolve => setTimeout(resolve, Math.min(this.adaptiveTimeout, 500)));
            }
          }
          
          // Преобразуем Map в массив и сортируем по популярности
          let coins = Array.from(allResults.values());
          coins.sort((a, b) => {
            return (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999);
          });
          
          this.cgSearchResults = coins.slice(0, 10);
        }
      } catch (error) {
        console.error('CoinGecko search error', error);
        this.cgSearchResults = [];
      } finally {
        this.cgSearching = false;
      }
    },
    
    // Синхронизация монеты между таблицей и архивом
    // Приоритет: таблица (активное состояние) важнее архива
    syncCoinWithArchive(coinId, action) {
      if (!coinId) return;
      
      if (action === 'add') {
        // При добавлении в таблицу - удаляем из архива (если есть)
        const archiveIndex = this.cgArchivedCoins.findIndex(archived => archived.id === coinId);
        if (archiveIndex > -1) {
          this.cgArchivedCoins.splice(archiveIndex, 1);
          localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
        }
      } else if (action === 'archive') {
        // При архивировании - удаляем из таблицы (если есть)
        const tableIndex = this.cgSelectedCoins.indexOf(coinId);
        if (tableIndex > -1) {
          this.cgSelectedCoins.splice(tableIndex, 1);
          localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
        }
      }
    },
    
    // Проверка и очистка дубликатов между таблицей и архивом при загрузке
    syncAllCoinsWithArchive() {
      // Удаляем из архива все монеты, которые присутствуют в таблице
      const tableCoinIds = new Set(this.cgSelectedCoins);
      const initialArchiveLength = this.cgArchivedCoins.length;
      
      this.cgArchivedCoins = this.cgArchivedCoins.filter(archived => !tableCoinIds.has(archived.id));
      
      // Если были удаления - сохраняем изменения
      if (this.cgArchivedCoins.length < initialArchiveLength) {
        localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      }
    },
    
    // Увеличение таймаута при получении 429 ошибки (rate limiting)
    increaseAdaptiveTimeout() {
      // Удваиваем таймаут, но не превышаем максимальное значение
      this.adaptiveTimeout = Math.min(this.adaptiveTimeout * 2, this.adaptiveTimeoutMax);
      console.log(`Rate limit detected. Increasing timeout to ${this.adaptiveTimeout}ms`);
    },
    
    // Уменьшение таймаута при успешных запросах (постепенное восстановление)
    decreaseAdaptiveTimeout() {
      const now = Date.now();
      
      // Если прошло более 5 секунд без ошибок - начинаем уменьшать таймаут
      if (this.lastSuccessfulRequest && (now - this.lastSuccessfulRequest) > 5000) {
        // Уменьшаем на 20%, но не ниже базового значения
        this.adaptiveTimeout = Math.max(this.adaptiveTimeout * 0.8, this.adaptiveTimeoutBase);
      }
      
      this.lastSuccessfulRequest = now;
    },
    
    // Сброс таймаута к базовому значению
    resetAdaptiveTimeout() {
      this.adaptiveTimeout = this.adaptiveTimeoutBase;
      this.lastSuccessfulRequest = Date.now();
    },
    
    // Добавление монеты в список
    addCoin(coinId) {
      if (!this.cgSelectedCoins.includes(coinId)) {
        // Синхронизация: удаляем из архива, если монета там есть
        this.syncCoinWithArchive(coinId, 'add');
        
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
        // Удаляем монету из выбранных чекбоксами, если она была отмечена
        const selectedIndex = this.selectedCoinIds.indexOf(coinId);
        if (selectedIndex > -1) {
          this.selectedCoinIds.splice(selectedIndex, 1);
        }
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
    },
    
    // Открытие/закрытие dropdown архива
    toggleArchiveDropdown() {
      this.showArchiveDropdown = !this.showArchiveDropdown;
    },
    
    // Контекстное меню: закрытие
    closeContextMenu() {
      this.showContextMenu = false;
      this.contextMenuCoin = null;
    },
    
    // Закрытие выпадающего списка архива
    closeArchiveDropdown() {
      this.showArchiveDropdown = false;
    },
    
    // Закрытие выпадающего списка поиска
    closeSearchDropdown() {
      this.cgSearchResults = [];
    },
    
    // Открытие/закрытие выпадающего меню счетчика
    toggleCounterDropdown() {
      this.showCounterDropdown = !this.showCounterDropdown;
    },
    
    // Закрытие выпадающего меню счетчика
    closeCounterDropdown() {
      this.showCounterDropdown = false;
    },
    
    // Обработчик глобального события закрытия всех выпадающих списков
    handleCloseAllDropdowns() {
      this.closeContextMenu();
      this.closeArchiveDropdown();
      this.closeSearchDropdown();
      this.closeCounterDropdown();
    },
    
    // Переключение выбора всех монет через чекбокс в заголовке
    toggleAllCoins(event) {
      if (event.target.checked) {
        // Выбираем все монеты
        this.selectedCoinIds = this.sortedCoins.map(coin => coin.id);
      } else {
        // Снимаем выбор со всех монет
        this.selectedCoinIds = [];
      }
    },
    
    // Переключение выбора отдельной монеты через чекбокс
    toggleCoinSelection(coinId, isChecked) {
      if (isChecked) {
        // Добавляем монету в выбранные, если её там еще нет
        if (!this.selectedCoinIds.includes(coinId)) {
          this.selectedCoinIds.push(coinId);
        }
      } else {
        // Удаляем монету из выбранных
        const index = this.selectedCoinIds.indexOf(coinId);
        if (index > -1) {
          this.selectedCoinIds.splice(index, 1);
        }
      }
    },
    
    // Выбрать все монеты
    selectAllCoins() {
      this.selectedCoinIds = this.sortedCoins.map(coin => coin.id);
      this.closeCounterDropdown();
    },
    
    // Отменить выбор всех монет
    deselectAllCoins() {
      this.selectedCoinIds = [];
      this.closeCounterDropdown();
    },
    
    // Удалить отмеченные монеты
    deleteSelectedCoins() {
      if (this.selectedCoinIds.length === 0) return;
      
      // Сохраняем копию списка, так как removeCoin будет изменять selectedCoinIds
      const coinsToDelete = [...this.selectedCoinIds];
      
      // Удаляем каждую отмеченную монету из списка выбранных для запроса
      coinsToDelete.forEach(coinId => {
        const index = this.cgSelectedCoins.indexOf(coinId);
        if (index > -1) {
          this.cgSelectedCoins.splice(index, 1);
        }
      });
      
      // Удаляем монеты из отображаемых данных
      this.cgCoins = this.cgCoins.filter(coin => !coinsToDelete.includes(coin.id));
      
      // Очищаем список отмеченных
      this.selectedCoinIds = [];
      
      // Сохраняем изменения
      localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
      
      this.closeCounterDropdown();
    },
    
    // Архивировать отмеченные монеты
    archiveSelectedCoins() {
      if (this.selectedCoinIds.length === 0) return;
      
      // Сохраняем копию списка
      const coinsToArchive = [...this.selectedCoinIds];
      
      // Архивируем каждую отмеченную монету
      coinsToArchive.forEach(coinId => {
        // Синхронизация: удаляем из таблицы, если монета там есть
        this.syncCoinWithArchive(coinId, 'archive');
        
        // Находим монету в текущих данных
        const coin = this.cgCoins.find(c => c.id === coinId);
        if (coin) {
          // Проверяем, нет ли уже этой монеты в архиве
          const existsInArchive = this.cgArchivedCoins.some(archived => archived.id === coinId);
          if (!existsInArchive) {
            // Сохраняем объект с id, symbol (тикер) и name (полное название)
            this.cgArchivedCoins.push({
              id: coin.id,
              symbol: (coin.symbol || '').toUpperCase(),
              name: coin.name || coin.id
            });
          }
        }
      });
      
      // Сохраняем архив и список выбранных (если были изменения)
      localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      
      // Удаляем монеты из списка выбранных для запроса (если еще не удалены синхронизацией)
      coinsToArchive.forEach(coinId => {
        const index = this.cgSelectedCoins.indexOf(coinId);
        if (index > -1) {
          this.cgSelectedCoins.splice(index, 1);
        }
      });
      
      // Удаляем монеты из отображаемых данных
      this.cgCoins = this.cgCoins.filter(coin => !coinsToArchive.includes(coin.id));
      
      // Очищаем список отмеченных
      this.selectedCoinIds = [];
      
      // Сохраняем изменения
      localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      localStorage.setItem('cgCoins', JSON.stringify(this.cgCoins));
      
      this.closeCounterDropdown();
    },
    
    // Перемещение монеты в списке
    moveToPosition(position) {
      const index = this.cgSelectedCoins.indexOf(this.contextMenuCoin);
      if (index === -1) return;
      
      const coin = this.cgSelectedCoins[index];
      
      switch (position) {
        case 'start':
          // Удаляем из текущей позиции и вставляем в начало
          this.cgSelectedCoins.splice(index, 1);
          this.cgSelectedCoins.unshift(coin);
          break;
        case 'up':
          if (index > 0) {
            // Меняем местами с предыдущим элементом
            this.cgSelectedCoins[index] = this.cgSelectedCoins[index - 1];
            this.cgSelectedCoins[index - 1] = coin;
          }
          break;
        case 'down':
          if (index < this.cgSelectedCoins.length - 1) {
            // Меняем местами со следующим элементом
            this.cgSelectedCoins[index] = this.cgSelectedCoins[index + 1];
            this.cgSelectedCoins[index + 1] = coin;
          }
          break;
        case 'end':
          // Удаляем из текущей позиции и вставляем в конец
          this.cgSelectedCoins.splice(index, 1);
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
      
      // Находим монету в текущих данных
      const coin = this.cgCoins.find(c => c.id === this.contextMenuCoin);
      if (!coin) return;
      
      // Синхронизация: удаляем из таблицы, если монета там есть
      this.syncCoinWithArchive(this.contextMenuCoin, 'archive');
      
      // Проверяем, нет ли уже этой монеты в архиве
      const existsInArchive = this.cgArchivedCoins.some(archived => archived.id === this.contextMenuCoin);
      if (!existsInArchive) {
        // Сохраняем объект с id, symbol (тикер) и name (полное название)
        // В CoinGecko API: coin.symbol - это тикер, coin.name - это полное название
        this.cgArchivedCoins.push({
          id: coin.id,
          symbol: (coin.symbol || '').toUpperCase(), // Тикер в верхнем регистре (BTC, ETH)
          name: coin.name || coin.id // Полное название монеты (Bitcoin, Ethereum)
        });
        localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      }
      
      // Удаляем из активного списка (если еще не удалена синхронизацией)
      this.removeCoin(this.contextMenuCoin);
    },
    
    // Восстановление монеты из архива (старый метод для совместимости)
    restoreFromArchive() {
      if (!this.selectedArchivedCoin) return;
      this.restoreFromArchiveById(this.selectedArchivedCoin);
      this.selectedArchivedCoin = '';
    },
    
    // Восстановление монеты из архива по ID
    async restoreFromArchiveById(coinId) {
      if (!coinId) return;
      
      // Находим монету в архиве, чтобы получить тикер для failed- монет
      const archivedCoin = this.cgArchivedCoins.find(archived => archived.id === coinId);
      if (!archivedCoin) return;
      
      let realCoinId = coinId;
      
      // Если это автоматически заархивированная монета (failed-{ticker})
      if (coinId && typeof coinId === 'string' && coinId.startsWith('failed-')) {
        // Извлекаем тикер из ID (убираем префикс "failed-")
        const ticker = archivedCoin.symbol || coinId.replace('failed-', '').toUpperCase();
        
        // Пытаемся найти реальный CoinGecko ID по тикеру
        try {
          realCoinId = await this.getCoinIdBySymbol(ticker);
          
          if (!realCoinId) {
            // Не удалось найти монету - возвращаем в архив
            console.warn(`Failed to restore coin ${ticker}: not found on CoinGecko`);
            // Монета уже в архиве, просто не удаляем её
            return;
          }
        } catch (error) {
          console.error(`Error finding coin ID for ticker ${ticker}:`, error);
          // При ошибке - возвращаем в архив
          return;
        }
      }
      
      // Сохраняем монету обратно в архив на случай ошибки
      const archivedCoinBackup = { ...archivedCoin };
      
      // Синхронизация: удаляем из архива и добавляем в таблицу (используем realCoinId)
      this.syncCoinWithArchive(realCoinId, 'add');
      
      // Удаляем из архива (ищем по id в объектах) - на случай если синхронизация не сработала
      const archiveIndex = this.cgArchivedCoins.findIndex(archived => archived.id === coinId);
      if (archiveIndex > -1) {
        this.cgArchivedCoins.splice(archiveIndex, 1);
        localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      }
      
      // Добавляем в активный список (используем realCoinId)
      if (!this.cgSelectedCoins.includes(realCoinId)) {
        this.cgSelectedCoins.push(realCoinId);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      }
      
      // Закрываем dropdown
      this.closeArchiveDropdown();
      
      // Пытаемся обновить данные - при ошибке возвращаем монету в архив
      let restoreFailed = false;
      
      try {
        // Сохраняем состояние ошибки перед вызовом
        const errorBefore = this.cgError;
        
        await this.fetchCoinGecko();
        
        // Проверяем, что монета действительно появилась в таблице после загрузки
        // Ждем небольшую задержку, чтобы дать Vue время обновить реактивные данные
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const coinInTable = this.cgCoins.find(c => c.id === realCoinId);
        
        // Если монета не найдена в таблице ИЛИ возникла ошибка при загрузке
        if (!coinInTable || this.cgError) {
          restoreFailed = true;
          throw new Error(`Coin ${realCoinId} not found in table after fetch${this.cgError ? `: ${this.cgError}` : ''}`);
        }
      } catch (error) {
        restoreFailed = true;
        console.error(`Error fetching coin data for ${realCoinId}:`, error);
      }
      
      // Если восстановление не удалось - возвращаем монету в архив
      if (restoreFailed) {
        // Удаляем из таблицы
        const tableIndex = this.cgSelectedCoins.indexOf(realCoinId);
        if (tableIndex > -1) {
          this.cgSelectedCoins.splice(tableIndex, 1);
          localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
        }
        
        // Возвращаем в архив с оригинальным ID
        const existsInArchive = this.cgArchivedCoins.some(archived => archived.id === archivedCoinBackup.id);
        if (!existsInArchive) {
          this.cgArchivedCoins.push(archivedCoinBackup);
          localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
        }
      }
    },
    
    // Получение названия монеты из архива
    getArchivedCoinName(archivedCoin) {
      // archivedCoin может быть объектом {id, symbol, name} или строкой (старый формат)
      if (typeof archivedCoin === 'object' && archivedCoin.name) {
        return archivedCoin.name;
      }
      // Fallback: ищем в текущих данных или возвращаем ID
      const coin = this.cgCoins.find(c => c.id === (archivedCoin.id || archivedCoin));
      return coin ? coin.name : (archivedCoin.id || archivedCoin);
    },
    
    // Получение тикера монеты из архива
    getArchivedCoinSymbol(archivedCoin) {
      // archivedCoin может быть объектом {id, symbol, name} или строкой (старый формат)
      if (typeof archivedCoin === 'object' && archivedCoin.symbol) {
        return archivedCoin.symbol;
      }
      // Fallback: ищем в текущих данных или возвращаем ID
      const coin = this.cgCoins.find(c => c.id === (archivedCoin.id || archivedCoin));
      return coin ? coin.symbol.toUpperCase() : (archivedCoin.id || archivedCoin).toUpperCase();
    },
    
    // Получение ID монеты из архива (для восстановления)
    getArchivedCoinId(archivedCoin) {
      // archivedCoin может быть объектом {id, symbol, name} или строкой (старый формат)
      return typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
    },
    
    // Получение иконки монеты из архива
    getArchivedCoinIcon(archivedCoin) {
      const coinId = typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
      
      // Если это автоматически заархивированная монета (неудачная попытка добавления)
      // определяем по префиксу "failed-" в ID
      if (coinId && typeof coinId === 'string' && coinId.startsWith('failed-')) {
        return null; // Возвращаем null, чтобы показать иконку рефреша в шаблоне
      }
      
      const coin = this.cgCoins.find(c => c.id === coinId);
      if (coin) {
        return this.getCoinIcon(coin);
      }
      // Пытаемся получить из кэша
      return this.cgIconsCache[coinId] || null;
    },
    
    // Проверка, является ли монета из архива автоматически заархивированной (неудачной попыткой)
    isFailedArchivedCoin(archivedCoin) {
      const coinId = typeof archivedCoin === 'object' ? archivedCoin.id : archivedCoin;
      return coinId && typeof coinId === 'string' && coinId.startsWith('failed-');
    },
    
    // Форматирование даты обновления (дата)
    formatLastUpdatedDate(dateValue) {
      if (!dateValue) return '';
      // Поддержка как ISO строки, так и старого формата toLocaleString
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    
    // Форматирование времени обновления (время)
    formatLastUpdatedTime(dateValue) {
      if (!dateValue) return '';
      // Поддержка как ISO строки, так и старого формата toLocaleString
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },
    
    // Склонение слова "монета" для числа
    pluralizeCoins(count) {
      return window.pluralize(count, ['монета', 'монеты', 'монет']);
    },
    
    // Кэширование иконок монет в localStorage
    cacheCoinsIcons(coins) {
      if (!Array.isArray(coins) || coins.length === 0) return;
      
      // Проверяем время последнего обновления кэша (не чаще 1 раза в час)
      const CACHE_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 час в миллисекундах
      const lastUpdateTime = localStorage.getItem('cgIconsCacheTimestamp');
      const now = Date.now();
      
      // Если прошло меньше часа с последнего обновления - не обновляем
      if (lastUpdateTime && (now - parseInt(lastUpdateTime)) < CACHE_UPDATE_INTERVAL) {
        return;
      }
      
      let updated = false;
      
      coins.forEach(coin => {
        if (coin.image && !this.cgIconsCache[coin.id]) {
          this.cgIconsCache[coin.id] = coin.image;
          updated = true;
        }
      });
      
      // Сохраняем обновленный кэш в localStorage только если были изменения
      if (updated) {
        localStorage.setItem('cgIconsCache', JSON.stringify(this.cgIconsCache));
        localStorage.setItem('cgIconsCacheTimestamp', now.toString());
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
    },
    
    // Обработчик ввода в поле поиска
    handleSearchInput(event) {
      // Если идет процесс добавления - игнорируем ввод
      if (this.isAddingTickers) {
        return;
      }
      // Иначе обновляем обычный запрос поиска
      this.cgSearchQuery = event.target.value;
    },
    
    // Получение отображения оставшихся тикеров для поля поиска
    getPendingTickersDisplay() {
      return this.displayPendingTickers;
    },
    
    // Получение массива оставшихся тикеров для отображения
    getRemainingTickersDisplay() {
      const allTickers = [];
      if (this.currentAddingTicker) {
        allTickers.push(this.currentAddingTicker);
      }
      allTickers.push(...this.pendingTickers);
      allTickers.push(...this.failedTickers);
      return allTickers;
    },
    
    // Получение количества оставшихся тикеров
    getRemainingTickersCount() {
      return this.pendingTickers.length + this.failedTickers.length + (this.currentAddingTicker ? 1 : 0);
    }
  },
  
  watch: {
    // Поиск с задержкой для уменьшения количества запросов
    cgSearchQuery(newQuery) {
      clearTimeout(this.searchTimeout);
      
      // Если идет процесс добавления тикеров - не обрабатываем изменения
      if (this.isAddingTickers) {
        return;
      }
      
      if (!newQuery || newQuery.length < 2) {
        this.cgSearchResults = [];
        return;
      }
      
      // Проверяем режим парсинга: если есть разделители (не буквы) - это режим парсинга
      // В режиме парсинга не делаем задержку, сразу парсим
      if (this.isParseMode(newQuery)) {
        // Режим парсинга: запускаем сразу без задержки
        this.parseAndAddTickers(newQuery);
      } else {
        // Обычный режим поиска: с задержкой
        this.searchTimeout = setTimeout(() => {
          this.searchCoins(newQuery);
        }, 500); // Задержка 500ms после ввода
      }
    }
  },

  mounted() {
    // Проверяем и очищаем дубликаты между таблицей и архивом при загрузке
    this.syncAllCoinsWithArchive();
    
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
    
    // Подписываемся на глобальное событие закрытия всех выпадающих списков
    this.handleCloseAllDropdownsBound = this.handleCloseAllDropdowns.bind(this);
    document.addEventListener('close-all-dropdowns', this.handleCloseAllDropdownsBound);
  },

  beforeUnmount() {
    if (this.handleUnlock) {
      window.removeEventListener('app-unlocked', this.handleUnlock);
    }
    
    // Отписываемся от глобального события
    if (this.handleCloseAllDropdownsBound) {
      document.removeEventListener('close-all-dropdowns', this.handleCloseAllDropdownsBound);
    }
  }
};
