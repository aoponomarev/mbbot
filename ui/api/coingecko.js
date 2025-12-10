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
      showCounterDropdown: false // Показать/скрыть выпадающее меню счетчика
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
    
    // Поиск монет по названию или тикеру (поддерживает множественный поиск через разделители)
    async searchCoins(query) {
      if (!query || query.length < 2) {
        this.cgSearchResults = [];
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
            throw new Error(`HTTP ${res.status}`);
          }
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
            if (res.ok) {
              const data = await res.json();
              const coins = data.coins || [];
              
              // Добавляем результаты в общую карту (приоритет первым найденным)
              coins.forEach(coin => {
                if (!allResults.has(coin.id)) {
                  allResults.set(coin.id, coin);
                }
              });
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
      
      // Удаляем монеты из списка выбранных для запроса
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
      
      // Удаляем из активного списка
      this.removeCoin(this.contextMenuCoin);
    },
    
    // Восстановление монеты из архива (старый метод для совместимости)
    restoreFromArchive() {
      if (!this.selectedArchivedCoin) return;
      this.restoreFromArchiveById(this.selectedArchivedCoin);
      this.selectedArchivedCoin = '';
    },
    
    // Восстановление монеты из архива по ID
    restoreFromArchiveById(coinId) {
      if (!coinId) return;
      
      // Удаляем из архива (ищем по id в объектах)
      const archiveIndex = this.cgArchivedCoins.findIndex(archived => archived.id === coinId);
      if (archiveIndex > -1) {
        this.cgArchivedCoins.splice(archiveIndex, 1);
        localStorage.setItem('cgArchivedCoins', JSON.stringify(this.cgArchivedCoins));
      }
      
      // Добавляем в активный список
      if (!this.cgSelectedCoins.includes(coinId)) {
        this.cgSelectedCoins.push(coinId);
        localStorage.setItem('cgSelectedCoins', JSON.stringify(this.cgSelectedCoins));
      }
      
      // Закрываем dropdown и обновляем данные
      this.closeArchiveDropdown();
      this.fetchCoinGecko();
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
      const coin = this.cgCoins.find(c => c.id === coinId);
      if (coin) {
        return this.getCoinIcon(coin);
      }
      // Пытаемся получить из кэша
      return this.cgIconsCache[coinId] || null;
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
