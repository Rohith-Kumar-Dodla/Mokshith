import { useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import authService from '../../services/authService';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setDevResetUrl('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(identifier.trim());
      const payload = response?.data ?? response;
      setSuccess(payload?.message || 'If an account exists, a reset link has been sent.');
      if (payload?.resetUrl) {
        setDevResetUrl(payload.resetUrl);
      }
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Failed to send reset link'));
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
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Forgot Password</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Enter your email or mobile number to receive a reset link
              </p>
            </div>

            {error && (
              <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {success}
                {devResetUrl && (
                  <p className="mt-2 text-xs break-all">
                    Dev reset link: <a href={devResetUrl} className="underline">{devResetUrl}</a>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email or Mobile</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-field pl-10 h-12"
                    placeholder="email@example.com or 10-digit mobile"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary font-semibold">
                <FaArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
