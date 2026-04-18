import { Stack } from 'expo-router';

export default function LegalLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Legal & Agreement',
                }}
            />
            <Stack.Screen
                name="principles"
                options={{
                    title: 'Principles of Liberty',
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="charter"
                options={{
                    title: 'Digital Nation Charter',
                    presentation: 'modal',
                }}
            />
        </Stack>
    );
}
