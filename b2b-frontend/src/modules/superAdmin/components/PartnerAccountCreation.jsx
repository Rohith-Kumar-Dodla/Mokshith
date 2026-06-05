import React, { useState } from 'react';
import { UserPlus, Truck, Building2, ShieldCheck, Phone, Mail, MapPin, Key, CreditCard, Eye } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';

const PartnerAccountCreation = ({ 
  onCreateB2B, 
  onCreateDelivery,
  onViewB2B,
  onViewDelivery,
  listLoading
}) => {
  const [showB2BModal, setShowB2BModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [b2bForm, setB2bForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    businessName: '',
    ownerName: '',
    gstNumber: '',
    businessAddress: '',
    creditLimit: 50000
  });

  const [deliveryForm, setDeliveryForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    vehicleType: 'TWO_WHEELER',
    vehicleNumber: '',
    licenseNumber: ''
  });

  const handleB2BSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...b2bForm,
      name: b2bForm.name || b2bForm.ownerName
    };
    try {
      await onCreateB2B(payload);
      setShowB2BModal(false);
      setB2bForm({
        name: '', email: '', mobile: '', password: '',
        businessName: '', ownerName: '', gstNumber: '',
        businessAddress: '', creditLimit: 50000
      });
      alert("B2B Customer account created successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateDelivery(deliveryForm);
      setShowDeliveryModal(false);
      setDeliveryForm({
        name: '', email: '', mobile: '', password: '',
        vehicleType: 'TWO_WHEELER', vehicleNumber: '', licenseNumber: ''
      });
      alert("Delivery Partner account created successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <UserPlus size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Partner Onboarding</h3>
          <p className="text-xs text-gray-500">Create and manage strategic partner accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* B2B Customer Creation Card */}
        <div className="p-6 rounded-2xl border-2 border-dashed border-gray-100 hover:border-rose-100 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">
              B2B Partner
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">B2B Customer Account</h4>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Register new wholesalers and distributors. Set credit limits and business credentials directly.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => setShowB2BModal(true)}
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              Onboard B2B Customer
            </Button>
            <Button 
              onClick={onViewB2B}
              disabled={listLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              {listLoading ? 'Accessing...' : 'View B2B Accounts'}
            </Button>
          </div>
        </div>

        {/* Delivery Partner Creation Card */}
        <div className="p-6 rounded-2xl border-2 border-dashed border-gray-100 hover:border-rose-100 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck size={24} />
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">
              Logistics
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Delivery Partner Account</h4>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Expand your logistics fleet. Register new delivery personnel with vehicle and license verification.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => setShowDeliveryModal(true)}
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              Register Delivery Partner
            </Button>
            <Button 
              onClick={onViewDelivery}
              disabled={listLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              {listLoading ? 'Accessing...' : 'View Delivery Partners'}
            </Button>
          </div>
        </div>
      </div>

      {/* B2B Modal */}
      {showB2BModal && (
        <Modal title="Onboard New B2B Customer" onClose={() => setShowB2BModal(false)}>
          <form onSubmit={handleB2BSubmit} className="space-y-4 pt-4 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Business Name" 
                value={b2bForm.businessName} 
                onChange={(e) => setB2bForm({...b2bForm, businessName: e.target.value})} 
                icon={<Building2 size={16}/>}
                required 
              />
              <Input 
                label="GST Number" 
                value={b2bForm.gstNumber} 
                onChange={(e) => setB2bForm({...b2bForm, gstNumber: e.target.value})} 
                icon={<ShieldCheck size={16}/>}
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Owner Name" 
                value={b2bForm.ownerName} 
                onChange={(e) => setB2bForm({...b2bForm, ownerName: e.target.value, name: e.target.value})} 
                icon={<UserPlus size={16}/>}
                required 
              />
              <Input 
                label="Contact Mobile" 
                value={b2bForm.mobile} 
                onChange={(e) => setB2bForm({...b2bForm, mobile: e.target.value})} 
                icon={<Phone size={16}/>}
                required 
              />
            </div>
            <Input 
              label="Email Address" 
              type="email" 
              value={b2bForm.email} 
              onChange={(e) => setB2bForm({...b2bForm, email: e.target.value})} 
              icon={<Mail size={16}/>}
              required 
            />
            <Input 
              label="Secure Password" 
              type="password" 
              value={b2bForm.password} 
              onChange={(e) => setB2bForm({...b2bForm, password: e.target.value})} 
              icon={<Key size={16}/>}
              required 
            />
            <Input 
              label="Business Address" 
              value={b2bForm.businessAddress} 
              onChange={(e) => setB2bForm({...b2bForm, businessAddress: e.target.value})} 
              icon={<MapPin size={16}/>}
              required 
            />
            <Input 
              label="Initial Credit Limit (₹)" 
              type="number" 
              value={b2bForm.creditLimit} 
              onChange={(e) => setB2bForm({...b2bForm, creditLimit: e.target.value})} 
              icon={<CreditCard size={16}/>}
              required 
            />
            
            <div className="flex gap-4 pt-6 sticky bottom-0 bg-white">
              <Button type="button" variant="secondary" onClick={() => setShowB2BModal(false)} className="flex-1 h-12">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1 h-12 bg-gray-900 text-white">
                {loading ? 'Processing...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <Modal title="Register Delivery Partner" onClose={() => setShowDeliveryModal(false)}>
          <form onSubmit={handleDeliverySubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                value={deliveryForm.name} 
                onChange={(e) => setDeliveryForm({...deliveryForm, name: e.target.value})} 
                icon={<UserPlus size={16}/>}
                required 
              />
              <Input 
                label="Email Address" 
                type="email" 
                value={deliveryForm.email} 
                onChange={(e) => setDeliveryForm({...deliveryForm, email: e.target.value})} 
                icon={<Mail size={16}/>}
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Mobile Number" 
                value={deliveryForm.mobile} 
                onChange={(e) => setDeliveryForm({...deliveryForm, mobile: e.target.value})} 
                icon={<Phone size={16}/>}
                required 
              />
              <Input 
                label="Secure Password" 
                type="password" 
                value={deliveryForm.password} 
                onChange={(e) => setDeliveryForm({...deliveryForm, password: e.target.value})} 
                icon={<Key size={16}/>}
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Vehicle Classification</label>
              <select 
                value={deliveryForm.vehicleType} 
                onChange={(e) => setDeliveryForm({...deliveryForm, vehicleType: e.target.value})}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-bold text-sm"
              >
                <option value="TWO_WHEELER">Two Wheeler (Bike)</option>
                <option value="THREE_WHEELER">Three Wheeler (Auto)</option>
                <option value="FOUR_WHEELER">Four Wheeler (Van)</option>
                <option value="HEAVY_VEHICLE">Heavy Vehicle (Truck)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Vehicle Number" 
                value={deliveryForm.vehicleNumber} 
                onChange={(e) => setDeliveryForm({...deliveryForm, vehicleNumber: e.target.value})} 
                icon={<Truck size={16}/>}
                required 
                placeholder="e.g. MH-01-AB-1234" 
              />
              <Input 
                label="License Number" 
                value={deliveryForm.licenseNumber} 
                onChange={(e) => setDeliveryForm({...deliveryForm, licenseNumber: e.target.value})} 
                icon={<ShieldCheck size={16}/>}
                required 
              />
            </div>
            
            <div className="flex gap-4 pt-6">
              <Button type="button" variant="secondary" onClick={() => setShowDeliveryModal(false)} className="flex-1 h-12">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1 h-12 bg-gray-900 text-white">
                {loading ? 'Processing...' : 'Register Partner'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PartnerAccountCreation;