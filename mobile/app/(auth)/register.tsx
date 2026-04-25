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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Registration failed');
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
            Create account
          </Text>
          <Text className="mt-2 text-base text-muted-foreground">
            Sign up to get started
          </Text>
        </View>

        {/* Form */}
        <View className="mb-2">
          <Input
            label="Full name"
            placeholder="John Doe"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
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
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <Input
            label="Confirm password"
            placeholder="••••••••"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
          />

          <Button loading={loading} onPress={handleRegister} className="mt-2">
            Create Account
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
          <Text className="text-sm text-muted-foreground">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-sm font-semibold text-foreground">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
