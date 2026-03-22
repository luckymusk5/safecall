import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Protocole Safecall
      </ThemedText>
      <ThemedText style={styles.text}>
        En cas d activation, l application capture les preuves audio-video et demarre
        automatiquement la verification IA avant escalation.
      </ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Retour a l accueil</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
  },
  text: {
    color: '#5b6663',
    lineHeight: 22,
  },
  link: {
    marginTop: 8,
    paddingVertical: 15,
  },
});
