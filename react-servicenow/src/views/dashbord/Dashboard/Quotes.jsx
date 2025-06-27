"use client"; // This directive is typically used in Next.js for client-side components

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getQuotes } from '../../../features/servicenow/quote/quotaSlice';
import moment from 'moment'; // Using moment for date formatting as in your original component
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
    Info, // Used for general info in modal
    Tag, // Used for number/ID
    Building2, // For account
    Handshake, // For opportunity
    ShoppingCart, // For quote lines
    Banknote, // For total value
    Hourglass, // For pending
    MinusCircle, // For rejected
    PenSquare, // For draft
    ExternalLink // Added for external links in modal
} from "lucide-react"; // Using lucide-react for icons as in your example design
import { format, parseISO } from "date-fns"; // Keeping date-fns for chart x-axis formatting

// Custom debounce from lodash for filters
import { debounce } from "lodash";

// --- Design Constants ---
const COLORS = ["#007B98", "#00A3C4", "#00C9F0", "#5DD5F4", "#8BE0F7", "#B9EBFA"]; // Cyan shades
const STATUS_COLORS = {
    "approved": "#10B981", // Green-500
    "draft": "#3B82F6",    // Blue-500
    "pending": "#F59E0B",  // Orange-500
    "rejected": "#EF4444", // Red-500
    "expired": "#9CA3AF",  // Gray-400
    "Unknown": "#6B7280"   // Gray-500
};
const CURRENCY_COLORS = {
    "USD": "#007B98",
    "EUR": "#F59E0B",
    "GBP": "#6366F1",
    "Unknown": "#9CA3AF"
};

// Helper to get status badge style
const getStatusBadgeClass = (status) => {
    const color = STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS["Unknown"];
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${color.replace('#', 'bg-[')}]`;
};

// --- Quote Detail Modal Component (Adapted to new design) ---
const QuoteDetailModal = ({ quote, onClose }) => {
    if (!quote) return null;

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

    const getQuoteLinePrice = (line) => {
        const unitPrice = parseFloat(line.unit_price || 0);
        const quantity = parseInt(line.quantity || 1);
        return (unitPrice * quantity).toFixed(2);
    };

    const calculateTotalQuoteValue = (quoteLines) => {
        return quoteLines.reduce((sum, line) => {
            const unitPrice = parseFloat(line.unit_price || 0);
            const quantity = parseInt(line.quantity || 1);
            return sum + (unitPrice * quantity);
        }, 0).toFixed(2);
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return CheckCircle;
            case 'draft': return PenSquare;
            case 'pending': return Hourglass;
            case 'rejected': return MinusCircle;
            case 'expired': return Clock;
            default: return Info;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center bg-cyan-700 text-white px-6 py-4 border-b border-cyan-800">
                    <h2 className="text-xl font-bold flex items-center">
                        <FileText className="mr-3 text-cyan-200" size={24} />
                        Quote {quote.number} Details
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
                        {/* General Quote Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <List className="mr-2" size={20} /> General Information
                            </h3>
                            <DetailItem label="Quote Number" value={quote.number || 'N/A'} icon={Tag} />
                            <DetailItem
                                label="State"
                                value={quote.state?.toUpperCase() || 'N/A'}
                                icon={getStatusIcon(quote.state)}
                                valueClass={`font-bold ${STATUS_COLORS[quote.state?.toLowerCase()] ? `text-[${STATUS_COLORS[quote.state?.toLowerCase()]}]` : 'text-cyan-700'}`}
                            />
                            <DetailItem label="Currency" value={quote.currency || 'N/A'} icon={DollarSign} />
                            <DetailItem label="Short Description" value={quote.short_description || 'N/A'} icon={Info} />
                            <DetailItem label="Active" value={quote.active === 'true' ? 'Yes' : 'No'} icon={CheckCircle} />
                            <DetailItem label="Subscription Start" value={quote.subscription_start_date ? moment(quote.subscription_start_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Subscription End" value={quote.subscription_end_date ? moment(quote.subscription_end_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Expiration Date" value={quote.expiration_date ? moment(quote.expiration_date).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Total Value" value={`${quote.currency || ''} ${calculateTotalQuoteValue(quote.quote_lines || [])}`} icon={Banknote} valueClass="font-bold text-xl text-cyan-800" />
                        </div>

                        {/* Opportunity Details */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Handshake className="mr-2" size={20} /> Opportunity Details
                            </h3>
                            <DetailItem label="Number" value={quote.opportunity?.number || 'N/A'} icon={Tag} />
                            <DetailItem label="Short Description" value={quote.opportunity?.short_description || 'N/A'} icon={Info} />
                            <DetailItem label="Stage" value={quote.opportunity?.stage?.label || quote.opportunity?.stage || 'N/A'} icon={Info} />
                            <DetailItem label="Probability" value={`${quote.opportunity?.probability || 'N/A'}%`} icon={Percent} />
                            <DetailItem label="Industry" value={quote.opportunity?.industry || 'N/A'} icon={Building2} />
                            <DetailItem label="Estimated Closed" value={quote.opportunity?.estimated_closed_date ? moment(quote.opportunity.estimated_closed_date).format('YYYY-MM-DD') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Term (Months)" value={quote.opportunity?.term_month || 'N/A'} icon={Clock} />
                        </div>

                        {/* Account Details */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Users className="mr-2" size={20} /> Account Details
                            </h3>
                            <DetailItem label="Account Name" value={quote.account?.name || 'N/A'} icon={Tag} />
                            <DetailItem label="Account Email" value={quote.account?.email || 'N/A'} icon={Info} />
                            <DetailItem label="Account Phone" value={quote.account?.phone || 'N/A'} icon={Info} />
                            {quote.account?.contacts && quote.account.contacts.length > 0 && (
                                <div className="py-2 border-b border-gray-100">
                                    <h4 className="font-semibold text-cyan-700 mb-2 flex items-center"><Users size={16} className="mr-2" /> Contacts:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {quote.account.contacts.map((contact, index) => (
                                            <li key={index}>
                                                {contact.firstName} {contact.lastName} ({contact.email}) {contact.isPrimaryContact ? '(Primary)' : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {quote.account?.locations && quote.account.locations.length > 0 && (
                                <div className="py-2 last:border-b-0">
                                    <h4 className="font-semibold text-cyan-700 mb-2 flex items-center"><Building2 size={16} className="mr-2" /> Locations:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {quote.account.locations.map((loc, index) => (
                                            <li key={index}>
                                                {loc.name || 'Unnamed Location'}: {loc.street}, {loc.city}, {loc.country}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Quote Lines */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <ShoppingCart className="mr-2" size={20} /> Quote Lines ({quote.quote_lines?.length || 0})
                            </h3>
                            {quote.quote_lines && quote.quote_lines.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">#</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Product Offering</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Quantity</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Unit Price</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Line Total</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Term</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">State</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {quote.quote_lines.map((line, index) => (
                                                <tr key={line._id || index}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{index + 1}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-cyan-700">{line.product_offering?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{line.quantity || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{line.unit_price || 'N/A'} {quote.currency}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-cyan-700">{getQuoteLinePrice(line)} {quote.currency}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{line.term_month || 'N/A'} Months</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{line.state || 'N/A'}</td>
                                                   
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{line.action || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No quote lines associated with this quote.</p>
                            )}
                        </div>

                        {/* System Information */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm col-span-full">
                            <h3 className="text-lg font-bold text-cyan-800 mb-4 border-b pb-2 border-gray-200 flex items-center">
                                <Clock className="mr-2" size={20} /> System Information
                            </h3>
                            <DetailItem label="Created On" value={quote.createdAt ? moment(quote.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Calendar} />
                            <DetailItem label="Last Updated" value={quote.updatedAt ? moment(quote.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'} icon={Clock} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Quotes Dashboard Component ---
const QuotesDashboard = () => {
    const dispatch = useDispatch();
    const {
        data: quotes,
        loading,
        error,
        total: totalItemsRedux,
    } = useSelector((state) => state.quotes);

    // Local state for filters and pagination
    const [searchText, setSearchText] = useState(''); // Corresponds to numberFilter in example
    const [accountFilter, setAccountFilter] = useState(''); // New filter from example
    const [quoteStateFilter, setQuoteStateFilter] = useState(''); // Corresponds to statusFilter
    const [currencyFilter, setCurrencyFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState(''); // Original filter
    const [subscriptionStartDateFilter, setSubscriptionStartDateFilter] = useState(null); // Original filter
    const [expirationDateFilter, setExpirationDateFilter] = useState(null); // Original filter

    const [selectedQuote, setSelectedQuote] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Fixed items per page
    const [sortConfig, setSortConfig] = useState({ key: "number", direction: "asc" }); // Default sort

    // New states from example design
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'chart'
    const [expandedFilters, setExpandedFilters] = useState(false); // For filter section
    const [expandedCharts, setExpandedCharts] = useState(true); // For chart section
    const [dateRange, setDateRange] = useState({ from: '', to: '' }); // Combined date filter, using empty string for no selection

    // Debounced filter handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetSearchText = useCallback(debounce((value) => setSearchText(value), 300), []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetAccountFilter = useCallback(debounce((value) => setAccountFilter(value), 300), []);


    // Fetch initial data (fetching a larger limit for client-side filtering)
    useEffect(() => {
        if (!quotes || quotes.length === 0 || totalItemsRedux === 0) {
            dispatch(getQuotes({ page: 1, limit: 1000 })); // Fetch all for client-side filtering
        }
    }, [dispatch, quotes, totalItemsRedux]);

    // Extract unique filter options (using existing data structure)
    const uniqueCurrencies = useMemo(() => {
        const currencies = new Set();
        quotes.forEach(quote => {
            if (quote.currency) currencies.add(quote.currency);
        });
        return Array.from(currencies).sort();
    }, [quotes]);

    const uniqueStates = useMemo(() => {
        const states = new Set();
        quotes.forEach(quote => {
            if (quote.state) states.add(quote.state);
        });
        return Array.from(states).sort();
    }, [quotes]);


    // Memoized filtered data
    const filteredData = useMemo(() => {
        let currentFilteredData = quotes;

        if (searchText) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.number?.toLowerCase().includes(searchText.toLowerCase()) ||
                item._id?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (accountFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.account?.name?.toLowerCase().includes(accountFilter.toLowerCase())
            );
        }

        if (quoteStateFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.state?.toLowerCase() === quoteStateFilter.toLowerCase());
        }

        if (currencyFilter) {
            currentFilteredData = currentFilteredData.filter(item => item.currency?.toLowerCase() === currencyFilter.toLowerCase());
        }

        if (activeFilter !== '') {
            const isActiveBool = activeFilter === 'true';
            currentFilteredData = currentFilteredData.filter(item => item.active === String(isActiveBool));
        }

        // Combined date range filter for creation date
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

        // Original separate subscription/expiration date filters (if still desired, can be integrated)
        if (subscriptionStartDateFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.subscription_start_date && moment(item.subscription_start_date).isSameOrAfter(subscriptionStartDateFilter, 'day')
            );
        }

        if (expirationDateFilter) {
            currentFilteredData = currentFilteredData.filter(item =>
                item.expiration_date && moment(item.expiration_date).isSameOrBefore(expirationDateFilter, 'day')
            );
        }

        return currentFilteredData;
    }, [
        quotes,
        searchText,
        accountFilter,
        quoteStateFilter,
        currencyFilter,
        activeFilter,
        dateRange,
        subscriptionStartDateFilter,
        expirationDateFilter
    ]);

    // Sorting logic adapted for the new design's sortConfig
    const sortedQuotes = useMemo(() => {
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                // Adjusting accessors based on your quote data structure
                if (sortConfig.key === 'account') {
                    aValue = a.account?.name || "";
                    bValue = b.account?.name || "";
                } else if (sortConfig.key === 'total_amount') {
                    // Calculate total amount from quote lines for sorting
                    const calculateValue = (quoteItem) => {
                        return (quoteItem.quote_lines || []).reduce((sum, line) => {
                            const unitPrice = parseFloat(line.unit_price || 0);
                            const quantity = parseInt(line.quantity || 1);
                            return sum + (unitPrice * quantity);
                        }, 0);
                    };
                    aValue = calculateValue(a);
                    bValue = calculateValue(b);
                } else if (sortConfig.key === 'state') {
                    aValue = a.state || "";
                    bValue = b.state || "";
                }
                else if (sortConfig.key === 'currency') {
                    aValue = a.currency || "";
                    bValue = b.currency || "";
                }
                else if (sortConfig.key === 'sys_created_on') { // Map to 'createdAt'
                    aValue = moment(a.createdAt).valueOf(); // Convert to timestamp for reliable sorting
                    bValue = moment(b.createdAt).valueOf();
                }
                else { // Default for direct accessors like 'number'
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

    const paginatedQuotes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedQuotes.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedQuotes, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedQuotes.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

    // Metrics calculations (adapted for your current data structure)
    const quoteMetrics = useMemo(() => {
        const metrics = {
            total: quotes.length,
            approved: 0,
            draft: 0,
            pending: 0, // Using 'pending' as per your original data
            rejected: 0,
            expired: 0,
            newThisMonth: 0,
            totalValue: 0
        };

        const currentDate = moment(); // Use moment for date comparisons
        quotes.forEach(item => {
            if (item.state?.toLowerCase() === "approved") metrics.approved++;
            if (item.state?.toLowerCase() === "draft") metrics.draft++;
            if (item.state?.toLowerCase() === "pending") metrics.pending++;
            if (item.state?.toLowerCase() === "rejected") metrics.rejected++;
            
            // Check for expiration
            if (item.expiration_date && moment(item.expiration_date).isBefore(currentDate, 'day')) {
                metrics.expired++;
            }

            // Calculate total value from quote lines
            const quoteTotal = (item.quote_lines || []).reduce((lineSum, line) => {
                const unitPrice = parseFloat(line.unit_price || 0);
                const quantity = parseInt(line.quantity || 1);
                return lineSum + (unitPrice * quantity);
            }, 0);
            metrics.totalValue += quoteTotal;

            const createdDate = moment(item.createdAt);
            if (createdDate.month() === currentDate.month() &&
                createdDate.year() === currentDate.year()) {
                metrics.newThisMonth++;
            }
        });

        return metrics;
    }, [quotes]);

    // Chart data calculations
    const statusData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            const status = item.state || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const creationTrendData = useMemo(() => {
        const monthlyCounts = filteredData.reduce((acc, item) => {
            const dateStr = item.createdAt; // Use createdAt
            if (!dateStr) return acc;
            try {
                const date = moment(dateStr);
                const monthYear = date.format('YYYY-MM'); // Format for sorting
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

    const currencyData = useMemo(() => {
        const counts = filteredData.reduce((acc, item) => {
            const currency = item.currency || "Unknown"; // Use item.currency directly
            acc[currency] = (acc[currency] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);

    const exportToCSV = () => {
        const headers = ["number", "account_name", "state", "currency", "total_amount", "created_at", "expiration_date"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.number || ''}"`,
                `"${item.account?.name || ''}"`,
                `"${item.state || ''}"`,
                `"${item.currency || ''}"`,
                `"${(item.quote_lines || []).reduce((sum, line) => {
                    const unitPrice = parseFloat(line.unit_price || 0);
                    const quantity = parseInt(line.quantity || 1);
                    return sum + (unitPrice * quantity);
                }, 0).toFixed(2)}"`, // Calculate total from lines
                `"${item.createdAt || ''}"`,
                `"${item.expiration_date || ''}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "quotes.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetFilters = () => {
        setSearchText("");
        setAccountFilter("");
        setQuoteStateFilter("");
        setCurrencyFilter("");
        setActiveFilter("");
        setSubscriptionStartDateFilter(null);
        setExpirationDateFilter(null);
        setDateRange({ from: '', to: '' });
        setCurrentPage(1);
        setSortConfig({ key: "number", direction: "asc" }); // Reset sort as well
    };

    const handleRowClick = useCallback((quote) => {
        setSelectedQuote(quote);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedQuote(null);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-cyan-700">Loading Quotes</h3>
                    <p className="text-gray-500">Fetching the latest quote data...</p>
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
                        onClick={() => dispatch(getQuotes({ page: 1, limit: 1000 }))} // Retry fetch
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
                        <FileText className="mr-3 text-cyan-700" size={28} />
                        Quotes Dashboard
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
                        onClick={() => dispatch(getQuotes({ page: 1, limit: 1000 }))}
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
                        <p className="text-sm font-medium text-gray-500">Total Quotes</p>
                        <p className="mt-1 text-3xl font-bold text-cyan-700">{quoteMetrics.total}</p>
                    </div>
                    <FileText className="text-cyan-600" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Approved Quotes</p>
                        <p className="mt-1 text-3xl font-bold text-green-600">{quoteMetrics.approved}</p>
                    </div>
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Quotes</p>
                        <p className="mt-1 text-3xl font-bold text-orange-600">{quoteMetrics.pending}</p>
                    </div>
                    <Hourglass className="text-orange-500" size={32} />
                </div>
                <div className="bg-cyan-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-100">Total Quote Value</p>
                        <p className="mt-1 text-3xl font-bold">${quoteMetrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <Banknote className="text-cyan-200" size={36} />
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
                            <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Quote Number/ID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by number or ID"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetSearchText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="accountFilter" className="text-sm font-medium text-gray-700 mb-1">Account Name</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="accountFilter"
                                    placeholder="Filter by account"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                    onChange={(e) => debouncedSetAccountFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="quoteStateFilter" className="text-sm font-medium text-gray-700 mb-1">Quote State</label>
                            <select
                                id="quoteStateFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={quoteStateFilter}
                                onChange={(e) => { setQuoteStateFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All States</option>
                                {uniqueStates.map(state => (
                                    <option key={state} value={state}>{state.charAt(0).toUpperCase() + state.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="currencyFilter" className="text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                                id="currencyFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={currencyFilter}
                                onChange={(e) => { setCurrencyFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Currencies</option>
                                {uniqueCurrencies.map(currency => (
                                    <option key={currency} value={currency}>{currency}</option>
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
                            <label htmlFor="activeFilter" className="text-sm font-medium text-gray-700 mb-1">Active Status</label>
                            <select
                                id="activeFilter"
                                className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                value={activeFilter}
                                onChange={(e) => { setActiveFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
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
                                        onClick={() => requestSort('number')}
                                    >
                                        <div className="flex items-center">
                                            Quote Number
                                            {sortConfig.key === 'number' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('account')}
                                    >
                                        <div className="flex items-center">
                                            Account Name
                                            {sortConfig.key === 'account' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('state')}
                                    >
                                        <div className="flex items-center">
                                            State
                                            {sortConfig.key === 'state' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('currency')}
                                    >
                                        <div className="flex items-center">
                                            Currency
                                            {sortConfig.key === 'currency' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('total_amount')}
                                    >
                                        <div className="flex items-center">
                                            Total Amount
                                            {sortConfig.key === 'total_amount' && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('sys_created_on')}
                                    >
                                        <div className="flex items-center">
                                            Created On
                                            {sortConfig.key === 'sys_created_on' && (
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
                                {paginatedQuotes.length > 0 ? (
                                    paginatedQuotes.map((quote) => (
                                        <tr
                                            key={quote._id}
                                            className="odd:bg-gray-50 hover:bg-cyan-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => handleRowClick(quote)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{quote.number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{quote.account?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-500">{quote.state}</td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{quote.currency || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-700 font-semibold">
                                                {quote.currency || ''} {(quote.quote_lines || []).reduce((sum, line) => {
                                                    const unitPrice = parseFloat(line.unit_price || 0);
                                                    const quantity = parseInt(line.quantity || 1);
                                                    return sum + (unitPrice * quantity);
                                                }, 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {moment(quote.createdAt).format('YYYY-MM-DD')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRowClick(quote); }}
                                                    className="text-cyan-600 hover:text-cyan-900 focus:outline-none focus:underline"
                                                    aria-label={`View details for quote ${quote.number}`}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                            No quotes found matching your criteria.
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
                            Quote Analytics
                        </h2>
                        {expandedCharts ? <ChevronUp size={20} className="text-cyan-700" /> : <ChevronDown size={20} className="text-cyan-700" />}
                    </div>

                    {expandedCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Activity className="mr-2" size={18} /> Quotes by Status</h3>
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
                                        <Tooltip formatter={(value, name) => [`${value} Quotes`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><DollarSign className="mr-2" size={18} /> Quotes by Currency</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={currencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value, name) => [`${value} Quotes`, name]} />
                                        <Bar dataKey="value">
                                            {currencyData.map((entry, index) => (
                                                <Cell key={`bar-cell-${index}`} fill={CURRENCY_COLORS[entry.name] || CURRENCY_COLORS.Unknown} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="mr-2" size={18} /> Quote Creation Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={creationTrendData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(dateStr) => format(parseISO(dateStr + '-01'), 'MMM yy')} // Assumes YYYY-MM
                                        />
                                        <YAxis />
                                        <Tooltip labelFormatter={(label) => moment(label).format('MMMM YYYY')} />
                                        <Legend />
                                        <Line type="monotone" dataKey="count" stroke="#007B98" activeDot={{ r: 8 }} name="Quotes Created" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {selectedQuote && (
                <QuoteDetailModal quote={selectedQuote} onClose={closeModal} />
            )}
        </div>
    );
};

export default QuotesDashboard;