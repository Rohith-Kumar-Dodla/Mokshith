import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaBuilding } from 'react-icons/fa';
import { ArrowRight } from 'lucide-react';
import PasswordInput from '../../components/common/PasswordInput';
import VendorAddressFields from '../../components/vendor/VendorAddressFields';
import { getPasswordRequirementsText, validatePasswordLength } from '../../utils/authValidationPolicy';
import { EMPTY_VENDOR_ADDRESS, buildVendorAddressPayload } from '../../utils/vendorAddress';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    gstNumber: '',
    password: '',
    confirmPassword: '',
    address: { ...EMPTY_VENDOR_ADDRESS },
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    } else if (formData.ownerName.length < 2) {
      newErrors.ownerName = 'Owner name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (formData.gstNumber.trim() && !/^[a-zA-Z0-9]{15}$/.test(formData.gstNumber.trim())) {
      newErrors.gstNumber = 'Invalid GST number format';
    }

    const addressErrors = {};
    const { address } = formData;
    if (!address.line1?.trim()) addressErrors.line1 = 'Address line 1 is required';
    if (!address.area?.trim()) addressErrors.area = 'Area is required';
    if (!address.city?.trim()) addressErrors.city = 'City is required';
    if (!address.district?.trim()) addressErrors.district = 'District is required';
    if (!address.state?.trim()) addressErrors.state = 'State is required';
    if (!address.country?.trim()) addressErrors.country = 'Country is required';
    if (!/^\d{6}$/.test(String(address.pincode || '').replace(/\D/g, ''))) {
      addressErrors.pincode = 'Pincode must be 6 digits';
    }
    if (Object.keys(addressErrors).length > 0) {
      newErrors.address = addressErrors;
    }

    const passwordError = validatePasswordLength(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register({
        businessName: formData.businessName.trim(),
        ownerName: formData.ownerName.trim(),
        name: formData.ownerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone,
        gstNumber: formData.gstNumber.trim(),
        password: formData.password,
        address: buildVendorAddressPayload(formData.address),
      });

      navigate('/login', {
        state: {
          message: 'Vendor registration submitted successfully. Waiting for Super Admin approval.',
          email: formData.email,
        },
      });
    } catch (err) {
      setErrors({
        ...errors,
        submit: err?.message || 'Registration failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Vendor Registration</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Register your business to join our B2B platform
              </p>
            </div>

            {errors.submit && (
              <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={`input-field pl-10 h-12 ${errors.businessName ? 'border-danger' : ''}`}
                    placeholder="Enter your business name"
                    required
                  />
                </div>
                {errors.businessName && (
                  <p className="text-danger text-sm mt-1">{errors.businessName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className={`input-field pl-10 h-12 ${errors.ownerName ? 'border-danger' : ''}`}
                    placeholder="Enter owner name"
                    required
                  />
                </div>
                {errors.ownerName && (
                  <p className="text-danger text-sm mt-1">{errors.ownerName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`input-field pl-10 h-12 ${errors.email ? 'border-danger' : ''}`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-danger text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`input-field pl-10 h-12 ${errors.phone ? 'border-danger' : ''}`}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-danger text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number (optional)</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className={`input-field h-12 uppercase ${errors.gstNumber ? 'border-danger' : ''}`}
                  placeholder="Enter GST number"
                />
                {errors.gstNumber && (
                  <p className="text-danger text-sm mt-1">{errors.gstNumber}</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Business Address</h2>
                <p className="text-sm text-gray-500 mb-4">
                  This address will be used as your default delivery address for orders.
                </p>
                <VendorAddressFields
                  value={formData.address}
                  onChange={(address) => setFormData({ ...formData, address })}
                  errors={errors.address || {}}
                  idPrefix="register-address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <PasswordInput
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`input-field pl-10 h-12 ${errors.password ? 'border-danger' : ''}`}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  {errors.password && (
                    <p className="text-danger text-sm mt-1">{errors.password}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">{getPasswordRequirementsText()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <PasswordInput
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`input-field pl-10 h-12 ${errors.confirmPassword ? 'border-danger' : ''}`}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-danger text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 group"
                disabled={loading}
              >
                <span>{loading ? 'Creating Account...' : 'Register as Vendor'}</span>
                {!loading && (
                  <ArrowRight
                    size={18}
                    strokeWidth={2}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-secondary hover:text-primary font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
