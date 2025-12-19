// src/components/DashboardAdmin.jsx

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
import AnalyseView from "./views/AnalyseView";
import EquipeView from "./views/EquipeView";
import EnseignantsView from "./views/EnseignantsView";
import ChatView from "./views/ChatView";
import FloatingChatBubble from "./FloatingChatBubble"; // ✅ IMPORT

const DashboardAdmin = ({ onDeconnexion }) => {
    const [currentView, setCurrentView] = useState("dashboard");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [adminData, setAdminData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ AJOUT: États pour contrôler FloatingChatBubble depuis l'extérieur
    const [chatAutoOpen, setChatAutoOpen] = useState(false);
    const [chatTargetReference, setChatTargetReference] = useState(null);

    // ✅ MODE DÉMO : Charge SEULEMENT localStorage
    useEffect(() => {
        const loadProfile = () => {
            try {
                console.log("🎭 [MODE DÉMO] Chargement depuis localStorage...");
                const user = AuthService.getUser();
                if (user && user.email) {
                    console.log("✅ [MODE DÉMO] User chargé:", user.email);
                    setAdminData(user);
                } else {
                    console.warn("⚠️ [MODE DÉMO] Pas de user → déconnexion");
                    if (onDeconnexion) onDeconnexion();
                }
            } catch (error) {
                console.error("❌ [MODE DÉMO] Erreur:", error);
                if (onDeconnexion) onDeconnexion();
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, [onDeconnexion]);

    const handleNavigateToProfile = () => setCurrentView("profil");
    const handleNavigateToNotifications = () => setCurrentView("notifications");
    const handleNavigateToSettings = () => setCurrentView("settings");

    // ✅ FONCTION POUR OUVRIR LE CHAT EN PLEIN ÉCRAN DEPUIS LA BULLE FLOTTANTE
    const handleOpenFullChat = (chatId) => {
        console.log("📱 Ouverture du chat en plein écran pour l'ID:", chatId);
        setCurrentView("chat");
        // TODO: Lorsque le backend sera prêt, vous pourrez passer chatId à ChatView
        // pour afficher directement la conversation sélectionnée
    };

    // ✅ AJOUT: Fonction pour contacter depuis ReportsView (par référence)
    const handleContactByReference = (reference) => {
        console.log("💬 Demande de contact pour la référence:", reference);
        setChatTargetReference(reference);
        setChatAutoOpen(true);
    };

    // Fonction de rendu conditionnel des vues
    const renderContent = () => {
        switch (currentView) {
            case "dashboard":
                return <DashboardView />;
            case "reports":
                return <ReportsView onContactReference={handleContactByReference} />;
            case "chat":
                return <ChatView />;
            case "analyse":
                return <AnalyseView />;
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
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header
                    onNavigateToNotifications={handleNavigateToNotifications}
                    onDeconnexion={onDeconnexion}
                    onNavigateToProfile={handleNavigateToProfile}
                    onNavigateToSettings={handleNavigateToSettings}
                    adminData={adminData}
                    userRole="admin"
                />

                {/* Contenu principal */}
                <main
                    className={`flex-1 overflow-y-auto p-6 bg-gray-50 ${
                        currentView === "chat" ? "pt-24 h-screen" : "mt-20"
                    }`}
                >
                    {renderContent()}
                </main>
            </div>

            {/* ✅ BULLE DE CHAT FLOTTANTE - visible partout sauf sur ChatView */}
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
