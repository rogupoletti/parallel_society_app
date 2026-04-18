import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    // Base height for the tab bar content
    const TAB_BAR_HEIGHT = 60;

    // Calculate total height including safe area
    // On Android with software buttons, insets.bottom will be > 0
    const totalHeight = TAB_BAR_HEIGHT + (Platform.OS === 'android' ? insets.bottom : 0);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                        },
                        android: {
                            elevation: 8,
                            height: totalHeight,
                            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
                            paddingTop: 12,
                        },
                    }),
                    backgroundColor: '#fff',
                    borderTopWidth: 0,
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#999',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginBottom: Platform.OS === 'android' ? 0 : 0
                },
            }}
        >
            <Tabs.Screen
                name="wallet"
                options={{
                    title: 'Wallet',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="wallet-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="governance"
                options={{
                    title: 'Governance',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
