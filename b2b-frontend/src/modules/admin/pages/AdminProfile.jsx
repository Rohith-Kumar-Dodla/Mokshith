import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { userService } from '../../user/userService.js';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Camera, 
  Loader2, 
  ShieldCheck, 
  Save, 
  X,
  UserCircle
} from 'lucide-react';
import './AdminShared.css';

const AdminProfile = () => {
  const { user, updateUserInfo } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || user?.mobile || '',
    companyName: user?.companyName || '',
    address: user?.address || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || user.mobile || '',
        companyName: user.companyName || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await userService.updateProfileImage(formData);
      updateUserInfo(response);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile(formData);
      updateUserInfo(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-content animate-in fade-in duration-500">
      <header className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title flex items-center gap-3">
            Admin Profile
            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Account</span>
          </h1>
          <p className="page-subtitle">Manage your personal information and account security settings.</p>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)} 
              className="h-12 px-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 uppercase"
            >
              <UserCircle size={18} strokeWidth={3} />
              Edit Profile
            </Button>
          ) : (
            <Button 
              onClick={() => setIsEditing(false)} 
              className="h-12 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-black text-xs tracking-widest flex items-center gap-2 uppercase"
            >
              <X size={18} strokeWidth={3} />
              Cancel
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="admin-card p-8 flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-black overflow-hidden border-4 border-white shadow-xl">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profileImage}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.[0]?.toUpperCase() || 'A'
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-border rounded-xl shadow-lg flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-all">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            
            <h2 className="text-xl font-black text-main mb-1">{user?.name}</h2>
            <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">{user?.role?.replace('_', ' ')}</p>
            
            <div className="w-full pt-6 border-t border-border mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-xl">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Account Status</span>
                <span className="status-badge active">Active</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 rounded-xl">
                <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Security Level</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                  <ShieldCheck size={14} />
                  High
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Form */}
        <div className="lg:col-span-2">
          <div className="admin-card">
            <div className="p-6 border-bottom border-border flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-black text-main uppercase tracking-widest flex items-center gap-2">
                <User size={16} className="text-primary" />
                Personal Information
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="space-y-1">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                    className={!isEditing ? "opacity-80" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="opacity-60 bg-gray-50"
                    helperText="Email cannot be changed"
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                    className={!isEditing ? "opacity-80" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    label="Organization"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter company name"
                    className={!isEditing ? "opacity-80" : ""}
                  />
                </div>
                <div className="md:col-span-2 space-y-2 mb-6">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Work Address</label>
                  <div className="relative">
                    <div className="absolute top-4 left-4 text-muted">
                      <MapPin size={18} />
                    </div>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows="3"
                      placeholder="Enter your complete address..."
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-300 outline-none resize-none ${
                        !isEditing 
                          ? 'border-gray-100 bg-gray-50/50 text-muted opacity-80' 
                          : 'border-gray-100 bg-gray-50/50 focus:border-primary focus:bg-white text-main'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end pt-6 border-t border-border mt-4">
                  <Button 
                    type="submit" 
                    loading={loading}
                    className="h-14 px-10 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 uppercase"
                  >
                    <Save size={20} strokeWidth={3} />
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
