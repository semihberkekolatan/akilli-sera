import { Home, BarChart2, Settings, Info } from 'lucide-react';

export type ViewType = 'home' | 'data' | 'settings' | 'info';

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-tan/30 px-6 py-3 flex items-center justify-between z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
      <NavItem 
        icon={Home} 
        label="Ana Sayfa" 
        isActive={currentView === 'home'} 
        onClick={() => onViewChange('home')}
      />
      <NavItem 
        icon={BarChart2} 
        label="Veriler" 
        isActive={currentView === 'data'} 
        onClick={() => onViewChange('data')}
      />
      <NavItem 
        icon={Settings} 
        label="Ayarlar" 
        isActive={currentView === 'settings'} 
        onClick={() => onViewChange('settings')}
      />
      <NavItem 
        icon={Info} 
        label="Bilgi" 
        isActive={currentView === 'info'} 
        onClick={() => onViewChange('info')}
      />
    </div>
  );
}

function NavItem({ 
  icon: Icon, 
  label, 
  isActive = false,
  onClick
}: { 
  icon: any, 
  label: string, 
  isActive?: boolean,
  onClick: () => void
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
