// =========================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ИЗБРАННЫМ
// Независимый модуль (не Vue компонент), экспортирует функции через window
// =========================
// Этот модуль содержит функции для работы с избранными монетами:
// - Проверка, добавление, удаление из избранного
// - Получение данных о монетах из избранного
// - Работа с неудачными тикерами (failed-*)
//
// ВАЖНО: Функции принимают данные компонента как параметры для независимости от Vue.

// =========================
// БАЗОВЫЕ ОПЕРАЦИИ С ИЗБРАННЫМ
// =========================

/**
 * isFavorite(coinId, favoriteCoins)
 * Проверка, является ли монета избранной
 * 
 * @param {string} coinId - ID монеты
 * @param {Array} favoriteCoins - Массив избранных монет
 * @returns {boolean} true, если монета в избранном
 */
function isFavorite(coinId, favoriteCoins) {
  if (!coinId || !Array.isArray(favoriteCoins)) return false;
  return favoriteCoins.some(favorite => favorite.id === coinId);
}

/**
 * toggleFavorite(coinId, favoriteCoins, coins, onUpdate)
 * Переключение избранного статуса монеты
 * 
 * @param {string} coinId - ID монеты
 * @param {Array} favoriteCoins - Массив избранных монет (будет изменен)
 * @param {Array} coins - Массив всех монет для получения данных
 * @param {Function} onUpdate - Функция для сохранения в localStorage: (favoriteCoins) => void
 * @returns {boolean} true, если монета добавлена в избранное, false - если удалена
 */
function toggleFavorite(coinId, favoriteCoins, coins, onUpdate) {
  if (!coinId || !Array.isArray(favoriteCoins)) return false;
  
  // Находим монету в текущих данных для получения symbol и name
  const coin = Array.isArray(coins) ? coins.find(c => c.id === coinId) : null;
  
  const favoriteIndex = favoriteCoins.findIndex(favorite => favorite.id === coinId);
  if (favoriteIndex > -1) {
    // Убираем из избранного
    favoriteCoins.splice(favoriteIndex, 1);
    if (onUpdate) onUpdate(favoriteCoins);
    return false;
  } else {
    // Добавляем в избранное
    if (coin) {
      // Если монета есть в таблице - берем данные оттуда
      favoriteCoins.push({
        id: coin.id,
        symbol: (coin.symbol || '').toUpperCase(),
        name: coin.name || coin.id
      });
    } else {
      // Если монеты нет в таблице - создаем минимальный объект
      favoriteCoins.push({
        id: coinId,
        symbol: coinId.toUpperCase(),
        name: coinId
      });
    }
    if (onUpdate) onUpdate(favoriteCoins);
    return true;
  }
}

/**
 * removeFavoriteFromFavorites(coinId, favoriteCoins, onUpdate)
 * Удаление монеты из избранного
 * 
 * @param {string} coinId - ID монеты
 * @param {Array} favoriteCoins - Массив избранных монет (будет изменен)
 * @param {Function} onUpdate - Функция для сохранения в localStorage: (favoriteCoins) => void
 * @returns {boolean} true, если монета была удалена
 */
function removeFavoriteFromFavorites(coinId, favoriteCoins, onUpdate) {
  if (!coinId || !Array.isArray(favoriteCoins)) return false;
  
  const favoriteIndex = favoriteCoins.findIndex(favorite => favorite.id === coinId);
  if (favoriteIndex > -1) {
    favoriteCoins.splice(favoriteIndex, 1);
    if (onUpdate) onUpdate(favoriteCoins);
    return true;
  }
  return false;
}

// =========================
// ПОЛУЧЕНИЕ ДАННЫХ О МОНЕТАХ ИЗ ИЗБРАННОГО
// =========================

/**
 * getFavoriteCoinName(favoriteCoin, coins)
 * Получение названия монеты из избранного
 * 
 * @param {Object|string} favoriteCoin - Объект избранного {id, symbol, name} или строка (старый формат)
 * @param {Array} coins - Массив всех монет для fallback
 * @returns {string} Название монеты
 */
function getFavoriteCoinName(favoriteCoin, coins) {
  // favoriteCoin может быть объектом {id, symbol, name} или строкой (старый формат)
  if (typeof favoriteCoin === 'object' && favoriteCoin.name) {
    return favoriteCoin.name;
  }
  // Fallback: ищем в текущих данных или возвращаем ID
  const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
  const coin = Array.isArray(coins) ? coins.find(c => c.id === coinId) : null;
  return coin ? coin.name : (coinId || favoriteCoin);
}

/**
 * getFavoriteCoinSymbol(favoriteCoin, coins)
 * Получение тикера монеты из избранного
 * 
 * @param {Object|string} favoriteCoin - Объект избранного {id, symbol, name} или строка (старый формат)
 * @param {Array} coins - Массив всех монет для fallback
 * @returns {string} Тикер монеты (верхний регистр)
 */
function getFavoriteCoinSymbol(favoriteCoin, coins) {
  // favoriteCoin может быть объектом {id, symbol, name} или строкой (старый формат)
  if (typeof favoriteCoin === 'object' && favoriteCoin.symbol) {
    return favoriteCoin.symbol;
  }
  // Fallback: ищем в текущих данных или возвращаем ID
  const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
  const coin = Array.isArray(coins) ? coins.find(c => c.id === coinId) : null;
  return coin ? coin.symbol.toUpperCase() : (coinId || favoriteCoin).toUpperCase();
}

/**
 * getFavoriteCoinId(favoriteCoin)
 * Получение ID монеты из избранного
 * 
 * @param {Object|string} favoriteCoin - Объект избранного {id, symbol, name} или строка (старый формат)
 * @returns {string} ID монеты
 */
function getFavoriteCoinId(favoriteCoin) {
  // favoriteCoin может быть объектом {id, symbol, name} или строкой (старый формат)
  return typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
}

/**
 * getFavoriteCoinIcon(favoriteCoin, coins, iconsCache, getCoinIconFn)
 * Получение иконки монеты из избранного
 * 
 * @param {Object|string} favoriteCoin - Объект избранного {id, symbol, name} или строка (старый формат)
 * @param {Array} coins - Массив всех монет
 * @param {Object} iconsCache - Кэш иконок {[coinId]: iconUrl}
 * @param {Function} getCoinIconFn - Функция получения иконки: (coin) => string|null
 * @returns {string|null} URL иконки или null
 */
function getFavoriteCoinIcon(favoriteCoin, coins, iconsCache, getCoinIconFn) {
  const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
  
  // Если это автоматически добавленная монета с неудачным тикером (неудачная попытка добавления)
  // определяем по префиксу "failed-" в ID
  if (coinId && typeof coinId === 'string' && coinId.startsWith('failed-')) {
    return null; // Возвращаем null, чтобы показать иконку рефреша в шаблоне
  }
  
  const coin = Array.isArray(coins) ? coins.find(c => c.id === coinId) : null;
  if (coin && getCoinIconFn) {
    return getCoinIconFn(coin);
  }
  // Пытаемся получить из кэша
  return (iconsCache && iconsCache[coinId]) || null;
}

/**
 * isFailedFavoriteCoin(favoriteCoin)
 * Проверка, является ли монета из избранного автоматически добавленной с неудачным тикером
 * 
 * @param {Object|string} favoriteCoin - Объект избранного {id, symbol, name} или строка (старый формат)
 * @returns {boolean} true, если монета имеет префикс "failed-"
 */
function isFailedFavoriteCoin(favoriteCoin) {
  const coinId = typeof favoriteCoin === 'object' ? favoriteCoin.id : favoriteCoin;
  return coinId && typeof coinId === 'string' && coinId.startsWith('failed-');
}

// =========================
// РАБОТА С НЕУДАЧНЫМИ ТИКЕРАМИ
// =========================

/**
 * archiveFailedTicker(ticker, favoriteCoins, timeoutManager, onUpdate)
 * Добавление неудачного тикера в избранное (после 5 попыток)
 * 
 * @param {string} ticker - Тикер монеты
 * @param {Array} favoriteCoins - Массив избранных монет (будет изменен)
 * @param {Object} timeoutManager - Объект для управления адаптивным таймаутом
 * @param {Function} onUpdate - Функция для сохранения в localStorage: (favoriteCoins) => void
 * @returns {Promise<void>}
 */
async function archiveFailedTicker(ticker, favoriteCoins, timeoutManager, onUpdate) {
  if (!ticker || !Array.isArray(favoriteCoins)) return;
  
  try {
    // Пытаемся найти монету через поиск CoinGecko (даже если точного совпадения нет)
    // Используем API из core/api/coingecko.js
    if (!window.coinGeckoAPI || !window.coinGeckoAPI.searchCoins) {
      // Если API недоступен - сохраняем в избранное с тикером как ID
      const failedId = `failed-${ticker.toLowerCase()}`;
      const existsInFavorites = favoriteCoins.some(favorite => favorite.id === failedId);
      if (!existsInFavorites) {
        favoriteCoins.push({
          id: failedId,
          symbol: ticker.toUpperCase(),
          name: ticker
        });
        if (onUpdate) onUpdate(favoriteCoins);
      }
      return;
    }
    
    const coins = await window.coinGeckoAPI.searchCoins(ticker, timeoutManager);
    
    if (coins.length > 0) {
      // Используем первый результат поиска (самый популярный)
      const coin = coins[0];
      
      // Проверяем, нет ли уже этой монеты в избранном
      const existsInFavorites = favoriteCoins.some(favorite => favorite.id === coin.id);
      if (!existsInFavorites) {
        // Сохраняем объект с id, symbol (тикер) и name (полное название)
        favoriteCoins.push({
          id: coin.id,
          symbol: (coin.symbol || ticker).toUpperCase(),
          name: coin.name || ticker
        });
        if (onUpdate) onUpdate(favoriteCoins);
      }
    } else {
      // Если ничего не найдено - все равно сохраняем в избранное с тикером как ID
      const failedId = `failed-${ticker.toLowerCase()}`;
      const existsInFavorites = favoriteCoins.some(favorite => favorite.id === failedId);
      if (!existsInFavorites) {
        favoriteCoins.push({
          id: failedId,
          symbol: ticker.toUpperCase(),
          name: ticker
        });
        if (onUpdate) onUpdate(favoriteCoins);
      }
    }
  } catch (error) {
    console.error(`Error archiving failed ticker ${ticker}:`, error);
    // Даже при ошибке пытаемся сохранить тикер в избранное
    const failedId = `failed-${ticker.toLowerCase()}`;
    const existsInFavorites = favoriteCoins.some(favorite => favorite.id === failedId);
    if (!existsInFavorites) {
      favoriteCoins.push({
        id: failedId,
        symbol: ticker.toUpperCase(),
        name: ticker
      });
      if (onUpdate) onUpdate(favoriteCoins);
    }
  }
}

// Экспорт функций через window для использования в других модулях
try {
  window.coinsFavoritesHelpers = {
    isFavorite,
    toggleFavorite,
    removeFavoriteFromFavorites,
    getFavoriteCoinName,
    getFavoriteCoinSymbol,
    getFavoriteCoinId,
    getFavoriteCoinIcon,
    isFailedFavoriteCoin,
    archiveFailedTicker
  };
} catch (error) {
  console.error('❌ coinsFavoritesHelpers module failed to load:', error);
}

