import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../lib/theme';
import { uploadPostImage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { postsApi } from '../../features/feed/postsApi';
import { userGradient } from '../../features/feed/utils';
import type { Post } from '../../features/feed/types';

interface Props {
  visible:        boolean;
  onClose:        () => void;
  onPostCreated:  (post: Post) => void;
}

export default function CreatePostModal({ visible, onClose, onPostCreated }: Props) {
  const { user } = useAuth();
  const [content,    setContent]    = useState('');
  const [imageUri,   setImageUri]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const userName = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? 'Tú';
  const gradient = user ? userGradient(user.id) : [colors.pride.pink, colors.pride.purple] as [string, string];
  const canPost  = content.trim().length > 0 && !submitting;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!canPost) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (imageUri && user) {
        image_url = await uploadPostImage(user.id, imageUri);
      }
      const { post } = await postsApi.createPost({ content: content.trim(), image_url });
      onPostCreated(post);
      setContent('');
      setImageUri(null);
      onClose();
    } catch (err) {
      console.error('CreatePostModal:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const detectedTags = content.match(/#[\wÀ-ž]+/g) ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
              Nuevo post
            </Text>

            <TouchableOpacity onPress={handlePost} disabled={!canPost}>
              <LinearGradient
                colors={canPost
                  ? [colors.pride.pink, colors.pride.purple]
                  : [colors.muted, colors.muted]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7,
                  minWidth: 72, alignItems: 'center',
                }}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Publicar</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                  {userName[0].toUpperCase()}
                </Text>
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
                  {userName}
                </Text>

                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="¿Qué está pasando?"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  autoFocus
                  maxLength={500}
                  style={{
                    fontSize: 16, color: colors.foreground,
                    lineHeight: 22, minHeight: 100, textAlignVertical: 'top',
                  }}
                />

                {/* Preview imagen */}
                {imageUri && (
                  <View style={{ marginTop: 12, position: 'relative' }}>
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: 200, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setImageUri(null)}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 999, padding: 4,
                      }}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Hashtags detectados */}
                {detectedTags.length > 0 && (
                  <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {detectedTags.map((tag, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: `${colors.pride.pink}22`,
                          borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: colors.pride.pink, fontWeight: '600' }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Toolbar inferior */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12,
            borderTopWidth: 1, borderTopColor: colors.border, gap: 18,
          }}>
            <TouchableOpacity onPress={pickImage} hitSlop={8}>
              <Ionicons name="image-outline" size={22} color={colors.pride.blue} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={8}>
              <Ionicons name="pricetag-outline" size={22} color={colors.pride.green} />
            </TouchableOpacity>
            <Text style={{
              marginLeft: 'auto', fontSize: 12,
              color: content.length > 450 ? colors.pride.orange : colors.mutedForeground,
            }}>
              {content.length}/500
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
