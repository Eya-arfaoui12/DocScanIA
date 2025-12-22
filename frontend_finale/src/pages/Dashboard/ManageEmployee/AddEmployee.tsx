import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ComponentCard from "../../../components/common/ComponentCard";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import FileInput from "../../../components/form/input/FileInput";
import SuccessToast from "../../../components/ui/toast/SuccessToast";
import { createUser, CreateUpdateUserData } from "../../../services/adminUserService";
import { EyeIcon, EyeCloseIcon } from "../../../icons";

export default function AddEmployee() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [image, setImage] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // État pour le Toast
  const [toast, setToast] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newUser: CreateUpdateUserData = {
      email,
      username,
      password,
      role,
      is_active: true,
      image,
    };

    try {
      await createUser(newUser);
      
      // Afficher le Toast de succès
      setToast({
        isOpen: true,
        type: 'success',
        title: 'Utilisateur ajouté avec succès !',
        message: `${username} a été créé et peut maintenant se connecter.`
      });

      // Attendre 1.5 secondes avant de rediriger pour que l'utilisateur voie le toast
      setTimeout(() => {
        navigate("/admin/manage-employees");
      }, 1500);

    } catch (err) {
      console.error(err);
      
      // Afficher le Toast d'erreur
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Erreur lors de la création',
        message: 'Impossible de créer l\'utilisateur. Veuillez réessayer.'
      });
      
      setLoading(false);
    }
  };

  return (
    <>
      <ComponentCard title="Add New User">
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
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
              placeholder="Select Role"
              value={role}
              onChange={(val: string) => setRole(val as "admin" | "user")}
            />
          </div>

          {/* Image */}
          <div>
            <Label>Profile Image</Label>
            <FileInput onChange={handleFileChange} />
            {image && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {image.name}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Adding...
                </span>
              ) : (
                "Add Employee"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/manage-employees")}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

        </form>
      </ComponentCard>

      {/* Toast Notification */}
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