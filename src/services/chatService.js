// src/services/chatService.js
import API, { API_URL } from "../config/axios";

class ChatService {
  /**
   * Helper: extraire une erreur propre même si CORS/Network error
   */
  _normalizeError(error) {
    // Erreur backend (status + data)
    if (error?.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        message:
          error.response.data?.message ||
          error.response.statusText ||
          "Erreur API",
      };
    }

    // Erreur réseau/CORS (pas de response)
    return {
      status: null,
      data: null,
      message: error?.message || "Network Error",
      code: error?.code,
    };
  }

  /**
   * Récupérer toutes les conversations d'un utilisateur
   */
  async getUserChats(filter = "all") {
    try {
      const response = await API.get("/chat", { params: { filter } });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Récupérer les infos d'un dossier
   * Route: POST /api/chats/check-reference
   */
  async getDossierInfo(reference) {
    try {
      const response = await API.post("/chats/check-reference", { reference });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * ✅ NOUVEAU: Vérifier si un chat existe pour une référence
   * Route: GET /api/chats/check-by-reference/{reference}
   */
  async checkChatByReference(reference) {
    try {
      const response = await API.get(`/chats/check-by-reference/${reference}`, {
        headers: { Accept: "application/json" },
      });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Créer un chat de support (PUBLIC)
   * Route: POST /api/chats/support
   */
  async createSupportChat(data) {
    try {
      const response = await API.post("/chats/support", data, {
        headers: {
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Envoyer un message depuis un chat public (visiteur)
   * Route: POST /api/chats/{chatId}/messages/public
   */
  async sendMessageToPublicChat(chatId, data) {
    try {
      const response = await API.post(
        `/chats/${chatId}/messages/public`,
        data,
        {
          headers: { Accept: "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Voir une conversation publique
   * Route: GET /api/chats/{id}/public
   */
  async getPublicConversation(chatId) {
    try {
      const response = await API.get(`/chats/${chatId}/public`, {
        headers: { Accept: "application/json" },
      });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * ✅ NOUVEAU: Marquer les messages comme lus (côté visiteur)
   * Route: POST /api/chats/public/{chatId}/mark-read
   */
  async markPublicAsRead(chatId) {
    try {
      const response = await API.post(
        `/chats/public/${chatId}/mark-read`,
        {},
        {
          headers: { Accept: "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur markPublicAsRead:", error);
      throw this._normalizeError(error);
    }
  }

  /**
   * Récupérer les conversations récentes
   * Route: GET /api/chats/recent/public
   */
  async getRecentPublicChats() {
    try {
      const response = await API.get("/chats/recent/public", {
        headers: { Accept: "application/json" },
      });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Récupérer les détails d'un chat (admin/support)
   * Route: GET /api/chat/{chatId}
   */
  async getChatDetails(chatId) {
    try {
      const response = await API.get(`/chat/${chatId}`);
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Envoyer un message (utilisateurs authentifiés)
   * Route: POST /api/chat/{chatId}/message
   */
  async sendMessage(chatId, data) {
    try {
      const response = await API.post(`/chat/${chatId}/message`, data, {
        headers: { Accept: "application/json" },
      });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Upload un fichier (utilisateurs authentifiés)
   * Route: POST /api/chat/{chatId}/upload
   */
  async uploadFile(chatId, file, type, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await API.post(`/chat/${chatId}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Envoyer un message public avec fichier (visiteurs)
   * Route: POST /api/chats/{chatId}/messages/public
   * Supporte: JPG, JPEG, PNG, MP4, PDF jusqu'à 25 Mo
   */
  async sendPublicMessageWithFile(chatId, data, onProgress = null) {
    try {
      const formData = new FormData();

      // ✅ Ajouter le fichier
      if (data.file) {
        formData.append("file", data.file);
      }

      // ✅ Ajouter le type
      formData.append("type", data.type || "file");

      // ✅ Ajouter le contenu (optionnel)
      if (data.content) {
        formData.append("content", data.content);
      }

      // ✅ Ajouter les infos du visiteur
      if (data.sendername) {
        formData.append("sendername", data.sendername);
      }

      if (data.senderemail) {
        formData.append("senderemail", data.senderemail);
      }

      const response = await API.post(
        `/chats/${chatId}/messages/public`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * ✅ NOUVEAU: Obtenir l'URL publique d'un fichier de chat
   * Construit l'URL vers /api/chat-files/public/{filename}
   */
  getChatFileUrl(filename) {
    if (!filename) return null;

    // Extraire seulement le basename si c'est un path complet
    const basename = filename.split("/").pop();

    // Utiliser API_URL importé au lieu de hardcodé
    return `${API_URL}/api/chat-files/public/${basename}`;
  }

  /**
   * ✅ NOUVEAU: Télécharger un fichier de chat
   * Route: GET /api/chat-files/public/{filename}
   */
  async downloadChatFile(filename) {
    try {
      const url = this.getChatFileUrl(filename);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur téléchargement: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };
    } catch (error) {
      console.error("Erreur downloadChatFile:", error);
      throw this._normalizeError(error);
    }
  }

  /**
   * Marquer/Retirer important
   * Route: PUT /api/chat/{chatId}/toggle-important
   */
  async toggleImportant(chatId) {
    try {
      const response = await API.put(
        `/chat/${chatId}/toggle-important`,
        {},
        {
          headers: { Accept: "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Marquer comme lu
   * Route: PUT /api/chat/{chatId}/mark-read
   */
  async markAsRead(chatId) {
    try {
      const response = await API.put(
        `/chat/${chatId}/mark-read`,
        {},
        {
          headers: { Accept: "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Mettre à jour le statut en ligne du visiteur
   * Route: POST /api/chats/{chatId}/visitor/online-status
   */
  async updateVisitorOnlineStatus(chatId, isOnline, reference) {
    try {
      const response = await API.post(
        `/chats/${chatId}/visitor/online-status`,
        {
          is_online: isOnline,
          reference: reference,
        },
        {
          headers: { Accept: "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur updateVisitorOnlineStatus:", error);
      throw this._normalizeError(error);
    }
  }

  /**
   * Vérifier le statut en ligne d'un visiteur
   * Route: GET /api/chats/{chatId}/visitor/online-status
   */
  async getVisitorOnlineStatus(chatId) {
    try {
      const response = await API.get(`/chats/${chatId}/visitor/online-status`, {
        headers: { Accept: "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur getVisitorOnlineStatus:", error);
      throw this._normalizeError(error);
    }
  }

  /**
   * Rechercher dans les conversations
   * Route: GET /api/chat/search
   */
  async searchChats(query) {
    try {
      const response = await API.get("/chat/search", { params: { q: query } });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  /**
   * Filtrer les conversations par statut
   * Route: GET /api/chat/filter
   */
  async filterChatsByStatus(status) {
    try {
      const response = await API.get("/chat/filter", { params: { status } });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  // ✅ NOUVELLE MÉTHODE: Créer un chat admin vers une référence
  async createAdminChat(data) {
    try {
      const response = await API.post("/chats/admin/create", data);
      return response.data;
    } catch (error) {
      console.error("Erreur création chat admin:", error);
      throw this._normalizeError(error);
    }
  }
}

export default new ChatService();
