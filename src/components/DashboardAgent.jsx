// src/components/DashboardAgent.jsx - MODE DÉMO
import React, { useState, useEffect } from "react";
import AuthService from "../services/authService";

import Header from "./Header";
import SidebarAgent from "./SidebarAgent";
import DashboardView from "./views/DashboardView";
import ReportsView from "./views/ReportsView";

import Profile from "./Profile";
import NotificationsView from "./views/NotificationsView";
import AgentReportsView from "./views/AgentReportsView";

const DashboardAgent = ({ onDeconnexion }) => {
    const [currentView, setCurrentView] = useState("dashboard");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [agentData, setAgentData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = () => {
            try {
                const user = AuthService.getUser();
                if (user && user.email) {
                    setAgentData(user);
                } else {
                    onDeconnexion?.();
                }
            } catch (error) {
                onDeconnexion?.();
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [onDeconnexion]);

    const handleNavigateToProfile = () => setCurrentView("profil");
    const handleNavigateToNotifications = () => setCurrentView("notifications");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto" />
                    <p className="mt-6 text-lg text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!agentData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-xl text-red-600">Authentification requise</p>
                    <button
                        onClick={onDeconnexion}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
                    >
                        Retour au login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                adminData={agentData}
                onDeconnexion={onDeconnexion}
                onNavigateToProfile={handleNavigateToProfile}
                onNavigateToNotifications={handleNavigateToNotifications}
            />

            <div className="flex pt-20">
                <SidebarAgent
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                <main
                    className={`flex-1 transition-all duration-300 ${
                        sidebarCollapsed ? "ml-16" : "ml-64"
                    } p-8`}
                >
                    {currentView === "dashboard" && <DashboardView data={agentData} />}

                    {currentView === "signalements" && (
                        <ReportsView data={agentData} />
                    )}

                    {currentView === "AgentReportView" && <AgentReportsView />}


                    {currentView === "notifications" && (
                        <NotificationsView data={agentData} />
                    )}
                    {currentView === "profil" && (
                        <Profile
                            onReturnToDashboard={() => setCurrentView("dashboard")}
                            onAvatarUpdate={() => window.location.reload()}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardAgent;
