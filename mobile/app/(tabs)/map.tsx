import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

import { useAuth }        from '../../context/AuthContext';
import { useNearbyUsers } from '../../features/map/hooks/useNearbyUsers';
import { useMapStats }    from '../../features/map/hooks/useMapStats';
import { useHotMode }     from '../../features/map/hooks/useHotMode';
import { usePresence }    from '../../features/map/hooks/usePresence';

import { MapFilters }        from '../../features/map/components/MapFilters';
import { MapStats }          from '../../features/map/components/MapStats';
import { HotModeToggle }     from '../../features/map/components/HotModeToggle';
import { MapViewComponent }  from '../../features/map/components/MapViewComponent';
import { NearbyUserCard }    from '../../features/map/components/NearbyUserCard';
import { UserPreviewSheet }  from '../../features/map/components/UserPreviewSheet';

import GradientText from '../../components/ui/GradientText';
import { colors }   from '../../lib/theme';
import type { MapFilter, NearbyUser } from '../../features/map/types';

const SCREEN_W  = Dimensions.get('window').width;
const CARD_GAP  = 8;
const CARD_COLS = 3;
const CARD_SIZE = (SCREEN_W - 40 - CARD_GAP * (CARD_COLS - 1)) / CARD_COLS;

export default function MapScreen() {
  const [filter,       setFilter]       = useState<MapFilter>('Todos');
  const [hotModeOnly,  setHotModeOnly]  = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { user } = useAuth();
  usePresence();

  const { users, myHotMode, loading, refetch }          = useNearbyUsers(filter, hotModeOnly);
  const { stats, refetch: refetchStats }                 = useMapStats();
  const { active: hotMode, toggle: toggleHotMode, pending } = useHotMode(myHotMode);

  // Get device location once on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // Refetch when a different account logs in (fixes blank map after account switch)
  useEffect(() => {
    if (user?.id) {
      refetch();
      refetchStats();
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]));

  function handleToggleHotMode() {
    toggleHotMode();
    if (!hotMode) setHotModeOnly(true);
    else          setHotModeOnly(false);
  }

  const rows: NearbyUser[][] = [];
  for (let i = 0; i < users.length; i += CARD_COLS) {
    rows.push(users.slice(i, i + CARD_COLS));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <GradientText fontSize={20} fontWeight="800">Mapa</GradientText>
          <HotModeToggle active={hotMode} pending={pending} onToggle={handleToggleHotMode} />
        </View>

        <View style={[
          styles.modeBadge,
          hotMode && { backgroundColor: `${colors.pride.orange}14`, borderColor: `${colors.pride.orange}35` },
        ]}>
          <Ionicons name="flame" size={13} color={hotMode ? colors.pride.orange : colors.mutedForeground} />
          <Text style={[styles.modeBadgeText, hotMode && { color: colors.pride.orange }]}>
            {hotMode
              ? 'Visible para personas en Modo Hot cerca de ti'
              : 'Activa Modo Hot para conectar con personas que buscan algo caliente'}
          </Text>
        </View>

        <MapFilters active={filter} onChange={setFilter} />
      </View>

      {/* ── REAL MAP ─────────────────────────────────────────────── */}
      {loading && !users.length ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <MapViewComponent
          users={users}
          userLocation={userLocation}
          hotModeActive={hotMode}
          onSelectUser={setSelectedUser}
        />
      )}

      {/* ── SCROLLABLE LIST ──────────────────────────────────────── */}
      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {/* Stats */}
        <MapStats stats={stats} />

        {/* Nearby grid */}
        <View style={styles.gridSection}>
          <View style={styles.gridHeader}>
            <Text style={styles.sectionTitle}>
              {users.length > 0
                ? `${users.length} persona${users.length !== 1 ? 's' : ''} cerca`
                : 'Cerca de ti'}
            </Text>
            {!loading && (
              <TouchableOpacity onPress={refetch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : users.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌎</Text>
              <Text style={styles.emptyTitle}>Nadie cerca aún</Text>
              <Text style={styles.emptySubtitle}>
                {hotModeOnly
                  ? 'No hay personas en Modo Hot cerca de ti'
                  : 'Prueba cambiando el filtro o vuelve más tarde'}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {rows.map((row, ri) => (
                <View key={ri} style={styles.gridRow}>
                  {row.map(u => (
                    <NearbyUserCard
                      key={u.id}
                      user={u}
                      size={CARD_SIZE}
                      onPress={() => setSelectedUser(u)}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Safety note */}
        <View style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.mutedForeground} />
          <Text style={styles.safetyText}>
            El Modo Hot es completamente consensuado. Solo conectas con personas que también lo tienen activo.
            Tu ubicación exacta nunca se comparte.
          </Text>
        </View>
      </ScrollView>

      {/* ── USER PREVIEW SHEET ───────────────────────────────────── */}
      {selectedUser && (
        <UserPreviewSheet
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  header:         { paddingTop: 6, paddingBottom: 12, gap: 10 },
  headerTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  modeBadge:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 20, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  modeBadgeText:  { flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
  mapPlaceholder: { width: SCREEN_W, height: 300, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f17' },
  listScroll:     { flex: 1 },
  listContent:    { paddingTop: 12, paddingBottom: 40 },
  gridSection:    { paddingHorizontal: 20, marginBottom: 16 },
  gridHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  grid:           { gap: CARD_GAP },
  gridRow:        { flexDirection: 'row', gap: CARD_GAP },
  sectionTitle:   { fontSize: 15, fontWeight: '800', color: colors.foreground },
  centered:       { height: 120, alignItems: 'center', justifyContent: 'center' },
  empty:          { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji:     { fontSize: 40 },
  emptyTitle:     { fontSize: 16, fontWeight: '800', color: colors.foreground },
  emptySubtitle:  { fontSize: 13, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  safetyNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 20, marginTop: 8 },
  safetyText:     { flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
});
