import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, prideGradientShort } from '../../../lib/theme';
import { welcomeFeatures } from '../../../features/onboarding/data';

export default function WelcomeStep() {
  return (
    <View className="items-center pt-4">
      {/* Logo */}
      <View
        className="w-28 h-28 rounded-3xl overflow-hidden mb-6"
        style={{
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={prideGradientShort as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-4xl font-extrabold text-white">T</Text>
        </LinearGradient>
      </View>

      {/* Title */}
      <Text className="text-3xl font-extrabold text-primary mb-3 text-center">
        Bienvenida a Tribu
      </Text>
      <Text className="text-sm text-muted-foreground text-center leading-relaxed mb-8 max-w-xs">
        Tu comunidad LGBT+ para conectar, conocer personas y vivir experiencias auténticas.
        Vamos a personalizar tu experiencia.
      </Text>

      {/* Feature list */}
      <View className="w-full gap-2">
        {welcomeFeatures.map((f) => (
          <View
            key={f.label}
            className="flex-row items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.secondary }}
          >
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
            <Text className="text-sm font-medium text-foreground">{f.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
