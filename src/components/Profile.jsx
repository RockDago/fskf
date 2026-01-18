import React, { useState, useEffect } from "react";
import API from "../config/axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Camera,
  Save,
  Loader,
  CheckCircle,
  Lock,
  Check,
  X,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// --- COMPOSANTS UTILITAIRES ---

// --- COMPOSANT TOAST ---
const Toast = ({ message, type = "success", onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 500); // Wait for animation to finish
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-emerald-50" : "bg-rose-50";
  const borderColor =
    type === "success" ? "border-emerald-100" : "border-rose-100";
  const textColor = type === "success" ? "text-emerald-700" : "text-rose-700";
  const iconColor = type === "success" ? "text-emerald-500" : "text-rose-500";

  return (
    <div
      className={`fixed top-5 right-5 z-50 transition-all duration-500 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`${bgColor} border-l-4 ${
          type === "success" ? "border-emerald-500" : "border-rose-500"
        } rounded shadow-2xl p-4 w-[calc(100vw-24px)] sm:w-80 max-w-sm flex items-start`}
      >
        <div className="flex-shrink-0">
          {type === "success" ? (
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          )}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className={`text-sm font-bold ${textColor} leading-5`}>
            {type === "success" ? "Succès" : "Erreur"}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-700">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 500);
            }}
            className="inline-flex text-slate-400 hover:text-slate-600 focus:outline-none transition ease-in-out duration-150"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const FormInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  error,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="group">
      <label className="block text-xs font-medium text-slate-700 mb-1.5 ml-1 transition-colors group-focus-within:text-blue-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 transition-colors group-focus-within:text-blue-500" />
        )}
        <input
          type={showPasswordToggle && showPassword ? "text" : type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-9" : "px-3"} ${
            showPasswordToggle ? "pr-10" : "pr-3"
          } py-2 bg-slate-50 border ${
            error ? "border-rose-300" : "border-slate-200"
          } rounded-lg text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-80 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
        {error && (
          <div className="text-rose-500 text-xs mt-1 ml-1">{error}</div>
        )}
      </div>
    </div>
  );
};

const ValidationItem = ({ isValid, text }) => {
  let color = "text-slate-400";
  let Icon = null;
  if (isValid === true) {
    color = "text-emerald-600";
    Icon = Check;
  } else if (isValid === false) {
    color = "text-rose-600";
    Icon = X;
  }

  return (
    <div
      className={`flex items-center gap-2 text-xs ${color} transition-colors`}
    >
      {Icon ? (
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
};

const TwoFactorModal = ({ isOpen, onClose, onSubmit, isLoading, email }) => {
  const [code, setCode] = useState("");

  // Référence pour gérer le focus
  const inputRef = React.useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      // Petit délai pour laisser le temps au modal de s'afficher avant le focus
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Validation automatique dès que 6 chiffres sont entrés
  useEffect(() => {
    if (code.length === 6 && !isLoading) {
      onSubmit(code);
    }
  }, [code, isLoading, onSubmit]);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0c2844]/80 backdrop-blur-sm transition-all duration-300 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative transform transition-all scale-100 border border-slate-200">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="bg-slate-50/80 border-b border-slate-100 p-8 text-center relative">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 transform rotate-3 hover:rotate-0 transition-all duration-500 group">
            <Shield className="w-8 h-8 text-[#0c2844] group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            Confirmation Sécurisée
          </h3>
          <p className="text-slate-500 text-sm mt-2">
            Veuillez saisir le code à 6 chiffres envoyé à <br />
            <span className="font-semibold text-[#0c2844]">{email}</span>
          </p>
        </div>

        <div className="p-8">
          {/* Zone de saisie 6 cases */}
          <div
            className="relative mb-8 group"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Input réel caché mais accessible */}
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              disabled={isLoading}
              autoFocus
            />

            {/* Affichage visuel des cases */}
            <div className="flex justify-between items-center gap-2 relative z-10 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`
                                        w-10 h-14 sm:w-12 sm:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 font-mono
                                        ${
                                          code[i]
                                            ? "border-[#0c2844] bg-slate-50 text-[#0c2844] scale-105 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-300"
                                        }
                                        ${
                                          i === code.length
                                            ? "border-[#4c7026] ring-4 ring-[#4c7026]/10 z-10 scale-110 bg-white"
                                            : ""
                                        }
                                    `}
                >
                  {code[i] || (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        i === code.length
                          ? "bg-[#4c7026] animate-pulse"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onSubmit(code)}
              disabled={isLoading || code.length < 6}
              className="w-full bg-[#0c2844] hover:bg-[#09407e] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin text-white/70" />
              ) : (
                <>
                  <span>Confirmer</span>
                  <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 text-slate-500 hover:text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>

          {/* Security Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-300 text-[10px] flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Connexion chiffrée
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailVerificationModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  email,
  onResendCode,
}) => {
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Référence pour gérer le focus de l'input caché
  const inputRef = React.useRef(null);

  // Initialisation et Reset
  useEffect(() => {
    if (isOpen) {
      setCode("");
      setTimeLeft(900);
      setResendSuccess(false);
      // Focus automatique après une petite pause pour l'animation d'ouverture
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Timer Global (15 min)
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const intervalId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(intervalId);
  }, [isOpen, timeLeft]);

  // Timer Renvoi (Progressif)
  useEffect(() => {
    if (resendTimeLeft <= 0) return;
    const intervalId = setInterval(() => setResendTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(intervalId);
  }, [resendTimeLeft]);

  // Soumission automatique à 6 chiffres
  useEffect(() => {
    if (code.length === 6 && !isLoading && timeLeft > 0) {
      onSubmit(code);
    }
  }, [code, isLoading, onSubmit, timeLeft]);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      await onResendCode();
      setResendSuccess(true);
      setTimeLeft(900);
      setCode("");

      // Logique progressive : 30s, 60s, 120s...
      const waitTime = resendCount === 0 ? 30 : 60 * resendCount;
      setResendTimeLeft(waitTime);
      setResendCount((prev) => prev + 1);

      setTimeout(() => setResendSuccess(false), 3000);
      inputRef.current?.focus();
    } catch (error) {
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  const isExpired = timeLeft === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0c2844]/80 backdrop-blur-sm transition-all duration-300 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative transform transition-all scale-100 border border-slate-200">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="bg-slate-50/80 border-b border-slate-100 p-8 text-center relative">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 transform rotate-3 hover:rotate-0 transition-all duration-500 group">
            <Mail className="w-8 h-8 text-[#0c2844] group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            Confirmation Sécurisée
          </h3>
          <p className="text-slate-500 text-sm mt-2">
            Veuillez saisir le code à 6 chiffres envoyé à <br />
            <span className="font-semibold text-[#0c2844]">{email}</span>
          </p>
        </div>

        <div className="p-8">
          {/* Zone de saisie 6 cases */}
          <div
            className="relative mb-8 group"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Input réel caché mais accessible */}
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              disabled={isExpired || isLoading}
              autoFocus
            />

            {/* Affichage visuel des cases */}
            <div className="flex justify-between items-center gap-2 relative z-10 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`
                                        w-10 h-14 sm:w-12 sm:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 font-mono
                                        ${
                                          code[i]
                                            ? "border-[#0c2844] bg-slate-50 text-[#0c2844] scale-105 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-300"
                                        }
                                        ${
                                          i === code.length && !isExpired
                                            ? "border-[#4c7026] ring-4 ring-[#4c7026]/10 z-10 scale-110 bg-white"
                                            : ""
                                        }
                                        ${
                                          isExpired
                                            ? "opacity-50 border-slate-100 bg-slate-50"
                                            : ""
                                        }
                                    `}
                >
                  {code[i] || (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        i === code.length && !isExpired
                          ? "bg-[#4c7026] animate-pulse"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages d'état */}
          {isExpired && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center gap-2 text-red-600 text-sm animate-shake">
              <AlertCircle className="w-4 h-4" />
              <span>Le code a expiré</span>
            </div>
          )}

          {resendSuccess && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center gap-2 text-emerald-600 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Code renvoyé avec succès !</span>
            </div>
          )}

          {/* Minuteur */}
          {!isExpired && (
            <div className="flex items-center justify-center gap-2 mb-6 text-xs font-medium text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Expire dans</span>
              <span
                className={`font-mono ${
                  timeLeft < 60 ? "text-red-500 font-bold" : "text-slate-600"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {/* Bouton Principal */}
          <button
            onClick={() => onSubmit(code)}
            disabled={isLoading || code.length < 6 || isExpired}
            className="w-full bg-[#0c2844] hover:bg-[#09407e] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin text-white/70" />
            ) : (
              <>
                <span>Vérifier le code</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Actions Secondaires (Renvoyer) */}
          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading || resendTimeLeft > 0}
              className="text-sm font-medium text-slate-500 hover:text-[#0c2844] transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`}
              />
              {resendTimeLeft > 0
                ? `Renvoyer disponible dans ${resendTimeLeft}s`
                : "Je n'ai pas reçu le code"}
            </button>
          </div>

          {/* Security Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-300 text-[10px] flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Sécurité garantie par FOSIKA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---

const Profile = ({ onReturnToDashboard, onAvatarUpdate }) => {
  // --- ÉTATS ---
  const [profileData, setProfileData] = useState({
    name: "",
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    adresse: "",
    departement: "",
    responsabilites: "",
    specialisations: "",
    currentpassword: "",
    newpassword: "",
    newpasswordconfirmation: "",
    role: "",
    formattedrole: "",
    email_verified_at: null,
    two_factor_enabled: false,
    is_email_verified: false,
    is_2fa_enabled: false,
    security_level: "low",
    last_login_at: null,
  });

  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeTab, setActiveTab] = useState("informations");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: null,
    hasUpperCase: null,
    hasNumber: null,
    hasSpecialChar: null,
  });
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // --- ÉTAT POUR LES TOAST ---
  const [toasts, setToasts] = useState([]);

  // --- COULEURS ET RÔLES ---
  const effectiveRole = (profileData.role || "admin").toLowerCase();
  const roleColors = {
    admin: {
      bg: "bg-blue-600",
      text: "text-blue-600",
      light: "bg-blue-50",
      gradient: "from-blue-600 to-blue-800",
    },
    agent: {
      bg: "bg-green-600",
      text: "text-green-600",
      light: "bg-green-50",
      gradient: "from-green-600 to-green-800",
    },
    investigateur: {
      bg: "bg-purple-600",
      text: "text-purple-600",
      light: "bg-purple-50",
      gradient: "from-purple-600 to-purple-800",
    },
  };
  const currentRole = roleColors[effectiveRole] || roleColors.admin;

  // --- FONCTION POUR AFFICHER LES TOAST ---
  const showToastMessage = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // --- LOGIQUE METIER ---
  const getCompleteAvatarUrl = (pathOrUrl) => {
    if (!pathOrUrl) return null;
    const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
    if (
      pathOrUrl.startsWith("http://") ||
      pathOrUrl.startsWith("https://") ||
      pathOrUrl.startsWith("//")
    )
      return pathOrUrl;
    if (pathOrUrl.startsWith("/storage/")) return `${baseURL}${pathOrUrl}`;
    if (pathOrUrl.startsWith("storage/")) return `${baseURL}/${pathOrUrl}`;
    return `${baseURL}/storage/${pathOrUrl}`;
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const password = profileData.newpassword;
    if (!password) {
      setPasswordValidation({
        minLength: null,
        hasUpperCase: null,
        hasNumber: null,
        hasSpecialChar: null,
      });
      return;
    }
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=[\];'/`~]/.test(password),
    });
  }, [profileData.newpassword]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/profile");
      if (response.data.success) {
        const data = response.data.data;
        setProfileData((prev) => ({
          ...prev,
          ...data,
          name: data.name || "",
          username: data.username || "",
          firstname: data.first_name || data.firstname || "",
          lastname: data.last_name || data.lastname || "",
          specialisations: Array.isArray(data.specialisations)
            ? data.specialisations.join(", ")
            : data.specialisations || "",
          formattedrole:
            data.formatted_role ||
            data.formattedrole ||
            data.role ||
            "Utilisateur",
          email_verified_at: data.email_verified_at || null,
          two_factor_enabled: !!data.two_factor_enabled,
          is_email_verified: !!data.email_verified_at,
          is_2fa_enabled: !!data.two_factor_enabled,
          security_level: data.security_level || "low",
          last_login_at: data.last_login_at || null,
        }));

        if (data.avatar_url || data.avatar) {
          const correctedUrl = getCompleteAvatarUrl(
            data.avatar_url || data.avatar
          );
          if (correctedUrl) {
            setAvatarPreview(`${correctedUrl}?t=${Date.now()}`);
          }
        }
      }
    } catch (error) {
      showToastMessage("Erreur lors du chargement du profil", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setIsLoading(true);
    setErrors({});
    setFieldErrors({});

    try {
      const response = await API.post("/email/verification-notification");

      if (response.data.success) {
        showToastMessage(
          response.data.message ||
            "Un code de vérification a été envoyé à votre adresse e-mail."
        );

        // Ouvrir la modal pour entrer le code
        setShowEmailVerificationModal(true);
      } else {
        showToastMessage(
          response.data.message || "La réponse du serveur indique un échec.",
          "error"
        );
      }
    } catch (error) {
      showToastMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Impossible d'envoyer l'e-mail de vérification. Veuillez réessayer.",
        "error"
      );

      // Affichez plus de détails dans la console
      if (error.response?.data?.debug) {
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    try {
      const response = await API.post("/email/resend-code");
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleVerifyEmailCode = async (code) => {
    setIsVerifyingEmail(true);
    setErrors({});
    try {
      const response = await API.post("/email/verify", {
        code,
        email: profileData.email,
      });

      if (response.data.success) {
        showToastMessage("Email vérifié avec succès !");
        setShowEmailVerificationModal(false);
        // Mettre à jour les données du profil
        setProfileData((prev) => ({
          ...prev,
          email_verified_at: response.data.data.email_verified_at,
          is_email_verified: true,
        }));
        // Recharger le profil
        fetchUserProfile();
      } else {
        showToastMessage(response.data.message || "Code invalide.", "error");
      }
    } catch (error) {
      showToastMessage(
        error.response?.data?.message ||
          "Code invalide ou expiré. Veuillez réessayer.",
        "error"
      );
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleToggle2FA = async () => {
    setErrors({});
    setFieldErrors({});

    // Si l'email n'est pas vérifié, on ne peut pas activer la 2FA
    if (!profileData.email_verified_at) {
      showToastMessage(
        "Veuillez vérifier votre email avant d'activer la 2FA.",
        "error"
      );
      return;
    }

    if (profileData.two_factor_enabled) {
      // Désactiver la 2FA
      if (
        !window.confirm(
          "Êtes-vous sûr de vouloir désactiver la double authentification ?"
        )
      )
        return;
      try {
        const response = await API.post("/user/two-factor-authentication", {
          enabled: false,
        });
        if (response.data.success) {
          setProfileData((prev) => ({
            ...prev,
            two_factor_enabled: false,
            is_2fa_enabled: false,
          }));
          showToastMessage("Double authentification désactivée.");
        }
      } catch (error) {
        showToastMessage("Erreur lors de la désactivation.", "error");
      }
    } else {
      // Activer la 2FA - d'abord envoyer un code
      try {
        const response = await API.post(
          "/user/two-factor-authentication/send-code"
        );
        if (response.data.success) {
          setShowTwoFactorModal(true);
        }
      } catch (error) {
        showToastMessage("Impossible d'initialiser la 2FA.", "error");
      }
    }
  };

  const handleConfirm2FA = async (code) => {
    setIsVerifyingTwoFactor(true);
    setErrors({});
    try {
      const response = await API.post(
        "/user/two-factor-authentication/confirm",
        { code }
      );
      if (response.data.success) {
        setProfileData((prev) => ({
          ...prev,
          two_factor_enabled: true,
          is_2fa_enabled: true,
        }));
        setShowTwoFactorModal(false);
        showToastMessage("Double authentification activée avec succès.");
      } else {
        showToastMessage(response.data.message || "Code invalide.", "error");
      }
    } catch (error) {
      showToastMessage(
        error.response?.data?.message ||
          "Code invalide ou expiré. Veuillez réessayer.",
        "error"
      );
    } finally {
      setIsVerifyingTwoFactor(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (fieldErrors[name])
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showToastMessage("Format d'image invalide", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToastMessage("Image trop lourde (maximum 5 Mo)", "error");
      return;
    }

    try {
      setAvatarLoading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);

      const res = await API.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        showToastMessage("Photo de profil mise à jour avec succès");
        if (res.data.data?.avatar_url) {
          const correctedUrl = getCompleteAvatarUrl(res.data.data.avatar_url);
          if (correctedUrl) setAvatarPreview(`${correctedUrl}?t=${Date.now()}`);
        }
        if (onAvatarUpdate) onAvatarUpdate();
      } else {
        showToastMessage("Erreur lors du téléchargement de l'image", "error");
      }
    } catch (err) {
      showToastMessage("Erreur lors du téléchargement", "error");
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  };

  const handleSaveInformations = async (e) => {
    e.preventDefault();
    setErrors({});
    setFieldErrors({});

    if (
      !profileData.firstname.trim() ||
      !profileData.lastname.trim() ||
      !profileData.email.trim()
    ) {
      showToastMessage("Prénom, Nom et Email sont obligatoires", "error");
      return;
    }

    try {
      setIsLoading(true);

      // CONVERTIR les tableaux en strings
      const responsabilitesString = Array.isArray(profileData.responsabilites)
        ? profileData.responsabilites.join(", ")
        : profileData.responsabilites || "";

      const specialisationsString = Array.isArray(profileData.specialisations)
        ? profileData.specialisations.join(", ")
        : profileData.specialisations || "";

      const dataToSend = {
        name:
          profileData.name ||
          `${profileData.firstname} ${profileData.lastname}`,
        username: profileData.username || "",
        firstname: profileData.firstname,
        lastname: profileData.lastname,
        email: profileData.email,
        phone: profileData.phone || "",
        adresse: profileData.adresse || "",
        departement: profileData.departement || "",
        responsabilites: responsabilitesString,
        specialisations: specialisationsString,
      };

      const res = await API.put("/profile", dataToSend);

      if (res.data.success) {
        showToastMessage("Informations mises à jour avec succès");
        if (onAvatarUpdate) onAvatarUpdate();
        fetchUserProfile();
      } else {
        showToastMessage("Erreur lors de la mise à jour", "error");
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        showToastMessage(
          "Veuillez corriger les erreurs de validation",
          "error"
        );
      } else {
        showToastMessage(err.response?.data?.message || err.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setFieldErrors({});

    if (!profileData.currentpassword) {
      showToastMessage("Le mot de passe actuel est requis", "error");
      return;
    }
    if (profileData.newpassword !== profileData.newpasswordconfirmation) {
      showToastMessage("Les mots de passe ne correspondent pas", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.put("/profile/password", {
        currentpassword: profileData.currentpassword,
        newpassword: profileData.newpassword,
        newpasswordconfirmation: profileData.newpasswordconfirmation,
      });
      if (res.data.success) {
        showToastMessage("Mot de passe changé avec succès");
        setProfileData((prev) => ({
          ...prev,
          currentpassword: "",
          newpassword: "",
          newpasswordconfirmation: "",
        }));
      } else {
        showToastMessage("Erreur lors du changement de mot de passe", "error");
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        showToastMessage(
          "Veuillez corriger les erreurs de validation",
          "error"
        );
      } else {
        showToastMessage("Erreur lors du changement de mot de passe", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (profileData.firstname && profileData.lastname)
      return `${profileData.firstname[0]}${profileData.lastname[0]}`.toUpperCase();
    return profileData.name
      ? profileData.name.substring(0, 2).toUpperCase()
      : "U";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-4 sm:py-6">
      {/* Afficher les toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        onSubmit={handleConfirm2FA}
        isLoading={isVerifyingTwoFactor}
        email={profileData.email}
      />

      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        onSubmit={handleVerifyEmailCode}
        isLoading={isVerifyingEmail}
        email={profileData.email}
        onResendCode={handleResendVerificationCode}
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
          {/* --- HEADER BLEU PRO (HAUTEUR RÉDUITE) --- */}
          <div className="relative h-28"></div>
          <div className="px-4 sm:px-6 pb-6">
            <div className="relative flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 -mt-12">
              {/* Avatar Wrapper */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-lg ring-1 ring-black/5">
                  <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold overflow-hidden relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`${currentRole.text}`}>
                        {getInitials()}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Camera className="w-6 h-6 text-white/90" />
                    </div>
                  </div>
                </div>

                {/* Statut En ligne */}
                <div className="absolute bottom-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </div>

                <label
                  className="absolute inset-0 cursor-pointer rounded-full"
                  title="Modifier la photo"
                >
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={avatarLoading || isLoading}
                  />
                </label>
              </div>

              {/* Infos Header - SIMPLIFIÉ (SANS RÔLE À DROITE) */}
              <div className="flex-1 pb-1 pt-3 sm:pt-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {profileData.firstname || profileData.lastname
                      ? `${profileData.lastname} ${profileData.firstname}`
                      : profileData.name || "Utilisateur"}
                  </h1>

                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <p className="text-sm text-slate-500 font-medium">
                      {profileData.email}
                    </p>

                    {/* Afficher le username si disponible */}
                    {profileData.username && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        @{profileData.username}
                      </span>
                    )}

                    {/* Badge de vérification */}
                    {profileData.is_email_verified ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                        <Check className="w-3 h-3 mr-1" />
                        Vérifiée
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide cursor-help"
                        title="Veuillez vérifier votre email"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Non vérifiée
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- NAVIGATION TABS --- */}
          <div className="border-b border-slate-200 px-4 sm:px-6">
            <nav className="flex -mb-px gap-5 sm:gap-6 overflow-x-auto no-scrollbar">
              {[
                {
                  id: "informations",
                  label: "Informations personnelles",
                  icon: User,
                },
                { id: "password", label: "Mot de passe", icon: Lock },
                { id: "security", label: "Sécurité & 2FA", icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? `${currentRole.text} border-current`
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <tab.icon
                    className={`w-4 h-4 mr-2.5 transition-colors ${
                      activeTab === tab.id
                        ? "text-current"
                        : "text-slate-400 group-hover:text-slate-500"
                    }`}
                  />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* --- FEEDBACK MESSAGES - Seulement les erreurs de validation --- */}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="px-6 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-amber-50 border border-amber-100 text-amber-700 px-4 py-3 rounded-lg text-sm">
                <div className="font-semibold mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Erreurs de validation :
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(fieldErrors).map(([field, messages]) => {
                    if (!messages || messages.length === 0) return null;
                    return (
                      <li key={field} className="flex items-start">
                        <span className="font-medium mr-2">{field}:</span>
                        <span>
                          {Array.isArray(messages)
                            ? messages.join(", ")
                            : messages}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* --- CONTENU PRINCIPAL --- */}
          <div className="p-4 sm:p-6 min-h-[400px]">
            {/* ONGLET 1: INFORMATIONS */}
            {activeTab === "informations" && (
              <form
                onSubmit={handleSaveInformations}
                className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                {/* Section Identité */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100/80">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider opacity-80">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    Identité
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Nom"
                      name="lastname"
                      value={profileData.lastname}
                      onChange={handleInputChange}
                      required
                      error={fieldErrors.lastname?.[0]}
                    />
                    <FormInput
                      label="Prénom"
                      name="firstname"
                      value={profileData.firstname}
                      onChange={handleInputChange}
                      required
                      error={fieldErrors.firstname?.[0]}
                    />
                    <FormInput
                      label="Nom d'affichage"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      placeholder="Nom complet affiché"
                      error={fieldErrors.name?.[0]}
                    />
                    <FormInput
                      label="Nom d'utilisateur"
                      name="username"
                      value={profileData.username}
                      onChange={handleInputChange}
                      placeholder="Nom d'utilisateur unique"
                      error={fieldErrors.username?.[0]}
                    />
                  </div>
                </div>

                {/* Section Coordonnées */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100/80">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider opacity-80">
                    <Mail className="w-4 h-4 mr-2 text-blue-500" />
                    Coordonnées
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Email"
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      required
                      icon={Mail}
                      error={fieldErrors.email?.[0]}
                    />
                    <FormInput
                      label="Téléphone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      placeholder="+261 ..."
                      icon={Phone}
                      error={fieldErrors.phone?.[0]}
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Adresse"
                        name="adresse"
                        value={profileData.adresse}
                        onChange={handleInputChange}
                        icon={MapPin}
                        error={fieldErrors.adresse?.[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Section Pro */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100/80">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider opacity-80">
                    <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                    Détails Professionnels
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Rôle affiché"
                      name="formattedrole"
                      value={profileData.formattedrole}
                      onChange={handleInputChange}
                      disabled
                    />
                    <FormInput
                      label="Département"
                      name="departement"
                      value={profileData.departement}
                      onChange={handleInputChange}
                      disabled
                    />

                    <div className="md:col-span-2 group">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 ml-1 group-focus-within:text-blue-600">
                        Responsabilités
                      </label>
                      <textarea
                        name="responsabilites"
                        value={profileData.responsabilites}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition-all duration-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                    <div className="md:col-span-2 group">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 ml-1 group-focus-within:text-blue-600">
                        Spécialisations
                      </label>
                      <textarea
                        name="specialisations"
                        value={profileData.specialisations}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition-all duration-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>

                {/* BOUTONS ALIGNÉS CÔTE À CÔTE */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onReturnToDashboard}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:shadow-none"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Enregistrer
                  </button>
                </div>
              </form>
            )}

            {/* ONGLET 2: MOT DE PASSE */}
            {activeTab === "password" && (
              <form
                onSubmit={handleChangePassword}
                className="max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100/80">
                  <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center uppercase tracking-wider opacity-80">
                    <Lock className="w-4 h-4 mr-2 text-blue-500" />
                    Changer le mot de passe
                  </h2>
                  <div className="space-y-5">
                    <FormInput
                      label="Mot de passe actuel"
                      type="password"
                      name="currentpassword"
                      value={profileData.currentpassword}
                      onChange={handleInputChange}
                      error={fieldErrors.currentpassword?.[0]}
                      showPasswordToggle={true}
                    />
                    <div className="h-px bg-slate-200 my-2" />
                    <FormInput
                      label="Nouveau mot de passe"
                      type="password"
                      name="newpassword"
                      value={profileData.newpassword}
                      onChange={handleInputChange}
                      error={fieldErrors.newpassword?.[0]}
                      showPasswordToggle={true}
                    />
                    <FormInput
                      label="Confirmer le nouveau mot de passe"
                      type="password"
                      name="newpasswordconfirmation"
                      value={profileData.newpasswordconfirmation}
                      onChange={handleInputChange}
                      error={fieldErrors.newpassword_confirmation?.[0]}
                      showPasswordToggle={true}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                    Critères de sécurité
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <ValidationItem
                      isValid={passwordValidation.minLength}
                      text="8 caractères minimum"
                    />
                    <ValidationItem
                      isValid={passwordValidation.hasUpperCase}
                      text="Une majuscule"
                    />
                    <ValidationItem
                      isValid={passwordValidation.hasNumber}
                      text="Un chiffre"
                    />
                    <ValidationItem
                      isValid={passwordValidation.hasSpecialChar}
                      text="Un caractère spécial"
                    />
                  </div>
                </div>

                {/* BOUTONS ALIGNÉS CÔTE À CÔTE */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onReturnToDashboard}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Mettre à jour
                  </button>
                </div>
              </form>
            )}

            {/* ONGLET 3: SECURITE & 2FA */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Carte Email */}
                <div className="group p-5 border border-slate-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex gap-4">
                      <div
                        className={`p-3 rounded-xl transition-colors ${
                          profileData.is_email_verified
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Adresse e-mail
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {profileData.email}
                        </p>
                        <div className="mt-3">
                          {profileData.is_email_verified ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 ring-1 ring-emerald-500/10">
                              <Check className="w-3.5 h-3.5" /> Vérifiée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 ring-1 ring-amber-500/10">
                              <AlertTriangle className="w-3.5 h-3.5" /> Non
                              vérifiée
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!profileData.is_email_verified && (
                      <button
                        onClick={handleSendVerificationEmail}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          "Vérifier maintenant"
                        )}
                      </button>
                    )}
                  </div>
                  {!profileData.is_email_verified && (
                    <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100/50 rounded-lg flex gap-2 text-xs text-blue-800">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        La vérification de l'email est nécessaire pour activer
                        la sécurité renforcée.
                      </span>
                    </div>
                  )}
                </div>

                {/* Carte 2FA */}
                <div className="group p-5 border border-slate-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex gap-4">
                      <div
                        className={`p-3 rounded-xl transition-colors ${
                          profileData.is_2fa_enabled
                            ? "bg-blue-50 text-blue-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Double authentification (2FA)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-md leading-relaxed">
                          Sécurisez votre compte avec un code unique envoyé par
                          email lors de la connexion.
                        </p>
                        <div className="mt-3">
                          {profileData.is_2fa_enabled ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 ring-1 ring-blue-500/10">
                              <Shield className="w-3.5 h-3.5" /> 2FA Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full ring-1 ring-slate-500/10">
                              Désactivée
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center pt-2">
                      <button
                        onClick={handleToggle2FA}
                        disabled={
                          !profileData.is_email_verified ||
                          isLoading ||
                          isVerifyingTwoFactor
                        }
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                          profileData.is_2fa_enabled
                            ? "bg-blue-600"
                            : "bg-slate-200"
                        } ${
                          !profileData.is_email_verified ||
                          isLoading ||
                          isVerifyingTwoFactor
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            profileData.is_2fa_enabled
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  {!profileData.is_email_verified && (
                    <div className="mt-4 p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg flex gap-2 text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Vérifiez votre email avant d'activer la sécurité
                        renforcée.
                      </span>
                    </div>
                  )}
                  {profileData.is_2fa_enabled && (
                    <div className="mt-4 p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-lg flex gap-2 text-xs text-emerald-800">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Votre compte est sécurisé avec la double
                        authentification.
                      </span>
                    </div>
                  )}
                </div>

                {/* BOUTON RETOUR POUR L'ONGLET SÉCURITÉ */}
                <div className="pt-6 border-t border-slate-100">
                  <button
                    onClick={onReturnToDashboard}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
