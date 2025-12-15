// =========================
// КОНФИГУРАЦИЯ КОЛОНОК ТАБЛИЦЫ
// Централизованная конфигурация для компонента таблицы
// =========================
// Этот модуль содержит статическую конфигурацию колонок таблицы монет:
// - Определяет заголовки, поля сортировки, форматирование, видимость
// - Используется в компоненте ui/api/coins-manager.js
//
// ВАЖНО: Это статический объект конфигурации, не зависящий от Vue компонентов.
// Может использоваться в любом контексте для определения структуры таблицы.

const tableColumns = [
  // Колонка чекбоксов - СПЕЦИАЛЬНАЯ (не через конфигурацию форматирования)
  {
    id: 'checkbox',
    type: 'checkbox',
    cssClass: 'col-checkbox',
    width: '40px'
  },
  // Колонка монет - СПЕЦИАЛЬНАЯ (не через sortable-header)
  {
    id: 'coin',
    type: 'coin',
    label: 'Монета',
    cssClass: 'col-coin',
    sortable: false, // Использует кастомную сортировку через coinSortType
    showSortIndicator: false, // Отключаем индикацию сортировки для кастомной сортировки
    menuItems: [
      { id: 'market_cap', label: 'По капитализации' },
      { id: 'total_volume', label: 'По дневному объему' },
      { id: 'alphabet', label: 'По алфавиту' },
      { id: 'favorite', label: 'Избранное' },
      { id: 'selected', label: 'Выбранные' }
    ],
    customSort: {
      enabled: true,
      sortType: 'custom'
    }
  },
  // Процентные колонки - через конфигурацию форматирования
  {
    id: 'percent-1h',
    type: 'numeric',
    label: '1h%',
    field: 'price_change_percentage_1h_in_currency',
    cssClass: 'col-percent-1h',
    sortable: true,
    format: {
      component: 'cell-num',
      type: 'decimal',
      precision: 2,
      rounding: 'precision',
      unit: '%',
      colorize: true,
      roundToHalf: true,
      sectors: [
        { range: [-Infinity, 0], cssClass: 'text-danger' },
        { range: [0, Infinity], cssClass: 'text-success' }
      ],
      decimalSeparator: ',',
      thousandsSeparator: ' '
    }
  },
  {
    id: 'percent-24h',
    type: 'numeric',
    label: '24h%',
    field: 'price_change_percentage_24h_in_currency',
    cssClass: 'col-percent-24h',
    sortable: true,
    format: {
      component: 'cell-num',
      type: 'decimal',
      precision: 2,
      rounding: 'precision',
      unit: '%',
      colorize: true,
      roundToHalf: true,
      sectors: [
        { range: [-Infinity, 0], cssClass: 'text-danger' },
        { range: [0, Infinity], cssClass: 'text-success' }
      ],
      decimalSeparator: ',',
      thousandsSeparator: ' '
    }
  },
  {
    id: 'percent-7d',
    type: 'numeric',
    label: '7d%',
    field: 'price_change_percentage_7d_in_currency',
    cssClass: 'col-percent-7d',
    sortable: true,
    format: {
      component: 'cell-num',
      type: 'decimal',
      precision: 2,
      rounding: 'precision',
      unit: '%',
      colorize: true,
      roundToHalf: true,
      sectors: [
        { range: [-Infinity, 0], cssClass: 'text-danger' },
        { range: [0, Infinity], cssClass: 'text-success' }
      ],
      decimalSeparator: ',',
      thousandsSeparator: ' '
    }
  },
  {
    id: 'percent-14d',
    type: 'numeric',
    label: '14d%',
    field: 'price_change_percentage_14d_in_currency',
    cssClass: 'col-percent-14d',
    sortable: true,
    format: {
      component: 'cell-num',
      type: 'decimal',
      precision: 2,
      rounding: 'precision',
      unit: '%',
      colorize: true,
      roundToHalf: true,
      sectors: [
        { range: [-Infinity, 0], cssClass: 'text-danger' },
        { range: [0, Infinity], cssClass: 'text-success' }
      ],
      decimalSeparator: ',',
      thousandsSeparator: ' '
    }
  },
  {
    id: 'percent-30d',
    type: 'numeric',
    label: '30d%',
    field: 'price_change_percentage_30d_in_currency',
    cssClass: 'col-percent-30d',
    sortable: true,
    format: {
      component: 'cell-num',
      type: 'decimal',
      precision: 2,
      rounding: 'precision',
      unit: '%',
      colorize: true,
      roundToHalf: true,
      sectors: [
        { range: [-Infinity, 0], cssClass: 'text-danger' },
        { range: [0, Infinity], cssClass: 'text-success' }
      ],
      decimalSeparator: ',',
      thousandsSeparator: ' '
    }
  },
  {
    id: 'percent-200d',
    type: 'numeric',
    label: '200d%',
    field: 'price_change_percentage_200d_in_currency',
    cssClass: 'col-percent-200d',
    sortable: true,
    format: {
      component: 'cell-num',
      type: 'decimal',
      precision: 2,
      rounding: 'precision',
      unit: '%',
      colorize: true,
      roundToHalf: true,
      sectors: [
        { range: [-Infinity, 0], cssClass: 'text-danger' },
        { range: [0, Infinity], cssClass: 'text-success' }
      ],
      decimalSeparator: ',',
      thousandsSeparator: ' '
    }
  },
  // CD колонки - динамические (будут развернуты через cdHeaders)
  {
    id: 'cd-dynamic',
    type: 'numeric',
    label: null, // Будет браться из cdHeaders
    field: null, // Будет вычисляться через getCDField
    cssClass: 'col-cd',
    sortable: true,
    dynamic: true, // Флаг для динамических колонок
    format: {
      component: 'cell-num',
      type: 'decimal',
      precision: 2,
      rounding: 'precision',
      colorize: true,
      roundToHalf: true,
      sectors: [
        { range: [-Infinity, 0], cssClass: 'text-danger' },
        { range: [0, Infinity], cssClass: 'text-success' }
      ],
      decimalSeparator: ',',
      thousandsSeparator: ' ',
      emptyValue: '—'
    }
  }
];

// Экспорт конфигурации через window для использования в других модулях
try {
  window.tableColumnsConfig = {
    tableColumns
  };
  console.log('✅ tableColumnsConfig module loaded successfully');
} catch (error) {
  console.error('❌ tableColumnsConfig module failed to load:', error);
}

