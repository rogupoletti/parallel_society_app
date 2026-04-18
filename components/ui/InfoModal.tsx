import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';

interface InfoModalAction {
    text: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

interface InfoModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    description?: string;
    footerText?: string;
    buttonText?: string;
    onButtonPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonPress?: () => void;
    variant?: 'info' | 'error' | 'success' | 'warning';
    actions?: InfoModalAction[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const InfoModal: React.FC<InfoModalProps> = ({
    visible,
    onClose,
    title,
    message,
    description,
    footerText,
    buttonText = 'OK',
    onButtonPress,
    secondaryButtonText,
    onSecondaryButtonPress,
    variant = 'info',
    actions,
}) => {
    const handlePrimaryPress = () => {
        if (onButtonPress) {
            onButtonPress();
        } else {
            onClose();
        }
    };

    const getPrimaryButtonStyle = () => {
        switch (variant) {
            case 'error': return [styles.button, styles.buttonError];
            case 'success': return [styles.button, styles.buttonSuccess];
            case 'warning': return [styles.button, styles.buttonWarning];
            default: return styles.button;
        }
    };

    const getPrimaryButtonTextStyle = () => {
        switch (variant) {
            case 'error': return [styles.buttonText, styles.buttonTextError];
            case 'success': return [styles.buttonText, styles.buttonTextSuccess];
            default: return styles.buttonText;
        }
    };

    const getVariantButtonStyle = (actionVariant?: string) => {
        switch (actionVariant) {
            case 'danger': return [styles.button, styles.buttonError];
            case 'success': return [styles.button, styles.buttonSuccess];
            case 'secondary': return [styles.button, styles.secondaryButton];
            default: return styles.button;
        }
    };

    const getVariantButtonTextStyle = (actionVariant?: string) => {
        switch (actionVariant) {
            case 'danger': return [styles.buttonText, styles.buttonTextError];
            case 'success': return [styles.buttonText, styles.buttonTextSuccess];
            case 'secondary': return styles.secondaryButtonText;
            default: return styles.buttonText;
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <View style={styles.handle} />

                            <Text style={styles.title}>{title}</Text>

                            <View style={styles.content}>
                                <Text style={styles.message}>{message}</Text>

                                {description && (
                                    <Text style={styles.description}>{description}</Text>
                                )}

                                {footerText && (
                                    <Text style={styles.footerText}>{footerText}</Text>
                                )}
                            </View>

                            <View style={styles.buttonGroup}>
                                {actions ? (
                                    actions.map((action, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={getVariantButtonStyle(action.variant)}
                                            onPress={action.onPress}
                                        >
                                            <Text style={getVariantButtonTextStyle(action.variant)}>
                                                {action.text}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <>
                                        {secondaryButtonText && (
                                            <TouchableOpacity
                                                style={[styles.button, styles.secondaryButton]}
                                                onPress={onSecondaryButtonPress || onClose}
                                            >
                                                <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            style={getPrimaryButtonStyle()}
                                            onPress={handlePrimaryPress}
                                        >
                                            <Text style={getPrimaryButtonTextStyle()}>{buttonText}</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
        textAlign: 'center',
    },
    content: {
        width: '100%',
        marginBottom: 32,
    },
    message: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 24,
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8e8e93',
        textAlign: 'center',
        marginTop: 12,
    },
    buttonGroup: {
        width: '100%',
        gap: 12,
    },
    button: {
        backgroundColor: '#f0f7ff',
        width: '100%',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#e5e5ea',
    },
    buttonError: {
        backgroundColor: '#fff1f0',
    },
    buttonSuccess: {
        backgroundColor: '#f6ffed',
    },
    buttonWarning: {
        backgroundColor: '#fffbe6',
    },
    buttonText: {
        color: '#007AFF',
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 17,
        fontWeight: '600',
    },
    buttonTextError: {
        color: '#ff4d4f',
    },
    buttonTextSuccess: {
        color: '#52c41a',
    },
});
