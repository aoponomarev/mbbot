// =========================
// КОМПОНЕНТ СОРТИРУЕМОГО ЗАГОЛОВКА ТАБЛИЦЫ
// Переиспользуемый компонент для заголовков колонок с сортировкой
// =========================
// Компонент отображает заголовок колонки с возможностью сортировки.
// Показывает иконку сортировки в зависимости от текущего состояния (null, asc, desc).
// Эмитит событие при клике для обработки сортировки родительским компонентом.

window.cmpSortableHeader = {
  template: '#sortable-header-template',
  
  props: {
    // Поле для сортировки (передается в handleSort)
    field: {
      type: String,
      required: true
    },
    // Текст заголовка
    label: {
      type: String,
      required: true
    },
    // Текущее поле сортировки (из родительского компонента)
    sortBy: {
      type: String,
      default: null
    },
    // Текущий порядок сортировки (null | 'asc' | 'desc')
    sortOrder: {
      type: String,
      default: null,
      validator: (value) => value === null || value === 'asc' || value === 'desc'
    }
  },
  
  computed: {
    // Определяет, активна ли сортировка для этого поля
    isActive() {
      return this.sortBy === this.field && this.sortOrder !== null;
    },
    
    // Иконка сортировки в зависимости от состояния
    sortIcon() {
      if (!this.isActive) {
        return 'fas fa-sort'; // Нейтральная иконка
      }
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
  },
  
  methods: {
    // Обработчик клика - эмитит событие для родительского компонента
    handleClick() {
      this.$emit('sort', this.field);
    }
  }
};

