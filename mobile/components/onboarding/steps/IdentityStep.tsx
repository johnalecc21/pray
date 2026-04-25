import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SelectChip from '../SelectChip';
import { colors } from '../../../lib/theme';
import { identityOptions, pronounOptions } from '../../../features/onboarding/data';

interface IdentityStepProps {
  selectedIdentity: string[];
  selectedPronouns: string;
  onToggleIdentity: (val: string) => void;
  onSelectPronouns: (val: string) => void;
}

export default function IdentityStep({
  selectedIdentity,
  selectedPronouns,
  onToggleIdentity,
  onSelectPronouns,
}: IdentityStepProps) {
  return (
    <View>
      <Text className="text-2xl font-extrabold text-foreground mb-1">Tu identidad</Text>
      <Text className="text-sm text-muted-foreground mb-5">
        Puedes seleccionar varias. Solo tu comunidad las verá.
      </Text>

      {/* Photo upload */}
      <View className="items-center mb-5">
        <TouchableOpacity
          className="w-24 h-24 rounded-2xl items-center justify-center gap-1"
          style={{
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: colors.border,
            backgroundColor: colors.secondary,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={22} color={colors.mutedForeground} />
          <Text className="text-[10px] text-muted-foreground">Subir foto</Text>
        </TouchableOpacity>
      </View>

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
