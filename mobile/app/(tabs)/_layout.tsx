import { Tabs } from 'expo-router';
import BottomTabBar from '../../components/navigation/BottomTabBar';
import { PostsProvider } from '../../context/PostsContext';

export default function TabsLayout() {
  return (
    <PostsProvider>
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Feed' }} />
      <Tabs.Screen name="map"     options={{ title: 'Mapa' }} />
      <Tabs.Screen name="match"   options={{ title: 'Match' }} />
      <Tabs.Screen name="chat"    options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Yo' }} />
    </Tabs>
    </PostsProvider>
  );
}
