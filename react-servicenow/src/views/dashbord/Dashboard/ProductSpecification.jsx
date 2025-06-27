"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPublished } from '../../../features/servicenow/product-specification/productSpecificationSlice';
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
    Network,
    Server,
    CheckCircle,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    ChevronLeft,
    Tag,
    Activity,
    Filter as FilterIcon,
    RefreshCw,
    MoreHorizontal,
    X,
    Info,
    ExternalLink,
    Box,
    Layers,
    Cpu,
    Wifi,
    Database,
    HardDrive,
    Shield,
    Globe
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { debounce } from "lodash";

// Design Constants
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"];
const TYPE_COLORS = {
    "network": "#6366F1",    // Indigo
    "service": "#10B981",    // Emerald
    "hardware": "#F59E0B",   // Amber
    "software": "#3B82F6",   // Blue
    "Unknown": "#6B7280"     // Gray
};
const STATUS_COLORS = {
    "published": "#10B981",  // Green-500
    "draft": "#3B82F6",      // Blue-500
    "retired": "#9CA3AF",    // Gray-400
    "Unknown": "#6B7280"     // Gray-500
};

const getTypeBadgeClass = (type) => {
    const color = TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS["Unknown"];
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${color.replace('#', 'bg-[')}]`;
};

const getStatusBadgeClass = (status) => {
    const color = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS["Unknown"];
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${color.replace('#', 'bg-[')}]`;
};

// Product Specification Detail Modal
const ProductSpecDetailModal = ({ productSpec, onClose }) => {
    if (!productSpec) return null;

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

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'network': return Wifi;
            case 'service': return Server;
            case 'hardware': return Cpu;
            case 'software': return Database;
            default: return Box;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
                    <h2 className="text-xl font-bold flex items-center">
                        <Box className="mr-3 text-cyan-200" size={24} />
                        {productSpec.displayName || productSpec.name} Details
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
                        {/* General Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <List className="mr-2" size={20} /> General Information
                            </h3>
                            <DetailItem label="ID" value={productSpec._id || productSpec.id || 'N/A'} icon={Tag} />
                            <DetailItem label="Display Name" value={productSpec.displayName || productSpec.name || 'N/A'} icon={Box} />
                            <DetailItem label="Name" value={productSpec.name || 'N/A'} icon={Tag} />
                            <DetailItem label="Description" value={productSpec.description || 'N/A'} icon={Info} />
                            <DetailItem 
                                label="Type" 
                                value={productSpec.specification_type || 'N/A'} 
                                icon={getTypeIcon(productSpec.specification_type)}
                                valueClass={`font-bold ${TYPE_COLORS[productSpec.specification_type?.toLowerCase()] ? `text-[${TYPE_COLORS[productSpec.specification_type?.toLowerCase()]}]` : 'text-cyan-700'}`}
                            />
                            <DetailItem 
                                label="Status" 
                                value={productSpec.status?.toUpperCase() || productSpec.lifecycleStatus?.toUpperCase() || 'N/A'} 
                                icon={CheckCircle}
                                valueClass={`font-bold ${STATUS_COLORS[productSpec.status?.toLowerCase()] ? `text-[${STATUS_COLORS[productSpec.status?.toLowerCase()]}]` : 'text-cyan-700'}`}
                            />
                            <DetailItem label="Version" value={productSpec.version || productSpec.internalVersion || 'N/A'} icon={Tag} />
                            <DetailItem label="Is Bundle" value={productSpec.isBundle ? 'Yes' : 'No'} icon={Layers} />
                        </div>

                        {/* Validity Period */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Calendar className="mr-2" size={20} /> Validity Period
                            </h3>
                            <DetailItem 
                                label="Start Date" 
                                value={productSpec.validFor?.startDateTime ? moment(productSpec.validFor.startDateTime).format('YYYY-MM-DD HH:mm') : 'N/A'} 
                                icon={Calendar} 
                            />
                            <DetailItem 
                                label="End Date" 
                                value={productSpec.validFor?.endDateTime ? moment(productSpec.validFor.endDateTime).format('YYYY-MM-DD HH:mm') : 'N/A'} 
                                icon={Calendar} 
                            />
                            <DetailItem 
                                label="Last Update" 
                                value={productSpec.lastUpdate ? moment(productSpec.lastUpdate).format('YYYY-MM-DD HH:mm') : 'N/A'} 
                                icon={Calendar} 
                            />
                            <DetailItem 
                                label="Created At" 
                                value={productSpec.createdAt ? moment(productSpec.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} 
                                icon={Calendar} 
                            />
                            <DetailItem 
                                label="Updated At" 
                                value={productSpec.updatedAt ? moment(productSpec.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} 
                                icon={Calendar} 
                            />
                            <DetailItem 
                                label="Href" 
                                value={productSpec.href || 'N/A'} 
                                icon={ExternalLink}
                                linkHref={productSpec.href}
                            />
                        </div>

                        {/* Characteristics */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Activity className="mr-2" size={20} /> Characteristics ({productSpec.productSpecCharacteristic?.length || 0})
                            </h3>
                            {productSpec.productSpecCharacteristic && productSpec.productSpecCharacteristic.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Description</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Value Type</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Values</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {productSpec.productSpecCharacteristic.map((char, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{char.name}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{char.description}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{char.valueType}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                        {char.productSpecCharacteristicValue?.map((val, idx) => (
                                                            <div key={idx} className="mb-1 last:mb-0">
                                                                <span className="font-medium">{val.value}</span>
                                                                {val.isDefault && <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Default</span>}
                                                                {val.isMandatory && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Mandatory</span>}
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No characteristics defined for this product specification.</p>
                            )}
                        </div>

                        {/* Related Specifications */}
                        {(productSpec.resourceSpecification?.length > 0 || productSpec.serviceSpecification?.length > 0) && (
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                                <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                    <Layers className="mr-2" size={20} /> Related Specifications
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {productSpec.resourceSpecification?.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><HardDrive className="mr-2" size={16} /> Resource Specifications ({productSpec.resourceSpecification.length})</h4>
                                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                {productSpec.resourceSpecification.map((res, idx) => (
                                                    <li key={idx}>{res.name || res.id} (v{res.version || res.internalVersion || '1'})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {productSpec.serviceSpecification?.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><Globe className="mr-2" size={16} /> Service Specifications ({productSpec.serviceSpecification.length})</h4>
                                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                {productSpec.serviceSpecification.map((svc, idx) => (
                                                    <li key={idx}>{svc.name || svc.id} (v{svc.version || svc.internalVersion || '1'})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Product Specifications Dashboard Component
const ProductSpecificationsDashboard = () => {
    const dispatch = useDispatch();
    const {
        data: specifications,
        loading,
        error,
        total: totalItemsRedux,
    } = useSelector((state) => state.productSpecification);

    // Local state for filters and pagination
    const [searchText, setSearchText] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [bundleFilter, setBundleFilter] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    
    const [selectedSpec, setSelectedSpec] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const [viewMode, setViewMode] = useState("table");
    const [expandedFilters, setExpandedFilters] = useState(false);
    const [expandedCharts, setExpandedCharts] = useState(true);

    // Debounced filter handlers
    const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);

    // Fetch initial data
    useEffect(() => {
        if (!specifications || specifications.length === 0 || totalItemsRedux === 0) {
            dispatch(getPublished({ page: 1, limit: 1000 }));
        }
    }, [dispatch, specifications, totalItemsRedux]);

    // Extract unique filter options
    const uniqueTypes = useMemo(() => {
        const types = new Set();
        specifications.forEach(spec => {
            if (spec.specification_type) types.add(spec.specification_type);
        });
        return Array.from(types).sort();
    }, [specifications]);

    const uniqueStatuses = useMemo(() => {
        const statuses = new Set();
        specifications.forEach(spec => {
            const status = spec.status || spec.lifecycleStatus;
            if (status) statuses.add(status);
        });
        return Array.from(statuses).sort();
    }, [specifications]);

    // Memoized filtered data
    const filteredData = useMemo(() => {
        let currentFilteredData = specifications;

        if (searchText) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
                item._id?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (typeFilter) {
            currentFilteredData = currentFilteredData.filter(item => 
                item.specification_type?.toLowerCase() === typeFilter.toLowerCase()
            );
        }

        if (statusFilter) {
            currentFilteredData = currentFilteredData.filter(item => {
                const status = item.status || item.lifecycleStatus;
                return status?.toLowerCase() === statusFilter.toLowerCase();
            });
        }

        if (bundleFilter !== '') {
            const isBundleBool = bundleFilter === 'true';
            currentFilteredData = currentFilteredData.filter(item => item.isBundle === isBundleBool);
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
    }, [specifications, searchText, typeFilter, statusFilter, bundleFilter, dateRange]);

    // Sorting logic
    const sortedSpecs = useMemo(() => {
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'characteristicsCount') {
                    aValue = a.productSpecCharacteristic?.length || 0;
                    bValue = b.productSpecCharacteristic?.length || 0;
                } else if (sortConfig.key === 'validFor') {
                    aValue = a.validFor?.startDateTime ? moment(a.validFor.startDateTime).valueOf() : 0;
                    bValue = b.validFor?.startDateTime ? moment(b.validFor.startDateTime).valueOf() : 0;
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

    const paginatedSpecs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedSpecs.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedSpecs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedSpecs.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

    // Metrics calculations
    const specMetrics = useMemo(() => {
        const metrics = {
            total: specifications.length,
            network: 0,
            service: 0,
            hardware: 0,
            software: 0,
            published: 0,
            draft: 0,
            retired: 0,
            newThisMonth: 0,
            withCharacteristics: 0,
            bundles: 0
        };

        const currentDate = moment();
        specifications.forEach(item => {
            const type = item.specification_type?.toLowerCase();
            if (type === 'network') metrics.network++;
            if (type === 'service') metrics.service++;
            if (type === 'hardware') metrics.hardware++;
            if (type === 'software') metrics.software++;
            
            const status = item.status || item.lifecycleStatus;
            if (status?.toLowerCase() === 'published') metrics.published++;
            if (status?.toLowerCase() === 'draft') metrics.draft++;
            if (status?.toLowerCase() === 'retired') metrics.retired++;
            
            if (item.isBundle) metrics.bundles++;
            
            if (item.productSpecCharacteristic?.length > 0) metrics.withCharacteristics++;
            
            const createdDate = moment(item.createdAt);
            if (createdDate.month() === currentDate.month() &&
                createdDate.year() === currentDate.year()) {
                metrics.newThisMonth++;
            }
        });

        return metrics;
    }, [specifications]);

    // Chart data calculations
    const typeData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            const type = item.specification_type || "Unknown";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const statusData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            const status = item.status || item.lifecycleStatus || "Unknown";
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
        const headers = ["name", "displayName", "type", "status", "isBundle", "characteristicsCount", "createdAt"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.name || ''}"`,
                `"${item.displayName || ''}"`,
                `"${item.specification_type || ''}"`,
                `"${item.status || item.lifecycleStatus || ''}"`,
                `"${item.isBundle ? 'Yes' : 'No'}"`,
                `"${item.productSpecCharacteristic?.length || 0}"`,
                `"${item.createdAt || ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "product_specifications.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetFilters = () => {
        setSearchText("");
        setTypeFilter("");
        setStatusFilter("");
        setBundleFilter("");
        setDateRange({ from: '', to: '' });
        setCurrentPage(1);
        setSortConfig({ key: "name", direction: "asc" });
    };

    const handleRowClick = useCallback((spec) => {
        setSelectedSpec(spec);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedSpec(null);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-cyan-700">Loading Product Specifications</h3>
                    <p className="text-gray-500">Fetching the latest data...</p>
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
                        onClick={() => dispatch(getPublished({ page: 1, limit: 1000 }))}
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
                        Product Specifications
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
                        onClick={() => dispatch(getPublished({ page: 1, limit: 1000 }))}
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
                        <p className="text-sm font-medium text-gray-500">Total Specifications</p>
                        <p className="mt-1 text-3xl font-bold text-cyan-700">{specMetrics.total}</p>
                    </div>
                    <Box className="text-cyan-600" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Published</p>
                        <p className="mt-1 text-3xl font-bold text-green-600">{specMetrics.published}</p>
                    </div>
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">With Characteristics</p>
                        <p className="mt-1 text-3xl font-bold text-blue-600">{specMetrics.withCharacteristics}</p>
                    </div>
                    <Activity className="text-blue-500" size={32} />
                </div>
                <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-100">Bundles</p>
                        <p className="mt-1 text-3xl font-bold">{specMetrics.bundles}</p>
                    </div>
                    <Layers className="text-cyan-200" size={36} />
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
                            <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by name, display name or description"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetSearchText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="typeFilter" className="text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                id="typeFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Types</option>
                                {uniqueTypes.map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
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
                            <label htmlFor="bundleFilter" className="text-sm font-medium text-gray-700 mb-1">Bundle</label>
                            <select
                                id="bundleFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={bundleFilter}
                                onChange={(e) => { setBundleFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All</option>
                                <option value="true">Bundles Only</option>
                                <option value="false">Non-Bundles Only</option>
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
                                        onClick={() => requestSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Name
                                            {sortConfig.key === 'name' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('displayName')}
                                    >
                                        <div className="flex items-center">
                                            Display Name
                                            {sortConfig.key === 'displayName' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('lifecycleStatus')}
                                    >
                                        <div className="flex items-center">
                                            Life Cycle 
                                            {sortConfig.key === 'lifecycleStatus' && (
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
                                        onClick={() => requestSort('characteristicsCount')}
                                    >
                                        <div className="flex items-center">
                                            Characteristics
                                            {sortConfig.key === 'characteristicsCount' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('createdAt')}
                                    >
                                        <div className="flex items-center">
                                            Created
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
                                {paginatedSpecs.length > 0 ? (
                                    paginatedSpecs.map((spec) => (
                                        <tr
                                            key={spec._id}
                                            className="odd:bg-gray-50 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => handleRowClick(spec)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{spec.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{spec.displayName || 'N/A'}</td>
                                           
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">
                                               {spec.lifecycleStatus}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">
                                               {spec.status}
                                            </td>
                                           
                                         
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {spec.productSpecCharacteristic?.length || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {moment(spec.createdAt).format('YYYY-MM-DD')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRowClick(spec); }}
                                                    className="text-cyan-600 hover:text-cyan-900 focus:outline-none focus:underline"
                                                    aria-label={`View details for ${spec.name}`}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                                            No product specifications found matching your criteria.
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
                            Product Specification Analytics
                        </h2>
                        {expandedCharts ? <ChevronUp size={20} className="text-cyan-700" /> : <ChevronDown size={20} className="text-cyan-700" />}
                    </div>

                    {expandedCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Box className="mr-2" size={18} /> By Type</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={typeData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {typeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.name.toLowerCase()] || TYPE_COLORS.Unknown} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} Specs`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><CheckCircle className="mr-2" size={18} /> By Status</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={statusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value, name) => [`${value} Specs`, name]} />
                                        <Bar dataKey="value">
                                            {statusData.map((entry, index) => (
                                                <Cell key={`bar-cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || STATUS_COLORS.Unknown} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="mr-2" size={18} /> Creation Trend</h3>
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
                                        <Line type="monotone" dataKey="count" stroke="#007B98" activeDot={{ r: 8 }} name="Specs Created" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedSpec && (
                <ProductSpecDetailModal productSpec={selectedSpec} onClose={closeModal} />
            )}
        </div>
    );
};

export default ProductSpecificationsDashboard;