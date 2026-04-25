import { View, Text } from 'react-native';
import AvatarPicker from '../AvatarPicker';
import SelectChip from '../SelectChip';
import { colors } from '../../../lib/theme';
import { identityOptions, pronounOptions } from '../../../features/onboarding/data';

interface IdentityStepProps {
  selectedIdentity: string[];
  selectedPronouns:  string;
  avatarUri:         string | null;
  onToggleIdentity:  (val: string) => void;
  onSelectPronouns:  (val: string) => void;
  onAvatarChange:    (uri: string) => void;
}

export default function IdentityStep({
  selectedIdentity,
  selectedPronouns,
  avatarUri,
  onToggleIdentity,
  onSelectPronouns,
  onAvatarChange,
}: IdentityStepProps) {
  return (
    <View>
      <Text className="text-2xl font-extrabold text-foreground mb-1">Tu identidad</Text>
      <Text className="text-sm text-muted-foreground mb-5">
        Puedes seleccionar varias. Solo tu comunidad las verá.
      </Text>

      {/* Photo picker */}
      <AvatarPicker uri={avatarUri} onChange={onAvatarChange} />

      {/* Identity chips */}
      <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">
        Orientación / Identidad
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {identityOptions.map((opt) => (
          <SelectChip
            key={opt.label}
            label={opt.label}
            selected={selectedIdentity.includes(opt.label)}
            onPress={() => onToggleIdentity(opt.label)}
            color={opt.color}
          />
        ))}
      </View>

      {/* Pronoun chips */}
      <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">
        Pronombres
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {pronounOptions.map((opt) => (
          <SelectChip
            key={opt.label}
            label={opt.label}
            selected={selectedPronouns === opt.label}
            onPress={() => onSelectPronouns(opt.label)}
            color={colors.primary}
          />
        ))}
      </View>
    </View>
  );
}
