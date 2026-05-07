/**
 * Tests for the usePlatform hook.
 * Validates platform-specific value resolution.
 */

// We need to mock Platform before importing the hook
let mockPlatformOS = 'web';

jest.mock('react-native', () => ({
    Platform: {
        get OS() {
            return mockPlatformOS;
        },
    },
}));

import { usePlatform } from '@/hooks/usePlatform';

describe('usePlatform', () => {
    describe('when Platform.OS === "web"', () => {
        beforeAll(() => { mockPlatformOS = 'web'; });

        it('returns isWeb true', () => {
            const result = usePlatform();
            expect(result.isWeb).toBe(true);
            expect(result.isIOS).toBe(false);
            expect(result.isAndroid).toBe(false);
        });

        it('keyboardBehavior is undefined on web', () => {
            const result = usePlatform();
            expect(result.keyboardBehavior).toBeUndefined();
        });

        it('bottomPadding is 16 on web', () => {
            const result = usePlatform();
            expect(result.bottomPadding).toBe(16);
        });

        it('hasBiometrics is false on web', () => {
            const result = usePlatform();
            expect(result.hasBiometrics).toBe(false);
        });

        it('monoFont is monospace', () => {
            const result = usePlatform();
            expect(result.monoFont).toBe('monospace');
        });
    });

    describe('when Platform.OS === "ios"', () => {
        beforeAll(() => { mockPlatformOS = 'ios'; });

        it('returns isIOS true', () => {
            const result = usePlatform();
            expect(result.isIOS).toBe(true);
            expect(result.isWeb).toBe(false);
            expect(result.isAndroid).toBe(false);
        });

        it('keyboardBehavior is padding on iOS', () => {
            const result = usePlatform();
            expect(result.keyboardBehavior).toBe('padding');
        });

        it('bottomPadding is 40 on iOS', () => {
            const result = usePlatform();
            expect(result.bottomPadding).toBe(40);
        });

        it('monoFont is Courier on iOS', () => {
            const result = usePlatform();
            expect(result.monoFont).toBe('Courier');
        });

        it('hasBiometrics is true on iOS', () => {
            const result = usePlatform();
            expect(result.hasBiometrics).toBe(true);
        });

        it('datePickerDisplay is spinner on iOS', () => {
            const result = usePlatform();
            expect(result.datePickerDisplay).toBe('spinner');
        });
    });

    describe('when Platform.OS === "android"', () => {
        beforeAll(() => { mockPlatformOS = 'android'; });

        it('returns isAndroid true', () => {
            const result = usePlatform();
            expect(result.isAndroid).toBe(true);
            expect(result.isWeb).toBe(false);
            expect(result.isIOS).toBe(false);
        });

        it('keyboardBehavior is height on Android', () => {
            const result = usePlatform();
            expect(result.keyboardBehavior).toBe('height');
        });

        it('bottomPadding is 24 on Android', () => {
            const result = usePlatform();
            expect(result.bottomPadding).toBe(24);
        });

        it('datePickerDisplay is default on Android', () => {
            const result = usePlatform();
            expect(result.datePickerDisplay).toBe('default');
        });
    });
});
