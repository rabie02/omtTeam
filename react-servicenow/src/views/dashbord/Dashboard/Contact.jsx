"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getContacts } from '../../../features/servicenow/contact/contactSlice';
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

// Contact Detail Modal Component
const ContactDetailModal = ({ contact, onClose }) => {
  if (!contact) return null;

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
            <User className="mr-3 text-cyan-200" size={24} />
            Contact {contact.firstName} {contact.lastName} Details
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
            {/* General Contact Information */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <List className="mr-2" size={20} /> General Information
              </h3>
              <DetailItem label="First Name" value={contact.firstName || 'N/A'} icon={User} />
              <DetailItem label="Last Name" value={contact.lastName || 'N/A'} icon={User} />
              <DetailItem label="Email" value={contact.email || 'N/A'} icon={Mail} />
              <DetailItem label="Phone" value={contact.phone || 'N/A'} icon={Phone} />
              <DetailItem label="Primary Contact" value={contact.isPrimaryContact ? 'Yes' : 'No'} icon={CheckCircle} />
              <DetailItem label="Status" value={contact.active ? 'Active' : 'Inactive'} icon={getStatusIcon(contact.active ? 'active' : 'inactive')} valueClass={`font-bold ${contact.active ? 'text-green-600' : 'text-red-600'}`} />
              <DetailItem label="Created On" value={contact.createdAt ? moment(contact.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
              <DetailItem label="Last Updated" value={contact.updatedAt ? moment(contact.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
            </div>

            {/* Account Information */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <Building2 className="mr-2" size={20} /> Account Information
              </h3>
              {contact.account ? (
                <>
                  <DetailItem label="Account Name" value={contact.account.name || 'N/A'} icon={Building2} />
                  <DetailItem label="Account Status" value={contact.account.status?.toUpperCase() || 'N/A'} icon={getStatusIcon(contact.account.status)} valueClass={`font-bold ${STATUS_COLORS[contact.account.status?.toLowerCase()] ? `text-[${STATUS_COLORS[contact.account.status?.toLowerCase()]}]` : 'text-cyan-700'}`} />
                  <DetailItem label="Account Email" value={contact.account.email || 'N/A'} icon={Mail} />
                  <DetailItem label="Account Phone" value={contact.account.phone || 'N/A'} icon={Phone} />
                </>
              ) : (
                <p className="text-sm text-gray-500">No account associated with this contact.</p>
              )}
            </div>

            {/* Location Information */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <MapPin className="mr-2" size={20} /> Location Information
              </h3>
              {contact.location ? (
                <>
                  <DetailItem label="Location Name" value={contact.location.name || 'N/A'} icon={MapPin} />
                  <DetailItem label="Street" value={contact.location.street || 'N/A'} icon={MapPin} />
                  <DetailItem label="City" value={contact.location.city || 'N/A'} icon={MapPin} />
                  <DetailItem label="State" value={contact.location.state || 'N/A'} icon={MapPin} />
                  <DetailItem label="Country" value={contact.location.country || 'N/A'} icon={Flag} />
                  <DetailItem label="ZIP Code" value={contact.location.zip || 'N/A'} icon={Tag} />
                  <DetailItem 
                    label="Coordinates" 
                    value={`${contact.location.latitude}, ${contact.location.longitude}`} 
                    icon={Globe}
                    linkHref={`https://www.google.com/maps?q=${contact.location.latitude},${contact.location.longitude}`}
                  />
                </>
              ) : (
                <p className="text-sm text-gray-500">No location associated with this contact.</p>
              )}
            </div>

            {/* System Information */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
              <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                <Clock className="mr-2" size={20} /> System Information
              </h3>
              <DetailItem label="System ID" value={contact.sys_id || 'N/A'} icon={Tag} />
              <DetailItem label="Created On" value={contact.createdAt ? moment(contact.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
              <DetailItem label="Last Updated" value={contact.updatedAt ? moment(contact.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Contacts Dashboard Component
const ContactsDashboard = () => {
  const dispatch = useDispatch();
  const {
    data: contacts,
    loading,
    error,
    total: totalItemsRedux,
  } = useSelector((state) => state.contact);

  // Local state for filters and pagination
  const [searchText, setSearchText] = useState('');
  const [firstNameFilter, setFirstNameFilter] = useState('');
  const [lastNameFilter, setLastNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [primaryFilter, setPrimaryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [selectedContact, setSelectedContact] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: "firstName", direction: "asc" });
  const [viewMode, setViewMode] = useState("table");
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState(true);

  // Debounced filter handlers
  const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);
  const debouncedSetFirstNameFilter = useCallback(debounce((value) => setFirstNameFilter(value), 300), []);
  const debouncedSetLastNameFilter = useCallback(debounce((value) => setLastNameFilter(value), 300), []);
  const debouncedSetEmailFilter = useCallback(debounce((value) => setEmailFilter(value), 300), []);

  // Fetch initial data
  useEffect(() => {
    if (!contacts || contacts.length === 0 || totalItemsRedux === 0) {
      dispatch(getContacts({ page: 1, limit: 1000 }));
    }
  }, [dispatch, contacts, totalItemsRedux]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set();
    contacts.forEach(contact => {
      if (contact.location?.country) countries.add(contact.location.country);
    });
    return Array.from(countries).sort();
  }, [contacts]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let currentFilteredData = contacts;

    if (searchText) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        item._id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (firstNameFilter) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.firstName?.toLowerCase().includes(firstNameFilter.toLowerCase())
      );
    }

    if (lastNameFilter) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.lastName?.toLowerCase().includes(lastNameFilter.toLowerCase())
      );
    }

    if (emailFilter) {
      currentFilteredData = currentFilteredData.filter(item =>
        item.email?.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    if (statusFilter !== '') {
      const isActive = statusFilter === 'true';
      currentFilteredData = currentFilteredData.filter(item => item.active === isActive);
    }

    if (countryFilter) {
      currentFilteredData = currentFilteredData.filter(item => 
        item.location?.country?.toLowerCase() === countryFilter.toLowerCase()
      );
    }

    if (primaryFilter !== '') {
      const isPrimary = primaryFilter === 'true';
      currentFilteredData = currentFilteredData.filter(item => item.isPrimaryContact === isPrimary);
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
    contacts,
    searchText,
    firstNameFilter,
    lastNameFilter,
    emailFilter,
    statusFilter,
    countryFilter,
    primaryFilter,
    dateRange
  ]);

  // Sorting logic
  const sortedContacts = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'account') {
          aValue = a.account?.name || "";
          bValue = b.account?.name || "";
        } else if (sortConfig.key === 'location') {
          aValue = a.location?.country || "";
          bValue = b.location?.country || "";
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

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedContacts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

  // Metrics calculations
  const contactMetrics = useMemo(() => {
    const metrics = {
      total: contacts.length,
      active: 0,
      inactive: 0,
      primary: 0,
      withAccount: 0,
      withLocation: 0,
      newThisMonth: 0
    };

    const currentDate = moment();
    contacts.forEach(item => {
      if (item.active) metrics.active++;
      if (!item.active) metrics.inactive++;
      if (item.isPrimaryContact) metrics.primary++;
      if (item.account) metrics.withAccount++;
      if (item.location) metrics.withLocation++;

      const createdDate = moment(item.createdAt);
      if (createdDate.month() === currentDate.month() &&
          createdDate.year() === currentDate.year()) {
        metrics.newThisMonth++;
      }
    });

    return metrics;
  }, [contacts]);

  // Chart data calculations
  const statusData = useMemo(() => {
    const counts = filteredData.reduce((acc, item) => {
      const status = item.active ? "Active" : "Inactive";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const countryData = useMemo(() => {
    const counts = {};
    filteredData.forEach(contact => {
      const country = contact.location?.country || "Unknown";
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const primaryContactData = useMemo(() => {
    const counts = filteredData.reduce((acc, item) => {
      const type = item.isPrimaryContact ? "Primary" : "Secondary";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
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
    const headers = ["first_name", "last_name", "email", "phone", "is_primary", "status", "account", "country", "created_at"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(item => [
        `"${item.firstName || ''}"`,
        `"${item.lastName || ''}"`,
        `"${item.email || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.isPrimaryContact ? 'Yes' : 'No'}"`,
        `"${item.active ? 'Active' : 'Inactive'}"`,
        `"${item.account?.name || 'N/A'}"`,
        `"${item.location?.country || 'N/A'}"`,
        `"${item.createdAt || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "contacts.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchText("");
    setFirstNameFilter("");
    setLastNameFilter("");
    setEmailFilter("");
    setStatusFilter("");
    setCountryFilter("");
    setPrimaryFilter("");
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
    setSortConfig({ key: "firstName", direction: "asc" });
  };

  const handleRowClick = useCallback((contact) => {
    setSelectedContact(contact);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedContact(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
          <h3 className="text-lg font-medium text-cyan-700">Loading Contacts</h3>
          <p className="text-gray-500">Fetching the latest contact data...</p>
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
            onClick={() => dispatch(getContacts({ page: 1, limit: 1000 }))}
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
            <User className="mr-3 text-cyan-700" size={28} />
            Contacts Dashboard
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
            onClick={() => dispatch(getContacts({ page: 1, limit: 1000 }))}
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
            <p className="text-sm font-medium text-gray-500">Total Contacts</p>
            <p className="mt-1 text-3xl font-bold text-cyan-700">{contactMetrics.total}</p>
          </div>
          <Users className="text-cyan-600" size={32} />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Contacts</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{contactMetrics.active}</p>
          </div>
          <Smile className="text-green-500" size={32} />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Primary Contacts</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{contactMetrics.primary}</p>
          </div>
          <User className="text-blue-500" size={32} />
        </div>
        <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-100">New This Month</p>
            <p className="mt-1 text-3xl font-bold">{contactMetrics.newThisMonth}</p>
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
              <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Contact Name/Email/ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, email or ID"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  onChange={(e) => debouncedSetSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="firstNameFilter" className="text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="firstNameFilter"
                  placeholder="Filter by first name"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  onChange={(e) => debouncedSetFirstNameFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="lastNameFilter" className="text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="lastNameFilter"
                  placeholder="Filter by last name"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  onChange={(e) => debouncedSetLastNameFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="emailFilter" className="text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="emailFilter"
                  placeholder="Filter by email"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  onChange={(e) => debouncedSetEmailFilter(e.target.value)}
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
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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
              <label htmlFor="primaryFilter" className="text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
              <select
                id="primaryFilter"
                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                value={primaryFilter}
                onChange={(e) => { setPrimaryFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All</option>
                <option value="true">Primary</option>
                <option value="false">Secondary</option>
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
                    onClick={() => requestSort('firstName')}
                  >
                    <div className="flex items-center">
                      First Name
                      {sortConfig.key === 'firstName' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('lastName')}
                  >
                    <div className="flex items-center">
                      Last Name
                      {sortConfig.key === 'lastName' && (
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
                    onClick={() => requestSort('account')}
                  >
                    <div className="flex items-center">
                      Account
                      {sortConfig.key === 'account' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('isPrimaryContact')}
                  >
                    <div className="flex items-center">
                      Primary
                      {sortConfig.key === 'isPrimaryContact' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('active')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'active' && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('location')}
                  >
                    <div className="flex items-center">
                      Country
                      {sortConfig.key === 'location' && (
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
                {paginatedContacts.length > 0 ? (
                  paginatedContacts.map((contact) => (
                    <tr
                      key={contact._id}
                      className="odd:bg-gray-50 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
                      onClick={() => handleRowClick(contact)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{contact.firstName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {contact.account?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {contact.isPrimaryContact ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Primary
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Secondary
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={contact.active ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" : "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"}>
                          {contact.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {contact.location?.country || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRowClick(contact); }}
                          className="text-cyan-600 hover:text-cyan-900 focus:outline-none focus:underline"
                          aria-label={`View details for contact ${contact.firstName} ${contact.lastName}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                      No contacts found matching your criteria.
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
              Contact Analytics
            </h2>
            {expandedCharts ? <ChevronUp size={20} className="text-cyan-700" /> : <ChevronDown size={20} className="text-cyan-700" />}
          </div>

          {expandedCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Activity className="mr-2" size={18} /> Contacts by Status</h3>
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
                        <Cell key={`cell-${index}`} fill={entry.name === 'Active' ? STATUS_COLORS.active : STATUS_COLORS.inactive} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Contacts`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><User className="mr-2" size={18} /> Primary vs Secondary Contacts</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={primaryContactData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {primaryContactData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Primary' ? '#007B98' : '#00A3C4'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} Contacts`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Globe className="mr-2" size={18} /> Contacts by Country</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${value} Contacts`, name]} />
                    <Bar dataKey="value">
                      {countryData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={COUNTRY_COLORS[entry.name] || COUNTRY_COLORS.Unknown} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="mr-2" size={18} /> Contact Creation Trend</h3>
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
                    <Line type="monotone" dataKey="count" stroke="#007B98" activeDot={{ r: 8 }} name="Contacts Created" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedContact && (
        <ContactDetailModal contact={selectedContact} onClose={closeModal} />
      )}
    </div>
  );
};

export default ContactsDashboard;