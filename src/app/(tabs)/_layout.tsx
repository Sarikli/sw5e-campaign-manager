import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { t, type TranslationKey } from '../../localization';

const TABS: { name: string; title: TranslationKey; glyph: string }[] = [
  { name: 'index', title: 'tabs.home', glyph: '📚' },
  { name: 'compendium', title: 'tabs.listings', glyph: '📖' },
  { name: 'search', title: 'tabs.search', glyph: '🔍' },
  { name: 'characters', title: 'tabs.characters', glyph: '👤' },
  { name: 'campaigns', title: 'tabs.campaigns', glyph: '🚩' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#12151A',
          borderTopColor: '#262C36',
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.title),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>{tab.glyph}</Text>,
          }}
        />
      ))}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
