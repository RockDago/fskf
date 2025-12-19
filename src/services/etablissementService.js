// services/etablissementService.js
import API from "../config/axios";

const etablissementService = {
    // ==========================================
    // ROUTES PUBLIQUES
    // ==========================================

    /**
     * Récupérer tous les établissements avec filtre par université (PUBLIC)
     */
    getAll: async (universiteId = null) => {
        try {
            const params = universiteId ? { universite_id: universiteId } : {};
            const response = await API.get("/etablissements", { params });
            return response.data;
        } catch (error) {
            console.error(
                "Erreur lors de la récupération des établissements:",
                error
            );
            throw error;
        }
    },

    /**
     * Récupérer un établissement par ID (PUBLIC)
     */
    getById: async (id) => {
        try {
            const response = await API.get(`/etablissements/${id}`);
            return response.data;
        } catch (error) {
            console.error(
                "Erreur lors de la récupération de l'établissement:",
                error
            );
            throw error;
        }
    },

    // ==========================================
    // ROUTES PROTÉGÉES (ADMIN)
    // ==========================================

    /**
     * Créer un établissement (ADMIN)
     */
    create: async (data) => {
        try {
            const response = await API.post("/admin/etablissements", data);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'établissement:", error);
            throw error;
        }
    },

    /**
     * Modifier un établissement (ADMIN)
     */
    update: async (id, data) => {
        try {
            const response = await API.put(`/admin/etablissements/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(
                "Erreur lors de la modification de l'établissement:",
                error
            );
            throw error;
        }
    },

    /**
     * Supprimer un établissement (ADMIN)
     */
    delete: async (id) => {
        try {
            const response = await API.delete(`/admin/etablissements/${id}`);
            return response.data;
        } catch (error) {
            console.error(
                "Erreur lors de la suppression de l'établissement:",
                error
            );
            throw error;
        }
    },
};

export default etablissementService;
