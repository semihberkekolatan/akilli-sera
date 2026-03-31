export interface SensorReading {
  id?: string;
  temperature: number;
  humidity: number;
  light: number;
  soilMoisture: number;
  nitrogen: number;
  timestamp: any;
}

export interface ActuatorControl {
  irrigation: boolean;
  lighting: boolean;
  fan: boolean;
  heater: boolean;
  fertilizer: boolean;
  updatedAt: any;
}

export interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: any;
  read: boolean;
}
