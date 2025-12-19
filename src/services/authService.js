import api from "../config/axios";

const authService = {
  // =========================================
  // 1. LOGIN AVEC TOKEN ET DÉTECTION 2FA
  // =========================================
  async login(loginIdentifier, password, remember = false) {
    try {
      console.log("[AuthService] Tentative de connexion...", {
        login: loginIdentifier,
      });

      const response = await api.post("/auth/login", {
        login: loginIdentifier,
        password,
        remember,
      });

      console.log("[AuthService] Connexion réussie:", response.data);

      const user =
        response.data.user || response.data.data?.user || response.data;
      const token = response.data.token;

      if (!user) throw new Error("Données utilisateur introuvables");
      if (!token) throw new Error("Token manquant");

      // Normalisation
      user.role = (user.role || "agent").toString().toLowerCase().trim();

      // Stockage
      this.setUser(user, remember);
      this.setUserToken(token, remember);

      return {
        success: true,
        user,
        token,
        requires_2fa: response.data.requires_2fa === true,
        two_factor_enabled: response.data.two_factor_enabled === true,
        message: response.data.message || "Connexion réussie",
      };
    } catch (error) {
      console.error("[AuthService] Échec login:", error);
      this.clearAuthData();
      return {
        success: false,
        message: error.response?.data?.message || "Erreur de connexion",
        error: error.message,
      };
    }
  },

  // =========================================
  // 2. DÉCONNEXION
  // =========================================
  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignorer
    } finally {
      this.clearAuthData();
      window.location.href = "/login";
    }
  },

  clientExpireSession() {
    this.clearAuthData();
  },

  // =========================================
  // 3. CHECK AUTH
  // =========================================
  async checkAuth() {
    const user = this.getUser();
    const token = this.getUserToken();

    if (!user || !token) {
      return {
        success: false,
        authenticated: false,
        message: "Aucune session locale",
      };
    }

    try {
      const res = await api.get("/check-auth");

      if (res.data?.authenticated) {
        if (res.data.user) {
          this.setUser(res.data.user, this.isRemembered());
        }
        return {
          success: true,
          authenticated: true,
          user: res.data.user,
          requires_2fa: res.data.requires_2fa || false,
          two_factor_verified: res.data.two_factor_verified || false,
          message: "Session valide",
        };
      }

      this.clearAuthData();
      return {
        success: false,
        authenticated: false,
        message: "Session expirée",
      };
    } catch (error) {
      if (error.response?.status === 401) {
        this.clearAuthData();
        return {
          success: false,
          authenticated: false,
          message: "Token invalide",
        };
      }
      return { success: true, authenticated: true, user, offline: true };
    }
  },

  // =========================================
  // 4. HELPERS
  // =========================================
  setUser(user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    localStorage.removeItem("user_data");
    sessionStorage.removeItem("user_data");
    localStorage.removeItem("remember_me");
    storage.setItem("user_data", JSON.stringify(user));
    if (remember) localStorage.setItem("remember_me", "true");
  },

  getUser() {
    try {
      const data =
        localStorage.getItem("user_data") ||
        sessionStorage.getItem("user_data");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUserToken(token, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
    storage.setItem("auth_token", token);
  },

  getUserToken() {
    return (
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    );
  },

  getRole() {
    return this.getUser()?.role?.toLowerCase() || null;
  },

  isAuthenticated() {
    return !!(this.getUser() && this.getUserToken());
  },

  isRemembered() {
    return localStorage.getItem("remember_me") === "true";
  },

  clearAuthData() {
    localStorage.clear();
    sessionStorage.clear();
  },
};

export default authService;
