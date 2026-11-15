import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '../hooks/DatabaseProvider';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <DatabaseProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="character/[id]" />
            <Stack.Screen name="campaign/[id]" />
          </Stack>
        </DatabaseProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: colors.background,
  },
});
