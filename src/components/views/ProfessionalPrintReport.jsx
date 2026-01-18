import React from "react";
import {
  Eye,
  Download,
  Printer,
  X,
  Edit,
  Trash2,
  Filter,
  MessageCircle,
} from "lucide-react";

// Import des logos depuis les assets
import fosikaLogo from "../../assets/images/logo fosika.png";
import mesupresLogo from "../../assets/images/logo mesupres.png";

// MODIFICATION: Recevoir les données via props au lieu de les simuler
const ProfessionalPrintReport = ({ reportData }) => {
  // Utiliser les données reçues en props, ou un objet vide par défaut
  const selectedReport = reportData || {};

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getDisplayStatus = (status) => {
    const statusMap = {
      en_cours: "En cours de traitement",
      encours: "En cours de traitement",
      investigation: "Enquête en cours",
      transmis_autorite: "Transmis aux autorités compétentes",
      transmisautorite: "Transmis aux autorités compétentes",
      classifier: "Dossier classé sans suite",
    };
    return statusMap[status] || status;
  };

  const getDisplayAssignedTo = (assignedTo) => {
    const assignMap = {
      investigateur: "Service d'Investigation",
      cac_daj: "DAAQ / CAC / DAJ",
      cacdaj: "DAAQ / CAC / DAJ",
      autorite_competente: "Autorité Compétente",
      autoritecompetente: "Autorité Compétente",
    };
    return assignMap[assignedTo] || "Non assigné";
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            
            .print-report-container,
            .print-report-container * {
              visibility: visible;
            }
            
            .print-report-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              padding: 0;
              margin: 0;
            }
            
            .no-print {
              display: none !important;
            }
            
            /* CORRECTION: Empêcher la répétition du header */
            .report-header {
              position: static !important;
              page-break-after: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Éviter les coupures dans les sections principales */
            .info-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Permettre les coupures uniquement dans les pièces jointes */
            .attachment-item {
              page-break-before: always;
              break-before: page;
              page-break-inside: auto;
            }
            
            /* Ne PAS ajouter de marge pour la première pièce */
            .attachment-item:first-of-type {
              page-break-before: auto;
              margin-top: 0;
            }
            
            /* Ajouter une marge pour les pièces suivantes */
            .attachment-item:not(:first-of-type) {
              margin-top: 1cm;
            }
            
            /* Watermark */
            .watermark-print {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              font-weight: 900;
              color: rgba(0, 0, 0, 0.05);
              z-index: 0;
              pointer-events: none;
            }
            
            @page {
              size: A4;
              margin: 2cm 1.5cm;
            }
          }
          
          @media screen {
            .print-report-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              padding-left: 2rem !important;
              padding-right: 2rem !important;
            }
            
            .watermark-print {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              font-weight: 900;
              color: rgba(0, 0, 0, 0.05);
              z-index: 0;
              pointer-events: none;
            }
          }
          
          /* Style pour l'en-tête simple des pages suivantes */
          .simple-header {
            border-bottom: 2px solid #666;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 10px;
            color: #666;
          }
          
          .simple-header .reference {
            font-weight: bold;
            font-size: 11px;
          }
        `}
      </style>

      <div className="print-report-container bg-white font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif] leading-relaxed text-gray-900 pl-8 pr-8">
        {/* Watermark */}
        <div className="watermark-print">FOSIKA</div>

        {/* Header - SEULEMENT sur la première page */}
        <div className="report-header border-b-4 border-black pb-5 mb-8 relative z-10">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-5">
              <img
                src={mesupresLogo}
                alt="Logo MESUPRES"
                className="h-16"
                onError={(e) => {
                  console.error("Erreur de chargement du logo MESUPRES");
                  e.target.style.display = "none";
                }}
              />
              <img
                src={fosikaLogo}
                alt="Logo FOSIKA"
                className="h-16"
                onError={(e) => {
                  console.error("Erreur de chargement du logo FOSIKA");
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-black tracking-wide mb-1">
                FICHE DE SIGNALEMENT
              </h1>
              <p className="text-xs text-black mt-1">
                Référence: {selectedReport.reference || "N/A"}
              </p>
              <p className="text-xs text-black mt-1">
                Édité le: {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs font-semibold text-black uppercase tracking-wide">
              Ministère de l'Enseignement Supérieur et de la Recherche
              Scientifique
            </p>
            <p className="text-xs font-semibold text-black uppercase tracking-wide mt-1">
              Système FOSIKA - Plateforme de Signalement
            </p>
          </div>
        </div>

        {/* Informations principales */}
        <div className="info-section mb-7">
          <h2 className="text-sm font-bold text-black uppercase tracking-wide py-3 px-4 bg-gray-100 border-l-4 border-black mb-4">
            Informations du Signalement
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Référence Officielle
              </div>
              <div className="text-sm font-bold text-black">
                {selectedReport.reference || "N/A"}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Date d'Enregistrement
              </div>
              <div className="text-sm text-gray-800 font-medium">
                {formatDate(selectedReport.date)}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Catégorie
              </div>
              <div className="text-sm text-gray-800 font-medium">
                {selectedReport.categorieLabel ||
                  selectedReport.categorie ||
                  "N/A"}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Type de Signalement
              </div>
              <div className="text-sm text-gray-800 font-medium">
                {selectedReport.type_signalement ||
                  selectedReport.typesignalement ||
                  "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Informations de l'auteur */}
        <div className="info-section mb-7">
          <h2 className="text-sm font-bold text-black uppercase tracking-wide py-3 px-4 bg-gray-100 border-l-4 border-black mb-4">
            Informations de l'Auteur
          </h2>

          {selectedReport.type_signalement === "Anonyme" ||
          selectedReport.typesignalement === "Anonyme" ? (
            <div className="bg-gray-100 border-2 border-black rounded-lg p-5 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-full flex items-center justify-center text-white text-2xl">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-bold text-black mb-2">
                SIGNALEMENT ANONYME
              </p>
              <p className="text-xs text-black">
                Aucune information personnelle disponible
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Nom et Prénom
                </div>
                <div className="text-sm text-gray-800 font-medium">
                  {selectedReport.nom_prenom ||
                    selectedReport.nomprenom ||
                    "Non spécifié"}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Téléphone
                </div>
                <div className="text-sm text-gray-800 font-medium">
                  {selectedReport.telephone || "N/A"}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Email
                </div>
                <div className="text-sm text-gray-800 font-medium">
                  {selectedReport.email || "N/A"}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Localisation
                </div>
                <div className="text-sm text-gray-800 font-medium">
                  {selectedReport.city ? `${selectedReport.city}, ` : ""}
                  {selectedReport.province
                    ? `${selectedReport.province}, `
                    : ""}
                  {selectedReport.region || "Non spécifiée"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="info-section mb-7">
          <h2 className="text-sm font-bold text-black uppercase tracking-wide py-3 px-4 bg-gray-100 border-l-4 border-black mb-4">
            Description Détaillée des Faits
          </h2>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-5 text-xs leading-loose text-gray-700 mb-4">
            {selectedReport.explication || "Aucune description"}
          </div>

          <div className="flex gap-5 text-xs text-gray-500 mt-3">
            <div>
              <strong>Présence de preuves:</strong>{" "}
              {selectedReport.has_proof || selectedReport.hasproof
                ? "✓ OUI"
                : "NON"}
            </div>
            <div>
              <strong>Nombre de pièces jointes:</strong>{" "}
              {selectedReport.files?.length || 0}
            </div>
          </div>
        </div>

        {/* Pièces jointes - Chaque pièce commence sur une nouvelle page */}
        {selectedReport.files && selectedReport.files.length > 0 && (
          <div className="info-section mb-7">
            <h2 className="text-sm font-bold text-black uppercase tracking-wide py-3 px-4 bg-gray-100 border-l-4 border-black mb-4">
              Pièces Jointes et Preuves
            </h2>

            <div className="mb-4">
              {selectedReport.files.map((file, index) => {
                const fileName = typeof file === "string" ? file : file.name;
                const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
                const isPDF = ext === "PDF";

                return (
                  <div key={index} className="attachment-item">
                    {/* En-tête simple pour chaque nouvelle page */}
                    {index > 0 && (
                      <div className="simple-header">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="reference">
                              {selectedReport.reference}
                            </span>
                            <span className="ml-4">
                              Pièce jointe {index + 1} sur{" "}
                              {selectedReport.files.length}
                            </span>
                          </div>
                          <div>
                            {new Date().toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* En-tête détaillé */}
                    <div className="border-b-2 border-black pb-3 mb-5 mt-4">
                      <table className="w-full text-xs border-collapse">
                        <tbody>
                          <tr>
                            <td className="font-semibold w-40 py-2">
                              PIÈCE JOINTE N°
                            </td>
                            <td className="py-2">{index + 1}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold py-2">
                              TYPE DE DOCUMENT
                            </td>
                            <td className="py-2">{ext}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold py-2">
                              NOM DU FICHIER
                            </td>
                            <td className="py-2 break-all">{fileName}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold py-2">RÉFÉRENCE</td>
                            <td className="py-2">
                              {selectedReport.reference}-{ext}-{index + 1}
                            </td>
                          </tr>
                          <tr>
                            <td className="font-semibold py-2">DATE</td>
                            <td className="py-2">
                              {formatDate(selectedReport.date)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Note pour PDF */}
                    {isPDF && (
                      <div className="border-2 border-black p-5 text-center bg-white">
                        <p className="text-xs font-bold text-black mb-3">
                          DOCUMENT PDF JOINT AU DOSSIER
                        </p>
                        <p className="text-xs text-black mb-4 leading-relaxed">
                          La version imprimable de ce document PDF doit être
                          épinglée dans le dossier physique.
                        </p>
                        <div className="inline-block border-2 border-black px-5 py-2 text-xs font-semibold uppercase tracking-wide">
                          ☐ VERSION IMPRIMABLE ÉPINGLÉE
                        </div>
                      </div>
                    )}

                    {/* Note pour autres fichiers */}
                    {!isPDF && (
                      <div className="border border-black p-5 text-center bg-white">
                        <p className="text-xs text-black leading-relaxed">
                          Fichier disponible dans le système électronique de
                          gestion des signalements.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section signature */}
        <div className="info-section mt-14 pt-8 border-t-2 border-dashed border-gray-300">
          <div className="grid grid-cols-2 gap-10">
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-10">
                Responsable du Traitement
              </div>
              <div className="border-t border-gray-400 pt-3">
                <p className="text-[9px] text-gray-400">
                  Nom, signature et cachet
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-10">
                Validation Hiérarchique
              </div>
              <div className="border-t border-gray-400 pt-3">
                <p className="text-[9px] text-gray-400">
                  Nom, signature et cachet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-5 border-t-2 border-gray-200 text-[9px] text-gray-500">
          <img
            src={fosikaLogo}
            alt="Logo FOSIKA"
            className="h-10 mx-auto mb-3"
            onError={(e) => {
              console.error(
                "Erreur de chargement du logo FOSIKA dans le footer"
              );
              e.target.style.display = "none";
            }}
          />
          <p className="my-1 font-semibold">
            © DAAQ-MESUPRES 2026 - Tous droits réservés
          </p>
          <p className="my-1">
            Système FOSIKA - Plateforme de Gestion des Signalements
          </p>
          <p className="my-1">
            Généré le {formatDate(new Date().toISOString())} à{" "}
            {new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="inline-block bg-red-600 text-white px-3 py-1 rounded font-bold text-xs mt-3">
            DOCUMENT CONFIDENTIEL - {selectedReport.reference || "N/A"}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfessionalPrintReport;
