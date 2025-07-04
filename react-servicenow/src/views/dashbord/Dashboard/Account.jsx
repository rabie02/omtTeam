"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAccount } from '../../../features/servicenow/account/accountSlice';
import moment from 'moment';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  Download,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  PieChart as PieChartIcon,
  Calendar,
  List,
  Grid,
  Plus,
  FileText,
  Users,
  Clock,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Percent,
  Package,
  Activity,
  Filter as FilterIcon,
  RefreshCw,
  MoreHorizontal,
  X,
  Info,
  Tag,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Frown,
  Smile,
  Flag,
  ExternalLink
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { debounce } from "lodash";

// Design Constants
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"];
const STATUS_COLORS = {
  "active": "#10B981",
  "inactive": "#EF4444",
  "pending": "#F59E0B",
  "archived": "#9CA3AF",
  "Unknown": "#6B7280"
};

const COUNTRY_COLORS = {
  "Morocco": "#007B98",
  "France": "#6366F1",
  "Algeria": "#10B981",
  "Portugal": "#EF4444",
  "Kazakhstan": "#F59E0B",
  "USA": "#3B82F6",
  "Unknown": "#9CA3AF"
};

// Helper to get status badge style
const getStatusBadgeClass = (status) => {
  const color = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS["Unknown"];
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${color.replace('#', 'bg-[')}]`;
};

// Account Detail Modal Component
const AccountDetailModal = ({ account, onClose }) => {
  if (!account) return null;

  const DetailItem = ({ label, value, icon: Icon, valueClass = "font-medium text-gray-800", linkHref = null }) => (
    <div className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
      {Icon && <Icon className="text-cyan-700 flex-shrink-0 mt-1" size={18} />}
      <span className="font-semibold text-cyan-700 w-36 flex-shrink-0">{label}:</span>
      {linkHref ? (
        <a href={linkHref} target="_blank" rel="noopener noreferrer" className={`flex-1 ${valueClass} text-cyan-700 hover:underline flex items-center`}>
          {value} <ExternalLink className="inline ml-1 text-xs" size={14} />
        </a>
      ) : (
        <span className={`flex-1 ${valueClass}`}>{value}</span>
      )}
    </div>
  );

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return Smile;
      case 'inactive': return Frown;
      case 'pending': return Clock;
      case 'archived': return Package;
      default: return Info;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
        <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
          <h2 className="text-xl font-bold flex items-center">
            <Building2 className="mr-3 text-cyan-200" size={24} />
            Account {account.name} Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-colors text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 text-gray-700 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* General Account Information */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <List className="mr-2" size={20} /> General Information
              </h3>
              <DetailItem label="Account Name" value={account.name || 'N/A'} icon={Building2} />
              <DetailItem label="Status" value={account.status?.toUpperCase() || 'N/A'} icon={getStatusIcon(account.status)} valueClass={`font-bold ${STATUS_COLORS[account.status?.toLowerCase()] ? `text-[${STATUS_COLORS[account.status?.toLowerCase()]}]` : 'text-cyan-700'}`} />
              <DetailItem label="Email" value={account.email || 'N/A'} icon={Mail} />
              <DetailItem label="Phone" value={account.phone || 'N/A'} icon={Phone} />
              <DetailItem label="Archived" value={account.archived ? 'Yes' : 'No'} icon={CheckCircle} />
              <DetailItem label="Created On" value={account.createdAt ? moment(account.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
              <DetailItem label="Last Updated" value={account.updatedAt ? moment(account.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
            </div>

            {/* Contacts */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <User className="mr-2" size={20} /> Contacts ({account.contacts?.length || 0})
              </h3>
              {account.contacts && account.contacts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Primary</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {account.contacts.map((contact, index) => (
                        <tr key={contact._id || index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{contact.firstName} {contact.lastName}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{contact.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{contact.phone}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            {contact.isPrimaryContact ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Primary
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            <span className={contact.active ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" : "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"}>
                              {contact.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No contacts associated with this account.</p>
              )}
            </div>

            {/* Locations */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <MapPin className="mr-2" size={20} /> Locations ({account.locations?.length || 0})
              </h3>
              {account.locations && account.locations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Address</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Country</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Coordinates</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {account.locations.map((location, index) => (
                        <tr key={location._id || index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{location.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            {location.street && <div>{location.street}</div>}
                            <div>{location.city}{location.state ? `, ${location.state}` : ''} {location.zip}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            <span className="inline-flex items-center">
                              <Flag className="mr-1" size={14} /> {location.country}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            {location.latitude && location.longitude ? (
                              <a 
                                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-600 hover:underline flex items-center"
                              >
                                {location.latitude}, {location.longitude} <ExternalLink className="ml-1" size={14} />
                              </a>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No locations associated with this account.</p>
              )}
            </div>

            {/* System Information */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <Clock className="mr-2" size={20} /> System Information
              </h3>
              <DetailItem label="System ID" value={account.sys_id || 'N/A'} icon={Tag} />
              <DetailItem label="Created On" value={account.createdAt ? moment(account.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
              <DetailItem label="Last Updated" value={account.updatedAt ? moment(account.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Accounts Dashboard Component
const AccountsDashboard = () => {
  const dispatch = useDispatch();
  const {
    data: accounts,
    loading,
    error,
    total: totalItemsRedux,
  } = useSelector((state) => state.account);

  // Local state for filters and pagination
  const [searchText, setSearchText] = useState('');
  const [accountNameFilter, setAccountNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [viewMode, setViewMode] = useState("table");
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState(true);

  // Debounced filter handlers
  const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);
  const debouncedSetAccountNameFilter = useCallback(debounce((value) => setAccountNameFilter(value), 300), []);

  // Fetch initial data
  useEffect(() => {
    if (!accounts || accounts.length === 0 || totalItemsRedux === 0) {
      dispatch(getAccount({ page: 1, limit: 1000 }));
    }
  }, [dispatch, accounts, totalItemsRedux]);

  // Extract unique filter options
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    accounts.forEach(account => {
      if (account.status) statuses.add(account.status);
    });
    return Array.from(statuses).sort();
  }, [accounts]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set();
    accounts.forEach(account => {
      account.locations?.forEach(location => {
        if (location.country) countries.add(location.country);
      });
    });
    return Array.from(countries).sort();
  }, [accounts]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let currentFilteredData = accounts;

    if (searchText) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item._id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (accountNameFilter) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.name?.toLowerCase().includes(accountNameFilter.toLowerCase())
      );
    }

    if (statusFilter) {
      currentFilteredData = currentFilteredData.filter(item => item.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (countryFilter) {
      currentFilteredData = currentFilteredData.filter(item => 
        item.locations?.some(loc => loc.country?.toLowerCase() === countryFilter.toLowerCase())
      );
    }

    if (archivedFilter !== '') {
      const isArchivedBool = archivedFilter === 'true';
      currentFilteredData = currentFilteredData.filter(item => item.archived === isArchivedBool);
    }

    if (dateRange.from) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.createdAt && moment(item.createdAt).isSameOrAfter(dateRange.from, 'day')
      );
    }
    if (dateRange.to) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.createdAt && moment(item.createdAt).isSameOrBefore(dateRange.to, 'day')
      );
    }

    return currentFilteredData;
  }, [
    accounts,
    searchText,
    accountNameFilter,
    statusFilter,
    countryFilter,
    archivedFilter,
    dateRange
  ]);

  // Sorting logic
  const sortedAccounts = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'contacts') {
          aValue = a.contacts?.length || 0;
          bValue = b.contacts?.length || 0;
        } else if (sortConfig.key === 'locations') {
          aValue = a.locations?.length || 0;
          bValue = b.locations?.length || 0;
        } else if (sortConfig.key === 'createdAt') {
          aValue = moment(a.createdAt).valueOf();
          bValue = moment(b.createdAt).valueOf();
        } else {
          aValue = a[sortConfig.key] || "";
          bValue = b[sortConfig.key] || "";
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAccounts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAccounts.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

  // Metrics calculations
  const accountMetrics = useMemo(() => {
    const metrics = {
      total: accounts.length,
      active: 0,
      inactive: 0,
      pending: 0,
      archived: 0,
      withContacts: 0,
      withLocations: 0,
      newThisMonth: 0
    };

    const currentDate = moment();
    accounts.forEach(item => {
      if (item.status?.toLowerCase() === "active") metrics.active++;
      if (item.status?.toLowerCase() === "inactive") metrics.inactive++;
      if (item.status?.toLowerCase() === "pending") metrics.pending++;
      if (item.archived) metrics.archived++;
      if (item.contacts?.length > 0) metrics.withContacts++;
      if (item.locations?.length > 0) metrics.withLocations++;

      const createdDate = moment(item.createdAt);
      if (createdDate.month() === currentDate.month() &&
          createdDate.year() === currentDate.year()) {
        metrics.newThisMonth++;
      }
    });

    return metrics;
  }, [accounts]);

  // Chart data calculations
  const statusData = useMemo(() => {
    const counts = filteredData.reduce((acc, item) => {
      const status = item.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const countryData = useMemo(() => {
    const counts = {};
    filteredData.forEach(account => {
      account.locations?.forEach(location => {
        const country = location.country || "Unknown";
        counts[country] = (counts[country] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const creationTrendData = useMemo(() => {
    const monthlyCounts = filteredData.reduce((acc, item) => {
      const dateStr = item.createdAt;
      if (!dateStr) return acc;
      try {
        const date = moment(dateStr);
        const monthYear = date.format('YYYY-MM');
        acc[monthYear] = (acc[monthYear] || 0) + 1;
      } catch (e) {
        console.error("Invalid date format:", dateStr);
      }
      return acc;
    }, {});
    return Object.entries(monthlyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const exportToCSV = () => {
    const headers = ["name", "status", "email", "phone", "contacts_count", "locations_count", "created_at", "archived"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(item => [
        `"${item.name || ''}"`,
        `"${item.status || ''}"`,
        `"${item.email || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.contacts?.length || 0}"`,
        `"${item.locations?.length || 0}"`,
        `"${item.createdAt || ''}"`,
        `"${item.archived ? 'Yes' : 'No'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "accounts.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchText("");
    setAccountNameFilter("");
    setStatusFilter("");
    setCountryFilter("");
    setArchivedFilter("");
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
    setSortConfig({ key: "name", direction: "asc" });
  };

  const handleRowClick = useCallback((account) => {
    setSelectedAccount(account);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedAccount(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
          <h3 className="text-lg font-medium text-cyan-700">Loading Accounts</h3>
          <p className="text-gray-500">Fetching the latest account data...</p>
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
          <h3 className="text-lg font-medium text-cyan-700 mb-2">Error loading data</h3>
          <p className="text-cyan-700 mb-6">{error.message || error || "An unknown error occurred."}</p>
          <button
            onClick={() => dispatch(getAccount({ page: 1, limit: 1000 }))}
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
    <div>
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-cyan-700 flex items-center">
            <Building2 className="mr-3 text-cyan-700" size={28} />
            Accounts Dashboard
          </h1> 
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => dispatch(getAccount({ page: 1, limit: 1000 }))}
            className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Accounts</p>
            <p className="mt-1 text-3xl font-bold text-cyan-700">{accountMetrics.total}</p>
          </div>
          <Building2 className="text-cyan-600" size={32} />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Accounts</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{accountMetrics.active}</p>
          </div>
          <Smile className="text-green-500" size={32} />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Accounts with Contacts</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{accountMetrics.withContacts}</p>
          </div>
          <Users className="text-blue-500" size={32} />
        </div>
        <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-100">New This Month</p>
            <p className="mt-1 text-3xl font-bold">{accountMetrics.newThisMonth}</p>
          </div>
          <Calendar className="text-cyan-200" size={32} />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedFilters(!expandedFilters)}>
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FilterIcon className="mr-2 text-cyan-700" size={22} />
            Filters
          </h2>
          {expandedFilters ? <ChevronUp size={20} className="text-cyan-700" /> : <ChevronDown size={20} className="text-cyan-700" />}
        </div>

        {expandedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6 animate-fade-in">
            <div className="flex flex-col">
              <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Account Name/ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or ID"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  onChange={(e) => debouncedSetSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="accountNameFilter" className="text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="accountNameFilter"
                  placeholder="Filter by account name"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  onChange={(e) => debouncedSetAccountNameFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="statusFilter"
                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="countryFilter" className="text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                id="countryFilter"
                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 mb-1">Created From</label>
              <input
                type="date"
                id="dateFrom"
                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                value={dateRange.from}
                onChange={(e) => { setDateRange({ ...dateRange, from: e.target.value }); setCurrentPage(1); }}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="dateTo" className="text-sm font-medium text-gray-700 mb-1">Created To</label>
              <input
                type="date"
                id="dateTo"
                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                value={dateRange.to}
                onChange={(e) => { setDateRange({ ...dateRange, to: e.target.value }); setCurrentPage(1); }}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="archivedFilter" className="text-sm font-medium text-gray-700 mb-1">Archived Status</label>
              <select
                id="archivedFilter"
                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                value={archivedFilter}
                onChange={(e) => { setArchivedFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All</option>
                <option value="true">Archived</option>
                <option value="false">Not Archived</option>
              </select>
            </div>

            <div className="flex items-end gap-2 mt-auto">
              <button
                onClick={resetFilters}
                className="inline-flex items-center rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-300 transition-colors w-full justify-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex rounded-lg shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${viewMode === 'table' ? 'bg-cyan-700 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
            onClick={() => setViewMode('table')}
          >
            <List className="inline-block mr-2" size={16} /> Table View
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${viewMode === 'chart' ? 'bg-cyan-700 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 border-l-0'}`}
            onClick={() => setViewMode('chart')}
          >
            <PieChartIcon className="inline-block mr-2" size={16} /> Chart View
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Account Name
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortConfig.key === 'email' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('contacts')}
                  >
                    <div className="flex items-center">
                      Contacts
                      {sortConfig.key === 'contacts' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('locations')}
                  >
                    <div className="flex items-center">
                      Locations
                      {sortConfig.key === 'locations' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Created On
                      {sortConfig.key === 'createdAt' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAccounts.length > 0 ? (
                  paginatedAccounts.map((account) => (
                    <tr
                      key={account._id}
                      className="odd:bg-gray-50 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
                      onClick={() => handleRowClick(account)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{account.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadgeClass(account.status)}>
                          {account.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{account.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {account.contacts?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {account.locations?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {moment(account.createdAt).format('YYYY-MM-DD')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRowClick(account); }}
                          className="text-cyan-600 hover:text-cyan-900 focus:outline-none focus:underline"
                          aria-label={`View details for account ${account.name}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      No accounts found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
              aria-label="Pagination"
            >
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} className="mr-2" /> Previous
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={16} className="ml-2" />
                </button>
              </div>
              <div className="hidden sm:flex sm:items-center">
                <p className="text-sm text-gray-700 mr-2">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
            </nav>
          )}
        </div>
      ) : (
        // Charts Section
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between cursor-pointer mb-6" onClick={() => setExpandedCharts(!expandedCharts)}>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <PieChartIcon className="mr-2 text-cyan-700" size={22} />
              Account Analytics
            </h2>
            {expandedCharts ? <ChevronUp size={20} className="text-cyan-700" /> : <ChevronDown size={20} className="text-cyan-700" />}
          </div>

          {expandedCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Activity className="mr-2" size={18} /> Accounts by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || STATUS_COLORS.Unknown} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Accounts`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Globe className="mr-2" size={18} /> Accounts by Country</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${value} Accounts`, name]} />
                    <Bar dataKey="value">
                      {countryData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={COUNTRY_COLORS[entry.name] || COUNTRY_COLORS.Unknown} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="mr-2" size={18} /> Account Creation Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={creationTrendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(dateStr) => format(parseISO(dateStr + '-01'), 'MMM yy')}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(label) => moment(label).format('MMMM YYYY')} />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#007B98" activeDot={{ r: 8 }} name="Accounts Created" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedAccount && (
        <AccountDetailModal account={selectedAccount} onClose={closeModal} />
      )}
    </div>
  );
};

export default AccountsDashboard;