import React from 'react';
import { BarChart3, Vote, ScanLine, Search, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'voting' | 'verify' | 'dpt' | 'security';
  setActiveTab: (tab: 'dashboard' | 'voting' | 'verify' | 'dpt' | 'security') => void;
  hasActiveToken: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  hasActiveToken
}) => {
  interface NavItem {
    id: 'dashboard' | 'voting' | 'verify' | 'dpt' | 'security';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: boolean;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Quick Count',
      icon: BarChart3,
      badge: false
    },
    {
      id: 'voting',
      label: 'Bilik Suara',
      icon: Vote,
      badge: hasActiveToken
    },
    {
      id: 'verify',
      label: 'e-KTP',
      icon: ScanLine,
      badge: false
    },
    {
      id: 'dpt',
      label: 'Cek DPT',
      icon: Search,
      badge: false
    },
    {
      id: 'security',
      label: 'Audit',
      icon: ShieldCheck,
      badge: false
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-h-[52px] py-1 transition-all cursor-pointer ${
                isActive ? 'text-red-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-600 rounded-b-full shadow-xs" />
              )}

              <div className="relative mt-1">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${
                isActive ? 'text-red-700' : 'text-slate-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
