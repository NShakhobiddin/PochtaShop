import { BottomNav } from '@/components/layout/bottom-nav';
import { TelegramBackButton, TelegramProvider } from '@/features/telegram-auth/telegram-provider';
import { AppErrorBoundary } from '@/components/layout/error-boundary';
import { OnboardingGate } from '@/features/onboarding/onboarding-gate';

const ROOT_PATHS = ['/', '/search', '/ai', '/saved', '/profile'];

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <TelegramBackButton rootPaths={ROOT_PATHS} />
      <OnboardingGate>
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-[104px]">
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </div>
        <BottomNav />
      </OnboardingGate>
    </TelegramProvider>
  );
}
