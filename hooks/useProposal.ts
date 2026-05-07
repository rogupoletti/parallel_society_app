import { useState, useCallback, useEffect } from 'react';
import { ProposalService } from '@/core/services/api/ProposalService';
import { Proposal } from '@/core/types/Proposal';
import { balanceService } from '@/core/services/BalanceService';
import { TOKENS } from '@/core/config/tokens';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { signVote, VoteMessage } from '@/core/wallet/eip712';
import { ethers } from 'ethers';

interface UseProposalProps {
    id: string | string[] | undefined;
    walletAddress: string | null;
}

export function useProposal({ id, walletAddress }: UseProposalProps) {
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userLutBalance, setUserLutBalance] = useState<string>('0');

    const loadProposal = useCallback(async () => {
        if (!id || typeof id !== 'string') return;
        setLoading(true);
        setError(null);
        try {
            const data = await ProposalService.fetchProposalById(id);
            setProposal(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load proposal');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProposal();
    }, [loadProposal]);

    useEffect(() => {
        const loadBalance = async () => {
            if (!walletAddress) return;
            try {
                const lutBalance = await balanceService.fetchTokenBalance(
                    walletAddress,
                    TOKENS.LUT.address!,
                    'LUT'
                );
                setUserLutBalance(lutBalance.raw);
            } catch (err) {
                console.error('[useProposal] Failed to load balance:', err);
            }
        };
        loadBalance();
    }, [walletAddress]);

    const castVote = async (choice: 'FOR' | 'AGAINST') => {
        if (!proposal || !walletAddress) {
            throw new Error('Proposal or Wallet Address is not initialized');
        }

        setVoting(true);
        try {
            const privateKey = await SecureStorage.getEncryptedKey('private_key');
            if (!privateKey) throw new Error('Private key not found. Please re-authenticate.');

            const timestamp = Math.floor(Date.now() / 1000);
            const voteMessage: VoteMessage = {
                proposalId: proposal.id,
                voter: walletAddress.toLowerCase(),
                choice,
                snapshotBlock: proposal.snapshotBlock || 0,
                timestamp
            };

            const signature = await signVote(privateKey, voteMessage);
            await ProposalService.vote(proposal.id, choice, signature, timestamp);
            
            await loadProposal(); // refresh
            return true;
        } catch (err: any) {
            console.error('Vote Error:', err);
            throw err;
        } finally {
            setVoting(false);
        }
    };

    const getProposalMetrics = () => {
        if (!proposal) return { totalFor: 0n, totalAgainst: 0n, totalVotes: 0n, pctFor: 0, pctAgainst: 0 };
        
        const totalFor = BigInt(proposal.totalForRaw || '0');
        const totalAgainst = BigInt(proposal.totalAgainstRaw || '0');
        const totalVotes = totalFor + totalAgainst;

        const pctFor = totalVotes > 0n ? Number((totalFor * 10000n) / totalVotes) / 100 : 0;
        const pctAgainst = totalVotes > 0n ? Number((totalAgainst * 10000n) / totalVotes) / 100 : 0;

        return { totalFor, totalAgainst, totalVotes, pctFor, pctAgainst };
    };

    const formatTokens = (raw: string) => {
        try {
            const val = parseFloat(ethers.formatUnits(raw, 18));
            return val.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' LUT';
        } catch (e) {
            return '0 LUT';
        }
    };

    const isVotingClosed = proposal ? ['CLOSED', 'PASSED', 'FAILED'].includes(proposal.status) : false;

    return {
        proposal,
        loading,
        error,
        voting,
        userLutBalance,
        loadProposal,
        castVote,
        getProposalMetrics,
        formatTokens,
        isVotingClosed,
    };
}
