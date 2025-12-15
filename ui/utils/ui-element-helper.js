// Утилита для работы с UI элементами (иконки, кнопки, меню) на основе централизованного JSON файла
// Соответствия иконок и команд встроены прямо в код для избежания CORS проблем при работе с file:// протоколом

// Встроенное содержимое ui-element-mapping.json
// Структура: icons (одна иконка → много команд)
const uiElementMapping = {
  "icons": {
    "fas fa-star": {
      "commands": {
        "favorite": {
          "category": "actions",
          "label": "Избранное",
          "tooltip": "Выбрать избранное"
        },
        "add-to-favorites": {
          "category": "actions",
          "label": "В избранное",
          "tooltip": "Добавить в избранное"
        },
        "remove-from-favorites": {
          "category": "actions",
          "label": "Убрать из избранного",
          "tooltip": "Убрать из избранного"
        },
        "favorite-status": {
          "category": "indicators",
          "type": "status",
          "value": "favorite",
          "label": "В избранном",
          "tooltip": "Элемент находится в избранном. Нажмите, чтобы убрать из избранного"
        },
        "not-favorite-status": {
          "category": "indicators",
          "type": "status",
          "value": "not-favorite",
          "label": "Не в избранном",
          "tooltip": "Элемент не в избранном. Нажмите, чтобы добавить в избранное"
        }
      },
      "defaultCommand": "favorite",
      "baseIcon": "fas fa-star"
    },
    "fas fa-check": {
      "commands": {
        "check": {
          "category": "status",
          "label": "Отмечено",
          "tooltip": "Иконка отметки"
        },
        "selected": {
          "category": "indicators",
          "type": "status",
          "value": "selected",
          "label": "Выбрано",
          "tooltip": "Элемент находится в выбранном состоянии"
        }
      },
      "defaultCommand": "check",
      "baseIcon": "fas fa-check"
    },
    "fas fa-external-link-alt": {
      "commands": {
        "open-external": {
          "category": "actions",
          "label": "Открыть",
          "tooltip": "Открыть на внешнем ресурсе (Bybit)"
        },
        "external": {
          "category": "indicators",
          "type": "navigation",
          "value": "external",
          "label": "Внешняя ссылка",
          "tooltip": "Нажмите, чтобы открыть на внешнем сайте"
        }
      },
      "defaultCommand": "open-external",
      "baseIcon": "fas fa-external-link-alt"
    },
    "fas fa-sync-alt": {
      "commands": {
        "refresh": {
          "category": "actions",
          "label": "Обновить",
          "tooltip": "Обновление данных или страницы"
        }
      },
      "defaultCommand": "refresh",
      "baseIcon": "fas fa-sync-alt"
    },
    "fas fa-moon": {
      "commands": {
        "theme-light": {
          "category": "actions",
          "label": "Переключить на темную тему",
          "tooltip": "Переключить тему на темную"
        }
      },
      "defaultCommand": "theme-light",
      "baseIcon": "fas fa-moon"
    },
    "fas fa-sun": {
      "commands": {
        "theme-dark": {
          "category": "actions",
          "label": "Переключить на светлую тему",
          "tooltip": "Переключить тему на светлую"
        }
      },
      "defaultCommand": "theme-dark",
      "baseIcon": "fas fa-sun"
    },
    "fas fa-cog": {
      "commands": {
        "settings": {
          "category": "actions",
          "label": "Настройки",
          "tooltip": "Открыть настройки проекта"
        }
      },
      "defaultCommand": "settings",
      "baseIcon": "fas fa-cog"
    },
    "fas fa-download": {
      "commands": {
        "export": {
          "category": "actions",
          "label": "Экспорт",
          "tooltip": "Экспорт настроек в JSON"
        }
      },
      "defaultCommand": "export",
      "baseIcon": "fas fa-download"
    },
    "fas fa-upload": {
      "commands": {
        "import": {
          "category": "actions",
          "label": "Импорт",
          "tooltip": "Импорт настроек из JSON"
        }
      },
      "defaultCommand": "import",
      "baseIcon": "fas fa-upload"
    },
    "fas fa-check-square": {
      "commands": {
        "select-all": {
          "category": "actions",
          "label": "Выбрать все",
          "tooltip": "Выбрать все элементы"
        }
      },
      "defaultCommand": "select-all",
      "baseIcon": "fas fa-check-square"
    },
    "fas fa-square": {
      "commands": {
        "deselect-all": {
          "category": "actions",
          "label": "Отменить все",
          "tooltip": "Отменить выбор всех элементов"
        }
      },
      "defaultCommand": "deselect-all",
      "baseIcon": "fas fa-square"
    },
    "fas fa-trash": {
      "commands": {
        "delete": {
          "category": "actions",
          "label": "Удалить",
          "tooltip": "Удалить элемент или элементы"
        }
      },
      "defaultCommand": "delete",
      "baseIcon": "fas fa-trash"
    },
    "fas fa-coins": {
      "commands": {
        "stablecoins": {
          "category": "actions",
          "label": "Стейблкоины",
          "tooltip": "Выбрать стейблкоины"
        }
      },
      "defaultCommand": "stablecoins",
      "baseIcon": "fas fa-coins"
    },
    "icon-cross": {
      "commands": {
        "close": {
          "category": "actions",
          "label": "Закрыть",
          "tooltip": "Закрыть окно или панель"
        },
        "clear": {
          "category": "actions",
          "label": "Очистить",
          "tooltip": "Очистить поле или список"
        },
        "remove": {
          "category": "actions",
          "label": "Убрать",
          "tooltip": "Убрать элемент из списка"
        },
        "exclude": {
          "category": "actions",
          "label": "Исключить",
          "tooltip": "Исключить элемент"
        }
      },
      "defaultCommand": "close",
      "baseIcon": "icon-cross"
    },
    "fas fa-archive": {
      "commands": {
        "archive": {
          "category": "actions",
          "label": "Архив",
          "tooltip": "Архивировать элемент или элементы (будущая функциональность)"
        }
      },
      "defaultCommand": "archive",
      "baseIcon": "fas fa-archive"
    },
    "fas fa-save": {
      "commands": {
        "save": {
          "category": "actions",
          "label": "Сохранить",
          "tooltip": "Сохранить изменения"
        }
      },
      "defaultCommand": "save",
      "baseIcon": "fas fa-save"
    },
    "fas fa-eye": {
      "commands": {
        "eye": {
          "category": "actions",
          "label": "Показать",
          "tooltip": "Показать скрытое содержимое"
        }
      },
      "defaultCommand": "eye",
      "baseIcon": "fas fa-eye"
    },
    "fas fa-eye-slash": {
      "commands": {
        "eye-slash": {
          "category": "actions",
          "label": "Скрыть",
          "tooltip": "Скрыть содержимое"
        }
      },
      "defaultCommand": "eye-slash",
      "baseIcon": "fas fa-eye-slash"
    },
    "fas fa-stop": {
      "commands": {
        "stop": {
          "category": "actions",
          "label": "Остановить",
          "tooltip": "Остановить выполнение операции"
        }
      },
      "defaultCommand": "stop",
      "baseIcon": "fas fa-stop"
    },
    "fas fa-sort": {
      "commands": {
        "sort": {
          "category": "navigation",
          "label": "Сортировка",
          "tooltip": "Нейтральная иконка сортировки"
        }
      },
      "defaultCommand": "sort",
      "baseIcon": "fas fa-sort"
    },
    "fas fa-sort-up": {
      "commands": {
        "sort-up": {
          "category": "navigation",
          "label": "Сортировка по возрастанию",
          "tooltip": "Сортировка по возрастанию"
        }
      },
      "defaultCommand": "sort-up",
      "baseIcon": "fas fa-sort-up"
    },
    "fas fa-sort-down": {
      "commands": {
        "sort-down": {
          "category": "navigation",
          "label": "Сортировка по убыванию",
          "tooltip": "Сортировка по убыванию"
        }
      },
      "defaultCommand": "sort-down",
      "baseIcon": "fas fa-sort-down"
    },
    "fas fa-exclamation-triangle": {
      "commands": {
        "warning": {
          "category": "status",
          "label": "Предупреждение",
          "tooltip": "Иконка предупреждения"
        },
        "warning-indicator": {
          "category": "indicators",
          "type": "status",
          "value": "warning",
          "label": "Предупреждение",
          "tooltip": "Требуется внимание"
        }
      },
      "defaultCommand": "warning",
      "baseIcon": "fas fa-exclamation-triangle"
    },
    "fas fa-exclamation-circle": {
      "commands": {
        "error": {
          "category": "status",
          "label": "Ошибка",
          "tooltip": "Иконка ошибки"
        },
        "error-indicator": {
          "category": "indicators",
          "type": "status",
          "value": "error",
          "label": "Ошибка",
          "tooltip": "Произошла ошибка"
        }
      },
      "defaultCommand": "error",
      "baseIcon": "fas fa-exclamation-circle"
    },
    "fas fa-check-circle": {
      "commands": {
        "success": {
          "category": "status",
          "label": "Успех",
          "tooltip": "Иконка успешного выполнения"
        }
      },
      "defaultCommand": "success",
      "baseIcon": "fas fa-check-circle"
    },
    "fas fa-spinner": {
      "commands": {
        "spinner": {
          "category": "status",
          "label": "Загрузка",
          "tooltip": "Иконка загрузки с анимацией"
        },
        "loading-indicator": {
          "category": "indicators",
          "type": "status",
          "value": "loading",
          "label": "Загрузка",
          "tooltip": "Выполняется операция загрузки данных"
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
          "tooltip": "Элемент недоступен для взаимодействия"
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
          "tooltip": "Нажмите, чтобы открыть вложенное меню"
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
          "tooltip": "Нажмите, чтобы открыть модальное окно"
        }
      },
      "defaultCommand": "modal",
      "baseIcon": "fas fa-window-maximize"
    },
    "fab fa-bitcoin": {
      "commands": {
        "bitcoin": {
          "category": "metrics",
          "label": "Bitcoin Dominance",
          "tooltip": "Иконка доминирования Bitcoin"
        }
      },
      "defaultCommand": "bitcoin",
      "baseIcon": "fab fa-bitcoin"
    },
    "fas fa-chart-line": {
      "commands": {
        "fgi": {
          "category": "metrics",
          "label": "Fear & Greed Index",
          "tooltip": "Иконка индекса страха и жадности"
        }
      },
      "defaultCommand": "fgi",
      "baseIcon": "fas fa-chart-line"
    },
    "fas fa-wave-square": {
      "commands": {
        "vix": {
          "category": "metrics",
          "label": "VIX",
          "tooltip": "Иконка индекса волатильности"
        }
      },
      "defaultCommand": "vix",
      "baseIcon": "fas fa-wave-square"
    },
    "fas fa-chart-bar": {
      "commands": {
        "oi": {
          "category": "metrics",
          "label": "Open Interest",
          "tooltip": "Иконка открытого интереса"
        }
      },
      "defaultCommand": "oi",
      "baseIcon": "fas fa-chart-bar"
    },
    "fas fa-percent": {
      "commands": {
        "fr": {
          "category": "metrics",
          "label": "Funding Rate",
          "tooltip": "Иконка ставки финансирования"
        }
      },
      "defaultCommand": "fr",
      "baseIcon": "fas fa-percent"
    },
    "fas fa-balance-scale": {
      "commands": {
        "lsr": {
          "category": "metrics",
          "label": "Long/Short Ratio",
          "tooltip": "Иконка соотношения лонгов и шортов"
        }
      },
      "defaultCommand": "lsr",
      "baseIcon": "fas fa-balance-scale"
    },
    "fab fa-vuejs": {
      "commands": {
        "vuejs": {
          "category": "frameworks",
          "label": "Vue.js",
          "tooltip": "Иконка фреймворка Vue.js",
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
          "label": "Bootstrap",
          "tooltip": "Иконка фреймворка Bootstrap",
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
          "label": "AI",
          "tooltip": "Иконка искусственного интеллекта"
        }
      },
      "defaultCommand": "robot",
      "baseIcon": "fas fa-robot"
    },
    "fas fa-database": {
      "commands": {
        "database": {
          "category": "other",
          "label": "База данных",
          "tooltip": "Иконка управления данными"
        }
      },
      "defaultCommand": "database",
      "baseIcon": "fas fa-database"
    },
    "fas fa-bars": {
      "commands": {
        "hamburger": {
          "category": "other",
          "label": "Меню",
          "tooltip": "Иконка гамбургер-меню"
        }
      },
      "defaultCommand": "hamburger",
      "baseIcon": "fas fa-bars"
    }
  }
};

/**
 * Загружает соответствия UI элементов (синхронно, так как данные встроены)
 * @returns {Object} Объект с соответствиями иконок и команд
 */
function loadUIElementMapping() {
  return uiElementMapping;
}

/**
 * Получает все команды для иконки
 * @param {string} iconClass - CSS класс иконки (например, 'fas fa-star')
 * @returns {Object} Объект с командами для иконки или null
 */
function getIconCommands(iconClass) {
  const mapping = loadUIElementMapping();
  return mapping.icons?.[iconClass]?.commands || null;
}

/**
 * Получает базовую иконку для команды
 * @param {string} command - Название команды (например, 'favorite', 'add-to-favorites')
 * @returns {string} CSS класс базовой иконки или пустая строка
 */
function getIconByCommand(command) {
  const mapping = loadUIElementMapping();
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
 * @returns {Object} Данные команды (category, label, tooltip) или null
 */
function getCommandData(command) {
  const mapping = loadUIElementMapping();
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
 * Получает label (текст для UI) для команды
 * @param {string} category - Категория ('actions', 'navigation', 'status', 'metrics', 'frameworks', 'other')
 * @param {string} command - Название команды
 * @returns {string} Label для команды
 */
function getIconLabel(category, command) {
  const commandData = getCommandData(command);
  return commandData?.label || '';
}

/**
 * Получает tooltip (подсказку) для команды
 * @param {string} category - Категория ('actions', 'navigation', 'status', 'metrics', 'frameworks', 'other')
 * @param {string} command - Название команды
 * @returns {string} Tooltip для команды
 */
function getIconTooltip(category, command) {
  const commandData = getCommandData(command);
  return commandData?.tooltip || '';
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
  const mapping = loadUIElementMapping();
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
  const mapping = loadUIElementMapping();
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
 * Получает tooltip (подсказку) для indicator
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator
 * @returns {string} Tooltip для indicator
 */
function getIndicatorTooltip(type, value) {
  const indicatorData = findIndicatorCommand(type, value);
  return indicatorData?.tooltip || '';
}

/**
 * Получает путь к SVG-файлу иконки
 * @param {string} iconName - Название иконки без префикса (например, 'cross' для 'icon-cross')
 * @returns {string} Путь к SVG-файлу или пустая строка
 */
function getSVGIconPath(iconName) {
  if (!iconName) return '';
  // Убираем префикс 'icon-' если он есть
  const cleanName = iconName.startsWith('icon-') ? iconName.replace('icon-', '') : iconName;
  return `ui/assets/icons/icon-${cleanName}.svg`;
}

/**
 * Проверяет, является ли иконка SVG-файлом (начинается с 'icon-')
 * @param {string} iconClass - CSS класс иконки
 * @returns {boolean} true если это SVG-иконка
 */
function isSVGIcon(iconClass) {
  return iconClass && iconClass.startsWith('icon-');
}

// Экспорт функций для использования в компонентах
if (typeof window !== 'undefined') {
  window.uiElementHelper = {
    loadUIElementMapping,
    getActionIcon,
    getNavigationIcon,
    getStatusIcon,
    getMetricIcon,
    getFrameworkIcon,
    getOtherIcon,
    getThemeIcon,
    getIconLabel,
    getIconTooltip,
    getFrameworkColor,
    getIndicatorIcon,
    getIndicatorLabel,
    getIndicatorTooltip,
    // Функции для SVG-иконок
    getSVGIconPath,
    isSVGIcon,
    // Функции для схемы "одна иконка → много команд"
    getIconCommands,
    getIconByCommand,
    getCommandData,
    getIconForCommand
  };
}

