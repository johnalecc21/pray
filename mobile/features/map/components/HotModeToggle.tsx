import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../lib/theme';

interface Props {
  active:  boolean;
  pending: boolean;
  onToggle: () => void;
}

export function HotModeToggle({ active, pending, onToggle }: Props) {
  const thumbPos = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(thumbPos, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const left = thumbPos.interpolate({ inputRange: [0, 1], outputRange: [3, 27] });

  return (
    <TouchableOpacity
      onPress={pending ? undefined : onToggle}
      activeOpacity={0.8}
      style={styles.wrapper}
      accessibilityLabel={active ? 'Desactivar Modo Hot' : 'Activar Modo Hot'}
    >
      {active ? (
        <LinearGradient
          colors={[colors.pride.orange, colors.pride.pink]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.track}
        >
          <Animated.View style={[styles.thumb, { left }]} />
        </LinearGradient>
      ) : (
        <View style={[styles.track, styles.trackOff]}>
          <Animated.View style={[styles.thumb, { left }]} />
        </View>
      )}
      <View style={styles.label}>
        <Ionicons
          name="flame"
          size={15}
          color={active ? colors.pride.orange : colors.mutedForeground}
        />
        <Text style={[styles.text, active && styles.textActive]}>Hot</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track:      { width: 50, height: 26, borderRadius: 13, justifyContent: 'center', position: 'relative' },
  trackOff:   { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  thumb:      { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  label:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text:       { fontSize: 14, fontWeight: '700', color: colors.mutedForeground },
  textActive: { color: colors.pride.orange },
});
