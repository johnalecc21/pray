import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { prideGradientShort } from '../../lib/theme';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'pride';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({ children, variant = 'primary', loading, icon, className, disabled, ...props }: ButtonProps) {
  const base = 'h-12 rounded-lg flex-row items-center justify-center gap-2.5 px-4 overflow-hidden';

  const variants = {
    primary: 'bg-primary active:opacity-80',
    outline: 'border border-border bg-card active:bg-secondary',
    ghost: 'active:bg-secondary',
    pride: '',
  };

  const textVariants = {
    primary: 'text-primary-foreground font-semibold text-base',
    outline: 'text-foreground font-medium text-base',
    ghost: 'text-foreground font-medium text-base',
    pride: 'text-white font-semibold text-base',
  };

  if (variant === 'pride') {
    return (
      <TouchableOpacity
        className={`${base} ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={prideGradientShort as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            {icon && <View>{icon}</View>}
            <Text className={textVariants.pride}>{children}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#f7f7f7' : '#f7f7f7'} size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={textVariants[variant]}>{children}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
