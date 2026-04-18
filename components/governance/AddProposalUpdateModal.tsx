import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProposalUpdateStatus, PROPOSAL_UPDATE_STATUSES, ProposalUpdate } from '@/core/types/Proposal';
import { ProposalUpdateService } from '@/core/services/api/ProposalUpdateService';

interface AddProposalUpdateModalProps {
    visible: boolean;
    onClose: () => void;
    proposalId: string;
    onSuccess?: () => void;
    initialData?: ProposalUpdate | null;
}

export function AddProposalUpdateModal({ visible, onClose, proposalId, onSuccess, initialData }: AddProposalUpdateModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<ProposalUpdateStatus>('In Progress');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setSelectedStatus(initialData.status as ProposalUpdateStatus);
                setContent(initialData.content);
            } else {
                setSelectedStatus('In Progress');
                setContent('');
            }
        }
    }, [visible, initialData]);

    const insertFormatting = (format: 'bold' | 'italic' | 'list' | 'link') => {
        switch (format) {
            case 'bold':
                setContent(content + '**bold text**');
                break;
            case 'italic':
                setContent(content + '*italic text*');
                break;
            case 'list':
                setContent(content + '\n- List item');
                break;
            case 'link':
                setContent(content + '[Link text](https://example.com)');
                break;
        }
    };


    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter update details');
            return;
        }

        setLoading(true);
        try {
            if (initialData) {
                await ProposalUpdateService.editProposalUpdate(initialData.id, {
                    proposalId,
                    status: selectedStatus,
                    content: content.trim(),
                });
                Alert.alert('Success', 'Update edited successfully');
            } else {
                await ProposalUpdateService.addProposalUpdate({
                    proposalId,
                    status: selectedStatus,
                    content: content.trim(),
                });
                Alert.alert('Success', 'Update posted successfully');
            }

            setContent('');
            setSelectedStatus('In Progress');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('[AddProposalUpdateModal] Error saving update:', error);
            Alert.alert('Error', error.message || 'Failed to save update');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ProposalUpdateStatus) => {
        switch (status) {
            case 'Completed': return '#28a745';
            case 'In Progress': return '#f59e0b';
            case 'Planning': return '#6c757d';
            case 'Delayed': return '#dc3545';
            case 'Started': return '#10b981';
            default: return '#6c757d';
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{initialData ? 'Edit Status Update' : 'Add Status Update'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Info banner */}
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle" size={16} color="#666" />
                            <Text style={styles.infoText}>
                                This update will be publicly visible to all citizens.
                            </Text>
                        </View>

                        {/* Status selector */}
                        <Text style={styles.label}>Status</Text>
                        <View style={styles.statusButtons}>
                            {PROPOSAL_UPDATE_STATUSES.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.statusButton,
                                        selectedStatus === status && {
                                            backgroundColor: getStatusColor(status),
                                        },
                                    ]}
                                    onPress={() => setSelectedStatus(status)}
                                >
                                    <Text
                                        style={[
                                            styles.statusButtonText,
                                            selectedStatus === status && styles.statusButtonTextActive,
                                        ]}
                                    >
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Update details */}
                        <Text style={styles.label}>Update Details</Text>
                        <View style={styles.textInputContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Share the latest progress on this proposal..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={6}
                                value={content}
                                onChangeText={setContent}
                                textAlignVertical="top"
                            />

                            {/* Formatting toolbar */}
                            <View style={styles.toolbar}>
                                <TouchableOpacity onPress={() => insertFormatting('bold')}>
                                    <Text style={styles.toolbarButton}>B</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => insertFormatting('italic')}>
                                    <Text style={[styles.toolbarButton, { fontStyle: 'italic' }]}>I</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => insertFormatting('list')}>
                                    <Ionicons name="list" size={18} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => insertFormatting('link')}>
                                    <Ionicons name="link" size={18} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </ScrollView>

                    {/* Submit button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>{initialData ? 'Save Changes' : 'Post Update'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        paddingHorizontal: 20,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    statusButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    statusButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    statusButtonText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    statusButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    textInputContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    textArea: {
        padding: 16,
        fontSize: 15,
        minHeight: 120,
        color: '#333',
    },
    toolbar: {
        flexDirection: 'row',
        gap: 16,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    toolbarButton: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        marginHorizontal: 20,
        marginTop: 16,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
