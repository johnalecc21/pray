import { Component } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, NativeModules } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../lib/theme';
import { userGradient } from '../../feed/utils';
import type { NearbyUser } from '../types';

// ── Guarded require ──────────────────────────────────────────────────────────
// Only require maplibre when its native module is actually compiled into the
// APK. Skipping the require entirely prevents the maybeHijackSafeAreaProvider
// crash that happens during JS module initialization when the native side is
// absent (e.g. before running `npx expo run:android` after npm install).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ML: any = null;
if (NativeModules.MLRNModule != null) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@maplibre/maplibre-react-native');
    ML = mod?.default ?? mod;
  } catch { /* should not happen if MLRNModule is present, but guard anyway */ }
}

// CARTO Dark Matter — free, no API key needed
const DARK_STYLE  = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
// Default center [longitude, latitude] — change to your city
const DEFAULT_CENTER: [number, number] = [-74.072, 4.711];

const VIBE_COLORS: Record<string, string> = {
  Hot:        colors.pride.orange,
  Dating:     colors.pride.pink,
  Fiesta:     colors.pride.orange,
  Amistad:    colors.pride.blue,
  Networking: colors.pride.green,
};

interface Props {
  users:         NearbyUser[];
  userLocation:  { latitude: number; longitude: number } | null;
  hotModeActive: boolean;
  onSelectUser:  (user: NearbyUser) => void;
}

// ── User marker ──────────────────────────────────────────────────────────────
function UserMarker({ user, onPress }: { user: NearbyUser; onPress: () => void }) {
  const gradient  = userGradient(user.id) as [string, string];
  const ringColor = user.hot_mode
    ? colors.pride.orange
    : (VIBE_COLORS[user.vibe ?? ''] ?? colors.pride.pink);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.markerWrap}>
        <View style={[styles.markerBubble, { borderColor: ringColor }]}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.markerImg} />
          ) : (
            <LinearGradient colors={gradient} style={styles.markerGrad}>
              <Text style={styles.markerInitial}>{(user.name ?? '?')[0].toUpperCase()}</Text>
            </LinearGradient>
          )}
          {user.online && <View style={styles.onlineDot} />}
        </View>
        <View style={[styles.markerTail, { borderTopColor: ringColor }]} />
        <View style={styles.nameBubble}>
          <Text style={styles.nameText} numberOfLines={1}>{user.name ?? 'Usuario'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Expo Go fallback ─────────────────────────────────────────────────────────
function MapUnavailable() {
  return (
    <View style={[styles.container, styles.fallback]}>
      <Ionicons name="map-outline" size={36} color={colors.mutedForeground} />
      <Text style={styles.fallbackTitle}>Mapa disponible en el build de desarrollo</Text>
      <Text style={styles.fallbackSub}>
        Ejecuta{' '}
        <Text style={styles.fallbackCode}>npx expo run:android</Text>
        {' '}para activar el mapa real
      </Text>
    </View>
  );
}

// ── Error boundary — catches MapLibre native-module crashes at render time ────
class MapBoundary extends Component<
  { children: React.ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) return <MapUnavailable />;
    return this.props.children;
  }
}

// ── Inner map — rendered only when ML loaded, wrapped by boundary ─────────────
function MLMap({ users, userLocation, hotModeActive, onSelectUser }: Props) {
  const mapUsers = users.filter(u => u.latitude != null && u.longitude != null);
  const center: [number, number] = userLocation
    ? [userLocation.longitude, userLocation.latitude]
    : DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      <ML.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={DARK_STYLE}
        logoEnabled={false}
        attributionEnabled
        attributionPosition={{ bottom: 4, right: 4 }}
        compassEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <ML.Camera
          centerCoordinate={center}
          zoomLevel={14}
          animationMode="none"
        />

        <ML.UserLocation visible />

        {mapUsers.map(user => (
          <ML.MarkerView
            key={user.id}
            coordinate={[user.longitude!, user.latitude!]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <UserMarker user={user} onPress={() => onSelectUser(user)} />
          </ML.MarkerView>
        ))}
      </ML.MapView>

      {mapUsers.length > 0 && (
        <View style={styles.countBadge}>
          <View style={[
            styles.countDot,
            { backgroundColor: hotModeActive ? colors.pride.orange : colors.pride.pink },
          ]} />
          <Text style={styles.countText}>
            {mapUsers.length} persona{mapUsers.length !== 1 ? 's' : ''} en el mapa
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function MapViewComponent(props: Props) {
  if (!ML) return <MapUnavailable />;
  return (
    <MapBoundary>
      <MLMap {...props} />
    </MapBoundary>
  );
}

const styles = StyleSheet.create({
  container: { width: Dimensions.get('window').width, height: 300, backgroundColor: '#0f0f17' },

  // Expo Go fallback
  fallback:      { alignItems: 'center', justifyContent: 'center', gap: 10 },
  fallbackTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, textAlign: 'center', paddingHorizontal: 32 },
  fallbackSub:   { fontSize: 12, color: colors.mutedForeground, textAlign: 'center', lineHeight: 18, paddingHorizontal: 32 },
  fallbackCode:  { color: colors.pride.pink },

  // Marker
  markerWrap:    { alignItems: 'center' },
  markerBubble: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 2.5,
    overflow: 'hidden', backgroundColor: colors.card,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 5, elevation: 8,
  },
  markerImg:     { width: '100%', height: '100%' },
  markerGrad:    { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  markerInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', top: 2, right: 2, width: 10, height: 10,
    borderRadius: 5, backgroundColor: colors.pride.green,
    borderWidth: 1.5, borderColor: colors.card,
  },
  markerTail: {
    width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -0.5,
  },
  nameBubble: {
    marginTop: 3, paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.75)', maxWidth: 80,
  },
  nameText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // Count badge
  countBadge: {
    position: 'absolute', bottom: 12, left: 12, flexDirection: 'row',
    alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  countDot:  { width: 7, height: 7, borderRadius: 3.5 },
  countText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
