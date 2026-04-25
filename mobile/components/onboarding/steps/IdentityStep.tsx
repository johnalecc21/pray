import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AvatarPicker from '../AvatarPicker';
import SelectChip from '../SelectChip';
import UsernameInput from '../../ui/UsernameInput';
import { colors } from '../../../lib/theme';
import { identityOptions, pronounOptions } from '../../../features/onboarding/data';
import type { UsernameStatus } from '../../../features/profile/hooks/useUsernameCheck';

interface IdentityStepProps {
  selectedIdentity:  string[];
  selectedPronouns:  string;
  age:               number | null;
  avatarUri:         string | null;
  username:          string;
  usernameStatus:    UsernameStatus;
  onToggleIdentity:  (val: string) => void;
  onSelectPronouns:  (val: string) => void;
  onAgeChange:       (val: number | null) => void;
  onAvatarChange:    (uri: string) => void;
  onUsernameChange:  (val: string) => void;
}

export default function IdentityStep({
  selectedIdentity,
  selectedPronouns,
  age,
  avatarUri,
  username,
  usernameStatus,
  onToggleIdentity,
  onSelectPronouns,
  onAgeChange,
  onAvatarChange,
  onUsernameChange,
}: IdentityStepProps) {
  const ageInvalid = age !== null && (age < 18 || age > 99);

  return (
    <View>
      <Text className="text-2xl font-extrabold text-foreground mb-1">Tu identidad</Text>
      <Text className="text-sm text-muted-foreground mb-5">
        Puedes seleccionar varias. Solo tu comunidad las verá.
      </Text>

      {/* Foto de perfil */}
      <AvatarPicker uri={avatarUri} onChange={onAvatarChange} />

      {/* Username */}
      <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2 mt-1">
        Username
      </Text>
      <View className="mb-5">
        <UsernameInput
          value={username}
          onChange={onUsernameChange}
          status={usernameStatus}
        />
      </View>

      {/* Edad */}
      <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">
        Edad
      </Text>
      <View className="mb-1">
        <TextInput
          value={age !== null ? String(age) : ''}
          onChangeText={(text) => {
            const num = parseInt(text, 10);
            onAgeChange(text === '' ? null : isNaN(num) ? null : num);
          }}
          placeholder="Ej: 27"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          maxLength={2}
          style={{
            backgroundColor:   colors.secondary,
            borderWidth:       1,
            borderColor:       ageInvalid ? colors.destructive : colors.border,
            borderRadius:      12,
            paddingHorizontal: 14,
            paddingVertical:   12,
            color:             colors.foreground,
            fontSize:          15,
            width:             100,
          }}
        />
      </View>
      {ageInvalid ? (
        <View className="flex-row items-center gap-1 mb-5">
          <Ionicons name="alert-circle-outline" size={13} color={colors.destructive} />
          <Text style={{ color: colors.destructive, fontSize: 12 }}>
            Debes tener al menos 18 años para usar Tribu
          </Text>
        </View>
      ) : (
        <Text className="text-xs text-muted-foreground mb-5">
          Solo para mayores de 18 años
        </Text>
      )}

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
