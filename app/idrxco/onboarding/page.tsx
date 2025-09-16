// app/(auth)/onboarding/page.tsx
import { OnboardingForm } from '../components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        Welcome to IDRX Offramp
      </h1>
      <OnboardingForm />
    </div>
  );
}