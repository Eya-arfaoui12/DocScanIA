// services/authService.ts - VERSION CORRIGÉE
import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:8000/api/accounts";

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    username?: string;
    role?: string;
    image?: string;
    image_url?: string;
    birthday?: string;
    date_joined?: string;
    is_active?: boolean;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  role?: string;
  image?: File | null;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  birthday?: string;
  image?: File | null;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Login utilisateur
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(`${API_URL}/login/`, data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error: string; detail?: string }>;
    console.error('Login error:', err.response?.data);
    throw err.response?.data || { error: "Erreur lors de la connexion" };
  }
};

// Déconnexion
export const logout = async (): Promise<void> => {
  try {
    const token = getToken();
    if (token) {
      await axios.post(`${API_URL}/logout/`, {}, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

// Register utilisateur avec support d'image
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const formData = new FormData();
    
    formData.append("email", data.email);
    formData.append("password", data.password);
    
    if (data.username) {
      formData.append("username", data.username);
    }
    
    if (data.role) {
      formData.append("role", data.role);
    }
    
    if (data.image) {
      formData.append("image", data.image);
    }

    const response = await axios.post<AuthResponse>(`${API_URL}/register/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error: string; detail?: string }>;
    console.error('Register error:', err.response?.data);
    throw err.response?.data || { error: "Erreur lors de l'inscription" };
  }
};

// Récupérer le user connecté depuis l'API
export const fetchCurrentUser = async (): Promise<AuthResponse['user']> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No token found");
    }

    const response = await axios.get(`${API_URL}/users/me/`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });

    localStorage.setItem("user", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Fetch current user error:', error);
    throw error;
  }
};

// Mettre à jour le profil utilisateur
export const updateUserProfile = async (data: UpdateUserData): Promise<AuthResponse['user']> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No token found");
    }

    const formData = new FormData();
    
    if (data.username !== undefined) formData.append("username", data.username);
    if (data.email !== undefined) formData.append("email", data.email);
    if (data.birthday !== undefined) formData.append("birthday", data.birthday);
    
    if (data.image) {
      formData.append("image", data.image);
    }

    const response = await axios.patch(`${API_URL}/users/me/`, formData, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    localStorage.setItem("user", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error: string; detail?: string; username?: string[]; email?: string[] }>;
    console.error('Update user error:', err.response?.data);
    
    if (err.response?.data) {
      const errorData = err.response.data as any;
      if (errorData.username) {
        throw { error: errorData.username[0] || "Erreur sur le nom d'utilisateur" };
      }
      if (errorData.email) {
        throw { error: errorData.email[0] || "Erreur sur l'email" };
      }
    }
    
    throw err.response?.data || { error: "Erreur lors de la mise à jour du profil" };
  }
};

// Changer le mot de passe
export const changePassword = async (data: ChangePasswordData): Promise<{ message: string; success: boolean }> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No token found");
    }

    const response = await axios.post(`${API_URL}/users/change-password/`, data, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      }
    });

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ 
      error?: string; 
      current_password?: string[]; 
      new_password?: string[]; 
      confirm_password?: string[];
      non_field_errors?: string[];
    }>;
    console.error('Change password error:', err.response?.data);
    
    if (err.response?.data) {
      const errorData = err.response.data;
      if (errorData.current_password) {
        throw { error: errorData.current_password[0] };
      }
      if (errorData.new_password) {
        throw { error: errorData.new_password[0] };
      }
      if (errorData.confirm_password) {
        throw { error: errorData.confirm_password[0] };
      }
      if (errorData.non_field_errors) {
        throw { error: errorData.non_field_errors[0] };
      }
    }
    
    throw err.response?.data || { error: "Erreur lors du changement de mot de passe" };
  }
};

// Récupérer le user connecté depuis localStorage
export const getCurrentUser = (): AuthResponse['user'] | null => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("token");
  return !!token;
};

// Récupérer le token
export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

// ✅ CORRECTION : Configurer axios pour inclure le token automatiquement
// SAUF pour /register/ et /login/
export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      // ✅ Ne PAS ajouter le token pour /register/ et /login/
      const publicEndpoints = ['/register/', '/login/', '/password-reset/'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        config.url?.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        const token = getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Token ${token}`;
        }
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // ✅ Ne pas rediriger vers /signin si on est déjà sur une page publique
      const publicPaths = ['/signin', '/signup', '/reset-password'];
      const isPublicPath = publicPaths.some(path => 
        window.location.pathname.includes(path)
      );

      if (error.response?.status === 401 && !isPublicPath) {
        logout();
        window.location.href = '/signin';
      }
      return Promise.reject(error);
    }
  );
};