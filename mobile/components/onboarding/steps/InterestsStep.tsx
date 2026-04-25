import { View, Text } from 'react-native';
import SelectCard from '../SelectCard';
import { interestOptions } from '../../../features/onboarding/data';

interface InterestsStepProps {
  selected: string[];
  onToggle: (val: string) => void;
}

export default function InterestsStep({ selected, onToggle }: InterestsStepProps) {
  return (
    <View>
      <Text className="text-2xl font-extrabold text-foreground mb-1">Tus intereses</Text>
      <Text className="text-sm text-muted-foreground mb-5">
        Elige al menos 3. Los usaremos para conectarte mejor.
      </Text>

      {/* 2-column grid */}
      <View className="gap-3">
        {Array.from({ length: Math.ceil(interestOptions.length / 2) }).map((_, row) => (
          <View key={row} className="flex-row gap-3">
            {interestOptions.slice(row * 2, row * 2 + 2).map((opt) => (
              <SelectCard
                key={opt.label}
                label={opt.label}
                selected={selected.includes(opt.label)}
                onPress={() => onToggle(opt.label)}
                color={opt.color}
                icon={opt.icon}
                variant="grid"
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
