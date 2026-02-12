import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
    ProposalStatus,
    PROPOSAL_STATUS_LABELS,
    PROPOSAL_STATUS_COLORS,
} from '@/core/constants/governance';

interface ProposalStatusBadgeProps {
    status: ProposalStatus;
    size?: 'small' | 'medium';
}

export const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({
    status,
    size = 'small',
}) => {
    const colors = PROPOSAL_STATUS_COLORS[status] || PROPOSAL_STATUS_COLORS.DRAFT;
    const label = PROPOSAL_STATUS_LABELS[status] || status;

    return (
        <View style={[
            styles.badge,
            { backgroundColor: colors.bg },
            size === 'medium' && styles.badgeMedium,
        ]}>
            <Text style={[
                styles.text,
                { color: colors.text },
                size === 'medium' && styles.textMedium,
            ]}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeMedium: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textMedium: {
        fontSize: 12,
    },
});
