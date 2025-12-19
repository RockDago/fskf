import React, { useState, useEffect, useRef } from "react";
import API from "../config/axios";
import AuthService from "../services/authService";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Smartphone,
  ArrowRight,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
} from "lucide-react";

const TwoFactorVerify = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [remainingTime, setRemainingTime] = useState(900);
  const [userEmail, setUserEmail] = useState("");

  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }

    const user = AuthService.getUser();
    if (user?.email) setUserEmail(maskEmail(user.email));

    checkTwoFactorStatus();

    const timer = setInterval(() => {
      setRemainingTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await API.get("/auth/check-2fa-required");
      if (response.data.two_factor_verified && !response.data.requires_2fa) {
        redirectToDashboard();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        AuthService.clearAuthData();
        navigate("/login", { replace: true });
      }
    }
  };

  const redirectToDashboard = () => {
    const redirectUrl = sessionStorage.getItem("redirect_after_2fa");
    sessionStorage.removeItem("redirect_after_2fa");

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      const role = AuthService.getRole();
      const dashboardMap = {
        admin: "/admin",
        agent: "/agent",
        investigateur: "/investigateur",
      };
      window.location.href = dashboardMap[role] || "/admin";
    }
  };

  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return email;
    const [username, domain] = email.split("@");
    const maskedUsername = username.slice(0, 2) + "•••" + username.slice(-1);
    return `${maskedUsername}@${domain}`;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await API.post("/auth/verify-2fa", {
        code: code.trim(),
      });
      setSuccess("Code vérifié !");
      if (response.data.user) {
        AuthService.setUser(response.data.user, AuthService.isRemembered());
      }
      setTimeout(() => redirectToDashboard(), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Code incorrect");
      setCode("");
      setLoading(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (code.length === 6) {
      handleSubmit();
    }
  }, [code]);

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/resend-2fa-code");
      setSuccess("Nouveau code envoyé !");
      setRemainingTime(900);
      setCode("");
      setLoading(false);
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      setError("Impossible de renvoyer le code");
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  return (
    // min-h-screen en bg-white pour le fond principal
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden px-4">
      {/* Fond décoratif adapté au blanc */}
      <div className="absolute inset-0 bg-white overflow-hidden">
        {/* Grain de texture léger */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

        {/* Cercles de couleurs flous (opacité réduite pour fond blanc) */}
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-[#09407e] rounded-full blur-[120px] opacity-[0.08]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-[#4c7026] rounded-full blur-[120px] opacity-[0.08]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Carte Principale - Ombre plus douce pour fond blanc */}
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(12,40,68,0.1)] border border-slate-100 overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-100 p-6 text-center relative">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 transform rotate-3 hover:rotate-0 transition-all duration-500">
              <ShieldCheck className="w-8 h-8 text-[#0c2844]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Double Authentification
            </h2>
            <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-2">
              <Smartphone className="w-4 h-4" />
              Code envoyé au{" "}
              <span className="font-semibold text-slate-700">{userEmail}</span>
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{success}</span>
              </div>
            )}

            <div className="relative mb-8 group">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                disabled={loading}
              />

              <div className="flex justify-between items-center gap-2 relative z-10 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`
                      w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200
                      ${
                        code[i]
                          ? "border-[#0c2844] bg-slate-50 text-[#0c2844] scale-105 shadow-sm"
                          : "border-slate-200 bg-white text-slate-300"
                      }
                      ${
                        i === code.length && !loading
                          ? "border-[#4c7026] ring-4 ring-[#4c7026]/10 z-10 scale-110"
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

            <div className="flex items-center justify-center gap-2 mb-8 text-sm text-slate-500 bg-slate-50 py-2 rounded-full border border-slate-100 w-fit mx-auto px-4">
              <Clock className="w-4 h-4" />
              <span>Expire dans</span>
              <span
                className={`font-mono font-bold ${
                  remainingTime < 60 ? "text-red-600" : "text-[#0c2844]"
                }`}
              >
                {formatTime(remainingTime)}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || code.length !== 6}
              className="w-full bg-[#0c2844] hover:bg-[#09407e] text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Vérifier l'identité</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="mt-6 flex flex-col items-center gap-4">
              <button
                onClick={handleResend}
                disabled={loading || remainingTime > 840}
                className="text-sm font-medium text-slate-600 hover:text-[#4c7026] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                {remainingTime > 840
                  ? `Renvoyer disponible dans ${formatTime(
                      remainingTime - 840
                    )}`
                  : "Je n'ai pas reçu le code"}
              </button>

              <button
                onClick={() => AuthService.logout()}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5 mt-2"
              >
                <LogOut className="w-3 h-3" />
                Annuler et se déconnecter
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Connexion chiffrée de bout en bout
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TwoFactorVerify;
