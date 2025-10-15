export interface User {
  id: number;
  email: string;
  fullName: string;
  profilePicture?: string | null;
  isEmailVerified: boolean;
  preferredLanguage?: Language;
  createdAt?: string;
  updatedAt?: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  requires2FA?: boolean;
  message: string;
  userId?: number;
  email?: string;
  user?: User;
  accessToken?: string;      // ← NUEVO
  refreshToken?: string;     // ← NUEVO
  token?: string;            // Mantener por compatibilidad
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  emailSent: boolean;
  requiresVerification: boolean;
}

export interface Verify2FARequest {
  userId: number;
  code: string;
}

export interface Verify2FAResponse {
  user: User;
  accessToken: string;       // ← NUEVO
  refreshToken: string;      // ← NUEVO
  token?: string;            // Mantener por compatibilidad
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  message: string;
  verified: boolean;
}

export interface ResendCodeRequest {
  email: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;   // ← NUEVO
  isAuthenticated: boolean;
  isLoading: boolean;
}

export enum AuthStep {
  LOGIN = 'login',
  REGISTER = 'register',
  VERIFY_EMAIL = 'verify_email',
  TWO_FA = '2fa',
  FORGOT_PASSWORD = 'forgot_password',
  RESET_PASSWORD = 'reset_password'
}