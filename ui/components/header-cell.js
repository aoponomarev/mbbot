// =========================
// КОМПОНЕНТ ЗАГОЛОВКА КОЛОНКИ ТАБЛИЦЫ
// Универсальный компонент для заголовков с выпадающим меню и опциональной сортировкой
// =========================
// Компонент обеспечивает:
// - Отображение текста заголовка
// - Выпадающее меню с набором команд (опционально)
// - Индикацию направления сортировки (опционально)
// - Единообразное поведение для всех типов заголовков

window.cmpHeaderCell = {
  template: '#header-cell-template',
  
  props: {
    // Текст заголовка
    label: {
      type: String,
      required: true
    },
    // Массив команд для выпадающего меню (опционально)
    // Формат: [{ id: 'value1', label: 'Текст команды', active: false }, ...]
    menuItems: {
      type: Array,
      default: () => []
    },
    // ID активного пункта меню (для выделения)
    activeMenuItemId: {
      type: String,
      default: null
    },
    // Показывать ли выпадающее меню
    showDropdown: {
      type: Boolean,
      default: false
    },
    // Поддержка сортировки (опционально)
    sortable: {
      type: Boolean,
      default: false
    },
    // Поле для сортировки (если sortable = true)
    sortField: {
      type: String,
      default: null
    },
    // Текущее поле сортировки (из родительского компонента)
    sortBy: {
      type: String,
      default: null
    },
    // Текущий порядок сортировки (из родительского компонента)
    sortOrder: {
      type: String,
      default: null,
      validator: (value) => value === null || value === 'asc' || value === 'desc'
    },
    // Показывать ли индикацию сортировки (если sortable = true)
    showSortIndicator: {
      type: Boolean,
      default: true
    },
    // CSS классы для контейнера
    containerClass: {
      type: String,
      default: ''
    },
    // Минимальная ширина выпадающего меню
    dropdownMinWidth: {
      type: String,
      default: '200px'
    },
    // Позиция выпадающего меню ('left', 'right')
    dropdownPosition: {
      type: String,
      default: 'left',
      validator: (value) => ['left', 'right'].includes(value)
    }
  },
  
  computed: {
    // Определяет, активна ли сортировка для этого поля
    isSortActive() {
      return this.sortable && this.sortBy === this.sortField && this.sortOrder !== null;
    },
    
    // Иконка сортировки
    sortIcon() {
      if (!this.isSortActive) return null;
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    },
    
    // Классы для контейнера заголовка
    headerContainerClass() {
      const base = 'position-relative';
      const clickable = (this.menuItems.length > 0 || this.sortable) ? 'cursor-pointer' : '';
      return `${base} ${clickable} ${this.containerClass}`.trim();
    },
    
    // Стили для выпадающего меню
    dropdownStyle() {
      return {
        top: '100%',
        left: this.dropdownPosition === 'left' ? '0' : 'auto',
        right: this.dropdownPosition === 'right' ? '0' : 'auto',
        marginTop: '4px',
        minWidth: this.dropdownMinWidth,
        zIndex: 'var(--z-index-dropdown)'
      };
    }
  },
  
  methods: {
    // Обработчик клика по заголовку
    handleHeaderClick(event) {
      // Если есть меню - переключаем его
      if (this.menuItems.length > 0) {
        this.$emit('menu-toggle', !this.showDropdown);
        return;
      }
      // Если сортировка включена - эмитим событие сортировки
      if (this.sortable && this.sortField) {
        this.$emit('sort', this.sortField);
      }
    },
    
    // Обработчик клика по пункту меню
    handleMenuItemClick(itemId) {
      this.$emit('menu-item-click', itemId);
    },
    
    // Обработчик клика по индикатору сортировки
    handleSortClick(event) {
      event.stopPropagation();
      if (this.sortable && this.sortField) {
        this.$emit('sort', this.sortField);
      }
    },
    
    // Проверка, активен ли пункт меню
    isMenuItemActive(item) {
      if (item.active !== undefined) {
        return item.active;
      }
      return this.activeMenuItemId === item.id;
    }
  }
};

