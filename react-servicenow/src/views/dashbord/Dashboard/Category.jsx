"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getall } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
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
    Box,
    Tag,
    Clock,
    CheckCircle,
    Archive,
    Edit,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    ChevronLeft,
    Filter as FilterIcon,
    RefreshCw,
    MoreHorizontal,
    X,
    Info,
    ExternalLink,Activity 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { debounce } from "lodash";

// Design Constants
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"];
const STATUS_COLORS = {
    "published": "#10B981", // Green-500
    "draft": "#3B82F6",    // Blue-500
    "archived": "#9CA3AF",  // Gray-400
    "Unknown": "#6B7280"   // Gray-500
};

const getStatusBadgeClass = (status) => {
    const color = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS["Unknown"];
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-[${color}]`;
};

// Category Detail Modal Component
const CategoryDetailModal = ({ category, onClose }) => {
    if (!category) return null;

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
            case 'draft': return Edit;
            case 'archived': return Archive;
            default: return Info;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
                    <h2 className="text-xl font-bold flex items-center">
                        <Box className="mr-3 text-cyan-200" size={24} />
                        Category {category.name} Details
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
                        {/* General Category Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <List className="mr-2" size={20} /> General Information
                            </h3>
                            <DetailItem label="Category Name" value={category.name || 'N/A'} icon={Tag} />
                            <DetailItem label="Category Code" value={category.code || 'N/A'} icon={Tag} />
                            <DetailItem label="Category Number" value={category.number || 'N/A'} icon={Tag} />
                            <DetailItem
                                label="Status"
                                value={category.status?.toUpperCase() || 'N/A'}
                                icon={getStatusIcon(category.status)}
                                valueClass={`font-bold ${STATUS_COLORS[category.status?.toLowerCase()] ? `text-[${STATUS_COLORS[category.status?.toLowerCase()]}]` : 'text-gray-600'}`}
                            />
                            <DetailItem label="Description" value={category.description || 'N/A'} icon={Info} />
                            <DetailItem label="Is Leaf Category" value={category.is_leaf ? 'Yes' : 'No'} icon={CheckCircle} />
                        </div>

                        {/* Validity Period */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Calendar className="mr-2" size={20} /> Validity Period
                            </h3>
                            <DetailItem label="Start Date" value={category.start_date ? moment(category.start_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="End Date" value={category.end_date ? moment(category.end_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Created On" value={category.createdAt ? moment(category.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Last Updated" value={category.updatedAt ? moment(category.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
                        </div>

                        {/* Product Offerings */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Box className="mr-2" size={20} /> Product Offerings ({category.productOffering?.length || 0})
                            </h3>
                            {category.productOffering && category.productOffering.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valid From</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valid To</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {category.productOffering.map((offering, index) => (
                                                <tr key={offering._id || index}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{offering.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{offering.description || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                      {offering.status || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                        {offering.validFor?.startDateTime || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                        {offering.validFor?.endDateTime || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No product offerings associated with this category.</p>
                            )}
                        </div>

                        {/* System Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Clock className="mr-2" size={20} /> System Information
                            </h3>
                            <DetailItem label="Created By" value={category.sys_created_by || 'N/A'} icon={Info} />
                            <DetailItem label="Updated By" value={category.sys_updated_by || 'N/A'} icon={Info} />
                            <DetailItem label="System ID" value={category.sys_id || 'N/A'} icon={Tag} />
                            <DetailItem label="External ID" value={category.external_id || 'N/A'} icon={Tag} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Categories Dashboard Component
const CategoriesDashboard = () => {
    const dispatch = useDispatch();
    const {
        data: categories,
        loading,
        error,
        total: totalItemsRedux,
    } = useSelector((state) => state.productOfferingCategory);

    // Local state for filters and pagination
    const [searchText, setSearchText] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [codeFilter, setCodeFilter] = useState('');
    const [isLeafFilter, setIsLeafFilter] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const [viewMode, setViewMode] = useState("table");
    const [expandedFilters, setExpandedFilters] = useState(false);
    const [expandedCharts, setExpandedCharts] = useState(true);

    // Debounced filter handlers
    const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);
    const debouncedSetNameFilter = useCallback(debounce((value) => setNameFilter(value), 300), []);

    // Fetch initial data
    useEffect(() => {
        if (!categories || categories.length === 0 || totalItemsRedux === 0) {
            dispatch(getall({ page: 1, limit: 1000 }));
        }
    }, [dispatch, categories, totalItemsRedux]);

    // Extract unique filter options
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set();
        categories.forEach(category => {
            if (category.status) statuses.add(category.status);
        });
        return Array.from(statuses).sort();
    }, [categories]);

    const uniqueCodes = useMemo(() => {
        const codes = new Set();
        categories.forEach(category => {
            if (category.code) codes.add(category.code);
        });
        return Array.from(codes).sort();
    }, [categories]);

    // Memoized filtered data
    const filteredData = useMemo(() => {
        let currentFilteredData = categories;

        if (searchText) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.number?.toLowerCase().includes(searchText.toLowerCase()) ||
                item._id?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (nameFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.name?.toLowerCase().includes(nameFilter.toLowerCase())
            );
        }

        if (statusFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.status?.toLowerCase() === statusFilter.toLowerCase());
        }

        if (codeFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.code?.toLowerCase() === codeFilter.toLowerCase());
        }

        if (isLeafFilter !== '') {
            const isLeafBool = isLeafFilter === 'true';
            currentFilteredData = currentFilteredData.filter(item => item.is_leaf === isLeafBool);
        }

        // Date range filter
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
        categories,
        searchText,
        nameFilter,
        statusFilter,
        codeFilter,
        isLeafFilter,
        dateRange
    ]);

    // Sorting logic
    const sortedCategories = useMemo(() => {
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'productCount') {
                    aValue = a.productOffering?.length || 0;
                    bValue = b.productOffering?.length || 0;
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

    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedCategories.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedCategories, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

    // Metrics calculations
    const categoryMetrics = useMemo(() => {
        const metrics = {
            total: categories.length,
            published: 0,
            draft: 0,
            archived: 0,
            withProducts: 0,
            leafCategories: 0,
            newThisMonth: 0
        };

        const currentDate = moment();
        categories.forEach(item => {
            if (item.status?.toLowerCase() === "published") metrics.published++;
            if (item.status?.toLowerCase() === "draft") metrics.draft++;
            if (item.status?.toLowerCase() === "archived") metrics.archived++;
            
            if (item.productOffering && item.productOffering.length > 0) {
                metrics.withProducts++;
            }

            if (item.is_leaf) {
                metrics.leafCategories++;
            }

            const createdDate = moment(item.createdAt);
            if (createdDate.month() === currentDate.month() &&
                createdDate.year() === currentDate.year()) {
                metrics.newThisMonth++;
            }
        });

        return metrics;
    }, [categories]);

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

    const productCountData = useMemo(() => {
        return filteredData
            .filter(item => item.productOffering && item.productOffering.length > 0)
            .map(item => ({
                name: item.name,
                products: item.productOffering.length
            }))
            .sort((a, b) => b.products - a.products)
            .slice(0, 10);
    }, [filteredData]);

    const exportToCSV = () => {
        const headers = ["name", "code", "number", "status", "is_leaf", "product_count", "created_at"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.name || ''}"`,
                `"${item.code || ''}"`,
                `"${item.number || ''}"`,
                `"${item.status || ''}"`,
                `"${item.is_leaf ? 'Yes' : 'No'}"`,
                `"${item.productOffering?.length || 0}"`,
                `"${item.createdAt || ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "categories.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetFilters = () => {
        setSearchText("");
        setNameFilter("");
        setStatusFilter("");
        setCodeFilter("");
        setIsLeafFilter("");
        setDateRange({ from: '', to: '' });
        setCurrentPage(1);
        setSortConfig({ key: "name", direction: "asc" });
    };

    const handleRowClick = useCallback((category) => {
        setSelectedCategory(category);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedCategory(null);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-cyan-700">Loading Categories</h3>
                    <p className="text-gray-500">Fetching the latest category data...</p>
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
                    <p className="text-gray-600 mb-6">{error.message || error || "An unknown error occurred."}</p>
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
                        <Box className="mr-3 text-cyan-700" size={28} />
                        Product Categories Dashboard
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
                        <p className="text-sm font-medium text-gray-500">Total Categories</p>
                        <p className="mt-1 text-3xl font-bold text-cyan-700">{categoryMetrics.total}</p>
                    </div>
                    <Box className="text-cyan-600" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Published</p>
                        <p className="mt-1 text-3xl font-bold text-green-600">{categoryMetrics.published}</p>
                    </div>
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">With Products</p>
                        <p className="mt-1 text-3xl font-bold text-cyan-600">{categoryMetrics.withProducts}</p>
                    </div>
                    <Box className="text-cyan-500" size={32} />
                </div>
                <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-100">Leaf Categories</p>
                        <p className="mt-1 text-3xl font-bold">{categoryMetrics.leafCategories}</p>
                    </div>
                    <Box className="text-cyan-200" size={36} />
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
                            <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Name/Number/ID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by name, number or ID"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetSearchText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="nameFilter" className="text-sm font-medium text-gray-700 mb-1">Category Name</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="nameFilter"
                                    placeholder="Filter by name"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetNameFilter(e.target.value)}
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
                            <label htmlFor="codeFilter" className="text-sm font-medium text-gray-700 mb-1">Code</label>
                            <select
                                id="codeFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={codeFilter}
                                onChange={(e) => { setCodeFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Codes</option>
                                {uniqueCodes.map(code => (
                                    <option key={code} value={code}>{code}</option>
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
                            <label htmlFor="isLeafFilter" className="text-sm font-medium text-gray-700 mb-1">Leaf Category</label>
                            <select
                                id="isLeafFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={isLeafFilter}
                                onChange={(e) => { setIsLeafFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
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
                                            Category Name
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
                                        onClick={() => requestSort('is_leaf')}
                                    >
                                        <div className="flex items-center">
                                            Is Leaf
                                            {sortConfig.key === 'is_leaf' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('productCount')}
                                    >
                                        <div className="flex items-center">
                                            Products
                                            {sortConfig.key === 'productCount' && (
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
                                {paginatedCategories.length > 0 ? (
                                    paginatedCategories.map((category) => (
                                        <tr
                                            key={category._id}
                                            className="odd:bg-gray-50 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => handleRowClick(category)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{category.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{category.code || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">
                                               {category.status}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {category.is_leaf ? 'Yes' : 'No'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-700 font-semibold">
                                                {category.productOffering?.length || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {moment(category.createdAt).format('YYYY-MM-DD')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRowClick(category); }}
                                                    className="text-cyan-600 hover:text-cyan-900 focus:outline-none focus:underline"
                                                    aria-label={`View details for category ${category.name}`}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                            No categories found matching your criteria.
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
                            Category Analytics
                        </h2>
                        {expandedCharts ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
                    </div>

                    {expandedCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Activity className="mr-2" size={18} /> Categories by Status</h3>
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
                                        <Tooltip formatter={(value, name) => [`${value} Categories`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Box className="mr-2" size={18} /> Top Categories by Product Count</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={productCountData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value, name) => [`${value} Products`, name]} />
                                        <Bar dataKey="products" fill="#007B98" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="mr-2" size={18} /> Category Creation Trend</h3>
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
                                        <Line type="monotone" dataKey="count" stroke="#007B98" activeDot={{ r: 8 }} name="Categories Created" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedCategory && (
                <CategoryDetailModal category={selectedCategory} onClose={closeModal} />
            )}
        </div>
    );
};

export default CategoriesDashboard;