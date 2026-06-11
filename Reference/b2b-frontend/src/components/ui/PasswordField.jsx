import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordField = ({ label, error, helperText, id, className = '', fullWidth, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `password-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  
  return (
    <div className={`input-container ${className}`} style={{ width: fullWidth ? '100%' : 'auto', marginBottom: '1.5rem' }}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId || (helperText ? `${inputId}-helper` : undefined)}
          className={`premium-input w-full px-5 py-4 pr-12 rounded-2xl border-2 transition-all duration-300 outline-none ${
            error 
              ? 'border-red-100 bg-red-50/30 focus:border-red-500' 
              : 'border-gray-100 bg-gray-50/50 focus:border-blue-500 focus:bg-white'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && (
        <span id={errorId} role="alert" className="block mt-2 text-xs font-bold text-red-500 flex items-center gap-1.5 animate-in slide-in-from-top-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true"></span>
          {error}
        </span>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-2 text-xs font-bold text-gray-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default PasswordField;
