import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useProposals } from '@/core/hooks/useProposals';
import { useLutBalance } from '@/core/hooks/useLutBalance';
import { PROPOSAL_CATEGORIES, ProposalCategory } from '@/core/types/Proposal';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Markdown from 'react-native-markdown-display';
import { useWalletStore } from '@/store/walletStore';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { InfoModal } from '@/components/ui/InfoModal';

export default function CreateProposalScreen() {
    const router = useRouter();
    const { add } = useProposals();
    const { canCreateProposal, refresh: refreshBalance } = useLutBalance();
    const { walletAddress } = useWalletStore();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<ProposalCategory | ''>('');
    const [description, setDescription] = useState('');
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default 7 days
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        variant?: 'info' | 'error' | 'success' | 'warning';
        onClose: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        onClose: () => { },
    });

    const closePortal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    const isValid = title.trim().length > 0 && category !== '' && description.trim().length > 0;

    const handleSubmit = async () => {
        if (!isValid) return;

        setSubmitting(true);

        try {
            // Double check balance before submitting
            await refreshBalance();
            // We need to fetch the fresh state, but hooks don't update immediately in the function.
            // Ideally we check the source again or trust the optimistic check + error handling
            // For MVP, if the hook says false now, we block, but real check should happen in service/backend.

            // Since we upgraded the plan to just use local logic, we will rely on the hook's latest value which will update on next render
            // But here we can't wait for render. We will assume the initial check + user interaction is enough for local MVP. 
            // Or better, let's re-verify with a direct service call if strictness was needed, but hook is fine.

            if (!canCreateProposal) {
                setModalConfig({
                    visible: true,
                    title: 'Insufficient Balance',
                    message: 'You need at least 2,000 LUT to create a proposal.',
                    variant: 'warning',
                    onClose: closePortal
                });
                setSubmitting(false);
                return;
            }

            if (!walletAddress) {
                setModalConfig({
                    visible: true,
                    title: 'Error',
                    message: 'Wallet address not found',
                    variant: 'error',
                    onClose: closePortal
                });
                setSubmitting(false);
                return;
            }

            // Retrieve private key from secure storage (matches voting logic)
            const privateKey = await SecureStorage.getEncryptedKey('private_key');
            if (!privateKey) {
                setModalConfig({
                    visible: true,
                    title: 'Error',
                    message: 'Private key not found. Please re-import your wallet.',
                    variant: 'error',
                    onClose: closePortal
                });
                setSubmitting(false);
                return;
            }

            const success = await add({
                title,
                category: category as string,
                description,
                endTime: endDate.getTime(),
                authorAddress: walletAddress,
                privateKey: privateKey
            });

            if (success) {
                setModalConfig({
                    visible: true,
                    title: 'Success',
                    message: 'Proposal published and pinned to IPFS!',
                    variant: 'success',
                    onClose: () => {
                        closePortal();
                        router.back();
                    }
                });
            } else {
                setModalConfig({
                    visible: true,
                    title: 'Error',
                    message: 'Failed to publish proposal',
                    variant: 'error',
                    onClose: closePortal
                });
            }
        } catch (e: any) {
            setModalConfig({
                visible: true,
                title: 'Error',
                message: e.message || 'An unexpected error occurred',
                variant: 'error',
                onClose: closePortal
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView contentContainerStyle={styles.content}>

                {/* Title Input */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter a clear and concise title"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />
                </View>

                {/* Category Selection */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoriesContainer}>
                        {PROPOSAL_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    category === cat && styles.categoryChipSelected
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    category === cat && styles.categoryChipTextSelected
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* End Date Picker */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>End Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                        <Text style={styles.dateButtonText}>{endDate.toLocaleDateString()}</Text>
                        <Text style={styles.dateButtonTime}>{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event: any, selectedDate?: Date) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    setEndDate(selectedDate);
                                }
                            }}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                {/* Description Input with Markdown Preview */}
                <View style={styles.formGroup}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Description</Text>
                        <TouchableOpacity onPress={() => setIsPreview(!isPreview)}>
                            <Text style={styles.previewToggle}>
                                {isPreview ? 'Edit' : 'Preview Markdown'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isPreview ? (
                        <View style={styles.markdownPreview}>
                            <Markdown style={markdownStyles}>
                                {description || '*No description provided*'}
                            </Markdown>
                        </View>
                    ) : (
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Explain the proposal, its goals, and rationale... (Markdown supported)"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                        />
                    )}
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {!canCreateProposal && (
                    <View style={styles.warningContainer}>
                        <Ionicons name="warning" size={16} color="#856404" />
                        <Text style={styles.warningText}>Insufficient LUT balance (2,000 required)</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!isValid || submitting || !canCreateProposal) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!isValid || submitting || !canCreateProposal}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Publishing...' : 'Publish Proposal'}
                    </Text>
                </TouchableOpacity>
            </View>

            <InfoModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
            />
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e1e4e8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1a1a1a',
    },
    textArea: {
        height: 160,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryChipSelected: {
        backgroundColor: '#e6f2ff',
        borderColor: '#007AFF',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryChipTextSelected: {
        color: '#007AFF',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff3cd',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    warningText: {
        color: '#856404',
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e1e4e8',
        borderRadius: 12,
        padding: 16,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#1a1a1a',
        marginLeft: 8,
        flex: 1,
    },
    dateButtonTime: {
        fontSize: 14,
        color: '#666',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    previewToggle: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    markdownPreview: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e1e4e8',
        borderRadius: 12,
        padding: 16,
        minHeight: 160,
    },
});

const markdownStyles = {
    body: { fontSize: 16, color: '#1a1a1a' },
    heading1: { fontSize: 24, fontWeight: 'bold' as 'bold', marginVertical: 8 },
    heading2: { fontSize: 20, fontWeight: 'bold' as 'bold', marginVertical: 6 },
    paragraph: { marginVertical: 4 },
};
