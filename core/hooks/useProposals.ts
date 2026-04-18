import { useState, useEffect, useCallback } from 'react';
import { Proposal } from '../types/Proposal';
import { ProposalService } from '../services/api/ProposalService';

export interface UseProposalsHook {
    proposals: Proposal[];
    loading: boolean;
    error: string | null;
    load: () => Promise<void>;
    add: (params: { title: string, category: string, description: string, endTime: number, authorAddress: string, privateKey: string }) => Promise<boolean>;
    remove: (id: string) => Promise<void>;
}

export function useProposals(): UseProposalsHook {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ProposalService.fetchProposals();
            setProposals(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load proposals');
        } finally {
            setLoading(false);
        }
    }, []);

    const add = useCallback(async (params: { title: string, category: string, description: string, endTime: number, authorAddress: string, privateKey: string }) => {
        try {
            console.log('[ProposalService] Creating proposal:', {
                title: params.title,
                category: params.category,
                authorAddress: typeof params.authorAddress === 'string' ? `${params.authorAddress.substring(0, 10)}...` : 'INVALID_TYPE',
                hasPrivateKey: !!params.privateKey
            });
            await ProposalService.createProposal(params);
            await load(); // Refresh the list
            return true;
        } catch (err) {
            console.error('Error adding proposal:', err);
            throw err;
        }
    }, [load]);

    const remove = useCallback(async (id: string) => {
        try {
            // Optimistic update: remove from list immediately
            setProposals(prev => prev.filter(p => p.id !== id));

            // Perform actual delete
            await ProposalService.deleteProposal(id);
        } catch (err) {
            console.error('Error removing proposal:', err);
            // Revert if failed
            await load();
            throw err;
        }
    }, [load]);

    // Initial load
    useEffect(() => {
        load();
    }, [load]);

    return {
        proposals,
        loading,
        error,
        load,
        add,
        remove
    };
}
