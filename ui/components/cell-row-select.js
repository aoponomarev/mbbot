// =========================
// КОМПОНЕНТ ЯЧЕЙКИ ВЫБОРА СТРОКИ ТАБЛИЦЫ
// Универсальный компонент для выбора строк с расширенной функциональностью
// =========================
// Компонент обеспечивает:
// - Чекбокс с поддержкой indeterminate
// - Статусы строки (badges)
// - Номер строки
// - Индикатор группы
// - Разные типы строк (header, summary, warning, error)
// - Разные режимы выбора (single, multiple, group)

window.cmpCellRowSelect = {
  template: '#cell-row-select-template',
  
  props: {
    // Статус чекбокса: 'true' | 'false' | 'indeterminate'
    checked: {
      type: String,
      default: 'false',
      validator: (value) => ['true', 'false', 'indeterminate'].includes(value)
    },
    // Чекбокс заблокирован
    disabled: {
      type: Boolean,
      default: false
    },
    // Тип строки: обычная/заголовок/итог/предупреждение/ошибка
    rowStatus: {
      type: String,
      default: 'normal',
      validator: (value) => ['normal', 'header', 'summary', 'warning', 'error'].includes(value)
    },
    // Режим выбора
    selectionMode: {
      type: String,
      default: 'multiple',
      validator: (value) => ['single', 'multiple', 'group'].includes(value)
    },
    // Номер строки
    rowNumber: {
      type: Number,
      default: null
    },
    // ID группы
    groupId: {
      type: String,
      default: ''
    },
    // ID строки (для обработчиков) - ОБЯЗАТЕЛЬНЫЙ
    rowId: {
      type: String,
      required: true
    },
    // Дополнительные статусы (badges)
    badges: {
      type: Array,
      default: () => []
      // Формат: [{type: 'locked', label: 'Заблокировано'}, {type: 'vip', label: 'VIP'}, ...]
    },
    // Показывать номер строки
    showRowNumber: {
      type: Boolean,
      default: true
    },
    // Показывать групповые действия
    bulkActions: {
      type: Boolean,
      default: false
    },
    // CSS классы для частей ячейки
    cssClasses: {
      type: Object,
      default: () => ({
        cell: '',
        checkbox: 'form-check-input',
        status: '',
        group: '',
        number: ''
      })
    }
  },
  
  computed: {
    // Детерминированный хэш экземпляра на основе rowId
    // Стабилен между сессиями - один и тот же rowId всегда дает один и тот же хэш
    instanceHash() {
      if (!window.hashGenerator) {
        console.warn('hashGenerator not found, using fallback');
        return 'avto-00000000';
      }
      return window.hashGenerator.generateMarkupClass(this.rowId);
    },
    
    // Преобразование checked в boolean для нативного чекбокса
    isChecked() {
      return this.checked === 'true';
    },
    
    // Определение, нужно ли показывать indeterminate
    isIndeterminate() {
      return this.checked === 'indeterminate';
    },
    
    // Классы для контейнера ячейки
    cellContainerClass() {
      const base = 'd-flex align-items-center gap-2';
      const status = this.rowStatus !== 'normal' ? `row-status-${this.rowStatus}` : '';
      return `${base} ${status} ${this.cssClasses.cell || ''}`.trim();
    },
    
    // Классы для номера строки
    rowNumberClass() {
      return `row-number ${this.cssClasses.number || ''}`.trim();
    },
    
    // Классы для индикатора группы
    groupIndicatorClass() {
      return `group-indicator ${this.cssClasses.group || ''}`.trim();
    },
    
    // Классы для статусов
    statusBadgeClass() {
      return `status-badge ${this.cssClasses.status || ''}`.trim();
    }
  },
  
  methods: {
    // Обработчик изменения чекбокса
    // Эмитим в формате, совместимом с toggleCoinSelection: (rowId, isChecked, event)
    handleChange(event) {
      const isChecked = event.target.checked;
      // Эмитим событие в формате: (rowId, boolean, event)
      // Это совместимо с текущим handleToggleItem в table-data.js
      this.$emit('change', this.rowId, isChecked, event);
    },
    
    // Обновление состояния indeterminate для нативного чекбокса
    updateIndeterminate() {
      const checkbox = this.$el?.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.indeterminate = this.isIndeterminate;
      }
    },
    
    // Получение класса для badge по типу
    getBadgeClass(badgeType) {
      const badgeClassMap = {
        'locked': 'badge bg-secondary',
        'vip': 'badge bg-warning',
        'new': 'badge bg-success',
        'warning': 'badge bg-warning text-dark',
        'error': 'badge bg-danger'
      };
      return badgeClassMap[badgeType] || 'badge bg-secondary';
    }
  },
  
  watch: {
    // Отслеживаем изменения indeterminate
    isIndeterminate() {
      this.$nextTick(() => {
        this.updateIndeterminate();
      });
    }
  },
  
  mounted() {
    // Устанавливаем начальное состояние indeterminate
    this.$nextTick(() => {
      this.updateIndeterminate();
    });
  },
  
  updated() {
    // Обновляем indeterminate при обновлении компонента
    this.$nextTick(() => {
      this.updateIndeterminate();
    });
  }
};

