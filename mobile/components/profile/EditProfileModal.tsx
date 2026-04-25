import { useState } from 'react';
import {
  Modal, View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AvatarPicker from '../onboarding/AvatarPicker';
import SelectChip from '../onboarding/SelectChip';
import LocationInput from './LocationInput';
import { colors } from '../../lib/theme';
import {
  identityOptions, pronounOptions,
  interestOptions, moodOptions,
} from '../../features/onboarding/data';
import type { UserProfile, ProfileUpdate } from '../../features/profile/types';

interface EditProfileModalProps {
  profile:  UserProfile;
  saving:   boolean;
  onSave:   (changes: ProfileUpdate, newAvatarUri?: string) => Promise<void>;
  onClose:  () => void;
}

export default function EditProfileModal({
  profile, saving, onSave, onClose,
}: EditProfileModalProps) {
  const [name,       setName]       = useState(profile.name ?? '');
  const [bio,        setBio]        = useState(profile.bio ?? '');
  const [location,   setLocation]   = useState(profile.location ?? '');
  const [age,        setAge]        = useState<number | null>(profile.age ?? null);
  const [pronouns,   setPronouns]   = useState(profile.pronouns ?? '');
  const [identity,   setIdentity]   = useState<string[]>(profile.identity);
  const [interests,  setInterests]  = useState<string[]>(profile.interests);
  const [moods,      setMoods]      = useState<string[]>(profile.moods);
  const [avatarUri,  setAvatarUri]  = useState<string | null>(null);

  function toggleItem(
    list: string[],
    setList: (v: string[]) => void,
    value: string,
  ) {
    setList(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value],
    );
  }

  async function handleSave() {
    try {
      if (age !== null && age < 18) {
        Alert.alert('Edad inválida', 'Debes tener al menos 18 años.');
        return;
      }
      await onSave(
        {
          name:      name.trim(),
          bio:       bio.trim(),
          location:  location.trim(),
          age,
          pronouns,
          identity,
          interests,
          moods,
        },
        avatarUri ?? undefined,
      );
      onClose();
    } catch (err) {
      Alert.alert(
        'Error al guardar',
        err instanceof Error ? err.message : 'Intenta de nuevo.',
      );
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text className="text-base text-muted-foreground font-medium">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-foreground">Editar perfil</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text className="text-base font-bold" style={{ color: colors.primary }}>
                Guardar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 20, gap: 24 }}
        >
          {/* Avatar */}
          <AvatarPicker
            uri={avatarUri ?? profile.avatar_url}
            onChange={setAvatarUri}
          />

          {/* Nombre */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Nombre
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.mutedForeground}
              style={{
                backgroundColor: colors.secondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.foreground,
                fontSize: 15,
              }}
            />
          </View>

          {/* Ubicación */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Ubicación
            </Text>
            <LocationInput value={location} onChange={setLocation} />
          </View>

          {/* Edad */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Edad
            </Text>
            <TextInput
              value={age !== null ? String(age) : ''}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                setAge(text === '' ? null : isNaN(num) ? null : num);
              }}
              placeholder="Ej: 27"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              maxLength={2}
              style={{
                backgroundColor:   colors.secondary,
                borderWidth:       1,
                borderColor:       (age !== null && age < 18) ? colors.destructive : colors.border,
                borderRadius:      12,
                paddingHorizontal: 14,
                paddingVertical:   12,
                color:             colors.foreground,
                fontSize:          15,
                width:             100,
              }}
            />
            {age !== null && age < 18 && (
              <Text style={{ color: colors.destructive, fontSize: 12 }}>
                Debes tener al menos 18 años
              </Text>
            )}
          </View>

          {/* Bio */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Descripción
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Cuéntanos algo sobre ti..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.secondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.foreground,
                fontSize: 15,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Pronombres */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Pronombres
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {pronounOptions.map((opt) => (
                <SelectChip
                  key={opt.label}
                  label={opt.label}
                  selected={pronouns === opt.label}
                  onPress={() => setPronouns(opt.label)}
                  color={colors.primary}
                />
              ))}
            </View>
          </View>

          {/* Identidad */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Identidad
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {identityOptions.map((opt) => (
                <SelectChip
                  key={opt.label}
                  label={opt.label}
                  selected={identity.includes(opt.label)}
                  onPress={() => toggleItem(identity, setIdentity, opt.label)}
                  color={opt.color}
                />
              ))}
            </View>
          </View>

          {/* Mood */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Mood actual
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {moodOptions.map((opt) => (
                <SelectChip
                  key={opt.label}
                  label={opt.label}
                  selected={moods.includes(opt.label)}
                  onPress={() => toggleItem(moods, setMoods, opt.label)}
                  color={opt.color}
                />
              ))}
            </View>
          </View>

          {/* Intereses */}
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Intereses
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {interestOptions.map((opt) => (
                <SelectChip
                  key={opt.label}
                  label={opt.label}
                  selected={interests.includes(opt.label)}
                  onPress={() => toggleItem(interests, setInterests, opt.label)}
                  color={opt.color}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
