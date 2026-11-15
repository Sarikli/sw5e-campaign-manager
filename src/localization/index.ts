/**
 * Minimal localization layer. English only for now; add a locale by adding a
 * dictionary and selecting it in `activeLocale`. Never hardcode UI strings in components.
 */
const en = {
  'tabs.home': 'Library',
  'tabs.listings': 'Listings',
  'tabs.search': 'Search',
  'tabs.characters': 'Characters',
  'tabs.campaigns': 'Campaigns',
  'tabs.compendium': 'Listings',
  'tabs.settings': 'Settings',
  'home.title': 'SW5e Campaign Manager',
  'home.subtitle': 'Your offline companion for characters, campaigns and the Game Master table.',
  'characters.title': 'Characters',
  'characters.empty.title': 'No characters yet',
  'characters.empty.body': 'Create your first character to get started.',
  'characters.add': 'New character',
  'characters.name': 'Character name',
  'campaigns.title': 'Campaigns',
  'campaigns.empty.title': 'No campaigns yet',
  'campaigns.empty.body': 'Create a campaign to organize sessions, players and encounters.',
  'campaigns.add': 'New campaign',
  'campaigns.name': 'Campaign name',
  'compendium.title': 'Compendium',
  'compendium.empty.title': 'No content installed',
  'compendium.empty.body': 'Game content packs will appear here once they are installed.',
  'settings.title': 'Settings',
  'settings.about': 'About',
  'settings.disclaimer':
    'This is an unofficial fan-made companion. It is not affiliated with or endorsed by Lucasfilm, Disney, Wizards of the Coast or SW5e.',
  'settings.version': 'Version',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.loading': 'Loading…',
  'common.retry': 'Retry',
  'common.error': 'Something went wrong.',
  'common.delete': 'Delete',
  'common.confirmDelete': 'Delete this item? This cannot be undone.',
} as const;

export type TranslationKey = keyof typeof en;

const dictionaries = { en } as const;
const activeLocale: keyof typeof dictionaries = 'en';

export function t(key: TranslationKey): string {
  return dictionaries[activeLocale][key];
}
