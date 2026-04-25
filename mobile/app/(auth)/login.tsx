import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SocialButtons from '../../components/auth/SocialButtons';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-10">
          <Text className="text-4xl font-bold text-foreground tracking-tight">
            Welcome back
          </Text>
          <Text className="mt-2 text-base text-muted-foreground">
            Sign in to your account to continue
          </Text>
        </View>

        {/* Form */}
        <View className="mb-2">
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <TouchableOpacity className="self-end -mt-2 mb-5">
            <Text className="text-sm text-muted-foreground">Forgot password?</Text>
          </TouchableOpacity>

          <Button loading={loading} onPress={handleLogin}>
            Sign In
          </Button>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6 gap-3">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-sm text-muted-foreground">or continue with</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Social */}
        <SocialButtons />

        {/* Footer */}
        <View className="flex-row justify-center mt-8 gap-1">
          <Text className="text-sm text-muted-foreground">Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-sm font-semibold text-foreground">Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
