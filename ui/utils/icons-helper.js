// Утилита для работы с иконками на основе централизованного JSON файла
// Загружает соответствия иконок и команд из ui/config/icons-mapping.json

let iconsMapping = null;

/**
 * Загружает соответствия иконок из JSON файла
 * @returns {Promise<Object>} Объект с соответствиями иконок
 */
async function loadIconsMapping() {
  if (iconsMapping) {
    return iconsMapping;
  }

  try {
    const response = await fetch('ui/config/icons-mapping.json');
    if (!response.ok) {
      throw new Error(`Failed to load icons mapping: ${response.statusText}`);
    }
    iconsMapping = await response.json();
    return iconsMapping;
  } catch (error) {
    console.error('Error loading icons mapping:', error);
    // Возвращаем пустой объект в случае ошибки
    return {};
  }
}

/**
 * Получает иконку для действия
 * @param {string} action - Название действия (например, 'refresh', 'delete', 'archive')
 * @returns {Promise<string>} CSS класс иконки (например, 'fas fa-sync-alt')
 */
async function getActionIcon(action) {
  const mapping = await loadIconsMapping();
  return mapping.actions?.[action]?.icon || '';
}

/**
 * Получает иконку для навигации
 * @param {string} navigation - Название навигации (например, 'move-up', 'move-down')
 * @returns {Promise<string>} CSS класс иконки
 */
async function getNavigationIcon(navigation) {
  const mapping = await loadIconsMapping();
  return mapping.navigation?.[navigation]?.icon || '';
}

/**
 * Получает иконку для статуса
 * @param {string} status - Название статуса (например, 'warning', 'error', 'success')
 * @returns {Promise<string>} CSS класс иконки
 */
async function getStatusIcon(status) {
  const mapping = await loadIconsMapping();
  return mapping.status?.[status]?.icon || '';
}

/**
 * Получает иконку для метрики
 * @param {string} metric - Название метрики (например, 'bitcoin', 'fgi', 'vix')
 * @returns {Promise<string>} CSS класс иконки
 */
async function getMetricIcon(metric) {
  const mapping = await loadIconsMapping();
  return mapping.metrics?.[metric]?.icon || '';
}

/**
 * Получает иконку для фреймворка
 * @param {string} framework - Название фреймворка (например, 'vuejs', 'bootstrap')
 * @returns {Promise<string>} CSS класс иконки
 */
async function getFrameworkIcon(framework) {
  const mapping = await loadIconsMapping();
  return mapping.frameworks?.[framework]?.icon || '';
}

/**
 * Получает иконку для другого элемента
 * @param {string} other - Название элемента (например, 'robot', 'database', 'hamburger')
 * @returns {Promise<string>} CSS класс иконки
 */
async function getOtherIcon(other) {
  const mapping = await loadIconsMapping();
  return mapping.other?.[other]?.icon || '';
}

/**
 * Получает иконку темы в зависимости от текущей темы
 * @param {string} theme - Текущая тема ('light' или 'dark')
 * @returns {Promise<string>} CSS класс иконки
 */
async function getThemeIcon(theme) {
  const mapping = await loadIconsMapping();
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
 * @returns {Promise<string>} Title для иконки
 */
async function getIconTitle(category, name) {
  const mapping = await loadIconsMapping();
  return mapping[category]?.[name]?.title || '';
}

/**
 * Получает описание для иконки
 * @param {string} category - Категория ('actions', 'navigation', 'status', 'metrics', 'frameworks', 'other')
 * @param {string} name - Название иконки
 * @returns {Promise<string>} Описание иконки
 */
async function getIconDescription(category, name) {
  const mapping = await loadIconsMapping();
  return mapping[category]?.[name]?.description || '';
}

/**
 * Получает цвет для иконки фреймворка
 * @param {string} framework - Название фреймворка ('vuejs' или 'bootstrap')
 * @returns {Promise<string>} HSL цвет
 */
async function getFrameworkColor(framework) {
  const mapping = await loadIconsMapping();
  return mapping.frameworks?.[framework]?.color || '';
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
    getFrameworkColor
  };
}

