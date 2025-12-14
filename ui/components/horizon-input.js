// =========================
// КОМПОНЕНТ: Поле ввода горизонта прогноза (ГП)
// Переиспользуемый компонент для ввода и управления горизонтом прогноза
// =========================
// Компонент обеспечивает:
// - Ввод горизонта прогноза в днях (1-90)
// - Валидацию и ограничение значений
// - Двустороннее связывание через v-model
// - Использование в глобальном хедере и модальных окнах

window.cmpHorizonInput = {
  template: '#horizon-input-template',
  
  props: {
    // Значение горизонта прогноза (v-model)
    modelValue: {
      type: Number,
      default: 2,
      validator: (value) => value >= 1 && value <= 90
    },
    // Размер поля (Bootstrap размеры)
    size: {
      type: String,
      default: 'sm',
      validator: (value) => ['sm', '', 'lg'].includes(value)
    },
    // Показывать ли label "ГП:"
    showLabel: {
      type: Boolean,
      default: true
    },
    // Дополнительные CSS классы
    customClass: {
      type: String,
      default: ''
    }
  },
  
  emits: ['update:modelValue'],
  
  computed: {
    // Размер для Bootstrap класса
    sizeClass() {
      return this.size ? `form-control-${this.size}` : '';
    },
    
    // Внутреннее значение для input
    internalValue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        // Валидация и ограничение значения
        const numValue = parseInt(value) || 2;
        const clampedValue = Math.max(1, Math.min(90, numValue));
        this.$emit('update:modelValue', clampedValue);
      }
    }
  },
  
  methods: {
    // Обработка изменения значения
    handleInput(event) {
      const value = parseInt(event.target.value) || 2;
      const clampedValue = Math.max(1, Math.min(90, value));
      this.$emit('update:modelValue', clampedValue);
    },
    
    // Обработка потери фокуса (если значение некорректное - исправляем)
    handleBlur(event) {
      const value = parseInt(event.target.value) || 2;
      const clampedValue = Math.max(1, Math.min(90, value));
      if (value !== clampedValue) {
        event.target.value = clampedValue;
        this.$emit('update:modelValue', clampedValue);
      }
    }
  }
};

