// =========================
// КОМПОНЕНТ ЗАГОЛОВКА КОЛОНКИ С ЧЕКБОКСОМ
// Универсальный компонент для мультичекбокса "выбрать все"
// =========================
// Компонент обеспечивает:
// - Отображение чекбокса для выбора всех элементов
// - Поддержку неопределенного состояния (indeterminate) - когда выбраны не все элементы
// - Единообразное поведение для мультичекбоксов в таблицах

window.cmpHeaderCellCheck = {
  template: '#header-cell-check-template',
  
  props: {
    // Состояние чекбокса (true = все выбраны, false = ничего не выбрано)
    checked: {
      type: Boolean,
      default: false
    },
    // Неопределенное состояние (indeterminate) - когда выбраны не все элементы
    indeterminate: {
      type: Boolean,
      default: false
    },
    // CSS классы для контейнера
    containerClass: {
      type: String,
      default: ''
    },
    // CSS классы для чекбокса
    checkboxClass: {
      type: String,
      default: 'form-check-input'
    },
    // Отключен ли чекбокс
    disabled: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    // Классы для контейнера
    headerContainerClass() {
      return this.containerClass || '';
    }
  },
  
  methods: {
    // Обработчик изменения состояния чекбокса
    handleChange(event) {
      // Эмитим событие с новым состоянием
      this.$emit('change', event.target.checked, event);
    },
    
    // Обновление состояния indeterminate для нативного чекбокса
    updateIndeterminate() {
      const checkbox = this.$el?.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.indeterminate = this.indeterminate;
      }
    }
  },
  
  watch: {
    // Отслеживаем изменения indeterminate для обновления нативного состояния
    indeterminate() {
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

