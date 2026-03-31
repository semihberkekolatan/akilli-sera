import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ControlToggleProps {
  label: string;
  isActive: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  isLoading?: boolean;
}

export function ControlToggle({ label, isActive, onToggle, icon: Icon, isLoading }: ControlToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      disabled={isLoading}
      className={`flex flex-col items-center justify-between px-2 py-4 rounded-[2.5rem] card-shadow border-2 transition-all h-full ${
        isActive 
          ? 'bg-white border-primary shadow-lg shadow-primary/10' 
          : 'bg-white border-tan/10'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex flex-col items-center gap-2 mb-3 w-full">
        <div className={`p-3 rounded-2xl ${isActive ? 'bg-primary/10 text-primary' : 'bg-tan/10 text-slate-400'}`}>
          <Icon className="w-7 h-7" />
        </div>
        <span className="text-[8px] font-black text-slate-700 uppercase tracking-[-0.07em] text-center leading-none px-0.5 whitespace-nowrap w-full overflow-hidden text-ellipsis">
          {label}
        </span>
      </div>
      
      <div className={`w-full py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center transition-all ${
        isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-tan/10 text-slate-400'
      }`}>
        {isActive ? 'ON' : 'OFF'}
      </div>
    </motion.button>
  );
}


