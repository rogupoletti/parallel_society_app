import { Stack } from 'expo-router';

export default function GovernanceLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: '#fff',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                    fontWeight: '600',
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Governance',
                    headerLargeTitle: true,
                }}
            />
            <Stack.Screen
                name="create"
                options={{
                    title: 'New Proposal',
                    presentation: 'modal',
                }}
            />
        </Stack>
    );
}
