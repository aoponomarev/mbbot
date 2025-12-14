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
      // Проверяем, что все элементы из data выбраны (учитываем только валидные ID)
      const validSelectedIds = this.selectedIds.filter(id => 
        this.data.some(item => item.id === id)
      );
      return validSelectedIds.length === this.data.length && this.data.length > 0;
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
      // Защита от неправильных аргументов: если первый параметр - объект события, а не boolean
      if (typeof checked !== 'boolean' && checked && typeof checked === 'object' && !event) {
        // Это означает, что Vue передал только один аргумент (объект события)
        // Нормализуем: checked становится event, а event становится undefined
        event = checked;
        checked = event?.target?.checked ?? false;
      }
      
      if (this.onToggleAll) {
        // Компонент header-cell-check эмитит (checked, event)
        // Метод toggleAllCoins ожидает event.target.checked
        // Нормализуем событие для совместимости, всегда используя значение checked из параметра
        const normalizedEvent = event || {};
        if (!normalizedEvent.target) {
          normalizedEvent.target = {};
        }
        // Всегда устанавливаем checked из параметра (это актуальное значение после клика)
        normalizedEvent.target.checked = checked;
        this.onToggleAll(normalizedEvent);
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
    getFormatProps(column, item) {
      if (this.getColumnFormatProps) {
        return this.getColumnFormatProps(column, item);
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

