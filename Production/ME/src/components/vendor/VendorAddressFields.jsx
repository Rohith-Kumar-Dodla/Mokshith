import React from 'react';

const inputClass =
  'w-full px-3 sm:px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

export default function VendorAddressFields({
  value,
  onChange,
  errors = {},
  idPrefix = 'vendor-address',
}) {
  const updateField = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const updateLocation = (field, fieldValue) => {
    onChange({
      ...value,
      location: {
        ...(value.location || {}),
        [field]: fieldValue,
      },
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-line1`} className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1
        </label>
        <input
          id={`${idPrefix}-line1`}
          className={`${inputClass} ${errors.line1 ? 'border-danger' : ''}`}
          value={value.line1 || ''}
          onChange={(e) => updateField('line1', e.target.value)}
          required
        />
        {errors.line1 && <p className="text-danger text-sm mt-1">{errors.line1}</p>}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-line2`} className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (optional)
        </label>
        <input
          id={`${idPrefix}-line2`}
          className={inputClass}
          value={value.line2 || ''}
          onChange={(e) => updateField('line2', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor={`${idPrefix}-area`} className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <input
            id={`${idPrefix}-area`}
            className={`${inputClass} ${errors.area ? 'border-danger' : ''}`}
            value={value.area || ''}
            onChange={(e) => updateField('area', e.target.value)}
            required
          />
          {errors.area && <p className="text-danger text-sm mt-1">{errors.area}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-city`} className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            id={`${idPrefix}-city`}
            className={`${inputClass} ${errors.city ? 'border-danger' : ''}`}
            value={value.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            required
          />
          {errors.city && <p className="text-danger text-sm mt-1">{errors.city}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-district`} className="block text-sm font-medium text-gray-700 mb-1">District</label>
          <input
            id={`${idPrefix}-district`}
            className={`${inputClass} ${errors.district ? 'border-danger' : ''}`}
            value={value.district || ''}
            onChange={(e) => updateField('district', e.target.value)}
            required
          />
          {errors.district && <p className="text-danger text-sm mt-1">{errors.district}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-state`} className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            id={`${idPrefix}-state`}
            className={`${inputClass} ${errors.state ? 'border-danger' : ''}`}
            value={value.state || ''}
            onChange={(e) => updateField('state', e.target.value)}
            required
          />
          {errors.state && <p className="text-danger text-sm mt-1">{errors.state}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-country`} className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            id={`${idPrefix}-country`}
            className={`${inputClass} ${errors.country ? 'border-danger' : ''}`}
            value={value.country || 'India'}
            onChange={(e) => updateField('country', e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-pincode`} className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input
            id={`${idPrefix}-pincode`}
            className={`${inputClass} ${errors.pincode ? 'border-danger' : ''}`}
            value={value.pincode || ''}
            onChange={(e) => updateField('pincode', e.target.value)}
            required
          />
          {errors.pincode && <p className="text-danger text-sm mt-1">{errors.pincode}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor={`${idPrefix}-latitude`} className="block text-sm font-medium text-gray-700 mb-1">
            Latitude (optional)
          </label>
          <input
            id={`${idPrefix}-latitude`}
            type="number"
            step="any"
            className={inputClass}
            value={value.location?.latitude ?? ''}
            onChange={(e) => updateLocation('latitude', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-longitude`} className="block text-sm font-medium text-gray-700 mb-1">
            Longitude (optional)
          </label>
          <input
            id={`${idPrefix}-longitude`}
            type="number"
            step="any"
            className={inputClass}
            value={value.location?.longitude ?? ''}
            onChange={(e) => updateLocation('longitude', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
