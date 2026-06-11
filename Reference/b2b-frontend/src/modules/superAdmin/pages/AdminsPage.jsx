import { useSuperAdmin } from "../hooks/useSuperAdmin";
import AdminManagement from "../components/AdminManagement.jsx";

const AdminsPage = () => {
  const { 
    admins, 
    createAdmin,
    deleteAdmin,
    updateAdmin
  } = useSuperAdmin();

  return (
    <div className="space-y-6">
      <AdminManagement 
        admins={admins} 
        onCreateAdmin={createAdmin} 
        onDeleteAdmin={deleteAdmin} 
        onUpdateAdmin={updateAdmin} 
      />
    </div>
  );
};

export default AdminsPage;
