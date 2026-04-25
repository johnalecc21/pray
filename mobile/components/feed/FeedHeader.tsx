import { View } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientText from '../ui/GradientText';
import { colors } from '../../lib/theme';

interface FeedHeaderProps {
  hasNotification?: boolean;
  onNotificationsPress?: () => void;
  onNewPostPress?: () => void;
}

export default function FeedHeader({
  hasNotification = true,
  onNotificationsPress,
  onNewPostPress,
}: FeedHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: colors.background,
      }}
    >
      <GradientText fontSize={24} fontWeight="800">Tribu</GradientText>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={onNotificationsPress}
          accessibilityLabel="Notificaciones"
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.secondary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={17} color={colors.foreground} />
          {hasNotification && (
            <View
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: colors.pride.pink,
              }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNewPostPress}
          accessibilityLabel="Nuevo post"
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
