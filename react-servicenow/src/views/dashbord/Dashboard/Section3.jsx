"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Download, 
  Search, 
  Filter, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  BarChart2,
  PieChart as PieChartIcon,
  Calendar,
  List,
  Grid,
  Sliders,
  Plus,
  Boxes,
  ListTree,
  Layers,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Activity,
  Database,
  Star,
  Check,
  X,
  Clock,
  Zap,
  Tag as TagIcon,
  Hash,
  FileText,
  CreditCard,
  CalendarDays,
  TrendingUp,
  Package,
  ShieldCheck,
  FileBarChart2,
  DollarSign,
  Users,
  RefreshCw,
  Filter as FilterIcon
} from "lucide-react";
import { format, parseISO, subMonths } from "date-fns";
import { debounce } from "lodash";

// Updated color palette to match sidebar
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"];
const STATUS_COLORS = {
  "Published": "#10B981",
  "In Draft": "#3B82F6",
  "Retired": "#EF4444",
  "approved": "#8B5CF6",
  "Unknown": "#9CA3AF"
};
const TYPE_COLORS = {
  "software": "#007B98",
  "hardware": "#F59E0B",
  "service": "#10B981",
  "Unknown": "#9CA3AF"
};

const ProductOfferings = () => {
  const [products, setProducts] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [expandedCharts, setExpandedCharts] = useState(true);
  
  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [numberFilter, setNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [offeringTypeFilter, setOfferingTypeFilter] = useState("");
  const [specificationFilter, setSpecificationFilter] = useState("");
  const [sellableFilter, setSellableFilter] = useState(null);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  
  // Table controls
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const debouncedNameFilter = useCallback(debounce(setNameFilter, 300), []);
  const debouncedCodeFilter = useCallback(debounce(setCodeFilter, 300), []);
  const debouncedNumberFilter = useCallback(debounce(setNumberFilter, 300), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        const [productsRes, specsRes] = await Promise.all([
          axios.get("http://localhost:3000/api/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/api/product-specs", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        
        setProducts(productsRes.data.data || []);
        setSpecifications(specsRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load product offerings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const name = item.name || "";
      const code = item.code || "";
      const number = item.number || "";
      const status = item.status || "";
      const offeringType = item.offering_type || "";
      const startDate = item.start_date || "";
      const sellable = item.sellable || "";
      const specName = item.product_specification?.display_value || "";
      
      if (nameFilter && !name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (codeFilter && !code.toLowerCase().includes(codeFilter.toLowerCase())) return false;
      if (numberFilter && !number.toLowerCase().includes(numberFilter.toLowerCase())) return false;
      if (statusFilter && status !== statusFilter) return false;
      if (offeringTypeFilter && offeringType !== offeringTypeFilter) return false;
      if (specificationFilter && specName !== specificationFilter) return false;
      if (sellableFilter !== null && sellable !== String(sellableFilter)) return false;
      
      const itemDate = new Date(startDate);
      if (dateRange.from && itemDate < new Date(dateRange.from)) return false;
      if (dateRange.to && itemDate > new Date(dateRange.to)) return false;
      
      return true;
    });
  }, [products, nameFilter, codeFilter, numberFilter, statusFilter, offeringTypeFilter, 
      specificationFilter, sellableFilter, dateRange]);

  const sortedProducts = useMemo(() => {
    const sortableItems = [...filteredProducts];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'product_specification') {
          aValue = a.product_specification?.display_value || "";
          bValue = b.product_specification?.display_value || "";
        } else if (sortConfig.key === 'mrc' || sortConfig.key === 'nrc') {
          aValue = parseFloat((a[sortConfig.key] || "0").replace(/[^\d.-]/g, ''));
          bValue = parseFloat((b[sortConfig.key] || "0").replace(/[^\d.-]/g, ''));
        } else {
          aValue = a[sortConfig.key] || "";
          bValue = b[sortConfig.key] || "";
        }
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Metrics calculations
  const productMetrics = useMemo(() => {
    const metrics = {
      total: products.length,
      published: 0,
      draft: 0,
      retired: 0,
      approved: 0,
      software: 0,
      hardware: 0,
      service: 0,
      sellable: 0,
      nonSellable: 0,
      revenue: 0
    };

    products.forEach(item => {
      if (item.status === "Published") metrics.published++;
      if (item.status === "In Draft") metrics.draft++;
      if (item.status === "Retired") metrics.retired++;
      if (item.status === "approved") metrics.approved++;
      if (item.offering_type === "software") metrics.software++;
      if (item.offering_type === "hardware") metrics.hardware++;
      if (item.offering_type === "service") metrics.service++;
      if (item.sellable === "true") metrics.sellable++;
      if (item.sellable === "false") metrics.nonSellable++;
      
      // Calculate potential revenue (simplified)
      const mrc = parseFloat((item.mrc || "0").replace(/[^\d.-]/g, ''));
      const nrc = parseFloat((item.nrc || "0").replace(/[^\d.-]/g, ''));
      metrics.revenue += (mrc * 12) + nrc; // Annualized MRC + NRC
    });

    return metrics;
  }, [products]);

  // Chart data calculations
  const statusData = useMemo(() => {
    const counts = filteredProducts.reduce((acc, item) => {
      const status = item.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProducts]);

  const creationTrendData = useMemo(() => {
    const monthlyCounts = filteredProducts.reduce((acc, item) => {
      const dateStr = item.sys_created_on;
      if (!dateStr) return acc;
      try {
        const date = parseISO(dateStr);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthYear] = (acc[monthYear] || 0) + 1;
      } catch (e) {
        console.error("Invalid date format:", dateStr);
      }
      return acc;
    }, {});
    return Object.entries(monthlyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredProducts]);

  const offeringTypeData = useMemo(() => {
    const counts = filteredProducts.reduce((acc, item) => {
      const type = item.offering_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProducts]);

  const revenueTrendData = useMemo(() => {
    // Generate last 12 months data
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      months.push({
        date: format(date, 'yyyy-MM'),
        name: format(date, 'MMM yyyy'),
        revenue: Math.floor(Math.random() * 100000) + 50000 // Simulated revenue
      });
    }
    return months;
  }, []);

  const exportToCSV = () => {
    const headers = Object.keys(products[0] || {});
    const csvContent = [
      headers.join(","),
      ...filteredProducts.map(item => 
        headers.map(header => 
          `"${String(item[header] || '').replace(/"/g, '""')}"`
        ).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "product_offerings.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setNameFilter("");
    setCodeFilter("");
    setNumberFilter("");
    setStatusFilter("");
    setOfferingTypeFilter("");
    setSpecificationFilter("");
    setSellableFilter(null);
    setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
          <h3 className="text-lg font-medium text-gray-900">Loading Product Offerings</h3>
          <p className="text-gray-500">Fetching the latest product data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center border border-red-100">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Offerings Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive overview and management of your product catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpandedCharts(!expandedCharts)}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 transition-colors"
          >
            {expandedCharts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expandedCharts ? 'Hide' : 'Show'} Analytics
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-cyan-700 shadow-sm ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{productMetrics.total}</h3>
            </div>
            <div className="p-3 rounded-lg bg-cyan-50">
              <Package className="h-6 w-6 text-cyan-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12.5% from last month
            </span>
          </div>
        </div>

        {/* Published Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Published</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{productMetrics.published}</h3>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <ShieldCheck className="h-6 w-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {Math.round((productMetrics.published / productMetrics.total) * 100)}% of total
            </span>
          </div>
        </div>

        {/* Revenue Potential */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Annual Revenue Potential</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                ${(productMetrics.revenue / 1000).toFixed(1)}K
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-cyan-50">
              <DollarSign className="h-6 w-6 text-cyan-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.3% from last quarter
            </span>
          </div>
        </div>

        {/* Sellable Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sellable Products</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{productMetrics.sellable}</h3>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <Zap className="h-6 w-6 text-yellow-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {Math.round((productMetrics.sellable / productMetrics.total) * 100)}% of total
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {expandedCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-cyan-700" />
                Status Distribution
              </h3>
              <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                {filteredProducts.length} products
              </span>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} products`, "Count"]}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white'
                    }}
                  />
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-700" />
                Revenue Trend
              </h3>
              <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                Last 12 months
              </span>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007B98" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#007B98" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#007B98"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Offering Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-cyan-700" />
                Offering Types
              </h3>
              <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                Distribution
              </span>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={offeringTypeData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} products`, "Count"]}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Count"
                    radius={[0, 4, 4, 0]}
                  >
                    {offeringTypeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={TYPE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-5 py-3 border-b border-gray-200 bg-cyan-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-cyan-700" />
            <h3 className="text-base font-medium text-cyan-800">Filters</h3>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-cyan-700 shadow-sm ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 w-full sm:w-auto justify-center transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset All
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Products</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                placeholder="Product name, code or number..."
                value={nameFilter}
                onChange={(e) => debouncedNameFilter(e.target.value)}
              />
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              >
                <option value="">All statuses</option>
                <option value="Published">Published</option>
                <option value="In Draft">In Draft</option>
                <option value="Retired">Retired</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          
          {/* Offering Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Offering Type</label>
            <div className="relative">
              <select
                value={offeringTypeFilter}
                onChange={(e) => setOfferingTypeFilter(e.target.value)}
                className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              >
                <option value="">All types</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="service">Service</option>
              </select>
            </div>
          </div>
          
          {/* Specification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Specification</label>
            <div className="relative">
              <select
                value={specificationFilter}
                onChange={(e) => setSpecificationFilter(e.target.value)}
                className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              >
                <option value="">All specifications</option>
                {specifications.map(spec => (
                  <option key={spec.sys_id} value={spec.display_name || spec.name}>
                    {spec.display_name || spec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Sellable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sellable</label>
            <div className="relative">
              <select
                value={sellableFilter === null ? "" : String(sellableFilter)}
                onChange={(e) => setSellableFilter(e.target.value === "" ? null : e.target.value === "true")}
                className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="true">Sellable</option>
                <option value="false">Non-sellable</option>
              </select>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Creation Date Range</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.from || ""}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="block w-full rounded-lg border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                />
              </div>
              <span className="flex items-center text-gray-500">to</span>
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.to || ""}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="block w-full rounded-lg border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* View Mode */}
          <div className="md:col-span-2 lg:col-span-1 flex items-end">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${viewMode === "table" ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200' : 'bg-white text-gray-500 hover:bg-gray-50 ring-1 ring-gray-200'} transition-colors`}
              >
                <List className="h-4 w-4" />
                Table View
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${viewMode === "grid" ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200' : 'bg-white text-gray-500 hover:bg-gray-50 ring-1 ring-gray-200'} transition-colors`}
              >
                <Grid className="h-4 w-4" />
                Grid View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Results Header */}
        <div className="px-5 py-3 border-b border-gray-200 bg-cyan-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-semibold text-cyan-800">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
            </h3>
            <p className="text-sm text-cyan-700 mt-1">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-cyan-700">
              <span>Sort by:</span>
              <select
                value={sortConfig.key}
                onChange={(e) => requestSort(e.target.value)}
                className="rounded-md border-0 py-1 pl-2 pr-8 text-cyan-800 ring-1 ring-inset ring-cyan-200 bg-white focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              >
                <option value="name">Product Name</option>
                <option value="code">Product Code</option>
                <option value="number">Product Number</option>
                <option value="status">Status</option>
                <option value="offering_type">Type</option>
                <option value="product_specification">Specification</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cyan-50">
                <tr>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product</span>
                      {sortConfig.key === "name" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUp className="h-3 w-3 text-cyan-700" /> : 
                        <ArrowDown className="h-3 w-3 text-cyan-700" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                    onClick={() => requestSort("code")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Code</span>
                      {sortConfig.key === "code" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUp className="h-3 w-3 text-cyan-700" /> : 
                        <ArrowDown className="h-3 w-3 text-cyan-700" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                    onClick={() => requestSort("number")}
                  >
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-cyan-700" />
                      <span>Number</span>
                      {sortConfig.key === "number" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUp className="h-3 w-3 text-cyan-700" /> : 
                        <ArrowDown className="h-3 w-3 text-cyan-700" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                    onClick={() => requestSort("product_specification")}
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-cyan-700" />
                      <span>Specification</span>
                      {sortConfig.key === "product_specification" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUp className="h-3 w-3 text-cyan-700" /> : 
                        <ArrowDown className="h-3 w-3 text-cyan-700" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                    onClick={() => requestSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortConfig.key === "status" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUp className="h-3 w-3 text-cyan-700" /> : 
                        <ArrowDown className="h-3 w-3 text-cyan-700" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                    onClick={() => requestSort("offering_type")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Type</span>
                      {sortConfig.key === "offering_type" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUp className="h-3 w-3 text-cyan-700" /> : 
                        <ArrowDown className="h-3 w-3 text-cyan-700" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((item) => (
                    <tr key={item.sys_id} className="hover:bg-cyan-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                            <Boxes className="h-5 w-5 text-cyan-700" />
                          </div>
                          <div className="ml-4 min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-[180px]">
                              {item.name || "-"}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-[180px]">
                              {item.short_description || item.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {item.code || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.number || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product_specification?.display_value || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[item.status || "Unknown"]}20`,
                            color: STATUS_COLORS[item.status || "Unknown"]
                          }}
                        >
                          {item.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${TYPE_COLORS[item.offering_type || "Unknown"]}20`,
                            color: TYPE_COLORS[item.offering_type || "Unknown"]
                          }}
                        >
                          {item.offering_type || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                        <p className="text-gray-500 mt-1 max-w-md">
                          {filteredProducts.length === 0 && products.length > 0
                            ? "Try adjusting your filters to find what you're looking for"
                            : "No products available in the system yet"}
                        </p>
                        <button
                          onClick={resetFilters}
                          className="mt-4 inline-flex items-center rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.length > 0 ? (
              paginatedProducts.map((item) => (
                <div key={item.sys_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                          <Boxes className="h-5 w-5 text-cyan-700" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-base font-semibold text-gray-900 truncate max-w-[180px]">
                            {item.name || "Unnamed Product"}
                          </h3>
                          <p className="text-sm text-gray-500 truncate max-w-[180px]">
                            {item.code || "No code"} • {item.number || "No number"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[item.status || "Unknown"]}20`,
                            color: STATUS_COLORS[item.status || "Unknown"]
                          }}
                        >
                          {item.status || "Unknown"}
                        </span>
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${TYPE_COLORS[item.offering_type || "Unknown"]}20`,
                            color: TYPE_COLORS[item.offering_type || "Unknown"]
                          }}
                        >
                          {item.offering_type || "Unknown"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 truncate flex items-center gap-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>Specification: {item.product_specification?.display_value || "None"}</span>
                      </p>
                    </div>
                    
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {item.short_description || item.description || "No description available"}
                    </p>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          MRC
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {item.mrc || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <TagIcon className="h-3.5 w-3.5" />
                          NRC
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {item.nrc || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Start Date
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {item.start_date ? format(parseISO(item.start_date), "MMM dd, yyyy") : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          Sellable
                        </p>
                        <p className="mt-1">
                          {item.sellable === "true" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <Check className="h-3.5 w-3.5" />
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <X className="h-3.5 w-3.5" />
                              No
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-cyan-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
                    <button className="text-sm font-medium text-cyan-700 hover:text-cyan-900 flex items-center gap-1.5 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                      View Details
                    </button>
                    <button className="text-gray-400 hover:text-gray-500 transition-colors">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="text-gray-500 mt-1 max-w-md mx-auto">
                  {filteredProducts.length === 0 && products.length > 0
                    ? "Try adjusting your filters to find what you're looking for"
                    : "No products available in the system yet"}
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="bg-white px-5 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-cyan-700 hover:bg-cyan-50"
                }`}
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage >= totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-cyan-700 hover:bg-cyan-50"
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-cyan-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredProducts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-cyan-700 ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    if (page >= 1 && page <= totalPages) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? "z-10 bg-cyan-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                              : "text-cyan-700 ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 focus:outline-offset-0"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-cyan-700 ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage >= totalPages ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOfferings;