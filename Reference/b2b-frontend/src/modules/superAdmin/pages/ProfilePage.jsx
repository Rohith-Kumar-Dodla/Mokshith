import { User, Settings } from 'lucide-react';

const ProfilePage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={32} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Settings</h2>
        <p className="text-gray-500">Manage your account preferences and profile</p>
      </div>
    </div>
  );
};

export default ProfilePage;
