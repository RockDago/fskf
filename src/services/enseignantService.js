// services/enseignantService.js
import API from "../config/axios";

const enseignantService = {
    // ==========================================
    // ROUTES PUBLIQUES (sans authentification)
    // ==========================================

    /**
     * Récupérer tous les enseignants avec filtres et pagination (PUBLIC)
     * @param {Object} params - { page, per_page, universite_id, etablissement_id, corps, categorie, diplome, sexe, search }
     */
    getAllPublic: async (params = {}) => {
        try {
            const response = await API.get("/enseignants", { params });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des enseignants:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Alias pour getAllPublic (utilisé dans EnseignantsView)
     * Récupérer tous les enseignants (compatible avec la vue admin)
     */
    getAll: async (params = {}) => {
        try {
            // Pour la vue admin, on utilise la même route publique
            // Vous pouvez aussi créer une route admin distincte si nécessaire
            const response = await API.get("/enseignants", { params });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des enseignants:", error);
            throw error;
        }
    },

    /**
     * Récupérer un enseignant par ID (PUBLIC)
     */
    getByIdPublic: async (id) => {
        try {
            const response = await API.get(`/enseignants/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de l'enseignant:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Alias pour getByIdPublic
     */
    getById: async (id) => {
        try {
            const response = await API.get(`/enseignants/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de l'enseignant:", error);
            throw error;
        }
    },

    /**
     * Statistiques globales (PUBLIC)
     */
    getStatistiquesGlobal: async (params = {}) => {
        try {
            const response = await API.get("/enseignants/statistiques/global", {
                params,
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Alias pour les statistiques (utilisé dans certaines vues)
     */
    getStats: async (universiteId) => {
        try {
            const params = universiteId ? { universite_id: universiteId } : {};
            const response = await API.get("/enseignants/statistiques/global", {
                params,
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques:", error);
            throw error;
        }
    },

    /**
     * Statistiques par établissement (PUBLIC)
     */
    getStatistiquesParEtablissement: async (universiteId = null) => {
        try {
            const params = universiteId ? { universite_id: universiteId } : {};
            const response = await API.get(
                "/enseignants/statistiques/par-etablissement",
                { params }
            );
            return response.data;
        } catch (error) {
            console.error(
                "Erreur lors de la récupération des statistiques par établissement:",
                error
            );
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Rechercher des enseignants
     */
    search: async (query) => {
        try {
            const response = await API.get("/enseignants", {
                params: { search: query },
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la recherche d'enseignants:", error);
            throw error;
        }
    },

    // ==========================================
    // ROUTES PROTÉGÉES (authentification + 2FA requis)
    // ==========================================

    /**
     * Créer un enseignant (ADMIN)
     */
    create: async (data) => {
        try {
            const response = await API.post("/admin/enseignants", data);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'enseignant:", error);

            // ✅ Gestion d'erreur améliorée
            if (error.response) {
                // Le serveur a répondu avec un code d'erreur
                const errorMessage = error.response.data?.message || "Erreur lors de la création";
                throw new Error(errorMessage);
            } else if (error.request) {
                // La requête a été faite mais pas de réponse
                throw new Error("Aucune réponse du serveur");
            } else {
                // Erreur lors de la configuration de la requête
                throw error;
            }
        }
    },

    /**
     * Modifier un enseignant (ADMIN)
     */
    update: async (id, data) => {
        try {
            const response = await API.put(`/admin/enseignants/${id}`, data);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la modification de l'enseignant:", error);

            // ✅ Gestion d'erreur améliorée
            if (error.response) {
                const errorMessage = error.response.data?.message || "Erreur lors de la modification";
                throw new Error(errorMessage);
            } else if (error.request) {
                throw new Error("Aucune réponse du serveur");
            } else {
                throw error;
            }
        }
    },

    /**
     * Supprimer un enseignant (ADMIN)
     */
    delete: async (id) => {
        try {
            const response = await API.delete(`/admin/enseignants/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'enseignant:", error);

            // ✅ Gestion d'erreur améliorée
            if (error.response) {
                const errorMessage = error.response.data?.message || "Erreur lors de la suppression";
                throw new Error(errorMessage);
            } else if (error.request) {
                throw new Error("Aucune réponse du serveur");
            } else {
                throw error;
            }
        }
    },

    /**
     * Import depuis Excel (ADMIN)
     */
    import: async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await API.post("/admin/enseignants/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de l'import:", error);

            // ✅ Gestion d'erreur améliorée
            if (error.response) {
                const errorMessage = error.response.data?.message || "Erreur lors de l'import";
                throw new Error(errorMessage);
            } else if (error.request) {
                throw new Error("Aucune réponse du serveur");
            } else {
                throw error;
            }
        }
    },

    /**
     * Export vers Excel (ADMIN)
     */
    export: async (params = {}) => {
        try {
            const response = await API.get("/admin/enseignants/export", {
                params,
                responseType: "blob",
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de l'export:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Récupérer tous les enseignants d'une université (ADMIN)
     */
    getByUniversite: async (universiteId, params = {}) => {
        try {
            const response = await API.get("/enseignants", {
                params: { ...params, universite_id: universiteId },
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération par université:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Récupérer tous les enseignants d'un établissement (ADMIN)
     */
    getByEtablissement: async (etablissementId, params = {}) => {
        try {
            const response = await API.get("/enseignants", {
                params: { ...params, etablissement_id: etablissementId },
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération par établissement:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Récupérer les enseignants par catégorie
     */
    getByCategorie: async (categorie, params = {}) => {
        try {
            const response = await API.get("/enseignants", {
                params: { ...params, categorie },
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération par catégorie:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Récupérer les enseignants par corps
     */
    getByCorps: async (corps, params = {}) => {
        try {
            const response = await API.get("/enseignants", {
                params: { ...params, corps },
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération par corps:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Valider les données d'import
     */
    validateImport: async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await API.post("/admin/enseignants/validate-import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la validation de l'import:", error);
            throw error;
        }
    },

    /**
     * ✅ AJOUT - Obtenir le template d'import Excel
     */
    downloadTemplate: async () => {
        try {
            const response = await API.get("/admin/enseignants/template", {
                responseType: "blob",
            });

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "template_enseignants.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();

            return response.data;
        } catch (error) {
            console.error("Erreur lors du téléchargement du template:", error);
            throw error;
        }
    },
};

export default enseignantService;
