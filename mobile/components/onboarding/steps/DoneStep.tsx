import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, prideGradientShort } from '../../../lib/theme';
import type { OnboardingState } from '../../../features/onboarding/types';

interface DoneStepProps {
  state: OnboardingState;
}

export default function DoneStep({ state }: DoneStepProps) {
  const summary = [
    { icon: '🏳️‍🌈', label: state.identity.join(', ') || '—' },
    { icon: '💬',    label: state.pronouns || '—'           },
    { icon: '✨',    label: state.interests.join(', ') || '—'},
    { icon: '🔥',    label: state.moods.join(', ') || '—'   },
  ];

  return (
    <View className="items-center pt-6">
      {/* Check circle */}
      <View
        className="w-28 h-28 rounded-full overflow-hidden mb-6"
        style={{
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 25,
          elevation: 14,
        }}
      >
        <LinearGradient
          colors={prideGradientShort as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="checkmark" size={48} color="#fff" />
        </LinearGradient>
      </View>

      <Text className="text-3xl font-extrabold text-primary mb-3 text-center">
        Todo listo 🎉
      </Text>
      <Text className="text-sm text-muted-foreground text-center leading-relaxed max-w-xs mb-8">
        Tu perfil en Tribu está configurado. Ya puedes explorar tu comunidad, hacer
        matches y conectar con personas reales.
      </Text>

      {/* Summary cards */}
      <View className="w-full gap-2">
        {summary.map((item, i) => (
          <View
            key={i}
            className="flex-row items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.secondary }}
          >
            <Text className="text-base">{item.icon}</Text>
            <Text className="text-xs font-medium text-foreground flex-1" numberOfLines={1}>
              {item.label}
            </Text>
            <Ionicons name="checkmark" size={12} color={colors.pride.green} />
          </View>
        ))}
      </View>
    </View>
  );
}
