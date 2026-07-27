'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon3D, type Icon3DName } from '@/components/ui/icon-3d';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/telegram/webapp';
import { track } from '@/lib/analytics';
import { usePersistentFlag } from '@/hooks/use-persistent-flag';

const STORAGE_KEY = 'pochtashop.onboarding.completed';

const SCREENS: Array<{ icon: Icon3DName; title: string; body: string }> = [
  {
    icon: 'store',
    title: 'Chet eldan xarid qilish endi oson',
    body: "Mahsulotni toping, sotuvchini tekshiring va eng yaxshi yetkazish usulini tanlang.",
  },
  {
    icon: 'calculator',
    title: 'Xarajatni oldindan biling',
    body: "Mahsulot, kuryer va taxminiy bojxona xarajatlarini bitta joyda hisoblang.",
  },
  {
    icon: 'customs',
    title: 'Xavfsizroq qaror qiling',
    body: "AI yordamida mahsulot, sotuvchi va bojxona xavfini tekshiring.",
  },
];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [seen, setSeen] = usePersistentFlag(STORAGE_KEY);
  const [index, setIndex] = React.useState(0);

  const finish = React.useCallback(
    (completed: boolean) => {
      if (completed) track('onboarding_completed');
      setSeen(true);
    },
    [setSeen],
  );

  // `null` means the flag has not been read yet (server render).
  if (seen === null) return null;
  if (seen) return <>{children}</>;

  const screen = SCREENS[index];
  if (!screen) return <>{children}</>;
  const isLast = index === SCREENS.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between px-6 pb-10 pt-16 safe-top">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-6"
          >
            <Icon3D name={screen.icon} size="lg" />
            <h1 className="text-[26px] font-bold leading-tight text-content">{screen.title}</h1>
            <p className="max-w-sm text-[15px] leading-relaxed text-content-secondary">
              {screen.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-2" aria-hidden="true">
          {SCREENS.map((item, dotIndex) => (
            <span
              key={item.title}
              className={
                dotIndex === index
                  ? 'h-2 w-6 rounded-full bg-primary transition-all'
                  : 'h-2 w-2 rounded-full bg-border transition-all'
              }
            />
          ))}
        </div>

        <Button
          size="lg"
          block
          onClick={() => {
            haptic('light');
            if (isLast) finish(true);
            else setIndex((value) => value + 1);
          }}
        >
          {isLast ? 'Boshlash' : 'Keyingisi'}
        </Button>
        <Button variant="ghost" block onClick={() => finish(false)}>
          O&apos;tkazib yuborish
        </Button>
      </div>
    </div>
  );
}
