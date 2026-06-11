import React from 'react';
import { FiFileText, FiDownload, FiTrendingUp, FiPackage, FiUsers, FiTruck, FiDollarSign } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';

const Reports = () => {
  const reportCards = [
    {
      title: 'Sales Report',
      description: 'Comprehensive sales data and revenue analysis',
      icon: FiDollarSign,
      color: 'green',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      title: 'Inventory Report',
      description: 'Stock levels, movement, and valuation',
      icon: FiPackage,
      color: 'blue',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      title: 'Vendor Report',
      description: 'Vendor performance and order history',
      icon: FiUsers,
      color: 'purple',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      title: 'Order Report',
      description: 'Order statistics and fulfillment metrics',
      icon: FiFileText,
      color: 'orange',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      title: 'Delivery Report',
      description: 'Delivery partner performance and efficiency',
      icon: FiTruck,
      color: 'blue',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      title: 'Revenue Report',
      description: 'Financial performance and profit analysis',
      icon: FiTrendingUp,
      color: 'green',
      formats: ['PDF', 'Excel', 'CSV']
    }
  ];

  const colorClasses = {
    green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500', border: 'border-green-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500', border: 'border-orange-200' },
  };

  const handleDownload = (format) => {
    console.log(`Downloading report in ${format} format`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and download various business reports"
      />

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {reportCards.map((report, index) => {
          const colors = colorClasses[report.color];
          return (
            <Card key={index} className="hover:shadow-md transition-shadow p-4 sm:p-6">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-3 sm:mb-4`}>
                <report.icon size={18} sm:size={24} className={colors.icon} />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{report.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{report.description}</p>
              
              <div className="pt-3 sm:pt-4 border-t border-gray-100">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Download Format</p>
                <div className="flex gap-1.5 sm:gap-2">
                  {report.formats.map((format) => (
                    <button
                      key={format}
                      onClick={() => handleDownload(format)}
                      className={`flex-1 py-2 px-2 sm:px-3 border ${colors.border} rounded-lg hover:${colors.bg} transition-colors text-xs sm:text-sm font-medium ${colors.text}`}
                    >
                      <FiDownload size={12} sm:size={14} className="inline mr-0.5 sm:mr-1" />
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Report Generation Section */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Custom Report Generation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Report Type</label>
            <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select report type</option>
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="vendor">Vendor Report</option>
              <option value="order">Order Report</option>
              <option value="delivery">Delivery Report</option>
              <option value="revenue">Revenue Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date Range</label>
            <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select date range</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Format</label>
            <select className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select format</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
        <div className="mt-4 sm:mt-6 flex justify-end">
          <button className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
            <FiDownload size={14} sm:size={18} />
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Generate</span>
          </button>
        </div>
      </Card>

      {/* Recent Reports */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Recent Reports</h2>
        <div className="space-y-2 sm:space-y-3">
          {[
            { name: 'Sales Report - June 2024', date: '2024-06-05', format: 'PDF', size: '2.4 MB' },
            { name: 'Inventory Report - May 2024', date: '2024-05-31', format: 'Excel', size: '1.8 MB' },
            { name: 'Vendor Performance - Q2 2024', date: '2024-06-01', format: 'PDF', size: '3.2 MB' },
            { name: 'Delivery Report - May 2024', date: '2024-05-30', format: 'CSV', size: '890 KB' },
          ].map((report, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiFileText size={16} sm:size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{report.name}</p>
                  <p className="text-xs text-gray-600">{report.date} • {report.format} • {report.size}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]">
                <FiDownload size={14} sm:size={18} className="text-blue-600" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
