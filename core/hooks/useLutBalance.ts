import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { TOKENS } from '@/core/config/tokens';

export interface LutBalanceHook {
    balance: number;
    formatted: string;
    loading: boolean;
    error: string | null;
    canCreateProposal: boolean;
    refresh: () => Promise<void>;
}

const MIN_LUT_FOR_PROPOSAL = 2000;

export function useLutBalance(): LutBalanceHook {
    const { balances, loadingBalances, balanceError, refreshBalances } = useWalletStore();

    // Derived state
    const lutBalanceFormatted = balances.LUT?.formatted || '0';
    // Remove commas to parse correctly
    const balanceValue = parseFloat(lutBalanceFormatted.replace(/,/g, ''));

    const canCreateProposal = balanceValue >= MIN_LUT_FOR_PROPOSAL;

    return {
        balance: balanceValue,
        formatted: lutBalanceFormatted,
        loading: loadingBalances,
        error: balanceError,
        canCreateProposal,
        refresh: refreshBalances
    };
}
