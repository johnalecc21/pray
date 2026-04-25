import { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../features/profile/hooks/useProfile';
import EditProfileModal from '../../components/profile/EditProfileModal';
import PhotoViewer     from '../../components/profile/PhotoViewer';
import GradientText    from '../../components/ui/GradientText';
import { colors, prideGradient } from '../../lib/theme';
import { identityOptions, interestOptions, moodOptions } from '../../features/onboarding/data';

const SCREEN_WIDTH  = Dimensions.get('window').width;
const PHOTO_SIZE    = (SCREEN_WIDTH - 40 - 8) / 3; // 3 cols, px-5 padding, 2 gaps of 4

async function pickImage(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert('Foto', 'Elige una opción', [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { resolve(null); return; }
          const res = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          resolve(res.canceled ? null : res.assets[0].uri);
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { resolve(null); return; }
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          resolve(res.canceled ? null : res.assets[0].uri);
        },
      },
    ]);
  });
}

export default function ProfileScreen() {
  const { logout }                                           = useAuth();
  const { profile, loading, saving, update,
          changeAvatar, changeCover, removeAvatar, removeCover,
          addPhoto, removePhoto } = useProfile();
  const [editing,      setEditing]      = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const moodColorMap = Object.fromEntries(moodOptions.map((m) => [m.label, m.color]));
  const moodIconMap  = Object.fromEntries(moodOptions.filter((m) => m.icon).map((m) => [m.label, m.icon!]));
  const interestIconMap  = Object.fromEntries(
    interestOptions.map((i) => [i.label, i.icon as React.ComponentProps<typeof Ionicons>['name']]),
  );
  const identityColorMap = Object.fromEntries(identityOptions.map((i) => [i.label, i.color]));

  function handleAvatarPress() {
    const buttons: any[] = [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cambiar foto',
        onPress: async () => {
          const uri = await pickImage();
          if (uri) {
            try { await changeAvatar(uri); }
            catch (err) { Alert.alert('Error', err instanceof Error ? err.message : 'Intenta de nuevo'); }
          }
        },
      },
    ];
    if (profile?.avatar_url) {
      buttons.push({
        text: 'Eliminar foto',
        style: 'destructive',
        onPress: () => Alert.alert(
          'Eliminar foto de perfil',
          '¿Seguro que quieres eliminar tu foto de perfil?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => removeAvatar() },
          ],
        ),
      });
    }
    Alert.alert('Foto de perfil', 'Elige una opción', buttons);
  }

  function handleCoverPress() {
    const buttons: any[] = [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cambiar portada',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [16, 7], quality: 0.8,
          });
          if (!res.canceled) {
            try { await changeCover(res.assets[0].uri); }
            catch (err) { Alert.alert('Error', err instanceof Error ? err.message : 'Intenta de nuevo'); }
          }
        },
      },
    ];
    if (profile?.cover_url) {
      buttons.push({
        text: 'Eliminar portada',
        style: 'destructive',
        onPress: () => Alert.alert(
          'Eliminar portada',
          '¿Seguro que quieres eliminar la foto de portada?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => removeCover() },
          ],
        ),
      });
    }
    Alert.alert('Foto de portada', 'Elige una opción', buttons);
  }

  async function handleAddPhoto() {
    const uri = await pickImage();
    if (uri) {
      try { await addPhoto(uri); }
      catch (err) { Alert.alert('Error', err instanceof Error ? err.message : 'Intenta de nuevo'); }
    }
  }

  function handleRemovePhoto(url: string) {
    Alert.alert('Eliminar foto', '¿Quieres quitar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removePhoto(url) },
    ]);
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
        <Text className="text-muted-foreground text-center">No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
        <GradientText fontSize={20} fontWeight="800">Mi Perfil</GradientText>
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
                { text: 'Salir', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
              ])
            }
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.secondary }}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Cover */}
        <TouchableOpacity onPress={handleCoverPress} activeOpacity={0.9} style={{ marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', height: 140 }}>
          {profile.cover_url ? (
            <Image source={{ uri: profile.cover_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[prideGradient[0], prideGradient[2], prideGradient[4], prideGradient[6]]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          )}
          {/* Camera button overlay */}
          <View style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Avatar row */}
        <View className="flex-row items-end justify-between px-5" style={{ marginTop: -40 }}>
          {/* Avatar with camera button */}
          <View>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85}>
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 88, height: 88, borderRadius: 18, borderWidth: 3, borderColor: colors.background }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[colors.accent, colors.primary]}
                  style={{ width: 88, height: 88, borderRadius: 18, borderWidth: 3, borderColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="person" size={36} color="#fff" />
                </LinearGradient>
              )}
            </TouchableOpacity>
            {/* Camera badge */}
            <TouchableOpacity
              onPress={handleAvatarPress}
              style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background }}
            >
              <Ionicons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Saving indicator */}
          {saving && <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} />}
        </View>

        {/* Name + identity */}
        <View className="px-5 mt-3 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-extrabold text-foreground">
              {profile.name ?? 'Sin nombre'}
            </Text>
            {profile.age && (
              <View style={{ backgroundColor: `${colors.primary}20`, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{profile.age}</Text>
              </View>
            )}
          </View>
          {profile.username && (
            <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 1 }}>
              @{profile.username}
            </Text>
          )}
          <View className="flex-row flex-wrap gap-2 items-center mt-0.5">
            {profile.pronouns && (
              <Text className="text-sm text-muted-foreground">{profile.pronouns}</Text>
            )}
            {profile.identity.map((id) => (
              <View key={id} className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${identityColorMap[id] ?? colors.primary}25` }}>
                <Text className="text-xs font-semibold" style={{ color: identityColorMap[id] ?? colors.primary }}>{id}</Text>
              </View>
            ))}
          </View>

          {/* Location */}
          {profile.location ? (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">{profile.location}</Text>
            </View>
          ) : null}

          {/* Bio */}
          {profile.bio ? (
            <Text className="mt-2 text-sm text-muted-foreground leading-relaxed">{profile.bio}</Text>
          ) : null}
        </View>

        {/* Mood */}
        {profile.moods.length > 0 && (
          <View className="px-5 mt-5">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Mood actual
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.moods.map((mood) => (
                <View key={mood} className="flex-row items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: moodColorMap[mood] ?? colors.primary }}>
                  {moodIconMap[mood] && (
                    <Ionicons name={moodIconMap[mood] as any} size={12} color="#fff" />
                  )}
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
                <View key={interest} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: colors.secondary }}>
                  {interestIconMap[interest] && (
                    <Ionicons name={interestIconMap[interest]} size={13} color={colors.primary} />
                  )}
                  <Text className="text-xs font-medium text-foreground">{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Photo grid */}
        <View className="px-5 mt-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Fotos
            </Text>
            <TouchableOpacity onPress={handleAddPhoto} className="flex-row items-center gap-1" disabled={saving}>
              <Ionicons name="flash" size={11} color={colors.primary} />
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>Agregar</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-1">
            {profile.photos.map((url) => (
              <View key={url} style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
                <TouchableOpacity
                  onPress={() => setViewingPhoto(url)}
                  activeOpacity={0.85}
                  style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden' }}
                >
                  <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemovePhoto(url)}
                  disabled={saving}
                  style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add photo placeholder */}
            <TouchableOpacity
              onPress={handleAddPhoto}
              disabled={saving}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 14, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {editing && (
        <EditProfileModal
          profile={profile}
          saving={saving}
          onSave={update}
          onClose={() => setEditing(false)}
        />
      )}

      <PhotoViewer
        uri={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
      />
    </SafeAreaView>
  );
}
