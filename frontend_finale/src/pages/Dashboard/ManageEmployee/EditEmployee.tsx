import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ComponentCard from "../../../components/common/ComponentCard";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import FileInput from "../../../components/form/input/FileInput";
import SuccessToast from "../../../components/ui/toast/SuccessToast";
import { EyeIcon, EyeCloseIcon } from "../../../icons";

import {
  getUserById,
  updateUser,
  CreateUpdateUserData,
  AdminUser,
} from "../../../services/adminUserService";

export default function EditEmployee() {
  const navigate = useNavigate();
  const { id } = useParams(); // get /:id from URL

  const [user, setUser] = useState<AdminUser | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState(""); // optional change password
  const [image, setImage] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!id) return;
      try {
        const data = await getUserById(Number(id));
        setUser(data);

        // Pré-remplir le formulaire
        setEmail(data.email);
        setUsername(data.username || "");
        setRole(data.role);
        setIsActive(data.is_active);
      } catch (error) {
        console.error(error);
        setToast({
          isOpen: true,
          type: "error",
          title: "Erreur",
          message: "Impossible de charger les données.",
        });
      }
    };

    loadUser();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);

    const updatedUser: CreateUpdateUserData = {
      email,
      username,
      role,
      is_active: isActive,
    };

    if (password.trim() !== "") {
      updatedUser.password = password;
    }

    if (image) updatedUser.image = image;

    try {
      await updateUser(Number(id), updatedUser);

      setToast({
        isOpen: true,
        type: "success",
        title: "Mise à jour réussie !",
        message: `${username} a été modifié avec succès.`,
      });

      setTimeout(() => navigate("/admin/manage-employees"), 1500);
    } catch (error) {
      console.error(error);
      setToast({
        isOpen: true,
        type: "error",
        title: "Erreur lors de la modification",
        message: "Veuillez réessayer.",
      });
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <p className="text-center text-gray-600 dark:text-gray-300">Chargement...</p>
    );
  }

  return (
    <>
      <ComponentCard title="Edit User">
        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Username */}
          <div>
            <Label>Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password (optional) */}
          <div>
            <Label>New Password (optional)</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 right-4 top-1/2"
              >
                {showPassword ? (
                  <EyeIcon className="size-5 fill-gray-500" />
                ) : (
                  <EyeCloseIcon className="size-5 fill-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <Label>Role</Label>
            <Select
              options={[
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ]}
              value={role}
              onChange={(val: string) => setRole(val as "admin" | "user")}
            />
          </div>

          {/* Activation */}
          <div>
            <Label>Status</Label>
            <Select
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              value={String(isActive)}
              onChange={(v: string) => setIsActive(v === "true")}
            />
          </div>

          {/* Image */}
          <div>
            <Label>Profile Image</Label>
            <FileInput onChange={handleFileChange} />
            {user.image && !image && (
              <p className="mt-1 text-sm text-gray-500">Image actuelle : {user.image}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update User"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/manage-employees")}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </ComponentCard>

      <SuccessToast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        duration={3000}
      />
    </>
  );
}
