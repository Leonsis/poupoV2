import React, { createContext, useContext, useState, useCallback } from 'react';

const PrivacyContext = createContext();

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (!context) {
        throw new Error('usePrivacy deve ser usado dentro de um PrivacyProvider');
    }
    return context;
};

export const PrivacyProvider = ({ children }) => {
    const [isPrivacyMode, setIsPrivacyMode] = useState(true);

    const togglePrivacyMode = useCallback(() => {
        setIsPrivacyMode(prev => !prev);
    }, []);

    const value = {
        isPrivacyMode,
        togglePrivacyMode
    };

    return (
        <PrivacyContext.Provider value={value}>
            {children}
        </PrivacyContext.Provider>
    );
};
