// =========================
// КОМПОНЕНТ ПУНКТА МЕНЮ
// Универсальный компонент для пунктов меню с иконкой, командой и отметкой/указателем
// =========================
// Компонент обеспечивает:
// - Отображение иконки через систему uiElementHelper (ui-element-mapping.json)
// - Отображение текста команды (label из mapping)
// - Универсальный индикатор (статусы или язычки переходов)
// - Раздельные tooltips для основной части и индикатора
// - Единообразное поведение для всех пунктов меню

window.cmpMenuItem = {
  template: '#menu-item-template',
  
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
    }, // 'refresh', 'settings', 'sort', 'check', etc.
    
    // URL изображения для иконки (альтернатива iconCommand/iconStateMap)
    iconImage: {
      type: String,
      default: null
    },
    
    // Команда (текст) - если не указан, берется из ui-element-mapping.json (label)
    label: {
      type: String,
      default: null
    },
    
    // Подзаголовок (вторая строка текста, например, полное название монеты)
    subtitle: {
      type: String,
      default: null
    },
    
    // Отметка/указатель (универсальный объект)
    // type: 'status' (статусы) или 'navigation' (переходы)
    // value: для status - 'selected', 'disabled', 'loading', 'warning', 'error', 'favorite', 'not-favorite'
    //        для navigation - 'submenu', 'external', 'modal'
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
    
    // Маппинг состояний на иконки слева (для динамических иконок)
    // Формат: { 'selected': 'fas fa-star text-warning', 'default': 'fas fa-star text-muted' }
    // Если указан, левая иконка будет меняться в зависимости от iconState или indicator.value
    iconStateMap: {
      type: Object,
      default: null
    },
    
    // Текущее состояние для iconStateMap (альтернатива indicator для динамических иконок)
    // Если указан, используется вместо indicator.value для выбора иконки из iconStateMap
    iconState: {
      type: [String, Boolean],
      default: null
    },
    
    // Дополнительные опции
    disabled: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    },
    itemId: {
      type: String,
      default: null
    }, // Для instanceHash
    href: {
      type: String,
      default: null
    }, // Для внешних ссылок
    tooltip: {
      type: String,
      default: null
    } // Всплывающая подсказка для основной части (если не указан, берется из ui-element-mapping.json)
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
    
    // Детерминированный хэш экземпляра на основе itemId, iconCommand или label
    // Стабилен между сессиями - один и тот же идентификатор всегда дает один и тот же хэш
    instanceHash() {
      if (!window.hashGenerator) {
        console.warn('hashGenerator not found, using fallback');
        return 'avto-00000000';
      }
      const uniqueId = this.itemId || this.iconCommand || this.label || 'menu-item';
      return window.hashGenerator.generateMarkupClass(uniqueId);
    },
    
    // CSS классы для контейнера пункта меню
    itemClasses() {
      return [
        'list-group-item',
        'list-group-item-action',
        'menu-item', // Глобальный класс для применения правил стилизации
        this.active ? 'active' : '',
        this.disabled ? 'disabled' : '',
        this.instanceHash
      ].filter(Boolean).join(' ');
    },
    
    // Текст команды - приоритет: label > indicatorLabel > iconLabel из mapping
    displayLabel() {
      return this.label || this.indicatorLabel || this.iconLabel || '';
    },
    
    // Tooltip для основной части (иконка + текст) - приоритет: tooltip > iconTooltip > iconLabel > displayLabel
    // Если tooltip === '', возвращаем null (убираем tooltip)
    mainTooltip() {
      if (this.tooltip === '') return null;
      return this.tooltip || this.iconTooltip || this.iconLabel || this.displayLabel;
    },
    
    // Tooltip для индикатора - приоритет: indicatorTooltip > indicatorLabel
    indicatorTooltipText() {
      return this.indicatorTooltip || this.indicatorLabel || null;
    },
    
    // Эффективная иконка слева - приоритет: iconImage > iconStateMap (динамическая) > iconClass (из iconsHelper)
    effectiveIconClass() {
      // Если есть изображение, не используем класс иконки
      if (this.iconImage) {
        return null;
      }
      // Если есть iconStateMap, используем динамическую иконку
      if (this.iconStateMap) {
        // Приоритет: iconState > indicator.value
        const state = this.iconState !== null ? this.iconState : (this.indicator && this.indicator.value ? this.indicator.value : null);
        if (state !== null) {
          return this.iconStateMap[state] || this.iconStateMap['default'] || this.iconClass;
        }
      }
      // Иначе используем стандартную иконку из uiElementHelper
      return this.iconClass;
    },
    
    // Есть ли изображение для иконки
    hasIconImage() {
      return !!this.iconImage;
    },
    
    // CSS классы для отметки/указателя
    indicatorClasses() {
      if (!this.indicator) return '';
      const base = 'menu-item-indicator';
      const type = `indicator-${this.indicator.type}`;
      const value = `indicator-${this.indicator.value}`;
      return `${base} ${type} ${value}`;
    },
    
    // Иконка для отметки/указателя (справа) - загружается из uiElementHelper
    effectiveIndicatorIcon() {
      return this.indicatorIcon || null;
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
        }
        
        // Загружаем данные indicator через uiElementHelper
        if (this.indicator && this.indicator.type && this.indicator.value) {
          this.indicatorIcon = window.uiElementHelper.getIndicatorIcon(this.indicator.type, this.indicator.value);
          this.indicatorLabel = window.uiElementHelper.getIndicatorLabel(this.indicator.type, this.indicator.value);
          this.indicatorTooltip = window.uiElementHelper.getIndicatorTooltip(this.indicator.type, this.indicator.value);
        }
      } catch (error) {
        console.error('Error loading icon:', error);
      }
    },
    
    // Обработчик клика по пункту меню
    handleClick(event) {
      if (this.disabled) {
        event.preventDefault();
        return;
      }
      
      this.$emit('click', {
        itemId: this.itemId,
        iconCommand: this.iconCommand,
        label: this.displayLabel
      });
    }
  },
  
  // Загружаем иконку при монтировании компонента
  mounted() {
    // Если uiElementHelper еще не загружен, ждем немного и пробуем снова
    if (!window.uiElementHelper) {
      console.warn('[menu-item] uiElementHelper не доступен, повторная попытка через 100ms');
      setTimeout(() => {
        this.loadIcon();
      }, 100);
    } else {
      this.loadIcon();
    }
  },
  
  // Отслеживаем изменения indicator для перезагрузки данных
  watch: {
    indicator: {
      handler() {
        this.loadIcon();
      },
      deep: true
    }
  }
};

