import { TelegramProvider } from '@/features/telegram-auth/telegram-provider';
import { CourierGate } from '@/features/courier-panel/courier-gate';

export default function CourierPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <CourierGate>
        <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">{children}</div>
      </CourierGate>
    </TelegramProvider>
  );
}
