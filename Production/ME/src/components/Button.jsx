const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-300';
  
  const variants = {
    primary: 'bg-secondary hover:bg-primary text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white hover:bg-gray-50 text-primary border-2 border-primary',
    danger: 'bg-danger hover:bg-red-600 text-white shadow-lg hover:shadow-xl',
    success: 'bg-success hover:bg-green-600 text-white shadow-lg hover:shadow-xl',
  };
  
  const sizes = {
    sm: 'py-2.5 px-4 h-10 text-sm',
    md: 'py-2.5 sm:py-3 px-4 sm:px-6 h-10 sm:h-12 text-sm sm:text-base',
    lg: 'py-3 sm:py-4 px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
