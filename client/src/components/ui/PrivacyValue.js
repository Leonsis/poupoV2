import React from 'react';

const PrivacyValue = ({ 
    children, 
    className = '', 
    blurText = '••••••', 
    isPrivacyMode = false 
}) => {
    if (isPrivacyMode) {
        return (
            <span 
                className={`${className} select-none cursor-default`}
                style={{
                    filter: 'blur(4px)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                }}
                title="Modo privacidade ativado"
            >
                {blurText}
            </span>
        );
    }

    return <span className={className}>{children}</span>;
};

export default PrivacyValue;
