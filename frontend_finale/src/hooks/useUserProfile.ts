// hooks/useUserProfile.ts
import { useState, useEffect } from "react";
import { 
  getUserById, 
  updateUser, 
  AdminUser, 
  CreateUpdateUserData 
} from "../services/adminUserService";
import { getCurrentUser } from "../services/authService";
import { AxiosError } from "axios";

interface ApiError {
  error?: string;
  message?: string;
  detail?: string;
}

export const useUserProfile = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const userData = await getUserById(currentUser.id);
      setUser(userData);
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: CreateUpdateUserData): Promise<AdminUser | undefined> => {
    if (!user?.id) return;

    try {
      setUpdating(true);
      setError(null);
      
      const updatedUser = await updateUser(user.id, data);
      setUser(updatedUser);
      
      // Mettre à jour le localStorage
      const currentUser = getCurrentUser();
      if (currentUser) {
        localStorage.setItem("user", JSON.stringify({
          ...currentUser,
          email: updatedUser.email,
          name: updatedUser.username,
          image: updatedUser.image
        }));
      }
      
      return updatedUser;
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return {
    user,
    loading,
    error,
    updating,
    updateUserProfile,
    refreshProfile: fetchUserProfile
  };
};

// Fonction utilitaire pour gérer les erreurs de manière typée
const handleError = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiError | undefined;
    return data?.error || data?.message || data?.detail || "Erreur lors de la requête";
  }
  
  if (err instanceof Error) {
    return err.message;
  }
  
  return "Une erreur inconnue s'est produite";
};