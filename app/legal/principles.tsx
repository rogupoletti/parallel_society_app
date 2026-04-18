import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { TERMS_OF_USE_CONTENT } from './constants';

export default function PrinciplesResult() {
    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.text}>{TERMS_OF_USE_CONTENT}</Text>
            </ScrollView>
        </>
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
    text: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
});
