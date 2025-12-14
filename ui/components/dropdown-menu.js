// =========================
// КОМПОНЕНТ ВЫПАДАЮЩЕГО МЕНЮ
// Универсальный компонент для выпадающих списков с поддержкой клавиатурной навигации
// =========================
// Компонент обеспечивает:
// - Позиционирование (absolute/fixed)
// - Размеры и скролл
// - Тему (default/inverse)
// - Скругления 4px с правильной обработкой перекрытий
// - Рамку с 1px тенью
// - Клавиатурную навигацию (Escape, стрелки, Tab, Home/End)
// - Автофокус на первый пункт
// - Закрытие при клике вне меню

window.cmpDropdownMenu = {
  template: '#dropdown-menu-template',
  
  // Сохраняем ссылки на методы для правильной привязки контекста
  created() {
    // Привязываем методы к контексту компонента
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  },
  
  props: {
    // Видимость
    show: {
      type: Boolean,
      default: false
    },
    
    // Позиционирование
    position: {
      type: String,
      default: 'absolute',
      validator: (value) => ['absolute', 'fixed'].includes(value)
    },
    placement: {
      type: String,
      default: 'bottom-start',
      validator: (value) => ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'auto'].includes(value)
    },
    // Координаты для fixed позиционирования
    fixedX: {
      type: Number,
      default: null
    },
    fixedY: {
      type: Number,
      default: null
    },
    // Смещения для absolute позиционирования
    offsetX: {
      type: String,
      default: '0'
    },
    offsetY: {
      type: String,
      default: '4px'
    },
    
    // Размеры
    width: {
      type: String,
      default: 'auto'
    },
    minWidth: {
      type: String,
      default: null
    },
    maxHeight: {
      type: String,
      default: null
    },
    
    // Скролл
    scrollable: {
      type: Boolean,
      default: false
    },
    
    // Внешний вид
    theme: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'inverse'].includes(value)
    },
    borderRadius: {
      type: String,
      default: 'small',
      validator: (value) => ['default', 'small'].includes(value)
    },
    
    // Z-index
    zIndex: {
      type: [String, Number],
      default: 'var(--z-index-dropdown)'
    },
    
    // Содержимое
    items: {
      type: Array,
      default: () => []
    },
    
    // Поведение
    closeOnClickOutside: {
      type: Boolean,
      default: true
    },
    closeOnItemClick: {
      type: Boolean,
      default: false
    },
    autoFocus: {
      type: Boolean,
      default: true
    },
    keyboardNavigation: {
      type: Boolean,
      default: true
    },
    
    // Идентификация
    dropdownId: {
      type: String,
      default: null
    },
    instanceId: {
      type: String,
      default: null
    },
    
    // Селектор элемента-триггера для установки cursor: pointer
    triggerSelector: {
      type: String,
      default: null
    }
  },
  
  data() {
    return {
      focusedIndex: -1
    };
  },
  
  computed: {
    // Детерминированный хэш экземпляра
    instanceHash() {
      if (!window.hashGenerator) {
        console.warn('hashGenerator not found, using fallback');
        return 'avto-00000000';
      }
      const uniqueId = this.instanceId || this.dropdownId || 'dropdown-menu';
      return window.hashGenerator.generateMarkupClass(uniqueId);
    },
    
    // Стили для позиционирования
    positionStyles() {
      const styles = {};
      
      if (this.position === 'fixed') {
        if (this.fixedX !== null) styles.left = `${this.fixedX}px`;
        if (this.fixedY !== null) styles.top = `${this.fixedY}px`;
      } else {
        // absolute позиционирование
        if (this.placement === 'bottom-start') {
          styles.top = this.offsetY === '100%' ? '100%' : (this.offsetY.includes('px') ? `calc(100% + ${this.offsetY})` : `calc(100% + ${this.offsetY})`);
          styles.left = this.offsetX;
        } else if (this.placement === 'bottom-end') {
          styles.top = this.offsetY === '100%' ? '100%' : (this.offsetY.includes('px') ? `calc(100% + ${this.offsetY})` : `calc(100% + ${this.offsetY})`);
          styles.right = this.offsetX === '0' ? '0' : this.offsetX;
        } else if (this.placement === 'top-start') {
          styles.bottom = this.offsetY === '100%' ? '100%' : (this.offsetY.includes('px') ? `calc(100% + ${this.offsetY})` : `calc(100% + ${this.offsetY})`);
          styles.left = this.offsetX;
        } else if (this.placement === 'top-end') {
          styles.bottom = this.offsetY === '100%' ? '100%' : (this.offsetY.includes('px') ? `calc(100% + ${this.offsetY})` : `calc(100% + ${this.offsetY})`);
          styles.right = this.offsetX === '0' ? '0' : this.offsetX;
        }
      }
      
      // Размеры
      if (this.width !== 'auto') styles.width = this.width;
      if (this.minWidth) styles.minWidth = this.minWidth;
      if (this.maxHeight) styles.maxHeight = this.maxHeight;
      if (this.scrollable && this.maxHeight) styles.overflowY = 'auto';
      
      // Z-index
      if (typeof this.zIndex === 'number') {
        styles.zIndex = this.zIndex;
      } else {
        styles.zIndex = this.zIndex;
      }
      
      return styles;
    },
    
    // CSS классы для контейнера
    containerClasses() {
      return [
        'dropdown-menu-container',
        `position-${this.position}`,
        `theme-${this.theme}`,
        `border-radius-${this.borderRadius}`,
        this.instanceHash
      ].filter(Boolean).join(' ');
    },
    
    // Атрибут data-bs-theme для инверсной темы
    themeAttribute() {
      if (this.theme === 'inverse') {
        // Определяем инверсную тему на основе текущей темы приложения
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        return currentTheme === 'light' ? 'dark' : 'light';
      }
      return null;
    }
  },
  
  methods: {
    // Установка cursor: pointer для элемента-триггера
    setTriggerCursor() {
      if (this.triggerSelector) {
        const trigger = document.querySelector(this.triggerSelector);
        if (trigger) {
          trigger.style.cursor = 'pointer';
        }
      }
    },
    
    // Закрытие меню
    close() {
      this.$emit('close');
    },
    
    // Обработка клика вне меню
    handleClickOutside(event) {
      if (this.closeOnClickOutside && this.show) {
        // Проверяем, не является ли клик на триггере
        let isTriggerClick = false;
        if (this.triggerSelector) {
          const trigger = document.querySelector(this.triggerSelector);
          if (trigger && (trigger.contains(event.target) || trigger === event.target)) {
            isTriggerClick = true;
          }
        }
        
        // Закрываем меню только если клик не на триггере и не внутри меню
        if (!isTriggerClick && !this.$el.contains(event.target)) {
          this.close();
        }
      }
    },
    
    // Обработка клавиатуры
    handleKeydown(event) {
      // Для Escape обрабатываем всегда, если меню открыто
      if (event.key === 'Escape' && this.show && this.keyboardNavigation) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return;
      }
      
      // Для остальных клавиш проверяем, что меню открыто и навигация включена
      if (!this.keyboardNavigation || !this.show) return;
      
      switch(event.key) {
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          this.focusNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          this.focusPrevious();
          break;
        case 'Home':
          event.preventDefault();
          event.stopPropagation();
          this.focusFirst();
          break;
        case 'End':
          event.preventDefault();
          event.stopPropagation();
          this.focusLast();
          break;
        case 'Tab':
          // Tab работает стандартно, но можно закрывать меню при выходе
          if (!this.$el.contains(document.activeElement)) {
            this.close();
          }
          break;
      }
    },
    
    // Получение фокусируемых пунктов меню
    getFocusableItems() {
      return Array.from(this.$el.querySelectorAll('.menu-item:not(.disabled):not([aria-disabled="true"])'));
    },
    
    // Навигация по пунктам
    focusNext() {
      const items = this.getFocusableItems();
      if (items.length === 0) return;
      
      const currentIndex = items.indexOf(document.activeElement);
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
      this.focusedIndex = nextIndex;
    },
    
    focusPrevious() {
      const items = this.getFocusableItems();
      if (items.length === 0) return;
      
      const currentIndex = items.indexOf(document.activeElement);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
      this.focusedIndex = prevIndex;
    },
    
    focusFirst() {
      const items = this.getFocusableItems();
      if (items.length > 0) {
        items[0].focus();
        this.focusedIndex = 0;
      }
    },
    
    focusLast() {
      const items = this.getFocusableItems();
      if (items.length > 0) {
        items[items.length - 1].focus();
        this.focusedIndex = items.length - 1;
      }
    },
    
    // Автофокус при открытии (с последующим снятием фокуса для избежания визуального выделения)
    autoFocusFirst() {
      if (this.autoFocus && this.show) {
        this.$nextTick(() => {
          const items = this.getFocusableItems();
          if (items.length > 0) {
            items[0].focus();
            this.focusedIndex = 0;
            // Убираем фокус сразу после установки, чтобы избежать визуального выделения первого пункта
            // focusedIndex сохраняется для клавиатурной навигации
            setTimeout(() => {
              items[0].blur();
            }, 0);
          }
        });
      }
    },
    
    // Обработка клика на пункт меню
    handleItemClick(item, event) {
      this.$emit('item-click', item, event);
      if (this.closeOnItemClick) {
        this.close();
      }
    }
  },
  
  mounted() {
    // Устанавливаем cursor: pointer для элемента-триггера
    this.setTriggerCursor();
    
    // Добавляем обработчик клика вне меню (всегда активен)
    if (this.closeOnClickOutside) {
      document.addEventListener('click', this.handleClickOutside, true); // useCapture для приоритета
    }
    
    // Добавляем обработчик клавиатуры только если меню открыто
    if (this.keyboardNavigation && this.show) {
      document.addEventListener('keydown', this.handleKeydown, true); // useCapture для приоритета
    }
    
    // Автофокус при открытии
    if (this.show) {
      this.autoFocusFirst();
    }
  },
  
  beforeUnmount() {
    // Удаляем обработчики
    document.removeEventListener('keydown', this.handleKeydown, true);
    document.removeEventListener('click', this.handleClickOutside, true);
  },
  
  watch: {
    show(newVal) {
      if (newVal && this.autoFocus) {
        this.autoFocusFirst();
      }
      
      // Добавляем/удаляем обработчик клавиатуры при открытии/закрытии меню
      if (this.keyboardNavigation) {
        if (newVal) {
          // Меню открылось - добавляем обработчик
          document.addEventListener('keydown', this.handleKeydown, true);
        } else {
          // Меню закрылось - удаляем обработчик
          document.removeEventListener('keydown', this.handleKeydown, true);
        }
      }
    }
  }
};

