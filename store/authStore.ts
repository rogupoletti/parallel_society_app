import { create } from 'zustand';
import { User } from 'firebase/auth';
import { AuthService } from '@/core/services/AuthService';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLocked: boolean;
    hasBiometricsEnabled: boolean;
    loading: boolean;
    error: string | null;

    setUser: (user: User | null) => void;
    setIsAuthenticated: (auth: boolean) => void;
    setIsLocked: (locked: boolean) => void;
    setBiometricsEnabled: (enabled: boolean) => void;
    login: (mnemonic: string, username?: string, email?: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLocked: false,
    hasBiometricsEnabled: false,
    loading: false,
    error: null,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
    setIsLocked: (locked) => set({ isLocked: locked }),
    setBiometricsEnabled: (enabled) => set({ hasBiometricsEnabled: enabled }),

    login: async (mnemonic: string, username?: string, email?: string) => {
        set({ loading: true, error: null });
        try {
            const user = await AuthService.signInWithWallet(mnemonic, username, email);
            set({ user, isAuthenticated: true, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ loading: true });
        try {
            await AuthService.logout();
            set({ user: null, isAuthenticated: false, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    }
}));
