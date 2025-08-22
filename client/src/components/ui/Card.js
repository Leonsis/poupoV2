import React from 'react';

const Card = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const baseClasses = 'rounded-xl shadow-lg transition-all duration-300 border';
  
  const variants = {
    default: 'bg-white dark:bg-dark-light border-gray-100 dark:border-gray-700 hover:shadow-xl',
    dark: 'bg-dark-light dark:bg-dark-lighter border-gray-700 dark:border-gray-600 hover:shadow-xl',
    elevated: 'bg-white dark:bg-dark-light border-gray-100 dark:border-gray-700 hover:shadow-2xl transform hover:-translate-y-1',
    outline: 'bg-transparent border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 pb-0 ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
