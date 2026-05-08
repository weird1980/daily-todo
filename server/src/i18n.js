const LOCALES = {
  en: {
    no_tasks: 'No tasks registered.',
    no_summary: 'No summary',
    completed: 'Completed:',
    pending: 'Pending:',
    update_header: 'UPDATE:',
    update_no_tasks: 'UPDATE:\n\nNo tasks registered today.',
    tomorrow: 'Tomorrow',
  },
  es: {
    no_tasks: 'Sin tareas registradas.',
    no_summary: 'Sin resumen',
    completed: 'Completado:',
    pending: 'Pendiente:',
    update_header: 'UPDATE:',
    update_no_tasks: 'UPDATE:\n\nSin tareas registradas hoy.',
    tomorrow: 'Mañana',
  },
  ca: {
    no_tasks: 'Sense tasques registrades.',
    no_summary: 'Sense resum',
    completed: 'Completat:',
    pending: 'Pendent:',
    update_header: 'UPDATE:',
    update_no_tasks: 'UPDATE:\n\nSense tasques registrades avui.',
    tomorrow: 'Demà',
  },
  fr: {
    no_tasks: 'Aucune tâche enregistrée.',
    no_summary: 'Pas de résumé',
    completed: 'Terminé :',
    pending: 'En cours :',
    update_header: 'UPDATE :',
    update_no_tasks: 'UPDATE :\n\nAucune tâche enregistrée aujourd’hui.',
    tomorrow: 'Demain',
  },
};

function detectLocale() {
  const raw = (process.env.TODO_LANG || process.env.LANG || 'en').toLowerCase();
  const code = raw.split(/[_.]/)[0];
  return LOCALES[code] ? code : 'en';
}

/**
 * Returns translated string for the current locale.
 * Locale is selected from process.env.TODO_LANG (or LANG).
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  const locale = detectLocale();
  return LOCALES[locale][key] ?? LOCALES.en[key] ?? key;
}

/**
 * Returns the active locale code.
 * @returns {'en'|'es'|'ca'|'fr'}
 */
export function currentLocale() {
  return detectLocale();
}
