import { LinearGradient } from 'expo-linear-gradient';
import { View, ViewProps } from 'react-native';
import { prideGradient } from '../../lib/theme';

interface PrideGradientProps extends ViewProps {
  children?: React.ReactNode;
  angle?: number;
}

/** Reemplaza .pride-gradient del CSS */
export function PrideGradientBg({ children, style, ...props }: PrideGradientProps) {
  return (
    <LinearGradient
      colors={prideGradient as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ flex: 1 }, style as object]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

interface PrideBorderProps extends ViewProps {
  children: React.ReactNode;
  borderWidth?: number;
  borderRadius?: number;
}

/** Reemplaza .pride-border del CSS (::before con gradiente) */
export function PrideBorder({ children, borderWidth = 2, borderRadius = 16, style, ...props }: PrideBorderProps) {
  return (
    <View style={[{ padding: borderWidth, borderRadius: borderRadius + borderWidth }, style as object]} {...props}>
      <LinearGradient
        colors={prideGradient as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0, borderRadius: borderRadius + borderWidth }}
      />
      <View style={{ borderRadius, overflow: 'hidden', backgroundColor: '#141220' }}>
        {children}
      </View>
    </View>
  );
}
