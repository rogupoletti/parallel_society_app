import { Redirect } from 'expo-router';

/**
 * Home screen redirects to the wallet dashboard.
 * The wallet dashboard is the main screen after wallet creation.
 */
export default function HomeScreen() {
    return <Redirect href="/wallet" />;
}
