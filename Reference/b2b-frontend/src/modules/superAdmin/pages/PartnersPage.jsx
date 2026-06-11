import { useState } from "react";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { Building2, Truck, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import PasswordField from "../../../components/ui/PasswordField";

const PartnersPage = () => {
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  
  // Vendor form state
  const [vendorForm, setVendorForm] = useState({
    businessName: '',
    gstNumber: '',
    ownerName: '',
    contactMobile: '',
    email: '',
    password: '',
    businessAddress: '',
    creditLimit: '50000'
  });

  // Delivery partner form state
  const [deliveryForm, setDeliveryForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: ''
  });

  const { 
    createB2BCustomer,
    createDeliveryPartner
  } = useSuperAdmin();

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    try {
      await createB2BCustomer(vendorForm);
      setVendorModalOpen(false);
      setVendorForm({
        businessName: '',
        gstNumber: '',
        ownerName: '',
        contactMobile: '',
        email: '',
        password: '',
        businessAddress: '',
        creditLimit: '50000'
      });
      alert('Vendor account created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    try {
      await createDeliveryPartner(deliveryForm);
      setDeliveryModalOpen(false);
      setDeliveryForm({
        fullName: '',
        email: '',
        mobile: '',
        password: '',
        vehicleType: '',
        vehicleNumber: '',
        licenseNumber: ''
      });
      alert('Delivery partner registered successfully!');
    } catch (err) {
      alert(err.message);
    }
  };


  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Management</h1>
        <p className="text-base text-gray-500">Manage vendors and logistics partners from a centralized onboarding system.</p>
      </div>

      {/* Onboarding Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Onboarding Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="mb-6">
            <div className="p-4 bg-blue-50 rounded-2xl w-fit mb-4">
              <Building2 size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Onboarding</h2>
            <p className="text-gray-500 text-base mb-4">Register wholesalers, distributors, and business vendors.</p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">Manage suppliers efficiently</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">Credit-enabled onboarding</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">Business verification</span>
            </div>
          </div>

          <Button
            onClick={() => setVendorModalOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Onboard Vendor
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>

        {/* Delivery Partner Onboarding Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="mb-6">
            <div className="p-4 bg-blue-50 rounded-2xl w-fit mb-4">
              <Truck size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Partner Onboarding</h2>
            <p className="text-gray-500 text-base mb-4">Register logistics and delivery personnel.</p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">Fleet management</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">Vehicle verification</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">Delivery operations</span>
            </div>
          </div>

          <Button
            onClick={() => setDeliveryModalOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Register Partner
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Vendor Onboarding Modal */}
      <Modal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title="Vendor Onboarding"
        size="xl"
      >
        <form onSubmit={handleVendorSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              value={vendorForm.businessName}
              onChange={(e) => setVendorForm({...vendorForm, businessName: e.target.value})}
              required
              placeholder="Enter business name"
            />
            <Input
              label="GST Number"
              value={vendorForm.gstNumber}
              onChange={(e) => setVendorForm({...vendorForm, gstNumber: e.target.value})}
              required
              placeholder="Enter GST number"
            />
            <Input
              label="Owner Name"
              value={vendorForm.ownerName}
              onChange={(e) => setVendorForm({...vendorForm, ownerName: e.target.value})}
              required
              placeholder="Enter owner name"
            />
            <Input
              label="Contact Mobile"
              value={vendorForm.contactMobile}
              onChange={(e) => setVendorForm({...vendorForm, contactMobile: e.target.value})}
              required
              placeholder="Enter mobile number"
            />
            <Input
              label="Email Address"
              type="email"
              value={vendorForm.email}
              onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
              required
              placeholder="Enter email address"
            />
            <PasswordField
              label="Secure Password"
              value={vendorForm.password}
              onChange={(e) => setVendorForm({...vendorForm, password: e.target.value})}
              required
              placeholder="Enter secure password"
            />
            <Input
              label="Initial Credit Limit"
              type="number"
              value={vendorForm.creditLimit}
              onChange={(e) => setVendorForm({...vendorForm, creditLimit: e.target.value})}
              required
              placeholder="50000"
            />
            <div className="md:col-span-2">
              <Input
                label="Business Address"
                value={vendorForm.businessAddress}
                onChange={(e) => setVendorForm({...vendorForm, businessAddress: e.target.value})}
                required
                placeholder="Enter complete business address"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setVendorModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delivery Partner Onboarding Modal */}
      <Modal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        title="Delivery Partner Registration"
        size="xl"
      >
        <form onSubmit={handleDeliverySubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={deliveryForm.fullName}
              onChange={(e) => setDeliveryForm({...deliveryForm, fullName: e.target.value})}
              required
              placeholder="Enter full name"
            />
            <Input
              label="Email Address"
              type="email"
              value={deliveryForm.email}
              onChange={(e) => setDeliveryForm({...deliveryForm, email: e.target.value})}
              required
              placeholder="Enter email address"
            />
            <Input
              label="Mobile Number"
              value={deliveryForm.mobile}
              onChange={(e) => setDeliveryForm({...deliveryForm, mobile: e.target.value})}
              required
              placeholder="Enter mobile number"
            />
            <PasswordField
              label="Secure Password"
              value={deliveryForm.password}
              onChange={(e) => setDeliveryForm({...deliveryForm, password: e.target.value})}
              required
              placeholder="Enter secure password"
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Vehicle Classification
              </label>
              <select
                value={deliveryForm.vehicleType}
                onChange={(e) => setDeliveryForm({...deliveryForm, vehicleType: e.target.value})}
                required
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all"
              >
                <option value="">Select vehicle type</option>
                <option value="two_wheeler">Two Wheeler (Bike)</option>
                <option value="three_wheeler">Three Wheeler</option>
                <option value="mini_truck">Mini Truck</option>
                <option value="truck">Truck</option>
              </select>
            </div>
            <Input
              label="Vehicle Number"
              value={deliveryForm.vehicleNumber}
              onChange={(e) => setDeliveryForm({...deliveryForm, vehicleNumber: e.target.value})}
              required
              placeholder="e.g. MH-01-AB-1234"
            />
            <Input
              label="License Number"
              value={deliveryForm.licenseNumber}
              onChange={(e) => setDeliveryForm({...deliveryForm, licenseNumber: e.target.value})}
              required
              placeholder="Enter license number"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setDeliveryModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Register Partner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartnersPage;
