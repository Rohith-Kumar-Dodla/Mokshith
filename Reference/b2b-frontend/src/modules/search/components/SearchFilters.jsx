import { Search } from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'products', label: 'Products' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'orders', label: 'Orders' },
];

const SearchFilters = ({ query, activeTab, onQueryChange, onTabChange }) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search products, vendors, or orders..."
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
        />
      </div>
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchFilters;
