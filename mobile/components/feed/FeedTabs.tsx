import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../lib/theme';
import { FEED_TABS, type FeedTab } from '../../features/feed/types';

interface FeedTabsProps {
  activeTab:   FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export default function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, flexDirection: 'row' }}
      >
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(tab)}
              style={{ paddingVertical: 10, marginRight: 20, position: 'relative' }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isActive ? colors.pride.pink : colors.mutedForeground,
                }}
              >
                {tab}
              </Text>
              {isActive && (
                <LinearGradient
                  colors={[colors.pride.pink, colors.pride.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: 2, borderRadius: 999,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
