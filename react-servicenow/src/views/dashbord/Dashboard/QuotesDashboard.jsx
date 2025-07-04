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
    Users,
    Clock,
    CheckCircle,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    ChevronLeft,
    Box,
    Tag,
    Code,
    Cpu,
    Layers,
    Package,
    Activity,
    Filter as FilterIcon,
    RefreshCw,
    MoreHorizontal,
    X,
    Info,
    Link,
    File,
    AlertCircle,
    Settings,
    Building,
    Edit,
    History
} from "lucide-react";
import { debounce } from "lodash";

// --- Design Constants ---
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"];
const STATUS_COLORS = {
    "Active": "#10B981", // Green
    "Draft": "#3B82F6", // Blue
    "Retired": "#EF4444", // Red
    "Obsolete": "#9CA3AF", // Gray
    "Unknown": "#9CA3AF"
};

// --- Product Specification Detail Modal Component ---
const ProductSpecificationDetailModal = ({ specification, onClose }) => {
    if (!specification) return null;

    const DetailItem = ({ label, value, icon: Icon, valueClass = "font-medium text-gray-800", linkHref = null }) => (
        <div className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
            {Icon && <Icon className="text-cyan-700 flex-shrink-0 mt-1" size={18} />}
            <span className="font-semibold text-gray-600 w-36 flex-shrink-0">{label}:</span>
            <span className={`flex-1 ${valueClass}`}>{value}</span>
        </div>
    );

    const getCharacteristicValue = (char) => {
        return char.productSpecCharacteristicValue?.[0]?.value || 'N/A';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
                    <h2 className="text-xl font-bold flex items-center">
                        <Box className="mr-3 text-cyan-200" size={24} />
                        {specification.displayName || specification.name} Details
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* General Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <List className="mr-2" size={20} /> General Information
                            </h3>
                            <DetailItem label="ID (sys_id)" value={specification.sys_id || specification._id || 'N/A'} icon={FileText} />
                            <DetailItem label="External ID" value={specification.externalId || 'N/A'} icon={FileText} />
                            <DetailItem label="Display Name" value={specification.displayName || 'N/A'} icon={Box} />
                            <DetailItem label="Version" value={specification.version || 'N/A'} icon={Tag} />
                            <DetailItem label="Internal Version" value={specification.internalVersion || 'N/A'} icon={Tag} />
                            <DetailItem
                                label="Lifecycle Status"
                                value={specification.lifecycleStatus?.toUpperCase() || 'N/A'}
                                icon={CheckCircle}
                                valueClass={`font-bold ${STATUS_COLORS[specification.lifecycleStatus] ? `text-[${STATUS_COLORS[specification.lifecycleStatus]}]` : 'text-gray-600'}`}
                            />
                            <DetailItem label="Specification Type" value={specification.specification_type || 'N/A'} icon={Cpu} />
                            <DetailItem label="Is Bundle" value={specification.isBundle ? 'Yes' : 'No'} icon={Package} />
                            <DetailItem label="Valid From" value={specification.validFor?.startDateTime ? moment(specification.validFor.startDateTime).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Valid Until" value={specification.validFor?.endDateTime ? moment(specification.validFor.endDateTime).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                        </div>

                        {/* Associated Characteristics */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Code className="mr-2" size={20} /> Product Characteristics
                            </h3>
                            {specification.productSpecCharacteristic && specification.productSpecCharacteristic.length > 0 ? (
                                <ul className="space-y-3">
                                    {specification.productSpecCharacteristic.map((char, index) => (
                                        <li key={index} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex items-center mb-2">
                                                <Box className="text-cyan-500 mr-2" size={18} />
                                                <span className="font-semibold text-gray-800">{char.name || 'Unnamed Characteristic'}</span>
                                            </div>
                                            <DetailItem label="Description" value={char.description || 'N/A'} icon={File} valueClass="text-sm" />
                                            <DetailItem label="Value" value={getCharacteristicValue(char)} icon={Info} valueClass="text-sm font-bold text-gray-900" />
                                            <DetailItem label="Value Type" value={char.valueType || 'N/A'} icon={Tag} valueClass="text-sm" />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No product characteristics defined.</p>
                            )}
                        </div>

                        {/* Associated Resource Specifications */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Settings className="mr-2" size={20} /> Associated Resource Specs
                            </h3>
                            {specification.resourceSpecification && specification.resourceSpecification.length > 0 ? (
                                <ul className="space-y-1 text-sm text-gray-700">
                                    {specification.resourceSpecification.map((res, index) => (
                                        <li key={index} className="flex items-center">
                                            <ChevronRight className="text-cyan-500 mr-2 text-xs" /> {res.name || 'N/A'} (ID: {res.id || 'N/A'})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No associated resource specifications.</p>
                            )}
                        </div>

                        {/* Associated Service Specifications */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Layers className="mr-2" size={20} /> Associated Service Specs
                            </h3>
                            {specification.serviceSpecification && specification.serviceSpecification.length > 0 ? (
                                <ul className="space-y-1 text-sm text-gray-700">
                                    {specification.serviceSpecification.map((svc, index) => (
                                        <li key={index} className="flex items-center">
                                            <ChevronRight className="text-cyan-500 mr-2 text-xs" /> {svc.name || 'N/A'} (ID: {svc.id || 'N/A'})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No associated service specifications.</p>
                            )}
                        </div>

                        {/* Product Specification Relationships */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Link className="mr-2" size={20} /> Product Specification Relationships
                            </h3>
                            {specification.productSpecificationRelationship && specification.productSpecificationRelationship.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    {specification.productSpecificationRelationship.map((rel, index) => (
                                        <li key={index}>
                                            <span className="font-medium">{rel.type || 'N/A'}</span> to <span className="font-medium text-cyan-800">{rel.name || 'N/A'}</span> (ID: {rel.id || 'N/A'})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No product specification relationships defined.</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <File className="mr-2" size={20} /> Description
                            </h3>
                            <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                                {specification.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* System Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <History className="mr-2" size={20} /> System Information
                            </h3>
                            <DetailItem label="Created On" value={specification.createdAt ? moment(specification.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
                            <DetailItem label="Last Updated (PO)" value={specification.lastUpdate ? moment(specification.lastUpdate).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Edit} />
                            <DetailItem label="Updated On (Sys)" value={specification.sys_updated_on ? moment(specification.sys_updated_on).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Edit} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Product Specification Dashboard Component ---
const ProductSpecificationDashboard = () => {
    const dispatch = useDispatch();
    const { data: specifications, loading, error } = useSelector((state) => state.productSpecification);

    const [searchText, setSearchText] = useState('');
    const [lifecycleStatusFilter, setLifecycleStatusFilter] = useState('');
    const [specificationTypeFilter, setSpecificationTypeFilter] = useState('');
    const [isBundleFilter, setIsBundleFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState(null);
    const [endDateFilter, setEndDateFilter] = useState(null);
    const [selectedSpecification, setSelectedSpecification] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: "displayName", direction: "asc" });
    const [viewMode, setViewMode] = useState("table");
    const [expandedCharts, setExpandedCharts] = useState(true);
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

    // Debounced filter handlers
    const debouncedSetSearchText = useCallback(debounce(setSearchText, 300), []);

    // Fetch initial data
    useEffect(() => {
        if (!specifications || specifications.length === 0) {
            dispatch(getPublished({ page: 1, limit: 1000 }));
        }
    }, [dispatch, specifications]);

    // Extract unique filter options
    const uniqueSpecificationTypes = useMemo(() => {
        const types = new Set();
        specifications.forEach(spec => {
            if (spec.specification_type) types.add(spec.specification_type);
        });
        return Array.from(types).sort();
    }, [specifications]);

    // Memoized filtered data
    const filteredData = useMemo(() => {
        let currentFilteredData = specifications;

        if (searchText) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.id?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.sys_id?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.specification_type?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.productSpecCharacteristic?.some(char =>
                    char.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                    char.productSpecCharacteristicValue?.some(val => val.value?.toLowerCase().includes(searchText.toLowerCase())))
            );
        }

        if (lifecycleStatusFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.lifecycleStatus === lifecycleStatusFilter);
        }

        if (specificationTypeFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.specification_type === specificationTypeFilter);
        }

        if (isBundleFilter !== '') {
            const isBundleBool = isBundleFilter === 'true';
            currentFilteredData = currentFilteredData.filter(item => item.isBundle === isBundleBool);
        }

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

        return currentFilteredData;
    }, [
        specifications,
        searchText,
        lifecycleStatusFilter,
        specificationTypeFilter,
        isBundleFilter,
        dateRange
    ]);

    // Sorting logic
    const sortedData = useMemo(() => {
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'displayName') {
                    aValue = a.displayName || a.name || "";
                    bValue = b.displayName || b.name || "";
                } else if (sortConfig.key === 'lifecycleStatus') {
                    aValue = a.lifecycleStatus || "";
                    bValue = b.lifecycleStatus || "";
                } else if (sortConfig.key === 'specification_type') {
                    aValue = a.specification_type || "";
                    bValue = b.specification_type || "";
                } else if (sortConfig.key === 'validFor.startDateTime') {
                    aValue = a.validFor?.startDateTime ? moment(a.validFor.startDateTime).valueOf() : 0;
                    bValue = b.validFor?.startDateTime ? moment(b.validFor.startDateTime).valueOf() : 0;
                } else if (sortConfig.key === 'productSpecCharacteristic.length') {
                    aValue = a.productSpecCharacteristic?.length || 0;
                    bValue = b.productSpecCharacteristic?.length || 0;
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

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

    // Metrics calculations
    const summaryStats = useMemo(() => {
        const total = filteredData.length;
        const active = filteredData.filter(item => item.lifecycleStatus === 'Active').length;
        const draft = filteredData.filter(item => item.lifecycleStatus === 'Draft').length;
        const retired = filteredData.filter(item => item.lifecycleStatus === 'Retired').length;
        const bundled = filteredData.filter(item => item.isBundle === true).length;
        const nonBundled = filteredData.filter(item => item.isBundle === false).length;
        const withCharacteristics = filteredData.filter(item => item.productSpecCharacteristic?.length > 0).length;
        const withResourceSpecs = filteredData.filter(item => item.resourceSpecification?.length > 0).length;
        const withServiceSpecs = filteredData.filter(item => item.serviceSpecification?.length > 0).length;

        return {
            total,
            active,
            draft,
            retired,
            bundled,
            nonBundled,
            withCharacteristics,
            withResourceSpecs,
            withServiceSpecs
        };
    }, [filteredData]);

    // Chart data calculations
    const lifecycleStatusDistributionData = useMemo(() => {
        const counts = {};
        filteredData.forEach(item => {
            const statusKey = item.lifecycleStatus || 'Unknown';
            counts[statusKey] = (counts[statusKey] || 0) + 1;
        });

        return Object.keys(counts).map(status => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count: counts[status],
            color: STATUS_COLORS[status] || STATUS_COLORS['Unknown']
        })).filter(item => item.count > 0);
    }, [filteredData]);

    const specificationTypeDistributionData = useMemo(() => {
        const counts = {};
        filteredData.forEach(item => {
            const type = item.specification_type || 'Unknown';
            counts[type] = (counts[type] || 0) + 1;
        });

        return Object.keys(counts).map(type => ({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            count: counts[type]
        })).sort((a, b) => b.count - a.count);
    }, [filteredData]);

    const isBundleDistributionData = useMemo(() => {
        const bundledCount = filteredData.filter(item => item.isBundle === true).length;
        const nonBundledCount = filteredData.filter(item => item.isBundle === false).length;

        const data = [];
        if (bundledCount > 0) data.push({ name: 'Bundled', count: bundledCount, color: '#16a34a' });
        if (nonBundledCount > 0) data.push({ name: 'Non-Bundled', count: nonBundledCount, color: '#f97316' });
        if (bundledCount === 0 && nonBundledCount === 0) data.push({ name: 'No Data', count: 1, color: '#a3a3a3' });

        return data;
    }, [filteredData]);

    const specificationUpdateTrendData = useMemo(() => {
        const monthlyCounts = {};
        filteredData.forEach(item => {
            if (item.sys_updated_on) {
                const month = moment(item.sys_updated_on).format('YYYY-MM');
                monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
            }
        });
        return Object.keys(monthlyCounts)
            .sort()
            .map(month => ({ month: moment(month).format('MMM YY'), count: monthlyCounts[month] }));
    }, [filteredData]);

    const resetFilters = () => {
        setSearchText("");
        setLifecycleStatusFilter("");
        setSpecificationTypeFilter("");
        setIsBundleFilter("");
        setDateRange({ from: undefined, to: undefined });
        setCurrentPage(1);
    };

    const handleRowClick = useCallback((spec) => {
        setSelectedSpecification(spec);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedSpecification(null);
    }, []);

    const getCharacteristicCount = (item) => item.productSpecCharacteristic?.length || 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-gray-900">Loading Product Specifications</h3>
                    <p className="text-gray-500">Fetching the latest specifications data...</p>
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Box className="mr-3 text-cyan-700" size={28} />
                        Product Specifications Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1 text-base">
                        Comprehensive overview and management of your product specifications
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setExpandedCharts(!expandedCharts)}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 transition-colors"
                    >
                        {expandedCharts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {expandedCharts ? 'Hide' : 'Show'} Analytics
                    </button>
                    <button
                        onClick={() => {/* handle export */}}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                    <button
                        onClick={() => {/* handle add new specification */}}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Specification
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Specs</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.total}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-50">
                            <Box className="h-6 w-6 text-cyan-700" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            +8.2% from last month
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.active}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50">
                            <CheckCircle className="h-6 w-6 text-green-700" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {summaryStats.total > 0 ? `${Math.round((summaryStats.active / summaryStats.total) * 100)}% of total` : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">With Characteristics</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.withCharacteristics}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50">
                            <Code className="h-6 w-6 text-purple-700" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {summaryStats.total > 0 ? `${Math.round((summaryStats.withCharacteristics / summaryStats.total) * 100)}% of total` : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Bundled Specs</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.bundled}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-yellow-50">
                            <Package className="h-6 w-6 text-yellow-700" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {summaryStats.total > 0 ? `${Math.round((summaryStats.bundled / summaryStats.total) * 100)}% of total` : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">With Service Specs</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.withServiceSpecs}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-50">
                            <Layers className="h-6 w-6 text-indigo-700" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {summaryStats.total > 0 ? `${Math.round((summaryStats.withServiceSpecs / summaryStats.total) * 100)}% of total` : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Analytics Dashboard */}
            {expandedCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Status Distribution */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-cyan-700" />
                                Status Distribution
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                                {filteredData.length} specs
                            </span>
                        </div>
                        <div className="h-[250px] flex items-center justify-center">
                            {lifecycleStatusDistributionData.length === 0 ? (
                                <p className="text-gray-500">No data for chart.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={lifecycleStatusDistributionData}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                            label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                                            animationDuration={500}
                                        >
                                            {lifecycleStatusDistributionData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`${value} specs`, "Count"]}
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
                            )}
                        </div>
                    </div>

                    {/* Specification Type Distribution */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-cyan-700" />
                                Specification Type
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                                Breakdown
                            </span>
                        </div>
                        <div className="h-[250px] flex items-center justify-center">
                            {specificationTypeDistributionData.length === 0 ? (
                                <p className="text-gray-500">No data for chart.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={specificationTypeDistributionData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis
                                            dataKey="type"
                                            type="category"
                                            tick={{ fontSize: 12 }}
                                            width={80}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`${value} specs`, "Count"]}
                                            contentStyle={{
                                                borderRadius: '0.5rem',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                border: '1px solid #e5e7eb',
                                                backgroundColor: 'white'
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Count"
                                            radius={[0, 4, 4, 0]}
                                            fill="#007B98"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Bundle Distribution */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="h-5 w-5 text-cyan-700" />
                                Bundle Distribution
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                                Current state
                            </span>
                        </div>
                        <div className="h-[250px] flex items-center justify-center">
                            {isBundleDistributionData.length === 0 ? (
                                <p className="text-gray-500">No data for chart.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={isBundleDistributionData}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            animationDuration={500}
                                        >
                                            {isBundleDistributionData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`${value} specs`, "Count"]}
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
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow mt-6">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Specifications</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                                placeholder="Name, description, ID..."
                                value={searchText}
                                onChange={(e) => debouncedSetSearchText(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Lifecycle Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Lifecycle Status</label>
                        <div className="relative">
                            <select
                                value={lifecycleStatusFilter}
                                onChange={(e) => setLifecycleStatusFilter(e.target.value)}
                                className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                            >
                                <option value="">All statuses</option>
                                <option value="Active">Active</option>
                                <option value="Draft">Draft</option>
                                <option value="Retired">Retired</option>
                                <option value="Obsolete">Obsolete</option>
                            </select>
                        </div>
                    </div>

                    {/* Specification Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Specification Type</label>
                        <div className="relative">
                            <select
                                value={specificationTypeFilter}
                                onChange={(e) => setSpecificationTypeFilter(e.target.value)}
                                className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                            >
                                <option value="">All types</option>
                                {uniqueSpecificationTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Valid Date Range */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid Date Range</label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={dateRange.from ? moment(dateRange.from).format('YYYY-MM-DD') : ""}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value ? moment(e.target.value).toDate() : undefined })}
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
                                    value={dateRange.to ? moment(dateRange.to).format('YYYY-MM-DD') : ""}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value ? moment(e.target.value).toDate() : undefined })}
                                    className="block w-full rounded-lg border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Is Bundle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bundle Type</label>
                        <div className="relative">
                            <select
                                value={isBundleFilter}
                                onChange={(e) => setIsBundleFilter(e.target.value)}
                                className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                            >
                                <option value="">All</option>
                                <option value="true">Bundled</option>
                                <option value="false">Non-Bundled</option>
                            </select>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow mt-6">
                {/* Results Header */}
                <div className="px-5 py-3 border-b border-gray-200 bg-cyan-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-cyan-800">
                            {filteredData.length} {filteredData.length === 1 ? 'Specification' : 'Specifications'} Found
                        </h3>
                        <p className="text-sm text-cyan-700 mt-1">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
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
                                <option value="displayName">Name</option>
                                <option value="lifecycleStatus">Status</option>
                                <option value="specification_type">Type</option>
                                <option value="productSpecCharacteristic.length">Characteristics</option>
                                <option value="validFor.startDateTime">Valid From</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                            className="p-1.5 rounded-md bg-white ring-1 ring-inset ring-cyan-200 hover:bg-cyan-50 transition-colors text-cyan-700"
                        >
                            {sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Data Display - Table View */}
                {viewMode === "table" ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-cyan-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                                        onClick={() => requestSort("displayName")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Name</span>
                                            {sortConfig.key === "displayName" && (
                                                sortConfig.direction === "asc" ?
                                                    <ArrowUp className="h-3 w-3 text-cyan-700" /> :
                                                    <ArrowDown className="h-3 w-3 text-cyan-700" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                                        onClick={() => requestSort("lifecycleStatus")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Status</span>
                                            {sortConfig.key === "lifecycleStatus" && (
                                                sortConfig.direction === "asc" ?
                                                    <ArrowUp className="h-3 w-3 text-cyan-700" /> :
                                                    <ArrowDown className="h-3 w-3 text-cyan-700" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                                        onClick={() => requestSort("specification_type")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Type</span>
                                            {sortConfig.key === "specification_type" && (
                                                sortConfig.direction === "asc" ?
                                                    <ArrowUp className="h-3 w-3 text-cyan-700" /> :
                                                    <ArrowDown className="h-3 w-3 text-cyan-700" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                                        onClick={() => requestSort("isBundle")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Is Bundle</span>
                                            {sortConfig.key === "isBundle" && (
                                                sortConfig.direction === "asc" ?
                                                    <ArrowUp className="h-3 w-3 text-cyan-700" /> :
                                                    <ArrowDown className="h-3 w-3 text-cyan-700" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                                        onClick={() => requestSort("productSpecCharacteristic.length")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Characteristics</span>
                                            {sortConfig.key === "productSpecCharacteristic.length" && (
                                                sortConfig.direction === "asc" ?
                                                    <ArrowUp className="h-3 w-3 text-cyan-700" /> :
                                                    <ArrowDown className="h-3 w-3 text-cyan-700" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider cursor-pointer hover:bg-cyan-100"
                                        onClick={() => requestSort("validFor.startDateTime")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Valid From</span>
                                            {sortConfig.key === "validFor.startDateTime" && (
                                                sortConfig.direction === "asc" ?
                                                    <ArrowUp className="h-3 w-3 text-cyan-700" /> :
                                                    <ArrowDown className="h-3 w-3 text-cyan-700" />
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginatedData.map((spec) => (
                                    <tr
                                        key={spec._id}
                                        onClick={() => handleRowClick(spec)}
                                        className="hover:bg-cyan-50 transition-colors duration-200 cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">
                                            {spec.displayName || spec.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[spec.lifecycleStatus] ? `bg-${spec.lifecycleStatus.toLowerCase()}-100 text-[${STATUS_COLORS[spec.lifecycleStatus]}]` : 'bg-gray-100 text-gray-800'}`}>
                                                {spec.lifecycleStatus?.toUpperCase() || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {spec.specification_type || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${spec.isBundle ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {spec.isBundle ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {getCharacteristicCount(spec)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {spec.validFor?.startDateTime ? moment(spec.validFor.startDateTime).format('MMM DD, YYYY') : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Data Display - Grid View
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedData.map((spec) => (
                            <div
                                key={spec._id}
                                onClick={() => handleRowClick(spec)}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-cyan-300 transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-semibold text-cyan-700">{spec.displayName || spec.name}</h3>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[spec.lifecycleStatus] ? `bg-${spec.lifecycleStatus.toLowerCase()}-100 text-[${STATUS_COLORS[spec.lifecycleStatus]}]` : 'bg-gray-100 text-gray-800'}`}>
                                        {spec.lifecycleStatus?.toUpperCase() || 'N/A'}
                                    </span>
                                </div>
                                <p className="text-gray-700 text-sm mb-2 flex items-center"><Cpu className="h-4 w-4 mr-2 text-gray-500" /> {spec.specification_type || 'N/A'}</p>
                                <p className="text-gray-600 text-sm mb-3 flex items-center"><Code className="h-4 w-4 mr-2 text-gray-500" />
                                    Characteristics: {getCharacteristicCount(spec)}
                                </p>
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                                    <div className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" /> Valid from: {spec.validFor?.startDateTime ? moment(spec.validFor.startDateTime).format('MMM DD, YYYY') : 'N/A'}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRowClick(spec); }}
                                        className="text-cyan-600 hover:underline flex items-center gap-1"
                                    >
                                        View Details <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav
                        className="bg-white px-4 py-5 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-0 rounded-b-xl"
                        aria-label="Pagination"
                    >
                        <div className="hidden sm:block">
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-semibold text-cyan-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-cyan-700">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
                                <span className="font-semibold text-cyan-700">{filteredData.length}</span> results
                            </p>
                        </div>
                        <div className="flex-1 flex justify-between sm:justify-end space-x-3">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                            </button>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    </nav>
                )}
            </div>

            {/* Product Specification Detail Modal */}
            <ProductSpecificationDetailModal specification={selectedSpecification} onClose={closeModal} />
        </div>
    );
};

export default ProductSpecificationDashboard;