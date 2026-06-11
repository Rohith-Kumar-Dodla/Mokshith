import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FaUser, FaLock, FaArrowRight } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password, formData.role);
      
      // Role-based redirection
      const roleRoutes = {
        'super-admin': '/super-admin/dashboard',
        'admin': '/admin/dashboard',
        'vendor': '/vendor/dashboard',
        'delivery': '/delivery/dashboard',
      };
      
      navigate(roleRoutes[formData.role]);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);

    try {
      await login(`demo@${role}.com`, 'demo123', role);
      
      const roleRoutes = {
        'super-admin': '/super-admin/dashboard',
        'admin': '/admin/dashboard',
        'vendor': '/vendor/dashboard',
        'delivery': '/delivery/dashboard',
      };
      
      navigate(roleRoutes[role]);
    } catch (err) {
      setError('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Welcome Back</h1>
              <p className="text-sm sm:text-base text-gray-600">Sign in to your account</p>
            </div>

            {error && (
              <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10 h-12"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-10 h-12"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field h-12"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="vendor">Vendor</option>
                  <option value="delivery">Delivery Partner</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <FaArrowRight className="ml-2" />
              </Button>
            </form>

            {/* Demo Login Section */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-3 sm:mb-4">
                Quick Demo Login
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                  className="h-11"
                >
                  Admin Demo
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('vendor')}
                  disabled={loading}
                  className="h-11"
                >
                  Vendor Demo
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('delivery')}
                  disabled={loading}
                  className="h-11"
                >
                  Delivery Demo
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('super-admin')}
                  disabled={loading}
                  className="h-11"
                >
                  Super Admin Demo
                </Button>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-secondary hover:text-primary font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
