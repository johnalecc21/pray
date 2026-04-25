import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

// Appends hex alpha channel for opacity
function withAlpha(hex: string, alpha: string) {
  return hex + alpha;
}

interface SelectCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
  icon?: string;        // Ionicons name — for grid variant
  description?: string; // subtitle — for list variant
  variant?: 'grid' | 'list';
}

export default function SelectCard({
  label,
  selected,
  onPress,
  color,
  icon,
  description,
  variant = 'grid',
}: SelectCardProps) {
  if (variant === 'list') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center gap-4 rounded-2xl p-4"
        style={{
          backgroundColor: selected ? withAlpha(color, '18') : colors.card,
          borderWidth: 1,
          borderColor: selected ? color : colors.border,
        }}
      >
        {/* Icon circle */}
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: selected ? withAlpha(color, '33') : colors.secondary }}
        >
          <View
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: selected ? color : '#3d3a55' }}
          />
        </View>

        {/* Text */}
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{label}</Text>
          {description && (
            <Text className="text-xs text-muted-foreground mt-0.5">{description}</Text>
          )}
        </View>

        {/* Check */}
        {selected && (
          <View
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <Ionicons name="checkmark" size={13} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="rounded-2xl p-4 flex-row items-center gap-3"
      style={{
        backgroundColor: selected ? withAlpha(color, '22') : colors.card,
        borderWidth: 1,
        borderColor: selected ? color : colors.border,
        flex: 1,
      }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: selected ? withAlpha(color, '33') : colors.secondary }}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={18}
            color={selected ? color : colors.mutedForeground}
          />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {selected && (
          <Ionicons name="checkmark" size={13} color={color} style={{ marginTop: 2 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}
