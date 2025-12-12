// =========================
// КОМПОНЕНТ ТАБЛИЦЫ ДАННЫХ
// Переиспользуемый компонент для отображения таблиц с конфигурацией колонок
// =========================
// Компонент обеспечивает:
// - Централизованное управление колонками через конфигурацию
// - Поддержку специальных типов колонок (checkbox, coin, numeric)
// - Автоматическое форматирование через cell-num для числовых колонок
// - Сортировку через sortable-header
// - Управление видимостью колонок через columnVisibilityClasses

window.cmpTableData = {
  template: '#table-data-template',
  
  props: {
    // Конфигурация колонок (массив объектов с id, type, label, field, format и т.д.)
    columns: {
      type: Array,
      required: true
    },
    // Данные для отображения (массив объектов)
    data: {
      type: Array,
      required: true,
      default: () => []
    },
    // Состояние сортировки
    sortBy: {
      type: String,
      default: null
    },
    sortOrder: {
      type: String,
      default: null,
      validator: (value) => value === null || value === 'asc' || value === 'desc'
    },
    // Классы видимости колонок (из columnVisibilityMixin)
    columnVisibilityClasses: {
      type: Object,
      default: () => ({})
    },
    // Специальные обработчики для колонки чекбоксов
    selectedIds: {
      type: Array,
      default: () => []
    },
    onToggleAll: {
      type: Function,
      default: null
    },
    onToggleItem: {
      type: Function,
      default: null
    },
    // Специальные обработчики для колонки монет
    showCoinSortDropdown: {
      type: Boolean,
      default: false
    },
    coinSortType: {
      type: String,
      default: null
    },
    onToggleCoinSortDropdown: {
      type: Function,
      default: null
    },
    onSetCoinSortType: {
      type: Function,
      default: null
    },
    // Методы для получения значений ячеек
    getCellValue: {
      type: Function,
      default: null
    },
    getColumnFormatProps: {
      type: Function,
      default: null
    },
    // Методы для динамических колонок (CD)
    getCDField: {
      type: Function,
      default: null
    },
    // Обработчик сортировки
    onSort: {
      type: Function,
      required: true
    },
    // Дополнительные обработчики для ячеек монет
    onCoinClick: {
      type: Function,
      default: null
    },
    getCoinIcon: {
      type: Function,
      default: null
    }
  },
  
  computed: {
    // Проверка, выбраны ли все элементы
    allSelected() {
      if (!this.selectedIds || this.data.length === 0) return false;
      return this.selectedIds.length === this.data.length;
    }
  },
  
  methods: {
    // Обработчик клика по заголовку сортировки
    handleSort(field) {
      if (this.onSort) {
        this.onSort(field);
      }
    },
    
    // Обработчик переключения всех чекбоксов
    handleToggleAll(checked, event) {
      if (this.onToggleAll) {
        // Компонент header-cell-check эмитит (checked, event)
        // Метод toggleAllCoins ожидает event.target.checked
        if (typeof checked === 'boolean') {
          // Создаем синтетическое событие с правильной структурой
          const syntheticEvent = event || { target: { checked } };
          // Если event не передан, но есть checked - создаем объект события
          if (!event) {
            syntheticEvent.target = { checked };
          } else {
            // Если event передан, но у него нет target.checked - добавляем
            if (!event.target || event.target.checked === undefined) {
              event.target = { ...(event.target || {}), checked };
            }
          }
          this.onToggleAll(syntheticEvent);
        } else if (event) {
          // Старый способ - передаем событие как есть
          this.onToggleAll(event);
        }
      }
    },
    
    // Обработчик переключения чекбокса элемента
    handleToggleItem(itemId, checked) {
      if (this.onToggleItem) {
        this.onToggleItem(itemId, checked);
      }
    },
    
    // Обработчик открытия/закрытия выпадающего меню сортировки монет
    handleToggleCoinSortDropdown(newState) {
      if (this.onToggleCoinSortDropdown) {
        // Если передан новый state - используем его, иначе переключаем
        if (typeof newState === 'boolean') {
          // Устанавливаем состояние напрямую через родительский компонент
          // (если родитель поддерживает прямое управление состоянием)
          this.onToggleCoinSortDropdown(newState);
        } else {
          // Иначе просто переключаем (старый способ)
          this.onToggleCoinSortDropdown();
        }
      }
    },
    
    // Обработчик установки типа сортировки монет
    handleSetCoinSortType(type) {
      if (this.onSetCoinSortType) {
        this.onSetCoinSortType(type);
      }
    },
    
    // Получить значение для ячейки
    getValue(item, column) {
      if (this.getCellValue) {
        return this.getCellValue(item, column);
      }
      // Fallback: используем field
      if (column.field) {
        return item[column.field];
      }
      return null;
    },
    
    // Получить props форматирования для колонки
    getFormatProps(column) {
      if (this.getColumnFormatProps) {
        return this.getColumnFormatProps(column);
      }
      // Fallback: извлекаем из format
      if (column.format) {
        const { component, ...formatProps } = column.format;
        return formatProps;
      }
      return {};
    },
    
    // Проверка, выбран ли элемент
    isSelected(itemId) {
      return this.selectedIds && this.selectedIds.includes(itemId);
    }
  }
};

