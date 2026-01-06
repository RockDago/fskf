import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  School,
  User,
  BookOpen,
  GraduationCap,
  Building2,
  ArrowLeft,
  Filter,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ Import des services API
import enseignantService from "../services/enseignantService";
import universiteService from "../services/universiteService";
import etablissementService from "../services/etablissementService";

// Import des images
import LogoFosika from "../assets/images/logo fosika.png";
import LogoRep from "../assets/images/logo rep.png";
import LogoMesupres from "../assets/images/logo mesupres.png";

const GRADES = [
  "PROFESSEUR TITULAIRE",
  "PROFESSEUR D'ENSEIGNEMENT SUPERIEUR",
  "MAÎTRE DE CONFÉRENCES D'ENSEIGNEMENT SUPERIEUR",
  "ASSITANT D'ENSEIGNEMENT SUPERIEUR",
];

const DIPLOMES = [
  "Docteur d'État",
  "HDR",
  "Doctorat",
  "Agrégation",
  "Master",
  "DEA",
  "Ingéniorat",
  "DOCTEUR D'ETAT",
];

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

const PublicEnseignantsView = () => {
  const navigate = useNavigate();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ✅ États pour les données API
  const [universites, setUniversites] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]); // ✅ Pour le filtrage côté client
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États des filtres
  const [selectedUniv, setSelectedUniv] = useState("Tous");
  const [selectedEtablissement, setSelectedEtablissement] = useState("Tous");
  const [selectedGrade, setSelectedGrade] = useState("Tous");
  const [selectedDiplome, setSelectedDiplome] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // ✅ Charger les universités au montage uniquement
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
      } finally {
        setLoading(false);
      }
    };

    fetchUniversites();
  }, []);

  // ✅ Charger les établissements quand l'université change
  useEffect(() => {
    const fetchEtablissements = async () => {
      if (universites.length === 0) return;

      try {
        let data;
        if (selectedUniv === "Tous") {
          data = await etablissementService.getAll();
        } else {
          const universite = universites.find((u) => u.nom === selectedUniv);
          if (universite) {
            data = await etablissementService.getAll(universite.id);
          } else {
            data = [];
          }
        }
        const list = extractArrayFromResponse(data);
        setEtablissements(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Erreur lors du chargement des établissements:", err);
        setEtablissements([]);
      }
    };

    fetchEtablissements();
  }, [selectedUniv, universites]);

  // ✅ Charger TOUS les enseignants une seule fois pour le filtrage côté client
  useEffect(() => {
    const fetchAllTeachers = async () => {
      if (universites.length === 0) return;

      try {
        setLoading(true);

        // Charger toutes les données sans pagination
        const params = {
          per_page: 100000, // Nombre élevé pour tout récupérer
        };

        const response = await enseignantService.getAllPublic(params);
        const list = extractArrayFromResponse(response);

        const transformedData = (list || []).map((teacher) => ({
          id: teacher.id,
          nom: teacher.nom || "",
          grade: normalizeText(teacher.categorie || teacher.corps || ""),
          etablissement: teacher.etablissement?.nom || "N/A",
          univ: teacher.universite?.nom || "N/A",
          specialite: teacher.specialite || "N/A",
          diplome: teacher.diplome || "N/A",
          normalized: {
            nom: normalizeSearchText(teacher.nom || ""),
            grade: normalizeSearchText(
              teacher.categorie || teacher.corps || ""
            ),
            etablissement: normalizeSearchText(
              teacher.etablissement?.nom || ""
            ),
            univ: normalizeSearchText(teacher.universite?.nom || ""),
            specialite: normalizeSearchText(teacher.specialite || ""),
            diplome: normalizeSearchText(teacher.diplome || ""),
          },
        }));

        setAllTeachers(transformedData);
        setTotalItems(transformedData.length);
      } catch (err) {
        console.error("Erreur lors du chargement des enseignants:", err);
        setError("Impossible de charger les enseignants");
        setAllTeachers([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchAllTeachers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [universites]);

  // ✅ CORRECTION: Fonction de recherche LIKE SQL améliorée
  const searchInTeacher = (teacher, searchTerm) => {
    if (!searchTerm) return true;

    const normalizedSearch = normalizeSearchText(searchTerm);

    // Recherche dans tous les champs normalisés
    return (
      teacher.normalized.nom.includes(normalizedSearch) ||
      teacher.normalized.grade.includes(normalizedSearch) ||
      teacher.normalized.etablissement.includes(normalizedSearch) ||
      teacher.normalized.univ.includes(normalizedSearch) ||
      teacher.normalized.specialite.includes(normalizedSearch) ||
      teacher.normalized.diplome.includes(normalizedSearch)
    );
  };

  // ✅ FILTRAGE côté client avec recherche LIKE SQL
  const filteredTeachers = useMemo(() => {
    if (!Array.isArray(allTeachers)) return [];

    return allTeachers.filter((teacher) => {
      // ✅ Recherche LIKE SQL
      const matchesSearch = searchInTeacher(teacher, searchTerm);

      // Filtre Université
      const matchesUniv =
        selectedUniv === "Tous" ||
        normalizeText(teacher.univ) === normalizeText(selectedUniv);

      // Filtre Établissement
      const matchesEtablissement =
        selectedEtablissement === "Tous" ||
        normalizeText(teacher.etablissement) ===
          normalizeText(selectedEtablissement);

      // Filtre Grade
      const matchesGrade =
        selectedGrade === "Tous" ||
        normalizeText(teacher.grade) === normalizeText(selectedGrade);

      // Filtre Diplôme
      const matchesDiplome =
        selectedDiplome === "Tous" ||
        normalizeText(teacher.diplome) === normalizeText(selectedDiplome);

      return (
        matchesSearch &&
        matchesUniv &&
        matchesEtablissement &&
        matchesGrade &&
        matchesDiplome
      );
    });
  }, [
    allTeachers,
    searchTerm,
    selectedUniv,
    selectedEtablissement,
    selectedGrade,
    selectedDiplome,
  ]);

  // ✅ Calcul des établissements disponibles
  const availableEtablissements = useMemo(() => {
    const etabNames = Array.from(
      new Set(etablissements.map((e) => e.nom))
    ).sort();
    return etabNames;
  }, [etablissements]);

  // ✅ Réinitialiser l'établissement sélectionné si plus disponible
  useEffect(() => {
    if (
      selectedEtablissement !== "Tous" &&
      !availableEtablissements.includes(selectedEtablissement)
    ) {
      setSelectedEtablissement("Tous");
    }
  }, [availableEtablissements, selectedEtablissement]);

  // ✅ Pagination des résultats filtrés
  useEffect(() => {
    if (filteredTeachers.length === 0) {
      setTeachers([]);
      setTotalItems(0);
      return;
    }

    // Mettre à jour le total
    setTotalItems(filteredTeachers.length);

    // Calculer les enseignants à afficher pour la page courante
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

    // Tri alphabétique par nom
    const sortedTeachers = paginatedTeachers.sort((a, b) =>
      (a.nom || "").localeCompare(b.nom || "", "fr", {
        sensitivity: "base",
      })
    );

    setTeachers(sortedTeachers);
  }, [filteredTeachers, currentPage, itemsPerPage]);

  const UNIVERSITES_LIST = useMemo(() => {
    return universites.map((u) => u.nom);
  }, [universites]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const displayUniv =
    selectedUniv !== "Tous"
      ? selectedUniv.toUpperCase()
      : "TOUTES LES UNIVERSITÉS";
  const displayEtab =
    selectedEtablissement !== "Tous"
      ? selectedEtablissement.toUpperCase()
      : "TOUS LES ÉTABLISSEMENTS";

  const resetFilters = () => {
    setSelectedUniv("Tous");
    setSelectedEtablissement("Tous");
    setSelectedGrade("Tous");
    setSelectedDiplome("Tous");
    setSearchTerm("");
    setShowMobileFilters(false);
    setCurrentPage(1);
  };

  if (loading && universites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#4c7026] animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error && universites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#4c7026] text-white rounded-lg hover:bg-[#3a5a1d]"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-bill text-gray-800 overflow-x-hidden">
      {/* --- HEADER INSTITUTIONNEL --- */}
      <div className="w-full bg-white border-b border-gray-200 py-4 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-4 md:gap-6">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-12 w-auto object-contain md:h-16"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-12 w-auto object-contain md:h-16"
              />
            </div>

            <div className="flex-1 text-center px-2 hidden md:block">
              <div className="flex flex-col justify-center items-center space-y-1">
                <span className="font-bold text-sm lg:text-base uppercase text-[#4c7026] leading-tight">
                  MINISTERE DE L'ENSEIGNEMENT SUPERIEUR <br /> ET DE LA
                  RECHERCHE SCIENTIFIQUE
                </span>
                <span className="font-bold text-xs lg:text-sm uppercase text-gray-700">
                  SECRETARIAT GENERAL
                </span>
                <span className="font-bold text-xs lg:text-sm uppercase text-gray-600">
                  DIRECTION DES RESSOURCES HUMAINES
                </span>
              </div>
            </div>

            <div>
              <img
                src={LogoFosika}
                alt="FOSIKA"
                className="h-20 w-auto object-contain md:h-28"
              />
            </div>
          </div>

          <div className="md:hidden text-center mt-4 border-t border-gray-100 pt-3">
            <p className="font-bold text-xs uppercase text-[#4c7026] leading-tight mb-1">
              MINISTERE DE L'ENSEIGNEMENT SUPERIEUR <br /> ET DE LA RECHERCHE
              SCIENTIFIQUE
            </p>
            <p className="font-bold text-[10px] uppercase text-gray-600">
              DIRECTION DES RESSOURCES HUMAINES
            </p>
          </div>
        </div>
      </div>

      {/* --- TITRE ET CONTEXTE --- */}
      <div className="bg-white border-b border-gray-200 pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-l-4 border-[#4c7026] pl-4 md:pl-6 py-1">
            <h1 className="text-xl md:text-2xl font-bold text-[#4c7026] uppercase mb-3 leading-snug">
              LISTE DES ENSEIGNANTS CHERCHEURS PERMANENTS
            </h1>
            <div className="grid gap-1 text-xs md:text-sm font-bold text-gray-500 uppercase">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="w-32 shrink-0">UNIVERSITE:</span>
                <span className="text-gray-900 break-words">{displayUniv}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="w-32 shrink-0">ETABLISSEMENT:</span>
                <span className="text-gray-900 break-words">{displayEtab}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-32 shrink-0">ANNEE:</span>
                <span className="text-gray-900">2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CORPS DE PAGE --- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 md:py-8 w-full">
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded shadow-sm text-[#4c7026] font-bold uppercase text-xs"
          >
            <span className="flex items-center gap-2">
              <Filter size={16} /> Afficher les filtres
            </span>
            {showMobileFilters ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* --- BARRE DE FILTRES --- */}
        <div
          className={`${
            showMobileFilters ? "block" : "hidden"
          } lg:block bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200 mb-6 transition-all`}
        >
          <div className="hidden lg:flex items-center gap-2 mb-4 text-[#4c7026] font-bold uppercase text-sm border-b border-gray-100 pb-2">
            <Filter size={16} /> Filtres de recherche
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Recherche Rapide
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nom, diplôme, spécialité, grade..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded text-sm focus:border-[#4c7026] focus:ring-1 focus:ring-[#4c7026] outline-none transition-all placeholder:text-gray-400"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Université
              </label>
              <select
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded text-sm focus:border-[#4c7026] outline-none cursor-pointer truncate"
                value={selectedUniv}
                onChange={(e) => {
                  setSelectedUniv(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="Tous">Toutes les Universités</option>
                {UNIVERSITES_LIST.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Établissement
              </label>
              <select
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded text-sm focus:border-[#4c7026] outline-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 truncate"
                value={selectedEtablissement}
                onChange={(e) => {
                  setSelectedEtablissement(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={availableEtablissements.length === 0}
              >
                <option value="Tous">Tous les Établissements</option>
                {availableEtablissements.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Grade
              </label>
              <select
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded text-sm focus:border-[#4c7026] outline-none cursor-pointer truncate"
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="Tous">Tous les Grades</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Diplôme
              </label>
              <select
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded text-sm focus:border-[#4c7026] outline-none cursor-pointer truncate"
                value={selectedDiplome}
                onChange={(e) => {
                  setSelectedDiplome(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="Tous">Tous les Diplômes</option>
                {DIPLOMES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              <span className="font-bold text-[#4c7026]">{totalItems}</span>{" "}
              enseignants trouvés
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-bold uppercase bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#ea1b31] rounded transition-colors"
            >
              Effacer tous les filtres
            </button>
          </div>
        </div>

        {/* --- INFO PAGINATION ET CONTRÔLE HAUT --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 px-1">
          <div className="text-sm font-bold text-gray-700 bg-white px-3 py-1.5 rounded shadow-sm border border-gray-200">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Chargement...
              </span>
            ) : (
              <>
                Affichage de{" "}
                <span className="text-[#4c7026]">
                  {teachers.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}
                </span>{" "}
                à{" "}
                <span className="text-[#4c7026]">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                sur <span className="text-[#4c7026]">{totalItems}</span>{" "}
                enseignants
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Afficher par :
            </label>
            <select
              className="px-2 py-1.5 bg-white border border-gray-300 rounded text-sm font-semibold focus:border-[#4c7026] outline-none cursor-pointer"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* --- TABLEAU DE RÉSULTATS --- */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-[#f4f7f0] border-b border-gray-200">
            <div className="col-span-4 text-xs font-bold text-[#4c7026] uppercase tracking-wide">
              Nom et Prénoms
            </div>
            <div className="col-span-3 text-xs font-bold text-[#4c7026] uppercase tracking-wide">
              Établissement d'Origine
            </div>
            <div className="col-span-2 text-xs font-bold text-[#4c7026] uppercase tracking-wide">
              Grade
            </div>
            <div className="col-span-3 text-xs font-bold text-[#4c7026] uppercase tracking-wide">
              Diplôme & Spécialité
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-[#4c7026]" size={48} />
              </div>
            ) : teachers.length > 0 ? (
              teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-gray-50 transition-all duration-200 group"
                >
                  {/* Colonne 1: Nom - CAPITALIZE */}
                  <div className="col-span-12 md:col-span-4 flex items-start gap-3">
                    <div className="w-10 h-10 md:w-9 md:h-9 rounded bg-[#b4cd7b]/20 text-[#4c7026] flex items-center justify-center shrink-0 border border-[#b4cd7b]/30">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Identité
                      </span>
                      <h3 className="font-bold text-gray-800 text-sm group-hover:text-[#4c7026] transition-colors capitalize leading-tight">
                        {teacher.nom}
                      </h3>
                      <p className="md:hidden text-xs text-gray-500 mt-1 capitalize">
                        {teacher.univ}
                      </p>
                    </div>
                  </div>

                  {/* Colonne 2: Établissement - CAPITALIZE */}
                  <div className="col-span-12 md:col-span-3 pl-14 md:pl-0">
                    <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Établissement
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-800 font-medium capitalize">
                      <School size={15} className="text-[#b4cd7b]" />
                      {teacher.etablissement}
                    </div>
                    <div className="hidden md:block text-[11px] text-gray-500 ml-6 mt-0.5 truncate capitalize">
                      {teacher.univ}
                    </div>
                  </div>

                  {/* Colonne 3: Grade - CAPITALIZE */}
                  <div className="col-span-6 md:col-span-2 pl-14 md:pl-0 mt-2 md:mt-0">
                    <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Grade
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 capitalize">
                      {teacher.grade}
                    </span>
                  </div>

                  {/* Colonne 4: Diplôme & Spécialité - CAPITALIZE */}
                  <div className="col-span-6 md:col-span-3 pl-14 md:pl-0 mt-2 md:mt-0">
                    <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Qualification
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#4c7026] capitalize">
                        <GraduationCap size={15} />
                        {teacher.diplome}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 capitalize">
                        <BookOpen size={15} className="text-gray-400" />
                        {teacher.specialite}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-gray-500 bg-white">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600">
                  {searchTerm ||
                  selectedUniv !== "Tous" ||
                  selectedEtablissement !== "Tous" ||
                  selectedGrade !== "Tous" ||
                  selectedDiplome !== "Tous"
                    ? "Aucun résultat trouvé avec les filtres sélectionnés"
                    : "Aucun enseignant trouvé"}
                </p>
                <p className="text-sm px-4 mt-2">
                  {searchTerm
                    ? `Aucun résultat pour "${searchTerm}"`
                    : "Modifiez vos critères de recherche pour voir plus de résultats."}
                </p>
              </div>
            )}
          </div>

          {/* Footer Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
              <span className="font-medium">
                Page {currentPage} sur {totalPages}
              </span>
              <div className="flex gap-1 items-center">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Précédent
                </button>

                <div className="px-2 font-bold text-gray-800">
                  {currentPage}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bouton Retour En Bas */}
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={() => navigate("/signalement")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4c7026] hover:bg-[#3a5a1d] text-white font-bold uppercase rounded shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <ArrowLeft size={18} /> Retour à l'accueil
          </button>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full text-center py-6 mt-auto border-t border-gray-200 bg-white">
        <div className="text-gray-500 text-xs font-medium">
          © daaq-mesupres 2026
        </div>
      </footer>
    </div>
  );
};

export default PublicEnseignantsView;
