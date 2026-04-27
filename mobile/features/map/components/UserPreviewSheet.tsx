import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  Animated, Dimensions, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../../lib/theme';
import { userGradient } from '../../feed/utils';
import type { NearbyUser } from '../types';

const SCREEN_H = Dimensions.get('window').height;

const VIBE_COLORS: Record<string, string> = {
  Hot:        colors.pride.orange,
  Dating:     colors.pride.pink,
  Fiesta:     colors.pride.orange,
  Amistad:    colors.pride.blue,
  Networking: colors.pride.green,
};

interface Props {
  user:    NearbyUser;
  onClose: () => void;
  onLike?: () => void;
}

export function UserPreviewSheet({ user, onClose, onLike }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  function close() {
    Animated.timing(slideAnim, {
      toValue: SCREEN_H,
      duration: 200,
      useNativeDriver: true,
    }).start(onClose);
  }

  const gradient   = userGradient(user.id) as [string, string];
  const vibeColor  = user.hot_mode
    ? colors.pride.orange
    : (VIBE_COLORS[user.vibe ?? ''] ?? colors.pride.purple);
  const distLabel  = user.distance_km == null
    ? null
    : user.distance_km < 1
      ? `${Math.round(user.distance_km * 1000)} m`
      : `${user.distance_km.toFixed(1)} km`;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={close}>
        <View style={styles.backdrop} />
      </Pressable>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <LinearGradient colors={gradient} style={styles.avatar} />
            )}
            {user.online && <View style={styles.onlineDot} />}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {user.name ?? 'Usuario'}
                {user.age != null && <Text style={styles.age}> {user.age}</Text>}
              </Text>
              {user.vibe && (
                <View style={[styles.vibeBadge, { backgroundColor: `${vibeColor}22`, borderColor: `${vibeColor}45` }]}>
                  {user.hot_mode && <Ionicons name="flame" size={10} color={vibeColor} />}
                  <Text style={[styles.vibeText, { color: vibeColor }]}>
                    {user.hot_mode ? 'Hot' : user.vibe}
                  </Text>
                </View>
              )}
            </View>

            {user.username && (
              <Text style={styles.username}>@{user.username}</Text>
            )}

            <View style={styles.metaRow}>
              {distLabel && (
                <View style={styles.metaChip}>
                  <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                  <Text style={styles.metaText}>{distLabel}</Text>
                </View>
              )}
              {user.online ? (
                <View style={styles.metaChip}>
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.metaText}>Online</Text>
                </View>
              ) : null}
            </View>

            {user.moods.length > 0 && (
              <View style={styles.moodsRow}>
                {user.moods.slice(0, 3).map(m => (
                  <View key={m} style={styles.moodChip}>
                    <Text style={styles.moodText}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onLike && (
            <TouchableOpacity
              onPress={() => { onLike(); close(); }}
              style={styles.likeBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="heart-outline" size={20} color={colors.pride.pink} />
              <Text style={[styles.btnText, { color: colors.pride.pink }]}>Me gusta</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => { close(); router.push(`/user/${user.id}`); }}
            activeOpacity={0.85}
            style={styles.profileBtn}
          >
            <LinearGradient
              colors={[colors.pride.pink, colors.pride.purple]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.profileBtnInner}
            >
              <Text style={styles.profileBtnText}>Ver perfil</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 32, borderTopWidth: 1, borderColor: colors.border },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 20 },
  content:        { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 20 },
  avatarWrap:     { position: 'relative' },
  avatar:         { width: 80, height: 80, borderRadius: 20 },
  onlineDot:      { position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.pride.green, borderWidth: 2, borderColor: colors.card },
  info:           { flex: 1, justifyContent: 'center', gap: 6 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  name:           { fontSize: 20, fontWeight: '800', color: colors.foreground },
  age:            { fontSize: 18, fontWeight: '400', color: colors.mutedForeground },
  username:       { fontSize: 13, color: colors.mutedForeground },
  vibeBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  vibeText:       { fontSize: 11, fontWeight: '700' },
  metaRow:        { flexDirection: 'row', gap: 8 },
  metaChip:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:       { fontSize: 12, color: colors.mutedForeground },
  onlineIndicator:{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pride.green },
  moodsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  moodChip:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  moodText:       { fontSize: 11, fontWeight: '600', color: colors.foreground },
  actions:        { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  likeBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: colors.secondary, borderWidth: 1, borderColor: `${colors.pride.pink}40` },
  btnText:        { fontSize: 14, fontWeight: '700' },
  profileBtn:     { flex: 1, borderRadius: 18, overflow: 'hidden' },
  profileBtnInner:{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  profileBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
