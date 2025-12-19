// src/components/Page404.js
import React from "react";
import { Link } from "react-router-dom";
import "./Page404.css"; // Import du style spécifique

const Page404 = () => {
  return (
    <section className="page_404 min-h-screen flex items-center justify-center">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full text-center">
            {/* Image de fond animée */}
            <div className="four_zero_four_bg">
              <h1 className="text-center text-gray-800">404</h1>
            </div>

            {/* Contenu texte */}
            <div className="content_box_404">
              <h3 className="h2 text-3xl font-bold mb-4">
                On dirait que vous êtes perdu
              </h3>

              <p className="text-lg text-gray-600 mb-6">
                La page que vous recherchez n'est pas disponible !
              </p>

              <Link to="/" className="link_404">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page404;
