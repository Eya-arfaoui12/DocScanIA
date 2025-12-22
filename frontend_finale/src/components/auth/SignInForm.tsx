import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { login, LoginData, AuthResponse } from "../../services/authService";

interface LoginError {
  error: string;
}

export default function SignInForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(resetSuccess);

  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    try {
      const response: AuthResponse = await login(formData);
    
      if (response.user.role === "admin") {
        navigate("/admin/");
      } else if (response.user.role === "user") {
        navigate("/user/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const loginError = err as LoginError;
      setError(loginError?.error ?? "Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">
          Sign In
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Sign in to continue to your DocScan dashboard
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="p-4 mb-6 text-sm border rounded-xl bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30">
          <div className="flex items-start gap-3">
            <svg className="flex-shrink-0 w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-400">
                Password reset successful!
              </p>
              <p className="mt-1 text-green-700 dark:text-green-500">
                You can now sign in with your new password.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
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
        {/* Email Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </Label>
          <Input
            name="email"
            type="email"
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
            Password
          </Label>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={isChecked} 
              onChange={setIsChecked}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-700"
            />
            <label className="text-sm text-gray-700 cursor-pointer dark:text-gray-300">
              Remember me
            </label>
          </div>
          <Link
            to="/reset-password"
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Forgot password?
          </Link>
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
              Signing in...
            </span>
          ) : (
            "Sign In"
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
            Don't have an account?
          </span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <Link
          to="/signup"
          className="inline-flex items-center justify-center w-full py-3 text-base font-semibold text-blue-600 transition-all duration-200 border-2 border-blue-600 rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20"
        >
          Create an account
        </Link>
      </div>

      {/* Footer */}
      <div className="pt-6 mt-8 text-xs text-center text-gray-500 border-t border-gray-200 dark:border-gray-800 dark:text-gray-400">
        <p>
          By continuing, you agree to DocScan's{" "}
          <Link to="/terms" className="underline hover:text-blue-600 dark:hover:text-blue-400">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-blue-600 dark:hover:text-blue-400">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}