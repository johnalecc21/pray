import { View, Text } from 'react-native';
import SelectCard from '../SelectCard';
import { moodOptions } from '../../../features/onboarding/data';

interface MoodStepProps {
  selected: string[];
  onToggle: (val: string) => void;
}

export default function MoodStep({ selected, onToggle }: MoodStepProps) {
  return (
    <View>
      <Text className="text-2xl font-extrabold text-foreground mb-1">Tu mood ahora</Text>
      <Text className="text-sm text-muted-foreground mb-5">
        Lo puedes cambiar cuando quieras desde tu perfil.
      </Text>

      <View className="gap-3">
        {moodOptions.map((m) => (
          <SelectCard
            key={m.label}
            label={m.label}
            description={m.desc}
            selected={selected.includes(m.label)}
            onPress={() => onToggle(m.label)}
            color={m.color}
            icon={m.icon}
            variant="list"
          />
        ))}
      </View>
    </View>
  );
}
