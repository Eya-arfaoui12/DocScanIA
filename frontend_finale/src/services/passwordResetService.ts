// src/services/passwordResetService.ts
import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:8000/api/accounts";

export interface RequestResetData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

/**
 * ================================
 *   1️⃣  DEMANDER LE RESET PASSWORD
 * ================================
 * POST → /api/accounts/password-reset/request/
 */
export const requestPasswordReset = async (
  data: RequestResetData
): Promise<{ message: string; success: boolean }> => {
  try {
    const response = await axios.post(`${API_URL}/password-reset/request/`, data);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<ApiError>;
    throw err.response?.data || {
      error: "Erreur lors de l'envoi du lien de réinitialisation",
    };
  }
};

/**
 * ====================================
 *   2️⃣  VALIDER LE TOKEN DE RESET
 * ====================================
 * GET → /api/accounts/password-reset/validate/<token>/
 */
export const validateResetToken = async (
  token: string
): Promise<{ valid: boolean; message?: string; error?: string }> => {
  try {
    const response = await axios.get(`${API_URL}/password-reset/validate/${token}/`);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<ApiError>;
    throw err.response?.data || {
      error: "Token invalide ou expiré",
    };
  }
};

/**
 * =====================================
 *   3️⃣  CONFIRMER LE RESET PASSWORD
 * =====================================
 * POST → /api/accounts/password-reset/confirm/
 */
export const resetPassword = async (
  data: ResetPasswordData
): Promise<{ message: string; success: boolean }> => {
  try {
    const response = await axios.post(`${API_URL}/password-reset/confirm/`, data);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<ApiError>;
    throw err.response?.data || {
      error: "Erreur lors de la réinitialisation du mot de passe",
    };
  }
};
