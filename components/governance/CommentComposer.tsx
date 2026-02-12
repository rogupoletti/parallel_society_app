import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GOVERNANCE_CONFIG, GOVERNANCE_STRINGS } from '@/core/constants/governance';
import { commentRateLimiter, detectCommentSpam, formatTimeRemaining } from '@/core/utils/governanceUtils';

interface CommentComposerProps {
    replyingTo?: { id: string; authorName: string } | null;
    onSubmit: (text: string, parentId?: string | null) => Promise<void>;
    onCancel?: () => void;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
    replyingTo,
    onSubmit,
    onCancel,
}) => {
    const [text, setText] = useState('');
    const [posting, setPosting] = useState(false);
    const charCount = text.length;
    const maxChars = GOVERNANCE_CONFIG.MAX_COMMENT_LENGTH;

    const handlePost = async () => {
        // Validate
        const spamError = detectCommentSpam(text, GOVERNANCE_CONFIG.MAX_URLS_PER_COMMENT);
        if (spamError) {
            Alert.alert('Cannot Post', spamError);
            return;
        }

        // Rate limit
        if (!commentRateLimiter.canPost()) {
            const remaining = commentRateLimiter.getRemainingTime();
            Alert.alert(
                'Rate Limited',
                `Too many comments. Please wait ${formatTimeRemaining(Date.now() + remaining)}.`
            );
            return;
        }

        setPosting(true);
        try {
            await onSubmit(text.trim(), replyingTo?.id || null);
            commentRateLimiter.record();
            setText('');
            if (onCancel) onCancel(); // close reply mode
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to post comment');
        } finally {
            setPosting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            {replyingTo && (
                <View style={styles.replyingBar}>
                    <Text style={styles.replyingText}>
                        Replying to <Text style={styles.replyingName}>{replyingTo.authorName}</Text>
                    </Text>
                    <TouchableOpacity onPress={onCancel}>
                        <Ionicons name="close" size={18} color="#999" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder={replyingTo ? 'Write a reply...' : 'Add to the discussion...'}
                    placeholderTextColor="#999"
                    multiline
                    maxLength={maxChars}
                    value={text}
                    onChangeText={setText}
                    editable={!posting}
                />
                <TouchableOpacity
                    style={[
                        styles.postButton,
                        (!text.trim() || posting) && styles.postButtonDisabled,
                    ]}
                    onPress={handlePost}
                    disabled={!text.trim() || posting}
                >
                    <Ionicons
                        name="send"
                        size={18}
                        color={text.trim() && !posting ? '#fff' : '#ccc'}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={[
                    styles.charCount,
                    charCount > maxChars * 0.9 && styles.charCountWarn,
                ]}>
                    {charCount}/{maxChars}
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    replyingBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    replyingText: {
        fontSize: 13,
        color: '#666',
    },
    replyingName: {
        fontWeight: '600',
        color: '#007AFF',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1a1a1a',
        lineHeight: 20,
    },
    postButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    postButtonDisabled: {
        backgroundColor: '#e5e5ea',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    charCount: {
        fontSize: 11,
        color: '#ccc',
    },
    charCountWarn: {
        color: '#dc3545',
    },
});
