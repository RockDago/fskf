import React, { useState, useEffect } from "react";
import AuthService from "../services/authService";
import Header from "./Header";
import Sidebar from "./Sidebar";
import DashboardView from "./views/DashboardView";
import ReportsView from "./views/ReportsView";
import IndicateursView from "./views/IndicateursView";
import NotificationsView from "./views/NotificationsView";
import JournalView from "./views/JournalView";
import Profile from "./Profile";
import EquipeView from "./views/EquipeView";
import EnseignantsView from "./views/EnseignantsView";
import ChatView from "./views/ChatView";
import FloatingChatBubble from "./FloatingChatBubble";
// import SystemStatus from "./views/SystemStatus";

const DashboardAdmin = ({ onDeconnexion }) => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [chatAutoOpen, setChatAutoOpen] = useState(false);
  const [chatTargetReference, setChatTargetReference] = useState(null);

  useEffect(() => {
    const loadProfile = () => {
      try {
        const user = AuthService.getUser();
        if (user && user.email) {
          setAdminData(user);
        } else {
          if (onDeconnexion) onDeconnexion();
        }
      } catch (error) {
        if (onDeconnexion) onDeconnexion();
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [onDeconnexion]);

  // IMPORTANT : Mettre à jour l'URL de l'API selon votre configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleNavigateToProfile = () => setCurrentView("profil");
  const handleNavigateToNotifications = () => setCurrentView("notifications");

  const handleOpenFullChat = (chatId) => {
    setCurrentView("chat");
  };

  const handleContactByReference = (reference) => {
    setChatTargetReference(reference);
    setChatAutoOpen(true);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "reports":
        return <ReportsView onContactReference={handleContactByReference} />;
      case "chat":
        return <ChatView />;
      case "indicateurs":
        return <IndicateursView />;
      case "enseignants":
        return <EnseignantsView />;
      case "equipe":
        return <EquipeView />;
      case "audit":
        return <JournalView />;
      case "notifications":
        return <NotificationsView />;
      case "profil":
        return <Profile userData={adminData} />;

      default:
        return <DashboardView />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center text-red-600">
          <p>Authentification requise</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
      />

      {/* WRAPPER PRINCIPAL */}
      <div
        className={`
          flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}
          ml-0
        `}
      >
        {/* HEADER */}
        <div className="h-16 md:h-20">
          <Header
            onNavigateToNotifications={handleNavigateToNotifications}
            onDeconnexion={onDeconnexion}
            onNavigateToProfile={handleNavigateToProfile}
            adminData={adminData}
            userRole="admin"
            onToggleSidebar={handleToggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        {/* CONTENT */}
        <main className="flex-1 px-4 md:px-8 pt-6 pb-8 bg-gray-50 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      {currentView !== "chat" && (
        <FloatingChatBubble
          onOpenFullChat={handleOpenFullChat}
          autoOpen={chatAutoOpen}
          targetReference={chatTargetReference}
          onAutoOpenHandled={() => setChatAutoOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardAdmin;
