import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Share, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { usePublicProfile } from '../../features/profile/hooks/usePublicProfile';
import { userGradient } from '../../features/feed/utils';
import { colors, prideGradient } from '../../lib/theme';
import { interestOptions, moodOptions, identityOptions } from '../../features/onboarding/data';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE   = (SCREEN_WIDTH - 40 - 8) / 3;

// ─── helpers ──────────────────────────────────────────────────────────────────

function generateIcebreaker(commonInterests: string[], commonMoods: string[]): string | null {
  const all = [...commonInterests, ...commonMoods];
  if (all.length === 0) return null;
  if (all.length === 1) {
    return `Tienen ${all[0]} en común — pregúntale sobre eso para romper el hielo.`;
  }
  const [a, b, ...rest] = all;
  if (rest.length === 0) {
    return `Comparten ${a} y ${b} — hay mucho de qué hablar desde el primer mensaje.`;
  }
  return `Comparten ${a}, ${b} y ${rest.length} cosa${rest.length > 1 ? 's' : ''} más — la conversación va a fluir sola.`;
}

function matchScoreColor(score: number): string {
  if (score >= 70) return colors.pride.green;
  if (score >= 50) return colors.pride.orange;
  return colors.pride.pink;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Ionicons name="person-outline" size={48} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground, fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={onBack}
        style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.secondary }}
      >
        <Text style={{ color: colors.foreground, fontWeight: '600' }}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ userId: string }>();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const insets = useSafeAreaInsets();

  const { profile, loading, error, liked, toggleLike } = usePublicProfile(userId);

  const interestIconMap  = Object.fromEntries(
    interestOptions.map(i => [i.label, i.icon as React.ComponentProps<typeof Ionicons>['name']])
  );
  const moodColorMap     = Object.fromEntries(moodOptions.map(m => [m.label, m.color]));
  const moodIconMap      = Object.fromEntries(moodOptions.filter(m => m.icon).map(m => [m.label, m.icon!]));
  const identityColorMap = Object.fromEntries(identityOptions.map(i => [i.label, i.color]));

  function handleShare() {
    if (!profile) return;
    Share.share({ message: `Mira el perfil de ${profile.name ?? 'este usuario'} en Tribu` });
  }

  function handleMoreOptions() {
    Alert.alert('Opciones', '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reportar',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Gracias', 'Recibimos tu reporte. Lo revisaremos pronto.'),
      },
      {
        text: 'Bloquear',
        onPress: () =>
          Alert.alert(`Bloquear a ${profile?.name ?? 'este usuario'}`, '¿Seguro? Ya no podrán verse mutuamente.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Bloquear', style: 'destructive', onPress: () => router.back() },
          ]),
      },
    ]);
  }

  if (loading) return <LoadingScreen />;
  if (error || !profile) return <ErrorScreen message={error ?? 'No se pudo cargar el perfil'} onBack={() => router.back()} />;

  const name        = profile.name ?? 'Usuario';
  const gradient    = userGradient(profile.id);
  const icebreaker  = generateIcebreaker(profile.common_interests, profile.common_moods);
  const scoreColor  = matchScoreColor(profile.match_score);
  const bottomH     = 84 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomH + 16 }}>

        {/* ── COVER ── */}
        <View style={{ height: 220 }}>
          {profile.cover_url ? (
            <Image source={{ uri: profile.cover_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[prideGradient[0], prideGradient[2], prideGradient[5]]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          {/* Fade to background at the bottom */}
          <LinearGradient
            colors={['transparent', colors.background]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }}
          />

          {/* Top controls */}
          <View style={{
            position: 'absolute', left: 0, right: 0,
            top: insets.top + 8,
            flexDirection: 'row', justifyContent: 'space-between',
            paddingHorizontal: 16, zIndex: 20,
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.glassButton}
              accessibilityLabel="Volver"
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={handleShare} style={styles.glassButton} accessibilityLabel="Compartir perfil">
                <Ionicons name="share-outline" size={15} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMoreOptions} style={styles.glassButton} accessibilityLabel="Más opciones">
                <Ionicons name="ellipsis-horizontal" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── AVATAR + MATCH BADGE ── */}
        <View style={{ paddingHorizontal: 20, marginTop: -64, zIndex: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
            {/* Avatar with pride gradient border */}
            <LinearGradient
              colors={[colors.pride.pink, colors.pride.blue, colors.pride.orange]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ width: 100, height: 100, borderRadius: 24, padding: 2.5 }}
            >
              <View style={{ width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden' }}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 34, fontWeight: '700' }}>
                      {name[0].toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>

            {/* Match score badge */}
            <View style={{
              paddingHorizontal: 16, paddingVertical: 10,
              borderRadius: 18, borderWidth: 1,
              backgroundColor: colors.card, borderColor: colors.border,
              alignItems: 'center', marginBottom: 2,
            }}>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '600', letterSpacing: 0.3 }}>
                Match IA
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: scoreColor, lineHeight: 30 }}>
                {profile.match_score}%
              </Text>
            </View>
          </View>

          {/* Match factors pills */}
          {profile.match_factors.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16, marginTop: -4 }}>
              {profile.match_factors.map(factor => (
                <View
                  key={factor}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 9, paddingVertical: 4,
                    borderRadius: 999, backgroundColor: `${scoreColor}18`,
                    borderWidth: 1, borderColor: `${scoreColor}35`,
                  }}
                >
                  <Ionicons name="sparkles" size={10} color={scoreColor} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: scoreColor }}>{factor}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── NAME & INFO ── */}
          <View style={{ marginBottom: 16, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>{name}</Text>
              {profile.age != null && (
                <View style={{ backgroundColor: `${colors.primary}22`, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{profile.age}</Text>
                </View>
              )}
              {profile.pronouns ? (
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{profile.pronouns}</Text>
              ) : null}
            </View>

            {profile.username ? (
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>@{profile.username}</Text>
            ) : null}

            {(profile.location || profile.distance_km != null) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                  {[profile.location, profile.distance_km != null ? `${profile.distance_km} km` : null]
                    .filter(Boolean).join(' · ')}
                </Text>
              </View>
            ) : null}

            {profile.bio ? (
              <Text style={{ marginTop: 8, fontSize: 14, color: colors.mutedForeground, lineHeight: 21 }}>
                {profile.bio}
              </Text>
            ) : null}
          </View>

          {/* ── IDENTITY TAGS ── */}
          {profile.identity.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {profile.identity.map(id => (
                <View
                  key={id}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${identityColorMap[id] ?? colors.primary}22` }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: identityColorMap[id] ?? colors.primary }}>{id}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── MOODS ── */}
          {profile.moods.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionLabel}>MOOD</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile.moods.map(mood => {
                  const color = moodColorMap[mood] ?? colors.primary;
                  return (
                    <View key={mood} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}40`,
                    }}>
                      {moodIconMap[mood] && (
                        <Ionicons name={moodIconMap[mood] as any} size={12} color={color} />
                      )}
                      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{mood}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── INTERESTS ── */}
          {profile.interests.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>INTERESES</Text>
                {profile.common_interests.length > 0 && (
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.pride.green }}>
                    {profile.common_interests.length} en común
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile.interests.map(interest => {
                  const shared = profile.common_interests.includes(interest);
                  return (
                    <View key={interest} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
                      backgroundColor: shared ? `${colors.pride.green}15` : colors.secondary,
                      borderWidth: shared ? 1 : 0,
                      borderColor: shared ? `${colors.pride.green}40` : 'transparent',
                    }}>
                      {interestIconMap[interest] && (
                        <Ionicons
                          name={interestIconMap[interest]}
                          size={12}
                          color={shared ? colors.pride.green : colors.mutedForeground}
                        />
                      )}
                      <Text style={{ fontSize: 12, fontWeight: shared ? '700' : '500', color: shared ? colors.pride.green : colors.foreground }}>
                        {interest}
                      </Text>
                      {shared && (
                        <Ionicons name="checkmark" size={11} color={colors.pride.green} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── PHOTOS ── */}
          {profile.photos.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionLabel}>FOTOS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {profile.photos.map((url, i) => (
                  <Image
                    key={i}
                    source={{ uri: url }}
                    style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── AI ICEBREAKER ── */}
          {icebreaker && (
            <View style={{
              padding: 16, borderRadius: 16, marginBottom: 8,
              backgroundColor: `${colors.pride.purple}12`,
              borderWidth: 1, borderColor: `${colors.pride.purple}28`,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="flash" size={13} color={colors.pride.purple} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.pride.purple, letterSpacing: 0.3 }}>
                  Icebreaker IA
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 20, fontStyle: 'italic' }}>
                "{icebreaker}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── BOTTOM ACTION BAR ── */}
      <LinearGradient
        colors={[`${colors.background}00`, colors.background, colors.background]}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingTop: 28, paddingBottom: insets.bottom + 16, paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Like button */}
          <TouchableOpacity
            onPress={toggleLike}
            activeOpacity={0.8}
            style={{
              flex: 1, paddingVertical: 15, borderRadius: 18,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: liked ? `${colors.pride.pink}18` : colors.card,
              borderWidth: 1,
              borderColor: liked ? `${colors.pride.pink}45` : colors.border,
            }}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={19}
              color={liked ? colors.pride.pink : colors.foreground}
            />
            <Text style={{ fontSize: 14, fontWeight: '700', color: liked ? colors.pride.pink : colors.foreground }}>
              {liked ? 'Te gustó' : 'Me gusta'}
            </Text>
          </TouchableOpacity>

          {/* Message button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chat')}
            activeOpacity={0.85}
            style={{ flex: 1, borderRadius: 18, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[colors.pride.pink, colors.pride.purple]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Ionicons name="chatbubble-outline" size={19} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Mensaje</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glassButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: '#888', marginBottom: 8,
  },
});
