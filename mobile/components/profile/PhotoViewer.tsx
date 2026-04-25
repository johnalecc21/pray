import { Modal, View, Image, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface PhotoViewerProps {
  uri:     string | null;
  onClose: () => void;
}

export default function PhotoViewer({ uri, onClose }: PhotoViewerProps) {
  if (!uri) return null;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={{ uri }}
          style={{ width, height: height * 0.85 }}
          resizeMode="contain"
        />

        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 52,
            right: 20,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
