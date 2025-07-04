"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getOpportunities, resetError } from '../../../features/servicenow/opportunity/opportunitySlice';
import moment from 'moment';
import {
    Download,
    Search,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    List,
    Plus,
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
    ExternalLink,
    Activity,
    DollarSign,
    Calendar,FileText ,
    Users
} from "lucide-react";
import { debounce } from "lodash";

// Design Constants
const STATUS_COLORS = {
    "closed - won": "#10B981", // Green-500
    "closed - lost": "#EF4444", // Red-500
    "qualification": "#F59E0B", // Amber-500
    "solution proposal": "#3B82F6", // Blue-500
    "negotiation": "#8B5CF6", // Violet-500
    "prospecting": "#6B7280", // Gray-500
    "Unknown": "#9CA3AF"   // Gray-400
};

const getStatusBadgeClass = (status) => {
    const color = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS["Unknown"];
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-[${color}]`;
};

// Opportunity Detail Modal Component (similar to CategoryDetailModal)
const OpportunityDetailModal = ({ opportunity, onClose }) => {
    if (!opportunity) return null;

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

    const getStageIcon = (stageName) => {
        switch (stageName?.toLowerCase()) {
            case 'closed - won': return CheckCircle;
            case 'closed - lost': return X;
            case 'qualification': return Search;
            case 'solution proposal': return FileText;
            case 'negotiation': return DollarSign;
            case 'prospecting': return Users;
            default: return Info;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
                    <h2 className="text-xl font-bold flex items-center">
                        <DollarSign className="mr-3 text-cyan-200" size={24} />
                        Opportunity {opportunity.number} Details
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
                        {/* General Opportunity Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Info className="mr-2" size={20} /> General Information
                            </h3>
                            <DetailItem label="Number" value={opportunity.number || 'N/A'} icon={Tag} />
                            <DetailItem label="Short Description" value={opportunity.short_description || 'N/A'} icon={FileText} />
                            <DetailItem label="Description" value={opportunity.description || 'N/A'} icon={Info} />
                            <DetailItem
                                label="Stage"
                                value={opportunity.stage?.name || 'N/A'}
                                icon={getStageIcon(opportunity.stage?.name)}
                                valueClass={`font-bold ${STATUS_COLORS[opportunity.stage?.name?.toLowerCase()] ? `text-[${STATUS_COLORS[opportunity.stage?.name?.toLowerCase()]}]` : 'text-cyan-700'}`}
                            />
                            <DetailItem label="Probability" value={`${opportunity.probability || 0}%`} icon={Activity} />
                            <DetailItem label="Industry" value={opportunity.industry || 'N/A'} icon={Box} />
                            <DetailItem label="Term (Months)" value={opportunity.term_month || 'N/A'} icon={Clock} />
                        </div>

                        {/* Related Entities */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Users className="mr-2" size={20} /> Related Entities
                            </h3>
                            <DetailItem label="Account Name" value={opportunity.account?.name || 'N/A'} icon={Users} />
                            <DetailItem label="Account Email" value={opportunity.account?.email || 'N/A'} icon={Users} />
                            <DetailItem label="Price List" value={opportunity.price_list?.name || 'N/A'} icon={DollarSign} />
                            <DetailItem label="Sales Cycle Type" value={opportunity.sales_cycle_type?.sys_name || 'N/A'} icon={RefreshCw} />
                        </div>

                        {/* Dates */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Calendar className="mr-2" size={20} /> Dates
                            </h3>
                            <DetailItem label="Estimated Closed Date" value={opportunity.estimated_closed_date ? moment(opportunity.estimated_closed_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Created On" value={opportunity.createdAt ? moment(opportunity.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Last Updated" value={opportunity.updatedAt ? moment(opportunity.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
                        </div>

                        {/* Line Items */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <List className="mr-2" size={20} /> Line Items ({opportunity.line_items?.length || 0})
                            </h3>
                            {opportunity.line_items && opportunity.line_items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Product Offering</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Quantity</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Unit Net Price</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Cumulative ACV</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {opportunity.line_items.map((item, index) => (
                                                <tr key={item._id || index}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{item.productOffering?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.quantity || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.unit_net_price || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.cumulative_acv || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No line items associated with this opportunity.</p>
                            )}
                        </div>

                        {/* Quotes */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <FileText className="mr-2" size={20} /> Quotes ({opportunity.quote?.length || 0})
                            </h3>
                            {opportunity.quote && opportunity.quote.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Number</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">State</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Currency</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Expiration Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {opportunity.quote.map((quote, index) => (
                                                <tr key={quote._id || index}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{quote.number || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{quote.state || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{quote.currency || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                        {quote.expiration_date ? moment(quote.expiration_date).format('YYYY-MM-DD') : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No quotes associated with this opportunity.</p>
                            )}
                        </div>

                        {/* System Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Clock className="mr-2" size={20} /> System Information
                            </h3>
                            <DetailItem label="System ID" value={opportunity.sys_id || 'N/A'} icon={Tag} />
                            <DetailItem label="Mongo ID" value={opportunity.mongoId || 'N/A'} icon={Tag} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const OpportunitiesDashboard = () => {
    const dispatch = useDispatch();
    const {
        opportunities,
        loading,
        error,
        total: totalItemsRedux,
    } = useSelector((state) => state.opportunity);

    // Local state for filters and pagination
    const [searchText, setSearchText] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [industryFilter, setIndustryFilter] = useState('');
    const [accountFilter, setAccountFilter] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
    const [expandedFilters, setExpandedFilters] = useState(false);

    // Debounced filter handlers
    const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);


    // Fetch initial data
    useEffect(() => {
        dispatch(resetError()); // Clear any previous errors
        dispatch(getOpportunities({ page: 1, limit: 1000 })); // Fetch all for local filtering
    }, [dispatch]);

    // Extract unique filter options
    const uniqueStages = useMemo(() => {
        const stages = new Set();
        opportunities.forEach(opportunity => {
            if (opportunity.stage?.name) stages.add(opportunity.stage.name);
        });
        return Array.from(stages).sort();
    }, [opportunities]);

    const uniqueIndustries = useMemo(() => {
        const industries = new Set();
        opportunities.forEach(opportunity => {
            if (opportunity.industry) industries.add(opportunity.industry);
        });
        return Array.from(industries).sort();
    }, [opportunities]);

    const uniqueAccounts = useMemo(() => {
        const accounts = new Set();
        opportunities.forEach(opportunity => {
            if (opportunity.account?.name) accounts.add(opportunity.account.name);
        });
        return Array.from(accounts).sort();
    }, [opportunities]);

    // Memoized filtered data
    const filteredData = useMemo(() => {
        let currentFilteredData = opportunities;

        if (searchText) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.short_description?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.number?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.account?.name?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (stageFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.stage?.name?.toLowerCase() === stageFilter.toLowerCase());
        }

        if (industryFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.industry?.toLowerCase() === industryFilter.toLowerCase());
        }

        if (accountFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.account?.name?.toLowerCase() === accountFilter.toLowerCase());
        }

        // Date range filter for estimated_closed_date
        if (dateRange.from) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.estimated_closed_date && moment(item.estimated_closed_date).isSameOrAfter(dateRange.from, 'day')
            );
        }
        if (dateRange.to) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.estimated_closed_date && moment(item.estimated_closed_date).isSameOrBefore(dateRange.to, 'day')
            );
        }

        return currentFilteredData;
    }, [
        opportunities,
        searchText,
        stageFilter,
        industryFilter,
        accountFilter,
        dateRange
    ]);

    // Sorting logic
    const sortedOpportunities = useMemo(() => {
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'accountName') {
                    aValue = a.account?.name || "";
                    bValue = b.account?.name || "";
                } else if (sortConfig.key === 'stageName') {
                    aValue = a.stage?.name || "";
                    bValue = b.stage?.name || "";
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

    const paginatedOpportunities = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedOpportunities.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedOpportunities, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedOpportunities.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

    // Metrics calculations
    const opportunityMetrics = useMemo(() => {
        const metrics = {
            total: opportunities.length,
            closedWon: 0,
            closedLost: 0,
            inProgress: 0, // Qualification, Solution Proposal, Negotiation, Prospecting
            newThisMonth: 0
        };

        const currentDate = moment();
        opportunities.forEach(item => {
            if (item.stage?.name?.toLowerCase() === "closed - won") metrics.closedWon++;
            if (item.stage?.name?.toLowerCase() === "closed - lost") metrics.closedLost++;
            
            const stageName = item.stage?.name?.toLowerCase();
            if (["qualification", "solution proposal", "negotiation", "prospecting"].includes(stageName)) {
                metrics.inProgress++;
            }

            const createdDate = moment(item.createdAt);
            if (createdDate.month() === currentDate.month() &&
                createdDate.year() === currentDate.year()) {
                metrics.newThisMonth++;
            }
        });

        return metrics;
    }, [opportunities]);

    const exportToCSV = () => {
        const headers = ["number", "short_description", "stage", "account_name", "estimated_closed_date", "probability", "industry", "createdAt"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.number || ''}"`,
                `"${item.short_description || ''}"`,
                `"${item.stage?.name || ''}"`,
                `"${item.account?.name || ''}"`,
                `"${item.estimated_closed_date ? moment(item.estimated_closed_date).format('YYYY-MM-DD') : ''}"`,
                `"${item.probability || 0}"`,
                `"${item.industry || ''}"`,
                `"${item.createdAt ? moment(item.createdAt).format('YYYY-MM-DD') : ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "opportunities.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetFilters = () => {
        setSearchText("");
        setStageFilter("");
        setIndustryFilter("");
        setAccountFilter("");
        setDateRange({ from: '', to: '' });
        setCurrentPage(1);
        setSortConfig({ key: "createdAt", direction: "desc" });
    };

    const handleRowClick = useCallback((opportunity) => {
        setSelectedOpportunity(opportunity);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedOpportunity(null);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-cyan-700">Loading Opportunities</h3>
                    <p className="text-gray-500">Fetching the latest opportunity data...</p>
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
                        onClick={() => dispatch(getOpportunities({ page: 1, limit: 1000 }))}
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
                        <DollarSign className="mr-3 text-cyan-700" size={28} />
                        Opportunity Dashboard
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
                        onClick={() => dispatch(getOpportunities({ page: 1, limit: 1000 }))}
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
                        <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
                        <p className="mt-1 text-3xl font-bold text-cyan-700">{opportunityMetrics.total}</p>
                    </div>
                    <DollarSign className="text-cyan-600" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Closed Won</p>
                        <p className="mt-1 text-3xl font-bold text-green-600">{opportunityMetrics.closedWon}</p>
                    </div>
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">In Progress</p>
                        <p className="mt-1 text-3xl font-bold text-blue-600">{opportunityMetrics.inProgress}</p>
                    </div>
                    <Activity className="text-blue-500" size={32} />
                </div>
                <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-100">New This Month</p>
                        <p className="mt-1 text-3xl font-bold">{opportunityMetrics.newThisMonth}</p>
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
                    {expandedFilters ? <ChevronUp size={20} className="text-cyan-700" /> : <ChevronDown size={20} className="text-cyan-700" />}
                </div>

                {expandedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6 animate-fade-in">
                        <div className="flex flex-col">
                            <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Any Field</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by number, description, account..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetSearchText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="stageFilter" className="text-sm font-medium text-gray-700 mb-1">Stage</label>
                            <select
                                id="stageFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={stageFilter}
                                onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Stages</option>
                                {uniqueStages.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="industryFilter" className="text-sm font-medium text-gray-700 mb-1">Industry</label>
                            <select
                                id="industryFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={industryFilter}
                                onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Industries</option>
                                {uniqueIndustries.map(industry => (
                                    <option key={industry} value={industry}>{industry}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="accountFilter" className="text-sm font-medium text-gray-700 mb-1">Account</label>
                            <select
                                id="accountFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={accountFilter}
                                onChange={(e) => { setAccountFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Accounts</option>
                                {uniqueAccounts.map(account => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 mb-1">Estimated Close From</label>
                            <input
                                type="date"
                                id="dateFrom"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={dateRange.from}
                                onChange={(e) => { setDateRange({ ...dateRange, from: e.target.value }); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="dateTo" className="text-sm font-medium text-gray-700 mb-1">Estimated Close To</label>
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

            {/* Opportunity Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('number')}
                                >
                                    <div className="flex items-center">
                                        Number
                                        {sortConfig.key === 'number' && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('short_description')}
                                >
                                    <div className="flex items-center">
                                        Short Description
                                        {sortConfig.key === 'short_description' && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('stageName')}
                                >
                                    <div className="flex items-center">
                                        Stage
                                        {sortConfig.key === 'stageName' && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('accountName')}
                                >
                                    <div className="flex items-center">
                                        Account
                                        {sortConfig.key === 'accountName' && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('estimated_closed_date')}
                                >
                                    <div className="flex items-center">
                                        Est. Close Date
                                        {sortConfig.key === 'estimated_closed_date' && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('probability')}
                                >
                                    <div className="flex items-center">
                                        Probability
                                        {sortConfig.key === 'probability' && (
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
                            {paginatedOpportunities.length > 0 ? (
                                paginatedOpportunities.map((opportunity) => (
                                    <tr
                                        key={opportunity._id}
                                        className="odd:bg-gray-50 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
                                        onClick={() => handleRowClick(opportunity)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{opportunity.number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{opportunity.short_description || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">{opportunity.stage.name || 'N/A'}</td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {opportunity.account?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {opportunity.estimated_closed_date ? moment(opportunity.estimated_closed_date).format('YYYY-MM-DD') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-700 font-semibold">
                                            {opportunity.probability || 0}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(opportunity); }}
                                                className="text-cyan-600 hover:text-cyan-900 focus:outline-none focus:underline"
                                                aria-label={`View details for opportunity ${opportunity.number}`}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                        No opportunities found matching your criteria.
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

            {selectedOpportunity && (
                <OpportunityDetailModal opportunity={selectedOpportunity} onClose={closeModal} />
            )}
        </div>
    );
};

export default OpportunitiesDashboard;