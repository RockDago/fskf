import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoadingPage from "./components/LoadingPage";
import FormulaireSignalement from "./components/SignalementForm";
import SuiviDossier from "./components/SuiviDossier";
import Login from "./components/login";

// ✅ 1. IMPORT DU NOUVEAU COMPOSANT
import PublicEnseignantsView from "./components/PublicEnseignantsView";

// ✅ 2. IMPORT DU COMPOSANT PAGE 404
import Page404 from "./components/Page404";

import DashboardAdmin from "./components/DashboardAdmin";
import DashboardAgent from "./components/DashboardAgent";

import TwoFactorVerify from "./components/TwoFactorVerify";
import { authUtils } from "./utils/authUtils";

// ... (Le composant PrivateRoute reste inchangé) ...
const PrivateRoute = ({ children, allowedRoles }) => {
  const [isAuth, setIsAuth] = React.useState(false);
  const [userType, setUserType] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const check = () => {
      const authenticated = authUtils.isAuthenticated();
      const type = authUtils.getUserType();
      setIsAuth(authenticated);
      setUserType(type);
      setLoading(false);
    };
    check();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  if (!isAuth) return <Navigate to="/login" replace />;
  if (userType && !allowedRoles.includes(userType)) {
    const redirectMap = {
      admin: "/admin",
      agent: "/agent",
      investigateur: "/investigateur",
    };
    return <Navigate to={redirectMap[userType] || "/login"} replace />;
  }
  if (!userType) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoadingPage />} />
        <Route path="/signalement" element={<FormulaireSignalement />} />
        <Route path="/suivi" element={<SuiviDossier />} />

        {/* ✅ 3. AJOUT DE LA ROUTE ENSEIGNANTS */}
        <Route path="/enseignants" element={<PublicEnseignantsView />} />

        <Route path="/login" element={<Login />} />
        <Route path="/two-factor-verify" element={<TwoFactorVerify />} />

        {/* DASHBOARDS PROTÉGÉS */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <DashboardAdmin />
            </PrivateRoute>
          }
        />
        <Route
          path="/agent/*"
          element={
            <PrivateRoute allowedRoles={["agent"]}>
              <DashboardAgent />
            </PrivateRoute>
          }
        />

        {/* ✅ 4. PAGE 404 PERSONNALISÉE */}
        <Route path="*" element={<Page404 />} />
      </Routes>
    </Router>
  );
}

export default App;
