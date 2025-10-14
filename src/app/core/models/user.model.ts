export interface User {
  id: number;
  email: string;
  fullName: string;
  profilePicture: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  preferredLanguage?: Language;
  settings?: UserSettings;
}

export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface UserSettings {
  id: number;
  theme: 'light' | 'dark';
  notificationEnabled: boolean;
  reminderTime: string;
  weeklySummary: boolean;
  lastSyncAt?: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  message: string;
  requires2FA?: boolean;
  userId?: number;
  email?: string;
  emailSent?: boolean;
  requiresVerification?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface Verify2FARequest {
  userId: number;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}