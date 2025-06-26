"use client"; // This directive is typically used in Next.js for client-side components

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getall } from '../../../features/servicenow/product-offering/productOfferingCatalogSlice'; // Adjust path as needed
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
    Tag, // For product code/ID
    Building2, // For categories
    CheckCircle,
    ArrowUp,
    ArrowDown,Users ,
    ChevronRight,
    ChevronLeft,
    Clock, // For status like 'pending' or 'expired' if applicable to products
    FileText, // General document/item icon
    Activity, // For charts/analytics
    Filter as FilterIcon,
    RefreshCw,
    Info, // Used for general info in modal
    BookOpen, // For catalog/product
    ExternalLink, // For external links in modal
    Eye, // For published status
    Edit3, // For draft status
    X // For errors/closing modal
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Custom debounce from lodash for filters
import { debounce } from "lodash";

// --- Design Constants ---
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"]; // Cyan shades
const STATUS_COLORS = {
    "published": "#10B981", // Green-500
    "draft": "#3B82F6",    // Blue-500
    "retired": "#EF4444", // Red-500 (Assuming 'retired' as a common product status for inactive)
    "unpublished": "#F59E0B", // Orange-500 (Assuming 'unpublished' as a common product status)
    "unknown": "#6B7280"   // Gray-500
};

// Helper to get status badge style
const getStatusBadgeClass = (status) => {
    const color = STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS["unknown"];
    // Ensure the color is used correctly for Tailwind JIT compilation
    const bgColorClass = `bg-[${color}]`;
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${bgColorClass}`;
};

// --- Product Detail Modal Component (Similar to QuoteDetailModal) ---
const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;

    const DetailItem = ({ label, value, icon: Icon, valueClass = "font-medium text-gray-800", linkHref = null }) => (
        <div className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
            {Icon && <Icon className="text-cyan-700 flex-shrink-0 mt-1" size={18} />}
            <span className="font-semibold text-gray-600 w-36 flex-shrink-0">{label}:</span>
            {linkHref ? (
                <a href={linkHref} target="_blank" rel="noopener noreferrer" className={`flex-1 ${valueClass} text-cyan-700 hover:underline flex items-center`}>
                    {value} <ExternalLink className="inline ml-1 text-xs" size={14} />
                </a>
            ) : (
                <span className={`flex-1 ${valueClass}`}>{value}</span>
            )}
        </div>
    );

    const getProductStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'published': return Eye;
            case 'draft': return Edit3;
            case 'retired': return MinusCircle; // Assuming MinusCircle for retired, adapt as needed
            case 'unpublished': return Clock; // Assuming Clock for unpublished, adapt as needed
            default: return Info;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
                    <h2 className="text-xl font-bold flex items-center">
                        <BookOpen className="mr-3 text-cyan-200" size={24} />
                        Product {product.number} Details
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
                        {/* General Product Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <List className="mr-2" size={20} /> General Information
                            </h3>
                            <DetailItem label="Product Name" value={product.name || 'N/A'} icon={BookOpen} />
                            <DetailItem label="Product Code" value={product.code || 'N/A'} icon={Tag} />
                            <DetailItem label="Number" value={product.number || 'N/A'} icon={Tag} />
                            <DetailItem
                                label="Status"
                                value={product.status?.toUpperCase() || 'N/A'}
                                icon={getProductStatusIcon(product.status)}
                                valueClass={`font-bold ${STATUS_COLORS[product.status?.toLowerCase()] ? `text-[${STATUS_COLORS[product.status?.toLowerCase()]}]` : 'text-gray-600'}`}
                            />
                            <DetailItem label="Description" value={product.description || 'N/A'} icon={Info} />
                            <DetailItem label="Is Default" value={product.is_default ? 'Yes' : 'No'} icon={CheckCircle} />
                            <DetailItem label="Start Date" value={product.start_date ? moment(product.start_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="End Date" value={product.end_date ? moment(product.end_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                        </div>

                        {/* System Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Clock className="mr-2" size={20} /> System Information
                            </h3>
                            <DetailItem label="Created On" value={product.sys_created_on ? moment(product.sys_created_on).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Created By" value={product.sys_created_by || 'N/A'} icon={Users} />
                            <DetailItem label="Last Updated" value={product.sys_updated_on ? moment(product.sys_updated_on).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
                            <DetailItem label="Last Updated By" value={product.sys_updated_by || 'N/A'} icon={Users} />
                            <DetailItem label="Modification Count" value={product.sys_mod_count || 0} icon={Activity} />
                        </div>

                        {/* Categories */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Building2 className="mr-2" size={20} /> Categories ({product.categories?.length || 0})
                            </h3>
                            {product.categories && product.categories.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                                    {product.categories.map((category, index) => (
                                        <li key={category._id || index} className="flex items-center">
                                            <Tag size={14} className="mr-2 text-gray-500 flex-shrink-0" />
                                            <div>
                                                <span className="font-medium text-cyan-700">{category.name}</span> (Code: {category.code})
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Status: <span className={getStatusBadgeClass(category.status || "Unknown")}>{category.status?.toUpperCase()}</span>
                                                    {category.start_date && ` | Starts: ${moment(category.start_date).format('YYYY-MM-DD')}`}
                                                    {category.end_date && ` | Ends: ${moment(category.end_date).format('YYYY-MM-DD')}`}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No categories associated with this product offering.</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Product Catalog Dashboard Component ---
const ProductCatalogDashboard = () => {
    const dispatch = useDispatch();
    const {
        data: products,
        loading,
        error,
        total: totalItemsRedux,
    } = useSelector((state) => state.productOfferingCatalog); // Ensure this slice name matches your Redux store

    // Local state for filters and pagination
    const [searchText, setSearchText] = useState(''); // Search by name, code, or number
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(''); // New filter for categories
    const [startDateFilter, setStartDateFilter] = useState(null);
    const [endDateFilter, setEndDateFilter] = useState(null);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Fixed items per page
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" }); // Default sort

    // New states from example design
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'chart'
    const [expandedFilters, setExpandedFilters] = useState(false); // For filter section
    const [expandedCharts, setExpandedCharts] = useState(true); // For chart section

    // Debounced filter handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetCategoryFilter = useCallback(debounce((value) => setCategoryFilter(value), 300), []);


    // Fetch initial data (fetching a larger limit for client-side filtering)
    useEffect(() => {
        // Fetch all for client-side filtering, or adapt if your API supports server-side filtering
        if (!products || products.length === 0 || totalItemsRedux === 0) {
            dispatch(getall({ page: 1, limit: 1000 }));
        }
    }, [dispatch, products, totalItemsRedux]);

    // Extract unique filter options
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set();
        products.forEach(product => {
            if (product.status) statuses.add(product.status);
        });
        return Array.from(statuses).sort();
    }, [products]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set();
        products.forEach(product => {
            product.categories?.forEach(category => {
                if (category.name) categories.add(category.name);
            });
        });
        return Array.from(categories).sort();
    }, [products]);


    // Memoized filtered data
    const filteredData = useMemo(() => {
        let currentFilteredData = products;

        if (searchText) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.code?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.number?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (statusFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.status?.toLowerCase() === statusFilter.toLowerCase());
        }

        if (categoryFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.categories?.some(cat => cat.name?.toLowerCase().includes(categoryFilter.toLowerCase()))
            );
        }

        if (startDateFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.start_date && moment(item.start_date).isSameOrAfter(startDateFilter, 'day')
            );
        }

        if (endDateFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.end_date && moment(item.end_date).isSameOrBefore(endDateFilter, 'day')
            );
        }

        return currentFilteredData;
    }, [
        products,
        searchText,
        statusFilter,
        categoryFilter,
        startDateFilter,
        endDateFilter
    ]);

    // Sorting logic
    const sortedProducts = useMemo(() => {
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'category_names') {
                    aValue = (a.categories || []).map(cat => cat.name).join(', ').toLowerCase();
                    bValue = (b.categories || []).map(cat => cat.name).join(', ').toLowerCase();
                } else if (sortConfig.key === 'start_date' || sortConfig.key === 'end_date' || sortConfig.key === 'sys_created_on') {
                    aValue = moment(a[sortConfig.key]).valueOf();
                    bValue = moment(b[sortConfig.key]).valueOf();
                } else {
                    aValue = a[sortConfig.key]?.toLowerCase() || "";
                    bValue = b[sortConfig.key]?.toLowerCase() || "";
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

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedProducts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

    // Metrics calculations
    const productMetrics = useMemo(() => {
        const metrics = {
            total: products.length,
            published: 0,
            draft: 0,
            retired: 0,
            newThisMonth: 0,
        };

        const currentDate = moment();
        products.forEach(item => {
            if (item.status?.toLowerCase() === "published") metrics.published++;
            if (item.status?.toLowerCase() === "draft") metrics.draft++;
            if (item.status?.toLowerCase() === "retired") metrics.retired++;

            const createdDate = moment(item.createdAt || item.sys_created_on); // Use createdAt or sys_created_on
            if (createdDate.isValid() && createdDate.month() === currentDate.month() &&
                createdDate.year() === currentDate.year()) {
                metrics.newThisMonth++;
            }
        });

        return metrics;
    }, [products]);

    // Chart data calculations
    const statusData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            const status = item.status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const creationTrendData = useMemo(() => {
        const monthlyCounts = filteredData.reduce((acc, item) => {
            const dateStr = item.createdAt || item.sys_created_on; // Use createdAt or sys_created_on
            if (!dateStr) return acc;
            try {
                const date = moment(dateStr);
                const monthYear = date.format('YYYY-MM');
                acc[monthYear] = (acc[monthYear] || 0) + 1;
            } catch (e) {
                console.error("Invalid date format for creationTrendData:", dateStr);
            }
            return acc;
        }, {});
        return Object.entries(monthlyCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredData]);

    const categoryDistributionData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            (item.categories || []).forEach(category => {
                const categoryName = category.name || "Unknown";
                acc[categoryName] = (acc[categoryName] || 0) + 1;
            });
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const exportToCSV = () => {
        const headers = ["name", "code", "number", "status", "start_date", "end_date", "categories", "sys_created_on", "sys_updated_on"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.name || ''}"`,
                `"${item.code || ''}"`,
                `"${item.number || ''}"`,
                `"${item.status || ''}"`,
                `"${item.start_date ? moment(item.start_date).format('YYYY-MM-DD') : ''}"`,
                `"${item.end_date ? moment(item.end_date).format('YYYY-MM-DD') : ''}"`,
                `"${(item.categories || []).map(cat => cat.name).join('; ')}"`, // Join category names
                `"${item.sys_created_on ? moment(item.sys_created_on).format('YYYY-MM-DD HH:mm') : ''}"`,
                `"${item.sys_updated_on ? moment(item.sys_updated_on).format('YYYY-MM-DD HH:mm') : ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "product_catalog.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetFilters = () => {
        setSearchText("");
        setStatusFilter("");
        setCategoryFilter("");
        setStartDateFilter(null);
        setEndDateFilter(null);
        setCurrentPage(1);
        setSortConfig({ key: "name", direction: "asc" }); // Reset sort as well
    };

    const handleRowClick = useCallback((product) => {
        setSelectedProduct(product);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedProduct(null);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-gray-900">Loading Product Catalog</h3>
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
                    <p className="text-gray-600 mb-6">{error.message || error || "An unknown error occurred."}</p>
                    <button
                        onClick={() => dispatch(getall({ page: 1, limit: 1000 }))} // Retry fetch
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
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <BookOpen className="mr-3 text-cyan-700" size={28} />
                        Product Catalog Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1 text-base">
                        Comprehensive overview and management of your product offerings.
                    </p>
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
                        onClick={() => dispatch(getall({ page: 1, limit: 1000 }))}
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
                        <p className="text-sm font-medium text-gray-500">Total Products</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{productMetrics.total}</p>
                    </div>
                    <BookOpen className="text-cyan-600" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Published Products</p>
                        <p className="mt-1 text-3xl font-bold text-green-600">{productMetrics.published}</p>
                    </div>
                    <Eye className="text-green-500" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Draft Products</p>
                        <p className="mt-1 text-3xl font-bold text-blue-600">{productMetrics.draft}</p>
                    </div>
                    <Edit3 className="text-blue-500" size={32} />
                </div>
                <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-100">New This Month</p>
                        <p className="mt-1 text-3xl font-bold">{productMetrics.newThisMonth}</p>
                    </div>
                    <Calendar className="text-cyan-200" size={36} />
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedFilters(!expandedFilters)}>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <FilterIcon className="mr-2 text-cyan-700" size={22} />
                        Filters
                    </h2>
                    {expandedFilters ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
                </div>

                {expandedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6 animate-fade-in">
                        <div className="flex flex-col">
                            <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Name/Code/Number</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search product"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetSearchText(e.target.value)}
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
                            <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700 mb-1">Category</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="categoryFilter"
                                    placeholder="Filter by category"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetCategoryFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="startDateFilter" className="text-sm font-medium text-gray-700 mb-1">Valid From</label>
                            <input
                                type="date"
                                id="startDateFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={startDateFilter || ''}
                                onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="endDateFilter" className="text-sm font-medium text-gray-700 mb-1">Valid To</label>
                            <input
                                type="date"
                                id="endDateFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={endDateFilter || ''}
                                onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
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
                                        onClick={() => requestSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Product Name
                                            {sortConfig.key === 'name' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('code')}
                                    >
                                        <div className="flex items-center">
                                            Code
                                            {sortConfig.key === 'code' && (
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
                                        onClick={() => requestSort('start_date')}
                                    >
                                        <div className="flex items-center">
                                            Start Date
                                            {sortConfig.key === 'start_date' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('end_date')}
                                    >
                                        <div className="flex items-center">
                                            End Date
                                            {sortConfig.key === 'end_date' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('category_names')}
                                    >
                                        <div className="flex items-center">
                                            Categories
                                            {sortConfig.key === 'category_names' && (
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
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((product) => (
                                        <tr
                                            key={product._id}
                                            className="odd:bg-gray-50 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => handleRowClick(product)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{product.code || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">
                                               {product.status}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {product.start_date ? moment(product.start_date).format('YYYY-MM-DD') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {product.end_date ? moment(product.end_date).format('YYYY-MM-DD') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {(product.categories || []).map(cat => cat.name).join(', ') || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRowClick(product); }}
                                                    className="text-cyan-600 hover:text-cyan-900 focus:outline-none focus:underline"
                                                    aria-label={`View details for product ${product.name}`}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                            No products found matching your criteria.
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
                            Product Analytics
                        </h2>
                        {expandedCharts ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
                    </div>

                    {expandedCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Activity className="mr-2" size={18} /> Products by Status</h3>
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
                                        <Tooltip formatter={(value, name) => [`${value} Products`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Building2 className="mr-2" size={18} /> Products by Category</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={categoryDistributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
                                        <YAxis />
                                        <Tooltip formatter={(value, name) => [`${value} Products`, name]} />
                                        <Bar dataKey="value" fill="#00A3C4" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="mr-2" size={18} /> Product Creation Trend</h3>
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
                                        <Line type="monotone" dataKey="count" stroke="#007B98" activeDot={{ r: 8 }} name="Products Created" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {selectedProduct && (
                <ProductDetailModal product={selectedProduct} onClose={closeModal} />
            )}
        </div>
    );
};

export default ProductCatalogDashboard;