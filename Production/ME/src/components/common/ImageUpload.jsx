import React, { useEffect, useRef, useState } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

const ImageUpload = ({
  label = 'Image',
  value = null,
  previewUrl = '',
  onChange,
  onClear,
  disabled = false,
  required = false,
  error = null,
}) => {
  const inputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [localPreview, setLocalPreview] = useState('');
  const [removedExisting, setRemovedExisting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setLocalPreview('');
    setRemovedExisting(false);
    setValidationError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const displayUrl = localPreview || (!removedExisting ? previewUrl : '');

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    setValidationError('');

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setValidationError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationError(`Image must be smaller than ${MAX_SIZE_MB}MB`);
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    setRemovedExisting(false);
    onChange?.(file);
  };

  const handleClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreview('');
    setRemovedExisting(true);
    setValidationError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange?.(null);
    onClear?.();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="space-y-3">
        {displayUrl ? (
          <div className="relative inline-block">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-32 h-32 rounded-lg object-cover border border-gray-200"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                aria-label="Remove image"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
            <FiImage size={28} className="text-gray-400" />
          </div>
        )}

        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
            id={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
            }`}
          >
            <FiUpload size={16} />
            {displayUrl ? 'Change Image' : 'Choose Image'}
          </label>
        </div>
      </div>

      {(validationError || error) && (
        <p className="mt-2 text-sm text-red-600">{validationError || error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
