import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, ChevronDown, LogOut, User, Menu } from "lucide-react";
import API, { API_URL } from "../config/axios";

const Header = ({
  onNavigateToNotifications,
  onDeconnexion,
  onNavigateToProfile,
  adminData,
  userRole = "admin",
  onToggleSidebar,
  sidebarCollapsed,
}) => {
  const [showNotificationsDropdown, setShowNotificationsDropdown] =
    useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [userData, setUserData] = useState(adminData || {});

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // ✅ Détection mobile ET tablette
  useEffect(() => {
    const checkMobile = () => {
      // ✅ Masquer le bouton sur mobile et tablette (< 1024px)
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ✅ Gestion des clics en dehors des dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotificationsDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Charger le profil utilisateur
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await API.get("/profile");
      if (response.data.success) {
        setUserData(response.data.data);

        // Charger l'image de profil
        const avatarUrl = getAvatarUrl(
          response.data.data.avatar_url || response.data.data.avatar
        );
        if (avatarUrl) {
          setProfileImage(avatarUrl);
        }
      }
    } catch (error) {
      // Erreur ignorée
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();

    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [fetchUserProfile]);

  // ✅ URL de l'avatar
  const getAvatarUrl = useCallback(
    (path) => {
      if (!path) return null;
      let url = path;

      if (url.startsWith("http")) return `${url}?t=${Date.now()}`;

      if (url.includes("storage/avatars/")) {
        if (url.startsWith("/")) return `${API_URL}${url}`;
        return `${API_URL}/${url}`;
      }

      if (!url.startsWith("/")) url = `/${url}`;
      if (!url.startsWith("/storage")) url = `/storage${url}`;

      return `${API_URL}${url}?t=${Date.now()}`;
    },
    [API_URL]
  );

  // ✅ Initiales pour l'avatar par défaut
  const getInitials = () => {
    const nom = userData.lastname || userData.last_name || "";
    const prenom = userData.firstname || userData.first_name || "";
    const name = userData.name || "";

    if (nom && prenom) return `${nom[0]}${prenom[0]}`.toUpperCase();
    if (name) return name.substring(0, 2).toUpperCase();
    return "U";
  };

  // ✅ Nom complet
  const getFullName = () => {
    if (userData.name && userData.name.trim() !== "") {
      return userData.name.trim();
    }

    const nom = userData.lastname || userData.last_name || "";
    const prenom = userData.firstname || userData.first_name || "";

    if (nom || prenom) {
      return `${prenom} ${nom}`.trim();
    }

    return userData.name || "Utilisateur";
  };

  const fullName = getFullName();

  // ✅ Rôle formaté
  const getRoleDisplayName = () => {
    if (userData.formattedrole) return userData.formattedrole;
    const role = userData.role || userRole || "admin";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // ✅ Charger les notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications/recent");
        if (res.data.success) {
          const notifs = res.data.data || [];
          setRecentNotifications(notifs);
          setUnreadCount(notifs.filter((n) => n.status === "active").length);
        }
      } catch (err) {
        // Erreur ignorée
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Marquer comme lu
  const handleMarkAsRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read`);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Erreur ignorée
    }
  };

  // ✅ Marquer toutes comme lues
  const handleMarkAllAsRead = () => {
    setRecentNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" }))
    );
    setUnreadCount(0);
  };

  // ✅ Logique de déconnexion
  const performLogout = async () => {
    try {
      await API.post("/auth/logout").catch(() => {});
    } catch (err) {
      // Erreur ignorée
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof onDeconnexion === "function") {
        onDeconnexion();
      } else {
        window.location.href = "/login";
      }
    }
  };

  const handleLogoutRequest = () => {
    setShowProfileMenu(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    performLogout();
  };

  return (
    <>
      {/* HEADER - IDENTIQUE À LA NAVBAR.JSX */}
      <header
        className="fixed top-0 right-0 h-16 md:h-20 bg-white shadow-sm z-30 flex items-center justify-between px-4 md:px-8 border-b border-gray-200 transition-all duration-300"
        style={{
          left: isMobile ? "0" : sidebarCollapsed ? "5rem" : "18rem",
        }}
      >
        <div className="absolute inset-0 pointer-events-none lg:hidden" />

        {/* ✅ Burger Mobile - MASQUÉ SUR TABLETTE (≥ 768px) */}
        {isMobile && (
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg xl:hidden" // ✅ Changé de lg:hidden à xl:hidden
            >
              <Menu className="text-xl" />
            </button>
          </div>
        )}

        {/* Espace vide pour centrer le contenu sur desktop/tablette */}
        {!isMobile && (
          <div className="w-10"></div> // ✅ Espace réservé pour équilibrer le layout
        )}

        {/* Droite : Notifs & Profil */}
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() =>
                setShowNotificationsDropdown(!showNotificationsDropdown)
              }
              className="relative p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Bell className="text-lg md:text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notifications */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          notif.status === "active" ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {notif.title || "Notification"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {notif.status === "active" && (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Marquer comme lu"
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-400">
                      <Bell className="mx-auto text-3xl mb-2 opacity-30" />
                      <p>Aucune notification</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profil */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 md:space-x-3 p-1.5 pr-2 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profil"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="font-bold text-xs">{getInitials()}</span>
                )}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-gray-700">
                  {fullName.split(" ")[0] || "Utilisateur"}
                </div>
                <div className="text-[10px] text-gray-500">
                  {getRoleDisplayName()}
                </div>
              </div>
              <ChevronDown className="text-gray-400 text-xs hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-2">
                <div className="px-4 py-3 border-b border-gray-100 mb-1">
                  <p className="font-semibold text-sm text-gray-800">
                    {fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userData.email || "Email non disponible"}
                  </p>
                </div>

                {/* Mon Profil */}
                <button
                  onClick={() => {
                    if (onNavigateToProfile) onNavigateToProfile();
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors w-full"
                >
                  <User className="w-4 h-4" />
                  <span>Mon Profil</span>
                </button>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogoutRequest}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ✅ MODAL DE DÉCONNEXION - IDENTIQUE À LA NAVBAR.JSX */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-[fadeIn_0.2s_ease-out]"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6 text-center">
              {/* Icône */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6 ring-4 ring-red-50/50">
                <LogOut className="text-red-500 text-2xl" />
              </div>

              {/* Textes */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Déconnexion
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Voulez-vous vraiment quitter ? <br />
                Vous devrez vous reconnecter pour accéder au tableau de bord.
              </p>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 focus:ring-4 focus:ring-gray-100 transition-all duration-200"
                >
                  Annuler
                </button>

                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-100 shadow-lg shadow-red-500/30 transition-all duration-200"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
