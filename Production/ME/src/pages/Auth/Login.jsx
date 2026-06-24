import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FaMobile, FaLock, FaShieldAlt } from 'react-icons/fa';
import { ArrowRight } from 'lucide-react';
import PasswordInput from '../../components/common/PasswordInput';
import { getDashboardRoute } from '../../utils/roleMap';

const Login = () => {
  const navigate = useNavigate();
  const { login, verify2FALogin } = useAuth();
  const [formData, setFormData] = useState({ mobile: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [pending2FA, setPending2FA] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.mobile, formData.password);
      if (result?.requires2FA) {
        setPending2FA({ userId: result.userId, message: result.message });
        return;
      }
      navigate(getDashboardRoute(result.role));
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await verify2FALogin(pending2FA.userId, otpCode);
      navigate(getDashboardRoute(result.role));
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
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
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                {pending2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {pending2FA ? pending2FA.message || 'Enter the code from your authenticator app' : 'Sign in to your account'}
              </p>
            </div>

            {error && (
              <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">{error}</div>
            )}

            {!pending2FA ? (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <div className="relative">
                    <FaMobile className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="input-field pl-10 h-12" placeholder="Enter your 10-digit mobile number" pattern="[0-9]{10}" maxLength={10} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <PasswordInput
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-field pl-10 h-12"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-secondary hover:text-primary font-medium">Forgot password?</Link>
                </div>
                <Button type="submit" className="w-full h-12 group" disabled={loading}>
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
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
            ) : (
              <form onSubmit={handle2FASubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                  <div className="relative">
                    <FaShieldAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="input-field pl-10 h-12" placeholder="6-digit code or backup code" maxLength={8} required autoFocus />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
                <button type="button" onClick={() => { setPending2FA(null); setOtpCode(''); }} className="w-full text-sm text-gray-600 hover:text-gray-900">
                  Back to login
                </button>
              </form>
            )}

            {!pending2FA && (
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-sm sm:text-base text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="text-secondary hover:text-primary font-semibold">Register here</Link>
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
