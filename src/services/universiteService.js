// services/universiteService.js
import API from "../config/axios";

const universiteService = {
    // ==========================================
    // ROUTES PUBLIQUES
    // ==========================================

    /**
     * Récupérer toutes les universités (PUBLIC)
     */
    getAll: async () => {
        try {
            const response = await API.get("/universites");
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des universités:", error);
            throw error;
        }
    },

    /**
     * Récupérer une université par ID (PUBLIC)
     */
    getById: async (id) => {
        try {
            const response = await API.get(`/universites/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de l'université:", error);
            throw error;
        }
    },

    // ==========================================
    // ROUTES PROTÉGÉES (ADMIN)
    // ==========================================

    /**
     * Créer une université (ADMIN)
     */
    create: async (data) => {
        try {
            const response = await API.post("/admin/universites", data);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'université:", error);
            throw error;
        }
    },

    /**
     * Modifier une université (ADMIN)
     */
    update: async (id, data) => {
        try {
            const response = await API.put(`/admin/universites/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(
                "Erreur lors de la modification de l'université:",
                error
            );
            throw error;
        }
    },

    /**
     * Supprimer une université (ADMIN)
     */
    delete: async (id) => {
        try {
            const response = await API.delete(`/admin/universites/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'université:", error);
            throw error;
        }
    },
};

export default universiteService;
