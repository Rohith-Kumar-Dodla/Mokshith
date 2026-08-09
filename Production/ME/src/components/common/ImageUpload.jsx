import React, { useEffect, useRef, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { FiUpload, FiX, FiImage, FiLoader } from 'react-icons/fi';
import uploadService from '../../services/uploadService';
import { resolveUploadUrl } from '../../utils/bankTransferUtils';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

/**
 * Image picker with optional immediate upload.
 * After a successful upload, displays the returned CDN/server URL (not a generic Preview state).
 */
const ImageUpload = ({
  label = 'Image',
  value = null,
  previewUrl = '',
  onChange,
  onClear,
  onUploaded,
  uploadFolder = 'mokshith/products',
  autoUpload = true,
  disabled = false,
  required = false,
  error = null,
}) => {
  const inputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [localPreview, setLocalPreview] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [removedExisting, setRemovedExisting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setLocalPreview('');
    setUploadedUrl('');
    setRemovedExisting(false);
    setValidationError('');
    setUploadError('');
    setUploading(false);
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

  const resolvedPreview = resolveUploadUrl(previewUrl) || previewUrl || '';
  const displayUrl = uploadedUrl || localPreview || (!removedExisting ? resolvedPreview : '');
  const hasPersistedImage = Boolean(uploadedUrl || (!localPreview && !removedExisting && resolvedPreview));

  const revokeLocalPreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreview('');
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    setValidationError('');
    setUploadError('');

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setValidationError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationError(`Image must be smaller than ${MAX_SIZE_MB}MB`);
      return;
    }

    revokeLocalPreview();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    setUploadedUrl('');
    setRemovedExisting(false);
    onChange?.(file);

    if (!autoUpload) {
      return;
    }

    setUploading(true);
    try {
      const result = await uploadService.uploadImage(file, uploadFolder);
      const url = resolveUploadUrl(result?.url || result?.secure_url || '') || result?.url || result?.secure_url;
      if (!url) {
        throw new Error('Upload succeeded but no image URL was returned');
      }
      revokeLocalPreview();
      setUploadedUrl(url);
      onUploaded?.({
        url,
        publicId: result?.publicId || result?.public_id || null,
      });
      // File already stored remotely — clear file so submit uses imageUrl (avoids double upload)
      onChange?.(null);
    } catch (err) {
      setUploadError(getUserFacingErrorMessage(err, 'Image upload failed'));
      // Keep local preview + file so user can still save via multipart fallback
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    revokeLocalPreview();
    setUploadedUrl('');
    setRemovedExisting(true);
    setValidationError('');
    setUploadError('');
    setUploading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange?.(null);
    onUploaded?.(null);
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
              alt={hasPersistedImage ? label : `Selected ${label}`}
              className="w-32 h-32 rounded-lg object-cover border border-gray-200"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                <FiLoader className="text-white animate-spin" size={22} aria-label="Uploading" />
              </div>
            )}
            {!disabled && !uploading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 min-h-[28px] min-w-[28px] flex items-center justify-center"
                aria-label="Remove image"
              >
                <FiX size={14} />
              </button>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {uploading ? 'Uploading…' : hasPersistedImage ? 'Uploaded image' : 'Selected (pending upload)'}
            </p>
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
            disabled={disabled || uploading}
            className="hidden"
            id={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm min-h-[44px] ${
              disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
            }`}
          >
            <FiUpload size={16} />
            {displayUrl ? 'Change Image' : 'Choose Image'}
          </label>
        </div>
      </div>

      {(validationError || uploadError || error) && (
        <p className="mt-2 text-sm text-red-600">{validationError || uploadError || error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
