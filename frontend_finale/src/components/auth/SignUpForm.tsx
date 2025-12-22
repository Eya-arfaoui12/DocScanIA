import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2'; // ✅ Import SweetAlert2
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { register, AuthResponse } from "../../services/authService";

// Interface étendue pour inclure le champ name
interface ExtendedRegisterData {
  email: string;
  password: string;
  role: string;
  name?: string;
  image: File | null;
}

export default function SignUpForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ExtendedRegisterData>({
    email: "",
    password: "",
    role: "user",
    image: null,
    name: "",
  });
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isErrorResponse = (err: unknown): err is { error: string } => {
    return typeof err === "object" && err !== null && "error" in err;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        // ✅ SweetAlert pour erreur d'image
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: 'Please select a valid image file',
          confirmButtonColor: '#3B82F6',
        });
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        // ✅ SweetAlert pour taille d'image
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image size must be less than 5MB',
          confirmButtonColor: '#3B82F6',
        });
        return;
      }

      setFormData({ ...formData, image: file });
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      if (error) setError("");
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!fname || !lname || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (!isChecked) {
      setError("Please accept the Terms and Conditions");
      setLoading(false);
      return;
    }

    try {
      const fullName = `${fname} ${lname}`.trim();
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        username: fullName,
        role: formData.role,
        image: formData.image,
      };
      
      const response: AuthResponse = await register(registrationData);
      
      console.log("Registered user:", response);
      
      // ✅ SweetAlert de succès
      await Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        html: `
          <p class="text-gray-600 dark:text-gray-400">
            Welcome, <strong>${fullName}</strong>! 
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Your account has been created successfully.
          </p>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Go to Sign In',
        confirmButtonColor: '#3B82F6',
        timer: 3000,
        timerProgressBar: true,
      });
      
      // Rediriger vers la page de connexion
      navigate("/signin");
      
    } catch (err: unknown) {
      // ✅ SweetAlert pour erreur
      if (isErrorResponse(err)) {
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: err.error,
          confirmButtonColor: '#3B82F6',
        });
        setError(err.error);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'An error occurred during registration',
          confirmButtonColor: '#3B82F6',
        });
        setError("An error occurred during registration");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">
          Sign Up
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Create your account to get started with DocScan
        </p>
      </div>

      {/* Error Message (optionnel, car SweetAlert gère les erreurs) */}
      {error && (
        <div className="p-4 mb-6 text-sm border rounded-xl bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30">
          <div className="flex items-start gap-3">
            <svg className="flex-shrink-0 w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-red-900 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Image Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Profile Image (Optional)
          </Label>
          <div className="flex items-center gap-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="object-cover w-20 h-20 border-2 border-gray-300 rounded-full dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 text-white transition-colors bg-red-500 rounded-full hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-20 h-20 bg-gray-100 border-2 border-gray-300 border-dashed rounded-full dark:bg-gray-800 dark:border-gray-600">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <label
                htmlFor="image-upload"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 transition-colors border border-blue-600 rounded-lg cursor-pointer hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose Image
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                className="hidden"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="fname"
              name="fname"
              placeholder="John"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="lname"
              name="lname"
              placeholder="Doe"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              placeholder="Create password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 pr-12 transition-all border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              {showPassword ? (
                <EyeIcon className="w-5 h-5" />
              ) : (
                <EyeCloseIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            8 characters minimum
          </p>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <Checkbox
            className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
            checked={isChecked}
            onChange={setIsChecked}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By clicking this button, you agree to{" "}
            <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Userfy Anti-spam Policy & Terms of Use
            </Link>
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full py-3 text-base font-semibold text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          ) : (
            "Continue"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 text-gray-500 bg-white dark:bg-gray-950 dark:text-gray-400">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Log In Link */}
      <div className="text-center">
        <Link
          to="/signin"
          className="inline-flex items-center justify-center w-full py-3 text-base font-semibold text-blue-600 transition-all duration-200 border-2 border-blue-600 rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}