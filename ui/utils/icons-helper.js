// Утилита для работы с иконками на основе централизованного JSON файла
// Соответствия иконок и команд встроены прямо в код для избежания CORS проблем при работе с file:// протоколом

// Встроенное содержимое icons-mapping.json
// Структура: icons (одна иконка → много команд)
const iconsMapping = {
  "icons": {
    "fas fa-star": {
      "commands": {
        "favorite": {
          "category": "actions",
          "title": "Избранное",
          "description": "Выбрать избранное"
        },
        "add-to-favorites": {
          "category": "actions",
          "title": "В избранное",
          "description": "Добавить в избранное"
        },
        "remove-from-favorites": {
          "category": "actions",
          "title": "Убрать из избранного",
          "description": "Убрать из избранного"
        },
        "favorite-status": {
          "category": "indicators",
          "type": "status",
          "value": "favorite",
          "label": "В избранном",
          "title": "В избранном",
          "description": "Элемент находится в избранном. Нажмите, чтобы убрать из избранного"
        },
        "not-favorite-status": {
          "category": "indicators",
          "type": "status",
          "value": "not-favorite",
          "label": "Не в избранном",
          "title": "Не в избранном",
          "description": "Элемент не в избранном. Нажмите, чтобы добавить в избранное"
        }
      },
      "defaultCommand": "favorite",
      "baseIcon": "fas fa-star"
    },
    "fas fa-check": {
      "commands": {
        "check": {
          "category": "status",
          "title": "Отмечено",
          "description": "Иконка отметки"
        },
        "selected": {
          "category": "indicators",
          "type": "status",
          "value": "selected",
          "label": "Выбрано",
          "title": "Элемент выбран",
          "description": "Элемент находится в выбранном состоянии"
        }
      },
      "defaultCommand": "check",
      "baseIcon": "fas fa-check"
    },
    "fas fa-external-link-alt": {
      "commands": {
        "open-external": {
          "category": "actions",
          "title": "Открыть",
          "description": "Открыть на внешнем ресурсе (Bybit)"
        },
        "external": {
          "category": "indicators",
          "type": "navigation",
          "value": "external",
          "label": "Внешняя ссылка",
          "title": "Открыть во внешнем ресурсе",
          "description": "Нажмите, чтобы открыть на внешнем сайте"
        }
      },
      "defaultCommand": "open-external",
      "baseIcon": "fas fa-external-link-alt"
    },
    "fas fa-sync-alt": {
      "commands": {
        "refresh": {
          "category": "actions",
          "title": "Обновить",
          "description": "Обновление данных или страницы"
        }
      },
      "defaultCommand": "refresh",
      "baseIcon": "fas fa-sync-alt"
    },
    "fas fa-moon": {
      "commands": {
        "theme-light": {
          "category": "actions",
          "title": "Переключить на темную тему",
          "description": "Переключить тему на темную"
        }
      },
      "defaultCommand": "theme-light",
      "baseIcon": "fas fa-moon"
    },
    "fas fa-sun": {
      "commands": {
        "theme-dark": {
          "category": "actions",
          "title": "Переключить на светлую тему",
          "description": "Переключить тему на светлую"
        }
      },
      "defaultCommand": "theme-dark",
      "baseIcon": "fas fa-sun"
    },
    "fas fa-cog": {
      "commands": {
        "settings": {
          "category": "actions",
          "title": "Настройки",
          "description": "Открыть настройки проекта"
        }
      },
      "defaultCommand": "settings",
      "baseIcon": "fas fa-cog"
    },
    "fas fa-download": {
      "commands": {
        "export": {
          "category": "actions",
          "title": "Экспорт",
          "description": "Экспорт настроек в JSON"
        }
      },
      "defaultCommand": "export",
      "baseIcon": "fas fa-download"
    },
    "fas fa-upload": {
      "commands": {
        "import": {
          "category": "actions",
          "title": "Импорт",
          "description": "Импорт настроек из JSON"
        }
      },
      "defaultCommand": "import",
      "baseIcon": "fas fa-upload"
    },
    "fas fa-check-square": {
      "commands": {
        "select-all": {
          "category": "actions",
          "title": "Выбрать все",
          "description": "Выбрать все элементы"
        }
      },
      "defaultCommand": "select-all",
      "baseIcon": "fas fa-check-square"
    },
    "fas fa-square": {
      "commands": {
        "deselect-all": {
          "category": "actions",
          "title": "Отменить все",
          "description": "Отменить выбор всех элементов"
        }
      },
      "defaultCommand": "deselect-all",
      "baseIcon": "fas fa-square"
    },
    "fas fa-trash": {
      "commands": {
        "delete": {
          "category": "actions",
          "title": "Удалить",
          "description": "Удалить элемент или элементы"
        }
      },
      "defaultCommand": "delete",
      "baseIcon": "fas fa-trash"
    },
    "fas fa-archive": {
      "commands": {
        "archive": {
          "category": "actions",
          "title": "Архив",
          "description": "Архивировать элемент или элементы (будущая функциональность)"
        }
      },
      "defaultCommand": "archive",
      "baseIcon": "fas fa-archive"
    },
    "fas fa-save": {
      "commands": {
        "save": {
          "category": "actions",
          "title": "Сохранить",
          "description": "Сохранить изменения"
        }
      },
      "defaultCommand": "save",
      "baseIcon": "fas fa-save"
    },
    "fas fa-eye": {
      "commands": {
        "eye": {
          "category": "actions",
          "title": "Показать",
          "description": "Показать скрытое содержимое"
        }
      },
      "defaultCommand": "eye",
      "baseIcon": "fas fa-eye"
    },
    "fas fa-eye-slash": {
      "commands": {
        "eye-slash": {
          "category": "actions",
          "title": "Скрыть",
          "description": "Скрыть содержимое"
        }
      },
      "defaultCommand": "eye-slash",
      "baseIcon": "fas fa-eye-slash"
    },
    "fas fa-stop": {
      "commands": {
        "stop": {
          "category": "actions",
          "title": "Остановить",
          "description": "Остановить выполнение операции"
        }
      },
      "defaultCommand": "stop",
      "baseIcon": "fas fa-stop"
    },
    "fas fa-sort": {
      "commands": {
        "sort": {
          "category": "navigation",
          "title": "Сортировка",
          "description": "Нейтральная иконка сортировки"
        }
      },
      "defaultCommand": "sort",
      "baseIcon": "fas fa-sort"
    },
    "fas fa-sort-up": {
      "commands": {
        "sort-up": {
          "category": "navigation",
          "title": "Сортировка по возрастанию",
          "description": "Сортировка по возрастанию"
        }
      },
      "defaultCommand": "sort-up",
      "baseIcon": "fas fa-sort-up"
    },
    "fas fa-sort-down": {
      "commands": {
        "sort-down": {
          "category": "navigation",
          "title": "Сортировка по убыванию",
          "description": "Сортировка по убыванию"
        }
      },
      "defaultCommand": "sort-down",
      "baseIcon": "fas fa-sort-down"
    },
    "fas fa-exclamation-triangle": {
      "commands": {
        "warning": {
          "category": "status",
          "title": "Предупреждение",
          "description": "Иконка предупреждения"
        },
        "warning-indicator": {
          "category": "indicators",
          "type": "status",
          "value": "warning",
          "label": "Предупреждение",
          "title": "Предупреждение",
          "description": "Требуется внимание"
        }
      },
      "defaultCommand": "warning",
      "baseIcon": "fas fa-exclamation-triangle"
    },
    "fas fa-exclamation-circle": {
      "commands": {
        "error": {
          "category": "status",
          "title": "Ошибка",
          "description": "Иконка ошибки"
        },
        "error-indicator": {
          "category": "indicators",
          "type": "status",
          "value": "error",
          "label": "Ошибка",
          "title": "Ошибка",
          "description": "Произошла ошибка"
        }
      },
      "defaultCommand": "error",
      "baseIcon": "fas fa-exclamation-circle"
    },
    "fas fa-check-circle": {
      "commands": {
        "success": {
          "category": "status",
          "title": "Успех",
          "description": "Иконка успешного выполнения"
        }
      },
      "defaultCommand": "success",
      "baseIcon": "fas fa-check-circle"
    },
    "fas fa-spinner": {
      "commands": {
        "spinner": {
          "category": "status",
          "title": "Загрузка",
          "description": "Иконка загрузки с анимацией"
        },
        "loading-indicator": {
          "category": "indicators",
          "type": "status",
          "value": "loading",
          "label": "Загрузка",
          "title": "Идет загрузка",
          "description": "Выполняется операция загрузки данных"
        }
      },
      "defaultCommand": "spinner",
      "baseIcon": "fas fa-spinner"
    },
    "fas fa-ban": {
      "commands": {
        "disabled-indicator": {
          "category": "indicators",
          "type": "status",
          "value": "disabled",
          "label": "Отключено",
          "title": "Элемент отключен",
          "description": "Элемент недоступен для взаимодействия"
        }
      },
      "defaultCommand": "disabled-indicator",
      "baseIcon": "fas fa-ban"
    },
    "fas fa-chevron-right": {
      "commands": {
        "submenu": {
          "category": "indicators",
          "type": "navigation",
          "value": "submenu",
          "label": "Подменю",
          "title": "Вложенное меню",
          "description": "Нажмите, чтобы открыть вложенное меню"
        }
      },
      "defaultCommand": "submenu",
      "baseIcon": "fas fa-chevron-right"
    },
    "fas fa-window-maximize": {
      "commands": {
        "modal": {
          "category": "indicators",
          "type": "navigation",
          "value": "modal",
          "label": "Модальное окно",
          "title": "Открыть в модальном окне",
          "description": "Нажмите, чтобы открыть модальное окно"
        }
      },
      "defaultCommand": "modal",
      "baseIcon": "fas fa-window-maximize"
    },
    "fab fa-bitcoin": {
      "commands": {
        "bitcoin": {
          "category": "metrics",
          "title": "Bitcoin Dominance",
          "description": "Иконка доминирования Bitcoin"
        }
      },
      "defaultCommand": "bitcoin",
      "baseIcon": "fab fa-bitcoin"
    },
    "fas fa-chart-line": {
      "commands": {
        "fgi": {
          "category": "metrics",
          "title": "Fear & Greed Index",
          "description": "Иконка индекса страха и жадности"
        }
      },
      "defaultCommand": "fgi",
      "baseIcon": "fas fa-chart-line"
    },
    "fas fa-wave-square": {
      "commands": {
        "vix": {
          "category": "metrics",
          "title": "VIX",
          "description": "Иконка индекса волатильности"
        }
      },
      "defaultCommand": "vix",
      "baseIcon": "fas fa-wave-square"
    },
    "fas fa-chart-bar": {
      "commands": {
        "oi": {
          "category": "metrics",
          "title": "Open Interest",
          "description": "Иконка открытого интереса"
        }
      },
      "defaultCommand": "oi",
      "baseIcon": "fas fa-chart-bar"
    },
    "fas fa-percent": {
      "commands": {
        "fr": {
          "category": "metrics",
          "title": "Funding Rate",
          "description": "Иконка ставки финансирования"
        }
      },
      "defaultCommand": "fr",
      "baseIcon": "fas fa-percent"
    },
    "fas fa-balance-scale": {
      "commands": {
        "lsr": {
          "category": "metrics",
          "title": "Long/Short Ratio",
          "description": "Иконка соотношения лонгов и шортов"
        }
      },
      "defaultCommand": "lsr",
      "baseIcon": "fas fa-balance-scale"
    },
    "fab fa-vuejs": {
      "commands": {
        "vuejs": {
          "category": "frameworks",
          "title": "Vue.js",
          "description": "Иконка фреймворка Vue.js",
          "color": "hsl(152, 48%, 53%)"
        }
      },
      "defaultCommand": "vuejs",
      "baseIcon": "fab fa-vuejs"
    },
    "fab fa-bootstrap": {
      "commands": {
        "bootstrap": {
          "category": "frameworks",
          "title": "Bootstrap",
          "description": "Иконка фреймворка Bootstrap",
          "color": "hsl(264, 45%, 47%)"
        }
      },
      "defaultCommand": "bootstrap",
      "baseIcon": "fab fa-bootstrap"
    },
    "fas fa-robot": {
      "commands": {
        "robot": {
          "category": "other",
          "title": "AI",
          "description": "Иконка искусственного интеллекта"
        }
      },
      "defaultCommand": "robot",
      "baseIcon": "fas fa-robot"
    },
    "fas fa-database": {
      "commands": {
        "database": {
          "category": "other",
          "title": "База данных",
          "description": "Иконка управления данными"
        }
      },
      "defaultCommand": "database",
      "baseIcon": "fas fa-database"
    },
    "fas fa-bars": {
      "commands": {
        "hamburger": {
          "category": "other",
          "title": "Меню",
          "description": "Иконка гамбургер-меню"
        }
      },
      "defaultCommand": "hamburger",
      "baseIcon": "fas fa-bars"
    }
  }
};

/**
 * Загружает соответствия иконок (синхронно, так как данные встроены)
 * @returns {Object} Объект с соответствиями иконок
 */
function loadIconsMapping() {
  return iconsMapping;
}

/**
 * Получает все команды для иконки
 * @param {string} iconClass - CSS класс иконки (например, 'fas fa-star')
 * @returns {Object} Объект с командами для иконки или null
 */
function getIconCommands(iconClass) {
  const mapping = loadIconsMapping();
  return mapping.icons?.[iconClass]?.commands || null;
}

/**
 * Получает базовую иконку для команды
 * @param {string} command - Название команды (например, 'favorite', 'add-to-favorites')
 * @returns {string} CSS класс базовой иконки или пустая строка
 */
function getIconByCommand(command) {
  const mapping = loadIconsMapping();
  if (!mapping.icons) return '';
  
  // Ищем команду во всех иконках
  for (const [iconClass, iconData] of Object.entries(mapping.icons)) {
    if (iconData.commands && iconData.commands[command]) {
      return iconData.baseIcon || iconClass;
    }
  }
  return '';
}

/**
 * Получает данные команды
 * @param {string} command - Название команды
 * @returns {Object} Данные команды (category, title, description) или null
 */
function getCommandData(command) {
  const mapping = loadIconsMapping();
  if (!mapping.icons) return null;
  
  // Ищем команду во всех иконках
  for (const [iconClass, iconData] of Object.entries(mapping.icons)) {
    if (iconData.commands && iconData.commands[command]) {
      return iconData.commands[command];
    }
  }
  return null;
}

/**
 * Получает иконку для команды
 * @param {string} category - Категория ('actions', 'navigation', 'status', etc.)
 * @param {string} command - Название команды
 * @returns {string} CSS класс иконки
 */
function getIconForCommand(category, command) {
  return getIconByCommand(command);
}

/**
 * Получает иконку для действия
 * @param {string} action - Название действия (например, 'refresh', 'delete', 'archive')
 * @returns {string} CSS класс иконки (например, 'fas fa-sync-alt')
 */
function getActionIcon(action) {
  return getIconForCommand('actions', action);
}

/**
 * Получает иконку для навигации
 * @param {string} navigation - Название навигации (например, 'sort', 'sort-up', 'sort-down')
 * @returns {string} CSS класс иконки
 */
function getNavigationIcon(navigation) {
  return getIconForCommand('navigation', navigation);
}

/**
 * Получает иконку для статуса
 * @param {string} status - Название статуса (например, 'warning', 'error', 'success')
 * @returns {string} CSS класс иконки
 */
function getStatusIcon(status) {
  return getIconForCommand('status', status);
}

/**
 * Получает иконку для метрики
 * @param {string} metric - Название метрики (например, 'bitcoin', 'fgi', 'vix')
 * @returns {string} CSS класс иконки
 */
function getMetricIcon(metric) {
  return getIconForCommand('metrics', metric);
}

/**
 * Получает иконку для фреймворка
 * @param {string} framework - Название фреймворка (например, 'vuejs', 'bootstrap')
 * @returns {string} CSS класс иконки
 */
function getFrameworkIcon(framework) {
  return getIconForCommand('frameworks', framework);
}

/**
 * Получает иконку для другого элемента
 * @param {string} other - Название элемента (например, 'robot', 'database', 'hamburger')
 * @returns {string} CSS класс иконки
 */
function getOtherIcon(other) {
  return getIconForCommand('other', other);
}

/**
 * Получает иконку темы в зависимости от текущей темы
 * @param {string} theme - Текущая тема ('light' или 'dark')
 * @returns {string} CSS класс иконки
 */
function getThemeIcon(theme) {
  if (theme === 'light') {
    return getIconForCommand('actions', 'theme-light');
  } else {
    return getIconForCommand('actions', 'theme-dark');
  }
}

/**
 * Получает title (подсказку) для иконки
 * @param {string} category - Категория ('actions', 'navigation', 'status', 'metrics', 'frameworks', 'other')
 * @param {string} name - Название иконки
 * @returns {string} Title для иконки
 */
function getIconTitle(category, name) {
  const commandData = getCommandData(name);
  return commandData?.title || '';
}

/**
 * Получает описание для иконки
 * @param {string} category - Категория ('actions', 'navigation', 'status', 'metrics', 'frameworks', 'other')
 * @param {string} name - Название иконки
 * @returns {string} Описание иконки
 */
function getIconDescription(category, name) {
  const commandData = getCommandData(name);
  return commandData?.description || '';
}

/**
 * Получает цвет для иконки фреймворка
 * @param {string} framework - Название фреймворка ('vuejs' или 'bootstrap')
 * @returns {string} HSL цвет
 */
function getFrameworkColor(framework) {
  const commandData = getCommandData(framework);
  return commandData?.color || '';
}

/**
 * Находит команду-индикатор по типу и значению
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator (например, 'selected', 'submenu')
 * @returns {Object} Данные команды-индикатора или null
 */
function findIndicatorCommand(type, value) {
  const mapping = loadIconsMapping();
  if (!mapping.icons) return null;
  
  // Ищем команду-индикатор во всех иконках
  for (const [iconClass, iconData] of Object.entries(mapping.icons)) {
    if (iconData.commands) {
      for (const [commandName, commandData] of Object.entries(iconData.commands)) {
        if (commandData.category === 'indicators' && 
            commandData.type === type && 
            commandData.value === value) {
          return commandData;
        }
      }
    }
  }
  return null;
}

/**
 * Получает иконку для indicator (статус или навигация)
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator (например, 'selected', 'submenu')
 * @returns {string} CSS класс иконки
 */
function getIndicatorIcon(type, value) {
  const indicatorData = findIndicatorCommand(type, value);
  if (!indicatorData) return '';
  
  // Ищем иконку, которая содержит эту команду-индикатор
  const mapping = loadIconsMapping();
  if (!mapping.icons) return '';
  
  for (const [iconClass, iconData] of Object.entries(mapping.icons)) {
    if (iconData.commands) {
      for (const [commandName, commandData] of Object.entries(iconData.commands)) {
        if (commandData === indicatorData) {
          return iconData.baseIcon || iconClass;
        }
      }
    }
  }
  return '';
}

/**
 * Получает label для indicator
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator
 * @returns {string} Label для indicator
 */
function getIndicatorLabel(type, value) {
  const indicatorData = findIndicatorCommand(type, value);
  return indicatorData?.label || '';
}

/**
 * Получает title (подсказку) для indicator
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator
 * @returns {string} Title для indicator
 */
function getIndicatorTitle(type, value) {
  const indicatorData = findIndicatorCommand(type, value);
  return indicatorData?.title || '';
}

/**
 * Получает description для indicator
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator
 * @returns {string} Description для indicator
 */
function getIndicatorDescription(type, value) {
  const indicatorData = findIndicatorCommand(type, value);
  return indicatorData?.description || '';
}

// Экспорт функций для использования в компонентах
if (typeof window !== 'undefined') {
  window.iconsHelper = {
    loadIconsMapping,
    getActionIcon,
    getNavigationIcon,
    getStatusIcon,
    getMetricIcon,
    getFrameworkIcon,
    getOtherIcon,
    getThemeIcon,
    getIconTitle,
    getIconDescription,
    getFrameworkColor,
    getIndicatorIcon,
    getIndicatorLabel,
    getIndicatorTitle,
    getIndicatorDescription,
    // Функции для схемы "одна иконка → много команд"
    getIconCommands,
    getIconByCommand,
    getCommandData,
    getIconForCommand
  };
}
