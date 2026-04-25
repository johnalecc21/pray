import { useState } from 'react';
import {
  View, Text, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../features/profile/hooks/useProfile';
import EditProfileModal from '../../components/profile/EditProfileModal';
import { colors, prideGradient } from '../../lib/theme';
import { identityOptions, interestOptions, moodOptions } from '../../features/onboarding/data';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { profile, loading, saving, update } = useProfile();
  const [editing, setEditing] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-muted-foreground text-center">
          No se pudo cargar el perfil.
        </Text>
      </View>
    );
  }

  const moodColors = Object.fromEntries(moodOptions.map((m) => [m.label, m.color]));
  const interestIcons = Object.fromEntries(
    interestOptions.map((i) => [i.label, i.icon as React.ComponentProps<typeof Ionicons>['name']]),
  );
  const identityColors = Object.fromEntries(identityOptions.map((i) => [i.label, i.color]));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Sticky header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
        <Text className="text-xl font-extrabold" style={{ color: colors.primary }}>
          Mi Perfil
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setEditing(true)}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.secondary }}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Cerrar sesión', '¿Estás seguro?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: handleLogout },
              ])
            }
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.secondary }}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <LinearGradient
          colors={[prideGradient[0], prideGradient[2], prideGradient[4], prideGradient[6]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 140, marginHorizontal: 16, borderRadius: 20, opacity: 0.7 }}
        />

        {/* Avatar row */}
        <View
          className="flex-row items-end justify-between px-5"
          style={{ marginTop: -44 }}
        >
          <View>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{
                  width: 88, height: 88, borderRadius: 18,
                  borderWidth: 3, borderColor: colors.background,
                }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.accent, colors.primary]}
                style={{
                  width: 88, height: 88, borderRadius: 18,
                  borderWidth: 3, borderColor: colors.background,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="person" size={36} color="#fff" />
              </LinearGradient>
            )}
          </View>
        </View>

        {/* Name & info */}
        <View className="px-5 mt-3 gap-1">
          <Text className="text-2xl font-extrabold text-foreground">
            {profile.name ?? 'Sin nombre'}
          </Text>

          <View className="flex-row flex-wrap gap-2 items-center">
            {profile.pronouns && (
              <Text className="text-sm text-muted-foreground">{profile.pronouns}</Text>
            )}
            {profile.identity.map((id) => (
              <View
                key={id}
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${identityColors[id] ?? colors.primary}25` }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: identityColors[id] ?? colors.primary }}
                >
                  {id}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mood */}
        {profile.moods.length > 0 && (
          <View className="px-5 mt-5">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Mood actual
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.moods.map((mood) => (
                <View
                  key={mood}
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: moodColors[mood] ?? colors.primary }}
                >
                  <Text className="text-xs font-bold text-white">{mood}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <View className="px-5 mt-5">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Intereses
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <View
                  key={interest}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: colors.secondary }}
                >
                  {interestIcons[interest] && (
                    <Ionicons
                      name={interestIcons[interest]}
                      size={13}
                      color={colors.primary}
                    />
                  )}
                  <Text className="text-xs font-medium text-foreground">{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {editing && (
        <EditProfileModal
          profile={profile}
          saving={saving}
          onSave={update}
          onClose={() => setEditing(false)}
        />
      )}
    </SafeAreaView>
  );
}
