import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { useNearbyUsers } from '../../features/map/hooks/useNearbyUsers';
import { useMapStats }    from '../../features/map/hooks/useMapStats';
import { useHotMode }     from '../../features/map/hooks/useHotMode';
import { usePresence }    from '../../features/map/hooks/usePresence';

import { MapFilters }       from '../../features/map/components/MapFilters';
import { MapStats }         from '../../features/map/components/MapStats';
import { HotModeToggle }    from '../../features/map/components/HotModeToggle';
import { RadarMap }         from '../../features/map/components/RadarMap';
import { NearbyUserCard }   from '../../features/map/components/NearbyUserCard';
import { UserPreviewSheet } from '../../features/map/components/UserPreviewSheet';

import GradientText from '../../components/ui/GradientText';
import { colors }   from '../../lib/theme';
import type { MapFilter, NearbyUser } from '../../features/map/types';
import { Dimensions } from 'react-native';

const SCREEN_W   = Dimensions.get('window').width;
const CARD_GAP   = 8;
const CARD_COLS  = 3;
const CARD_SIZE  = (SCREEN_W - 40 - CARD_GAP * (CARD_COLS - 1)) / CARD_COLS;

export default function MapScreen() {
  const [filter,       setFilter]       = useState<MapFilter>('Todos');
  const [hotModeOnly,  setHotModeOnly]  = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);

  usePresence();

  const { users, myHotMode, loading, refetch }    = useNearbyUsers(filter, hotModeOnly);
  const { stats, refetch: refetchStats }           = useMapStats();
  const { active: hotMode, toggle: toggleHotMode, pending } = useHotMode(myHotMode);

  useFocusEffect(useCallback(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]));

  function handleToggleHotMode() {
    toggleHotMode();
    // If activating hot mode, switch filter to hot-only view
    if (!hotMode) setHotModeOnly(true);
    else          setHotModeOnly(false);
  }

  // Split users into rows of 3 for the grid
  const rows: NearbyUser[][] = [];
  for (let i = 0; i < users.length; i += CARD_COLS) {
    rows.push(users.slice(i, i + CARD_COLS));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── FIXED HEADER ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <GradientText fontSize={20} fontWeight="800">Mapa</GradientText>
          <HotModeToggle active={hotMode} pending={pending} onToggle={handleToggleHotMode} />
        </View>

        {/* Hot mode status badge */}
        <View style={[
          styles.modeBadge,
          hotMode && { backgroundColor: `${colors.pride.orange}14`, borderColor: `${colors.pride.orange}35` },
        ]}>
          <Ionicons
            name="flame"
            size={13}
            color={hotMode ? colors.pride.orange : colors.mutedForeground}
          />
          <Text style={[styles.modeBadgeText, hotMode && { color: colors.pride.orange }]}>
            {hotMode
              ? 'Visible para personas en Modo Hot cerca de ti'
              : 'Activa Modo Hot para conectar con personas que buscan algo caliente'}
          </Text>
        </View>

        {/* Filters */}
        <MapFilters active={filter} onChange={setFilter} />
      </View>

      {/* ── SCROLLABLE CONTENT ───────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Stats */}
        <MapStats stats={stats} />

        {/* Radar */}
        <View style={styles.radarSection}>
          <View style={styles.radarHeader}>
            <Text style={styles.sectionTitle}>Radar</Text>
            <Text style={styles.radarCaption}>
              {users.length > 0
                ? `${users.length} persona${users.length > 1 ? 's' : ''} cerca`
                : 'Nadie cerca aún'}
            </Text>
          </View>

          {loading ? (
            <View style={styles.radarPlaceholder}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <RadarMap
              users={users}
              hotModeActive={hotMode}
              onSelectUser={setSelectedUser}
            />
          )}
        </View>

        {/* Nearby grid */}
        <View style={styles.gridSection}>
          <View style={styles.gridHeader}>
            <Text style={styles.sectionTitle}>Cerca de ti</Text>
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
                  {row.map(user => (
                    <NearbyUserCard
                      key={user.id}
                      user={user}
                      size={CARD_SIZE}
                      onPress={() => setSelectedUser(user)}
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
  scroll:         { paddingTop: 12, paddingBottom: 40 },
  radarSection:   { marginBottom: 24 },
  radarHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  radarCaption:   { fontSize: 13, color: colors.mutedForeground },
  radarPlaceholder:{ height: 280, alignItems: 'center', justifyContent: 'center' },
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
