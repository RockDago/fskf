// src/components/views/EnseignantsView.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  ArrowLeft,
  MapPin,
  School,
  Trash2,
  Edit,
  Eye,
  X,
  PieChart,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User,
  Award,
  BookOpen,
  Building2,
  Hash,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ✅ Import des services API
import enseignantService from "../../services/enseignantService";
import universiteService from "../../services/universiteService";
import etablissementService from "../../services/etablissementService";

const PROVINCES = [
  "Antananarivo",
  "Antsiranana",
  "Fianarantsoa",
  "Toamasina",
  "Mahajanga",
  "Toliara",
];

// ✅ Définir les légendes des corps (tri alphabétique)
const LEGENDE_CORPS = [
  { code: "AES", libelle: "Assistant d'Enseignement Supérieur" },
  { code: "MC", libelle: "Maître de Conférences" },
  { code: "PE", libelle: "Professeur Emérite" },
  { code: "PES", libelle: "Professeur d'Enseignement Supérieur" },
  { code: "PT", libelle: "Professeur Titulaire" },
];

// Mapping corps vers titre
const CORPS_TO_TITRE = {
  AES: "ASSITANT D'ENSEIGNEMENT SUPERIEUR",
  PE: "PROFESSEUR EMMERITE",
  PT: "PROFESSEUR TITULAIRE",
  PES: "PROFESSEUR D'ENSEIGNEMENT SUPERIEUR",
  MC: "MAÎTRE DE CONFÉRENCES D'ENSEIGNEMENT SUPERIEUR",
};

// Corps enseignants (codes uniquement, tri alphabétique)
const CORPS = LEGENDE_CORPS.map((item) => item.code);

// Titres (catégories) triés alphabétiquement
const TITRES = [
  "ASSITANT D'ENSEIGNEMENT SUPERIEUR",
  "MAÎTRE DE CONFÉRENCES D'ENSEIGNEMENT SUPERIEUR",
  "PROFESSEUR D'ENSEIGNEMENT SUPERIEUR",
  "PROFESSEUR EMMERITE",
  "PROFESSEUR TITULAIRE",
].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

// ✅ Helper: normaliser texte (titres, corps, etc.) — enlever accents et mettre en MAJ
const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

// ✅ Recherche LIKE SQL (insensible à la casse et aux accents)
const normalizeSearchText = (text) => {
  if (!text) return "";
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// ✅ Helper: normaliser la réponse API
const extractArrayFromResponse = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.data))
    return response.data.data;
  if (Array.isArray(response?.data?.enseignants))
    return response.data.enseignants;
  return [];
};

// --- COMPOSANT TOAST ---
const Toast = ({ message, type = "success", onClose }) => {
  const config = {
    success: {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      borderColor: "border-green-500",
      bgColor: "bg-green-50",
    },
    error: {
      icon: <XCircle className="w-6 h-6 text-red-500" />,
      borderColor: "border-red-500",
      bgColor: "bg-red-50",
    },
  };

  const { icon, borderColor, bgColor } = config[type];

  return (
    <div
      className={`${bgColor} border-l-4 ${borderColor} rounded shadow-2xl p-4 w-80 flex items-start animate-in slide-in-from-right duration-300`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-3 w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-gray-900 leading-5">{message}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button
          onClick={onClose}
          className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition ease-in-out duration-150"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// --- COMPOSANT MODAL ---
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// --- COMPOSANT MODAL DE CONFIRMATION ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger",
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: <AlertTriangle className="w-12 h-12" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonBg: "bg-red-600 hover:bg-red-700",
      borderColor: "border-red-200",
    },
  };

  const style = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div
              className={`${style.iconBg} ${style.iconColor} rounded-full p-4 mb-4`}
            >
              {style.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div
          className={`bg-gray-50 px-6 py-4 flex gap-3 border-t ${style.borderColor}`}
        >
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 ${style.buttonBg} text-white rounded-lg font-medium transition-colors shadow-sm`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT MENU DROPDOWN ---
const DropdownMenu = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        {trigger}
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]">
            {React.Children.map(children, (child) =>
              React.cloneElement(child, {
                onClick: () => {
                  child.props.onClick?.();
                  setIsOpen(false);
                },
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
      danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// --- COMPOSANT PRINCIPAL ---
const EnseignantsView = () => {
  const [viewState, setViewState] = useState("selection");
  const [selectedUniv, setSelectedUniv] = useState(null);
  const [activeTab, setActiveTab] = useState("RECAP");

  // ✅ États pour les données API
  const [universites, setUniversites] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]); // ✅ Pour RECAP
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ États pour les filtres RECAP
  const [recapFilter, setRecapFilter] = useState({
    search: "",
    faculte: "",
    corps: "",
    titre: "",
  });

  // ✅ États pour les filtres FACULTE
  const [faculteFilter, setFaculteFilter] = useState({
    search: "",
    corps: "",
    titre: "",
  });

  // ✅ État pour le tri RECAP
  const [recapSort, setRecapSort] = useState({
    field: "nom",
    direction: "asc",
  });

  // ✅ État pour le tri FACULTE
  const [faculteSort, setFaculteSort] = useState({
    field: "nom",
    direction: "asc",
  });

  const [showModalUniv, setShowModalUniv] = useState(false);
  const [showModalFaculte, setShowModalFaculte] = useState(false);
  const [showModalTeacher, setShowModalTeacher] = useState(false);
  const [showModalEditUniv, setShowModalEditUniv] = useState(false);
  const [showModalEditFaculte, setShowModalEditFaculte] = useState(false);
  const [showModalViewTeacher, setShowModalViewTeacher] = useState(false);
  const [showModalEditTeacher, setShowModalEditTeacher] = useState(false);
  const [editingUniv, setEditingUniv] = useState(null);
  const [editingFaculte, setEditingFaculte] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [newUniv, setNewUniv] = useState({
    nom: "",
    province: PROVINCES[0],
    code: "",
  });
  const [newFaculte, setNewFaculte] = useState("");
  const [newTeacher, setNewTeacher] = useState({
    nom: "",
    sexe: "M",
    im: "",
    date_naissance: "",
    corps: "AES",
    diplome: "",
    specialite: "",
    titre: TITRES[0],
  });
  const [editTeacher, setEditTeacher] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTeacher, setSearchTeacher] = useState("");

  // ✅ Normaliser les titres
  const NORMALIZED_TITRES = useMemo(
    () => TITRES.map((c) => normalizeText(c)),
    []
  );

  // Fonction pour afficher un toast
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      5000
    );
  };

  // Fonction de validation et formatage de la date
  const handleDateChange = (value) => {
    const numbers = value.replace(/\D/g, "");
    let formatted = "";

    if (numbers.length > 0) {
      // Jour (01-31)
      let day = numbers.substring(0, 2);
      if (day.length === 2 && parseInt(day) > 31) day = "31";
      if (day.length === 2 && parseInt(day) === 0) day = "01";
      formatted = day;

      if (numbers.length >= 3) {
        // Mois (01-12)
        let month = numbers.substring(2, 4);
        if (month.length === 2 && parseInt(month) > 12) month = "12";
        if (month.length === 2 && parseInt(month) === 0) month = "01";
        formatted += "/" + month;
      }

      if (numbers.length >= 5) {
        // Année (max 4 chiffres)
        formatted += "/" + numbers.substring(4, 8);
      }
    }

    return formatted;
  };

  // Fonction de validation de l'IM (6 chiffres uniquement)
  const handleIMChange = (value) => value.replace(/\D/g, "").substring(0, 6);

  // Fonction pour convertir le format de date JJ/MM/AAAA vers AAAA-MM-JJ
  const convertToISODate = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return "";
    const [day, month, year] = dateStr.split("/");
    if (!day || !month || !year) return "";
    return `${year}-${month}-${day}`;
  };

  // Fonction pour convertir le format de date AAAA-MM-JJ ou ISO complet vers JJ/MM/AAAA
  const convertFromISODate = (dateStr) => {
    if (!dateStr) return "";

    // Nettoyer la chaîne : enlever l'heure et le timestamp si présent
    const cleanDate = String(dateStr).split("T")[0]; // Prend seulement la partie date

    const parts = cleanDate.split("-");
    if (parts.length !== 3) return "";

    const [year, month, day] = parts;

    // Validation basique
    if (!year || !month || !day) return "";
    if (year.length !== 4) return "";

    return `${day}/${month}/${year}`;
  };

  // ✅ Charger les universités au montage
  useEffect(() => {
    const fetchUniversites = async () => {
      try {
        setLoading(true);
        const data = await universiteService.getAll();
        const list = extractArrayFromResponse(data);
        setUniversites(Array.isArray(list) ? list : []);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des universités:", err);
        setError("Impossible de charger les universités");
        showToast("Erreur de chargement des universités", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUniversites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Charger les établissements quand une université est sélectionnée
  useEffect(() => {
    const fetchEtablissements = async () => {
      if (!selectedUniv) return;

      try {
        const data = await etablissementService.getAll(selectedUniv.id);
        const list = extractArrayFromResponse(data);
        setEtablissements(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Erreur lors du chargement des établissements:", err);
        setEtablissements([]);
        showToast("Erreur de chargement des établissements", "error");
      }
    };

    fetchEtablissements();
  }, [selectedUniv]);

  // ✅ Charger TOUS les enseignants pour le RECAP
  useEffect(() => {
    const fetchAllTeachersForRecap = async () => {
      if (!selectedUniv) {
        setAllTeachers([]);
        return;
      }

      try {
        setLoading(true);
        const params = {
          universite_id: selectedUniv.id,
          per_page: 100000,
        };

        const response = await enseignantService.getAll(params);
        const list = extractArrayFromResponse(response);

        // Ajouter le nom de la faculté à chaque enseignant
        const normalized = (Array.isArray(list) ? list : []).map((t) => {
          const etab = etablissements.find(
            (e) => String(e.id) === String(t?.etablissement_id)
          );
          return {
            ...t,
            nom: t?.nom ?? "",
            im: t?.im ?? "",
            sexe: normalizeText(t?.sexe),
            corps: normalizeText(t?.corps),
            titre: normalizeText(t?.categorie || t?.titre),
            diplome: t?.diplome ?? "",
            specialite: t?.specialite ?? "",
            date_naissance: t?.date_naissance ?? "",
            etablissement_id: t?.etablissement_id ?? null,
            faculte_nom: etab?.nom ?? "Non assigné",
          };
        });

        setAllTeachers(normalized);
      } catch (err) {
        console.error("Erreur chargement RECAP enseignants:", err);
        setAllTeachers([]);
        showToast("Erreur de chargement du récapitulatif", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAllTeachersForRecap();
  }, [selectedUniv, etablissements]);

  // ✅ Charger les enseignants par faculté
  useEffect(() => {
    const fetchEnseignants = async () => {
      if (!selectedUniv || activeTab === "RECAP") {
        setTeachers([]);
        return;
      }

      if (!etablissements || etablissements.length === 0) {
        return;
      }

      try {
        setLoading(true);

        const etablissement = etablissements.find((e) => e.nom === activeTab);

        if (!etablissement) {
          console.warn("Établissement non trouvé pour l'onglet:", activeTab);
          setTeachers([]);
          return;
        }

        const params = {
          universite_id: selectedUniv.id,
          etablissement_id: etablissement.id,
        };

        if (searchTeacher && searchTeacher.trim() !== "") {
          params.search = searchTeacher.trim();
        }

        const response = await enseignantService.getAll(params);
        const list = extractArrayFromResponse(response);

        // ✅ Normalisation des données
        const normalized = (Array.isArray(list) ? list : []).map((t) => ({
          ...t,
          nom: t?.nom ?? "",
          im: t?.im ?? "",
          sexe: normalizeText(t?.sexe),
          corps: normalizeText(t?.corps),
          titre: normalizeText(t?.categorie || t?.titre),
          diplome: t?.diplome ?? "",
          specialite: t?.specialite ?? "",
          date_naissance: t?.date_naissance ?? "",
          etablissement_id: t?.etablissement_id ?? etablissement.id,
        }));

        setTeachers(normalized);
      } catch (err) {
        console.error("Erreur lors du chargement des enseignants:", err);
        setTeachers([]);
        showToast("Erreur de chargement des enseignants", "error");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEnseignants, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedUniv, activeTab, etablissements, searchTeacher]);

  // --- FILTRES RECAP ---
  const filteredRecapTeachers = useMemo(() => {
    if (!Array.isArray(allTeachers)) return [];

    return allTeachers.filter((teacher) => {
      // ✅ Recherche LIKE SQL (insensible à la casse et aux accents)
      const searchQuery = normalizeSearchText(recapFilter.search || "");

      let matchesSearch = true;
      if (searchQuery) {
        matchesSearch =
          normalizeSearchText(teacher.nom || "").includes(searchQuery) ||
          normalizeSearchText(teacher.im || "").includes(searchQuery) ||
          normalizeSearchText(teacher.diplome || "").includes(searchQuery) ||
          normalizeSearchText(teacher.specialite || "").includes(searchQuery) ||
          normalizeSearchText(teacher.corps || "").includes(searchQuery) ||
          normalizeSearchText(teacher.titre || "").includes(searchQuery) ||
          normalizeSearchText(teacher.faculte_nom || "").includes(searchQuery);
      }

      const matchesFaculte =
        !recapFilter.faculte ||
        (teacher.faculte_nom || "") === recapFilter.faculte;

      const matchesCorps =
        !recapFilter.corps || (teacher.corps || "") === recapFilter.corps;

      const matchesTitre =
        !recapFilter.titre ||
        normalizeText(teacher.titre || "") === normalizeText(recapFilter.titre);

      return matchesSearch && matchesFaculte && matchesCorps && matchesTitre;
    });
  }, [allTeachers, recapFilter]);

  // ✅ Tri des enseignants RECAP
  const sortedRecapTeachers = useMemo(() => {
    const sorted = [...filteredRecapTeachers];

    sorted.sort((a, b) => {
      let aValue = a[recapSort.field] || "";
      let bValue = b[recapSort.field] || "";

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return recapSort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return recapSort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredRecapTeachers, recapSort]);

  // --- FILTRES FACULTE ---
  const filteredFaculteTeachers = useMemo(() => {
    if (!selectedUniv || activeTab === "RECAP") return [];
    if (!Array.isArray(teachers)) return [];

    return teachers.filter((t) => {
      // ✅ Recherche LIKE SQL (insensible à la casse et aux accents)
      const searchQuery = normalizeSearchText(faculteFilter.search || "");

      let matchesSearch = true;
      if (searchQuery) {
        matchesSearch =
          normalizeSearchText(t?.nom ?? "").includes(searchQuery) ||
          normalizeSearchText(t?.im ?? "").includes(searchQuery) ||
          normalizeSearchText(t?.diplome ?? "").includes(searchQuery) ||
          normalizeSearchText(t?.specialite ?? "").includes(searchQuery) ||
          normalizeSearchText(t?.titre ?? "").includes(searchQuery) ||
          normalizeSearchText(t?.corps ?? "").includes(searchQuery);
      }

      // Filtre Corps
      const matchesCorps =
        !faculteFilter.corps || (t?.corps ?? "") === faculteFilter.corps;

      // Filtre Titre
      const matchesTitre =
        !faculteFilter.titre ||
        normalizeText(t?.titre ?? "") === normalizeText(faculteFilter.titre);

      return matchesSearch && matchesCorps && matchesTitre;
    });
  }, [teachers, selectedUniv, activeTab, faculteFilter]);

  // ✅ Tri des enseignants FACULTE
  const sortedFaculteTeachers = useMemo(() => {
    const sorted = [...filteredFaculteTeachers];

    sorted.sort((a, b) => {
      let aValue = a[faculteSort.field] || "";
      let bValue = b[faculteSort.field] || "";

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return faculteSort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return faculteSort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredFaculteTeachers, faculteSort]);

  // ✅ Pagination RECAP
  const recapCurrentPage = useMemo(
    () =>
      Math.max(
        1,
        Math.min(
          currentPage,
          Math.ceil(sortedRecapTeachers.length / itemsPerPage)
        )
      ),
    [currentPage, sortedRecapTeachers.length, itemsPerPage]
  );
  const recapIndexStart = (recapCurrentPage - 1) * itemsPerPage;
  const recapIndexEnd = recapIndexStart + itemsPerPage;
  const paginatedRecapTeachers = sortedRecapTeachers.slice(
    recapIndexStart,
    recapIndexEnd
  );
  const recapTotalPages = Math.ceil(sortedRecapTeachers.length / itemsPerPage);

  // ✅ Pagination FACULTE
  const faculteCurrentPage = useMemo(
    () =>
      Math.max(
        1,
        Math.min(
          currentPage,
          Math.ceil(sortedFaculteTeachers.length / itemsPerPage)
        )
      ),
    [currentPage, sortedFaculteTeachers.length, itemsPerPage]
  );
  const faculteIndexStart = (faculteCurrentPage - 1) * itemsPerPage;
  const faculteIndexEnd = faculteIndexStart + itemsPerPage;
  const paginatedFaculteTeachers = sortedFaculteTeachers.slice(
    faculteIndexStart,
    faculteIndexEnd
  );
  const faculteTotalPages = Math.ceil(
    sortedFaculteTeachers.length / itemsPerPage
  );

  // ✅ Calcul des statistiques RECAP
  const recapData = useMemo(() => {
    if (!selectedUniv) return null;

    const source = Array.isArray(allTeachers) ? allTeachers : [];
    const stats = {};

    etablissements.forEach((etab) => {
      const enseignantsEtab = source.filter(
        (t) => String(t?.etablissement_id) === String(etab.id)
      );

      stats[etab.nom] = {
        AES: enseignantsEtab.filter((t) => (t?.corps ?? "") === "AES").length,
        MC: enseignantsEtab.filter((t) => (t?.corps ?? "") === "MC").length,
        PES: enseignantsEtab.filter((t) => (t?.corps ?? "") === "PES").length,
        PT: enseignantsEtab.filter((t) => (t?.corps ?? "") === "PT").length,
        total: enseignantsEtab.length,
        F: enseignantsEtab.filter((t) => (t?.sexe ?? "") === "F").length,
        M: enseignantsEtab.filter((t) => (t?.sexe ?? "") === "M").length,
      };
    });

    return stats;
  }, [selectedUniv, etablissements, allTeachers]);

  // --- ACTIONS UNIVERSITÉ ---
  const handleAddUniv = async () => {
    if (!newUniv.nom || !newUniv.code) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    try {
      const created = await universiteService.create(newUniv);
      const createdObj = created?.data ?? created;
      setUniversites((prev) => [...prev, createdObj]);
      setShowModalUniv(false);
      setNewUniv({ nom: "", province: PROVINCES[0], code: "" });
      showToast("Université ajoutée avec succès", "success");
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'université:", err);
      showToast("Erreur lors de l'ajout de l'université", "error");
    }
  };

  const handleEditUniv = (univ) => {
    setEditingUniv(univ);
    setNewUniv({ nom: univ.nom, province: univ.province, code: univ.code });
    setShowModalEditUniv(true);
  };

  const handleUpdateUniv = async () => {
    if (!newUniv.nom || !editingUniv) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    try {
      const updated = await universiteService.update(editingUniv.id, newUniv);
      const updatedObj = updated?.data ?? updated;
      setUniversites((prev) =>
        prev.map((u) => (u.id === editingUniv.id ? updatedObj : u))
      );
      setShowModalEditUniv(false);
      setEditingUniv(null);
      setNewUniv({ nom: "", province: PROVINCES[0], code: "" });
      showToast("Université modifiée avec succès", "success");
    } catch (err) {
      console.error("Erreur lors de la modification de l'université:", err);
      showToast("Erreur lors de la modification de l'université", "error");
    }
  };

  const handleDeleteUniv = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Suppression d'Université",
      message:
        "Êtes-vous certain de vouloir supprimer définitivement cette université ?\n\nCette action entraînera la suppression de :\n• Toutes les facultés associées\n• Tous les enseignants rattachés\n• Toutes les données liées\n\nCette opération est irréversible.",
      onConfirm: async () => {
        try {
          await universiteService.delete(id);
          setUniversites((prev) => prev.filter((u) => u.id !== id));
          showToast("Université supprimée avec succès", "success");
        } catch (err) {
          console.error("Erreur lors de la suppression de l'université:", err);
          showToast("Erreur lors de la suppression de l'université", "error");
        }
      },
    });
  };

  // --- ACTIONS FACULTÉ/ÉTABLISSEMENT ---
  const handleAddFaculte = async () => {
    if (!newFaculte || !selectedUniv) {
      showToast("Veuillez saisir le nom de la faculté", "error");
      return;
    }

    try {
      const created = await etablissementService.create({
        nom: newFaculte,
        universite_id: selectedUniv.id,
      });
      const createdObj = created?.data ?? created;
      setEtablissements((prev) => [...prev, createdObj]);
      setShowModalFaculte(false);
      setNewFaculte("");
      showToast("Faculté ajoutée avec succès", "success");
    } catch (err) {
      console.error("Erreur lors de l'ajout de la faculté:", err);
      showToast("Erreur lors de l'ajout de la faculté", "error");
    }
  };

  const handleEditFaculte = (fac) => {
    const etablissement = etablissements.find((e) => e?.nom === fac);
    if (!etablissement) return;

    setEditingFaculte(etablissement);
    setNewFaculte(etablissement.nom);
    setShowModalEditFaculte(true);
  };

  const handleUpdateFaculte = async () => {
    if (!newFaculte || !editingFaculte) {
      showToast("Veuillez saisir le nom de la faculté", "error");
      return;
    }

    try {
      const updated = await etablissementService.update(editingFaculte.id, {
        nom: newFaculte,
        universite_id: selectedUniv.id,
      });
      const updatedObj = updated?.data ?? updated;

      setEtablissements((prev) =>
        prev.map((e) => (e.id === editingFaculte.id ? updatedObj : e))
      );

      // Si on est sur l'onglet modifié, le mettre à jour
      if (activeTab === editingFaculte.nom) {
        setActiveTab(updatedObj.nom);
      }

      setShowModalEditFaculte(false);
      setEditingFaculte(null);
      setNewFaculte("");
      showToast("Faculté modifiée avec succès", "success");
    } catch (err) {
      console.error("Erreur lors de la modification de la faculté:", err);
      showToast("Erreur lors de la modification de la faculté", "error");
    }
  };

  const handleDeleteFaculte = (fac) => {
    const etablissement = etablissements.find((e) => e?.nom === fac);
    if (!etablissement?.id) return;

    setConfirmModal({
      isOpen: true,
      title: "Suppression de Faculté",
      message: `Êtes-vous certain de vouloir supprimer la faculté "${fac}" ?\n\nTous les enseignants de cette faculté seront également supprimés.\n\nCette action est irréversible.`,
      onConfirm: async () => {
        try {
          await etablissementService.delete(etablissement.id);
          setEtablissements((prev) =>
            prev.filter((e) => e.id !== etablissement.id)
          );
          if (activeTab === fac) setActiveTab("RECAP");
          showToast("Faculté supprimée avec succès", "success");
        } catch (err) {
          console.error("Erreur lors de la suppression de la faculté:", err);
          showToast("Erreur lors de la suppression de la faculté", "error");
        }
      },
    });
  };

  // --- ACTIONS ENSEIGNANT ---
  const handleAddTeacher = async () => {
    if (!newTeacher.nom || !newTeacher.im) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    const etablissement = etablissements.find((e) => e?.nom === activeTab);
    if (!etablissement?.id) {
      showToast("Établissement non trouvé", "error");
      return;
    }

    try {
      const teacherData = {
        nom: newTeacher.nom,
        sexe: newTeacher.sexe,
        im: newTeacher.im,
        date_naissance: convertToISODate(newTeacher.date_naissance),
        corps: newTeacher.corps,
        diplome: newTeacher.diplome,
        specialite: newTeacher.specialite,
        categorie: newTeacher.titre,
        universite_id: selectedUniv.id,
        etablissement_id: etablissement.id,
      };

      const created = await enseignantService.create(teacherData);
      const createdObj = created?.data ?? created;

      setTeachers((prev) => [
        ...prev,
        {
          ...createdObj,
          nom: createdObj?.nom ?? teacherData.nom ?? "",
          im: createdObj?.im ?? teacherData.im ?? "",
          sexe: normalizeText(createdObj?.sexe ?? teacherData.sexe),
          corps: normalizeText(createdObj?.corps ?? teacherData.corps),
          titre: normalizeText(createdObj?.categorie ?? teacherData.categorie),
          diplome: createdObj?.diplome ?? teacherData.diplome ?? "",
          specialite: createdObj?.specialite ?? teacherData.specialite ?? "",
          date_naissance:
            createdObj?.date_naissance ?? teacherData.date_naissance ?? "",
          etablissement_id: createdObj?.etablissement_id ?? etablissement.id,
        },
      ]);

      setShowModalTeacher(false);
      setNewTeacher({
        nom: "",
        sexe: "M",
        im: "",
        date_naissance: "",
        corps: "AES",
        diplome: "",
        specialite: "",
        titre: TITRES[0],
      });

      showToast("Enseignant ajouté avec succès", "success");
    } catch (err) {
      console.error("❌ ERREUR COMPLÈTE:", err);

      if (err.response) {
        console.error("❌ Status:", err.response.status);
        console.error("❌ Réponse backend:", err.response.data);

        if (err.response.data?.errors) {
          console.error("❌ Erreurs de validation:", err.response.data.errors);

          const errorMessages = Object.entries(err.response.data.errors)
            .map(
              ([field, messages]) =>
                `• ${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("\n");

          showToast(`Erreurs de validation:\n${errorMessages}`, "error");
          return;
        }

        if (err.response.data?.message) {
          showToast(err.response.data.message, "error");
          return;
        }
      }

      showToast("Erreur lors de l'ajout de l'enseignant", "error");
    }
  };

  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowModalViewTeacher(true);
  };

  const handleEditTeacherOpen = (teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacher({
      ...teacher,
      date_naissance: convertFromISODate(teacher?.date_naissance),
    });
    setShowModalEditTeacher(true);
  };

  const handleUpdateTeacher = async () => {
    if (!editTeacher?.nom || !editTeacher?.im) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    try {
      const teacherData = {
        ...editTeacher,
        date_naissance: convertToISODate(editTeacher.date_naissance),
      };

      const updated = await enseignantService.update(
        selectedTeacher.id,
        teacherData
      );
      const updatedObj = updated?.data ?? updated;

      setTeachers((prev) =>
        prev.map((t) =>
          t.id === selectedTeacher.id
            ? {
                ...t,
                ...updatedObj,
                nom: updatedObj?.nom ?? teacherData.nom ?? "",
                im: updatedObj?.im ?? teacherData.im ?? "",
                diplome: updatedObj?.diplome ?? teacherData.diplome ?? "",
                specialite:
                  updatedObj?.specialite ?? teacherData.specialite ?? "",
                titre: normalizeText(
                  updatedObj?.categorie ?? teacherData.titre
                ),
                corps: normalizeText(updatedObj?.corps ?? teacherData.corps),
                sexe: normalizeText(updatedObj?.sexe ?? teacherData.sexe),
                date_naissance:
                  updatedObj?.date_naissance ??
                  teacherData.date_naissance ??
                  "",
              }
            : t
        )
      );

      setShowModalEditTeacher(false);
      setSelectedTeacher(null);
      setEditTeacher(null);
      showToast("Enseignant modifié avec succès", "success");
    } catch (err) {
      console.error("Erreur lors de la modification de l'enseignant:", err);
      showToast("Erreur lors de la modification de l'enseignant", "error");
    }
  };

  const handleDeleteTeacher = (teacher) => {
    setConfirmModal({
      isOpen: true,
      title: "Suppression d'Enseignant",
      message: `Êtes-vous certain de vouloir supprimer l'enseignant :\n\n${
        teacher?.nom ?? ""
      }\nIM: ${
        teacher?.im ?? ""
      }\n\nCette action est irréversible et entraînera la perte définitive de toutes les données associées à cet enseignant.`,
      onConfirm: async () => {
        try {
          await enseignantService.delete(teacher.id);
          setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
          showToast("Enseignant supprimé avec succès", "success");
        } catch (err) {
          console.error("Erreur lors de la suppression de l'enseignant:", err);
          showToast("Erreur lors de la suppression de l'enseignant", "error");
        }
      },
    });
  };

  // ✅ Groupe les enseignants par titre
  const groupTeachersByTitre = (teacherList) => {
    const groups = {};

    teacherList.forEach((teacher) => {
      const titre = teacher?.titre || "Sans titre";
      if (!groups[titre]) {
        groups[titre] = [];
      }
      groups[titre].push(teacher);
    });

    return groups;
  };

  // ✅ Fonction pour trier les colonnes RECAP
  const handleSortRecap = (field) => {
    setRecapSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // ✅ Fonction pour trier les colonnes FACULTE
  const handleSortFaculte = (field) => {
    setFaculteSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // ✅ Reset page quand filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, itemsPerPage, recapFilter, faculteFilter, searchTeacher]);

  const currentFacultes = useMemo(
    () => etablissements.map((e) => e.nom),
    [etablissements]
  );

  // ✅ Grouper les enseignants par titre pour FACULTE
  const groupedFaculteTeachers = useMemo(() => {
    return groupTeachersByTitre(paginatedFaculteTeachers);
  }, [paginatedFaculteTeachers]);

  // ✅ Grouper les enseignants par titre pour RECAP
  const groupedRecapTeachers = useMemo(() => {
    return groupTeachersByTitre(paginatedRecapTeachers);
  }, [paginatedRecapTeachers]);

  // ✅ Affichage du loader initial
  if (loading && viewState === "selection" && universites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // ✅ Affichage erreur
  if (error && viewState === "selection" && universites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // --- RENDU VUE SÉLECTION ---
  if (viewState === "selection") {
    return (
      <div className="space-y-6 p-2">
        {/* TOAST NOTIFICATION */}
        <div className="fixed top-5 right-5 z-[60]">
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ ...toast, show: false })}
            />
          )}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Gestion des Universités
            </h1>
            <p className="text-gray-500 text-sm">
              Sélectionnez un établissement pour accéder à son personnel.
            </p>
          </div>
          <button
            onClick={() => setShowModalUniv(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium transition-all"
          >
            <Plus size={20} /> Nouvelle Université
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universites.map((univ) => (
            <div
              key={univ.id}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-400 transition-all duration-200 relative"
            >
              <div className="absolute top-3 right-3 z-10">
                <DropdownMenu
                  trigger={<MoreVertical size={18} className="text-gray-400" />}
                >
                  <MenuItem
                    icon={<Edit size={16} />}
                    label="Modifier"
                    onClick={() => handleEditUniv(univ)}
                  />
                  <MenuItem
                    icon={<Trash2 size={16} />}
                    label="Supprimer"
                    onClick={() => handleDeleteUniv(univ.id)}
                    danger
                  />
                </DropdownMenu>
              </div>

              <div
                onClick={() => {
                  setSelectedUniv(univ);
                  setViewState("dashboard_univ");
                  setActiveTab("RECAP");
                }}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4 pr-8">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <School size={32} />
                  </div>
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 flex-1 pr-2">
                    {univ.nom}
                  </h3>
                  <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded shrink-0">
                    {univ.code}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin size={16} /> {univ.province}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL AJOUT UNIVERSITÉ */}
        <Modal
          isOpen={showModalUniv}
          onClose={() => setShowModalUniv(false)}
          title="Ajouter une Université"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom de l&apos;Université <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <School className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={newUniv.nom}
                  onChange={(e) =>
                    setNewUniv({ ...newUniv, nom: e.target.value })
                  }
                  placeholder="Ex: Université de Mahajanga"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                    value={newUniv.province}
                    onChange={(e) =>
                      setNewUniv({ ...newUniv, province: e.target.value })
                    }
                    required
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={newUniv.code}
                    onChange={(e) =>
                      setNewUniv({
                        ...newUniv,
                        code: e.target.value,
                      })
                    }
                    placeholder="Ex: UM"
                    maxLength={5}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowModalUniv(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddUniv}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL MODIFIER UNIVERSITÉ */}
        <Modal
          isOpen={showModalEditUniv}
          onClose={() => setShowModalEditUniv(false)}
          title="Modifier l'Université"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom de l&apos;Université <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <School className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={newUniv.nom}
                  onChange={(e) =>
                    setNewUniv({ ...newUniv, nom: e.target.value })
                  }
                  placeholder="Ex: Université de Mahajanga"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                    value={newUniv.province}
                    onChange={(e) =>
                      setNewUniv({ ...newUniv, province: e.target.value })
                    }
                    required
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={newUniv.code}
                    onChange={(e) =>
                      setNewUniv({
                        ...newUniv,
                        code: e.target.value,
                      })
                    }
                    placeholder="Ex: UM"
                    maxLength={5}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowModalEditUniv(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateUniv}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL DE CONFIRMATION */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() =>
            setConfirmModal({
              isOpen: false,
              title: "",
              message: "",
              onConfirm: null,
            })
          }
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type="danger"
        />
      </div>
    );
  }

  // --- RENDU VUE DASHBOARD ---
  return (
    <div className="flex flex-col h-full">
      {/* TOAST NOTIFICATION */}
      <div className="fixed top-5 right-5 z-[60]">
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>

      {/* Header Professionnel */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setViewState("selection")}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex-1">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-bold text-gray-800 uppercase">
                LISTE DES ENSEIGNANTS CHERCHEURS PERMANENTS
              </h2>
              <p className="text-xs text-gray-700">
                <span className="font-semibold">UNIVERSITE:</span>{" "}
                {selectedUniv.nom.toUpperCase()}
              </p>
              {activeTab !== "RECAP" && (
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">ETABLISSEMENT:</span>{" "}
                  {activeTab}
                </p>
              )}
              <p className="text-xs text-gray-700">
                <span className="font-semibold">ANNEE:</span> 2025
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModalFaculte(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={18} /> Ajouter Faculté
          </button>
        </div>

        {/* Onglets avec FLEX WRAP */}
        <div className="flex items-center gap-1 flex-wrap pb-1 border-t pt-3">
          <button
            onClick={() => {
              setActiveTab("RECAP");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "RECAP"
                ? "bg-gray-800 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <PieChart size={16} />
            VUE D&apos;ENSEMBLE
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {currentFacultes.map((fac) => (
            <div key={fac} className="relative group">
              <button
                onClick={() => {
                  setActiveTab(fac);
                  setCurrentPage(1);
                  setSearchTeacher("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === fac
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-blue-50"
                }`}
              >
                {fac}
              </button>

              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditFaculte(fac);
                  }}
                  className="bg-orange-500 text-white rounded-full p-0.5"
                  title="Modifier faculté"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => handleDeleteFaculte(fac)}
                  className="bg-red-500 text-white rounded-full p-0.5"
                  title="Supprimer faculté"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        {/* VUE RECAP */}
        {activeTab === "RECAP" && (
          <div className="space-y-8">
            {/* 1. Tableau Récapitulatif - Version compacte */}
            <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 text-center bg-blue-50 border-b">
                <div className="text-sm font-bold text-blue-800">
                  TABLEAU RÉCAPITULATIF DES ENSEIGNANTS PAR FACULTÉ
                </div>
                <div className="mt-1 text-xs font-semibold text-gray-700">
                  {selectedUniv.nom.toUpperCase()}
                </div>
                <div className="mt-1 text-xs text-gray-600">ANNÉE 2025</div>
              </div>

              {/* Tableau Récapitulatif compact */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 bg-gray-200 px-2 py-1.5 text-left align-middle font-bold text-gray-800 min-w-[150px]"
                      >
                        FACULTÉS / ÉTABLISSEMENTS
                      </th>
                      <th
                        colSpan={4}
                        className="border border-gray-400 bg-gray-200 px-2 py-1.5 text-center font-bold text-gray-800"
                      >
                        CORPS D&apos;ENSEIGNANTS
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 bg-gray-200 px-2 py-1.5 text-center font-bold text-gray-800"
                      >
                        TOTAL
                      </th>
                      <th
                        colSpan={2}
                        className="border border-gray-400 bg-gray-200 px-2 py-1.5 text-center font-bold text-gray-800"
                      >
                        GENRE
                      </th>
                    </tr>
                    <tr>
                      <th className="border border-gray-400 bg-gray-200 px-1 py-0.5 text-center font-semibold text-gray-700">
                        AES
                      </th>
                      <th className="border border-gray-400 bg-gray-200 px-1 py-0.5 text-center font-semibold text-gray-700">
                        MC
                      </th>
                      <th className="border border-gray-400 bg-gray-200 px-1 py-0.5 text-center font-semibold text-gray-700">
                        PES
                      </th>
                      <th className="border border-gray-400 bg-gray-200 px-1 py-0.5 text-center font-semibold text-gray-700">
                        PT
                      </th>
                      <th className="border border-gray-400 bg-gray-200 px-1 py-0.5 text-center font-semibold text-gray-700">
                        Fem.
                      </th>
                      <th className="border border-gray-400 bg-gray-200 px-1 py-0.5 text-center font-semibold text-gray-700">
                        Masc.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(recapData || {}).map((fac) => {
                      const d = recapData[fac];
                      return (
                        <tr key={fac} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-800">
                            {fac}
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-gray-700">
                            {d.AES}
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-gray-700">
                            {d.MC}
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-gray-700">
                            {d.PES}
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-gray-700">
                            {d.PT}
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center font-semibold text-gray-800">
                            {d.total}
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-gray-700">
                            {d.F}
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-gray-700">
                            {d.M}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Ligne TOTAL */}
                    <tr className="font-bold bg-blue-50">
                      <td className="border border-gray-300 px-2 py-1.5 text-left text-blue-800">
                        TOTAL GÉNÉRAL
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-blue-800">
                        {Object.values(recapData || {}).reduce(
                          (sum, d) => sum + d.AES,
                          0
                        )}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-blue-800">
                        {Object.values(recapData || {}).reduce(
                          (sum, d) => sum + d.MC,
                          0
                        )}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-blue-800">
                        {Object.values(recapData || {}).reduce(
                          (sum, d) => sum + d.PES,
                          0
                        )}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-blue-800">
                        {Object.values(recapData || {}).reduce(
                          (sum, d) => sum + d.PT,
                          0
                        )}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-blue-800">
                        {Object.values(recapData || {}).reduce(
                          (sum, d) => sum + d.total,
                          0
                        )}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-blue-800">
                        {Object.values(recapData || {}).reduce(
                          (sum, d) => sum + d.F,
                          0
                        )}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-blue-800">
                        {Object.values(recapData || {}).reduce(
                          (sum, d) => sum + d.M,
                          0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Liste détaillée des enseignants - Tableau RECAP */}
            <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-blue-50 border-b">
                <h3 className="text-sm font-bold text-blue-800 uppercase">
                  LISTE DÉTAILLÉE DE TOUS LES ENSEIGNANTS
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Filtrez et triez la liste complète des enseignants de
                  l&apos;université
                </p>
              </div>

              {/* Barre de filtres */}
              <div className="p-4 border-b bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Recherche par nom/IM
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Nom, IM, diplôme, spécialité..."
                        value={recapFilter.search}
                        onChange={(e) =>
                          setRecapFilter((prev) => ({
                            ...prev,
                            search: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Faculté
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      value={recapFilter.faculte}
                      onChange={(e) =>
                        setRecapFilter((prev) => ({
                          ...prev,
                          faculte: e.target.value,
                        }))
                      }
                    >
                      <option value="">Toutes les facultés</option>
                      {currentFacultes.map((fac) => (
                        <option key={fac} value={fac}>
                          {fac}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Corps
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      value={recapFilter.corps}
                      onChange={(e) =>
                        setRecapFilter((prev) => ({
                          ...prev,
                          corps: e.target.value,
                        }))
                      }
                    >
                      <option value="">Tous les corps</option>
                      <option value="AES">AES</option>
                      <option value="MC">MC</option>
                      <option value="PE">PE</option>
                      <option value="PES">PES</option>
                      <option value="PT">PT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      value={recapFilter.titre}
                      onChange={(e) =>
                        setRecapFilter((prev) => ({
                          ...prev,
                          titre: e.target.value,
                        }))
                      }
                    >
                      <option value="">Tous les titres</option>
                      <option value="ASSITANT D'ENSEIGNEMENT SUPERIEUR">
                        ASSITANT D'ENSEIGNEMENT SUPERIEUR
                      </option>
                      <option value="MAÎTRE DE CONFÉRENCES D'ENSEIGNEMENT SUPERIEUR">
                        MAÎTRE DE CONFÉRENCES D'ENSEIGNEMENT SUPERIEUR
                      </option>
                      <option value="PROFESSEUR D'ENSEIGNEMENT SUPERIEUR">
                        PROFESSEUR D'ENSEIGNEMENT SUPERIEUR
                      </option>
                      <option value="PROFESSEUR EMMERITE">
                        PROFESSEUR EMMERITE
                      </option>
                      <option value="PROFESSEUR TITULAIRE">
                        PROFESSEUR TITULAIRE
                      </option>
                    </select>
                  </div>
                </div>

                {/* Bouton reset filtres */}
                {(recapFilter.search ||
                  recapFilter.faculte ||
                  recapFilter.corps ||
                  recapFilter.titre) && (
                  <div>
                    <button
                      onClick={() =>
                        setRecapFilter({
                          search: "",
                          faculte: "",
                          corps: "",
                          titre: "",
                        })
                      }
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <X size={14} /> Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* Tableau des enseignants RECAP */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <th className="px-3 py-2.5 border-r border-gray-200 w-12 text-center font-medium text-[10px] uppercase tracking-wide">
                        N°
                      </th>
                      <th
                        className="px-3 py-2.5 border-r border-gray-200 text-center font-medium text-[10px] uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSortRecap("nom")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Nom
                          {recapSort.field === "nom" && (
                            <span className="text-xs">
                              {recapSort.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2.5 border-r border-gray-200 w-16 text-center font-medium text-[10px] uppercase tracking-wide">
                        Sexe
                      </th>
                      <th className="px-3 py-2.5 border-r border-gray-200 w-24 text-center font-medium text-[10px] uppercase tracking-wide">
                        IM
                      </th>
                      <th className="px-3 py-2.5 border-r border-gray-200 w-20 text-center font-medium text-[10px] uppercase tracking-wide">
                        Corps
                      </th>
                      <th className="px-3 py-2.5 border-r border-gray-200 text-center font-medium text-[10px] uppercase tracking-wide">
                        Faculté
                      </th>
                      <th className="px-3 py-2.5 border-r border-gray-200 text-center font-medium text-[10px] uppercase tracking-wide">
                        Titre
                      </th>
                      <th className="px-3 py-2.5 border-r border-gray-200 w-32 text-center font-medium text-[10px] uppercase tracking-wide">
                        Diplômes
                      </th>
                      <th className="px-3 py-2.5 border-r border-gray-200 w-40 text-center font-medium text-[10px] uppercase tracking-wide">
                        Spécialités
                      </th>
                      <th className="px-3 py-2.5 text-center w-28 font-medium text-[10px] uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center">
                          <Loader2
                            className="animate-spin text-blue-600 mx-auto"
                            size={24}
                          />
                          <p className="text-sm text-gray-500 mt-2">
                            Chargement des données...
                          </p>
                        </td>
                      </tr>
                    ) : Object.keys(groupedRecapTeachers).length > 0 ? (
                      Object.keys(groupedRecapTeachers).map((titre) => {
                        const teachersInTitre = groupedRecapTeachers[titre];

                        if (teachersInTitre.length === 0) return null;

                        return (
                          <React.Fragment key={titre}>
                            {/* En-tête de titre */}
                            <tr className="bg-blue-600">
                              <td
                                colSpan={10}
                                className="px-4 py-2 text-[11px] font-bold text-white uppercase text-center tracking-wide"
                              >
                                {titre}
                              </td>
                            </tr>

                            {/* Liste des enseignants */}
                            {teachersInTitre.map((t, idx) => (
                              <tr
                                key={t.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-3 py-3 text-center border-r border-gray-100 text-[13px] text-gray-700">
                                  {recapIndexStart + idx + 1}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 font-medium text-[13px] text-gray-800">
                                  {t.nom}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 text-[13px] text-gray-700">
                                  {t.sexe}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 font-mono text-[12px] text-gray-600">
                                  {t.im}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 font-semibold text-[13px] text-gray-800">
                                  {t.corps}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 text-[13px] text-gray-700">
                                  {t.faculte_nom}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 font-semibold text-[13px] text-blue-700">
                                  {t.titre}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 text-[12px] text-gray-600">
                                  {t.diplome}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-100 text-[12px] text-gray-600">
                                  {t.specialite}
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleViewTeacher(t)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Afficher"
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button
                                      onClick={() => handleEditTeacherOpen(t)}
                                      className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors"
                                      title="Modifier"
                                    >
                                      <Edit size={15} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTeacher(t)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-8 text-center text-gray-500 text-sm"
                        >
                          Aucun enseignant trouvé avec les filtres sélectionnés.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination RECAP */}
                {sortedRecapTeachers.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <div className="flex items-center gap-2 text-xs">
                      <span>Éléments par page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 border rounded-md text-xs bg-white"
                      >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={150}>150</option>
                        <option value={200}>200</option>
                      </select>
                      <span className="text-gray-500">
                        {recapIndexStart + 1}-
                        {Math.min(recapIndexEnd, sortedRecapTeachers.length)}{" "}
                        sur {sortedRecapTeachers.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={recapCurrentPage === 1}
                        className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from(
                        { length: Math.min(5, recapTotalPages) },
                        (_, i) => {
                          let pageNum;
                          if (recapTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (recapCurrentPage <= 3) {
                            pageNum = i + 1;
                          } else if (recapCurrentPage >= recapTotalPages - 2) {
                            pageNum = recapTotalPages - 4 + i;
                          } else {
                            pageNum = recapCurrentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 text-sm border rounded-md ${
                                recapCurrentPage === pageNum
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(recapTotalPages, p + 1)
                          )
                        }
                        disabled={recapCurrentPage === recapTotalPages}
                        className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VUE LISTE ENSEIGNANTS PAR FACULTÉ */}
        {activeTab !== "RECAP" && (
          <div className="space-y-4">
            {/* Barre de recherche et bouton d'ajout */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Recherche par nom/IM
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Nom, IM, diplôme, spécialité..."
                      value={faculteFilter.search}
                      onChange={(e) =>
                        setFaculteFilter((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Corps
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    value={faculteFilter.corps}
                    onChange={(e) =>
                      setFaculteFilter((prev) => ({
                        ...prev,
                        corps: e.target.value,
                      }))
                    }
                  >
                    <option value="">Tous les corps</option>
                    <option value="AES">AES</option>
                    <option value="MC">MC</option>
                    <option value="PE">PE</option>
                    <option value="PES">PES</option>
                    <option value="PT">PT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    value={faculteFilter.titre}
                    onChange={(e) =>
                      setFaculteFilter((prev) => ({
                        ...prev,
                        titre: e.target.value,
                      }))
                    }
                  >
                    <option value="">Tous les titres</option>
                    <option value="ASSITANT D'ENSEIGNEMENT SUPERIEUR">
                      ASSITANT D'ENSEIGNEMENT SUPERIEUR
                    </option>
                    <option value="MAÎTRE DE CONFÉRENCES D'ENSEIGNEMENT SUPERIEUR">
                      MAÎTRE DE CONFÉRENCES D'ENSEIGNEMENT SUPERIEUR
                    </option>
                    <option value="PROFESSEUR D'ENSEIGNEMENT SUPERIEUR">
                      PROFESSEUR D'ENSEIGNEMENT SUPERIEUR
                    </option>
                    <option value="PROFESSEUR EMMERITE">
                      PROFESSEUR EMMERITE
                    </option>
                    <option value="PROFESSEUR TITULAIRE">
                      PROFESSEUR TITULAIRE
                    </option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setShowModalTeacher(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors w-full justify-center"
                  >
                    <Plus size={18} /> Ajouter Enseignant
                  </button>
                </div>
              </div>

              {/* Bouton reset filtres */}
              {(faculteFilter.search ||
                faculteFilter.corps ||
                faculteFilter.titre) && (
                <div>
                  <button
                    onClick={() =>
                      setFaculteFilter({
                        search: "",
                        corps: "",
                        titre: "",
                      })
                    }
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <X size={14} /> Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>

            {/* Tableau des enseignants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <th className="px-3 py-2.5 border-r border-gray-200 w-12 text-center font-medium text-[10px] uppercase tracking-wide">
                          N°
                        </th>
                        <th
                          className="px-3 py-2.5 border-r border-gray-200 text-center font-medium text-[10px] uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortFaculte("nom")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Nom
                            {faculteSort.field === "nom" && (
                              <span className="text-xs">
                                {faculteSort.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-2.5 border-r border-gray-200 w-16 text-center font-medium text-[10px] uppercase tracking-wide">
                          Sexe
                        </th>
                        <th className="px-3 py-2.5 border-r border-gray-200 w-24 text-center font-medium text-[10px] uppercase tracking-wide">
                          IM
                        </th>
                        <th className="px-3 py-2.5 border-r border-gray-200 w-20 text-center font-medium text-[10px] uppercase tracking-wide">
                          Corps
                        </th>
                        <th className="px-3 py-2.5 border-r border-gray-200 w-32 text-center font-medium text-[10px] uppercase tracking-wide">
                          Titre
                        </th>
                        <th className="px-3 py-2.5 border-r border-gray-200 w-32 text-center font-medium text-[10px] uppercase tracking-wide">
                          Diplômes
                        </th>
                        <th className="px-3 py-2.5 border-r border-gray-200 text-center font-medium text-[10px] uppercase tracking-wide">
                          Spécialités
                        </th>
                        <th className="px-3 py-2.5 text-center w-28 font-medium text-[10px] uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.keys(groupedFaculteTeachers).length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-8 text-center text-gray-500 text-sm"
                          >
                            {faculteFilter.search ||
                            faculteFilter.corps ||
                            faculteFilter.titre
                              ? "Aucun enseignant trouvé avec les filtres sélectionnés."
                              : "Aucun enseignant dans cette faculté."}
                          </td>
                        </tr>
                      ) : (
                        Object.keys(groupedFaculteTeachers).map((titre) => {
                          const teachersInTitre = groupedFaculteTeachers[titre];

                          return (
                            <React.Fragment key={titre}>
                              {/* En-tête de titre */}
                              <tr className="bg-blue-600">
                                <td
                                  colSpan={9}
                                  className="px-4 py-2 text-[11px] font-bold text-white uppercase text-center tracking-wide"
                                >
                                  {titre}
                                </td>
                              </tr>

                              {/* Liste des enseignants */}
                              {teachersInTitre.map((t, idx) => (
                                <tr
                                  key={t.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-3 py-3 text-center border-r border-gray-100 text-[13px] text-gray-700">
                                    {faculteIndexStart + idx + 1}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-gray-100 font-medium text-[13px] text-gray-800">
                                    {t.nom}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-gray-100 text-[13px] text-gray-700">
                                    {t.sexe}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-gray-100 font-mono text-[12px] text-gray-600">
                                    {t.im}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-gray-100 font-semibold text-[13px] text-gray-800">
                                    {t.corps}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-gray-100 font-semibold text-[13px] text-blue-700">
                                    {t.titre}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-gray-100 text-[12px] text-gray-600">
                                    {t.diplome}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-gray-100 text-[13px] text-gray-700">
                                    {t.specialite}
                                  </td>
                                  <td className="px-2 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleViewTeacher(t)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Afficher"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      <button
                                        onClick={() => handleEditTeacherOpen(t)}
                                        className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors"
                                        title="Modifier"
                                      >
                                        <Edit size={15} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTeacher(t)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        title="Supprimer"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINATION */}
              {sortedFaculteTeachers.length > 0 && (
                <div className="flex items-center justify-between px-2 py-2 border-t bg-gray-50">
                  <div className="flex items-center gap-2 text-xs">
                    <span>Éléments par page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border rounded-md text-xs bg-white"
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={150}>150</option>
                      <option value={200}>200</option>
                    </select>
                    <span className="text-gray-500">
                      {faculteIndexStart + 1}-
                      {Math.min(faculteIndexEnd, sortedFaculteTeachers.length)}{" "}
                      sur {sortedFaculteTeachers.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={faculteCurrentPage === 1}
                      className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {(() => {
                      const pages = [];
                      const maxVisible = 5;

                      if (faculteTotalPages <= maxVisible + 2) {
                        for (let i = 1; i <= faculteTotalPages; i++)
                          pages.push(i);
                      } else {
                        pages.push(1);

                        let startPage = Math.max(2, faculteCurrentPage - 2);
                        let endPage = Math.min(
                          faculteTotalPages - 1,
                          faculteCurrentPage + 2
                        );

                        if (faculteCurrentPage <= 3) endPage = maxVisible;
                        if (faculteCurrentPage >= faculteTotalPages - 2)
                          startPage = faculteTotalPages - maxVisible + 1;

                        if (startPage > 2) pages.push("...");

                        for (let i = startPage; i <= endPage; i++)
                          pages.push(i);

                        if (endPage < faculteTotalPages - 1) pages.push("...");

                        pages.push(faculteTotalPages);
                      }

                      return pages.map((page, idx) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-xs text-gray-500"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              faculteCurrentPage === page
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      );
                    })()}

                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(faculteTotalPages, p + 1)
                        )
                      }
                      disabled={
                        faculteCurrentPage === faculteTotalPages ||
                        faculteTotalPages === 0
                      }
                      className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL AJOUTER FACULTÉ */}
      <Modal
        isOpen={showModalFaculte}
        onClose={() => setShowModalFaculte(false)}
        title="Ajouter une Faculté"
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la Faculté / Établissement{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                value={newFaculte}
                onChange={(e) => setNewFaculte(e.target.value)}
                placeholder="Ex: Droit, Médecine..."
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowModalFaculte(false)}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddFaculte}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all shadow-md"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL MODIFIER FACULTÉ */}
      <Modal
        isOpen={showModalEditFaculte}
        onClose={() => {
          setShowModalEditFaculte(false);
          setEditingFaculte(null);
          setNewFaculte("");
        }}
        title="Modifier la Faculté"
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la Faculté / Établissement{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                value={newFaculte}
                onChange={(e) => setNewFaculte(e.target.value)}
                placeholder="Ex: Droit, Médecine..."
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowModalEditFaculte(false);
                setEditingFaculte(null);
                setNewFaculte("");
              }}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleUpdateFaculte}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-md"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL AJOUTER ENSEIGNANT */}
      <Modal
        isOpen={showModalTeacher}
        onClose={() => {
          setShowModalTeacher(false);
          setNewTeacher({
            nom: "",
            sexe: "M",
            im: "",
            date_naissance: "",
            corps: "AES",
            diplome: "",
            specialite: "",
            titre: TITRES[0],
          });
        }}
        title={`Ajouter un Enseignant - ${activeTab}`}
        size="lg"
      >
        <div className="space-y-3">
          {/* Identité */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-1">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Identité &amp; État Civil
            </h4>
            <span className="text-[10px] text-gray-400">* obligatoire</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTeacher.nom}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      nom: e.target.value,
                    })
                  }
                  placeholder="Nom Prénom"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                IM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTeacher.im}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      im: handleIMChange(e.target.value),
                    })
                  }
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  value={newTeacher.sexe}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, sexe: e.target.value })
                  }
                >
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Naissance
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={newTeacher.date_naissance}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      date_naissance: handleDateChange(e.target.value),
                    })
                  }
                  placeholder="JJ/MM/AAAA"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Carrière */}
          <div className="pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Carrière &amp; Diplômes
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Corps <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  value={newTeacher.corps}
                  onChange={(e) => {
                    const selectedCorps = e.target.value;
                    setNewTeacher({
                      ...newTeacher,
                      corps: selectedCorps,
                      titre: CORPS_TO_TITRE[selectedCorps] || TITRES[0],
                    });
                  }}
                  required
                >
                  {CORPS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  value={newTeacher.titre}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, titre: e.target.value })
                  }
                  required
                >
                  {TITRES.map((titre) => (
                    <option key={titre} value={titre}>
                      {titre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Diplôme
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={newTeacher.diplome}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, diplome: e.target.value })
                    }
                    placeholder="Ex: Doctorat"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Spécialité
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={newTeacher.specialite}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        specialite: e.target.value,
                      })
                    }
                    placeholder="Ex: Intelligence Artificielle"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 mt-2 border-t border-gray-100">
            <button
              onClick={() => setShowModalTeacher(false)}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddTeacher}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL VOIR DÉTAILS ENSEIGNANT */}
      <Modal
        isOpen={showModalViewTeacher}
        onClose={() => {
          setShowModalViewTeacher(false);
          setSelectedTeacher(null);
        }}
        title="Détails de l'Enseignant"
        size="md"
      >
        {selectedTeacher && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nom complet
                </label>
                <p className="text-gray-800 font-semibold">
                  {selectedTeacher?.nom ?? "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Sexe
                </label>
                <p className="text-gray-800 font-semibold">
                  {selectedTeacher?.sexe === "F" ? "Femme" : "Homme"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  IM
                </label>
                <p className="text-gray-800 font-semibold">
                  {selectedTeacher?.im ?? "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Date de naissance
                </label>
                <p className="text-gray-800 font-semibold">
                  {convertFromISODate(selectedTeacher?.date_naissance) || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Corps
                </label>
                <p className="text-gray-800 font-semibold">
                  {selectedTeacher?.corps ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Titre
                </label>
                <p className="text-gray-800 font-semibold">
                  {selectedTeacher?.titre ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Diplôme
                </label>
                <p className="text-gray-800">
                  {selectedTeacher?.diplome || "Non renseigné"}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Spécialité
                </label>
                <p className="text-gray-800">
                  {selectedTeacher?.specialite || "Non renseigné"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModalViewTeacher(false);
                  setSelectedTeacher(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL MODIFIER ENSEIGNANT */}
      <Modal
        isOpen={showModalEditTeacher}
        onClose={() => {
          setShowModalEditTeacher(false);
          setSelectedTeacher(null);
          setEditTeacher(null);
        }}
        title="Modifier l'Enseignant"
        size="lg"
      >
        <div className="space-y-3">
          {/* Identité */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-1">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Identité &amp; État Civil
            </h4>
            <span className="text-[10px] text-gray-400">* obligatoire</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={editTeacher?.nom || ""}
                  onChange={(e) =>
                    setEditTeacher({
                      ...editTeacher,
                      nom: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                IM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={editTeacher?.im || ""}
                  onChange={(e) =>
                    setEditTeacher({
                      ...editTeacher,
                      im: handleIMChange(e.target.value),
                    })
                  }
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  value={editTeacher?.sexe || "M"}
                  onChange={(e) =>
                    setEditTeacher({ ...editTeacher, sexe: e.target.value })
                  }
                >
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Naissance
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={editTeacher?.date_naissance || ""}
                  onChange={(e) =>
                    setEditTeacher({
                      ...editTeacher,
                      date_naissance: handleDateChange(e.target.value),
                    })
                  }
                  placeholder="JJ/MM/AAAA"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Carrière */}
          <div className="pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Carrière &amp; Diplômes
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Corps <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  value={editTeacher?.corps || "AES"}
                  onChange={(e) => {
                    const selectedCorps = e.target.value;
                    setEditTeacher({
                      ...editTeacher,
                      corps: selectedCorps,
                      titre: CORPS_TO_TITRE[selectedCorps] || TITRES[0],
                    });
                  }}
                  required
                >
                  {CORPS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  value={editTeacher?.titre || TITRES[0]}
                  onChange={(e) =>
                    setEditTeacher({
                      ...editTeacher,
                      titre: e.target.value,
                    })
                  }
                  required
                >
                  {TITRES.map((titre) => (
                    <option key={titre} value={titre}>
                      {titre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Diplôme
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={editTeacher?.diplome || ""}
                    onChange={(e) =>
                      setEditTeacher({
                        ...editTeacher,
                        diplome: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Spécialité
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="pl-9 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={editTeacher?.specialite || ""}
                    onChange={(e) =>
                      setEditTeacher({
                        ...editTeacher,
                        specialite: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 mt-2 border-t border-gray-100">
            <button
              onClick={() => {
                setShowModalEditTeacher(false);
                setSelectedTeacher(null);
                setEditTeacher(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleUpdateTeacher}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-sm"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL CONFIRMATION */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: null,
          })
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />
    </div>
  );
};

export default EnseignantsView;
