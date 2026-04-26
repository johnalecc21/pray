import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Tabs } from 'expo-router';
import * as Location from 'expo-location';
import BottomTabBar from '../../components/navigation/BottomTabBar';
import { PostsProvider } from '../../context/PostsContext';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

async function saveLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await api.put('/users/profile', {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  } catch {
    // silent — location is best-effort
  }
}

function LocationTracker() {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;

    saveLocation();

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        saveLocation();
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, [user]);

  return null;
}

export default function TabsLayout() {
  return (
    <PostsProvider>
      <LocationTracker />
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
