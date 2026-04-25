import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Alert, ActionSheetIOS, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface AvatarPickerProps {
  uri: string | null;
  onChange: (uri: string) => void;
}

export default function AvatarPicker({ uri, onChange }: AvatarPickerProps) {
  const [loading, setLoading] = useState(false);

  async function requestAndPick(source: 'camera' | 'library') {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar la foto.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para elegir la foto.');
        return;
      }
    }

    setLoading(true);
    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } finally {
      setLoading(false);
    }
  }

  function showOptions() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar foto', 'Elegir de la galería'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) requestAndPick('camera');
          if (index === 2) requestAndPick('library');
        },
      );
    } else {
      Alert.alert('Foto de perfil', 'Elige una opción', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto',         onPress: () => requestAndPick('camera')  },
        { text: 'Elegir de galería',  onPress: () => requestAndPick('library') },
      ]);
    }
  }

  return (
    <View className="items-center mb-6">
      <TouchableOpacity
        onPress={showOptions}
        activeOpacity={0.8}
        disabled={loading}
        style={{
          width: 96,
          height: 96,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: uri ? 2 : 2,
          borderStyle: uri ? 'solid' : 'dashed',
          borderColor: uri ? colors.primary : colors.border,
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {/* Edit overlay */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                paddingVertical: 5,
                alignItems: 'center',
              }}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </>
        ) : (
          <View className="items-center gap-1.5">
            <Ionicons
              name={loading ? 'hourglass-outline' : 'camera-outline'}
              size={24}
              color={colors.mutedForeground}
            />
            <Text className="text-[10px] text-muted-foreground">
              {loading ? 'Cargando...' : 'Subir foto'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {uri && (
        <Text className="text-xs text-primary mt-2 font-medium">
          Foto seleccionada ✓
        </Text>
      )}
    </View>
  );
}
