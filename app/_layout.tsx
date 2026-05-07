
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthService } from '@/core/services/AuthService';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { SecureStorage } from '@/core/secure/SecureStorage';
import 'react-native-get-random-values'; // Polyfill for ethers
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);
    const setIsLocked = useAuthStore((state) => state.setIsLocked);
    const isLocked = useAuthStore((state) => state.isLocked);
    const appState = useRef(AppState.currentState);
    const backgroundTime = useRef<number | null>(null);

    useEffect(() => {
        const unsubscribe = AuthService.subscribeToAuthChanges((user) => {
            setUser(user);
        });

        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // Return from background
                const now = Date.now();
                const wasInBackgroundLongEnough = backgroundTime.current && (now - backgroundTime.current > 60000);

                if (wasInBackgroundLongEnough) {
                    const hasPin = await SecureStorage.getPinHash();
                    if (hasPin && !isLocked) {
                        setIsLocked(true);
                        router.push('/auth/lock');
                    }
                }
                backgroundTime.current = null;
            } else if (nextAppState.match(/inactive|background/)) {
                // Entering background
                backgroundTime.current = Date.now();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            unsubscribe();
            subscription.remove();
        };
    }, [setUser, setIsLocked, isLocked]);

    return (
        <SafeAreaProvider>
            <ErrorBoundary>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="welcome/index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="legal" />
                    <Stack.Screen name="home" />
                </Stack>
            </ErrorBoundary>
        </SafeAreaProvider>
    );
}
 
