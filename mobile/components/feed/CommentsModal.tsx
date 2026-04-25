import {
  Modal, View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../lib/theme';
import { useAuth } from '../../context/AuthContext';
import { postsApi } from '../../features/feed/postsApi';
import { userGradient, formatRelativeTime } from '../../features/feed/utils';
import type { Comment } from '../../features/feed/types';

interface Props {
  visible:         boolean;
  postId:          string | null;
  onClose:         () => void;
  onCommentAdded?: () => void;
}

export default function CommentsModal({ visible, postId, onClose, onCommentAdded }: Props) {
  const { user } = useAuth();
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [text,       setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const { comments: data } = await postsApi.getComments(postId);
      setComments(data);
    } catch (err) {
      console.error('CommentsModal:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible && postId) fetchComments();
    else setComments([]);
  }, [visible, postId, fetchComments]);

  const handleSend = async () => {
    if (!text.trim() || !postId || submitting) return;
    setSubmitting(true);
    try {
      const { comment } = await postsApi.addComment(postId, text.trim());
      setComments(prev => [...prev, comment]);
      setText('');
      onCommentAdded?.();
    } catch (err) {
      console.error('CommentsModal send:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!postId) return;
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await postsApi.deleteComment(postId, commentId);
    } catch {
      fetchComments();
    }
  };

  const userName = (user?.user_metadata?.name as string | undefined) ?? 'Tú';
  const myGradient = user
    ? userGradient(user.id)
    : [colors.pride.pink, colors.pride.purple] as [string, string];

  const renderItem = ({ item }: { item: Comment }) => {
    const name     = item.author?.name ?? 'Usuario';
    const gradient = userGradient(item.user_id);
    const isOwn    = item.user_id === user?.id;

    return (
      <View style={{
        flexDirection: 'row', gap: 10,
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: 32, height: 32, borderRadius: 10,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
            {name[0].toUpperCase()}
          </Text>
        </LinearGradient>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
              {name}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {formatRelativeTime(item.created_at)}
            </Text>
            {isOwn && (
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                hitSlop={8}
                style={{ marginLeft: 'auto' }}
              >
                <Ionicons name="trash-outline" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 3, lineHeight: 18 }}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

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
            paddingHorizontal: 16, paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="chevron-down" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={{
              flex: 1, textAlign: 'center',
              fontSize: 16, fontWeight: '700', color: colors.foreground,
            }}>
              Comentarios
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Lista */}
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.pride.pink} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={c => c.id}
              renderItem={renderItem}
              style={{ flex: 1 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                  <Ionicons name="chatbubble-outline" size={36} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 10 }}>
                    Sé el primero en comentar
                  </Text>
                </View>
              }
            />
          )}

          {/* Input */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 10,
            borderTopWidth: 1, borderTopColor: colors.border, gap: 10,
          }}>
            <LinearGradient
              colors={myGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                width: 32, height: 32, borderRadius: 10,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {userName[0].toUpperCase()}
              </Text>
            </LinearGradient>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Agrega un comentario..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={300}
              style={{
                flex: 1, fontSize: 14, color: colors.foreground,
                backgroundColor: colors.secondary,
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
                maxHeight: 100,
              }}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || submitting}
              hitSlop={8}
            >
              {submitting
                ? <ActivityIndicator size="small" color={colors.pride.pink} />
                : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={text.trim() ? colors.pride.pink : colors.mutedForeground}
                  />
                )
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
