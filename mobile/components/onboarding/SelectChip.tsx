import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

export default function SelectChip({ label, selected, onPress, color = colors.primary }: SelectChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center gap-1 px-3 py-2 rounded-full"
      style={{
        backgroundColor: selected ? color : colors.secondary,
        borderWidth: 1,
        borderColor: selected ? color : colors.border,
      }}
    >
      {selected && (
        <Ionicons name="checkmark" size={12} color="#fff" />
      )}
      <Text
        className="text-xs font-semibold"
        style={{ color: selected ? '#fff' : colors.mutedForeground }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
