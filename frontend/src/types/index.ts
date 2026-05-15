export type Role = 'admin' | 'doctor' | 'patient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type PrescriptionStatus = 'pending' | 'consumed';

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  instructions: string | null;
}

export interface Patient {
  id: string;
  birdDate: string | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Doctor {
  id: string;
  speciality: string | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Prescription {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes: string | null;
  createdAt: string;
  consumedAt: string | null;
  patient: Patient;
  author: Doctor;
  items: PrescriptionItem[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Metrics {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
}

export interface DailyPrescription {
  date: string;
  count: number;
}

export interface CreatePrescriptionItemDto {
  name: string;
  dosage?: string;
  quantity?: number;
  instructions?: string;
}

export interface CreatePrescriptionDto {
  patientId: string;
  notes?: string;
  items: CreatePrescriptionItemDto[];
}

export interface DoctorListItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  doctor: {
    id: string;
    speciality: string | null;
  };
}

export interface PatientListItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  patient: {
    id: string;
    birdDate: string | null;
  };
}