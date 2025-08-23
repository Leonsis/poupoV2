import React from 'react';

const Input = ({
    label,
    error,
    help,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconClick,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const inputClasses = `
        w-full px-4 py-3 border-2 rounded-lg transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
        bg-white dark:bg-dark-light text-gray-900 dark:text-light
        placeholder:text-gray-500 dark:placeholder:text-gray-400
        disabled:opacity-50 disabled:cursor-not-allowed relative z-0
        ${error 
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 dark:border-gray-600 focus:border-primary'
        }
        ${LeftIcon ? 'pl-10' : ''}
        ${RightIcon ? 'pr-10' : ''}
        ${className}
    `.trim();

    return (
        <div className="mb-4">
            {label && (
                <label 
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                {LeftIcon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                        <LeftIcon className="w-5 h-5" />
                    </div>
                )}

                <input 
                    id={inputId}
                    className={inputClasses} 
                    {...props} 
                />

                {RightIcon && (
                    <div 
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 ${
                            onRightIconClick ? 'cursor-pointer hover:text-gray-600' : 'pointer-events-none'
                        }`}
                        onClick={onRightIconClick}
                    >
                        <RightIcon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}

            {help && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {help}
                </p>
            )}
        </div>
    );
};

export default Input;