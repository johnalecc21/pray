import { View, Text } from 'react-native';
import { colors } from '../../lib/theme';
import { TOTAL_STEPS, STEP_LABELS } from '../../features/onboarding/types';

interface ProgressBarProps {
  step: number;
}

export default function ProgressBar({ step }: ProgressBarProps) {
  return (
    <View className="px-5 pt-12 pb-4">
      <View className="flex-row gap-1.5 mb-3">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i <= step ? colors.primary : colors.border }}
          />
        ))}
      </View>
      <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
        Paso {step + 1} de {TOTAL_STEPS} — {STEP_LABELS[step]}
      </Text>
    </View>
  );
}
