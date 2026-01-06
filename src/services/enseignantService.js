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
   * ✅ Récupérer TOUS les enseignants sans pagination (PUBLIC)
   * @param {Object} params - { universite_id, etablissement_id, corps, categorie }
   */
  getAllWithoutPagination: async (params = {}) => {
    try {
      // ✅ CORRECTION: Utiliser la route normale avec un per_page très élevé
      const response = await API.get("/enseignants", {
        params: { ...params, per_page: 10000 },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération sans pagination:", error);
      throw error;
    }
  },

  /**
   * ✅ Recherche globale multi-champs (PUBLIC)
   * @param {Object} params - { search, universite_id, etablissement_id, corps, categorie, diplome, per_page }
   */
  searchGlobal: async (params = {}) => {
    try {
      // ✅ CORRECTION: Utiliser la route normale (index) car elle a été corrigée pour la recherche multi-champs
      const response = await API.get("/enseignants", { params });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la recherche globale:", error);
      throw error;
    }
  },

  /**
   * ✅ Compter les enseignants avec filtres (PUBLIC)
   * @param {Object} params - { universite_id, etablissement_id, corps, categorie }
   */
  count: async (params = {}) => {
    try {
      // Pour compter, charger une page avec per_page=1 et récupérer le total
      const response = await API.get("/enseignants", {
        params: { ...params, per_page: 1, page: 1 },
      });
      return {
        count: response.data?.total || 0,
        total: response.data?.total || 0,
        data: response.data,
      };
    } catch (error) {
      console.error("Erreur lors du comptage des enseignants:", error);
      throw error;
    }
  },

  /**
   * ✅ Récupérer les métadonnées (PUBLIC)
   * @param {Object} params - { universite_id }
   */
  getMetadata: async (params = {}) => {
    try {
      // Pour les métadonnées, charger assez d'enseignants pour extraire les valeurs uniques
      const response = await API.get("/enseignants", {
        params: { ...params, per_page: 1000 },
      });

      const data = response.data?.data || [];

      // Extraire les valeurs uniques
      const corps = [
        ...new Set(data.map((item) => item.corps).filter(Boolean)),
      ];
      const categories = [
        ...new Set(data.map((item) => item.categorie).filter(Boolean)),
      ];
      const diplomes = [
        ...new Set(data.map((item) => item.diplome).filter(Boolean)),
      ];

      return {
        corps,
        categories,
        diplomes,
        total: response.data?.total || 0,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des métadonnées:", error);
      throw error;
    }
  },

  /**
   * ✅ Alias pour getAllPublic (compatibilité)
   * Récupérer tous les enseignants (compatible avec la vue admin)
   */
  getAll: async (params = {}) => {
    try {
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
   * ✅ Alias pour getByIdPublic
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
   * ✅ Alias pour les statistiques (utilisé dans certaines vues)
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
   * ✅ Recherche simple (compatible avec le contrôleur corrigé)
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

  /**
   * ✅ Recherche avancée multi-champs (utilise la même route mais avec plus de filtres)
   * @param {String} query - Terme de recherche
   * @param {Object} filters - Filtres supplémentaires
   */
  advancedSearch: async (query, filters = {}) => {
    try {
      const params = { search: query, ...filters };
      const response = await API.get("/enseignants", { params });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la recherche avancée:", error);
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
        const errorMessage =
          error.response.data?.message || "Erreur lors de la création";
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
        const errorMessage =
          error.response.data?.message || "Erreur lors de la modification";
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
        const errorMessage =
          error.response.data?.message || "Erreur lors de la suppression";
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
        const errorMessage =
          error.response.data?.message || "Erreur lors de l'import";
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
   * ✅ Récupérer tous les enseignants d'une université
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
   * ✅ Récupérer tous les enseignants d'un établissement
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
   * ✅ Récupérer les enseignants par catégorie
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
   * ✅ Récupérer les enseignants par corps
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
   * ✅ Récupérer les enseignants par diplôme
   */
  getByDiplome: async (diplome, params = {}) => {
    try {
      const response = await API.get("/enseignants", {
        params: { ...params, diplome },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération par diplôme:", error);
      throw error;
    }
  },

  /**
   * ✅ Valider les données d'import
   */
  validateImport: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(
        "/admin/enseignants/validate-import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la validation de l'import:", error);
      throw error;
    }
  },

  /**
   * ✅ Obtenir le template d'import Excel
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

  /**
   * ✅ Récupérer les statistiques par corps
   */
  getStatsByCorps: async (universiteId = null) => {
    try {
      const params = universiteId ? { universite_id: universiteId } : {};
      const response = await API.get("/enseignants/statistiques/global", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques par corps:",
        error
      );
      throw error;
    }
  },

  /**
   * ✅ Récupérer les statistiques par genre
   */
  getStatsByGenre: async (universiteId = null) => {
    try {
      const params = universiteId ? { universite_id: universiteId } : {};
      const response = await API.get("/enseignants/statistiques/global", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques par genre:",
        error
      );
      throw error;
    }
  },

  /**
   * ✅ Générer un rapport PDF des enseignants
   */
  generateReport: async (params = {}) => {
    try {
      const response = await API.get("/enseignants/report", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
      throw error;
    }
  },

  /**
   * ✅ Vérifier la disponibilité d'un IM
   */
  checkIMAvailability: async (im, enseignantId = null) => {
    try {
      // Solution temporaire: charger tous les enseignants et vérifier côté client
      const response = await API.get("/enseignants", {
        params: { per_page: 10000 },
      });

      const enseignants = response.data?.data || [];
      const imExists = enseignants.some((enseignant) => {
        if (enseignant.im === im) {
          // Si un enseignantId est fourni, on exclut l'enseignant en cours de modification
          return enseignantId ? enseignant.id !== enseignantId : true;
        }
        return false;
      });

      return {
        available: !imExists,
        exists: imExists,
      };
    } catch (error) {
      console.error("Erreur lors de la vérification de l'IM:", error);
      throw error;
    }
  },

  /**
   * ✅ Rechercher par nom (fuzzy search)
   */
  searchByName: async (name, params = {}) => {
    try {
      const response = await API.get("/enseignants", {
        params: { search: name, ...params },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la recherche par nom:", error);
      throw error;
    }
  },

  /**
   * ✅ Rechercher par IM exact
   */
  searchByIM: async (im, params = {}) => {
    try {
      const response = await API.get("/enseignants", {
        params: { search: im, ...params },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la recherche par IM:", error);
      throw error;
    }
  },

  /**
   * ✅ Récupérer les enseignants avec des options avancées
   */
  getAdvanced: async (options = {}) => {
    try {
      const {
        universite_id,
        etablissement_id,
        corps,
        categorie,
        diplome,
        sexe,
        search,
        page = 1,
        per_page = 100,
        sort_by = "nom",
        sort_order = "asc",
        include_inactive = false,
      } = options;

      const params = {
        universite_id,
        etablissement_id,
        corps,
        categorie,
        diplome,
        sexe,
        search,
        page,
        per_page,
        sort_by,
        sort_order,
        include_inactive,
      };

      // Nettoyer les paramètres undefined
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const response = await API.get("/enseignants", { params });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération avancée:", error);
      throw error;
    }
  },

  /**
   * ✅ Mettre à jour en masse les enseignants
   */
  bulkUpdate: async (ids, data) => {
    try {
      const response = await API.put("/admin/enseignants/bulk-update", {
        ids,
        data,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour en masse:", error);
      throw error;
    }
  },

  /**
   * ✅ Supprimer en masse les enseignants
   */
  bulkDelete: async (ids) => {
    try {
      const response = await API.post("/admin/enseignants/bulk-delete", {
        ids,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression en masse:", error);
      throw error;
    }
  },
};

export default enseignantService;
