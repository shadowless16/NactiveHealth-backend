export type UserRole = 'doctor' | 'nurse' | 'admin';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  password_hash?: string;
  created_at?: string;
}

export interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  created_at?: string;
}

export interface Encounter {
  id: number;
  patient_id: number;
  clinician_role: string;
  notes?: string;
  created_at?: string;
}

export interface Prescription {
  id: number;
  encounter_id: number;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  created_by: number;
  created_at?: string;
  prescribed_by?: string; // Virtual field joined from users
}

export interface AuditLog {
  id: number;
  user_role: UserRole;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id?: number;
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
