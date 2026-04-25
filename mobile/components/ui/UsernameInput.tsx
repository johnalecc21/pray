import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import type { UsernameStatus } from '../../features/profile/hooks/useUsernameCheck';

interface UsernameInputProps {
  value:    string;
  onChange: (val: string) => void;
  status:   UsernameStatus;
}

function StatusIcon({ status }: { status: UsernameStatus }) {
  if (status === 'checking') {
    return <ActivityIndicator size="small" color={colors.mutedForeground} />;
  }
  if (status === 'available') {
    return <Ionicons name="checkmark-circle" size={18} color={colors.pride.green} />;
  }
  if (status === 'taken') {
    return <Ionicons name="close-circle" size={18} color={colors.destructive} />;
  }
  if (status === 'invalid') {
    return <Ionicons name="alert-circle-outline" size={18} color={colors.pride.orange} />;
  }
  return null;
}

function statusHint(status: UsernameStatus, value: string): string | null {
  if (!value) return 'Mínimo 3 caracteres. Solo letras, números, _ o -';
  if (status === 'available') return 'Username disponible';
  if (status === 'taken')     return 'Este username ya est�� en uso';
  if (status === 'invalid')   return 'Solo letras, números, _ o - (3-30 caracteres)';
  return null;
}

const HINT_COLORS: Record<UsernameStatus, string> = {
  idle:      colors.mutedForeground,
  checking:  colors.mutedForeground,
  available: colors.pride.green,
  taken:     colors.destructive,
  invalid:   colors.pride.orange,
};

export default function UsernameInput({ value, onChange, status }: UsernameInputProps) {
  const borderColor = status === 'taken' || status === 'invalid'
    ? colors.destructive
    : status === 'available'
      ? colors.pride.green
      : colors.border;

  const hint = statusHint(status, value);

  return (
    <View>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.secondary,
        borderWidth: 1, borderColor,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        gap: 6,
      }}>
        <Text style={{ fontSize: 15, color: colors.mutedForeground, fontWeight: '600' }}>@</Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
          placeholder="tu_username"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          style={{ flex: 1, fontSize: 15, color: colors.foreground }}
        />
        <StatusIcon status={status} />
      </View>
      {hint && (
        <Text style={{ fontSize: 11, color: HINT_COLORS[status], marginTop: 4, marginLeft: 2 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}
