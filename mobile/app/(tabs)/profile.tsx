import { useState, useEffect, useCallback, useRef } from 'react';
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
import { postsApi } from '../../features/feed/postsApi';
import { formatRelativeTime } from '../../features/feed/utils';
import type { Post, UserReply } from '../../features/feed/types';
import EditProfileModal  from '../../components/profile/EditProfileModal';
import PhotoViewer       from '../../components/profile/PhotoViewer';
import PostCard          from '../../components/feed/PostCard';
import CommentsModal     from '../../components/feed/CommentsModal';
import GradientText      from '../../components/ui/GradientText';
import { colors, prideGradient } from '../../lib/theme';
import { identityOptions, interestOptions, moodOptions } from '../../features/onboarding/data';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE   = (SCREEN_WIDTH - 40 - 8) / 3;

type ProfileTab = 'publicaciones' | 'respuestas' | 'fotos' | 'me_gusta';

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: 'publicaciones', label: 'Publicaciones' },
  { key: 'respuestas',    label: 'Respuestas'    },
  { key: 'fotos',         label: 'Fotos'         },
  { key: 'me_gusta',      label: 'Me gusta'      },
];

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

function EmptyTabState({ message }: { message: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
      <Ionicons name="file-tray-outline" size={36} color={colors.mutedForeground} />
      <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}

function ReplyCard({ reply }: { reply: UserReply }) {
  const postAuthor = reply.post?.author;
  const time       = formatRelativeTime(reply.created_at);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
        padding: 14,
      }}
    >
      {reply.post && (
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            marginBottom: 10, paddingBottom: 10,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}
        >
          <Ionicons name="return-down-forward-outline" size={12} color={colors.mutedForeground} />
          <Text style={{ fontSize: 11, color: colors.mutedForeground, flex: 1 }} numberOfLines={1}>
            En respuesta a{' '}
            <Text style={{ fontWeight: '600', color: colors.foreground }}>
              {postAuthor?.name ?? 'alguien'}
            </Text>
            {' · '}
            {reply.post.content}
          </Text>
        </View>
      )}
      <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
        {reply.content}
      </Text>
      <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 6 }}>
        {time}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const {
    profile, loading, saving, update,
    changeAvatar, changeCover, removeAvatar, removeCover,
    addPhoto, removePhoto,
  } = useProfile();

  const [editing,      setEditing]      = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [profileTab,   setProfileTab]   = useState<ProfileTab>('publicaciones');
  const [userPosts,    setUserPosts]    = useState<Post[]>([]);
  const [userReplies,  setUserReplies]  = useState<UserReply[]>([]);
  const [likedPosts,   setLikedPosts]   = useState<Post[]>([]);
  const [tabLoading,   setTabLoading]   = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const loadedTabsRef = useRef<Set<ProfileTab>>(new Set());

  const moodColorMap     = Object.fromEntries(moodOptions.map((m) => [m.label, m.color]));
  const moodIconMap      = Object.fromEntries(moodOptions.filter((m) => m.icon).map((m) => [m.label, m.icon!]));
  const interestIconMap  = Object.fromEntries(
    interestOptions.map((i) => [i.label, i.icon as React.ComponentProps<typeof Ionicons>['name']]),
  );
  const identityColorMap = Object.fromEntries(identityOptions.map((i) => [i.label, i.color]));

  const fetchUserPosts = useCallback(async () => {
    if (!profile?.id) return;
    setTabLoading(true);
    try {
      const { posts } = await postsApi.getPostsByUser(profile.id);
      setUserPosts(posts);
    } catch (err) {
      console.error('fetchUserPosts:', err);
    } finally {
      setTabLoading(false);
    }
  }, [profile?.id]);

  const fetchUserReplies = useCallback(async () => {
    setTabLoading(true);
    try {
      const { replies } = await postsApi.getUserReplies();
      setUserReplies(replies);
    } catch (err) {
      console.error('fetchUserReplies:', err);
    } finally {
      setTabLoading(false);
    }
  }, []);

  const fetchLikedPosts = useCallback(async () => {
    setTabLoading(true);
    try {
      const { posts } = await postsApi.getLikedPosts();
      setLikedPosts(posts);
    } catch (err) {
      console.error('fetchLikedPosts:', err);
    } finally {
      setTabLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    if (profileTab === 'publicaciones' && !loadedTabsRef.current.has('publicaciones')) {
      loadedTabsRef.current.add('publicaciones');
      fetchUserPosts();
    } else if (profileTab === 'respuestas' && !loadedTabsRef.current.has('respuestas')) {
      loadedTabsRef.current.add('respuestas');
      fetchUserReplies();
    } else if (profileTab === 'me_gusta' && !loadedTabsRef.current.has('me_gusta')) {
      loadedTabsRef.current.add('me_gusta');
      fetchLikedPosts();
    }
  }, [profileTab, profile?.id, fetchUserPosts, fetchUserReplies, fetchLikedPosts]);

  function toggleLikeInList(
    postId: string,
    setter: React.Dispatch<React.SetStateAction<Post[]>>,
  ) {
    setter(prev => prev.map(p =>
      p.id !== postId ? p : {
        ...p,
        is_liked_by_me: !p.is_liked_by_me,
        likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
      }
    ));
    postsApi.toggleLike(postId).catch(() => {
      setter(prev => prev.map(p =>
        p.id !== postId ? p : {
          ...p,
          is_liked_by_me: !p.is_liked_by_me,
          likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
        }
      ));
    });
  }

  function handleDeletePost(postId: string) {
    Alert.alert('Eliminar post', '¿Quieres eliminar esta publicación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await postsApi.deletePost(postId);
            setUserPosts(prev => prev.filter(p => p.id !== postId));
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el post. Intenta de nuevo.');
          }
        },
      },
    ]);
  }

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
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
          <View style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Avatar row */}
        <View className="flex-row items-end justify-between px-5" style={{ marginTop: -40 }}>
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
            <TouchableOpacity
              onPress={handleAvatarPress}
              style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background }}
            >
              <Ionicons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
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
          {profile.location ? (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">{profile.location}</Text>
            </View>
          ) : null}
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

        {/* Tab bar */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {PROFILE_TABS.map(({ key, label }) => {
            const active = profileTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setProfileTab(key)}
                activeOpacity={0.7}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: active ? '700' : '500',
                    color: active ? colors.foreground : colors.mutedForeground,
                  }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {active && (
                  <View
                    style={{
                      position: 'absolute', bottom: 0,
                      left: '20%', right: '20%',
                      height: 2, borderRadius: 1,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab content */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {/* Publicaciones */}
          {profileTab === 'publicaciones' && (
            tabLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : userPosts.length === 0 ? (
              <EmptyTabState message="Aún no has publicado nada" />
            ) : (
              userPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwn={true}
                  onLike={() => toggleLikeInList(post.id, setUserPosts)}
                  onComment={() => setCommentPostId(post.id)}
                  onDelete={() => handleDeletePost(post.id)}
                />
              ))
            )
          )}

          {/* Respuestas */}
          {profileTab === 'respuestas' && (
            tabLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : userReplies.length === 0 ? (
              <EmptyTabState message="Aún no has comentado en ningún post" />
            ) : (
              userReplies.map(reply => (
                <ReplyCard key={reply.id} reply={reply} />
              ))
            )
          )}

          {/* Fotos */}
          {profileTab === 'fotos' && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Fotos
                </Text>
                <TouchableOpacity onPress={handleAddPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} disabled={saving}>
                  <Ionicons name="flash" size={11} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Agregar</Text>
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

                <TouchableOpacity
                  onPress={handleAddPhoto}
                  disabled={saving}
                  style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 14, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="add" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {profile.photos.length === 0 && (
                <EmptyTabState message="Agrega tu primera foto" />
              )}
            </View>
          )}

          {/* Me gusta */}
          {profileTab === 'me_gusta' && (
            tabLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : likedPosts.length === 0 ? (
              <EmptyTabState message="Aún no has dado me gusta a ningún post" />
            ) : (
              likedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwn={post.user_id === profile.id}
                  onLike={() => toggleLikeInList(post.id, setLikedPosts)}
                  onComment={() => setCommentPostId(post.id)}
                  onDelete={post.user_id === profile.id ? () => {
                    Alert.alert('Eliminar post', '¿Quieres eliminar esta publicación?', [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await postsApi.deletePost(post.id);
                            setLikedPosts(prev => prev.filter(p => p.id !== post.id));
                          } catch {
                            Alert.alert('Error', 'No se pudo eliminar el post.');
                          }
                        },
                      },
                    ]);
                  } : undefined}
                />
              ))
            )
          )}
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

      <CommentsModal
        visible={commentPostId !== null}
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
        onCommentAdded={() => {}}
      />
    </SafeAreaView>
  );
}
