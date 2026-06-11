import { useSuperAdmin } from "../hooks/useSuperAdmin";
import CategoryControl from "../components/CategoryControl.jsx";

const CategoriesPage = () => {
  const { 
    categories, 
    createCategory,
    deleteCategory,
    updateCategory
  } = useSuperAdmin();

  return (
    <div className="space-y-6">
      <CategoryControl 
        categories={categories} 
        onCreateCategory={createCategory} 
        onDeleteCategory={deleteCategory} 
        onUpdateCategory={updateCategory} 
      />
    </div>
  );
};

export default CategoriesPage;
