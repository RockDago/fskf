// userService.js (COMPLET CORRIGÉ)

import API from "../config/axios";

class UserService {
    // ==================== TOKEN MANAGEMENT ====================

    /**
     * Store authentication token
     */
    static setAuthToken(token, rememberMe = false) {
        if (token) {
            if (rememberMe) {
                localStorage.setItem("auth_token", token);
            } else {
                sessionStorage.setItem("auth_token", token);
            }
        } else {
            localStorage.removeItem("auth_token");
            sessionStorage.removeItem("auth_token");
        }
    }

    /**
     * Get stored token
     */
    static getAuthToken() {
        return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    }

    /**
     * Store user data
     */
    static setUserData(user) {
        localStorage.setItem("user", JSON.stringify(user));
    }

    /**
     * Get user data
     */
    static getUserData() {
        try {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Clear all authentication data
     */
    static clearAuth() {
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");
        localStorage.removeItem("user");

        delete API.defaults.headers.common["Authorization"];
    }

    /**
     * Initialize token from storage
     */
    static initToken() {
        const token = this.getAuthToken();
        if (token) {
            API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        return token;
    }

    // ==================== AUTHENTIFICATION ====================

    /**
     * Login user
     */
    static async login(email, password, rememberMe = false) {
        try {
            this.clearAuth();

            const response = await API.post("/auth/login", {
                email,
                password,
                remember_me: rememberMe,
            });

            const { token, user } = response.data;

            if (!token) {
                throw new Error("No token received from server");
            }

            this.setAuthToken(token, rememberMe);
            this.setUserData(user);

            return {
                success: true,
                user,
                token,
                message: "Connexion réussie",
            };
        } catch (error) {
            if (error.response?.status === 401) {
                return {
                    success: false,
                    message: "Email ou mot de passe incorrect",
                };
            }

            return this.handleError(error);
        }
    }

    /**
     * Logout user
     */
    static async logout() {
        try {
            await API.post("/auth/logout");
        } catch (error) {
            // Ignore error
        } finally {
            this.clearAuth();
        }

        return { success: true };
    }

    /**
     * Check authentication status
     */
    static async checkAuth() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                return { isAuthenticated: false, user: null };
            }

            const response = await API.get("/check-auth");
            const user = response.data?.user || response.data;

            if (!user) {
                this.clearAuth();
                return { isAuthenticated: false, user: null };
            }

            this.setUserData(user);

            return {
                isAuthenticated: true,
                user,
                token,
            };
        } catch (error) {
            if (error.response?.status === 401) {
                this.clearAuth();
                return { isAuthenticated: false, user: null };
            }
            return { isAuthenticated: false, user: null };
        }
    }

    /**
     * Get current user info
     */
    static async getCurrentUser() {
        try {
            const response = await API.get("/auth/user");
            const user = response.data;
            this.setUserData(user);
            return user;
        } catch (error) {
            return this.getUserData();
        }
    }

    // ==================== PROFIL UTILISATEUR ====================

    static async getProfile() {
        try {
            const response = await API.get("/profile");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== GESTION D'ÉQUIPE ====================

    static async getAllUsers() {
        try {
            const response = await API.get("/users");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async getAllTeamUsers(params = {}) {
        return this.getAllUsers();
    }

    static async getUsersByRole(role = null, params = {}) {
        try {
            const endpoint =
                role === "agent"
                    ? "/users/agents"
                    : role === "investigateur"
                        ? "/users/investigateurs"
                        : role === "admin"
                            ? "/users/administrateurs"
                            : "/users";

            const response = await API.get(endpoint, { params });
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async getAgents() {
        try {
            const response = await API.get("/users/agents");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async getInvestigateurs() {
        try {
            const response = await API.get("/users/investigateurs");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async getAdministrateurs() {
        try {
            const response = await API.get("/users/administrateurs");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== CRUD UTILISATEURS (ADMIN) ====================

    /**
     * Create user - Format correct pour le backend
     */
    static async createUser(userData) {
        try {
            const formattedData = {
                first_name: userData.firstname,
                last_name: userData.lastname,
                email: userData.email,
                username: userData.username,
                password: userData.password,
                role: userData.role,
                departement: userData.departement,
                telephone: userData.telephone,
                adresse: userData.adresse,
                responsabilites: userData.responsabilites,
                specialisations: userData.specialisations,
                statut: userData.statut,
                password_confirmation: userData.passwordconfirmation,
            };

            const response = await API.post("/users", formattedData);
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Create user with automatic email notification
     */
    static async createUserWithNotification(userData) {
        try {
            const firstName = userData.first_name || userData.firstname;
            const lastName = userData.last_name || userData.lastname;

            if (!firstName) {
                return { success: false, message: "Le prénom est requis" };
            }

            if (!lastName) {
                return { success: false, message: "Le nom est requis" };
            }

            let role = (userData.role || "agent").toString().toLowerCase().trim();
            const validRoles = ["admin", "agent", "investigateur"];
            if (!validRoles.includes(role)) {
                role = "agent";
            }

            const formattedData = {
                first_name: firstName,
                last_name: lastName,
                email: userData.email,
                username: userData.username,
                password: userData.password,
                password_confirmation: userData.password_confirmation || userData.passwordconfirmation,
                role: role,
                departement: userData.departement,
                telephone: userData.telephone,
                adresse: userData.adresse,
                responsabilites: Array.isArray(userData.responsabilites) ? userData.responsabilites : [],
                specialisations: Array.isArray(userData.specialisations) ? userData.specialisations : [],
                statut: userData.statut !== undefined ? userData.statut : true,
            };

            const response = await API.post("/admin/users/create-with-notification", formattedData);
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Update user - Format correct pour le backend
     */
    static async updateUser(id, userData) {
        try {
            const formattedData = {
                first_name: userData.firstname,
                last_name: userData.lastname,
                email: userData.email,
                username: userData.username,
                role: userData.role,
                departement: userData.departement,
                telephone: userData.telephone,
                adresse: userData.adresse,
                responsabilites: userData.responsabilites,
                specialisations: userData.specialisations,
                statut: userData.statut,
            };

            if (userData.password) {
                formattedData.password = userData.password;
                formattedData.password_confirmation = userData.passwordconfirmation;
            }

            const response = await API.put(`/users/${id}`, formattedData);
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Delete user
     */
    static async deleteUser(id) {
        try {
            const response = await API.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Toggle user status
     */
    static async toggleStatus(id) {
        try {
            const response = await API.post(`/users/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async resetPassword(id, passwordData) {
        try {
            const response = await API.post(`/users/${id}/reset-password`, {
                new_password: passwordData.password,
                new_password_confirmation: passwordData.passwordconfirmation,
            });
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async restoreUser(id) {
        try {
            const response = await API.post(`/users/${id}/restore`);
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== STATISTIQUES & ROLES ====================

    static async getStats() {
        try {
            const response = await API.get("/users/stats");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async getRoles() {
        try {
            const response = await API.get("/users/roles");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== NOTIFICATIONS ====================

    static async getNotifications() {
        try {
            const response = await API.get("/notifications");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async getRecentNotifications() {
        try {
            const response = await API.get("/notifications/recent");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async getUnreadNotificationCount() {
        try {
            const response = await API.get("/notifications/unread-count");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async markNotificationAsRead(id) {
        try {
            const response = await API.post(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async markAllNotificationsAsRead() {
        try {
            const response = await API.post("/notifications/read-all");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== JOURNAL D'AUDIT ====================

    static async getAuditJournal(params = {}) {
        try {
            const response = await API.get("/journal-audit", { params });
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async exportAuditJournal(params = {}) {
        try {
            const response = await API.post("/admin/audit/journal/export", params, {
                responseType: "blob",
            });
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== 2FA & VERIFICATION EMAIL ====================

    static async sendTwoFactorCode() {
        try {
            const response = await API.post("/2fa/send-code");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async verifyTwoFactorCode(code) {
        try {
            const response = await API.post("/2fa/verify", { code });
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async checkTwoFactorStatus() {
        try {
            const response = await API.get("/2fa/status");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async sendEmailVerificationCode() {
        try {
            const response = await API.post("/email/verification-notification");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async verifyEmail(code, email) {
        try {
            const response = await API.post("/email/verify", { code, email });
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    static async checkEmailVerificationStatus() {
        try {
            const response = await API.get("/email/verification-status");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== DIAGNOSTIC ====================

    static async checkApiConnection() {
        try {
            await API.get("/health");
            return true;
        } catch (error) {
            return false;
        }
    }

    static async getSessionInfo() {
        try {
            const response = await API.get("/debug/session");
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Debug method to check available methods
     */
    static debugMethods() {
        const methods = Object.getOwnPropertyNames(UserService)
            .filter((name) => typeof UserService[name] === "function")
            .sort();

        return {
            methods,
            createUserWithNotificationExists: typeof UserService.createUserWithNotification === "function",
        };
    }

    // ==================== FORMATAGE DES DONNÉES ====================

    static formatUserForDisplay(user) {
        const parseStringToArray = (value) => {
            if (Array.isArray(value)) return value;
            if (!value || value === "") return [];

            if (
                typeof value === "string" &&
                value.trim().startsWith("[") &&
                value.trim().endsWith("]")
            ) {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    // ignore
                }
            }

            return value
                .toString()
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item !== "");
        };

        return {
            id: user.id,
            firstname: user.firstname || user.first_name || "",
            lastname: user.lastname || user.last_name || "",
            email: user.email || "",
            telephone: user.telephone || user.phone || "",
            departement: user.departement || "",
            username: user.username || "",
            role: user.role || "Agent",
            specialisations: parseStringToArray(user.specialisations),
            responsabilites: parseStringToArray(user.responsabilites),
            adresse: user.adresse || "",
            statut: user.statut !== undefined ? user.statut : true,
        };
    }

    // ==================== GESTION DES ERREURS ====================

    static handleError(error) {
        if (error.response) {
            const { status, data } = error.response;
            let message = data?.message || data?.error || "Une erreur est survenue";

            if (status === 401) {
                message = "Votre session a expiré, veuillez vous reconnecter";
                this.clearAuth();
            } else if (status === 403) {
                message = data?.message || "Accès refusé - Droits insuffisants";
            } else if (status === 404) {
                message = "Ressource introuvable";
            } else if (status === 405) {
                message = `Méthode non autorisée (${error.config?.method?.toUpperCase()})`;
            } else if (status === 422) {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    message = Array.isArray(firstError) ? firstError[0] : firstError;
                } else {
                    message = data?.message || "Données invalides";
                }
            } else if (status === 500) {
                message = "Erreur serveur interne. Veuillez réessayer.";
            }

            return {
                success: false,
                message,
                status,
                data,
            };
        }

        if (error.request) {
            return {
                success: false,
                message: "Impossible de contacter le serveur",
                status: 0,
                isNetworkError: true,
            };
        }

        return {
            success: false,
            message: error.message || "Erreur inconnue",
            status: -1,
        };
    }
}

// Interceptor pour ajouter le token sur CHAQUE requête
API.interceptors.request.use(
    (config) => {
        const token = UserService.getAuthToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Initialize token on import
UserService.initToken();

export default UserService;
