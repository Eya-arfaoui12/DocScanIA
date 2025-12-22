// pages/UserProfile.tsx - Professional Design with #465fff
import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle,
  Save,
  X,
  Key,
  AlertCircle,
  Camera,
  LogOut,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Bell,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  updateUserProfile,
  changePassword,
  isAuthenticated,
  logout,
} from "../../services/authService";

interface UserData {
  id: number;
  email: string;
  username?: string;
  role?: string;
  image?: string;
  image_url?: string;
  birthday?: string;
  date_joined?: string;
  is_active?: boolean;
}

const UserProfile = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [activeSection, setActiveSection] = useState<"personal" | "password">("personal");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    birthday: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated()) {
        navigate("/signin");
        return;
      }
      try {
        setLoading(true);
        const userData = await fetchCurrentUser();
        setUser(userData);
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          birthday: userData.birthday || "",
        });
        setAvatarPreview(userData.image_url || userData.image || null);
      } catch (error) {
        console.error("Error loading user data:", error);
        setMessage({ type: "error", text: "Error loading profile" });
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const updatedUser = await updateUserProfile({
        username: formData.username,
        email: formData.email,
        birthday: formData.birthday,
      });
      setUser(updatedUser);
      setMessage({ type: "success", text: "Profile updated successfully ✨" });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.error || "Error updating profile" });
    } finally {
      setUpdating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (passwordData.new_password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    try {
      setChangingPassword(true);
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });
      setMessage({ type: "success", text: "Password changed successfully 🔐" });
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.error || "Error changing password" });
    } finally {
      setChangingPassword(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Unsupported format." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image too large (max 5MB)." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const updatedUser = await updateUserProfile({ image: file });
      setUser(updatedUser);
      setAvatarPreview(updatedUser.image_url || updatedUser.image || null);
      setMessage({ type: "success", text: "Photo updated 📸" });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.error || "Error" });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      handleAvatarUpload(file);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  const handleDiscardChanges = () => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        birthday: user.birthday || "",
      });
    }
    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-[#465fff] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center max-w-md shadow-2xl border border-gray-100 dark:border-gray-700">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Unable to load profile</p>
          <button 
            onClick={() => navigate("/")} 
            className="px-8 py-3 bg-gradient-to-r from-[#465fff] to-[#3347dd] text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Account Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your personal information and preferences
              </p>
            </div>
          </div>
        </div>
        
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top duration-300 ${
            message.type === "success" 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700" 
              : "bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-700"
          }`}>
            {message.type === "success" ? 
              <CheckCircle className="w-6 h-6" /> : 
              <AlertCircle className="w-6 h-6" />
            }
            <p className="font-semibold">{message.text}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row">
            
            {/* Left Sidebar with blue gradient */}
            <div className="lg:w-80 bg-gradient-to-br from-[#465fff] to-[#3347dd] p-8 text-white">
              {/* Avatar */}
              <div className="text-center mb-10">
                <div className="relative inline-block group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm mx-auto border-4 border-white/30 shadow-2xl transition-transform group-hover:scale-105 duration-300">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/10">
                        <User className="w-14 h-14 text-white/70" />
                      </div>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white text-[#465fff] rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 disabled:opacity-50 group-hover:rotate-12 duration-300"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
                <h2 className="mt-6 text-2xl font-bold">
                  {user.username || user.email.split('@')[0]}
                </h2>
                <p className="text-white/80 text-sm mt-1 capitalize flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  {user.role || "User"}
                </p>
                {user.is_active && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-400/20 backdrop-blur-sm rounded-full border border-green-400/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-100">Verified Account</span>
                  </div>
                )}
              </div>

              {/* Menu */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection("personal")}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 ${
                    activeSection === "personal"
                      ? "bg-white text-[#465fff] shadow-lg font-semibold scale-105"
                      : "text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-sm"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </button>
                
                <button
                  onClick={() => setActiveSection("password")}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 ${
                    activeSection === "password"
                      ? "bg-white text-[#465fff] shadow-lg font-semibold scale-105"
                      : "text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-sm"
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>Security & Password</span>
                </button>

                <div className="my-6 border-t border-white/20"></div>

                {/* Statistics */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
                  <p className="text-white/60 text-xs mb-3 font-medium uppercase tracking-wide">Account Activity</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Member since</span>
                      <span className="text-white font-semibold text-sm">
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left text-red-100 hover:bg-red-500/20 hover:text-white transition-all backdrop-blur-sm border border-red-400/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 lg:p-12">
              
              {/* Personal Information Section */}
              {activeSection === "personal" && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#465fff] to-[#3347dd] rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Personal Information
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Update your profile information
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#465fff]" />
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#465fff] focus:border-[#465fff] text-gray-900 dark:text-white transition-all group-hover:border-[#465fff]/30"
                        placeholder="Your username"
                      />
                    </div>

                    {/* Email */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#465fff]" />
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#465fff] focus:border-[#465fff] text-gray-900 dark:text-white transition-all pr-28 group-hover:border-[#465fff]/30"
                          placeholder="your@email.com"
                        />
                        {user.is_active && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-green-600 text-xs font-semibold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                            <CheckCircle className="w-4 h-4" /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Birthday */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#465fff]" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#465fff] focus:border-[#465fff] text-gray-900 dark:text-white transition-all group-hover:border-[#465fff]/30 cursor-pointer"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>

                    {/* Role */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        Role
                      </label>
                      <input
                        type="text"
                        value={user.role || "User"}
                        disabled
                        className="w-full px-5 py-3.5 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-600 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 capitalize cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-[#465fff] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Data Protection
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Your information is secure and will never be shared with third parties.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-10 pt-8 border-t-2 border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleDiscardChanges}
                      className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105 hover:shadow-lg"
                    >
                      Discard Changes
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-[#465fff] to-[#3347dd] hover:from-[#3347dd] hover:to-[#2236cc] text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-xl shadow-[#465fff]/20"
                    >
                      {updating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Password Section */}
              {activeSection === "password" && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#465fff] to-[#3347dd] rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Security & Password
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Change your password to secure your account
                      </p>
                    </div>
                  </div>

                  <div className="max-w-2xl space-y-6">
                    {/* Current Password */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#465fff]" />
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                          className="w-full px-5 py-3.5 pr-12 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#465fff] focus:border-[#465fff] text-gray-900 dark:text-white group-hover:border-[#465fff]/30 transition-all"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#465fff] transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#465fff]" />
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className="w-full px-5 py-3.5 pr-12 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#465fff] focus:border-[#465fff] text-gray-900 dark:text-white group-hover:border-[#465fff]/30 transition-all"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#465fff] transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#465fff]" />
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          className="w-full px-5 py-3.5 pr-12 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#465fff] focus:border-[#465fff] text-gray-900 dark:text-white group-hover:border-[#465fff]/30 transition-all"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#465fff] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordData.new_password && (
                      <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-2xl border-2 border-gray-200 dark:border-gray-600 space-y-3 animate-in slide-in-from-top duration-300">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-[#465fff]" />
                          Password Strength
                        </p>
                        <div className="space-y-2.5">
                          {[
                            { label: "At least 8 characters", valid: passwordData.new_password.length >= 8 },
                            { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(passwordData.new_password) },
                            { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(passwordData.new_password) },
                            { label: "One number (0-9)", valid: /[0-9]/.test(passwordData.new_password) },
                          ].map((rule, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 transition-all">
                              {rule.valid ? 
                                <CheckCircle className="w-5 h-5 text-green-500" /> : 
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                              }
                              <span className={`text-sm font-medium transition-colors ${rule.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {rule.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs font-medium mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Security Level</span>
                            <span className={`font-bold ${
                              [
                                { valid: passwordData.new_password.length >= 8 },
                                { valid: /[A-Z]/.test(passwordData.new_password) },
                                { valid: /[a-z]/.test(passwordData.new_password) },
                                { valid: /[0-9]/.test(passwordData.new_password) },
                              ].filter(r => r.valid).length >= 4 ? 'text-green-600' : 
                              [
                                { valid: passwordData.new_password.length >= 8 },
                                { valid: /[A-Z]/.test(passwordData.new_password) },
                                { valid: /[a-z]/.test(passwordData.new_password) },
                                { valid: /[0-9]/.test(passwordData.new_password) },
                              ].filter(r => r.valid).length >= 2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {[
                                { valid: passwordData.new_password.length >= 8 },
                                { valid: /[A-Z]/.test(passwordData.new_password) },
                                { valid: /[a-z]/.test(passwordData.new_password) },
                                { valid: /[0-9]/.test(passwordData.new_password) },
                              ].filter(r => r.valid).length >= 4 ? 'Strong' : 
                              [
                                { valid: passwordData.new_password.length >= 8 },
                                { valid: /[A-Z]/.test(passwordData.new_password) },
                                { valid: /[a-z]/.test(passwordData.new_password) },
                                { valid: /[0-9]/.test(passwordData.new_password) },
                              ].filter(r => r.valid).length >= 2 ? 'Medium' : 'Weak'}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                [
                                  { valid: passwordData.new_password.length >= 8 },
                                  { valid: /[A-Z]/.test(passwordData.new_password) },
                                  { valid: /[a-z]/.test(passwordData.new_password) },
                                  { valid: /[0-9]/.test(passwordData.new_password) },
                                ].filter(r => r.valid).length >= 4 ? 'bg-green-500 w-full' : 
                                [
                                  { valid: passwordData.new_password.length >= 8 },
                                  { valid: /[A-Z]/.test(passwordData.new_password) },
                                  { valid: /[a-z]/.test(passwordData.new_password) },
                                  { valid: /[0-9]/.test(passwordData.new_password) },
                                ].filter(r => r.valid).length >= 2 ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-1/3'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Security Info */}
                    <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            Security Tips
                          </h3>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Use a unique password for this account</li>
                            <li>• Never share your password</li>
                            <li>• Change your password regularly</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                      className="w-full px-6 py-4 bg-gradient-to-r from-[#465fff] to-[#3347dd] hover:from-[#3347dd] hover:to-[#2236cc] text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 hover:shadow-xl shadow-[#465fff]/20 mt-8"
                    >
                      {changingPassword ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" /> Change Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last modified: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;