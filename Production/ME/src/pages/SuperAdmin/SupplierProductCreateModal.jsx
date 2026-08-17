import React, { useCallback, useEffect, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import Modal from '../../components/superadmin/Modal';
import ImageUpload from '../../components/common/ImageUpload';
import superAdminService from '../../services/superAdminService';

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

export const validateSupplierProductCreateForm = ({
  mode,
  selectedProduct,
  supplierCategoryId,
  supplierPrice,
  supplierMoq,
  productName,
  customerPrice,
}) => {
  if (mode === 'existing' && !selectedProduct) return 'Select an existing product to continue.';
  if (!supplierCategoryId) return 'Please select a valid supplier category.';
  const moq = Number(supplierMoq);
  if (!Number.isInteger(moq) || moq < 1) return 'Supplier MOQ must be at least 1.';
  if (supplierPrice !== '' && supplierPrice != null) {
    const price = Number(supplierPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return 'Supplier purchase price must be greater than ₹0.';
    }
  }
  if (mode === 'new') {
    if (!String(productName || '').trim()) return 'Product name is required.';
    const sellingPrice = Number(customerPrice);
    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      return 'Customer selling price must be greater than 0.';
    }
  }
  return '';
};

function SupplierProductCreateModal({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}) {
  const [step, setStep] = useState('choose');
  const [mode, setMode] = useState('existing');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [supplierCategories, setSupplierCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [supplierCategoryId, setSupplierCategoryId] = useState('');
  const [supplierPrice, setSupplierPrice] = useState('');
  const [supplierMoq, setSupplierMoq] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');
  const [productName, setProductName] = useState('');
  const [customerPrice, setCustomerPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setStep('choose');
    setMode('existing');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedProduct(null);
    setSupplierCategoryId('');
    setSupplierPrice('');
    setSupplierMoq('');
    setAvailabilityStatus('ACTIVE');
    setNotes('');
    setProductName('');
    setCustomerPrice('');
    setDescription('');
    setImageUrl('');
    setFormError('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const loadSupplierCategories = useCallback(async () => {
    if (!supplier?.id) return;
    setCategoriesLoading(true);
    try {
      const response = await superAdminService.getSupplierCategories(supplier.id, { status: 'ACTIVE' });
      const payload = response?.data ?? response;
      setSupplierCategories(payload?.categories || []);
    } catch {
      setSupplierCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [supplier?.id]);

  useEffect(() => {
    if (isOpen) {
      loadSupplierCategories();
    }
  }, [isOpen, loadSupplierCategories]);

  const loadSearchResults = useCallback(async (search) => {
    if (!supplier?.id) return;
    setSearchLoading(true);
    try {
      const response = await superAdminService.searchSupplierProducts(supplier.id, {
        search: search || undefined,
        page: 1,
        limit: 20,
      });
      const payload = response?.data ?? response;
      setSearchResults(payload?.products || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [supplier?.id]);

  useEffect(() => {
    if (!isOpen || step !== 'choose' || mode !== 'existing') return undefined;
    const timer = setTimeout(() => {
      loadSearchResults(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, step, mode, searchTerm, loadSearchResults]);

  const matchingSupplierCategories = supplierCategories.filter((category) => {
    if (mode === 'existing' && selectedProduct?.category?._id) {
      return String(category.categoryId) === String(selectedProduct.category._id);
    }
    return true;
  });

  useEffect(() => {
    if (mode === 'existing' && selectedProduct && matchingSupplierCategories.length === 1) {
      setSupplierCategoryId(matchingSupplierCategories[0]._id);
    }
  }, [mode, selectedProduct, matchingSupplierCategories]);

  const handleSelectProduct = (product) => {
    if (product.alreadyMapped) {
      setFormError('This product is already supplied by this supplier.');
      return;
    }
    setFormError('');
    setSelectedProduct(product);
    setStep('configure');
  };

  const handleCreateNew = () => {
    setMode('new');
    setSelectedProduct(null);
    setStep('configure');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validationMessage = validateSupplierProductCreateForm({
      mode,
      selectedProduct,
      supplierCategoryId,
      supplierPrice,
      supplierMoq,
      productName,
      customerPrice,
    });
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplierCategoryId,
        minimumOrderQuantity: Number(supplierMoq),
        availabilityStatus,
        notes: notes.trim(),
        supplierPrice: supplierPrice === '' ? undefined : Number(supplierPrice),
      };

      if (mode === 'existing') {
        await superAdminService.createSupplierProduct(supplier.id, {
          ...payload,
          productId: selectedProduct._id,
        });
      } else {
        await superAdminService.createSupplierProduct(supplier.id, {
          ...payload,
          product: {
            name: productName.trim(),
            description: description.trim(),
            price: Number(customerPrice),
            moq: 1,
            stock: 0,
            imageUrl: imageUrl || undefined,
          },
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setFormError(getUserFacingErrorMessage(err, 'Unable to create supplier product. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const noSupplierCategories = !categoriesLoading && supplierCategories.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Create Supplier Product">
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
          <span className="inline-flex items-center rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
            Supplier Product
          </span>
          <div>
            <p className="text-xs text-gray-500">Supplier</p>
            <p className="text-sm font-semibold text-gray-900">{supplier?.supplierName}</p>
          </div>
        </div>

        {noSupplierCategories && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Create a Supplier Category first.
          </div>
        )}

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        {step === 'choose' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Find Existing Product</label>
              <input
                className={inputClass}
                placeholder="Search product name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={noSupplierCategories}
              />
            </div>

            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg">
              {searchLoading ? (
                <p className="px-3 py-2 text-sm text-gray-500">Searching products...</p>
              ) : searchResults.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">No matching products found.</p>
              ) : (
                searchResults.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    disabled={product.alreadyMapped || noSupplierCategories}
                    onClick={() => handleSelectProduct(product)}
                    className={`w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-blue-50 disabled:opacity-60 disabled:hover:bg-transparent ${product.alreadyMapped ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Existing Product · {product.category?.name || 'Uncategorized'}
                          {product.vendor?.name ? ` · ${product.vendor.name}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">ID: {product._id}</p>
                      </div>
                      <div className="text-right">
                        {!product.isActive && (
                          <span className="inline-flex text-[10px] font-semibold uppercase text-amber-700">
                            Inactive Product
                          </span>
                        )}
                        {product.alreadyMapped && (
                          <span className="block text-[10px] font-semibold uppercase text-gray-500 mt-1">
                            Already mapped
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateNew}
              disabled={noSupplierCategories}
              className="w-full px-4 py-2.5 min-h-[44px] border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
            >
              Create New Supplier Product
            </button>
          </div>
        )}

        {step === 'configure' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setStep('choose');
                setFormError('');
              }}
              className="text-sm text-blue-700 hover:text-blue-800"
            >
              ← Back to product search
            </button>

            {mode === 'existing' && selectedProduct && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm space-y-1">
                <p><span className="font-medium">Existing Product:</span> {selectedProduct.name}</p>
                <p><span className="font-medium">Global Category:</span> {selectedProduct.category?.name || '—'}</p>
                {!selectedProduct.isActive && (
                  <p className="text-amber-700 font-medium">Inactive Product</p>
                )}
              </div>
            )}

            {mode === 'new' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Product Information</h4>
                <input
                  className={inputClass}
                  placeholder="Product Name *"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
                <textarea
                  className={`${inputClass} min-h-[88px]`}
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Selling Price *</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="150.00"
                    value={customerPrice}
                    onChange={(e) => setCustomerPrice(e.target.value)}
                    required
                  />
                </div>
                <ImageUpload
                  label="Product Image"
                  previewUrl={imageUrl}
                  onUploaded={(result) => setImageUrl(result?.url || result?.secure_url || '')}
                  onClear={() => setImageUrl('')}
                  uploadFolder="mokshith/products"
                />
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Supplier Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Category *</label>
                <select
                  className={inputClass}
                  value={supplierCategoryId}
                  onChange={(e) => setSupplierCategoryId(e.target.value)}
                  required
                  disabled={categoriesLoading || matchingSupplierCategories.length === 0}
                >
                  <option value="">Select supplier category</option>
                  {matchingSupplierCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Purchase Price</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="100.00"
                  value={supplierPrice}
                  onChange={(e) => setSupplierPrice(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">Internal procurement cost only. Does not change customer selling price.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier MOQ *</label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="50"
                  value={supplierMoq}
                  onChange={(e) => setSupplierMoq(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Availability</label>
                <select
                  className={inputClass}
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <textarea
                className={`${inputClass} min-h-[88px]`}
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm border rounded-lg">Cancel</button>
              <button
                type="submit"
                disabled={saving || noSupplierCategories}
                className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Supplier Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export default SupplierProductCreateModal;
