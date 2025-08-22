import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark dark:via-dark-light dark:to-dark">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gradient mb-2">Poupo</h2>
        <p className="text-gray-600 dark:text-light">Carregando...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
