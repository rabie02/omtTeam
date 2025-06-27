"use client"; // This directive is typically used in Next.js for client-side components

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getall } from '../../../features/servicenow/product-offering/productOfferingSlice';
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
    Package,
    Users,
    Clock,
    CheckCircle,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    ChevronLeft,
    DollarSign,
    Percent,
    Tag,
    Activity,
    Filter as FilterIcon,
    RefreshCw,
    MoreHorizontal,
    X,
    Info,
    BookOpen,
    Leaf,
    PlayCircle,
    PauseCircle,
    Archive,
    ExternalLink,
    MinusCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { debounce } from "lodash";

// --- Design Constants ---
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"];
const STATUS_COLORS = {
    "published": "#10B981",
    "draft": "#3B82F6",
    "archived": "#9CA3AF",
    "retired": "#EF4444",
    "unknown": "#6B7280"
};
const CURRENCY_COLORS = {
    "USD": "#007B98",
    "EUR": "#F59E0B",
    "GBP": "#6366F1",
    "Unknown": "#9CA3AF"
};

// Helper to get status badge style
const getStatusBadgeClass = (status) => {
    const color = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS["unknown"];
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${color.replace('#', 'bg-[')}]`;
};

// --- Product Offering Detail Modal Component ---
const ProductOfferingDetailModal = ({ product, onClose }) => {
    if (!product) return null;

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
            case 'published': return CheckCircle;
            case 'draft': return Tag;
            case 'archived': return Archive;
            case 'retired': return MinusCircle;
            default: return Info;
        }
    };

    const getPriceInfo = (priceType) => {
        const priceItem = product.productOfferingPrice?.find(p => p.priceType === priceType);
        if (!priceItem) return 'N/A';
        const amount = priceItem.price?.taxIncludedAmount;
        return amount ? `${amount.value} ${amount.unit}` : 'N/A';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
                    <h2 className="text-xl font-bold flex items-center">
                        <Package className="mr-3 text-cyan-200" size={24} />
                        Product Offering: {product.name || product.id} Details
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
                        {/* General Product Offering Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <List className="mr-2" size={20} /> General Information
                            </h3>
                            <DetailItem label="Name" value={product.name || 'N/A'} icon={Tag} />
                            <DetailItem label="ID" value={product.id || 'N/A'} icon={Tag} />
                            <DetailItem label="Description" value={product.description || 'N/A'} icon={BookOpen} />
                            <DetailItem
                                label="Status"
                                value={product.status?.toUpperCase() || 'N/A'}
                                icon={getStatusIcon(product.status)}
                                valueClass={`font-bold ${STATUS_COLORS[product.status?.toLowerCase()] ? `text-[${STATUS_COLORS[product.status?.toLowerCase()]}]` : 'text-cyan-700'}`}
                            />
                            <DetailItem label="Lifecycle Status" value={product.lifecycleStatus || 'N/A'} icon={Activity} />
                            <DetailItem label="Version" value={product.version || 'N/A'} icon={Tag} />
                            <DetailItem label="Valid From" value={product.validFor?.startDateTime ? moment(product.validFor.startDateTime).format('YYYY-MM-DD') : 'N/A'} icon={PlayCircle} />
                            <DetailItem label="Valid To" value={product.validFor?.endDateTime ? moment(product.validFor.endDateTime).format('YYYY-MM-DD') : 'N/A'} icon={PauseCircle} />
                        </div>

                        {/* Pricing Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <DollarSign className="mr-2" size={20} /> Pricing Information
                            </h3>
                            <DetailItem label="Recurring Price" value={getPriceInfo('recurring')} icon={DollarSign} />
                            <DetailItem label="Non-Recurring Price" value={getPriceInfo('nonRecurring')} icon={DollarSign} />
                            <DetailItem label="Term" value={product.productOfferingTerm || 'N/A'} icon={Clock} />
                        </div>

                        {/* Category Information */}
                        {product.category && product.category.length > 0 && (
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                    <Tag className="mr-2" size={20} /> Category
                                </h3>
                                {product.category.map((cat, index) => (
                                    <React.Fragment key={cat._id || index}>
                                        <DetailItem label="Name" value={cat.name || 'N/A'} icon={Tag} />
                                        <DetailItem label="Code" value={cat.code || 'N/A'} icon={Tag} />
                                        <DetailItem label="Status" value={cat.status || 'N/A'} icon={Info} />
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {/* Product Specification */}
                        {product.productSpecification && (
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                    <Package className="mr-2" size={20} /> Product Specification
                                </h3>
                                <DetailItem label="Name" value={product.productSpecification.name || 'N/A'} icon={Tag} />
                                <DetailItem label="Description" value={product.productSpecification.description || 'N/A'} icon={BookOpen} />
                                <DetailItem label="Status" value={product.productSpecification.status || 'N/A'} icon={Info} />
                                {product.productSpecification.productSpecCharacteristic?.map((char, idx) => (
                                    <DetailItem 
                                        key={idx} 
                                        label={char.name} 
                                        value={char.productSpecCharacteristicValue?.[0]?.value || 'N/A'} 
                                        icon={Info}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Product Offering Dashboard Component ---
const ProductOfferingDashboard = () => {
    const dispatch = useDispatch();
    const {
        data: productOfferings,
        loading,
        error,
        total: totalItemsRedux,
    } = useSelector((state) => state.productOffering);

    // Local state for filters and pagination
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [lifecycleStatusFilter, setLifecycleStatusFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState(null);
    const [endDateFilter, setEndDateFilter] = useState(null);

    const [selectedProductOffering, setSelectedProductOffering] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const [viewMode, setViewMode] = useState("table");
    const [expandedFilters, setExpandedFilters] = useState(false);
    const [expandedCharts, setExpandedCharts] = useState(true);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    // Debounced filter handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);

    // Fetch initial data
    useEffect(() => {
        if (!productOfferings || productOfferings.length === 0 || totalItemsRedux === 0) {
            dispatch(getall({ page: 1, limit: 1000 }));
        }
    }, [dispatch, productOfferings, totalItemsRedux]);

    // Extract unique filter options
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set();
        productOfferings.forEach(product => {
            if (product.status) statuses.add(product.status);
            if (product.lifecycleStatus) statuses.add(product.lifecycleStatus);
        });
        return Array.from(statuses).sort();
    }, [productOfferings]);

    const uniqueLifecycleStatuses = useMemo(() => {
        const statuses = new Set();
        productOfferings.forEach(product => {
            if (product.lifecycleStatus) statuses.add(product.lifecycleStatus);
        });
        return Array.from(statuses).sort();
    }, [productOfferings]);

    // Memoized filtered data
    const filteredData = useMemo(() => {
        let currentFilteredData = productOfferings;

        if (searchText) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.id?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (statusFilter) {
            currentFilteredData = currentFilteredData.filter(item => 
                item.status?.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        if (lifecycleStatusFilter) {
            currentFilteredData = currentFilteredData.filter(item => 
                item.lifecycleStatus?.toLowerCase() === lifecycleStatusFilter.toLowerCase()
            );
        }

        // Combined date range filter for creation date
        if (dateRange.from) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.validFor?.startDateTime && moment(item.validFor.startDateTime).isSameOrAfter(dateRange.from, 'day')
            );
        }
        if (dateRange.to) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.validFor?.endDateTime && moment(item.validFor.endDateTime).isSameOrBefore(dateRange.to, 'day')
            );
        }

        // Separate start/end date filters for product validity
        if (startDateFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.validFor?.startDateTime && moment(item.validFor.startDateTime).isSameOrAfter(startDateFilter, 'day')
            );
        }

        if (endDateFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.validFor?.endDateTime && moment(item.validFor.endDateTime).isSameOrBefore(endDateFilter, 'day')
            );
        }

        return currentFilteredData;
    }, [
        productOfferings,
        searchText,
        statusFilter,
        lifecycleStatusFilter,
        dateRange,
        startDateFilter,
        endDateFilter
    ]);

    // Sorting logic
    const sortedProductOfferings = useMemo(() => {
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'validFor') {
                    aValue = a.validFor?.startDateTime ? moment(a.validFor.startDateTime).valueOf() : (sortConfig.direction === "asc" ? Infinity : -Infinity);
                    bValue = b.validFor?.startDateTime ? moment(b.validFor.startDateTime).valueOf() : (sortConfig.direction === "asc" ? Infinity : -Infinity);
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

    const paginatedProductOfferings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedProductOfferings.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedProductOfferings, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedProductOfferings.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

    // Metrics calculations
    const productOfferingMetrics = useMemo(() => {
        const metrics = {
            total: productOfferings.length,
            published: 0,
            draft: 0,
            active: 0,
            newThisMonth: 0
        };

        const currentDate = moment();
        productOfferings.forEach(item => {
            if (item.status?.toLowerCase() === "published") metrics.published++;
            if (item.status?.toLowerCase() === "draft") metrics.draft++;

            // Check for active now
            const startDate = item.validFor?.startDateTime ? moment(item.validFor.startDateTime) : null;
            const endDate = item.validFor?.endDateTime ? moment(item.validFor.endDateTime) : null;

            if (startDate && startDate.isSameOrBefore(currentDate, 'day') &&
                (endDate === null || endDate.isSameOrAfter(currentDate, 'day'))) {
                metrics.active++;
            }

            const createdDate = moment(item.createdAt);
            if (createdDate.month() === currentDate.month() &&
                createdDate.year() === currentDate.year()) {
                metrics.newThisMonth++;
            }
        });

        return metrics;
    }, [productOfferings]);

    // Chart data calculations
    const statusData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            const status = item.status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const lifecycleStatusData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            const status = item.lifecycleStatus || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
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
        const headers = ["name", "id", "status", "lifecycleStatus", "version", "description", "startDate", "endDate"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.name || ''}"`,
                `"${item.id || ''}"`,
                `"${item.status || ''}"`,
                `"${item.lifecycleStatus || ''}"`,
                `"${item.version || ''}"`,
                `"${item.description || ''}"`,
                `"${item.validFor?.startDateTime || ''}"`,
                `"${item.validFor?.endDateTime || ''}"`
            ].join(","))
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
        setSearchText("");
        setStatusFilter("");
        setLifecycleStatusFilter("");
        setStartDateFilter(null);
        setEndDateFilter(null);
        setDateRange({ from: '', to: '' });
        setCurrentPage(1);
        setSortConfig({ key: "name", direction: "asc" });
    };

    const handleRowClick = useCallback((product) => {
        setSelectedProductOffering(product);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedProductOffering(null);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-cyan-700">Loading Product Offerings</h3>
                    <p className="text-gray-500">Fetching the latest product offering data...</p>
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
                        onClick={() => dispatch(getall({ page: 1, limit: 1000 }))}
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
                        <Package className="mr-3 text-cyan-700" size={28} />
                        Product Offerings Dashboard
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
                        <p className="mt-1 text-3xl font-bold text-cyan-700">{productOfferingMetrics.total}</p>
                    </div>
                    <Package className="text-cyan-600" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Published Products</p>
                        <p className="mt-1 text-3xl font-bold text-green-600">{productOfferingMetrics.published}</p>
                    </div>
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Draft Products</p>
                        <p className="mt-1 text-3xl font-bold text-blue-600">{productOfferingMetrics.draft}</p>
                    </div>
                    <Tag className="text-blue-500" size={32} />
                </div>
                <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-100">Active Products</p>
                        <p className="mt-1 text-3xl font-bold">{productOfferingMetrics.active}</p>
                    </div>
                    <Activity className="text-cyan-200" size={36} />
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
                            <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Name/ID/Description</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by name, ID or description"
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
                            <label htmlFor="lifecycleStatusFilter" className="text-sm font-medium text-gray-700 mb-1">Lifecycle Status</label>
                            <select
                                id="lifecycleStatusFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={lifecycleStatusFilter}
                                onChange={(e) => { setLifecycleStatusFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Lifecycle Statuses</option>
                                {uniqueLifecycleStatuses.map(status => (
                                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 mb-1">Valid From</label>
                            <input
                                type="date"
                                id="dateFrom"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={dateRange.from}
                                onChange={(e) => { setDateRange({ ...dateRange, from: e.target.value }); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="dateTo" className="text-sm font-medium text-gray-700 mb-1">Valid To</label>
                            <input
                                type="date"
                                id="dateTo"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={dateRange.to}
                                onChange={(e) => { setDateRange({ ...dateRange, to: e.target.value }); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="startDateFilter" className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                id="startDateFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={startDateFilter ? moment(startDateFilter).format('YYYY-MM-DD') : ''}
                                onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="endDateFilter" className="text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                id="endDateFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={endDateFilter ? moment(endDateFilter).format('YYYY-MM-DD') : ''}
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
                        <List className="inline-block mr-2" size={18} /> Table View
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${viewMode === 'chart' ? 'bg-cyan-700 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                        onClick={() => setViewMode('chart')}
                    >
                        <PieChartIcon className="inline-block mr-2" size={18} /> Chart View
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === "table" && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <List className="mr-2 text-cyan-700" size={22} />
                        Product Offerings List ({sortedProductOfferings.length} items)
                    </h2>

                    {paginatedProductOfferings.length > 0 ? (
                        <>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => requestSort("name")}
                                            >
                                                Name
                                                {sortConfig.key === "name" && (
                                                    sortConfig.direction === "asc" ? <ArrowUp className="inline-block ml-1 h-3 w-3" /> : <ArrowDown className="inline-block ml-1 h-3 w-3" />
                                                )}
                                            </th>
                                           
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => requestSort("status")}
                                            >
                                                Status
                                                {sortConfig.key === "status" && (
                                                    sortConfig.direction === "asc" ? <ArrowUp className="inline-block ml-1 h-3 w-3" /> : <ArrowDown className="inline-block ml-1 h-3 w-3" />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => requestSort("lifecycleStatus")}
                                            >
                                                Lifecycle Status
                                                {sortConfig.key === "lifecycleStatus" && (
                                                    sortConfig.direction === "asc" ? <ArrowUp className="inline-block ml-1 h-3 w-3" /> : <ArrowDown className="inline-block ml-1 h-3 w-3" />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => requestSort("validFor")}
                                            >
                                                Valid From
                                                {sortConfig.key === "validFor" && (
                                                    sortConfig.direction === "asc" ? <ArrowUp className="inline-block ml-1 h-3 w-3" /> : <ArrowDown className="inline-block ml-1 h-3 w-3" />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedProductOfferings.map((product) => (
                                            <tr key={product._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(product)}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{product.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">{product.status}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">{product.lifecycleStatus}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {product.validFor?.startDateTime ? moment(product.validFor.startDateTime).format('YYYY-MM-DD') : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{product.description}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRowClick(product); }}
                                                        className="text-cyan-600 hover:text-cyan-900"
                                                        title="View Details"
                                                    >
                                                        <MoreHorizontal size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-6 flex justify-between items-center">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    <ChevronLeft size={16} className="mr-1" /> Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    Next <ChevronRight size={16} className="ml-1" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No product offerings found matching your criteria.</p>
                    )}
                </div>
            )}

            {viewMode === "chart" && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                    <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => setExpandedCharts(!expandedCharts)}>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <PieChartIcon className="mr-2 text-cyan-700" size={22} />
                            Product Offering Analytics
                        </h2>
                        {expandedCharts ? <ChevronUp size={20} className="text-cyan-700" /> : <ChevronDown size={20} className="text-cyan-700" />}
                    </div>

                    {expandedCharts && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            {/* Product Offering Status Distribution */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Offering Status Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Lifecycle Status Distribution */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lifecycle Status Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={lifecycleStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {lifecycleStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Product Offering Creation Trend */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-full">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Offering Creation Trend</h3>
                                <ResponsiveContainer width="100%" height={400}>
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

            {selectedProductOffering && (
                <ProductOfferingDetailModal product={selectedProductOffering} onClose={closeModal} />
            )}
        </div>
    );
};

export default ProductOfferingDashboard;