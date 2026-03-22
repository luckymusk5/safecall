import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const mapHeight = Math.min(Math.max(height * 0.53, 320), 470);
  const mapWidth = Math.max(width - 32, 300);

  const pulse = useSharedValue(0);
  const core = useSharedValue(0);
  const markerA = useSharedValue(0);
  const markerB = useSharedValue(0);
  const markerC = useSharedValue(0);
  const panelY = useSharedValue(22);
  const searchGlow = useSharedValue(0);
  const cardCarsScale = useSharedValue(1);
  const cardScooterScale = useSharedValue(1);
  const carOneX = useSharedValue(-26);
  const carTwoX = useSharedValue(mapWidth + 28);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.out(Easing.cubic) }),
      -1,
      false
    );
    core.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);

    markerA.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
    markerB.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    markerC.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    panelY.value = withDelay(120, withSpring(0, { damping: 16, stiffness: 120 }));

    searchGlow.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    carOneX.value = -26;
    carOneX.value = withRepeat(
      withTiming(mapWidth + 26, { duration: 5200, easing: Easing.linear }),
      -1,
      false
    );

    carTwoX.value = mapWidth + 28;
    carTwoX.value = withRepeat(
      withTiming(-28, { duration: 5600, easing: Easing.linear }),
      -1,
      false
    );
  }, [
    carOneX,
    carTwoX,
    core,
    mapWidth,
    markerA,
    markerB,
    markerC,
    panelY,
    pulse,
    searchGlow,
  ]);

  const pulseOuterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.85]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.32, 0]),
  }));

  const pulseInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(core.value, [0, 1], [0.92, 1.08]) }],
  }));

  const markerStyleA = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(markerA.value, [0, 1], [0, -6]) }],
  }));

  const markerStyleB = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(markerB.value, [0, 1], [0, -8]) }],
  }));

  const markerStyleC = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(markerC.value, [0, 1], [0, -7]) }],
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelY.value }],
  }));

  const searchStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(searchGlow.value, [0, 1], ['#e4e8e7', '#c7f0d2']),
  }));

  const carsCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardCarsScale.value }],
  }));

  const scooterCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScooterScale.value }],
  }));

  const carOneStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: carOneX.value }],
  }));

  const carTwoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: carTwoX.value }],
  }));

  const horizontalCount = Math.max(7, Math.floor(mapHeight / 48));
  const verticalCount = Math.max(6, Math.floor(mapWidth / 58));

  return (
    <View style={styles.screen}>
      <Animated.View entering={FadeInUp.duration(520).springify()} style={[styles.mapArea, { height: mapHeight, paddingTop: Math.max(14, height * 0.015) }]}>
        <View style={styles.mapGridWrap}>
          {Array.from({ length: horizontalCount }).map((_, row) => (
            <View key={`r-${row}`} style={[styles.roadHorizontal, { top: 24 + row * 52 }]} />
          ))}
          {Array.from({ length: verticalCount }).map((_, col) => (
            <View key={`c-${col}`} style={[styles.roadVertical, { left: 24 + col * 54 }]} />
          ))}

          <Animated.View style={[styles.marker, markerStyleA, { top: mapHeight * 0.29, left: mapWidth * 0.2 }]}> 
            <MaterialCommunityIcons name="police-badge" size={14} color="#ffffff" />
          </Animated.View>
          <Animated.View style={[styles.marker, markerStyleB, { top: mapHeight * 0.47, left: mapWidth * 0.54 }]}> 
            <MaterialCommunityIcons name="ambulance" size={15} color="#ffffff" />
          </Animated.View>
          <Animated.View style={[styles.marker, markerStyleC, { top: mapHeight * 0.68, left: mapWidth * 0.32 }]}> 
            <MaterialCommunityIcons name="fire-truck" size={15} color="#ffffff" />
          </Animated.View>

          <Animated.View style={[styles.mapCar, carOneStyle, { top: mapHeight * 0.42 }]}>
            <Ionicons name="car-sport" size={15} color="#5e666d" />
          </Animated.View>
          <Animated.View style={[styles.mapCar, carTwoStyle, { top: mapHeight * 0.74 }]}>
            <Ionicons name="car-sport" size={15} color="#5e666d" />
          </Animated.View>

          <Animated.View style={[styles.pulseOuter, pulseOuterStyle]} />
          <Animated.View style={[styles.pulseInner, pulseInnerStyle]} />

          <View style={styles.userChip}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>S</Text>
            </View>
            <View>
              <Text style={styles.locationTitle}>Your location</Text>
              <Text style={styles.locationValue}>Queens, NY 113</Text>
            </View>
            <View style={styles.menuIcon}>
              <Ionicons name="grid" size={18} color="#2d3337" />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(650).springify()} style={[styles.panel, panelStyle]}>
        <Text style={styles.greeting}>Hello there, Shahid!</Text>

        <View style={styles.cardsRow}>
          <Pressable
            onPressIn={() => {
              cardCarsScale.value = withTiming(0.96, { duration: 110 });
            }}
            onPressOut={() => {
              cardCarsScale.value = withSpring(1, { damping: 14, stiffness: 170 });
            }}
            style={styles.cardPressable}>
            <Animated.View style={[styles.vehicleCard, carsCardStyle]}>
              <MaterialCommunityIcons name="car-sports" size={30} color="#6f767e" />
              <Text style={styles.vehicleTitle}>Cars</Text>
              <Text style={styles.vehicleSub}>Ride with favorite car</Text>
            </Animated.View>
          </Pressable>

          <Pressable
            onPressIn={() => {
              cardScooterScale.value = withTiming(0.96, { duration: 110 });
            }}
            onPressOut={() => {
              cardScooterScale.value = withSpring(1, { damping: 14, stiffness: 170 });
            }}
            style={styles.cardPressable}>
            <Animated.View style={[styles.vehicleCard, scooterCardStyle]}>
              <MaterialCommunityIcons name="scooter" size={30} color="#60a85f" />
              <Text style={styles.vehicleTitle}>Scooters</Text>
              <Text style={styles.vehicleSub}>Ride with favorite scooter</Text>
            </Animated.View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/map')}
          onPressIn={() => {
            searchGlow.value = withTiming(1, { duration: 100 });
          }}
          onPressOut={() => {
            searchGlow.value = withRepeat(
              withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
              -1,
              true
            );
          }}>
          <Animated.View style={[styles.searchBar, searchStyle]}>
            <Ionicons name="rocket" size={20} color="#31b45e" />
            <Text style={styles.searchText}>Lancer carte OSM + Leaflet</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f4f3',
    overflow: 'hidden',
  },
  mapArea: {
    paddingHorizontal: 16,
  },
  mapGridWrap: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#edf0ee',
    overflow: 'hidden',
    position: 'relative',
  },
  roadHorizontal: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 4,
    backgroundColor: '#d7dedb',
    transform: [{ rotate: '-14deg' }],
  },
  roadVertical: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 4,
    backgroundColor: '#d9dfdd',
    transform: [{ rotate: '-12deg' }],
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#24c04f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0c8f31',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  mapCar: {
    position: 'absolute',
    width: 24,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 88,
    height: 88,
    borderRadius: 44,
    marginTop: -44,
    marginLeft: -44,
    backgroundColor: 'rgba(115, 105, 241, 0.2)',
  },
  pulseInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -8,
    marginLeft: -8,
    backgroundColor: '#5f58f5',
    borderWidth: 2,
    borderColor: '#dad8ff',
  },
  userChip: {
    position: 'absolute',
    top: 18,
    left: 14,
    right: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#59b85f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  locationTitle: {
    fontSize: 11,
    color: '#7d8589',
    fontWeight: '600',
  },
  locationValue: {
    marginTop: 1,
    fontSize: 14,
    color: '#1a2024',
    fontWeight: '700',
  },
  menuIcon: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f3f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    flex: 1,
    backgroundColor: '#a7afb6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -18,
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  greeting: {
    color: '#eef2f5',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardPressable: {
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: '#eef0f1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    minHeight: 128,
    justifyContent: 'flex-end',
  },
  vehicleTitle: {
    marginTop: 8,
    color: '#263036',
    fontSize: 26,
    fontWeight: '800',
  },
  vehicleSub: {
    marginTop: 2,
    color: '#727a80',
    fontSize: 12,
    fontWeight: '600',
  },
  searchBar: {
    marginTop: 16,
    backgroundColor: '#eef0f1',
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#e4e8e7',
    paddingHorizontal: 14,
    height: 54,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  searchText: {
    color: '#5c666d',
    fontSize: 17,
    fontWeight: '600',
  },
});
