import React, {
  forwardRef, useEffect, useImperativeHandle, useRef,
} from 'react';
import {
  Animated, PanResponder, View, Text, Image, StyleSheet, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../lib/theme';
import { interestOptions, moodOptions } from '../../onboarding/data';
import { userGradient } from '../../feed/utils';
import type { MatchCandidate } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const CARD_HEIGHT = Math.min(Math.round(SCREEN_HEIGHT * 0.54), 460);
const SWIPE_THRESHOLD   = SCREEN_WIDTH * 0.3;
const SWIPE_DURATION    = 220;

export interface SwipeCardRef {
  swipeLeft:  () => void;
  swipeRight: () => void;
}

interface Props {
  candidate:    MatchCandidate;
  isTop:        boolean;
  stackIndex:   number;
  onSwipeLeft:  () => void;
  onSwipeRight: () => void;
}

function formatDist(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`;
}

export const SwipeCard = forwardRef<SwipeCardRef, Props>((
  { candidate, isTop, stackIndex, onSwipeLeft, onSwipeRight },
  ref,
) => {
  const position  = useRef(new Animated.ValueXY()).current;
  const isTopRef  = useRef(isTop);
  useEffect(() => { isTopRef.current = isTop; }, [isTop]);

  const forceSwipe = (dir: 'left' | 'right') => {
    const x = dir === 'right' ? SCREEN_WIDTH + 100 : -(SCREEN_WIDTH + 100);
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      dir === 'right' ? onSwipeRight() : onSwipeLeft();
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  };

  useImperativeHandle(ref, () => ({
    swipeLeft:  () => forceSwipe('left'),
    swipeRight: () => forceSwipe('right'),
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTopRef.current,
      onMoveShouldSetPanResponder:  () => isTopRef.current,
      onPanResponderMove: (_, { dx, dy }) => {
        position.setValue({ x: dx, y: dy * 0.25 });
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (dx > SWIPE_THRESHOLD || vx > 0.8)        forceSwipe('right');
        else if (dx < -SWIPE_THRESHOLD || vx < -0.8) forceSwipe('left');
        else                                           resetPosition();
      },
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange:  [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [25, SCREEN_WIDTH / 4], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -25], outputRange: [1, 0], extrapolate: 'clamp',
  });

  const gradient        = userGradient(candidate.id);
  const name            = candidate.name ?? 'Usuario';
  const moodColorMap    = Object.fromEntries(moodOptions.map(m => [m.label, m.color]));
  const interestIconMap = Object.fromEntries(interestOptions.map(i => [i.label, i.icon as string]));
  const distStr         = formatDist(candidate.distance_km);

  const cardStyle: any = isTop
    ? { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }
    : { transform: [{ scale: 1 - stackIndex * 0.04 }, { translateY: stackIndex * 10 }] };

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      {/* Background */}
      {candidate.avatar_url ? (
        <Image
          source={{ uri: candidate.avatar_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        >
          <View style={styles.initialWrap}>
            <Text style={styles.initial}>{name[0].toUpperCase()}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Gradient overlay */}
      <View style={styles.overlayWrap}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
          style={{ flex: 1 }}
        />
      </View>

      {/* LIKE label */}
      <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
        <Text style={styles.likeLabelText}>ME GUSTA</Text>
      </Animated.View>

      {/* NOPE label */}
      <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
        <Text style={styles.nopeLabelText}>NOPE</Text>
      </Animated.View>

      {/* Top badges (top card only) */}
      {isTop && (
        <View style={styles.topRow}>
          {candidate.moods[0] ? (
            <View style={[styles.moodBadge, {
              backgroundColor: `${moodColorMap[candidate.moods[0]] ?? colors.primary}45`,
            }]}>
              <Text style={[styles.moodBadgeText, { color: moodColorMap[candidate.moods[0]] ?? colors.primary }]}>
                {candidate.moods[0]}
              </Text>
            </View>
          ) : <View />}
          {distStr && (
            <View style={styles.distBadge}>
              <Ionicons name="location-outline" size={11} color="#fff" />
              <Text style={styles.distBadgeText}>{distStr}</Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom info (top card only) */}
      {isTop && (
        <View style={styles.bottomInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {candidate.age != null && (
              <Text style={styles.age}> {candidate.age}</Text>
            )}
          </View>
          {candidate.username ? (
            <Text style={styles.username}>@{candidate.username}</Text>
          ) : null}
          {candidate.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{candidate.bio}</Text>
          ) : null}
          {candidate.interests.length > 0 && (
            <View style={styles.chips}>
              {candidate.interests.slice(0, 3).map(interest => (
                <View key={interest} style={styles.chip}>
                  {interestIconMap[interest] && (
                    <Ionicons name={interestIconMap[interest] as any} size={10} color="#fff" />
                  )}
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
});

SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  initialWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 96,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.35)',
  },
  overlayWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.65,
  },
  likeLabel: {
    position: 'absolute',
    top: 28,
    left: 20,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.pride.green,
    transform: [{ rotate: '-15deg' }],
  },
  likeLabelText: {
    color: colors.pride.green,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nopeLabel: {
    position: 'absolute',
    top: 28,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.pride.red,
    transform: [{ rotate: '15deg' }],
  },
  nopeLabelText: {
    color: colors.pride.red,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  moodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  age: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  username: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 19,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
});
