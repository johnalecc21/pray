import { forwardRef } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Input = forwardRef<TextInput, InputProps>(({ label, error, className, ...props }, ref) => {
  return (
    <View className="gap-1.5 mb-4">
      {label && (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      )}
      <TextInput
        ref={ref}
        className={`h-12 rounded-lg border border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground ${error ? 'border-destructive' : ''} ${className ?? ''}`}
        placeholderTextColor="#737373"
        {...props}
      />
      {error && (
        <Text className="text-xs text-destructive">{error}</Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';
export default Input;
