import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../../lib/theme';
import { userGradient } from '../../feed/utils';
import { interestOptions } from '../../onboarding/data';
import GradientText from '../../../components/ui/GradientText';
import type { MatchCandidate } from '../types';

interface Props {
  matched:     MatchCandidate | null;
  myName:      string | null;
  myAvatarUrl: string | null;
  onDismiss:   () => void;
}

function icebreaker(name: string | null, interests: string[]): string {
  const n = name ?? 'él';
  if (interests.length >= 2)
    return `"¡Hola ${n}! Tenemos ${interests[0].toLowerCase()} y ${interests[1].toLowerCase()} en común — ¿por cuál empezamos?"`;
  if (interests.length === 1)
    return `"¡Hola ${n}! Vi que también te gusta ${interests[0].toLowerCase()} — ¿cuál es tu parte favorita?"`;
  return `"¡Hola ${n}! Me alegra que hayamos hecho match 😊 ¿Cómo ha sido tu semana?"`;
}

const DOTS = [
  { color: colors.pride.pink,   top: 80,  left: '15%', bottom: undefined, right: undefined, size: 12, rotate: 30  },
  { color: colors.pride.yellow, top: 110, right: '20%', bottom: undefined, left: undefined,  size: 8,  rotate: -15 },
  { color: colors.pride.blue,   top: 160, left: '5%',  bottom: undefined, right: undefined, size: 6,  rotate: 45  },
  { color: colors.pride.green,  top: 130, right: '8%', bottom: undefined, left: undefined,  size: 10, rotate: -30 },
  { color: colors.pride.orange, top: undefined, bottom: 260, left: '10%', right: undefined, size: 9,  rotate: 60  },
  { color: colors.pride.purple, top: undefined, bottom: 210, right: '15%', left: undefined, size: 7,  rotate: -45 },
];

function Avatar({ uri, name, gradient }: { uri: string | null; name: string | null; gradient: [string, string] }) {
  return (
    <View style={styles.avatarWrapper}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImg} resizeMode="cover" />
      ) : (
        <LinearGradient colors={gradient} style={styles.avatarImg}>
          <View style={styles.avatarInitialWrap}>
            <Text style={styles.avatarInitial}>{(name ?? 'U')[0].toUpperCase()}</Text>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

export function MatchSuccessModal({ matched, myName, myAvatarUrl, onDismiss }: Props) {
  if (!matched) return null;

  const theirGradient  = userGradient(matched.id);
  const myGradient: [string, string] = [colors.pride.purple, colors.pride.pink];
  const interestIcons  = Object.fromEntries(interestOptions.map(i => [i.label, i.icon as string]));
  const hint           = icebreaker(matched.name, matched.common_interests);

  return (
    <View style={styles.container}>
        {/* Glow */}
        <LinearGradient
          colors={[`${colors.pride.pink}20`, 'transparent']}
          style={styles.glow}
        />

        {/* Confetti dots */}
        {DOTS.map((d, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: d.size, height: d.size,
                backgroundColor: d.color,
                top: d.top, bottom: d.bottom,
                left: d.left as any, right: d.right as any,
                transform: [{ rotate: `${d.rotate}deg` }],
              },
            ]}
          />
        ))}

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatars */}
          <View style={styles.avatarsRow}>
            <View style={styles.avatarLeft}>
              <Avatar uri={myAvatarUrl} name={myName} gradient={myGradient} />
            </View>
            <LinearGradient
              colors={[colors.pride.pink, colors.pride.orange]}
              style={styles.heartBadge}
            >
              <Ionicons name="heart" size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.avatarRight}>
              <Avatar uri={matched.avatar_url} name={matched.name} gradient={theirGradient} />
            </View>
          </View>

          {/* Title */}
          <GradientText fontSize={40} fontWeight="900">¡Es un Match!</GradientText>
          <Text style={styles.subtitle}>
            Tú y{' '}
            <Text style={{ color: colors.primary, fontWeight: '800' }}>
              {matched.name ?? 'este usuario'}
            </Text>{' '}
            se gustaron mutuamente
          </Text>
          <Text style={styles.score}>
            <Text style={{ color: colors.pride.green, fontWeight: '700' }}>{matched.match_score}%</Text>
            {' '}de compatibilidad
            {matched.common_interests.length > 0 &&
              ` · ${matched.common_interests.length} interés${matched.common_interests.length > 1 ? 'es' : ''} en común`}
          </Text>

          {/* Common interests */}
          {matched.common_interests.length > 0 && (
            <View style={styles.interestRow}>
              {matched.common_interests.slice(0, 4).map(i => (
                <View key={i} style={styles.interestChip}>
                  {interestIcons[i] && (
                    <Ionicons name={interestIcons[i] as any} size={11} color={colors.pride.pink} />
                  )}
                  <Text style={styles.interestChipText}>{i}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          <View style={styles.ctaCol}>
            <TouchableOpacity
              style={styles.msgBtn}
              onPress={() => { onDismiss(); router.push('/(tabs)/chat'); }}
            >
              <LinearGradient
                colors={[colors.pride.pink, colors.pride.purple]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.msgBtnInner}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                <Text style={styles.msgBtnText}>Enviar mensaje</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => { onDismiss(); router.push(`/user/${matched.id}`); }}
            >
              <Text style={styles.profileBtnText}>Ver perfil completo</Text>
            </TouchableOpacity>
          </View>

          {/* AI icebreaker */}
          <View style={styles.icebreakerCard}>
            <View style={styles.icebreakerHeader}>
              <Ionicons name="flash" size={11} color={colors.pride.purple} />
              <Text style={styles.icebreakerLabel}>Sugerencia IA</Text>
            </View>
            <Text style={styles.icebreakerText}>{hint}</Text>
          </View>

          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Seguir explorando</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '55%',
  },
  dot: {
    position: 'absolute',
    borderRadius: 3,
    opacity: 0.7,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarLeft:  { marginRight: -12, zIndex: 2 },
  avatarRight: { marginLeft:  -12, zIndex: 2 },
  avatarWrapper: {
    width: 92,
    height: 92,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitialWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
  },
  heartBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderWidth: 3,
    borderColor: colors.background,
  },
  subtitle: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  score: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 18,
  },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${colors.pride.pink}18`,
    borderWidth: 1,
    borderColor: `${colors.pride.pink}35`,
    marginHorizontal: 3,
    marginVertical: 3,
  },
  interestChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.pride.pink,
    marginLeft: 4,
  },
  ctaCol: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  msgBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
  },
  msgBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  msgBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 8,
  },
  profileBtn: {
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  profileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  icebreakerCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: `${colors.pride.purple}12`,
    borderWidth: 1,
    borderColor: `${colors.pride.purple}30`,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  icebreakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icebreakerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.pride.purple,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  icebreakerText: {
    fontSize: 12,
    color: colors.foreground,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dismissBtn: {
    paddingVertical: 10,
  },
  dismissText: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
});
