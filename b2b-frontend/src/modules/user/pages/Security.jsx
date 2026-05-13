import { useState, useEffect } from 'react';
import { userService } from '../userService.js';
import Card from '../../../components/ui/Card.jsx';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog.jsx';
import { Shield, Lock, AlertTriangle, Key, ChevronRight, Monitor, Smartphone, Globe, MapPin } from 'lucide-react';

const Security = () => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [fetchingSessions, setFetchingSessions] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setFetchingSessions(true);
      const data = await userService.getActiveSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setFetchingSessions(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await userService.logoutAllDevices();
      alert('Successfully logged out from all other devices.');
      setShowLogoutConfirm(false);
      fetchSessions();
    } catch (err) {
      alert(err.message || 'Failed to logout from all devices');
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      alert('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      alert(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="mb-12 border-b border-slate-200 pb-8">
        <div className="flex items-center space-x-3 mb-2 text-sky-600">
          <Shield size={20} className="stroke-[2.5px]" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Privacy & Security</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Security Settings</h1>
        <p className="text-slate-500 text-lg font-medium">Manage your password, sessions, and overall account protection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-10">
          <section>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Safety Guidelines</h3>
            <div className="space-y-4">
              {[
                { title: 'Strong Password', desc: 'Use 8+ characters with a mix of letters and numbers.', icon: <Lock size={18} /> },
                { title: 'Regular Updates', desc: 'Change your password every 90 days for maximum safety.', icon: <Key size={18} /> },
                { title: 'Session Control', desc: 'Monitor and logout from unfamiliar devices instantly.', icon: <Shield size={18} /> }
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Active Devices Section */}
          <section className="pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Devices</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-widest">
                {sessions.length} Active
              </span>
            </div>
            <div className="space-y-4">
              {fetchingSessions ? (
                <div className="py-10 text-center animate-pulse">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Scanning Sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400">No other active sessions detected.</p>
                </div>
              ) : (
                sessions.map((session, i) => (
                  <div key={session._id || i} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm group">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-slate-50 text-slate-400 group-hover:text-sky-500 transition-colors rounded-2xl flex-shrink-0">
                        {session.deviceName?.toLowerCase().includes('phone') ? <Smartphone size={20} /> : <Monitor size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 truncate mb-0.5">{session.deviceName || 'Unknown Device'}</h4>
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Globe size={10} />
                          <span>{session.browser || 'Browser'} • {session.os || 'OS'}</span>
                        </div>
                      </div>
                      {session._id === 'current' && (
                        <span className="flex-shrink-0 px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        <MapPin size={10} />
                        <span>{session.location || 'Unknown Location'}</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {new Date(session.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="pt-8 border-t border-slate-100">
            <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-6 px-1">Danger Zone</h3>
            <div className="p-8 rounded-[2.5rem] bg-rose-50 border border-rose-100 shadow-sm shadow-rose-100">
              <div className="flex items-center space-x-3 text-rose-600 mb-4">
                <AlertTriangle size={20} className="stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-tight">System-wide Logout</h4>
              </div>
              <p className="text-xs text-rose-700/70 font-bold mb-8 leading-relaxed">
                Immediately terminate all active sessions across all devices. This will revoke access from everywhere except this current browser.
              </p>
              <button 
                className="w-full py-4 bg-white text-rose-600 border border-rose-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm active:scale-[0.98] shadow-rose-200/20"
                onClick={() => setShowLogoutConfirm(true)}
              >
                Logout from All Devices
              </button>
            </div>
          </section>
        </div>

        {/* Main Settings Form */}
        <div className="lg:col-span-8">
          <Card className="p-0 overflow-hidden shadow-2xl shadow-slate-200/50 border-slate-100 rounded-[3rem] bg-white">
            <div className="px-12 py-12 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Password Management</h2>
                <div className="px-5 py-2 bg-sky-100 text-sky-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-sky-200 shadow-sm shadow-sky-100">
                  Identity Shield
                </div>
              </div>
              <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-xl">Update your credentials to maintain high security standards and protect your business data.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-12 lg:p-16 space-y-12">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Password</label>
                  <a href="#" className="text-[10px] font-black text-sky-500 uppercase tracking-widest hover:text-sky-600 transition-colors">Recover Password?</a>
                </div>
                <Input
                  name="currentPassword"
                  type="password"
                  placeholder="Verify existing password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  className="h-20 rounded-[1.5rem] border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-sky-500/5 focus:border-sky-500 transition-all text-lg font-bold px-8 shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">New Password</label>
                  <Input
                    name="newPassword"
                    type="password"
                    placeholder="New secure code"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="h-20 rounded-[1.5rem] border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-sky-500/5 focus:border-sky-500 transition-all text-lg font-bold px-8 shadow-sm"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Confirm Password</label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Verify new code"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-20 rounded-[1.5rem] border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-sky-500/5 focus:border-sky-500 transition-all text-lg font-bold px-8 shadow-sm"
                  />
                </div>
              </div>

              <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col xl:flex-row items-center justify-between gap-10">
                <div className="flex items-center space-x-6 text-slate-400 max-w-md bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-sky-500 flex-shrink-0">
                    <Shield size={20} />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed">
                    A successful password change will automatically invalidate all other active sessions for your protection.
                  </p>
                </div>
                <Button 
                  type="submit" 
                  loading={loading} 
                  className="w-full xl:w-auto px-16 h-20 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-1 transition-all active:scale-95"
                >
                  <span className="flex items-center space-x-3">
                    <span>Finalize Update</span>
                    <ChevronRight size={18} />
                  </span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Logout All Devices Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => !loggingOutAll && setShowLogoutConfirm(false)}
        onConfirm={handleLogoutAll}
        loading={loggingOutAll}
        title="Revoke All Access"
        message="Are you sure you want to log out from all other devices? You will remain signed in on this current device only."
        confirmText="Revoke Access"
        variant="danger"
      />
    </div>
  );
};

export default Security;
