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
    }
  }
};

