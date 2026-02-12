import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StartVoteModalProps {
    visible: boolean;
    proposalTitle: string;
    votingPeriodDays?: number;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export const StartVoteModal: React.FC<StartVoteModalProps> = ({
    visible,
    proposalTitle,
    votingPeriodDays = 7,
    onConfirm,
    onCancel,
    loading = false,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Handle bar */}
                    <View style={styles.handle} />

                    {/* Icon */}
                    <View style={styles.iconCircle}>
                        <Ionicons name="hand-left-outline" size={32} color="#007AFF" />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Start Public Vote?</Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        Once the vote starts, the proposal will be locked and visible to all citizens for the entire voting period.
                    </Text>

                    {/* Detail rows */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Proposal</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{proposalTitle}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Voting Period</Text>
                            <Text style={styles.detailValue}>{votingPeriodDays} Days</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Action</Text>
                            <Text style={styles.detailWarning}>This action cannot be undone</Text>
                        </View>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                        onPress={onConfirm}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.confirmText}>Confirm & Start Vote</Text>
                        )}
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 32,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#d0d0d0',
        borderRadius: 3,
        marginBottom: 20,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eef4ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    detailsContainer: {
        width: '100%',
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    detailLabel: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    detailWarning: {
        fontSize: 14,
        color: '#e8a300',
        fontWeight: '500',
    },
    confirmButton: {
        width: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    confirmButtonDisabled: {
        opacity: 0.6,
    },
    confirmText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    cancelButton: {
        paddingVertical: 8,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
});
