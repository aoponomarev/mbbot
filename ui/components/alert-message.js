// =========================
// КОМПОНЕНТ ALERT-СООБЩЕНИЯ
// Обертка над Bootstrap alert с использованием кастомной кнопки закрытия
// =========================

window.cmpAlertMessage = {
  template: '#alert-message-template',
  
  props: {
    // Тип сообщения: info, success, warning, danger
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'success', 'warning', 'danger'].includes(value)
    },
    // Можно ли закрыть сообщение
    dismissible: {
      type: Boolean,
      default: false
    },
    // Компактный размер (small)
    small: {
      type: Boolean,
      default: false
    },
    // Показывать ли сообщение
    show: {
      type: Boolean,
      default: true
    },
    // Дополнительные CSS классы
    customClass: {
      type: String,
      default: null
    }
  },
  
  emits: ['close'],
  
  data() {
    return {
      // Внутреннее состояние видимости (управляется компонентом при dismissible=true)
      showAlert: this.show
    };
  },
  
  watch: {
    // Синхронизируем внутреннее состояние с prop show
    show(newValue) {
      this.showAlert = newValue;
    }
  },
  
  methods: {
    handleClose() {
      // Если dismissible=true, компонент сам управляет своей видимостью
      if (this.dismissible) {
        this.showAlert = false;
      }
      // Эмитим событие для родителя (если нужно обработать закрытие на уровне родителя)
      this.$emit('close');
    }
  },
  
  mounted() {
    // Компонент смонтирован
  },
  
  computed: {
    // Используем внутреннее состояние для управления видимостью
    isVisible() {
      return this.showAlert;
    },
    
    // CSS классы для alert
    alertClasses() {
      const classes = {
        'alert': true,
        'alert-dismissible': this.dismissible,
        'fade': this.dismissible,
        'show': this.dismissible,
        'mb-0': this.small
      };
      
      // Добавляем класс типа сообщения
      if (this.type === 'info') {
        classes['alert-info'] = true;
      } else if (this.type === 'success') {
        classes['alert-success'] = true;
      } else if (this.type === 'warning') {
        classes['alert-warning'] = true;
      } else if (this.type === 'danger') {
        classes['alert-danger'] = true;
      }
      
      // Добавляем кастомный класс, если указан
      if (this.customClass) {
        classes[this.customClass] = true;
      }
      
      return classes;
    }
  }
};

