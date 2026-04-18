import AsyncStorage from '@react-native-async-storage/async-storage';
import { Proposal } from '../types/Proposal';
import 'react-native-get-random-values';

const STORAGE_KEY = '@proposals';

class GovernanceService {
    /**
     * Loads all proposals from local storage
     * @returns Array of Proposal objects
     */
    async loadProposals(): Promise<Proposal[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            if (!jsonValue) return [];

            const proposals = JSON.parse(jsonValue) as Proposal[];
            // Sort by createdAt descending (newest first)
            return proposals.sort((a, b) => b.createdAt - a.createdAt);
        } catch (e) {
            console.error('Failed to load proposals', e);
            return [];
        }
    }

    /**
     * Creates and saves a new proposal
     * @param title Proposal title
     * @param category Proposal category
     * @param description Proposal description
     * @param endDate Proposal end date (timestamp)
     * @param author Proposal author address
     * @returns The created Proposal object
     */
    async addProposal(title: string, category: string, description: string, endDate: number, author: string): Promise<Proposal> {
        try {
            const newProposal: Proposal = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title,
                category,
                description,
                createdAt: Date.now(),
                endDate,
                author,
            };

            const existingProposals = await this.loadProposals();
            const updatedProposals = [newProposal, ...existingProposals];

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProposals));
            return newProposal;
        } catch (e) {
            console.error('Failed to save proposal', e);
            throw e;
        }
    }

    /**
     * clear all proposals (dev utility)
     */
    async clearProposals(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear proposals', e);
        }
    }
}

export const governanceService = new GovernanceService();
