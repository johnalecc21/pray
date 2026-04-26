import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../../lib/theme';
import { userGradient } from '../../feed/utils';
import { moodOptions } from '../../onboarding/data';
import type { MatchUser } from '../types';

const CARD_WIDTH = (Dimensions.get('window').width - 16 * 2 - 8) / 2;

function formatDist(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`;
}

function MatchCard({ match }: { match: MatchUser }) {
  const gradient  = userGradient(match.id);
  const name      = match.name ?? 'Usuario';
  const moodColor = Object.fromEntries(moodOptions.map(m => [m.label, m.color]));
  const dist      = formatDist(match.distance_km);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/user/${match.id}`)}
      activeOpacity={0.88}
      style={styles.card}
    >
      {/* Cover */}
      <View style={styles.cover}>
        {match.avatar_url ? (
          <Image source={{ uri: match.avatar_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFillObject}>
            <View style={styles.initialWrap}>
              <Text style={styles.initial}>{name[0].toUpperCase()}</Text>
            </View>
          </LinearGradient>
        )}
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={[StyleSheet.absoluteFillObject, { top: '40%' as any }]}
        />
        {/* Distance badge */}
        {dist && (
          <View style={styles.distBadge}>
            <Ionicons name="location-outline" size={10} color="#fff" />
            <Text style={styles.distText}>{dist}</Text>
          </View>
        )}
        {/* Name */}
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{name}{match.age ? `, ${match.age}` : ''}</Text>
          {match.moods[0] && (
            <View style={[styles.moodPill, { backgroundColor: `${moodColor[match.moods[0]] ?? colors.primary}40` }]}>
              <Text style={[styles.moodText, { color: moodColor[match.moods[0]] ?? colors.primary }]}>
                {match.moods[0]}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/chat')}
          style={styles.msgBtn}
        >
          <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
          <Text style={styles.msgBtnText}>Mensaje</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  matches:   MatchUser[];
  loading:   boolean;
  onRefresh: () => void;
}

export function MatchesList({ matches, loading, onRefresh }: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!matches.length) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={52} color={colors.mutedForeground} />
        <Text style={styles.emptyTitle}>Sin matches aún</Text>
        <Text style={styles.emptySubtitle}>
          Sigue dando me gusta para encontrar tu match
        </Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.countLabel}>{matches.length} match{matches.length !== 1 ? 'es' : ''}</Text>
      <View style={styles.row}>
        {matches.map(m => <MatchCard key={m.id} match={m} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  grid: {
    padding: 16,
    paddingBottom: 32,
  },
  countLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 0,
  },
  cover: {
    height: 160,
    position: 'relative',
  },
  initialWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 48,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
  },
  distBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 3,
  },
  nameBlock: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 3,
  },
  moodPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  moodText: {
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
});
