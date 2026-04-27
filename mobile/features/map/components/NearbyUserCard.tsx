import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../lib/theme';
import { userGradient } from '../../feed/utils';
import type { NearbyUser } from '../types';

const VIBE_COLORS: Record<string, string> = {
  Hot:        colors.pride.orange,
  Dating:     colors.pride.pink,
  Fiesta:     colors.pride.orange,
  Amistad:    colors.pride.blue,
  Networking: colors.pride.green,
};

interface Props {
  user:     NearbyUser;
  onPress:  () => void;
  onLike?:  () => void;
  size:     number;
}

export function NearbyUserCard({ user, onPress, onLike, size }: Props) {
  const gradient  = userGradient(user.id) as [string, string];
  const vibeColor = user.hot_mode
    ? colors.pride.orange
    : (VIBE_COLORS[user.vibe ?? ''] ?? colors.pride.purple);
  const distLabel = user.distance_km == null
    ? null
    : user.distance_km < 1
      ? `${Math.round(user.distance_km * 1000)}m`
      : `${user.distance_km.toFixed(1)}km`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width: size, height: size }]}
    >
      {/* Background: avatar or gradient */}
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFillObject} />
      )}

      {/* Online indicator */}
      {user.online && (
        <View style={styles.onlineDot} />
      )}

      {/* Vibe badge */}
      {user.vibe && (
        <View style={[styles.vibeBadge, { backgroundColor: `${vibeColor}30`, borderColor: `${vibeColor}55` }]}>
          {user.hot_mode && <Ionicons name="flame" size={8} color={vibeColor} />}
          <Text style={[styles.vibeText, { color: vibeColor }]}>
            {user.hot_mode ? 'Hot' : user.vibe}
          </Text>
        </View>
      )}

      {/* Bottom info */}
      <LinearGradient
        colors={['transparent', 'rgba(1,1,3,0.88)']}
        style={styles.bottomGrad}
      >
        <Text style={styles.name} numberOfLines={1}>
          {user.name ?? 'Usuario'}
          {user.age != null && <Text style={styles.age}> {user.age}</Text>}
        </Text>
        {distLabel && (
          <View style={styles.distRow}>
            <Ionicons name="location-outline" size={9} color="rgba(255,255,255,0.6)" />
            <Text style={styles.dist}>{distLabel}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Like button (optional) */}
      {onLike && (
        <TouchableOpacity
          onPress={onLike}
          style={styles.likeBtn}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="heart-outline" size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:       { borderRadius: 20, overflow: 'hidden', backgroundColor: colors.secondary, position: 'relative' },
  onlineDot:  { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pride.green, borderWidth: 1.5, borderColor: colors.background, zIndex: 10 },
  vibeBadge:  { position: 'absolute', top: 9, left: 9, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, borderWidth: 1, zIndex: 10 },
  vibeText:   { fontSize: 9, fontWeight: '700' },
  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 20 },
  name:       { fontSize: 12, fontWeight: '800', color: '#fff' },
  age:        { fontWeight: '400', opacity: 0.8 },
  distRow:    { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  dist:       { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  likeBtn:    { position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
