import React, { useState } from "react";
import {
  Search,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../config/axios";

import LogoFosika from "../assets/images/logo fosika.png";
import LogoRep from "../assets/images/logo rep.png";
import LogoMesupres from "../assets/images/logo mesupres.png";
import FloatingChatSupport from "../components/FloatingChatSupport"; // ✅ IMPORT AJOUTÉ

// Icônes par catégorie
const categoryIcons = {
  "faux-diplomes": "📜",
  "offre-formation-irreguliere": "🎓",
  "recrutements-irreguliers": "💼",
  harcelement: "⚠️",
  corruption: "🔴",
  divers: "📋",
};

// Libellés de catégories
const categoryLabels = {
  "faux-diplomes": "Faux Diplômes",
  "offre-formation-irreguliere":
    "Offre de formation irrégulière (non habilité)",
  "recrutements-irreguliers": "Recrutements Irréguliers",
  harcelement: "Harcèlement",
  corruption: "Corruption",
  divers: "Divers",
};

// Titres par défaut
const defaultTitles = {
  "faux-diplomes": "Signalement de faux diplôme",
  "offre-formation-irreguliere":
    "Signalement d'offre de formation irrégulière (non habilité)",
  "recrutements-irreguliers": "Signalement de recrutement irrégulier",
  harcelement: "Signalement de harcèlement",
  corruption: "Signalement de corruption",
  divers: "Signalement divers",
};

// Statuts
const statusLabels = {
  en_cours: "En cours",
  finalise: "Finalisé",
  doublon: "Doublon",
  refuse: "Refusé",
  traitement_classification: "Traitement et classification",
  investigation: "Investigation",
  transmis_autorite: "Transmis aux autorités",
  classifier: "Classifié",
};

// Workflow
const workflowLabels = {
  completed: "Complété",
  in_progress: "En cours",
  pending: "En attente",
  rejected: "Rejeté",
  duplicate: "Doublon",
  not_required: "Non requis",
};

export default function DossierTracker() {
  const navigate = useNavigate();

  const [page, setPage] = useState("recherche");
  const [reference, setReference] = useState("");
  const [dossierActuel, setDossierActuel] = useState(null);
  const [erreur, setErreur] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [, setSelectedFile] = useState(null);

  const cleanReference = (ref) => {
    return ref.replace(/\s+/g, "");
  };

  // Fonction pour traiter les données du workflow
  const processWorkflowData = (workflowData, reportData) => {
    if (!workflowData) {
      return {
        drse: {
          date: reportData?.created_at,
          status: "in_progress",
          progress: 33,
          agent: "DAAQ / DRSE",
        },
        cac: {
          date: null,
          status: "pending",
          progress: 0,
          agent: "DAAQ / CAC / DAJ",
        },
        bianco: {
          date: null,
          status: "pending",
          progress: 0,
          agent: "DAAQ / BIANCO",
        },
      };
    }

    // Si c'est une chaîne JSON, la parser
    if (typeof workflowData === "string") {
      try {
        workflowData = JSON.parse(workflowData);
      } catch (e) {
        console.error("Erreur parsing workflow:", e);
      }
    }

    // Retourner le workflow avec des valeurs par défaut
    return {
      drse: {
        date: workflowData.drse?.date || reportData?.created_at,
        status: workflowData.drse?.status || "in_progress",
        progress: workflowData.drse?.progress || 33,
        agent: workflowData.drse?.agent || "DAAQ / DRSE",
      },
      cac: {
        date: workflowData.cac?.date || null,
        status: workflowData.cac?.status || "pending",
        progress: workflowData.cac?.progress || 0,
        agent: workflowData.cac?.agent || "DAAQ / CAC / DAJ",
      },
      bianco: {
        date: workflowData.bianco?.date || null,
        status: workflowData.bianco?.status || "pending",
        progress: workflowData.bianco?.progress || 0,
        agent: workflowData.bianco?.agent || "DAAQ / BIANCO",
      },
    };
  };

  const handleRecherche = async () => {
    const cleanedReference = cleanReference(reference);

    if (!cleanedReference.trim()) {
      setErreur("Veuillez saisir une référence");
      return;
    }

    try {
      setIsLoading(true);
      setErreur("");
      setError(null);

      // Utiliser l'endpoint de tracking public
      const response = await API.get(`/reports/tracking/${cleanedReference}`);
      const result = response.data;

      if (!result.success || !result.data) {
        setErreur("Aucun dossier trouvé avec cette référence");
        return;
      }

      const data = result.data;

      // Traitement des fichiers
      let filesArray = [];
      if (data.files && Array.isArray(data.files)) {
        filesArray = data.files;
      } else if (data.files && typeof data.files === "string") {
        try {
          const parsed = JSON.parse(data.files);
          if (Array.isArray(parsed)) {
            filesArray = parsed;
          }
        } catch (e) {
          console.error("Erreur parsing JSON files:", e);
        }
      }

      // Vérifier si anonyme
      const isAnonymous =
        data.type === "anonyme" ||
        (data.name && data.name.toLowerCase() === "anonyme");

      // Traitement du workflow
      const workflow = processWorkflowData(data.workflow, data);

      // Construction de l'objet dossier
      const dossier = {
        reference: data.reference,
        statut: data.status || "en_cours",
        titre: defaultTitles[data.category] || "Signalement",
        dateCreation: data.created_at,
        dateMiseAJour: data.updated_at,
        category: data.category,
        hasProof: data.has_proof || filesArray.length > 0,
        workflow: workflow,
        isAnonymous: isAnonymous,
        // Données personnelles
        name: isAnonymous ? "Anonyme" : data.name || "Non renseigné",
        email: isAnonymous ? "" : data.email || "",
        phone: isAnonymous ? "" : data.phone || "",
        // Description
        description:
          data.description ||
          "Aucune description disponible pour ce signalement.",
        // Localisation
        region: data.region || "",
        city: data.city || "",
        province: data.province || "",
        address: data.address || "",
        // Fichiers
        files: filesArray,
        // Champs supplémentaires
        type: data.type || (isAnonymous ? "anonyme" : "identifie"),
        accept_terms: data.accept_terms || true,
        accept_truth: data.accept_truth || true,
      };

      console.log("Dossier construit:", dossier);
      setDossierActuel(dossier);
      setPage("details");
    } catch (e) {
      console.error("Erreur lors de la recherche:", e);
      if (e.response?.status === 404) {
        setErreur("Aucun dossier trouvé avec cette référence");
      } else {
        setErreur("Erreur lors de la consultation du dossier");
      }
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceChange = (e) => {
    const value = e.target.value;
    const cleanedValue = cleanReference(value);
    setReference(cleanedValue);
    if (erreur) {
      setErreur("");
    }
  };

  const retourRecherche = () => {
    setPage("recherche");
    setReference("");
    setDossierActuel(null);
    setErreur("");
  };

  const retourAccueil = () => {
    navigate("/");
  };

  const extractFileName = (file) => {
    if (typeof file === "string") {
      if (file.includes("http://") || file.includes("https://")) {
        return file.split("/").pop();
      }
      if (file.includes("/")) {
        return file.split("/").pop();
      }
      return file;
    }

    if (typeof file === "object" && file !== null) {
      return (
        file.file_name ||
        file.filename ||
        extractFileName(file.path || file.url || "")
      );
    }

    return file;
  };

  const handleViewFile = async (file) => {
    try {
      const fileName = extractFileName(file);
      // Utiliser la route publique
      const fileUrl = `${API.defaults.baseURL}/files/public/${fileName}`;
      const newWindow = window.open(fileUrl, "_blank");
      if (!newWindow) {
        alert("Veuillez autoriser les pop-ups pour visualiser les fichiers");
      }
    } catch (error) {
      alert("Erreur lors de l'ouverture du fichier: " + error.message);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const fileName = extractFileName(file);
      // Utiliser la route publique
      const downloadUrl = `${API.defaults.baseURL}/files/public/${fileName}/download`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erreur lors du téléchargement: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "en_cours":
      case "traitement_classification":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "finalise":
      case "classifier":
        return "bg-green-100 text-green-800 border-green-200";
      case "doublon":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "refuse":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "investigation":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "transmis_autorite":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getWorkflowStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-600" size={20} />;
      case "in_progress":
        return <Clock className="text-blue-600" size={20} />;
      case "rejected":
        return <XCircle className="text-red-600" size={20} />;
      case "duplicate":
        return <Clock className="text-yellow-600" size={20} />;
      case "not_required":
        return <Clock className="text-gray-400" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getWorkflowStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "in_progress":
        return "bg-blue-50 border-blue-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      case "duplicate":
        return "bg-yellow-50 border-yellow-200";
      case "not_required":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Fonction pour sélectionner un fichier unique pour l'affichage en grand

  // Fonction pour fermer l'affichage en grand

  if (error && page === "recherche") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col font-bill">
        <div className="w-full bg-white border-b-2 border-gray-200 py-4 shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <img
                  src={LogoRep}
                  alt="Logo République"
                  className="h-12 w-12 object-contain"
                />
                <img
                  src={LogoMesupres}
                  alt="Logo MESUPRES"
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="w-[2px] bg-gray-400 h-28" />
              <div className="flex flex-col justify-center space-y-1">
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Repoblikani Madagasikara
                </span>
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Ministre de l'Enseignement Supérieur
                  <br />
                  et de la Recherche Scientifique
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-lg shadow-2xl p-8 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Erreur de chargement
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>

        <div className="w-full text-center py-4 mt-auto">
          <div className="text-gray-500 text-xs">© daaq-Mesupres 2025</div>
        </div>
      </div>
    );
  }

  if (page === "recherche") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col font-bill">
        <div className="w-full bg-white border-b-2 border-gray-200 py-4 shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <img
                  src={LogoRep}
                  alt="Logo République"
                  className="h-12 w-12 object-contain"
                />
                <img
                  src={LogoMesupres}
                  alt="Logo MESUPRES"
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="w-[2px] bg-gray-400 h-28" />
              <div className="flex flex-col justify-center space-y-1">
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Repoblikani Madagasikara
                </span>
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Ministre de l'Enseignement Supérieur
                  <br />
                  et de la Recherche Scientifique
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-lg shadow-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-3">
                  <img
                    src={LogoFosika}
                    alt="FOSIKA"
                    className="h-16 object-contain"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Suivi de Dossier
                </h2>
                <p className="text-gray-600">
                  Consultez l'état d'avancement de votre signalement
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Référence du dossier
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={reference}
                      onChange={handleReferenceChange}
                      placeholder="Ex: REF-20251119-6AB2BF"
                      className="w-full px-4 py-3.5 pl-12 text-lg border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#5e8f3e] focus:border-[#5e8f3e] transition-all outline-none font-bill"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleRecherche();
                      }}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {erreur && (
                    <p className="text-red-500 text-sm mt-2">{erreur}</p>
                  )}
                </div>

                <button
                  onClick={handleRecherche}
                  disabled={isLoading}
                  className="w-full bg-[#5e8f3e] text-white py-4 rounded font-semibold text-lg hover:bg-[#4a7b32] transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Recherche en cours..."
                    : "Rechercher le dossier"}
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={retourAccueil}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded transition-all shadow-md border-2 border-gray-200 hover:border-[#b3d088]"
                >
                  <ArrowLeft size={20} />
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full text-center py-4 mt-auto">
          <div className="text-gray-500 text-xs">© daaq-Mesupres 2025</div>
        </div>
      </div>
    );
  }

  if (!dossierActuel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-bill">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Aucun dossier sélectionné</p>
          <button
            onClick={retourRecherche}
            className="bg-[#5e8f3e] text-white px-6 py-3 rounded hover:bg-[#4a7b32] transition-colors"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-bill">
      <div className="w-full bg-white border-b-2 border-gray-200 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-12 w-12 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-12 w-12 object-contain"
              />
            </div>
            <div className="w-[2px] bg-gray-400 h-28" />
            <div className="flex flex-col justify-center space-y-1">
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Repoblikani Madagasikara
              </span>
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Ministre de l'Enseignement Supérieur
                <br />
                et de la Recherche Scientifique
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-[#0c2844] to-[#09407e] p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {categoryIcons[dossierActuel.category] || "📋"}
                  </span>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {dossierActuel.titre}
                    </h1>
                    <p className="text-white/90 text-sm mt-1">
                      {categoryLabels[dossierActuel.category] || "Signalement"}
                    </p>
                  </div>
                </div>

                <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded">
                  <p className="text-white font-mono font-semibold text-sm">
                    Référence : {dossierActuel.reference}
                  </p>
                </div>

                <div className="mt-2">
                  <span
                    className={
                      "px-2 py-1 rounded text-xs font-medium " +
                      (dossierActuel.hasProof
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200")
                    }
                  >
                    {dossierActuel.hasProof ? "Avec preuves" : "Sans preuves"}
                  </span>
                </div>
              </div>

              <div>
                <span
                  className={
                    "px-4 py-2 rounded text-sm font-bold border-2 shadow-lg " +
                    getStatusColor(dossierActuel.statut)
                  }
                >
                  {statusLabels[dossierActuel.statut] ||
                    dossierActuel.statut ||
                    "En cours"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-[#4c7026] mr-3" />
                {dossierActuel.isAnonymous
                  ? "Signalement anonyme"
                  : "Informations de l'émetteur"}
              </h2>

              {dossierActuel.isAnonymous ? (
                <div className="bg-gray-50 border-2 border-gray-200 rounded p-5 text-center">
                  <User className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-semibold text-sm">
                    Ce signalement a été effectué de manière anonyme.
                  </p>
                  <div className="mt-3 bg-white rounded p-3 border border-gray-200 inline-block">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4c7026]" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          Date de création
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatDate(dossierActuel.dateCreation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Nom complet
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {dossierActuel.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Téléphone
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {dossierActuel.phone || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Email
                        </p>
                        <p className="font-semibold text-gray-800 text-sm break-all">
                          {dossierActuel.email || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Localisation
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {dossierActuel.address ||
                            (dossierActuel.city ||
                            dossierActuel.province ||
                            dossierActuel.region
                              ? `${dossierActuel.city || ""}${
                                  dossierActuel.city && dossierActuel.province
                                    ? ", "
                                    : ""
                                }${dossierActuel.province || ""}${
                                  (dossierActuel.city ||
                                    dossierActuel.province) &&
                                  dossierActuel.region
                                    ? " - "
                                    : ""
                                }${dossierActuel.region || ""}`
                              : "Non renseigné")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 border border-gray-200 md:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Date de création
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {formatDate(dossierActuel.dateCreation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-[#4c7026] mr-3" />
                Description du signalement
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                  {dossierActuel.description}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="w-1 h-6 bg-[#4c7026] mr-3" />
                  Pièces jointes
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    {dossierActuel.files?.length || 0} fichier
                    {dossierActuel.files?.length !== 1 ? "s" : ""}
                  </span>
                </h2>
              </div>

              {dossierActuel.files && dossierActuel.files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dossierActuel.files.map((file, index) => {
                    const displayName = extractFileName(file);
                    const extension =
                      displayName.split(".").pop()?.toUpperCase() || "FILE";

                    return (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#4c7026] to-[#b4cd7b] flex items-center justify-center flex-shrink-0 shadow-sm rounded">
                              <span className="text-white text-xs font-bold">
                                {extension}
                              </span>
                            </div>
                            <div className="truncate">
                              <span className="text-gray-800 font-medium text-sm block">
                                Preuve {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleViewFile(file)}
                              className="p-1.5 text-blue-600 hover:text-blue-800"
                              title="Voir"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-1.5 text-green-600 hover:text-green-800"
                              title="Télécharger"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={displayName}
                        >
                          {displayName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm text-gray-500">
                    {dossierActuel.hasProof
                      ? "Aucun fichier joint à ce dossier"
                      : "Signalement soumis sans pièces jointes"}
                  </p>
                </div>
              )}
            </div>

            {/* --- SUIVI DU TRAITEMENT / TIMELINE --- */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-[#4c7026] mr-3" />
                Suivi du traitement
              </h2>

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300" />

                <div className="space-y-5 pl-10">
                  {/* Étape DRSE */}
                  <div className="relative">
                    <div className="absolute -left-4 top-2 w-3 h-3 bg-[#4c7026] border-2 border-white shadow" />
                    <div
                      className={
                        "border rounded px-4 py-3 bg-white shadow-sm hover:shadow-md transition-all " +
                        getWorkflowStatusColor(
                          dossierActuel.workflow?.drse?.status || "pending"
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getWorkflowStatusIcon(
                              dossierActuel.workflow?.drse?.status || "pending"
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Étape 1
                            </p>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              Traitement et classification
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {dossierActuel.workflow?.drse?.agent ||
                                "DAAQ / DRSE"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-white border border-gray-200 text-gray-800">
                            {workflowLabels[
                              dossierActuel.workflow?.drse?.status || "pending"
                            ] || "En attente"}
                          </span>
                          {dossierActuel.workflow?.drse?.date && (
                            <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-end gap-1.5">
                              <Calendar size={12} />
                              {formatDate(dossierActuel.workflow.drse.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Étape CAC */}
                  <div className="relative">
                    <div className="absolute -left-4 top-2 w-3 h-3 bg-gray-300 border-2 border-white shadow" />
                    <div
                      className={
                        "border rounded px-4 py-3 bg-white shadow-sm hover:shadow-md transition-all " +
                        getWorkflowStatusColor(
                          dossierActuel.workflow?.cac?.status || "pending"
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getWorkflowStatusIcon(
                              dossierActuel.workflow?.cac?.status || "pending"
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Étape 2
                            </p>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              Ouverture d&apos;enquêtes
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {dossierActuel.workflow?.cac?.agent ||
                                "DAAQ / CAC / DAJ"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-white border border-gray-200 text-gray-800">
                            {workflowLabels[
                              dossierActuel.workflow?.cac?.status || "pending"
                            ] || "En attente"}
                          </span>
                          {dossierActuel.workflow?.cac?.date && (
                            <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-end gap-1.5">
                              <Calendar size={12} />
                              {formatDate(dossierActuel.workflow.cac.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Étape BIANCO */}
                  <div className="relative">
                    <div className="absolute -left-4 top-2 w-3 h-3 bg-gray-300 border-2 border-white shadow" />
                    <div
                      className={
                        "border rounded px-4 py-3 bg-white shadow-sm hover:shadow-md transition-all " +
                        getWorkflowStatusColor(
                          dossierActuel.workflow?.bianco?.status || "pending"
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getWorkflowStatusIcon(
                              dossierActuel.workflow?.bianco?.status ||
                                "pending"
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Étape 3
                            </p>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              Transmis aux autorités compétentes
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {dossierActuel.workflow?.bianco?.agent ||
                                "DAAQ / BIANCO"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-white border border-gray-200 text-gray-800">
                            {workflowLabels[
                              dossierActuel.workflow?.bianco?.status ||
                                "pending"
                            ] || "En attente"}
                          </span>
                          {dossierActuel.workflow?.bianco?.date && (
                            <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-end gap-1.5">
                              <Calendar size={12} />
                              {formatDate(dossierActuel.workflow.bianco.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <button
                onClick={retourRecherche}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-all shadow-md border-2 border-[#b4cd7b] hover:border-[#4c7026]"
              >
                <Search size={18} />
                Nouvelle recherche
              </button>
              <button
                onClick={retourAccueil}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4c7026] hover:bg-[#3a5a1d] text-white font-semibold transition-all shadow-md"
              >
                <ArrowLeft size={18} />
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center py-4 mt-6">
        <div className="text-gray-500 text-xs">© daaq-mesupres 2025</div>
      </div>

      {/* ✅ BULLE DE CHAT SUPPORT - Affiche uniquement quand dossier trouvé */}
      {dossierActuel && (
        <FloatingChatSupport
          reference={dossierActuel.reference}
          dossierInfo={dossierActuel}
        />
      )}
    </div>
  );
}
