import { View, TouchableOpacity, Text, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../features/onboarding/hooks/useOnboarding';
import { colors } from '../../lib/theme';
import ProgressBar from '../../components/onboarding/ProgressBar';
import WelcomeStep    from '../../components/onboarding/steps/WelcomeStep';
import IdentityStep   from '../../components/onboarding/steps/IdentityStep';
import InterestsStep  from '../../components/onboarding/steps/InterestsStep';
import MoodStep       from '../../components/onboarding/steps/MoodStep';
import DoneStep       from '../../components/onboarding/steps/DoneStep';

export default function OnboardingScreen() {
  const { step, state, toggleMulti, setSingle, next, back, isLast, complete } = useOnboarding();

  async function handleNext() {
    if (isLast) {
      await complete();
      router.replace('/(tabs)');
    } else {
      next();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Progress bar */}
      <ProgressBar step={step} />

      {/* Step content */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {step === 0 && <WelcomeStep />}

        {step === 1 && (
          <IdentityStep
            selectedIdentity={state.identity}
            selectedPronouns={state.pronouns}
            onToggleIdentity={(val) => toggleMulti('identity', val)}
            onSelectPronouns={(val) => setSingle('pronouns', val)}
          />
        )}

        {step === 2 && (
          <InterestsStep
            selected={state.interests}
            onToggle={(val) => toggleMulti('interests', val)}
          />
        )}

        {step === 3 && (
          <MoodStep
            selected={state.moods}
            onToggle={(val) => toggleMulti('moods', val)}
          />
        )}

        {step === 4 && <DoneStep state={state} />}
      </ScrollView>

      {/* Bottom navigation */}
      <View className="px-5 pb-6 pt-4 gap-2">
        {/* Primary CTA */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          className="h-14 rounded-2xl overflow-hidden items-center justify-center"
          style={{
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <LinearGradient
            colors={[colors.pride.red, colors.pride.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ ...StyleSheet_absoluteFill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          >
            <Text className="text-white font-bold text-base">
              {isLast ? 'Entrar a Tribu' : 'Continuar'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Back button */}
        {step > 0 && !isLast && (
          <TouchableOpacity
            onPress={back}
            activeOpacity={0.7}
            className="h-11 items-center justify-center rounded-2xl"
          >
            <Text className="text-sm font-semibold text-muted-foreground">Volver</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Inline helper to avoid importing StyleSheet just for absoluteFill
const StyleSheet_absoluteFill = {
  position: 'absolute' as const,
  top: 0, right: 0, bottom: 0, left: 0,
};
