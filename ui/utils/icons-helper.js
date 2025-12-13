// Утилита для работы с иконками на основе централизованного JSON файла
// Соответствия иконок и команд встроены прямо в код для избежания CORS проблем при работе с file:// протоколом

// Встроенное содержимое icons-mapping.json
const iconsMapping = {
  "actions": {
    "refresh": {
      "icon": "fas fa-sync-alt",
      "title": "Обновить",
      "description": "Обновление данных или страницы"
    },
    "theme": {
      "light": {
        "icon": "fas fa-moon",
        "title": "Переключить на темную тему"
      },
      "dark": {
        "icon": "fas fa-sun",
        "title": "Переключить на светлую тему"
      }
    },
    "settings": {
      "icon": "fas fa-cog",
      "title": "Настройки",
      "description": "Открыть настройки проекта"
    },
    "open-external": {
      "icon": "fas fa-external-link-alt",
      "title": "Открыть",
      "description": "Открыть на внешнем ресурсе (Bybit)"
    },
    "export": {
      "icon": "fas fa-download",
      "title": "Экспорт",
      "description": "Экспорт настроек в JSON"
    },
    "import": {
      "icon": "fas fa-upload",
      "title": "Импорт",
      "description": "Импорт настроек из JSON"
    },
    "select-all": {
      "icon": "fas fa-check-square",
      "title": "Выбрать все",
      "description": "Выбрать все элементы"
    },
    "deselect-all": {
      "icon": "fas fa-square",
      "title": "Отменить все",
      "description": "Отменить выбор всех элементов"
    },
    "delete": {
      "icon": "fas fa-trash",
      "title": "Удалить",
      "description": "Удалить элемент или элементы"
    },
    "archive": {
      "icon": "fas fa-archive",
      "title": "Архив",
      "description": "Архивировать элемент или элементы (будущая функциональность)"
    },
    "save": {
      "icon": "fas fa-save",
      "title": "Сохранить",
      "description": "Сохранить изменения"
    },
    "eye": {
      "icon": "fas fa-eye",
      "title": "Показать",
      "description": "Показать скрытое содержимое"
    },
    "eye-slash": {
      "icon": "fas fa-eye-slash",
      "title": "Скрыть",
      "description": "Скрыть содержимое"
    },
    "stop": {
      "icon": "fas fa-stop",
      "title": "Остановить",
      "description": "Остановить выполнение операции"
    }
  },
  "navigation": {
    "sort": {
      "icon": "fas fa-sort",
      "title": "Сортировка",
      "description": "Нейтральная иконка сортировки"
    },
    "sort-up": {
      "icon": "fas fa-sort-up",
      "title": "Сортировка по возрастанию",
      "description": "Сортировка по возрастанию"
    },
    "sort-down": {
      "icon": "fas fa-sort-down",
      "title": "Сортировка по убыванию",
      "description": "Сортировка по убыванию"
    }
  },
  "status": {
    "warning": {
      "icon": "fas fa-exclamation-triangle",
      "title": "Предупреждение",
      "description": "Иконка предупреждения"
    },
    "error": {
      "icon": "fas fa-exclamation-circle",
      "title": "Ошибка",
      "description": "Иконка ошибки"
    },
    "success": {
      "icon": "fas fa-check-circle",
      "title": "Успех",
      "description": "Иконка успешного выполнения"
    },
    "check": {
      "icon": "fas fa-check",
      "title": "Отмечено",
      "description": "Иконка отметки"
    },
    "spinner": {
      "icon": "fas fa-spinner fa-spin",
      "title": "Загрузка",
      "description": "Иконка загрузки с анимацией"
    }
  },
  "metrics": {
    "bitcoin": {
      "icon": "fab fa-bitcoin",
      "title": "Bitcoin Dominance",
      "description": "Иконка доминирования Bitcoin"
    },
    "fgi": {
      "icon": "fas fa-chart-line",
      "title": "Fear & Greed Index",
      "description": "Иконка индекса страха и жадности"
    },
    "vix": {
      "icon": "fas fa-wave-square",
      "title": "VIX",
      "description": "Иконка индекса волатильности"
    },
    "oi": {
      "icon": "fas fa-chart-bar",
      "title": "Open Interest",
      "description": "Иконка открытого интереса"
    },
    "fr": {
      "icon": "fas fa-percent",
      "title": "Funding Rate",
      "description": "Иконка ставки финансирования"
    },
    "lsr": {
      "icon": "fas fa-balance-scale",
      "title": "Long/Short Ratio",
      "description": "Иконка соотношения лонгов и шортов"
    }
  },
  "frameworks": {
    "vuejs": {
      "icon": "fab fa-vuejs",
      "title": "Vue.js",
      "description": "Иконка фреймворка Vue.js",
      "color": "hsl(152, 48%, 53%)"
    },
    "bootstrap": {
      "icon": "fab fa-bootstrap",
      "title": "Bootstrap",
      "description": "Иконка фреймворка Bootstrap",
      "color": "hsl(264, 45%, 47%)"
    }
  },
  "other": {
    "robot": {
      "icon": "fas fa-robot",
      "title": "AI",
      "description": "Иконка искусственного интеллекта"
    },
    "database": {
      "icon": "fas fa-database",
      "title": "База данных",
      "description": "Иконка управления данными"
    },
    "hamburger": {
      "icon": "fas fa-bars",
      "title": "Меню",
      "description": "Иконка гамбургер-меню"
    }
  },
  "indicators": {
    "status": {
      "selected": {
        "icon": "fas fa-check",
        "label": "Выбрано",
        "title": "Элемент выбран",
        "description": "Элемент находится в выбранном состоянии"
      },
      "disabled": {
        "icon": "fas fa-ban",
        "label": "Отключено",
        "title": "Элемент отключен",
        "description": "Элемент недоступен для взаимодействия"
      },
      "loading": {
        "icon": "fas fa-spinner fa-spin",
        "label": "Загрузка",
        "title": "Идет загрузка",
        "description": "Выполняется операция загрузки данных"
      },
      "warning": {
        "icon": "fas fa-exclamation-triangle",
        "label": "Предупреждение",
        "title": "Предупреждение",
        "description": "Требуется внимание"
      },
      "error": {
        "icon": "fas fa-exclamation-circle",
        "label": "Ошибка",
        "title": "Ошибка",
        "description": "Произошла ошибка"
      },
      "favorite": {
        "icon": "fas fa-star text-warning",
        "label": "В избранном",
        "title": "В избранном",
        "description": "Элемент находится в избранном. Нажмите, чтобы убрать из избранного"
      },
      "not-favorite": {
        "icon": "fas fa-star text-muted",
        "label": "Не в избранном",
        "title": "Не в избранном",
        "description": "Элемент не в избранном. Нажмите, чтобы добавить в избранное"
      }
    },
    "navigation": {
      "submenu": {
        "icon": "fas fa-chevron-right",
        "label": "Подменю",
        "title": "Вложенное меню",
        "description": "Нажмите, чтобы открыть вложенное меню"
      },
      "external": {
        "icon": "fas fa-external-link-alt",
        "label": "Внешняя ссылка",
        "title": "Открыть во внешнем ресурсе",
        "description": "Нажмите, чтобы открыть на внешнем сайте"
      },
      "modal": {
        "icon": "fas fa-window-maximize",
        "label": "Модальное окно",
        "title": "Открыть в модальном окне",
        "description": "Нажмите, чтобы открыть модальное окно"
      }
    }
  }
};

/**
 * Загружает соответствия иконок (теперь синхронно, так как данные встроены)
 * @returns {Object} Объект с соответствиями иконок
 */
function loadIconsMapping() {
  return iconsMapping;
}

/**
 * Получает иконку для действия
 * @param {string} action - Название действия (например, 'refresh', 'delete', 'archive')
 * @returns {Promise<string>} CSS класс иконки (например, 'fas fa-sync-alt')
 */
function getActionIcon(action) {
  const mapping = loadIconsMapping();
  return mapping.actions?.[action]?.icon || '';
}

/**
 * Получает иконку для навигации
 * @param {string} navigation - Название навигации (например, 'move-up', 'move-down')
 * @returns {Promise<string>} CSS класс иконки
 */
function getNavigationIcon(navigation) {
  const mapping = loadIconsMapping();
  return mapping.navigation?.[navigation]?.icon || '';
}

/**
 * Получает иконку для статуса
 * @param {string} status - Название статуса (например, 'warning', 'error', 'success')
 * @returns {string} CSS класс иконки
 */
function getStatusIcon(status) {
  const mapping = loadIconsMapping();
  return mapping.status?.[status]?.icon || '';
}

/**
 * Получает иконку для метрики
 * @param {string} metric - Название метрики (например, 'bitcoin', 'fgi', 'vix')
 * @returns {string} CSS класс иконки
 */
function getMetricIcon(metric) {
  const mapping = loadIconsMapping();
  return mapping.metrics?.[metric]?.icon || '';
}

/**
 * Получает иконку для фреймворка
 * @param {string} framework - Название фреймворка (например, 'vuejs', 'bootstrap')
 * @returns {string} CSS класс иконки
 */
function getFrameworkIcon(framework) {
  const mapping = loadIconsMapping();
  return mapping.frameworks?.[framework]?.icon || '';
}

/**
 * Получает иконку для другого элемента
 * @param {string} other - Название элемента (например, 'robot', 'database', 'hamburger')
 * @returns {string} CSS класс иконки
 */
function getOtherIcon(other) {
  const mapping = loadIconsMapping();
  return mapping.other?.[other]?.icon || '';
}

/**
 * Получает иконку темы в зависимости от текущей темы
 * @param {string} theme - Текущая тема ('light' или 'dark')
 * @returns {string} CSS класс иконки
 */
function getThemeIcon(theme) {
  const mapping = loadIconsMapping();
  if (theme === 'light') {
    return mapping.actions?.theme?.light?.icon || 'fas fa-moon';
  } else {
    return mapping.actions?.theme?.dark?.icon || 'fas fa-sun';
  }
}

/**
 * Получает title (подсказку) для иконки
 * @param {string} category - Категория ('actions', 'navigation', 'status', 'metrics', 'frameworks', 'other')
 * @param {string} name - Название иконки
 * @returns {string} Title для иконки
 */
function getIconTitle(category, name) {
  const mapping = loadIconsMapping();
  return mapping[category]?.[name]?.title || '';
}

/**
 * Получает описание для иконки
 * @param {string} category - Категория ('actions', 'navigation', 'status', 'metrics', 'frameworks', 'other')
 * @param {string} name - Название иконки
 * @returns {string} Описание иконки
 */
function getIconDescription(category, name) {
  const mapping = loadIconsMapping();
  return mapping[category]?.[name]?.description || '';
}

/**
 * Получает цвет для иконки фреймворка
 * @param {string} framework - Название фреймворка ('vuejs' или 'bootstrap')
 * @returns {string} HSL цвет
 */
function getFrameworkColor(framework) {
  const mapping = loadIconsMapping();
  return mapping.frameworks?.[framework]?.color || '';
}

/**
 * Получает иконку для indicator (статус или навигация)
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator (например, 'selected', 'submenu')
 * @returns {string} CSS класс иконки
 */
function getIndicatorIcon(type, value) {
  const mapping = loadIconsMapping();
  return mapping.indicators?.[type]?.[value]?.icon || '';
}

/**
 * Получает label для indicator
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator
 * @returns {string} Label для indicator
 */
function getIndicatorLabel(type, value) {
  const mapping = loadIconsMapping();
  return mapping.indicators?.[type]?.[value]?.label || '';
}

/**
 * Получает title (подсказку) для indicator
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator
 * @returns {string} Title для indicator
 */
function getIndicatorTitle(type, value) {
  const mapping = loadIconsMapping();
  return mapping.indicators?.[type]?.[value]?.title || '';
}

/**
 * Получает description для indicator
 * @param {string} type - Тип indicator ('status' или 'navigation')
 * @param {string} value - Значение indicator
 * @returns {string} Description для indicator
 */
function getIndicatorDescription(type, value) {
  const mapping = loadIconsMapping();
  return mapping.indicators?.[type]?.[value]?.description || '';
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
    getIndicatorDescription
  };
}

