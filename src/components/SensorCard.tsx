import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

export function SensorCard({ title, value, unit, icon: Icon, color }: SensorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-4 rounded-[2rem] card-shadow flex items-center gap-3 border border-tan/10"
    >
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 shrink-0`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate">{title}</span>
        <div className="flex items-baseline gap-0.5">
          <h3 className="text-lg font-bold text-slate-800">{value}</h3>
          <span className="text-[10px] font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}


