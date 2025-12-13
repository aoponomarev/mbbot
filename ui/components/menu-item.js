// =========================
// КОМПОНЕНТ ПУНКТА МЕНЮ
// Универсальный компонент для пунктов меню с иконкой, командой и отметкой/указателем
// =========================
// Компонент обеспечивает:
// - Отображение иконки через систему iconsHelper (icons-mapping.json)
// - Отображение текста команды (label или title из mapping)
// - Универсальный индикатор (статусы или язычки переходов)
// - Единообразное поведение для всех пунктов меню

window.cmpMenuItem = {
  template: '#menu-item-template',
  
  props: {
    // Иконка через систему iconsHelper
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
    
    // Команда (текст) - если не указан, берется из icons-mapping.json (title)
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
    } // Всплывающая подсказка (если не указан, берется из icons-mapping.json)
  },
  
  data() {
    return {
      iconClass: '', // Загруженный CSS класс иконки
      iconTitle: '', // Title из icons-mapping.json
      iconDescription: '', // Description из icons-mapping.json
      indicatorIcon: '', // Иконка indicator из iconsHelper
      indicatorLabel: '', // Label indicator из iconsHelper
      indicatorTitle: '', // Title indicator из iconsHelper
      indicatorDescription: '' // Description indicator из iconsHelper
    };
  },
  
  computed: {
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
    
    // Текст команды - приоритет: label > indicatorLabel > iconTitle из mapping
    displayLabel() {
      return this.label || this.indicatorLabel || this.iconTitle || '';
    },
    
    // Tooltip - приоритет: tooltip > indicatorTitle > iconTitle > displayLabel
    displayTooltip() {
      return this.tooltip || this.indicatorTitle || this.iconTitle || this.displayLabel;
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
      // Иначе используем стандартную иконку из iconsHelper
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
    
    // Иконка для отметки/указателя (справа) - загружается из iconsHelper
    effectiveIndicatorIcon() {
      return this.indicatorIcon || null;
    }
  },
  
  methods: {
    // Загрузка иконки через систему iconsHelper
    loadIcon() {
      if (!window.iconsHelper) {
        return;
      }
      
      try {
        // Загружаем основную иконку (слева) через iconsHelper, если указан iconCommand
        if (this.iconCommand) {
          let iconClass = '';
          let title = '';
          let description = '';
          
          switch (this.iconCategory) {
            case 'actions':
              iconClass = window.iconsHelper.getActionIcon(this.iconCommand);
              title = window.iconsHelper.getIconTitle('actions', this.iconCommand);
              description = window.iconsHelper.getIconDescription('actions', this.iconCommand);
              break;
            case 'navigation':
              iconClass = window.iconsHelper.getNavigationIcon(this.iconCommand);
              title = window.iconsHelper.getIconTitle('navigation', this.iconCommand);
              description = window.iconsHelper.getIconDescription('navigation', this.iconCommand);
              break;
            case 'status':
              iconClass = window.iconsHelper.getStatusIcon(this.iconCommand);
              title = window.iconsHelper.getIconTitle('status', this.iconCommand);
              description = window.iconsHelper.getIconDescription('status', this.iconCommand);
              break;
            case 'metrics':
              iconClass = window.iconsHelper.getMetricIcon(this.iconCommand);
              title = window.iconsHelper.getIconTitle('metrics', this.iconCommand);
              description = window.iconsHelper.getIconDescription('metrics', this.iconCommand);
              break;
            case 'frameworks':
              iconClass = window.iconsHelper.getFrameworkIcon(this.iconCommand);
              title = window.iconsHelper.getIconTitle('frameworks', this.iconCommand);
              description = window.iconsHelper.getIconDescription('frameworks', this.iconCommand);
              break;
            case 'other':
              iconClass = window.iconsHelper.getOtherIcon(this.iconCommand);
              title = window.iconsHelper.getIconTitle('other', this.iconCommand);
              description = window.iconsHelper.getIconDescription('other', this.iconCommand);
              break;
          }
          
          this.iconClass = iconClass || '';
          this.iconTitle = title || '';
          this.iconDescription = description || '';
        }
        
        // Загружаем данные indicator через iconsHelper
        if (this.indicator && this.indicator.type && this.indicator.value) {
          this.indicatorIcon = window.iconsHelper.getIndicatorIcon(this.indicator.type, this.indicator.value);
          this.indicatorLabel = window.iconsHelper.getIndicatorLabel(this.indicator.type, this.indicator.value);
          this.indicatorTitle = window.iconsHelper.getIndicatorTitle(this.indicator.type, this.indicator.value);
          this.indicatorDescription = window.iconsHelper.getIndicatorDescription(this.indicator.type, this.indicator.value);
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
    // Если iconsHelper еще не загружен, ждем немного и пробуем снова
    if (!window.iconsHelper) {
      console.warn('[menu-item] iconsHelper не доступен, повторная попытка через 100ms');
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

