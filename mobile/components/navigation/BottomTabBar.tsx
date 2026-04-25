import { View, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, prideGradientShort } from '../../lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: {
  name: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
}[] = [
  { name: 'index',   label: 'Feed',  icon: 'home-outline',        iconActive: 'home' },
  { name: 'map',     label: 'Mapa',  icon: 'map-outline',         iconActive: 'map' },
  { name: 'match',   label: 'Match', icon: 'flash-outline',       iconActive: 'flash' },
  { name: 'chat',    label: 'Chat',  icon: 'chatbubble-outline',  iconActive: 'chatbubble' },
  { name: 'profile', label: 'Yo',    icon: 'person-outline',      iconActive: 'person' },
];

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-around px-2 pt-3 pb-2">
        {TABS.map((tab, index) => {
          const route = state.routes[index];
          const isActive = state.index === index;

          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route?.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={handlePress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center gap-1 py-1 relative"
            >
              {isActive && (
                <LinearGradient
                  colors={[prideGradientShort[0], prideGradientShort[2], prideGradientShort[4]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: -4,
                    width: 24,
                    height: 2,
                    borderRadius: 999,
                  }}
                />
              )}

              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? colors.primary : colors.mutedForeground}
              />

              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isActive ? colors.primary : colors.mutedForeground,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
