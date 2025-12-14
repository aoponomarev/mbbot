// =========================
// КОМПОНЕНТ КНОПКИ
// Универсальный компонент кнопки с иконкой, текстом и индикатором
// Основан на uiElementHelper для получения конфигурации (иконки, labels, tooltips)
// =========================
// Компонент обеспечивает:
// - Полную UI-совместимость с Bootstrap (variants, sizes)
// - Отображение иконки через систему uiElementHelper (ui-element-mapping.json)
// - Раздельные tooltips для основной части и индикатора
// - Перенос паддингов Bootstrap на дочерние элементы для корректной работы tooltips

window.cmpButton = {
  template: '#button-template',
  
  props: {
    // Иконка через систему uiElementHelper
    iconCategory: {
      type: String,
      default: 'actions',
      validator: (value) => ['actions', 'navigation', 'status', 'metrics', 'frameworks', 'other'].includes(value)
    },
    iconCommand: {
      type: String,
      default: null
    },
    
    // URL изображения для иконки (альтернатива iconCommand)
    iconImage: {
      type: String,
      default: null
    },
    
    // Текст кнопки - если не указан, берется из ui-element-mapping.json (label)
    label: {
      type: String,
      default: null
    },
    
    // Отметка/указатель (универсальный объект)
    indicator: {
      type: Object,
      default: null,
      validator: (value) => {
        if (!value) return true;
        const validTypes = ['status', 'navigation'];
        if (!validTypes.includes(value.type)) return false;
        
        if (value.type === 'status') {
          const validStatuses = ['selected', 'disabled', 'loading', 'warning', 'error', 'favorite', 'not-favorite'];
          return validStatuses.includes(value.value);
        }
        
        if (value.type === 'navigation') {
          const validNavs = ['submenu', 'external', 'modal'];
          return validNavs.includes(value.value);
        }
        
        return false;
      }
    },
    
    // Bootstrap варианты и размеры
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 'outline-warning', 'outline-info', 'outline-light', 'outline-dark', 'link'].includes(value)
    },
    size: {
      type: String,
      default: null,
      validator: (value) => !value || ['sm', 'lg'].includes(value)
    },
    
    // Дополнительные опции
    disabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'button',
      validator: (value) => ['button', 'submit', 'reset'].includes(value)
    },
    buttonId: {
      type: String,
      default: null
    },
    tooltip: {
      type: String,
      default: null
    }, // Всплывающая подсказка для основной части (если не указан, берется из ui-element-mapping.json)
    customClass: {
      type: String,
      default: null
    }, // Дополнительный CSS класс для кнопки
    loading: {
      type: Boolean,
      default: false
    }, // Показывать ли спиннер загрузки вместо иконки/текста
    loadingText: {
      type: String,
      default: null
    } // Текст для отображения вместо спиннера при loading (если указан, спиннер не показывается)
  },
  
  data() {
    return {
      iconClass: '', // Загруженный CSS класс иконки
      iconLabel: '', // Label из ui-element-mapping.json
      iconTooltip: '', // Tooltip из ui-element-mapping.json
      indicatorIcon: '', // Иконка indicator из uiElementHelper
      indicatorLabel: '', // Label indicator из uiElementHelper
      indicatorTooltip: '' // Tooltip indicator из uiElementHelper
    };
  },
  
  computed: {
    // Проверка доступности uiElementHelper
    uiElementHelper() {
      return typeof window !== 'undefined' ? window.uiElementHelper : null;
    },
    
    // Проверка, является ли иконка SVG
    isSVGIcon() {
      if (!this.effectiveIconClass || !this.uiElementHelper) return false;
      return this.uiElementHelper.isSVGIcon(this.effectiveIconClass);
    },
    
    // Путь к SVG иконке
    svgIconPath() {
      if (!this.effectiveIconClass || !this.uiElementHelper) return '';
      return this.uiElementHelper.getSVGIconPath(this.effectiveIconClass);
    },
    
    // Детерминированный хэш экземпляра
    instanceHash() {
      if (!window.hashGenerator) {
        console.warn('hashGenerator not found, using fallback');
        return 'avto-00000000';
      }
      const uniqueId = this.buttonId || this.iconCommand || this.label || 'button';
      return window.hashGenerator.generateMarkupClass(uniqueId);
    },
    
    // CSS классы для кнопки
    buttonClasses() {
      const classes = [
        'btn',
        `btn-${this.variant}`,
        this.size ? `btn-${this.size}` : '',
        'cmp-button', // Глобальный класс для применения правил стилизации
        this.customClass, // Дополнительный класс
        this.instanceHash
      ].filter(Boolean);
      return classes.join(' ');
    },
    
    // Текст кнопки - приоритет: label > indicatorLabel > iconLabel из mapping
    displayLabel() {
      return this.label || this.indicatorLabel || this.iconLabel || '';
    },
    
    // Tooltip для основной части (иконка + текст) - приоритет: tooltip > iconTooltip > iconLabel > displayLabel
    mainTooltip() {
      if (this.tooltip === '') return null;
      return this.tooltip || this.iconTooltip || this.iconLabel || this.displayLabel;
    },
    
    // Tooltip для индикатора - приоритет: indicatorTooltip > indicatorLabel
    indicatorTooltipText() {
      return this.indicatorTooltip || this.indicatorLabel || null;
    },
    
    // Эффективная иконка слева
    effectiveIconClass() {
      if (this.iconImage) {
        return null;
      }
      return this.iconClass;
    },
    
    // Есть ли изображение для иконки
    hasIconImage() {
      return !!this.iconImage;
    },
    
    // Иконка для отметки/указателя (справа)
    effectiveIndicatorIcon() {
      return this.indicatorIcon || null;
    },
    
    // Класс для icon-only кнопок
    isIconOnly() {
      return !this.displayLabel && (this.effectiveIconClass || this.hasIconImage);
    }
  },
  
  methods: {
    // Загрузка иконки через систему uiElementHelper
    loadIcon() {
      if (!window.uiElementHelper) {
        return;
      }
      
      try {
        // Загружаем основную иконку (слева) через uiElementHelper, если указан iconCommand
        if (this.iconCommand) {
          const iconClass = window.uiElementHelper.getIconForCommand(this.iconCategory, this.iconCommand);
          const commandData = window.uiElementHelper.getCommandData(this.iconCommand);
          
          this.iconClass = iconClass || '';
          this.iconLabel = commandData?.label || '';
          this.iconTooltip = commandData?.tooltip || '';
        } else {
          // Очищаем данные иконки, если iconCommand отсутствует
          this.iconClass = '';
          this.iconLabel = '';
          this.iconTooltip = '';
        }
        
        // Загружаем данные indicator через uiElementHelper
        if (this.indicator && this.indicator.type && this.indicator.value) {
          this.indicatorIcon = window.uiElementHelper.getIndicatorIcon(this.indicator.type, this.indicator.value);
          this.indicatorLabel = window.uiElementHelper.getIndicatorLabel(this.indicator.type, this.indicator.value);
          this.indicatorTooltip = window.uiElementHelper.getIndicatorTooltip(this.indicator.type, this.indicator.value);
        } else {
          // Очищаем данные индикатора, если indicator отсутствует
          this.indicatorIcon = '';
          this.indicatorLabel = '';
          this.indicatorTooltip = '';
        }
      } catch (error) {
        console.error('Error loading icon:', error);
      }
    },
    
    // Обработчик клика по кнопке
    handleClick(event) {
      if (this.disabled) {
        event.preventDefault();
        return;
      }
      
      // Останавливаем всплытие нативного события, чтобы предотвратить двойную обработку
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      
      // Эмитим событие с данными, передавая оригинальное событие как первый аргумент
      // Это позволяет использовать модификаторы событий Vue (@click.stop, @click.prevent и т.д.)
      this.$emit('click', event, {
        buttonId: this.buttonId,
        iconCommand: this.iconCommand,
        label: this.displayLabel
      });
    }
  },
  
  // Загружаем иконку при монтировании компонента
  mounted() {
    // Если uiElementHelper еще не загружен, ждем немного и пробуем снова
    if (!window.uiElementHelper) {
      console.warn('[button] uiElementHelper не доступен, повторная попытка через 100ms');
      setTimeout(() => {
        this.loadIcon();
      }, 100);
    } else {
      this.loadIcon();
    }
  },
  
  // Отслеживаем изменения indicator и iconCommand для перезагрузки данных
  watch: {
    indicator: {
      handler() {
        this.loadIcon();
      },
      deep: true
    },
    iconCommand: {
      handler() {
        this.loadIcon();
      }
    }
  }
};

