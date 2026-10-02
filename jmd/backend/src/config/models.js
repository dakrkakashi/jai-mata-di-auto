/**
 * Canonical Model Definitions and Mappings
 * Maps raw price list labels to canonical slugs and display names.
 * Separates current Ampere production lineup from older/legacy models.
 */

const MODEL_CONFIG = {
  // Flag to toggle display of legacy/older models on public catalog
  showOlderModels: true,

  // 15 Canonical Model Definitions
  models: [
    // 7 Current Ampere Production Models
    {
      slug: 'nexus',
      label: 'Nexus',
      isCurrent: true,
      aliases: ['nexus', 'nexus st', 'nexus-st']
    },
    {
      slug: 'magnus-grand-max',
      label: 'Magnus Grand MAX',
      isCurrent: true,
      aliases: ['magnus grand max', 'magnus-grand-max', 'magnus gmax', 'magnus-gmax']
    },
    {
      slug: 'magnus-ex',
      label: 'Magnus EX',
      isCurrent: true,
      aliases: ['magnus ex', 'magnus-ex']
    },
    {
      slug: 'magnus-grand',
      label: 'Magnus GRAND',
      isCurrent: true,
      aliases: ['magnus grand', 'magnus-grand']
    },
    {
      slug: 'magnus-neo',
      label: 'Magnus Neo',
      isCurrent: true,
      aliases: ['magnus neo', 'magnus-neo']
    },
    {
      slug: 'reo-80',
      label: 'Reo 80',
      isCurrent: true,
      aliases: ['reo 80', 'reo-80']
    },
    {
      slug: 'reo-li',
      label: 'Reo Li',
      isCurrent: true,
      aliases: ['reo li', 'reo-li']
    },

    // 8 Older / Legacy Models
    {
      slug: 'primus',
      label: 'Primus',
      isCurrent: false,
      aliases: ['primus']
    },
    {
      slug: 'zeal',
      label: 'Zeal',
      isCurrent: false,
      aliases: ['zeal', 'zeal ex']
    },
    {
      slug: 'magnus-pro',
      label: 'MAGNUS PRO',
      isCurrent: false,
      aliases: ['magnus pro', 'magnus-pro']
    },
    {
      slug: 'magnus-60-2022',
      label: 'MAGNUS 60 (2022)',
      isCurrent: false,
      aliases: ['magnus 60 (2022)', 'magnus 60 2022', 'magnus-60-2022']
    },
    {
      slug: 'magnus-60-2020',
      label: 'MAGNUS 60 (2020)',
      isCurrent: false,
      aliases: ['magnus 60 (2020)', 'magnus 60 2020', 'magnus-60-2020']
    },
    {
      slug: 'v48-2022',
      label: 'V48 2022',
      isCurrent: false,
      aliases: ['v48 2022', 'v48-2022']
    },
    {
      slug: 'v48-li',
      label: 'V48 Li',
      isCurrent: false,
      aliases: ['v48 li', 'v48-li']
    },
    {
      slug: 'v48-la',
      label: 'V48 LA',
      isCurrent: false,
      aliases: ['v48 la', 'v48-la']
    }
  ]
};

// Quick lookup maps
const SLUG_TO_MODEL = {};
const LABEL_TO_MODEL = {};
const ALIAS_TO_MODEL = {};

MODEL_CONFIG.models.forEach(m => {
  SLUG_TO_MODEL[m.slug] = m;
  LABEL_TO_MODEL[m.label.toLowerCase()] = m;
  m.aliases.forEach(a => {
    ALIAS_TO_MODEL[a.toLowerCase()] = m;
  });
});

/**
 * Resolve any model string/label to its canonical definition
 */
function resolveModel(rawName) {
  if (!rawName || typeof rawName !== 'string') return null;
  const cleaned = rawName.trim().toLowerCase();
  return ALIAS_TO_MODEL[cleaned] || LABEL_TO_MODEL[cleaned] || SLUG_TO_MODEL[cleaned] || null;
}

module.exports = {
  MODEL_CONFIG,
  SLUG_TO_MODEL,
  LABEL_TO_MODEL,
  resolveModel
};
