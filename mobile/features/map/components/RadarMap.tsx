import { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../../lib/theme';
import type { NearbyUser } from '../types';

const SCREEN_W  = Dimensions.get('window').width;
const SIZE      = Math.min(SCREEN_W - 32, 320);
const CENTER    = SIZE / 2;
const MAX_KM    = 10;
const RINGS_KM  = [2.5, 5, 7.5, 10];

const VIBE_COLORS: Record<string, string> = {
  Hot:        colors.pride.orange,
  Dating:     colors.pride.pink,
  Fiesta:     colors.pride.orange,
  Amistad:    colors.pride.blue,
  Networking: colors.pride.green,
};

function dotPosition(bearing_deg: number, distance_km: number) {
  const r   = Math.min(distance_km / MAX_KM, 0.95) * (CENTER - 24);
  const rad = (bearing_deg * Math.PI) / 180;
  return {
    x: CENTER + r * Math.sin(rad),
    y: CENTER - r * Math.cos(rad),
  };
}

interface Props {
  users:          NearbyUser[];
  hotModeActive:  boolean;
  onSelectUser:   (user: NearbyUser) => void;
}

export function RadarMap({ users, hotModeActive, onSelectUser }: Props) {
  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const sweepAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1, duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1, duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const pulseScale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const visibleUsers = users.filter(u => u.bearing_deg != null && u.distance_km != null);

  return (
    <View style={[styles.container, { width: SIZE, height: SIZE }]}>
      {/* SVG — rings + dots */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={hotModeActive ? colors.pride.orange : colors.pride.pink} stopOpacity="0.10" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background glow */}
        <Circle cx={CENTER} cy={CENTER} r={CENTER - 4} fill="url(#radarGlow)" />

        {/* Distance rings */}
        {RINGS_KM.map(km => {
          const r = (km / MAX_KM) * (CENTER - 24);
          return (
            <G key={km}>
              <Circle
                cx={CENTER} cy={CENTER} r={r}
                fill="none"
                stroke={`${colors.pride.pink}20`}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={CENTER + r + 3}
                y={CENTER - 3}
                fill={colors.mutedForeground}
                fontSize={9}
                opacity={0.5}
              >
                {km}km
              </SvgText>
            </G>
          );
        })}

        {/* Cross hairs */}
        <Line x1={CENTER} y1={20} x2={CENTER} y2={SIZE - 20}
          stroke={`${colors.pride.pink}12`} strokeWidth={0.8} strokeDasharray="3 4" />
        <Line x1={20} y1={CENTER} x2={SIZE - 20} y2={CENTER}
          stroke={`${colors.pride.pink}12`} strokeWidth={0.8} strokeDasharray="3 4" />

        {/* User dots */}
        {visibleUsers.map(u => {
          const { x, y } = dotPosition(u.bearing_deg!, u.distance_km!);
          const dotColor  = u.hot_mode
            ? colors.pride.orange
            : (VIBE_COLORS[u.vibe ?? ''] ?? colors.pride.purple);
          return (
            <G key={u.id}>
              {/* Glow halo */}
              <Circle cx={x} cy={y} r={11} fill={`${dotColor}25`} />
              {/* Main dot */}
              <Circle cx={x} cy={y} r={6} fill={dotColor} opacity={0.92} />
              {/* Online ring */}
              {u.online && (
                <Circle cx={x} cy={y} r={9} fill="none"
                  stroke={colors.pride.green} strokeWidth={1.5} opacity={0.85} />
              )}
            </G>
          );
        })}

        {/* Center — me */}
        <Circle cx={CENTER} cy={CENTER} r={9}
          fill={hotModeActive ? colors.pride.orange : colors.pride.pink} opacity={0.95} />
        <Circle cx={CENTER} cy={CENTER} r={13}
          fill="none"
          stroke={hotModeActive ? `${colors.pride.orange}60` : `${colors.pride.pink}60`}
          strokeWidth={1.5} />
      </Svg>

      {/* Animated pulse ring around center */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          {
            borderColor: hotModeActive ? colors.pride.orange : colors.pride.pink,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Invisible touchable hit-areas over user dots */}
      {visibleUsers.map(u => {
        const { x, y } = dotPosition(u.bearing_deg!, u.distance_km!);
        return (
          <TouchableOpacity
            key={u.id}
            style={[styles.dotHit, { left: x - 16, top: y - 16 }]}
            onPress={() => onSelectUser(u)}
            activeOpacity={0.6}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 28, height: 28,
    borderRadius: 14,
    borderWidth: 2,
    top: CENTER - 14, left: CENTER - 14,
  },
  dotHit: {
    position: 'absolute',
    width: 32, height: 32,
    borderRadius: 16,
  },
});
