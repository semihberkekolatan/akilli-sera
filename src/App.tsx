import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Sprout, 
  Wind, 
  Lightbulb, 
  Heater, 
  FlaskConical, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  Activity,
  Waves,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User as UserIcon,
  Leaf,
  BarChart2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

import { db, auth } from './firebase';
import { SensorReading, ActuatorControl, Alert } from './types';
import { SensorCard } from './components/SensorCard';
import { ControlToggle } from './components/ControlToggle';
import { AlertList } from './components/AlertList';
import { PlantModeCard } from './components/PlantModeCard';
import { BottomNav, ViewType } from './components/BottomNav';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [controls, setControls] = useState<ActuatorControl | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [greenhouseName, setGreenhouseName] = useState('Akıllı Sera');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('Akıllı Sera');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoModeEnabled, setAutoModeEnabled] = useState(false);

  const [plantMode, setPlantMode] = useState('manual');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const chartData = useMemo(() => {
    return readings.map(r => {
      const date = r.timestamp?.toDate ? r.timestamp.toDate() : (r.timestamp?.seconds ? new Date(r.timestamp.seconds * 1000) : null);
      return {
        ...r,
        formattedTime: date ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '---',
        formattedDate: date ? date.toLocaleDateString('tr-TR') : '---'
      };
    });
  }, [readings]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const greenhouseId = user.uid; // Using user UID as greenhouse ID for simplicity

    // 1. Listen to Sensor Readings
    const readingsQuery = query(
      collection(db, `greenhouses/${greenhouseId}/readings`),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribeReadings = onSnapshot(readingsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SensorReading[];
      setReadings(data.reverse());
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `greenhouses/${greenhouseId}/readings`);
    });

    // 2. Listen to Controls
    const controlsDoc = doc(db, `greenhouses/${greenhouseId}/controls/current`);
    const unsubscribeControls = onSnapshot(controlsDoc, (snapshot) => {
      if (snapshot.exists()) {
        setControls(snapshot.data() as ActuatorControl);
      } else {
        // Initialize default controls if not exists
        const initialControls: ActuatorControl = {
          irrigation: false,
          lighting: false,
          fan: false,
          heater: false,
          fertilizer: false,
          updatedAt: serverTimestamp()
        };
        setDoc(controlsDoc, initialControls).catch(e => 
          handleFirestoreError(e, OperationType.WRITE, `greenhouses/${greenhouseId}/controls/current`)
        );
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `greenhouses/${greenhouseId}/controls/current`);
    });

    // 3. Listen to Alerts
    const alertsQuery = query(
      collection(db, `greenhouses/${greenhouseId}/alerts`),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];
      setAlerts(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `greenhouses/${greenhouseId}/alerts`);
    });

    return () => {
      unsubscribeReadings();
      unsubscribeControls();
      unsubscribeAlerts();
    };
  }, [user, isAuthReady]);

  const handleToggle = async (key: keyof Omit<ActuatorControl, 'updatedAt'>) => {
    if (!user || !controls) return;
    const greenhouseId = user.uid;
    const controlsDoc = doc(db, `greenhouses/${greenhouseId}/controls/current`);

    try {
      await updateDoc(controlsDoc, {
        [key]: !controls[key],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `greenhouses/${greenhouseId}/controls/current`);
    }
  };

  const handleMarkRead = async (alertId: string) => {
    if (!user) return;
    const alertDoc = doc(db, `greenhouses/${user.uid}/alerts/${alertId}`);
    try {
      await updateDoc(alertDoc, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `greenhouses/${user.uid}/alerts/${alertId}`);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    if (!user) return;
    const alertDoc = doc(db, `greenhouses/${user.uid}/alerts/${alertId}`);
    try {
      await deleteDoc(alertDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `greenhouses/${user.uid}/alerts/${alertId}`);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const latestReading = readings[readings.length - 1] || {
    temperature: 0,
    humidity: 0,
    light: 0,
    soilMoisture: 0,
    nitrogen: 0
  };

  const renderView = () => {
    switch (currentView) {
      case 'data':
        return (
          <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif italic font-bold text-primary">Geçmiş Veriler</h2>
              <button className="p-2 bg-white rounded-xl card-shadow text-primary">
                <BarChart2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl card-shadow">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ort. Sıcaklık</p>
                <p className="text-xl font-bold text-rose-600">24.5°C</p>
              </div>
              <div className="bg-white p-4 rounded-2xl card-shadow">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ort. Nem</p>
                <p className="text-xl font-bold text-accent">62%</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl card-shadow">
              <h3 className="section-header">Haftalık Analiz</h3>
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="formattedTime" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Line type="monotone" dataKey="temperature" name="Sıcaklık" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" name="Nem" stroke="#63c5da" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl card-shadow overflow-hidden">
              <div className="p-4 border-b border-tan/10">
                <h3 className="text-sm font-bold text-slate-800">Son Okumalar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-tan/10 text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-2 font-bold">Zaman</th>
                      <th className="px-4 py-2 font-bold">Sıcaklık</th>
                      <th className="px-4 py-2 font-bold">Nem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tan/10">
                    {readings.slice(-5).reverse().map((r, idx) => {
                      const date = r.timestamp?.toDate ? r.timestamp.toDate() : (r.timestamp?.seconds ? new Date(r.timestamp.seconds * 1000) : null);
                      return (
                        <tr key={idx} className="hover:bg-tan/5 transition-colors">
                          <td className="px-4 py-3 text-slate-500">
                            {date ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">{r.temperature.toFixed(1)}°C</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{r.humidity.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        );
      case 'settings':
        return (
          <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">
            <h2 className="text-2xl font-serif italic font-bold text-primary">Ayarlar</h2>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Genel</h4>
              <div className="bg-white rounded-[2rem] card-shadow overflow-hidden border border-tan/10">
                <div className="p-5 border-b border-tan/10 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-bold text-slate-800">Sera Adı</span>
                      {isEditingName ? (
                        <input 
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="text-[10px] text-slate-600 border-b border-primary focus:outline-none bg-transparent w-full"
                          autoFocus
                          onBlur={() => {
                            if (tempName.trim()) {
                              setGreenhouseName(tempName);
                            }
                            setIsEditingName(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (tempName.trim()) {
                                setGreenhouseName(tempName);
                              }
                              setIsEditingName(false);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">{greenhouseName}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (isEditingName) {
                        if (tempName.trim()) {
                          setGreenhouseName(tempName);
                        }
                        setIsEditingName(false);
                      } else {
                        setTempName(greenhouseName);
                        setIsEditingName(true);
                      }
                    }}
                    className="text-[10px] font-bold text-primary uppercase tracking-widest ml-2 bg-primary/5 px-3 py-1.5 rounded-lg"
                  >
                    {isEditingName ? 'Kaydet' : 'Düzenle'}
                  </button>
                </div>
                <div className="p-5 border-b border-tan/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shadow-sm">
                      <Bell className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Bildirimler</span>
                  </div>
                  <button 
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-300 ${notificationsEnabled ? 'bg-primary shadow-inner shadow-black/10' : 'bg-tan/30'}`}
                  >
                    <div className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shadow-sm">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Otomatik Mod</span>
                  </div>
                  <button 
                    onClick={() => setAutoModeEnabled(!autoModeEnabled)}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-300 ${autoModeEnabled ? 'bg-primary shadow-inner shadow-black/10' : 'bg-tan/30'}`}
                  >
                    <div className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md ${autoModeEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Hesap</h4>
              <div className="bg-white rounded-[2rem] card-shadow overflow-hidden border border-tan/10">
                <div className="p-5 border-b border-tan/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{user?.displayName}</span>
                      <span className="text-[10px] text-slate-400">{user?.email}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            </div>
            
            <div className="bg-rose-50 p-5 rounded-[2rem] border border-rose-100 shadow-sm">
              <button 
                onClick={() => signOut(auth)}
                className="w-full flex items-center justify-center gap-3 text-rose-600 font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <LogOut className="w-5 h-5" />
                </div>
                Oturumu Kapat
              </button>
            </div>
          </main>
        );
      case 'info':
        return (
          <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">
            <h2 className="text-2xl font-serif italic font-bold text-primary">Sistem Bilgisi</h2>
            <div className="bg-white p-8 rounded-[2.5rem] card-shadow text-center border border-tan/10 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary/5 rounded-full blur-2xl" />
              <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Sprout className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-800">Akıllı Sera V1.2</h3>
              <div className="w-12 h-1 bg-secondary/20 mx-auto my-4 rounded-full" />
              <p className="text-sm text-slate-500 leading-relaxed">
                Bu sistem bitkilerinizin büyüme koşullarını optimize etmek için tasarlanmıştır. 
                Sıcaklık, nem, ışık ve toprak değerlerini anlık olarak takip eder.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Donanım Durumu</h4>
              <div className="bg-white p-5 rounded-[2rem] card-shadow space-y-4 border border-tan/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">Arduino Mega</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-secondary font-bold bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">BAĞLI</span>
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center">
                      <Wind className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">ESP8266 Wi-Fi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-secondary font-bold bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">BAĞLI</span>
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sprout className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">Sensörler</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-secondary font-bold bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">AKTİF</span>
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Geliştirici</h4>
              <div className="bg-white p-5 rounded-[2rem] card-shadow flex items-center gap-4 border border-tan/10">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Semih Berke Kolatan</p>
                  <p className="text-[10px] text-slate-500 font-medium">Yazılım Geliştirici</p>
                </div>
              </div>
            </div>
          </main>
        );
      default:
        return (
          <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">
            {/* Status Bar */}
            <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-2xl shadow-primary/30 flex items-center justify-between overflow-hidden relative mb-8 group">
              {/* Decorative background elements */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute top-0 left-0 w-2.5 h-full bg-secondary" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="bg-white/10 p-3.5 rounded-[1.5rem] backdrop-blur-xl border border-white/20 shadow-xl">
                  <Activity className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Sistem İzleme</span>
                    <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse shadow-[0_0_5px_rgba(123,163,75,1)]" />
                      <span className="text-[8px] font-black text-white/80 tracking-widest">LIVE</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold tracking-tight drop-shadow-sm">Normal İşleyiş</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="hidden sm:flex flex-col items-end mr-1">
                  <span className="text-[9px] font-bold uppercase text-white/30 tracking-widest">Bağlantı</span>
                  <span className="text-[11px] font-black text-secondary drop-shadow-[0_0_5px_rgba(123,163,75,0.3)]">STABİL</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-full blur-lg animate-pulse" />
                  <CheckCircle2 className="w-10 h-10 text-secondary relative z-10 drop-shadow-[0_0_10px_rgba(123,163,75,0.6)]" />
                </div>
              </div>
            </div>

            {/* Sensor Grid */}
            <div className="grid grid-cols-2 gap-3">
              <SensorCard 
                title="Sıcaklık" 
                value={latestReading.temperature.toFixed(0)} 
                unit="°C" 
                icon={Thermometer} 
                color="bg-rose-500" 
              />
              <SensorCard 
                title="Nem" 
                value={latestReading.humidity.toFixed(0)} 
                unit="%" 
                icon={Droplets} 
                color="bg-accent" 
              />
              <SensorCard 
                title="Işık" 
                value={latestReading.light.toFixed(0)} 
                unit="lx" 
                icon={Sun} 
                color="bg-tan" 
              />
              <SensorCard 
                title="Azot" 
                value={latestReading.nitrogen.toFixed(0)} 
                unit="mg/L" 
                icon={Leaf} 
                color="bg-primary" 
              />
            </div>

            {/* Chart Section */}
            <div className="bg-white p-4 rounded-2xl card-shadow">
              <h3 className="section-header">Nem Seviyesi - Son 7 Gün</h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#63c5da" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#63c5da" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="formattedTime" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="humidity" 
                      name="Nem"
                      stroke="#63c5da" 
                      fillOpacity={1} 
                      fill="url(#colorHum)" 
                      strokeWidth={3}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between px-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Pzt</span>
                <span>Sal</span>
                <span>Çar</span>
                <span>Per</span>
                <span>Cum</span>
                <span>Cmt</span>
                <span>Paz</span>
              </div>
            </div>

            {/* Controls Section */}
            <div>
              <h3 className="section-header">Kontroller</h3>
              <div className="grid grid-cols-3 gap-2">
                <ControlToggle 
                  label="Işık" 
                  isActive={controls?.lighting || false} 
                  onToggle={() => handleToggle('lighting')} 
                  icon={Sun}
                />
                <ControlToggle 
                  label="Sulama" 
                  isActive={controls?.irrigation || false} 
                  onToggle={() => handleToggle('irrigation')} 
                  icon={Droplets}
                />
                <ControlToggle 
                  label="İklimlendirme" 
                  isActive={controls?.fan || false} 
                  onToggle={() => handleToggle('fan')} 
                  icon={Wind}
                />
              </div>
            </div>

            {/* Plant Modes Section */}
            <div>
              <h3 className="section-header">Bitki Modları</h3>
              <div className="grid grid-cols-3 gap-2">
                <PlantModeCard 
                  label="Domates Modu" 
                  icon={Sprout} 
                  isActive={plantMode === 'tomato'} 
                  onClick={() => setPlantMode('tomato')}
                  color="text-rose-500"
                />
                <PlantModeCard 
                  label="Salatalık Modu" 
                  icon={Leaf} 
                  isActive={plantMode === 'cucumber'} 
                  onClick={() => setPlantMode('cucumber')}
                  color="text-secondary"
                />
                <PlantModeCard 
                  label="Manuel Mod" 
                  icon={Settings} 
                  isActive={plantMode === 'manual'} 
                  onClick={() => setPlantMode('manual')}
                  color="text-navy"
                />
              </div>
            </div>

            {/* Recommendation Alert */}
            {latestReading.nitrogen < 20 && (
              <div className="bg-tan/20 border border-tan/50 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="bg-tan/30 p-2 rounded-lg text-primary">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-primary leading-tight">
                  Azot seviyesi düşük, <span className="underline">Gübreleme önerilir!</span>
                </p>
              </div>
            )}

            {/* System Logs / Alerts */}
            <div className="bg-white p-4 rounded-2xl card-shadow">
              <AlertList 
                alerts={alerts} 
                onDismiss={handleDismissAlert} 
                onMarkRead={handleMarkRead}
              />
            </div>
          </main>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-tan/20 text-center"
        >
          <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-tan/30">
            <Sprout className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-3">Sera Takip Paneli</h1>
          <p className="text-slate-500 mb-10">Akıllı sera sisteminize bağlanın ve bitkilerinizi her yerden izleyin.</p>
          <button
            onClick={handleLogin}
            className="w-full py-4 px-6 bg-navy text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-900 transition-all active:scale-95 shadow-xl shadow-tan/20"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Google ile Giriş Yap
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col pb-20">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Sprout className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-serif font-bold tracking-tight">{greenhouseName}</h1>
        </div>
        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative p-2 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-colors"
          >
            <motion.div
              animate={alerts.filter(a => !a.read).length > 0 ? {
                rotate: [0, -10, 10, -10, 10, 0],
                transition: { repeat: Infinity, duration: 2, repeatDelay: 1 }
              } : {}}
            >
              <Bell className="w-6 h-6" />
            </motion.div>
            {alerts.filter(a => !a.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-primary rounded-full shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
            )}
          </motion.button>

          <AnimatePresence>
            {isAlertsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsAlertsOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 bg-white rounded-[1.5rem] shadow-2xl border border-tan/10 z-40 overflow-hidden"
                >
                  <div className="p-4 border-b border-tan/10 bg-tan/5 flex items-center justify-between">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">Bildirimler</span>
                    <span className="text-[10px] font-bold text-slate-400">{alerts.filter(a => !a.read).length} Yeni</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {alerts.length > 0 ? (
                      <div className="space-y-1">
                        {alerts.slice(0, 5).map((alert) => (
                          <div 
                            key={alert.id} 
                            className={`p-3 rounded-xl transition-colors ${alert.read ? 'bg-transparent opacity-60' : 'bg-primary/5'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-lg shrink-0 ${
                                alert.severity === 'high' ? 'bg-rose-100 text-rose-500' : 
                                alert.severity === 'medium' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-500'
                              }`}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight mb-0.5">{alert.message}</p>
                                <p className="text-[9px] text-slate-400 font-medium">
                                  {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Bell className="w-8 h-8 text-tan/30 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Yeni bildirim yok</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setCurrentView('info');
                      setIsAlertsOpen(false);
                    }}
                    className="w-full py-3 bg-tan/5 text-[10px] font-black text-primary uppercase tracking-widest border-t border-tan/10 hover:bg-tan/10 transition-colors"
                  >
                    Tümünü Gör
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {renderView()}

      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );

}


