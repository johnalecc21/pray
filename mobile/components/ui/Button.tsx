import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({ children, variant = 'primary', loading, icon, className, disabled, ...props }: ButtonProps) {
  const base = 'h-12 rounded-lg flex-row items-center justify-center gap-2.5 px-4';

  const variants = {
    primary: 'bg-primary active:opacity-80',
    outline: 'border border-border bg-background active:bg-secondary',
    ghost: 'active:bg-secondary',
  };

  const textVariants = {
    primary: 'text-primary-foreground font-semibold text-base',
    outline: 'text-foreground font-medium text-base',
    ghost: 'text-foreground font-medium text-base',
  };

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fafafa' : '#1c1c1c'} size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={textVariants[variant]}>{children}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
