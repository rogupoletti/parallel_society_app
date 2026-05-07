import { useOnboardingStore } from './onboardingStore';
import { act } from '@testing-library/react-native';

describe('onboardingStore', () => {
    beforeEach(() => {
        // Reset store state between tests
        useOnboardingStore.setState({
            username: '',
            email: '',
            country: '',
            language: 'English',
            walletMode: null
        });
    });

    describe('initial state', () => {
        it('should have correct default values', () => {
            const state = useOnboardingStore.getState();

            expect(state.username).toBe('');
            expect(state.email).toBe('');
            expect(state.country).toBe('');
            expect(state.language).toBe('English');
            expect(state.walletMode).toBeNull();
        });
    });

    describe('setters', () => {
        it('should set username', () => {
            act(() => {
                useOnboardingStore.getState().setUsername('samuel');
            });
            expect(useOnboardingStore.getState().username).toBe('samuel');
        });

        it('should set email', () => {
            act(() => {
                useOnboardingStore.getState().setEmail('samuel@test.com');
            });
            expect(useOnboardingStore.getState().email).toBe('samuel@test.com');
        });

        it('should set country', () => {
            act(() => {
                useOnboardingStore.getState().setCountry('Brazil');
            });
            expect(useOnboardingStore.getState().country).toBe('Brazil');
        });

        it('should set language', () => {
            act(() => {
                useOnboardingStore.getState().setLanguage('Portuguese');
            });
            // Note: the interface type says 'English' only, but the setter accepts string
            expect(useOnboardingStore.getState().language).toBe('Portuguese');
        });

        it('should set walletMode to CREATE', () => {
            act(() => {
                useOnboardingStore.getState().setWalletMode('CREATE');
            });
            expect(useOnboardingStore.getState().walletMode).toBe('CREATE');
        });

        it('should set walletMode to IMPORT', () => {
            act(() => {
                useOnboardingStore.getState().setWalletMode('IMPORT');
            });
            expect(useOnboardingStore.getState().walletMode).toBe('IMPORT');
        });
    });

    describe('reset', () => {
        it('should reset all fields to default values', () => {
            // Set all fields to non-default values
            act(() => {
                const store = useOnboardingStore.getState();
                store.setUsername('samuel');
                store.setEmail('sam@test.com');
                store.setCountry('Brazil');
                store.setWalletMode('CREATE');
            });

            // Verify they were set
            expect(useOnboardingStore.getState().username).toBe('samuel');

            // Reset
            act(() => {
                useOnboardingStore.getState().reset();
            });

            const state = useOnboardingStore.getState();
            expect(state.username).toBe('');
            expect(state.email).toBe('');
            expect(state.country).toBe('');
            expect(state.language).toBe('English');
            expect(state.walletMode).toBeNull();
        });
    });
});
