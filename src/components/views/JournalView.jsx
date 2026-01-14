import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  X,
  Filter,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  User,
  Activity,
} from "lucide-react";

import API from "../../config/axios";
import AuthService from "../../services/authService";

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    const s = (status || "").toLowerCase();

    if (s.includes("succès") || s.includes("success") || s === "200")
      return "bg-green-100 text-green-700 border-green-200";

    if (
      s.includes("échec") ||
      s.includes("fail") ||
      s.includes("refusé") ||
      s.includes("40")
    )
      return "bg-red-100 text-red-700 border-red-200";

    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStyles()}`}
    >
      {(status || "").toLowerCase().includes("succès") ? (
        <CheckCircle size={12} />
      ) : (
        <AlertCircle size={12} />
      )}
      {status || "Inconnu"}
    </span>
  );
};

const ActionBadge = ({ action }) => {
  return (
    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
      {action || "Action"}
    </span>
  );
};

const UserAvatar = ({ name, email }) => {
  const displayName = name || email || "Système";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200">
      {initials}
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  loading = false,
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}
            </p>
          )}
        </div>
        <div
          className={`p-2 rounded-lg ${
            colorClasses[color] || colorClasses.blue
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const JournalView = () => {
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    status: "",
    auditDateStart: "",
    auditDateEnd: "",
  });

  const [auditData, setAuditData] = useState({
    audit_log: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    success: 0,
    errors: 0,
    topUsers: [],
    topActions: [],
  });

  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userCheckAttempted, setUserCheckAttempted] = useState(false);

  useEffect(() => {
    fetchAllData();
    checkCurrentUser();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        fetchAuditData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const fetchAllData = async () => {
    try {
      await Promise.all([fetchAuditData(), fetchAuditStats()]);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
    }
  };

  const fetchAuditData = async () => {
    try {
      setErrorMsg(null);

      const response = await API.get("/audit/logs", {
        params: {
          user: filters.user || undefined,
          action: filters.action || undefined,
          status: filters.status || undefined,
          auditDateStart: filters.auditDateStart || undefined,
          auditDateEnd: filters.auditDateEnd || undefined,
        },
      });

      if (response.data?.success) {
        if (response.data.data) {
          setAuditData({
            audit_log: response.data.data,
          });
        } else if (response.data.audit_log) {
          setAuditData({
            audit_log: response.data.audit_log,
          });
        }

        const logs = response.data.data || response.data.audit_log || [];
        calculateLocalStats(logs);

        if (response.data.user_email) {
          setCurrentUser({
            email: response.data.user_email,
            role: response.data.user_role,
          });
        }

        setLastUpdate(new Date());
      } else {
        setErrorMsg("Impossible de charger les logs.");
      }
    } catch (error) {
      console.error("Erreur data audit:", error);
      if (error.response && error.response.status === 404) {
        setErrorMsg("Route API introuvable /audit/logs.");
      } else {
        setErrorMsg("Impossible de charger les logs.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      setIsStatsLoading(true);
      const response = await API.get("/audit/stats");

      if (response.data?.success) {
        const data = response.data.data || {};

        setStats((prev) => ({
          ...prev,
          total: data.total_actions || 0,
          today: data.today_actions || 0,
          success: data.success_actions || 0,
          errors: data.failed_actions || 0,
          topUsers: data.top_users || [],
          topActions: data.top_actions || [],
        }));

        if (response.data.user_email) {
          setCurrentUser({
            email: response.data.user_email,
            role: response.data.user_role,
          });
        }

        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Erreur stats audit:", error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    try {
      setUserCheckAttempted(true);

      const storedUser = AuthService.getUser();
      if (storedUser) {
        setCurrentUser({
          email: storedUser.email,
          role: storedUser.role,
        });
        return;
      }

      try {
        const response = await API.get("/auth/check-auth", {
          withCredentials: true,
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && response.data?.authenticated) {
          const userData = response.data.user || response.data;
          setCurrentUser({
            email: userData.email,
            role: userData.role,
          });
        } else if (
          response.status === 401 ||
          response.status === 419 ||
          response.data?.authenticated === false
        ) {
          console.warn(
            "Utilisateur non authentifié (check-auth) - route protégée"
          );
        } else {
          console.warn(
            "Réponse inattendue de /auth/check-auth :",
            response.status,
            response.data
          );
        }
      } catch (apiError) {
        if (
          apiError.response?.status !== 401 &&
          apiError.response?.status !== 419
        ) {
          console.warn(
            "Erreur lors de la vérification utilisateur via /auth/check-auth :",
            apiError.message
          );
        }
      }
    } catch (error) {
      console.warn("Impossible de vérifier l'utilisateur :", error.message);
    }
  };

  const calculateLocalStats = (logs) => {
    if (!logs || logs.length === 0) return;

    const today = new Date().toISOString().split("T")[0];

    const localStats = {
      totalFiltered: logs.length,
      todayFiltered: logs.filter((log) => {
        const logDate = new Date(log.timestamp).toISOString().split("T")[0];
        return logDate === today;
      }).length,
      successFiltered: logs.filter((log) => {
        const s = (log.statut || "").toLowerCase();
        return s.includes("succès") || s.includes("success");
      }).length,
      errorsFiltered: logs.filter((log) => {
        const s = (log.statut || "").toLowerCase();
        return (
          s.includes("échec") || s.includes("fail") || s.includes("refusé")
        );
      }).length,
    };

    setStats((prev) => ({
      ...prev,
      ...localStats,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      user: "",
      action: "",
      status: "",
      auditDateStart: "",
      auditDateEnd: "",
    });
  };

  const exportAudit = async () => {
    try {
      const response = await API.post("/audit/logs/export", {
        type: "systeme",
        ...filters,
      });

      if (response.data?.success && response.data.download_url) {
        window.open(response.data.download_url, "_blank");
      } else if (response.data?.success) {
        alert(
          `Export réussi ! ${response.data.data?.count || 0} lignes préparées.`
        );
      } else {
        alert(`Erreur export: ${response.data?.message || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur export:", error);
      alert("Erreur technique lors de l'export.");
    }
  };

  const filteredAuditLog = (auditData.audit_log || []).filter((log) => {
    const logUser = (log.utilisateur || "").toLowerCase();
    const logAction = (log.action || "").toLowerCase();
    const logStatus = (log.statut || "").toLowerCase();

    const matchUser =
      !filters.user || logUser.includes(filters.user.toLowerCase());

    const matchAction =
      !filters.action ||
      logAction.includes(filters.action.toLowerCase()) ||
      logAction === filters.action.toLowerCase();

    const matchStatus =
      !filters.status || logStatus.includes(filters.status.toLowerCase());

    let matchDate = true;
    if (filters.auditDateStart || filters.auditDateEnd) {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      if (filters.auditDateStart) {
        matchDate = matchDate && logDate >= filters.auditDateStart;
      }
      if (filters.auditDateEnd) {
        matchDate = matchDate && logDate <= filters.auditDateEnd;
      }
    }

    return matchUser && matchAction && matchStatus && matchDate;
  });

  const renderDetails = (details) => {
    try {
      if (!details) {
        return (
          <span className="text-gray-500 italic">Aucun détail technique.</span>
        );
      }

      const parsed =
        typeof details === "string" &&
        (details.trim().startsWith("{") || details.trim().startsWith("["))
          ? JSON.parse(details)
          : details;

      if (typeof parsed === "object") {
        return (
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      }

      return (
        <p className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
          {details}
        </p>
      );
    } catch (e) {
      return (
        <p className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
          {details}
        </p>
      );
    }
  };

  const displayStats = {
    total:
      filters.user ||
      filters.action ||
      filters.status ||
      filters.auditDateStart ||
      filters.auditDateEnd
        ? filteredAuditLog.length
        : stats.total,
    today:
      filters.user ||
      filters.action ||
      filters.status ||
      filters.auditDateStart ||
      filters.auditDateEnd
        ? filteredAuditLog.filter((log) => {
            const today = new Date().toISOString().split("T")[0];
            const logDate = new Date(log.timestamp).toISOString().split("T")[0];
            return logDate === today;
          }).length
        : stats.today,
    success:
      filters.user ||
      filters.action ||
      filters.status ||
      filters.auditDateStart ||
      filters.auditDateEnd
        ? filteredAuditLog.filter((log) => {
            const s = (log.statut || "").toLowerCase();
            return s.includes("succès") || s.includes("success");
          }).length
        : stats.success,
    errors:
      filters.user ||
      filters.action ||
      filters.status ||
      filters.auditDateStart ||
      filters.auditDateEnd
        ? filteredAuditLog.filter((log) => {
            const s = (log.statut || "").toLowerCase();
            return (
              s.includes("échec") || s.includes("fail") || s.includes("refusé")
            );
          }).length
        : stats.errors,
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatUserEmail = (email) => {
    if (!email) return "";
    if (email.length <= 20) return email;
    const [username, domain] = email.split("@");
    const shortenedUsername =
      username.length > 10 ? `${username.substring(0, 8)}..` : username;
    return `${shortenedUsername}@${domain}`;
  };

  if (isLoading && (auditData.audit_log || []).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-start">
        <div className="flex items-center gap-3 text-gray-500 animate-pulse mt-10">
          <RefreshCw className="animate-spin" />
          <span>Chargement du journal d'audit...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-800 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 0. Error Banner si erreur */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
            <button
              onClick={fetchAllData}
              className="ml-auto text-sm underline hover:text-red-800"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-blue-600" />
              {/* Accès toujours restreint car route protégée */}
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                Accès restreint
              </span>
              {currentUser?.email && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200 flex items-center gap-1">
                  <User size={12} />
                  <span title={currentUser.email}>
                    {formatUserEmail(currentUser.email)}
                  </span>
                  {currentUser.role && (
                    <span className="ml-1">{currentUser.role}</span>
                  )}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Journal d'Audit
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Surveillance et traçabilité des actions système
            </p>
            {lastUpdate && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                Dernière mise à jour: {formatDateTime(lastUpdate)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
              {displayStats.total.toLocaleString()} évènements
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-all text-sm font-medium border border-gray-300 shadow-sm"
              title="Actualiser les données"
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
            <button
              onClick={exportAudit}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
              title="Exporter en CSV"
            >
              <Download size={16} />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* 2. Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Actions"
            value={displayStats.total}
            icon={Activity}
            color="purple"
            loading={isStatsLoading}
          />
          <StatCard
            title="Aujourd'hui"
            value={displayStats.today}
            icon={Calendar}
            color="green"
            loading={isStatsLoading}
          />
          <StatCard
            title="Succès"
            value={displayStats.success}
            icon={CheckCircle}
            color="green"
            loading={isStatsLoading}
          />
          <StatCard
            title="Échecs"
            value={displayStats.errors}
            icon={AlertCircle}
            color="red"
            loading={isStatsLoading}
          />
        </div>

        {/* Info sur les filtres actifs */}
        {(filters.user ||
          filters.action ||
          filters.status ||
          filters.auditDateStart ||
          filters.auditDateEnd) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="text-blue-600" size={16} />
                <span className="text-sm font-medium text-blue-700">
                  Filtres actifs
                </span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Tout effacer
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.user && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Utilisateur : {filters.user}
                </span>
              )}
              {filters.action && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Action : {filters.action}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Statut : {filters.status}
                </span>
              )}
              {filters.auditDateStart && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Depuis : {filters.auditDateStart}
                </span>
              )}
              {filters.auditDateEnd && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Jusqu'à : {filters.auditDateEnd}
                </span>
              )}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Affichage de {filteredAuditLog.length} évènements sur{" "}
              {stats.total} au total
            </p>
          </div>
        )}

        {/* 3. Filters Section */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter size={16} />
              Filtres avancés
            </div>
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={filters.user}
                onChange={(e) => handleFilterChange("user", e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Toutes les actions</option>
              <option value="Connexion">Connexion</option>
              <option value="Création">Création</option>
              <option value="Modification">Modification</option>
              <option value="Suppression">Suppression</option>
              <option value="Export">Export</option>
              <option value="Consultation">Consultation</option>
              <option value="Tentative d'accès">Tentative d'accès</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="Succès">Succès</option>
              <option value="Échec">Échec</option>
              <option value="Refusé">Refusé</option>
            </select>

            <input
              type="date"
              value={filters.auditDateStart}
              onChange={(e) =>
                handleFilterChange("auditDateStart", e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <input
              type="date"
              value={filters.auditDateEnd}
              onChange={(e) =>
                handleFilterChange("auditDateEnd", e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 4. Table Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {filteredAuditLog.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Aucun résultat
              </h3>
              <p className="text-sm">
                Modifiez vos filtres ou vérifiez la connexion API.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Utilisateur</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                    <th className="px-6 py-4 font-semibold">Entité Ciblée</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAuditLog.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={log.utilisateur}
                            email={log.utilisateur}
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {log.utilisateur || "Système"}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {log.ip || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {log.entite || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={log.statut} />
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>
                            {new Date(log.timestamp).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            {new Date(log.timestamp).toLocaleTimeString(
                              "fr-FR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. SLIDE-OVER Panneau Latéral */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex justify-end isolate">
            <div
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-[1px] transition-opacity"
              onClick={() => setSelectedLog(null)}
            />
            <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Détails de l'évènement
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                    ID: {selectedLog.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Utilisateur
                    </span>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <UserAvatar
                        name={selectedLog.utilisateur}
                        email={selectedLog.utilisateur}
                      />
                      <div>
                        <div>{selectedLog.utilisateur || "Inconnu"}</div>
                        <div className="text-xs text-gray-500">
                          {selectedLog.ip || "IP : N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Date & Heure
                    </span>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <div>
                        {new Date(selectedLog.timestamp).toLocaleString(
                          "fr-FR"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <span className="text-xs text-gray-500">Adresse IP</span>
                    <div className="font-mono text-sm mt-1">
                      {selectedLog.ip || "N/A"}
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <span className="text-xs text-gray-500">Résultat</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedLog.statut} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <span className="text-xs text-gray-500">Action</span>
                    <div className="mt-1">
                      <ActionBadge action={selectedLog.action} />
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <span className="text-xs text-gray-500">
                      Entité concernée
                    </span>
                    <div className="mt-1 text-sm text-gray-800">
                      {selectedLog.entite || "-"}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    Données Techniques / Changements
                  </h3>
                  <div className="bg-gray-900 rounded-xl p-4 overflow-hidden shadow-inner border border-gray-800">
                    {renderDetails(selectedLog.details)}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
                Enregistrement système sécurisé - lecture seule. Accès restreint{" "}
                {currentUser?.email &&
                  `- Vous êtes ${formatUserEmail(currentUser.email)}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalView;
