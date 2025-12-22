import axios from "axios";

const API_URL = "http://localhost:8000/api/admin/users"; 
export interface AdminUser {
  id: number;
  email: string;
  username?: string;
  role: "admin" | "user";
  is_active: boolean;
  image?: string | null;
}

export interface CreateUpdateUserData {
  email: string;
  username?: string;
  password?: string;
  role: "admin" | "user";
  is_active?: boolean;
  image?: File | null;
}

// ✅ Lister tous les utilisateurs
export const getAllUsers = async (): Promise<AdminUser[]> => {
  const token = localStorage.getItem("token");
  const response = await axios.get<AdminUser[]>(`${API_URL}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

// ✅ Récupérer un utilisateur
export const getUserById = async (id: number): Promise<AdminUser> => {
  const token = localStorage.getItem("token");
  const response = await axios.get<AdminUser>(`${API_URL}/${id}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

// ✅ Créer un utilisateur (avec image)
export const createUser = async (data: CreateUpdateUserData): Promise<AdminUser> => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await axios.post<AdminUser>(`${API_URL}/`, formData, {
    headers: { Authorization: `Token ${token}`, "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ✅ Mettre à jour un utilisateur
export const updateUser = async (
  id: number,
  data: CreateUpdateUserData
): Promise<AdminUser> => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await axios.put<AdminUser>(`${API_URL}/${id}/`, formData, {
    headers: { Authorization: `Token ${token}`, "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ✅ Activer / Désactiver un utilisateur
export const toggleUserActive = async (id: number, is_active: boolean): Promise<AdminUser> => {
  const token = localStorage.getItem("token");
  const response = await axios.patch<AdminUser>(
    `${API_URL}/${id}/`,
    { is_active },
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

// ✅ Supprimer un utilisateur
export const deleteUser = async (id: number): Promise<{ message: string }> => {
  const token = localStorage.getItem("token");
  const response = await axios.delete<{ message: string }>(`${API_URL}/${id}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};
