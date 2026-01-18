import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ChevronRight,
  Menu,
  X,
  Server,
} from "lucide-react";
import LogoFosika from "../assets/images/logo fosika.png";

const Sidebar = ({ currentView, onViewChange, collapsed, onToggle }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ✅ Gestion simple du clic sur item
  const handleItemClick = (id) => {
    onViewChange(id);
    if (isMobile) {
      onToggle(); // Fermer sidebar sur mobile après clic
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      section: "vue",
    },
    {
      id: "chat",
      label: "Messagerie",
      icon: MessageSquare,
      section: "vue",
    },
    {
      id: "reports",
      label: "Gestion des signalements",
      icon: FileText,
      section: "gestion",
    },
    {
      id: "enseignants",
      label: "Enseignants",
      icon: GraduationCap,
      section: "gestion",
    },
    {
      id: "equipe",
      label: "Utilisateurs",
      icon: Users,
      section: "gestion",
    },
    {
      id: "audit",
      label: "Log / Audit",
      icon: BookOpen,
      section: "gestion",
    },
  ];

  const isLinkActive = (id) => currentView === id;

  // Styles
  const baseItemClass =
    "group flex items-center justify-between px-4 py-3 mx-3 mb-1 rounded-xl transition-all duration-200 cursor-pointer text-sm font-medium";
  const activeClass = "bg-blue-50 text-blue-600";
  const inactiveClass = "text-gray-500 hover:bg-gray-50 hover:text-gray-900";

  // Filtrer par section
  const vueItems = menuItems.filter((item) => item.section === "vue");
  const gestionItems = menuItems.filter((item) => item.section === "gestion");

  // ✅ Classes pour le sidebar
  const sidebarClasses = isMobile
    ? `fixed top-0 left-0 h-full bg-white z-50 border-r border-gray-100 shadow-xl
       transition-all duration-300 ease-in-out flex flex-col w-72
       ${collapsed ? "-translate-x-full" : "translate-x-0"}`
    : `fixed top-0 left-0 h-full bg-white z-30 border-r border-gray-100
       transition-all duration-300 ease-in-out flex flex-col
       ${collapsed ? "w-20" : "w-72"}`;

  return (
    <>
      {/* Overlay Mobile - Seulement quand sidebar est ouvert sur mobile */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside className={sidebarClasses}>
        {/* HEADER SIDEBAR */}
        <div className="h-20 flex items-center justify-center px-6 border-b border-gray-50 mb-4 relative">
          {/* LOGO FOSIKA */}
          {(!collapsed || (isMobile && !collapsed)) && (
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <img
                src={LogoFosika}
                alt="FOSIKA"
                className="h-24 object-contain"
              />
            </div>
          )}

          {/* TOGGLE BUTTON (Desktop) */}
          {!isMobile && (
            <button
              onClick={onToggle}
              className={`p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors ${
                !collapsed ? "absolute right-4" : "mx-auto"
              }`}
              title={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
          )}

          {/* CLOSE BUTTON (Mobile - Quand ouvert) */}
          {isMobile && !collapsed && (
            <button
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-red-500 absolute right-4"
              title="Fermer le menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* NAVIGATION LIST */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar pb-6">
          {/* Section: VUE D'ENSEMBLE */}
          <div className="mb-6">
            {!collapsed && (
              <div className="px-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Vue d'ensemble
              </div>
            )}
            {vueItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`${baseItemClass} ${
                  isLinkActive(item.id) ? activeClass : inactiveClass
                }`}
                title={collapsed ? item.label : ""}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`text-lg flex-shrink-0 ${
                      isLinkActive(item.id)
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                    size={20}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {isLinkActive(item.id) && !collapsed && (
                  <ChevronRight className="text-xs text-blue-600" size={14} />
                )}
              </div>
            ))}
          </div>

          {/* Section: GESTION */}
          <div className="mb-6">
            {!collapsed && (
              <div className="px-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Gestion
              </div>
            )}

            {/* Items de gestion */}
            {gestionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`${baseItemClass} ${
                  isLinkActive(item.id) ? activeClass : inactiveClass
                }`}
                title={collapsed ? item.label : ""}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`text-lg flex-shrink-0 ${
                      isLinkActive(item.id)
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                    size={20}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {isLinkActive(item.id) && !collapsed && (
                  <ChevronRight className="text-xs text-blue-600" size={14} />
                )}
              </div>
            ))}

         
          </div>
        </nav>

        {/* FOOTER - Desktop seulement */}
        {!collapsed && !isMobile && (
          <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
            &copy; daaq-mesupres 2026
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
