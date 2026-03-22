import { StyleSheet, Text, View } from 'react-native';

const timeline = [
  { time: '08:12', title: 'Test capteurs', note: 'Microphone, camera et GPS verifies' },
  { time: '08:37', title: 'Ping centre', note: 'Latence moyenne 108 ms' },
  { time: '09:05', title: 'Simulation SOS', note: 'Escalade desactivee, test valide' },
];

export default function TabTwoScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.topPanel}>
        <Text style={styles.topKicker}>CENTRE OPERATIONS</Text>
        <Text style={styles.topTitle}>Vision temps reel</Text>
        <Text style={styles.topText}>
          Le moteur d evaluation classe les incidents selon mouvement, voix, immobilite et
          contexte geospatial.
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Incidents detectes</Text>
            <Text style={styles.metricValue}>07</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Verifies IA</Text>
            <Text style={styles.metricValue}>05</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Zone prioritaire</Text>
          <Text style={styles.mapSubtitle}>Quartier central - rayon 2.4 km</Text>
          <View style={styles.pinRow}>
            <View style={[styles.pin, { left: 22, top: 18 }]} />
            <View style={[styles.pin, { left: 120, top: 44 }]} />
            <View style={[styles.pin, { left: 196, top: 84 }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Activite recente</Text>
        {timeline.map((item) => (
          <View key={item.time + item.title} style={styles.timelineCard}>
            <Text style={styles.timelineTime}>{item.time}</Text>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{item.title}</Text>
              <Text style={styles.timelineNote}>{item.note}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  topPanel: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 36,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topKicker: {
    color: '#8cd7c8',
    fontSize: 12,
    letterSpacing: 1.7,
    fontWeight: '700',
  },
  topTitle: {
    marginTop: 10,
    color: '#f2faf8',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
  },
  topText: {
    marginTop: 10,
    color: '#a8bcbe',
    lineHeight: 22,
    fontSize: 14,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e6ecea',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  metricLabel: {
    color: '#657270',
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 6,
    color: '#0f1617',
    fontSize: 28,
    fontWeight: '900',
  },
  mapCard: {
    marginTop: 4,
    backgroundColor: '#101719',
    borderRadius: 20,
    padding: 16,
  },
  mapTitle: {
    color: '#f0fbf8',
    fontSize: 18,
    fontWeight: '800',
  },
  mapSubtitle: {
    marginTop: 4,
    color: '#9db3ae',
    fontSize: 13,
  },
  pinRow: {
    marginTop: 14,
    height: 124,
    borderRadius: 14,
    backgroundColor: '#172125',
    position: 'relative',
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#15c4a5',
    shadowColor: '#15c4a5',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  sectionTitle: {
    marginTop: 8,
    color: '#202725',
    fontSize: 19,
    fontWeight: '800',
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e6ecea',
    padding: 14,
    gap: 12,
  },
  timelineTime: {
    color: '#15b899',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: '#19201f',
    fontSize: 15,
    fontWeight: '800',
  },
  timelineNote: {
    marginTop: 2,
    color: '#5d6866',
    fontSize: 13,
    lineHeight: 20,
  },
});
