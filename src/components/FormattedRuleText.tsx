import { StyleSheet, Text, View } from 'react-native';

interface Props {
  /** Either a raw multi-paragraph string (separated by \n) or an array of paragraph strings */
  text?: string;
  paragraphs?: readonly string[];
  /** 'dark' for dark-theme modals/book reader (#12151A bg), 'light' for light builder cards (#FFF bg) */
  variant?: 'dark' | 'light';
}

const MAJOR_SECTION_TITLES = new Set([
  'ACTIONS',
  'LEGENDARY ACTIONS',
  'LAIR ACTIONS',
  'REACTIONS',
  'VILLAIN ACTIONS',
  'BIOLOGY AND APPEARANCE',
  'SOCIETY AND CULTURE',
  'NAMES',
  'CLASS FEATURES',
  'HIT POINTS',
  'PROFICIENCIES',
  'EQUIPMENT',
  'QUICK BUILD',
  'CREATING A CHARACTER',
  'SUGGESTED CHARACTERISTICS',
  'VARIANT',
  'RESOURCES',
  'RESOLUTION',
  'COMPLICATIONS',
]);

/**
 * Renders SW5e PDF rulebook text with distinct color-coded headings, trait labels,
 * metadata lines, and body paragraphs for effortless reading.
 */
export function FormattedRuleText({ text, paragraphs, variant = 'dark' }: Props) {
  const rawList =
    paragraphs ??
    (text ?? '')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

  const isDark = variant === 'dark';

  return (
    <View style={styles.container}>
      {rawList.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;

        // 1. Major Statblock / Chapter Section Banner (e.g. ACTIONS, LEGENDARY ACTIONS, BIOLOGY AND APPEARANCE)
        const upper = line.toUpperCase();
        if (
          MAJOR_SECTION_TITLES.has(upper) ||
          /^(CHAPTER \d+|APPENDIX [A-Z]|CREATING A |THE [A-Z]+ TABLE)/.test(upper) ||
          /^[A-Z\s'’-]+ TRAITS$/.test(line)
        ) {
          return (
            <View
              key={idx}
              style={[
                styles.majorHeadingWrap,
                isDark ? styles.majorHeadingBorderDark : styles.majorHeadingBorderLight,
              ]}
            >
              <Text
                style={[
                  styles.majorHeadingText,
                  isDark ? styles.majorHeadingDark : styles.majorHeadingLight,
                ]}
              >
                {line}
              </Text>
            </View>
          );
        }

        // 2. All-Caps Subheading (e.g. FORCECASTING, RAGE, UNARMORED DEFENSE, ACROBAT, BURST OF SPEED)
        if (
          /^[A-Z0-9][A-Z0-9\s\-'’/(),:&]{2,64}$/.test(line) &&
          !/^(STR|DEX|CON|INT|WIS|CHA)(\s+(STR|DEX|CON|INT|WIS|CHA))*$/.test(line)
        ) {
          return (
            <Text
              key={idx}
              style={[
                styles.subHeadingText,
                isDark ? styles.subHeadingDark : styles.subHeadingLight,
              ]}
            >
              {line}
            </Text>
          );
        }

        // 3. Power Level / Item Rarity Subtitle (e.g. "1st-level universal power", "At-will tech power", "Adventuring gear, prototype")
        if (
          /^(At-will|\d+(?:st|nd|rd|th)-level)\s+.+\s+power$/i.test(line) ||
          /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+[^,]+,\s*.+$/i.test(line) ||
          /^(Adventuring gear|Armor|Consumable|Cybernetic augmentation|Droid customization|Focus|Item modification|Shield|Weapon|Valuable).+,\s*(standard|premium|prototype|advanced|legendary|artifact)/i.test(
            line,
          )
        ) {
          return (
            <Text
              key={idx}
              style={[styles.subtitleTag, isDark ? styles.subtitleDark : styles.subtitleLight]}
            >
              {line}
            </Text>
          );
        }

        // 4. Colon-delimited Metadata Header (e.g. "Casting Time: 1 action", "Hit Dice: 1d10 per guardian level", "Prerequisite: 4th level")
        const colonMatch = line.match(
          /^(Casting Time|Range|Duration|Prerequisite|Prerequisites|Power Die Location|Hit Dice|Hit Points at 1st Level|Hit Points at Higher Levels|Armor|Weapons|Tools|Saving Throws|Skills|Skill Proficiencies|Tool Proficiencies|Languages|Equipment|Feature|Requires Attunement):\s*(.+)$/i,
        );
        if (colonMatch) {
          return (
            <Text key={idx} style={[styles.bodyText, isDark ? styles.bodyDark : styles.bodyLight]}>
              <Text style={isDark ? styles.metaLabelDark : styles.metaLabelLight}>
                {colonMatch[1]}:{' '}
              </Text>
              <Text style={isDark ? styles.metaValDark : styles.metaValLight}>{colonMatch[2]}</Text>
            </Text>
          );
        }

        // 5. Statblock Attribute Line (e.g. "Armor Class 17 (force shield)", "Challenge 21 (33,000 XP)")
        const statLineMatch = line.match(
          /^(Armor Class|Hit Points|Speed|Saving Throws|Skills|Damage Vulnerabilities|Damage Resistances|Damage Immunities|Condition Immunities|Senses|Languages|Challenge)\s+(.+)$/i,
        );
        if (statLineMatch) {
          return (
            <Text key={idx} style={[styles.bodyText, isDark ? styles.bodyDark : styles.bodyLight]}>
              <Text style={isDark ? styles.statKeyDark : styles.statKeyLight}>
                {statLineMatch[1]}{' '}
              </Text>
              <Text>{statLineMatch[2]}</Text>
            </Text>
          );
        }

        // 6. Inline Trait / Feature / Action Heading followed by period (e.g. "Ability Score Increase. Your...", "Force Potency. When you...", "Lightsaber. Melee Weapon Attack:...")
        const traitMatch = line.match(/^([A-Z][A-Za-z0-9\s\-'’()/]{1,42}\.)\s+(.+)$/);
        if (traitMatch) {
          const traitLabel = traitMatch[1]!;
          const restText = traitMatch[2]!;
          const isPotencyOrOvercharge = /^(Force Potency\.|Overcharge Tech\.|At Higher Levels\.)/i.test(
            traitLabel,
          );
          return (
            <Text key={idx} style={[styles.bodyText, isDark ? styles.bodyDark : styles.bodyLight]}>
              <Text
                style={
                  isPotencyOrOvercharge
                    ? isDark
                      ? styles.potencyLabelDark
                      : styles.potencyLabelLight
                    : isDark
                      ? styles.traitLabelDark
                      : styles.traitLabelLight
                }
              >
                {traitLabel}{' '}
              </Text>
              <Text>{restText}</Text>
            </Text>
          );
        }

        // 7. Standard Body Paragraph
        return (
          <Text key={idx} style={[styles.bodyText, isDark ? styles.bodyDark : styles.bodyLight]}>
            {line}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  majorHeadingWrap: {
    marginTop: 12,
    marginBottom: 2,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  majorHeadingBorderDark: {
    borderBottomColor: 'rgba(245, 158, 11, 0.45)',
  },
  majorHeadingBorderLight: {
    borderBottomColor: '#CBD5E1',
  },
  majorHeadingText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  majorHeadingDark: {
    color: '#F59E0B', // Warm SW5e Amber/Gold
  },
  majorHeadingLight: {
    color: '#B45309', // Deep Amber on light card
  },
  subHeadingText: {
    marginTop: 10,
    marginBottom: 1,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subHeadingDark: {
    color: '#38BDF8', // Hologram Cyan
  },
  subHeadingLight: {
    color: '#0369A1', // Deep Cyan-Blue on light card
  },
  subtitleTag: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitleDark: {
    color: '#A78BFA', // Soft Violet
  },
  subtitleLight: {
    color: '#6D28D9',
  },
  metaLabelDark: {
    color: '#34D399', // Emerald Green for Casting Time / Range / Duration / Prerequisites
    fontWeight: '800',
  },
  metaLabelLight: {
    color: '#047857',
    fontWeight: '800',
  },
  metaValDark: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  metaValLight: {
    color: '#0F172A',
    fontWeight: '600',
  },
  statKeyDark: {
    color: '#F87171', // Crimson accent for Statblock keys (AC, HP, Speed, Challenge)
    fontWeight: '800',
  },
  statKeyLight: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  traitLabelDark: {
    color: '#FBBF24', // Golden Yellow for inline trait titles ("Ability Score Increase.", "Nimble Escape.")
    fontWeight: '800',
  },
  traitLabelLight: {
    color: '#92400E',
    fontWeight: '800',
  },
  potencyLabelDark: {
    color: '#60A5FA', // Bright Force/Tech Blue for "Force Potency." / "Overcharge Tech."
    fontWeight: '800',
  },
  potencyLabelLight: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bodyDark: {
    color: '#E2E8F0',
  },
  bodyLight: {
    color: '#334155',
  },
});
