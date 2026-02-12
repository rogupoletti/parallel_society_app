import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProposalRevisionService } from '@/core/services/api/ProposalRevisionService';
import { GOVERNANCE_STRINGS } from '@/core/constants/governance';
import { ProposalStatus } from '@/core/constants/governance';

interface ProposalEditorProps {
    visible: boolean;
    proposalId: string;
    proposalStatus: ProposalStatus;
    initialTitle: string;
    initialSummary: string;
    initialBody: string;
    onClose: () => void;
    onSave: () => void; // callback to refresh proposal data
}

export const ProposalEditor: React.FC<ProposalEditorProps> = ({
    visible,
    proposalId,
    proposalStatus,
    initialTitle,
    initialSummary,
    initialBody,
    onClose,
    onSave,
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [summary, setSummary] = useState(initialSummary);
    const [body, setBody] = useState(initialBody);
    const [changeNote, setChangeNote] = useState('');
    const [saving, setSaving] = useState(false);

    const requireChangeNote = proposalStatus === 'IN_DISCUSSION';
    const canEditTitle = proposalStatus === 'DRAFT';

    const hasChanges =
        title !== initialTitle || summary !== initialSummary || body !== initialBody;

    const canSave = hasChanges && (!requireChangeNote || changeNote.trim().length > 0);

    const handleSave = async () => {
        if (!canSave) return;

        setSaving(true);
        try {
            await ProposalRevisionService.createRevision(proposalId, {
                title,
                summary,
                bodyMarkdown: body,
                changeNote: changeNote.trim() || 'Initial version',
            });
            onSave();
            onClose();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                        <Text style={styles.cancelText}>{GOVERNANCE_STRINGS.CANCEL}</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{GOVERNANCE_STRINGS.EDIT_PROPOSAL}</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={!canSave || saving}
                        style={styles.headerButton}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Text style={[
                                styles.saveText,
                                (!canSave) && styles.saveTextDisabled,
                            ]}>
                                Save
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollContent}
                    contentContainerStyle={styles.formContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={[styles.input, !canEditTitle && styles.inputDisabled]}
                            value={title}
                            onChangeText={setTitle}
                            editable={canEditTitle}
                            placeholder="Proposal title"
                            placeholderTextColor="#ccc"
                        />
                        {!canEditTitle && (
                            <Text style={styles.hint}>Title can only be edited in Draft</Text>
                        )}
                    </View>

                    {/* Summary */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Summary</Text>
                        <TextInput
                            style={[styles.input, styles.inputMulti]}
                            value={summary}
                            onChangeText={setSummary}
                            multiline
                            numberOfLines={3}
                            placeholder="Brief description of the proposal"
                            placeholderTextColor="#ccc"
                        />
                    </View>

                    {/* Body (Markdown) */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Proposal Text (Markdown)</Text>
                        <TextInput
                            style={[styles.input, styles.inputBody]}
                            value={body}
                            onChangeText={setBody}
                            multiline
                            placeholder="Full proposal text in markdown format..."
                            placeholderTextColor="#ccc"
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Change Note (required during IN_DISCUSSION) */}
                    {requireChangeNote && (
                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Change Note</Text>
                                <Text style={styles.required}>Required</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={changeNote}
                                onChangeText={setChangeNote}
                                placeholder='e.g. "Clarified DID section"'
                                placeholderTextColor="#ccc"
                            />
                            <Text style={styles.hint}>
                                Explain what changed so the community can follow revisions
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerButton: {
        minWidth: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    cancelText: {
        fontSize: 16,
        color: '#666',
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    saveTextDisabled: {
        color: '#ccc',
    },
    scrollContent: {
        flex: 1,
    },
    formContent: {
        padding: 20,
        paddingBottom: 40,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#555',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    required: {
        fontSize: 11,
        fontWeight: '600',
        color: '#dc3545',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e5ea',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1a1a1a',
    },
    inputMulti: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputBody: {
        minHeight: 200,
        textAlignVertical: 'top',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
        lineHeight: 20,
    },
    inputDisabled: {
        backgroundColor: '#f0f0f0',
        color: '#999',
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
});
