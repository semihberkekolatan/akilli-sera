import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Bell, CheckCircle2, X } from 'lucide-react';
import { Alert } from '../types';

interface AlertListProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export function AlertList({ alerts, onDismiss, onMarkRead }: AlertListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistem Bildirimleri</span>
          <h3 className="text-lg font-serif font-bold text-slate-900">Aktif Uyarılar</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-tan/20 rounded-md border border-tan/30">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
            {alerts.filter(a => !a.read).length} Yeni
          </span>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-12 h-12 bg-tan/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-tan" />
              </div>
              <p className="text-xs font-bold text-tan uppercase tracking-widest">Tüm sistemler normal</p>
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-xl border transition-all ${
                  alert.read ? 'bg-tan/5 border-tan/20 opacity-60' : 
                  alert.severity === 'high' ? 'bg-rose-50/50 border-rose-100' :
                  'bg-white border-tan/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-1 rounded-md ${
                    alert.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-tan/20 text-primary'
                  }`}>
                    {alert.severity === 'high' ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <Bell className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        alert.severity === 'high' ? 'text-rose-500' : 'text-secondary'
                      }`}>
                        {alert.severity === 'high' ? 'Yüksek' : 'Normal'} Öncelik
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {new Date(alert.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-tan/10">
                      {!alert.read && (
                        <button
                          onClick={() => onMarkRead(alert.id)}
                          className="text-[9px] font-bold text-primary uppercase tracking-widest hover:text-secondary transition-colors"
                        >
                          Okundu İşaretle
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(alert.id)}
                        className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

