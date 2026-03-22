import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Geo = { lat: number; lng: number };

type ServiceLayer = 'police' | 'hospital' | 'fire';

const INITIAL_COORDS: Geo = { lat: 40.7282, lng: -73.7949 };
const MAX_UNCERTAINTY_METERS = 10;

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMeters = (a: Geo, b: Geo) => {
  const earthRadius = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(h)));
};

const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    body { background: #eaf2ef; }
    .leaflet-control-attribution { font-size: 11px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([40.7282, -73.7949], 14);

    // Avoid direct OSM volunteer tile servers in apps: they may block no-referrer traffic.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const userCircle = L.circle([40.7282, -73.7949], {
      radius: 90,
      color: '#5e62ff',
      fillColor: '#5e62ff',
      fillOpacity: 0.18,
      weight: 1.5,
    }).addTo(map);

    const userMarker = L.circleMarker([40.7282, -73.7949], {
      radius: 7,
      color: '#ffffff',
      fillColor: '#5e62ff',
      fillOpacity: 1,
      weight: 3,
    }).addTo(map).bindPopup('Position Safecall');

    function icon(color, glyph) {
      return L.divIcon({
        html: '<div style="width:30px;height:30px;border-radius:15px;background:'+color+';display:flex;align-items:center;justify-content:center;color:white;font-size:15px;font-weight:700;box-shadow:0 6px 14px rgba(0,0,0,.28)">'+glyph+'</div>',
        iconSize: [30, 30],
        className: ''
      });
    }

    const layers = {
      police: L.layerGroup([
        L.marker([40.734, -73.799], { icon: icon('#20bf55', 'P') }).bindPopup('Poste de police'),
        L.marker([40.726, -73.786], { icon: icon('#20bf55', 'P') }).bindPopup('Police sectorielle')
      ]),
      hospital: L.layerGroup([
        L.marker([40.722, -73.808], { icon: icon('#0ea5e9', 'H') }).bindPopup('Hopital urgent'),
        L.marker([40.739, -73.789], { icon: icon('#0ea5e9', 'H') }).bindPopup('Clinique 24/7')
      ]),
      fire: L.layerGroup([
        L.marker([40.731, -73.812], { icon: icon('#f97316', 'F') }).bindPopup('Caserne de pompiers')
      ])
    };

    Object.values(layers).forEach((layer) => layer.addTo(map));

    window.setUserLocation = function(lat, lng, shouldCenter) {
      const coords = [lat, lng];
      userMarker.setLatLng(coords);
      userCircle.setLatLng(coords);
      if (shouldCenter) {
        map.setView(coords, Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
      }
    };

    window.centerUser = function() {
      const c = userMarker.getLatLng();
      map.setView([c.lat, c.lng], Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
    };

    window.setLayerVisible = function(layerName, visible) {
      const layer = layers[layerName];
      if (!layer) return;
      if (visible) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
      }
    };
  </script>
</body>
</html>
`;

export default function MapScreen() {
  const webRef = useRef<WebView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastPreciseRef = useRef<Geo>(INITIAL_COORDS);
  const lastReverseRef = useRef<{ coords: Geo; at: number } | null>(null);

  const [coords, setCoords] = useState<Geo>(INITIAL_COORDS);
  const [followMode, setFollowMode] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [preciseFix, setPreciseFix] = useState(false);
  const [zoneName, setZoneName] = useState('Recherche de zone...');
  const [placeName, setPlaceName] = useState('Lieu en cours de detection');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [layers, setLayers] = useState({ police: true, hospital: true, fire: true });

  const injectedFirstLoad = useMemo(
    () => `
      window.setTimeout(function () {
        window.setUserLocation(${coords.lat}, ${coords.lng}, true);
      }, 200);
      true;
    `,
    [coords.lat, coords.lng]
  );

  const pushLocationToMap = useCallback((next: Geo, shouldCenter: boolean) => {
    webRef.current?.injectJavaScript(`window.setUserLocation(${next.lat}, ${next.lng}, ${shouldCenter ? 'true' : 'false'}); true;`);
  }, []);

  const isPreciseEnough = useCallback((accuracy: number | null | undefined) => {
    return typeof accuracy === 'number' && accuracy <= MAX_UNCERTAINTY_METERS;
  }, []);

  const shouldRefreshArea = useCallback((next: Geo) => {
    const previous = lastReverseRef.current;
    if (!previous) {
      return true;
    }

    const elapsed = Date.now() - previous.at;
    if (elapsed < 10000) {
      return false;
    }

    return distanceMeters(previous.coords, next) >= 60;
  }, []);

  const resolveAreaName = useCallback(async (target: Geo) => {
    setResolvingAddress(true);

    try {
      const nativeResult = await Location.reverseGeocodeAsync({
        latitude: target.lat,
        longitude: target.lng,
      });

      const first = nativeResult[0];
      if (first) {
        const zone =
          first.district || first.subregion || first.city || first.region || first.country || 'Zone inconnue';
        const place = first.name || first.street || first.city || 'Lieu non identifie';
        setZoneName(zone);
        setPlaceName(place);
      }

      // If native geocoder is too generic, use Nominatim as a richer fallback.
      if (!first?.district && !first?.name) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${target.lat}&lon=${target.lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'fr',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const address = data?.address ?? {};
          const zoneFallback =
            address.neighbourhood ||
            address.suburb ||
            address.city_district ||
            address.quarter ||
            address.city ||
            address.town ||
            address.village ||
            'Zone inconnue';

          const placeFallback =
            data?.name ||
            address.amenity ||
            address.road ||
            (typeof data?.display_name === 'string' ? data.display_name.split(',')[0] : null) ||
            'Lieu non identifie';

          setZoneName(zoneFallback);
          setPlaceName(placeFallback);
        }
      }
    } catch {
      setZoneName('Zone indisponible');
      setPlaceName('Impossible de resoudre le lieu');
    } finally {
      setResolvingAddress(false);
      lastReverseRef.current = { coords: target, at: Date.now() };
    }
  }, []);

  const acquireBestFix = useCallback(async () => {
    let best: Location.LocationObject | null = null;

    for (let i = 0; i < 4; i += 1) {
      const candidate = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (!best) {
        best = candidate;
      } else {
        const bestAcc = best.coords.accuracy ?? Number.POSITIVE_INFINITY;
        const candidateAcc = candidate.coords.accuracy ?? Number.POSITIVE_INFINITY;
        if (candidateAcc < bestAcc) {
          best = candidate;
        }
      }

      if (isPreciseEnough(candidate.coords.accuracy)) {
        return candidate;
      }
    }

    return best;
  }, [isPreciseEnough]);

  const startLiveTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setAccessBlocked(true);
      return false;
    }

    setAccessBlocked(false);

    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // Keep going with GPS only if network provider cannot be forced.
      }
    }

    const current = await acquireBestFix();
    if (!current) {
      return false;
    }

    const next = { lat: current.coords.latitude, lng: current.coords.longitude };
    const currentAccuracy = current.coords.accuracy ?? null;
    setAccuracyMeters(currentAccuracy);

    const goodFix = isPreciseEnough(currentAccuracy);
    setPreciseFix(goodFix);

    if (goodFix) {
      setCoords(next);
      lastPreciseRef.current = next;
      pushLocationToMap(next, true);
      if (shouldRefreshArea(next)) {
        resolveAreaName(next);
      }
    }

    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1000,
      },
      (update) => {
        const uncertainty = update.coords.accuracy ?? null;
        setAccuracyMeters(uncertainty);

        const accepted = isPreciseEnough(uncertainty);
        setPreciseFix(accepted);

        const latest = {
          lat: update.coords.latitude,
          lng: update.coords.longitude,
        };

        if (accepted) {
          setCoords(latest);
          lastPreciseRef.current = latest;
          pushLocationToMap(latest, followMode);
          if (shouldRefreshArea(latest)) {
            resolveAreaName(latest);
          }
        }
      }
    );

    return true;
  }, [acquireBestFix, followMode, isPreciseEnough, pushLocationToMap, resolveAreaName, shouldRefreshArea]);

  useEffect(() => {
    setLoadingLocation(true);
    startLiveTracking().finally(() => setLoadingLocation(false));

    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
    };
  }, [startLiveTracking]);

  useEffect(() => {
    if (followMode) {
      webRef.current?.injectJavaScript('window.centerUser(); true;');
    }
  }, [followMode]);

  const toggleLayer = (name: ServiceLayer) => {
    setLayers((prev) => {
      const visible = !prev[name];
      webRef.current?.injectJavaScript(`window.setLayerVisible('${name}', ${visible ? 'true' : 'false'}); true;`);
      return { ...prev, [name]: visible };
    });
  };

  return (
    <View style={styles.page}>
      <View style={styles.mapFrame}>
        <WebView
          ref={webRef}
          source={{ html: leafletHtml }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScriptBeforeContentLoaded={injectedFirstLoad}
          startInLoadingState
          style={styles.webview}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>Controle OSM + Leaflet</Text>
        <Text style={styles.subtitle}>
          Suivi intelligent, couches services d urgence et centrage temps reel.
        </Text>

        <View style={[styles.precisionCard, preciseFix ? styles.precisionOk : styles.precisionWarn]}>
          <MaterialCommunityIcons
            name={preciseFix ? 'check-decagram' : 'crosshairs-question'}
            size={16}
            color={preciseFix ? '#bdfdd6' : '#ffe4b5'}
          />
          <Text style={styles.precisionText}>
            Precision GPS: {accuracyMeters ? `${Math.round(accuracyMeters)} m` : 'acquisition...'}
            {' - '}
            {preciseFix ? `OK (<= ${MAX_UNCERTAINTY_METERS}m)` : `en attente (objectif <= ${MAX_UNCERTAINTY_METERS}m)`}
          </Text>
        </View>

        {accessBlocked ? (
          <View style={styles.blockedCard}>
            <MaterialCommunityIcons name="lock-alert" size={16} color="#ffd1d1" />
            <Text style={styles.blockedText}>
              Acces localisation bloque. Active la permission pour utiliser le suivi.
            </Text>
            <Pressable style={styles.unblockBtn} onPress={() => Linking.openSettings()}>
              <Text style={styles.unblockText}>Debloquer acces</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.row}>
          <Pressable
            style={[styles.actionBtn, (loadingLocation || accessBlocked) && styles.actionBtnDim]}
            disabled={loadingLocation}
            onPress={async () => {
              setLoadingLocation(true);
              await startLiveTracking();
              setLoadingLocation(false);
            }}>
            <Ionicons name="locate" size={18} color="#fff" />
            <Text style={styles.actionText}>{loadingLocation ? 'Localisation...' : 'Localiser'}</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, !followMode && styles.actionBtnMuted]}
            disabled={accessBlocked}
            onPress={() => setFollowMode((v) => !v)}>
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#fff" />
            <Text style={styles.actionText}>{followMode ? 'Suivi ON' : 'Suivi OFF'}</Text>
          </Pressable>
        </View>

        <View style={styles.layersRow}>
          <Pressable
            style={[styles.layerPill, !layers.police && styles.layerPillOff]}
            onPress={() => toggleLayer('police')}>
            <Text style={styles.layerText}>Police</Text>
          </Pressable>
          <Pressable
            style={[styles.layerPill, !layers.hospital && styles.layerPillOff]}
            onPress={() => toggleLayer('hospital')}>
            <Text style={styles.layerText}>Hopital</Text>
          </Pressable>
          <Pressable
            style={[styles.layerPill, !layers.fire && styles.layerPillOff]}
            onPress={() => toggleLayer('fire')}>
            <Text style={styles.layerText}>Pompiers</Text>
          </Pressable>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>Zone actuelle</Text>
          <Text style={styles.metaValue}>{zoneName}</Text>
          <Text style={styles.metaSub}>
            Lieu reconnu: {resolvingAddress ? 'resolution...' : placeName}
          </Text>
          <Text style={styles.metaCoordinates}>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#edf2f0',
    padding: 14,
    gap: 12,
  },
  mapFrame: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d8e3de',
  },
  webview: {
    flex: 1,
    backgroundColor: '#edf2f0',
  },
  panel: {
    backgroundColor: '#0f1719',
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  title: {
    color: '#ecf6f3',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#b4c4bf',
    fontSize: 13,
    lineHeight: 19,
  },
  precisionCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  precisionOk: {
    backgroundColor: '#153227',
    borderColor: '#24563f',
  },
  precisionWarn: {
    backgroundColor: '#3a2e1a',
    borderColor: '#6d5630',
  },
  precisionText: {
    flex: 1,
    color: '#ebf2ef',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  blockedCard: {
    borderRadius: 12,
    backgroundColor: '#3b1a1a',
    borderWidth: 1,
    borderColor: '#7d3333',
    padding: 10,
    gap: 8,
  },
  blockedText: {
    color: '#ffdede',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  unblockBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef6a6a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  unblockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#1f8d73',
    paddingVertical: 11,
  },
  actionBtnDim: {
    opacity: 0.75,
  },
  actionBtnMuted: {
    backgroundColor: '#556462',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  layersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  layerPill: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1d2a2f',
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#2d4147',
  },
  layerPillOff: {
    opacity: 0.5,
  },
  layerText: {
    color: '#d5e9e2',
    fontWeight: '700',
    fontSize: 12,
  },
  metaCard: {
    marginTop: 2,
    borderRadius: 12,
    backgroundColor: '#182326',
    padding: 10,
  },
  metaTitle: {
    color: '#93ada6',
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    marginTop: 2,
    color: '#e9f7f3',
    fontSize: 15,
    fontWeight: '800',
  },
  metaSub: {
    marginTop: 4,
    color: '#b7d0ca',
    fontSize: 12,
    fontWeight: '700',
  },
  metaCoordinates: {
    marginTop: 6,
    color: '#95b1aa',
    fontSize: 12,
    fontWeight: '600',
  },
});
