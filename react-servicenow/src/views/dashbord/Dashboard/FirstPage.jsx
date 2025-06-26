import { useState, useEffect } from "react";
import {
  Package,
  Layers,
  ListTree,
  Boxes,
  MoreHorizontal,
  TrendingUp,
  Activity,
  Cpu,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
  Briefcase,
  Search,
  Filter,
  Edit,
  Download,
  RefreshCw,
  BarChart2,
  PieChart,
  LineChart,
  Database,
  DollarSign,
  ArrowUpRight,
  Clock,
  Tag,
  ShoppingCart,
  Award,
  Globe,
  CreditCard,
  Zap,
} from "lucide-react";
import { Tooltip, Table, Input, Select, DatePicker, Button, Card, Divider, Badge, Progress, Radio, Tabs, Dropdown, Menu } from 'antd';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useDispatch, useSelector } from 'react-redux';
import { getOpportunities } from '../../../features/servicenow/opportunity/opportunitySlice';
import { getPublished as getSpecs } from '../../../features/servicenow/product-specification/productSpecificationSlice';
import { getall as getProducts } from '../../../features/servicenow/product-offering/productOfferingSlice';
import { getall as getCategories } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getall as getCatalogs } from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';
import { getQuotes } from '../../../features/servicenow/quote/quotaSlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const { Search: AntSearch } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const OpportunityDashboard = () => {
  const dispatch = useDispatch();
  const opportunitiesState = useSelector(state => state.opportunity) || {};
  const specsState = useSelector(state => state.productSpecification) || {};
  const productsState = useSelector(state => state.productOffering) || {};
  const categoriesState = useSelector(state => state.productOfferingCategory) || {};
  const catalogsState = useSelector(state => state.productOfferingCatalog) || {};
  const quotesState = useSelector(state => state.quotes) || {};

  const opportunities = opportunitiesState?.opportunities || [];
  const specs = specsState?.data || [];
  const products = productsState?.data || [];
  const categories = categoriesState?.data || [];
  const catalogs = catalogsState?.data || [];
  const quotes = quotesState?.data || [];

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [visualizationType, setVisualizationType] = useState('bar');
  const [visualizationMetric, setVisualizationMetric] = useState('count');

  useEffect(() => {
    dispatch(getOpportunities({ page: 1, limit: 20 }));
    dispatch(getSpecs({ page: 1, limit: 20 }));
    dispatch(getProducts({ page: 1, limit: 20 }));
    dispatch(getCategories({ page: 1, limit: 20 }));
    dispatch(getCatalogs({ page: 1, limit: 20 }));
    dispatch(getQuotes({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    if (
      opportunities.length > 0 ||
      specs.length > 0 ||
      products.length > 0 ||
      categories.length > 0 ||
      catalogs.length > 0 ||
      quotes.length > 0
    ) {
      setLoading(false);
    }
  }, [opportunities, specs, products, categories, catalogs, quotes]);

  // Compute stats from Redux data
  const stats = {
    opportunities,
    specs,
    products,
    categories,
    catalogs,
    quotes
  };

  // Helper to ensure always array
  const safeArray = arr => Array.isArray(arr) ? arr : [];

  const exportData = (format) => {
    const dataToExport = safeArray(filteredData).map(item => ({
      Type: item.type,
      Name: item.short_description || item.name || item.number || 'N/A',
      Description: item.description || 'N/A',
      Status: item.status || item.state || item.stage?.name || 'N/A',
      'Last Updated': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A',
      Amount: item.amount || item.cumulative_acv ? `$${(item.amount || item.cumulative_acv).toLocaleString()}` : 'N/A'
    }));

    if (format === 'csv') {
      const csvContent = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(item => Object.values(item).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `export-${new Date().toISOString().slice(0,10)}.csv`);
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, `export-${new Date().toISOString().slice(0,10)}.xlsx`);
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      saveAs(blob, `export-${new Date().toISOString().slice(0,10)}.json`);
    }
  };

  const exportMenu = (
    <Menu onClick={({ key }) => exportData(key)}>
      <Menu.Item key="csv">CSV</Menu.Item>
      <Menu.Item key="excel">Excel</Menu.Item>
      <Menu.Item key="json">JSON</Menu.Item>
    </Menu>
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const getTopProducts = () => {
    const productCounts = {};
    safeArray(stats.quotes).forEach(quote => {
      quote.quote_lines?.forEach(line => {
        const productId = line.product_offering?._id || line.product_offering?.id;
        if (productId) {
          productCounts[productId] = (productCounts[productId] || 0) + parseInt(line.quantity || 1);
        }
      });
    });

    return [...safeArray(stats.products)]
      .sort((a, b) => {
        const countA = productCounts[a._id] || 0;
        const countB = productCounts[b._id] || 0;
        return countB - countA;
      })
      .slice(0, 3)
      .map((product, index) => ({
        ...product,
        sales: productCounts[product._id] || 0,
        growth: index === 2 ? -3 : Math.floor(Math.random() * 15) + 5
      }));
  };

  const getRecentActivities = () => {
    const opportunityActivities = safeArray(stats.opportunities)
      .slice(0, 2)
      .map(o => ({
        description: `Opportunity ${o.number} was ${o.stage?.name.toLowerCase()}`,
        timestamp: o.updatedAt || o.createdAt,
        initials: 'O'
      }));

    const quoteActivities = safeArray(stats.quotes)
      .slice(0, 2)
      .map(q => ({
        description: `Quote ${q.number} was ${q.state.toLowerCase()}`,
        timestamp: q.updatedAt || q.createdAt,
        initials: 'Q'
      }));

    const productActivities = safeArray(stats.products)
      .slice(0, 2)
      .map(p => ({
        description: `Product ${p.name} was updated`,
        timestamp: p.updatedAt || p.createdAt,
        initials: 'P'
      }));

    return [...opportunityActivities, ...quoteActivities, ...productActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 4);
  };

  const getTopCategories = () => {
    const categoryCounts = {};
    safeArray(stats.products).forEach(product => {
      const categoryId = product.category?.[0]?._id;
      if (categoryId) {
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      }
    });

    return [...safeArray(stats.categories)]
      .sort((a, b) => (categoryCounts[b._id] || 0) - (categoryCounts[a._id] || 0))
      .slice(0, 5)
      .map(category => ({
        ...category,
        productCount: categoryCounts[category._id] || 0
      }));
  };

  const getQuoteConversionRate = () => {
    const totalQuotes = safeArray(stats.quotes).length;
    const wonOpportunities = safeArray(stats.opportunities).filter(o => o.stage?.name === 'Closed - Won').length;
    return totalQuotes > 0 ? (wonOpportunities / totalQuotes * 100).toFixed(1) : 0;
  };

  const getRecentQuotes = () => {
    return [...safeArray(stats.quotes)]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(quote => ({
        ...quote,
        amount: quote.quote_lines?.reduce((sum, line) => sum + (parseFloat(line.unit_price) * parseInt(line.quantity || 1)), 0) || 0
      }));
  };

  const prepareChartData = () => {
    // Opportunity stage distribution
    const opportunityStageData = {
      labels: ['Closed - Won', 'In Progress', 'Closed - Lost'],
      datasets: [{
        data: [
          safeArray(stats.opportunities).filter(o => o.stage?.name === 'Closed - Won').length,
          safeArray(stats.opportunities).filter(o => o.stage?.name !== 'Closed - Won' && o.stage?.name !== 'Closed - Lost').length,
          safeArray(stats.opportunities).filter(o => o.stage?.name === 'Closed - Lost').length
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    };

    // Quote status distribution
    const quoteStatusData = {
      labels: ['Approved', 'Draft', 'Rejected'],
      datasets: [{
        data: [
          safeArray(stats.quotes).filter(q => q.state === 'Approved').length,
          safeArray(stats.quotes).filter(q => q.state === 'Draft').length,
          safeArray(stats.quotes).filter(q => q.state === 'Rejected').length
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    };

    // Monthly revenue data from opportunities
    const monthlyRevenue = {};
    safeArray(stats.opportunities).forEach(opp => {
      if (opp.stage?.name === 'Closed - Won') {
        const month = new Date(opp.updatedAt || opp.createdAt).toLocaleString('default', { month: 'short' });
        const amount = opp.line_items?.reduce((sum, item) => sum + parseFloat(item.cumulative_acv || 0), 0) || 0;
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
      }
    });

    const revenueData = {
      labels: Object.keys(monthlyRevenue),
      datasets: [{
        label: 'Revenue ($)',
        data: Object.values(monthlyRevenue),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    };

    // Top products in opportunities
    const productOpportunityCount = {};
    safeArray(stats.opportunities).forEach(opp => {
      opp.line_items?.forEach(item => {
        const productId = item.productOffering?._id;
        if (productId) {
          productOpportunityCount[productId] = (productOpportunityCount[productId] || 0) + 1;
        }
      });
    });

    const topProductsData = {
      labels: [...safeArray(stats.products)]
        .sort((a, b) => (productOpportunityCount[b._id] || 0) - (productOpportunityCount[a._id] || 0))
        .slice(0, 5)
        .map(p => p.name),
      datasets: [{
        label: 'Opportunity Count',
        data: [...safeArray(stats.products)]
          .sort((a, b) => (productOpportunityCount[b._id] || 0) - (productOpportunityCount[a._id] || 0))
          .slice(0, 5)
          .map(p => productOpportunityCount[p._id] || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    return {
      opportunityStageData,
      quoteStatusData,
      revenueData,
      topProductsData
    };
  };

  // Combine all data for the master table
  const allData = [
    ...safeArray(stats.opportunities).map(item => ({ 
      ...item, 
      type: 'Opportunity',
      amount: item.line_items?.reduce((sum, line) => sum + parseFloat(line.cumulative_acv || 0), 0) || 0
    })),
    ...safeArray(stats.quotes).map(item => ({ 
      ...item, 
      type: 'Quote',
      amount: item.quote_lines?.reduce((sum, line) => sum + (parseFloat(line.unit_price) * parseInt(line.quantity || 1)), 0) || 0
    })),
    ...safeArray(stats.products).map(item => ({ ...item, type: 'Product' })),
    ...safeArray(stats.specs).map(item => ({ ...item, type: 'Specification' })),
    ...safeArray(stats.categories).map(item => ({ ...item, type: 'Category' })),
    ...safeArray(stats.catalogs).map(item => ({ ...item, type: 'Catalog' }))
  ];

  // Before filtering, ensure dateRange is always an array
  const safeDateRange = Array.isArray(dateRange) ? dateRange : [];

  // Filter data based on user selections
  const filteredData = safeArray(allData).filter(item => {
    const name = item.short_description || item.name || '';
    const number = item.number || '';
    const description = item.description || '';

    const matchesSearch = searchText === '' ||
      (typeof name === 'string' && name.toLowerCase().includes(searchText.toLowerCase())) ||
      (typeof number === 'string' && number.toLowerCase().includes(searchText.toLowerCase())) ||
      (typeof description === 'string' && description.toLowerCase().includes(searchText.toLowerCase()));

    const matchesType = !selectedType || item.type === selectedType;

    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'active' && 
        (item.status === 'published' || item.state === 'Approved' || item.stage?.name === 'Closed - Won')) ||
      (selectedStatus === 'draft' && 
        (item.status === 'draft' || item.state === 'Draft')) ||
      (selectedStatus === 'inactive' && 
        (item.status === 'archived' || item.stage?.name === 'Closed - Lost'));

    const matchesDate = safeDateRange.length === 0 || 
      (item.updatedAt && 
        new Date(item.updatedAt) >= safeDateRange[0] && 
        new Date(item.updatedAt) <= safeDateRange[1]);

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Prepare visualization data based on filtered data
  const prepareFilteredVisualizations = () => {
    const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];
    if (safeFilteredData.length === 0) {
      return {
        typeDistribution: null,
        statusDistribution: null,
        monthlyTrend: null
      };
    }

    // Type distribution
    const typeCounts = {};
    safeFilteredData.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    const typeDistribution = {
      labels: Object.keys(typeCounts),
      datasets: [{
        label: 'Records by Type',
        data: Object.values(typeCounts),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    };

    // Status distribution
    const statusCounts = {
      'Active': 0,
      'Draft': 0,
      'Inactive': 0,
      'Other': 0
    };

    safeFilteredData.forEach(item => {
      if (item.status === 'published' || item.state === 'Approved' || item.stage?.name === 'Closed - Won') {
        statusCounts['Active']++;
      } else if (item.status === 'draft' || item.state === 'Draft') {
        statusCounts['Draft']++;
      } else if (item.status === 'archived' || item.stage?.name === 'Closed - Lost') {
        statusCounts['Inactive']++;
      } else {
        statusCounts['Other']++;
      }
    });

    const statusDistribution = {
      labels: Object.keys(statusCounts).filter(k => statusCounts[k] > 0),
      datasets: [{
        label: 'Records by Status',
        data: Object.values(statusCounts).filter((v, i) => Object.keys(statusCounts)[i] !== 'Other' || v > 0),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(201, 203, 207, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(201, 203, 207, 1)'
        ],
        borderWidth: 1
      }]
    };

    // Monthly trend
    const monthlyCounts = {};
    safeFilteredData.forEach(item => {
      const date = item.updatedAt || item.createdAt;
      if (date) {
        const month = new Date(date).toLocaleString('default', { month: 'short' });
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });

    const monthlyTrend = {
      labels: Object.keys(monthlyCounts).sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a) - months.indexOf(b);
      }),
      datasets: [{
        label: 'Records by Month',
        data: Object.keys(monthlyCounts).sort((a, b) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(a) - months.indexOf(b);
        }).map(month => monthlyCounts[month]),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    };

    return {
      typeDistribution,
      statusDistribution,
      monthlyTrend
    };
  };

  const { typeDistribution, statusDistribution, monthlyTrend } = prepareFilteredVisualizations();
  const chartData = prepareChartData();
  const recentActivities = getRecentActivities();
  const topCategories = getTopCategories();
  const recentQuotes = getRecentQuotes();
  const conversionRate = getQuoteConversionRate();

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Opportunity', value: 'Opportunity' },
        { text: 'Quote', value: 'Quote' },
        { text: 'Product', value: 'Product' },
        { text: 'Specification', value: 'Specification' },
        { text: 'Category', value: 'Category' },
        { text: 'Catalog', value: 'Catalog' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Name/Number',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span>
          {record.short_description || record.name || record.number || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <span className="truncate max-w-xs inline-block">
          {text || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text, record) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          text === 'published' || record.state === 'Approved' || record.stage?.name === 'Closed - Won' ? 
            'bg-green-100 text-green-800' :
          text === 'draft' || record.state === 'Draft' ? 
            'bg-yellow-100 text-yellow-800' :
          text === 'archived' || record.stage?.name === 'Closed - Lost' ? 
            'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
        }`}>
          {text || record.state || record.stage?.name || 'N/A'}
        </span>
      ),
      filters: [
        { text: 'Published/Approved/Won', value: 'active' },
        { text: 'Draft', value: 'draft' },
        { text: 'Archived/Lost', value: 'inactive' },
      ],
      onFilter: (value, record) => {
        if (value === 'active') {
          return record.status === 'published' || record.state === 'Approved' || record.stage?.name === 'Closed - Won';
        } else if (value === 'draft') {
          return record.status === 'draft' || record.state === 'Draft';
        } else if (value === 'inactive') {
          return record.status === 'archived' || record.stage?.name === 'Closed - Lost';
        }
        return true;
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text) => (
        <span>{text ? new Date(text).toLocaleDateString() : 'N/A'}</span>
      ),
      sorter: (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => (
        <span>{text ? `$${text.toLocaleString()}` : 'N/A'}</span>
      ),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Tooltip title="View Details">
            <button className="text-blue-600 hover:text-blue-800">
              <FileText className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip title="Edit">
            <button className="text-green-600 hover:text-green-800">
              <Edit className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const renderVisualizations = () => {
    if (!typeDistribution || !statusDistribution || !monthlyTrend) {
      return (
        <Card className="shadow-sm border border-gray-200 mb-6">
          <div className="text-center py-8 text-gray-500">
            No data available for the current filters
          </div>
        </Card>
      );
    }

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          bodyFont: {
            size: 12
          }
        }
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card 
          title="Records by Type" 
          className="shadow-sm border border-gray-200"
        >
          <div className="h-64">
            {visualizationType === 'bar' ? (
              <Bar 
                data={typeDistribution}
                options={{
                  ...commonOptions,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            ) : (
              <Pie 
                data={typeDistribution}
                options={commonOptions}
              />
            )}
          </div>
        </Card>

        <Card 
          title="Records by Status" 
          className="shadow-sm border border-gray-200"
        >
          <div className="h-64">
            {visualizationType === 'bar' ? (
              <Bar 
                data={statusDistribution}
                options={{
                  ...commonOptions,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            ) : (
              <Doughnut 
                data={statusDistribution}
                options={commonOptions}
              />
            )}
          </div>
        </Card>

        <Card 
          title="Monthly Trend" 
          className="shadow-sm border border-gray-200"
        >
          <div className="h-64">
            {visualizationType === 'bar' ? (
              <Bar 
                data={monthlyTrend}
                options={{
                  ...commonOptions,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            ) : (
              <Line 
                data={monthlyTrend}
                options={commonOptions}
              />
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <main>
        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">  
              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
                    <p className="text-2xl font-bold text-indigo-600">{safeArray(stats.opportunities).length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />  
                <div className="flex justify-between text-xs">  
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />  
                    {safeArray(stats.opportunities).filter(o => o.stage?.name === 'Closed - Won').length} Won
                  </span>
                  <span className="text-yellow-600">
                    <Activity className="inline w-3 h-3 mr-1" />  
                    {safeArray(stats.opportunities).filter(o => o.stage?.name !== 'Closed - Won' && o.stage?.name !== 'Closed - Lost').length} In Progress
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Quotes</p>
                    <p className="text-2xl font-bold text-pink-600">{safeArray(stats.quotes).length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-pink-50 text-pink-600">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    {safeArray(stats.quotes).filter(q => q.state === 'Approved').length} Approved
                  </span>
                  <span className="text-yellow-600">
                    <Edit className="inline w-3 h-3 mr-1" />
                    {safeArray(stats.quotes).filter(q => q.state === 'Draft').length} Draft
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold text-cyan-600">{safeArray(stats.products).length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-50 text-cyan-600">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    {safeArray(stats.products).filter(p => p.status === 'published').length} Published
                  </span>
                  <span className="text-yellow-600">
                    <Edit className="inline w-3 h-3 mr-1" />
                    {safeArray(stats.products).filter(p => p.status === 'draft').length} Draft
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ${safeArray(stats.opportunities)
                        .filter(o => o.stage?.name === 'Closed - Won')
                        .reduce((acc, opp) => {
                          const amount = opp.line_items?.reduce((sum, line) => sum + parseFloat(line.cumulative_acv || 0), 0) || 0;
                          return acc + amount;
                        }, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="text-xs text-gray-600">
                  <span>
                    <DollarSign className="inline w-3 h-3 mr-1" />
                    Avg. Opportunity: ${(safeArray(stats.opportunities)
                      .filter(o => o.stage?.name === 'Closed - Won')
                      .reduce((acc, opp) => {
                        const amount = opp.line_items?.reduce((sum, line) => sum + parseFloat(line.cumulative_acv || 0), 0) || 0;
                        return acc + amount;
                      }, 0) / (safeArray(stats.opportunities).filter(o => o.stage?.name === 'Closed - Won').length || 1).toFixed(2))}
                  </span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">  
              <Card 
                title={
                  <div className="flex items-center">
                    <LineChart className="w-4 h-4 text-purple-600 mr-2" /> 
                    <span className="text-sm font-medium">Revenue Trend</span> 
                  </div>
                }
                className="shadow-sm border border-gray-200"
                bodyStyle={{ padding: '12px' }} 
              >
                <div className="h-48"> 
                  <Line 
                    data={chartData.revenueData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            font: {
                              size: 10
                            }
                          }
                        },
                        tooltip: {
                          bodyFont: {
                            size: 10  
                          },
                          callbacks: {
                            label: (context) => `$${context.raw.toLocaleString()}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `$${value.toLocaleString()}`,
                            font: {
                              size: 10  
                            }
                          }
                        },
                        x: {
                          ticks: {
                            font: {
                              size: 10 
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>

              <Card 
                title={
                  <div className="flex items-center">
                    <PieChart className="w-4 h-4 text-green-600 mr-2" />  
                    <span className="text-sm font-medium">Opportunity Stages</span>  
                  </div>
                }
                className="shadow-sm border border-gray-200"
                bodyStyle={{ padding: '12px' }} 
              >
                <div className="h-48"> 
                  <Doughnut 
                    data={chartData.opportunityStageData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            font: {
                              size: 10 
                            }
                          }
                        },
                        tooltip: {
                          bodyFont: {
                            size: 10  
                          },
                          callbacks: {
                            label: (context) => {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </div>

            <div className="mt-10"> 
              <Card 
                title="All Data Records"
                className="shadow-sm border border-gray-200"
                extra={
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      placeholder="Filter by type"
                      allowClear
                      onChange={setSelectedType}
                      className="w-full sm:w-40"
                    >
                      <Option value="Opportunity">Opportunity</Option>
                      <Option value="Quote">Quote</Option>
                      <Option value="Product">Product</Option>
                      <Option value="Specification">Specification</Option>
                      <Option value="Category">Category</Option>
                      <Option value="Catalog">Catalog</Option>
                    </Select>
                    <Select
                      placeholder="Filter by status"
                      allowClear
                      onChange={setSelectedStatus}
                      className="w-full sm:w-40"
                    >
                      <Option value="active">Active</Option>
                      <Option value="draft">Draft</Option>
                      <Option value="inactive">Inactive</Option>
                    </Select>
                    <DatePicker.RangePicker 
                      onChange={setDateRange}
                      className="w-full sm:w-64"
                    />
                    <Dropdown overlay={exportMenu} trigger={['click']}>
                      <Button icon={<Download className="w-4 h-4" />}>
                        Export
                      </Button>
                    </Dropdown>
                    <Radio.Group 
                      value={visualizationType}
                      onChange={e => setVisualizationType(e.target.value)}
                      size="small"
                      buttonStyle="solid"
                      className="mr-2"
                    >
                      <Radio.Button value="bar">
                        <BarChart2 className="w-3 h-3" />
                      </Radio.Button>
                      <Radio.Button value="pie">
                        <PieChart className="w-3 h-3" />
                      </Radio.Button>
                      <Radio.Button value="line">
                        <LineChart className="w-3 h-3" />
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                }
              >
                {renderVisualizations()}
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="text-sm text-gray-700 font-medium">
                    Showing <span className="font-semibold text-cyan-700">{safeArray(filteredData).length}</span> records
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <AntSearch
                      placeholder="Search records..."
                      allowClear
                      enterButton={<Search className="w-4 h-4" />}
                      size="middle"
                      onSearch={value => setSearchText(value)}
                      className="w-full sm:w-44 md:w-52"
                    />

                    <Button
                      type="default"
                      icon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => {
                        setSearchText('');
                        setSelectedType(null);
                        setSelectedStatus(null);
                        setDateRange([]);
                      }}
                      className="text-gray-700 border-gray-300 hover:border-cyan-700 hover:text-cyan-700 transition"
                      size="middle"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
                
                <Table
                  columns={columns}
                  dataSource={filteredData}
                  rowKey="_id"
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100']
                  }}
                  scroll={{ x: true }}
                  loading={loading}
                />
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default OpportunityDashboard;