import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  className = '',
  as: Component = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95';
  
  const variants = {
    primary: 'bg-primary text-black hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 focus:ring-primary border-0 shadow-sm',
    secondary: 'bg-secondary text-white hover:bg-secondary-light hover:shadow-lg hover:shadow-secondary/25 focus:ring-secondary border-0 shadow-sm',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-black hover:shadow-lg hover:shadow-primary/25 focus:ring-primary bg-transparent shadow-sm',
    ghost: 'text-gray-700 dark:text-light hover:bg-gray-100 dark:hover:bg-dark-lighter focus:ring-gray-500 border-0',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 focus:ring-red-500 border-0 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/25 focus:ring-green-500 border-0 shadow-sm'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;
  
  return (
    <Component 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {children}
    </Component>
  );
};

export default Button;
