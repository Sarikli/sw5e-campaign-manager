// @ts-check
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', '.expo', 'dist'] },
  ...tseslint.configs.recommended,
  {
    // Domain layer must stay free of React Native / Expo / SQLite (ARCHITECTURE.md §3).
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-native', 'react-native-*', 'expo', 'expo-*'], message: 'Domain must not depend on UI or platform packages.' },
            { group: ['**/infrastructure/**', '**/application/**', '**/features/**', '**/components/**'], message: 'Domain must not depend on outer layers.' },
          ],
        },
      ],
    },
  },
);
