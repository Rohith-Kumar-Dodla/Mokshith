import { useSearch } from "./hooks/useSearch.js";
import SearchFilters from "./components/SearchFilters.jsx";
import SearchResults from "./components/SearchResults.jsx";

const SearchPage = () => {
  const { results, loading, query, activeTab, search, changeTab } = useSearch();

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Search</h1>
      <p className="text-gray-500 mb-8">Find products, vendors, and orders across the platform</p>

      <SearchFilters
        query={query}
        activeTab={activeTab}
        onQueryChange={(q) => search(q, activeTab)}
        onTabChange={changeTab}
      />

      <div className="mt-8">
        <SearchResults
          results={results}
          activeTab={activeTab}
          loading={loading}
          query={query}
        />
      </div>
    </div>
  );
};

export default SearchPage;
