// =========================
// MIXIN ДЛЯ УПРАВЛЕНИЯ ВИДИМОСТЬЮ КОЛОНОК ТАБЛИЦЫ ЧЕРЕЗ ВКЛАДКИ
// Переиспользуемая фича для переключения видимости колонок в зависимости от активной вкладки
// =========================
// Использование:
// 1. Подключить mixin к компоненту: mixins: [window.columnVisibilityMixin]
// 2. Определить конфигурацию колонок в data(): columnVisibilityConfig
// 3. Добавить <colgroup> с <col> тегами в таблицу
// 4. Добавить классы к <th> и <td> элементам
// 
// Пример конфигурации:
// columnVisibilityConfig: {
//   'percent': { hide: ['col-cd'] },           // На вкладке "%" скрыть колонки CD
//   'complex-deltas': { hide: ['col-percent'] } // На вкладке "Компл. дельты" скрыть колонки процентов
// }

window.columnVisibilityMixin = {
  computed: {
    // Активная вкладка (получаем из корневого компонента)
    activeTab() {
      const root = this.$root || window.appRoot;
      return root && root.activeTab ? root.activeTab : null;
    },
    
    // CSS-классы для управления видимостью колонок через colgroup
    // Возвращает объект, где ключ - класс колонки, значение - 'col-hidden' или ''
    // Поддерживает префиксное совпадение: 'col-percent' скрывает все 'col-percent-*'
    columnVisibilityClasses() {
      if (!this.columnVisibilityConfig || !this.activeTab) {
        // Если нет конфигурации или активной вкладки - все колонки видимы
        return {};
      }
      
      const config = this.columnVisibilityConfig[this.activeTab];
      if (!config || !config.hide) {
        // Если для текущей вкладки нет конфигурации - все колонки видимы
        return {};
      }
      
      const result = {};
      const hideColumns = config.hide || [];
      
      // Получаем все классы колонок из компонента (если определен метод getColumnClasses)
      // Иначе используем все классы из конфигурации
      let allColumnClasses = [];
      if (this.getColumnClasses && typeof this.getColumnClasses === 'function') {
        allColumnClasses = this.getColumnClasses();
      } else {
        // Собираем все уникальные классы колонок из конфигурации
        const classSet = new Set();
        Object.values(this.columnVisibilityConfig).forEach(tabConfig => {
          if (tabConfig.hide) {
            tabConfig.hide.forEach(colClass => classSet.add(colClass));
          }
        });
        allColumnClasses = Array.from(classSet);
      }
      
      // Для каждой колонки определяем, должна ли она быть скрыта
      allColumnClasses.forEach(colClass => {
        // Проверяем, нужно ли скрыть эту колонку на текущей вкладке
        // Поддерживаем как точное совпадение, так и префиксное (например, 'col-percent' скрывает все 'col-percent-*')
        const shouldHide = hideColumns.some(hideClass => {
          if (hideClass === colClass) {
            return true; // Точное совпадение
          }
          // Префиксное совпадение: если hideClass = 'col-percent', то скрываем 'col-percent-1h', 'col-percent-24h' и т.д.
          if (colClass.startsWith(hideClass + '-')) {
            return true;
          }
          return false;
        });
        
        result[colClass] = shouldHide ? 'col-hidden' : '';
      });
      
      return result;
    },
    
    // Число видимых колонок на текущей вкладке
    visibleColumnsCount() {
      // Используем DOM для точного подсчета видимых колонок
      // Это более надежно, чем подсчет по классам, так как учитывает v-for и динамические колонки
      if (!this.$el) return 0;
      
      const table = this.$el.querySelector('table');
      if (!table) return 0;
      
      const colgroup = table.querySelector('colgroup');
      if (!colgroup) return 0;
      
      // Подсчитываем видимые колонки (не с классом col-hidden)
      const visibleCols = Array.from(colgroup.querySelectorAll('col')).filter(col => {
        return !col.classList.contains('col-hidden');
      });
      
      return visibleCols.length;
    }
  },
  
  watch: {
    // Отслеживаем изменение видимых колонок для автоматического расчета ширины
    visibleColumnsCount: {
      handler(newCount) {
        if (newCount > 0) {
          this.$nextTick(() => {
            this.updateColumnWidths(newCount);
          });
        }
      },
      immediate: true
    },
    
    // Также отслеживаем изменение активной вкладки
    activeTab() {
      this.$nextTick(() => {
        if (this.visibleColumnsCount > 0) {
          this.updateColumnWidths(this.visibleColumnsCount);
        }
      });
    }
  },
  
  methods: {
    // Обновление ширины колонок на основе числа видимых колонок
    updateColumnWidths(visibleCount) {
      // Находим таблицу в компоненте (через $el)
      const table = this.$el?.querySelector('table');
      if (!table) return;
      
      const colgroup = table.querySelector('colgroup');
      if (!colgroup) return;
      
      // Получаем все видимые колонки (не с классом col-hidden)
      const visibleCols = Array.from(colgroup.querySelectorAll('col')).filter(col => {
        return !col.classList.contains('col-hidden');
      });
      
      if (visibleCols.length === 0) return;
      
      // Рассчитываем ширину: 100% / число видимых колонок
      const widthPercent = 100 / visibleCols.length;
      
      // Устанавливаем ширину для каждой видимой колонки
      visibleCols.forEach(col => {
        col.style.width = `${widthPercent}%`;
      });
    }
  },
  
  mounted() {
    // Вызываем обновление ширины колонок после монтирования компонента
    this.$nextTick(() => {
      if (this.visibleColumnsCount > 0) {
        this.updateColumnWidths(this.visibleColumnsCount);
      }
    });
  }
};

