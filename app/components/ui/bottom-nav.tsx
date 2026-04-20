'use client';
// components/ui/bottom-nav.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ScanLine,
  History,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/scan', icon: ScanLine, label: 'Scan', primary: true },
  { href: '/history', icon: History, label: 'History' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 safe-pb'>
      <div className='flex items-center justify-around px-2 pt-2 pb-1'>
        {NAV_ITEMS.map(({ href, icon: Icon, label, primary }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150',
                primary
                  ? cn(
                      'relative -top-5 bg-orange-500 shadow-lg shadow-orange-500/30 px-5 py-4',
                      'hover:bg-orange-400 active:scale-95',
                      isActive && 'bg-orange-400 ring-2 ring-orange-300/30'
                    )
                  : cn(
                      'hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700',
                      isActive ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'
                    )
              )}
            >
              <Icon
                size={primary ? 26 : 22}
                className={primary ? 'text-white' : undefined}
                strokeWidth={isActive && !primary ? 2.5 : 1.75}
              />
              {!primary && (
                <span className='text-[10px] font-medium leading-none'>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
