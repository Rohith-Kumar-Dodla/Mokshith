import { useState, useEffect } from "react";
import { productService, updateProduct } from "../../product/services/productService";
import { getProductImage } from "../../../utils/imageHelper";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Table, { TableRow, TableCell } from "../../../components/ui/Table";
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Edit3, 
  Trash2, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockValue, setStockValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0,
    categoryId: '',
    moq: 1,
    isActive: true,
    image: null
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', stock: 0, categoryId: '', moq: 1, isActive: true, image: null });
    setImagePreview(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    resetForm();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm({ ...form, image: null });
    setImagePreview(null);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({ limit: 100 });
      const data = res.data || res;
      setProducts(Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await productService.getCategories();
      const data = res.data || res;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Create process started");
    console.log("Current form state:", form);
    
    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', Number(form.price));
      formData.append('stock', Number(form.stock));
      formData.append('moq', Number(form.moq));
      formData.append('isActive', form.isActive);
      
      if (form.categoryId) {
        formData.append('categoryId', form.categoryId);
      } else {
        console.warn("⚠️ No categoryId provided in form");
      }
      
      if (form.image instanceof File) {
        console.log('📎 Image file found:', form.image.name);
        formData.append('image', form.image);
      }
      
      console.log('📦 Create FormData prepared, calling service...');
      const response = await productService.createProduct(formData);
      console.log('✅ Create successful', response);
      closeModal();
      fetchProducts();
    } catch (err) {
      console.error('❌ Create process failed:', err);
      // 🔥 Show detailed error if available
      const errorMsg = err.response?.data?.message || err.message || "Failed to create product";
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId?._id || product.categoryId || '',
      moq: product.moq || 1,
      isActive: product.isActive,
      image: null
    });
    setImagePreview(product.image || product.imageUrl || null);
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    console.log("🚀 HANDLE UPDATE START");
    
    try {
      if (!selectedProduct?._id) {
        console.error("❌ Missing product ID");
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name || "");
      formData.append("description", form.description || "");
      formData.append("price", Number(form.price) || 0);
      formData.append("stock", Number(form.stock) || 0);
      formData.append("moq", Number(form.moq) || 1);
      formData.append("categoryId", form.categoryId || "");
      formData.append("isActive", form.isActive);

      if (form.image instanceof File) {
        formData.append("image", form.image);
      }

      console.log("📦 FormData created");

      // 🔥 CRITICAL LINE
      const response = await updateProduct(selectedProduct._id, formData);

      console.log("✅ UPDATE SUCCESS:", response);
      
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error("❌ UPDATE ERROR:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to update product";
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }

    console.log("🔥 HANDLE UPDATE END");
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        fetchProducts();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleStockClick = (product) => {
    setSelectedProduct(product);
    setStockValue(product.stock || 0);
    setShowStockModal(true);
  };

  const handleUpdateStock = async () => {
    try {
      setSubmitting(true);
      await productService.updateStock(selectedProduct._id, Number(stockValue));
      closeStockModal();
      fetchProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await productService.updateStatus(product._id, !product.isActive);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(product => {
    const name = product?.name || "";
    const description = product?.description || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          description.toLowerCase().includes(searchTerm.toLowerCase());
    const productCatId = product?.categoryId?._id || product?.categoryId || "";
    const matchesCategory = filterCategory === "" || productCatId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const headers = [
    { label: 'Product Details' },
    { label: 'Category' },
    { label: 'Price' },
    { label: 'Stock Level' },
    { label: 'MOQ' },
    { label: 'Status' },
    { label: 'Actions', className: 'text-right' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Product Inventory</h1>
          <p className="text-gray-500 mt-1 font-medium">Monitor stock levels and manage your product catalog</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6">
          <Plus size={20} />
          Add New Product
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
        <Card className="xl:col-span-3">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Search products by name or description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-14 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none bg-gray-50/50 focus:bg-white text-center font-medium"
              />
            </div>
            <div className="sm:w-64 relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10">
                <Filter size={20} />
              </div>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-14 pr-10 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none appearance-none bg-gray-50/50 focus:bg-white cursor-pointer font-bold text-gray-700 text-sm text-center"
                style={{ textAlignLast: 'center' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>
        </Card>
        
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between group hover:scale-[1.02] transition-all relative overflow-hidden h-full min-h-[80px]">
          <div className="relative z-10">
            <p className="text-blue-100/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Catalog</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black">{products.length}</h3>
              <span className="text-[10px] font-bold text-blue-200 uppercase">Items</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 relative z-10">
            <Package size={24} className="text-white" />
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        </div>
      </div>

      <Table headers={headers}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isLowStock = product.stock > 0 && product.stock <= 10;
            const isOutOfStock = product.stock === 0;
            
            return (
              <TableRow key={product._id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                      <img 
                        src={getProductImage(product)} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/500x500/f8fafc/64748b?text=No+Preview";
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight mb-1">{product.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                        {product.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    {product.categoryId?.name || 'Uncategorized'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-black text-gray-900">₹{product.price?.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${
                      isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                    {isOutOfStock && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-black uppercase">OUT</span>
                    )}
                    {isLowStock && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-black uppercase">LOW</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-gray-600">{product.moq || 1}</span>
                </TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleToggleStatus(product)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      product.isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {product.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {product.isActive ? 'Active' : 'Inactive'}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleStockClick(product)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"
                      title="Update Stock"
                    >
                      <TrendingUp size={18} />
                    </button>
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2 hover:bg-gray-100 text-gray-500 rounded-xl transition-all"
                      title="Edit Product"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan="7" className="py-20 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <Package size={40} className="text-gray-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">No Products Found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
                {searchTerm || filterCategory ? (
                  <Button variant="secondary" onClick={() => { setSearchTerm(""); setFilterCategory(""); }} className="mt-2">
                    Clear All Filters
                  </Button>
                ) : (
                  <Button onClick={() => setShowModal(true)} className="mt-2">
                    Add Your First Product
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </Table>

      <Modal 
        isOpen={showModal} 
        onClose={closeModal}
        title={selectedProduct ? "Edit Product" : "Create New Product"}
        size="lg"
      >
        <form onSubmit={selectedProduct ? handleUpdate : handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 hover:border-blue-400 transition-all group relative overflow-hidden">
            {imagePreview ? (
              <div className="relative w-full aspect-video sm:aspect-[2/1] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500 mb-4 border border-gray-100">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-700 uppercase tracking-widest mb-1">Product Media</p>
                  <p className="text-xs text-gray-400 font-bold">Click to upload or drag & drop</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <Input
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Premium Basmati Rice"
            required
          />
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Product Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the product features, quality, etc..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Price (₹)"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
            />
            <Input
              label="Available Stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <div className="relative">
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <Input
              label="Minimum Order Quantity"
              name="moq"
              type="number"
              value={form.moq}
              onChange={handleChange}
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="w-5 h-5 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
              Make product visible on marketplace
            </span>
          </label>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            {selectedProduct ? (
              <Button type="button" onClick={handleUpdate} loading={submitting} className="flex-1">
                Save Changes
              </Button>
            ) : (
              <Button type="submit" loading={submitting} className="flex-1">
                Create Product
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={showStockModal} 
        onClose={closeStockModal}
        title="Update Stock Level"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Product</p>
            <p className="text-xl font-black text-blue-900">{selectedProduct?.name}</p>
          </div>
          
          <Input
            label="Current Quantity in Stock"
            name="stock"
            type="number"
            value={stockValue}
            onChange={(e) => setStockValue(e.target.value)}
            className="text-lg font-bold"
          />
          
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" onClick={closeStockModal} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdateStock} loading={submitting} className="flex-1">
              Update Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;