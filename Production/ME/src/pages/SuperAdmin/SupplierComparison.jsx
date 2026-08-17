import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import PageHeader from '../../components/superadmin/PageHeader';
import DataTable from '../../components/superadmin/DataTable';
import StatusBadge from '../../components/superadmin/StatusBadge';
import superAdminService from '../../services/superAdminService';
import productService from '../../services/productService';

const inputClass =
  'w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

const formatSupplierPrice = (value) => {
  if (value == null || value === '') return 'Not set';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Not set';
  return `₹${amount.toFixed(2)}`;
};

export const comparisonEmptyMessage = (emptyReason) => {
  if (emptyReason === 'NO_MAPPINGS') return 'No suppliers are mapped to this product yet.';
  if (emptyReason === 'NO_ACTIVE_SUPPLIERS') return 'No active suppliers are currently available for this product.';
  if (emptyReason === 'NO_PRICES') return 'Supplier prices have not been configured yet.';
  return '';
};

const unwrapProducts = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload)) return payload;
  return [];
};

function SupplierComparison() {
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProductOptions = useCallback(async (search) => {
    setProductLoading(true);
    try {
      const response = await productService.getAllProducts({
        search: search || undefined,
        page: 1,
        limit: 20,
      });
      setProductOptions(unwrapProducts(response));
    } catch {
      setProductOptions([]);
    } finally {
      setProductLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProductOptions(productSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, loadProductOptions]);

  const loadComparison = useCallback(async (product) => {
    if (!product?._id && !product?.id) return;
    const productId = product._id || product.id;
    setLoading(true);
    setError('');
    try {
      const response = await superAdminService.getSupplierComparison(productId);
      const payload = response?.data ?? response;
      setComparison(payload);
    } catch (err) {
      setComparison(null);
      setError(getUserFacingErrorMessage(err, 'Failed to load supplier comparison'));
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProduct = async (product) => {
    setSelectedProduct({
      _id: product._id || product.id,
      name: product.name,
    });
    setProductSearch(product.name || '');
    await loadComparison(product);
  };

  const emptyMessage = comparisonEmptyMessage(comparison?.emptyReason);
  const suppliers = comparison?.suppliers || [];
  const lowestPriceSuppliers = suppliers.filter((row) => row.isLowestPrice);

  const columns = useMemo(() => [
    {
      key: 'supplierName',
      label: 'Supplier',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          {row.companyName ? <p className="text-xs text-gray-500">{row.companyName}</p> : null}
        </div>
      ),
    },
    {
      key: 'currentSupplierPrice',
      label: 'Price',
      render: (value, row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className={value == null ? 'text-gray-500' : 'font-medium text-gray-900'}>
            {formatSupplierPrice(value)}
          </span>
          {row.isLowestPrice ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Lowest Price
            </span>
          ) : null}
        </div>
      ),
    },
    { key: 'minimumOrderQuantity', label: 'MOQ' },
    {
      key: 'availabilityStatus',
      label: 'Availability',
      render: (value) => <StatusBadge status={String(value || '').toLowerCase()} />,
    },
  ], []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Supplier Comparison"
        subtitle="Compare current supplier purchase prices for an existing product. This does not select a supplier."
        actions={(
          <Link
            to="/super-admin/suppliers"
            className="inline-flex items-center px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Back to Suppliers
          </Link>
        )}
      />

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">Search Product</label>
        <input
          className={inputClass}
          placeholder="Search existing products..."
          value={productSearch}
          onChange={(e) => {
            setProductSearch(e.target.value);
            if (selectedProduct) setSelectedProduct(null);
            setComparison(null);
            setError('');
          }}
        />
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
          {productLoading ? (
            <p className="px-3 py-2 text-sm text-gray-500">Loading products...</p>
          ) : productOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No products found.</p>
          ) : (
            productOptions.map((product) => {
              const id = product._id || product.id;
              const isSelected = selectedProduct?._id === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectProduct(product)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  {product.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      {!selectedProduct && !loading && !error && (
        <p className="text-sm text-gray-500">Search and select a product to compare suppliers.</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-500">Loading supplier comparison...</p>
      )}

      {selectedProduct && !loading && comparison && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Product</p>
            <p className="text-lg font-semibold text-gray-900">{comparison.product?.name || selectedProduct.name}</p>
          </div>

          {emptyMessage && (
            <p className="text-sm text-gray-600">{emptyMessage}</p>
          )}

          {suppliers.length > 0 && (
            <>
              {comparison.lowestPrice != null && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-800">Lowest Current Price</p>
                  <p className="text-lg font-semibold text-emerald-900">{formatSupplierPrice(comparison.lowestPrice)}</p>
                  <p className="text-sm text-emerald-800">
                    {lowestPriceSuppliers.map((row) => row.supplierName).join(', ')}
                  </p>
                </div>
              )}
              <DataTable columns={columns} data={suppliers} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SupplierComparison;
