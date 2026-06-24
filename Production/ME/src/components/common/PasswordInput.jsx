import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Reusable password input with a visibility toggle button.
// Keeps input controlled by parent via value/onChange and preserves name, validation, and other props.
export default function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  className = '',
  id,
  required,
  autoFocus,
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  const toggle = () => setVisible((v) => !v);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} pr-12`}
        required={required}
        autoFocus={autoFocus}
        {...rest}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

