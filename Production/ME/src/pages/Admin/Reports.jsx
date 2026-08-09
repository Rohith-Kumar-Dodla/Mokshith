import React, { useCallback, useEffect, useState } from 'react';
import { getUserFacingErrorMessage } from '../../utils/apiResponse';
import { FiFileText, FiDownload, FiPackage, FiUsers, FiTruck } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import analyticsService from '../../services/analyticsService';
import adminService from '../../services/adminService';
import { downloadCsv } from '../../utils/exportCsv';

const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [format, setFormat] = useState('csv');

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError('');
      try {
        // Do not fetch financial analytics here. Admin should not receive revenue data.
        const [deliveryPayload, statsPayload] = await Promise.all([
          analyticsService.getDeliveryAnalytics().catch(() => null),
          adminService.getStats(),
        ]);
        setAnalytics(null);
        setStats(statsPayload?.data ?? statsPayload);
        setAnalytics((prev) => prev); // keep analytics null for Admin
      } catch (err) {
        setError(getUserFacingErrorMessage(err, 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const dashboard = analytics?.dashboard || {};
  const salesData = analytics?.salesData || analytics?.orderTrends || [];
  const topProducts = analytics?.topProducts || [];
  const categoryData = analytics?.categoryData || [];

  const buildSalesRows = useCallback(() => salesData.map((entry) => [
    entry.name,
    entry.orders ?? 0,
    // revenue removed for Admin exports
  ]), [salesData]);

  const buildProductRows = useCallback(() => topProducts.map((product) => [
    product.name,
    product.category || 'Uncategorized',
    product.sales ?? 0,
    // revenue removed for Admin exports
  ]), [topProducts]);

  const buildSummaryRows = useCallback(() => ([
    ['Total Orders', dashboard.totalOrders ?? stats?.totalOrders ?? 0],
    ['Active Customers', dashboard.activeCustomers ?? 0],
    ['Pending Deliveries', dashboard.pendingDeliveries ?? 0],
    ['Total Vendors', stats?.totalVendors ?? 0],
    ['Total Delivery Partners', stats?.totalDeliveryPartners ?? 0],
  ]), [dashboard, stats]);

  const handleExport = async (type, selectedFormat = 'csv') => {
    if (selectedFormat !== 'csv') {
      setError('Only CSV export is supported currently. PDF and Excel require backend export endpoints.');
      return;
    }

    setExporting(type);
    setError('');

    try {
      if (type === 'sales') {
        downloadCsv(
          `${type}-report-${dateRange}.csv`,
          ['Period', 'Orders'],
          buildSalesRows()
        );
      } else if (type === 'order') {
        downloadCsv(
          `order-summary-${dateRange}.csv`,
          ['Metric', 'Value'],
          buildSummaryRows()
        );
      } else if (type === 'inventory') {
        downloadCsv(
          `category-report-${dateRange}.csv`,
          ['Category', 'Value'],
          categoryData.map((entry) => [entry.name, entry.value])
        );
      } else if (type === 'vendor') {
        downloadCsv(
          `vendor-summary-${dateRange}.csv`,
          ['Metric', 'Value'],
          [
            ['Total Vendors', stats?.totalVendors ?? 0],
            ['Pending Approvals', stats?.pendingApprovals ?? 0],
            ['Total Users', stats?.totalUsers ?? 0],
          ]
        );
      } else if (type === 'delivery') {
        const deliveryPayload = await analyticsService.getDeliveryAnalytics();
        const delivery = deliveryPayload?.data ?? deliveryPayload;
        downloadCsv(
          `delivery-report-${dateRange}.csv`,
          ['Metric', 'Value'],
          [
            ['Total Deliveries', delivery?.totalDeliveries ?? 0],
            ['Completed', delivery?.completedDeliveries ?? 0],
            ['Active', delivery?.activeDeliveries ?? 0],
            ['Failed', delivery?.failedDeliveries ?? 0],
            ['Completion Rate', `${delivery?.completionRate ?? 0}%`],
          ]
        );
      } else {
        downloadCsv(
          `products-report-${dateRange}.csv`,
          ['Product', 'Category', 'Sales', 'Revenue'],
          buildProductRows()
        );
      }
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Export failed');
    } finally {
      setExporting('');
    }
  };

  const reportCards = [
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Sales data and operational analysis',
      icon: FiFileText,
      color: 'green',
    },
    {
      id: 'inventory',
      title: 'Category Report',
      description: 'Category distribution from live analytics',
      icon: FiPackage,
      color: 'blue',
    },
    {
      id: 'vendor',
      title: 'Vendor Report',
      description: 'Vendor counts and approval metrics',
      icon: FiUsers,
      color: 'purple',
    },
    {
      id: 'order',
      title: 'Order Report',
      description: 'Platform order and delivery summary',
      icon: FiFileText,
      color: 'orange',
    },
    {
      id: 'delivery',
      title: 'Delivery Report',
      description: 'Delivery performance metrics',
      icon: FiTruck,
      color: 'blue',
    },
    // Revenue reports moved to Super Admin
  ];

  const colorClasses = {
    green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500', border: 'border-green-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500', border: 'border-orange-200' },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and download reports from live analytics data"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading report data...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-xl font-bold">{dashboard.totalOrders ?? stats?.totalOrders ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-xl font-bold">₹{Number(dashboard.revenue ?? stats?.revenue ?? 0).toLocaleString('en-IN')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Vendors</p>
              <p className="text-xl font-bold">{stats?.totalVendors ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Pending Deliveries</p>
              <p className="text-xl font-bold">{dashboard.pendingDeliveries ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Orders Growth</p>
              <p className="text-xl font-bold">{dashboard.ordersGrowth ?? 0}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Revenue Growth</p>
              <p className="text-xl font-bold">{dashboard.revenueGrowth ?? 0}%</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {reportCards.map((report) => {
              const colors = colorClasses[report.color];
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow p-4 sm:p-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-3 sm:mb-4`}>
                    <report.icon size={18} className={colors.icon} />
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{report.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{report.description}</p>

                  <div className="pt-3 sm:pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleExport(report.id, 'csv')}
                      disabled={exporting === report.id}
                      className={`w-full py-2 px-3 border ${colors.border} rounded-lg hover:${colors.bg} transition-colors text-xs sm:text-sm font-medium ${colors.text} disabled:opacity-50`}
                    >
                      <FiDownload size={12} className="inline mr-1" />
                      {exporting === report.id ? 'Exporting...' : 'Download CSV'}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Custom Report Generation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Category Report</option>
              <option value="vendor">Vendor Report</option>
              <option value="order">Order Report</option>
              <option value="delivery">Delivery Report</option>
              {/* Revenue report moved to Super Admin */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-2.5 h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        </div>
        <div className="mt-4 sm:mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => handleExport(reportType, format)}
            disabled={Boolean(exporting)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50"
          >
            <FiDownload size={14} />
            {exporting ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Available Data Sources</h2>
        <div className="space-y-2 sm:space-y-3 text-sm text-gray-600">
          <p>Sales periods loaded: {salesData.length}</p>
          <p>Top products loaded: {topProducts.length}</p>
          <p>Categories loaded: {categoryData.length}</p>
          <p className="text-xs text-gray-500">PDF and Excel exports will be enabled when backend export endpoints are available.</p>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
