import { Platform } from 'react-native';

/**
 * Centralized platform detection hook.
 * Replaces scattered Platform.OS checks across the codebase
 * with a single source of truth for platform-specific values.
 */
export function usePlatform() {
    const isWeb = Platform.OS === 'web';
    const isIOS = Platform.OS === 'ios';
    const isAndroid = Platform.OS === 'android';

    return {
        isWeb,
        isIOS,
        isAndroid,

        /** KeyboardAvoidingView behavior: 'padding' on iOS, 'height' on Android, undefined on web */
        keyboardBehavior: isIOS ? ('padding' as const) : (isWeb ? undefined : ('height' as const)),

        /** Keyboard vertical offset for KeyboardAvoidingView */
        keyboardVerticalOffset: isIOS ? 100 : 0,

        /** Monospace font family */
        monoFont: isIOS ? 'Courier' : 'monospace',

        /** Bottom padding for screen content */
        bottomPadding: isIOS ? 40 : (isWeb ? 16 : 24),

        /** Bottom padding for modals */
        modalBottomPadding: isIOS ? 40 : 20,

        /** Whether to show native biometrics option */
        hasBiometrics: !isWeb, // No biometrics on web

        /** DateTimePicker display mode */
        datePickerDisplay: isIOS ? ('spinner' as const) : ('default' as const),
    };
}
