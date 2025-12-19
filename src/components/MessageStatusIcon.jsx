// src/components/MessageStatusIcon.jsx
import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageStatusIcon = ({ status, className = "" }) => {
    if (!status || status === 'sent') {
        // Une seule coche grise = envoyé
        return <Check className={`w-4 h-4 text-gray-400 ${className}`} />;
    }

    if (status === 'delivered') {
        // Deux coches grises = livré
        return <CheckCheck className={`w-4 h-4 text-gray-400 ${className}`} />;
    }

    if (status === 'read') {
        // Deux coches bleues = lu
        return <CheckCheck className={`w-4 h-4 text-blue-500 ${className}`} />;
    }

    return null;
};

export default MessageStatusIcon;
