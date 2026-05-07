// Mock dependencies before imports
jest.mock('@/core/services/AuthService', () => ({
    AuthService: {
        signInWithWallet: jest.fn(),
        logout: jest.fn()
    }
}));

jest.mock('firebase/auth', () => ({
    User: {}
}));

import { useAuthStore } from './authStore';
import { AuthService } from '@/core/services/AuthService';
import { act } from '@testing-library/react-native';

describe('authStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset store state between tests
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLocked: false,
            hasBiometricsEnabled: false,
            loading: false,
            error: null
        });
    });

    describe('initial state', () => {
        it('should have correct default values', () => {
            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLocked).toBe(false);
            expect(state.hasBiometricsEnabled).toBe(false);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('setUser', () => {
        it('should set user and mark as authenticated', () => {
            const mockUser = { uid: '0x1234' } as any;

            act(() => {
                useAuthStore.getState().setUser(mockUser);
            });

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
        });

        it('should set isAuthenticated to false when user is null', () => {
            // First set a user
            act(() => {
                useAuthStore.getState().setUser({ uid: '0x1234' } as any);
            });

            // Then clear it
            act(() => {
                useAuthStore.getState().setUser(null);
            });

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('setIsLocked / setBiometricsEnabled', () => {
        it('should toggle lock state', () => {
            act(() => {
                useAuthStore.getState().setIsLocked(true);
            });
            expect(useAuthStore.getState().isLocked).toBe(true);

            act(() => {
                useAuthStore.getState().setIsLocked(false);
            });
            expect(useAuthStore.getState().isLocked).toBe(false);
        });

        it('should toggle biometrics state', () => {
            act(() => {
                useAuthStore.getState().setBiometricsEnabled(true);
            });
            expect(useAuthStore.getState().hasBiometricsEnabled).toBe(true);
        });
    });

    describe('login', () => {
        it('should call AuthService.signInWithWallet and set user on success', async () => {
            const mockUser = { uid: '0xABC', email: null } as any;
            (AuthService.signInWithWallet as jest.Mock).mockResolvedValue(mockUser);

            await act(async () => {
                await useAuthStore.getState().login('test mnemonic phrase');
            });

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
            expect(AuthService.signInWithWallet).toHaveBeenCalledWith(
                'test mnemonic phrase', undefined, undefined
            );
        });

        it('should pass username and email to AuthService', async () => {
            (AuthService.signInWithWallet as jest.Mock).mockResolvedValue({ uid: '0x1' } as any);

            await act(async () => {
                await useAuthStore.getState().login('mnemonic', 'samuel', 'sam@test.com');
            });

            expect(AuthService.signInWithWallet).toHaveBeenCalledWith(
                'mnemonic', 'samuel', 'sam@test.com'
            );
        });

        it('should set error and re-throw on failure', async () => {
            (AuthService.signInWithWallet as jest.Mock).mockRejectedValue(
                new Error('Network error')
            );

            await expect(
                act(async () => {
                    await useAuthStore.getState().login('bad mnemonic');
                })
            ).rejects.toThrow('Network error');

            const state = useAuthStore.getState();
            expect(state.error).toBe('Network error');
            expect(state.loading).toBe(false);
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('logout', () => {
        it('should call AuthService.logout and clear state', async () => {
            // Set authenticated state first
            act(() => {
                useAuthStore.getState().setUser({ uid: '0x1' } as any);
            });

            (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

            await act(async () => {
                await useAuthStore.getState().logout();
            });

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.loading).toBe(false);
        });

        it('should set error on logout failure', async () => {
            (AuthService.logout as jest.Mock).mockRejectedValue(
                new Error('Logout failed')
            );

            await act(async () => {
                await useAuthStore.getState().logout();
            });

            expect(useAuthStore.getState().error).toBe('Logout failed');
        });
    });
});
