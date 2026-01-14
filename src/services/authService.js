import api from "../config/axios";

const authService = {
  async login(loginIdentifier, password, remember = false) {
    try {
      const response = await api.post("/auth/login", {
        login: loginIdentifier,
        password,
        remember,
      });

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
      return {
        success: false,
        message: error.response?.data?.message || "Erreur de connexion",
        error: error.message,
      };
    }
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (e) {
    } finally {
      this.clearAuthData();
      window.location.href = "/login";
    }
  },

  clientExpireSession() {
    this.clearAuthData();
  },

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

      return {
        success: true,
        authenticated: true,
        user,
        offline: true,
        message: "Mode hors ligne - session locale conservée",
      };
    }
  },

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
    const rememberMe = localStorage.getItem("remember_me");
    const redirectAfter2fa = sessionStorage.getItem("redirect_after_2fa");

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("just_logged_in");

    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user_data");
    sessionStorage.removeItem("just_logged_in");

    if (rememberMe) {
      localStorage.setItem("remember_me", rememberMe);
    }
    if (redirectAfter2fa) {
      sessionStorage.setItem("redirect_after_2fa", redirectAfter2fa);
    }
  },
};

export default authService;
