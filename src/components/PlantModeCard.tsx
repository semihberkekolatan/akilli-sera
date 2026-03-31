import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface PlantModeCardProps {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}

export function PlantModeCard({ label, icon: Icon, isActive, onClick, color = 'text-emerald-600' }: PlantModeCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-2 py-4 rounded-[2.5rem] card-shadow transition-all border-2 ${
        isActive 
          ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105 z-10' 
          : 'bg-white text-slate-700 border-tan/10 hover:border-primary/30'
      }`}
    >
      <div className={`p-3 rounded-2xl mb-3 ${isActive ? 'bg-white/20' : 'bg-tan/10'} ${isActive ? 'text-white' : color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <span className={`text-[8px] font-black text-center leading-tight uppercase tracking-[-0.07em] whitespace-nowrap overflow-hidden text-ellipsis w-full ${isActive ? 'text-white' : 'text-slate-600'}`}>
        {label}
      </span>
    </motion.button>
  );
}
