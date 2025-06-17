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
  Zap
} from "lucide-react";
import axios from 'axios';
import { Tooltip, Table, Input, Select, DatePicker, Button, Card, Divider, Badge, Progress, Radio, Tabs, Dropdown, Menu } from 'antd';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

import Section1 from "./Dashboard/Section1";
import Section2 from "./Dashboard/Section2";
import Section3 from "./Dashboard/Section3";
import Section4 from "./Dashboard/Section4";
import Section5 from "./Dashboard/Section5";
import Section6 from "./Dashboard/Section6";
import AIML from "./Dashboard/AI-ML";

const Home = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [stats, setStats] = useState({
    products: [],
    specs: [],
    categories: [],
    catalogs: [],
    quote: [],
    opportunities: []
  });
  const [visualizationType, setVisualizationType] = useState('bar');
  const [visualizationMetric, setVisualizationMetric] = useState('count');

  const tabs = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <Package className="w-4 h-4" />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: "offerings",
      title: "Product Offerings",
      icon: <Package className="w-4 h-4" />,
      component: <Section3 />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: "specifications",
      title: "Specifications",
      icon: <ListTree className="w-4 h-4" />,
      component: <Section4 />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      id: "catalogs",
      title: "Catalogs",
      icon: <Layers className="w-4 h-4" />,
      component: <Section2 />,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      id: "categories",
      title: "Categories",
      icon: <Boxes className="w-4 h-4" />,
      component: <Section1 />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "quote",
      title: "Quotes",
      icon: <FileText className="w-4 h-4" />,
      component: <Section5 />,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      id: "opportunities",
      title: "Opportunities",
      icon: <Briefcase className="w-4 h-4" />,
      component: <Section6 />,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        
        const endpoints = [
          { name: 'products', url: 'http://localhost:3000/api/products' },
          { name: 'product-specs', url: 'http://localhost:3000/api/product-specs' },
          { name: 'categories', url: 'http://localhost:3000/api/categories' },
          { name: 'catalogs', url: 'http://localhost:3000/api/catalogs' },
          { name: 'quote', url: 'http://localhost:3000/api/quotes' },
          { name: 'opportunities', url: 'http://localhost:3000/api/opportunities' }
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint => axios.get(endpoint.url, { headers }))
        );

        const [
          productsRes, 
          specsRes, 
          categoriesRes, 
          catalogsRes, 
          quoteRes,
          opportunitiesRes
        ] = responses;

        setStats({
          products: productsRes.data.data || [],
          specs: specsRes.data.data || [],
          categories: categoriesRes.data.data || [],
          catalogs: catalogsRes.data.data || [],
          quote: quoteRes.data.data || [],
          opportunities: opportunitiesRes.data.data || []
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const exportData = (format) => {
    const dataToExport = filteredData.map(item => ({
      Type: item.type,
      Name: item.display_name || item.name || item.number || 'N/A',
      Description: item.description || 'N/A',
      Status: item.status || item.state || item.stage?.display_value || 'N/A',
      'Last Updated': item.sys_updated_on ? new Date(item.sys_updated_on).toLocaleDateString() : 'N/A',
      Amount: item.amount ? `$${item.amount.toLocaleString()}` : 'N/A'
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
    stats.quote.forEach(quote => {
      quote.quote_lines?.forEach(line => {
        const productId = line.product_offering?.sys_id || line.product_offering?.id;
        if (productId) {
          productCounts[productId] = (productCounts[productId] || 0) + parseInt(line.quantity || 1);
        }
      });
    });

    return [...stats.products]
      .sort((a, b) => {
        const countA = productCounts[a.sys_id] || 0;
        const countB = productCounts[b.sys_id] || 0;
        return countB - countA;
      })
      .slice(0, 3)
      .map((product, index) => ({
        ...product,
        sales: productCounts[product.sys_id] || 0,
        growth: index === 2 ? -3 : Math.floor(Math.random() * 15) + 5
      }));
  };

  const getRecentActivities = () => {
    const productActivities = stats.products
      .slice(0, 2)
      .map(p => ({
        description: `Product ${p.name || p.display_name} was ${p.status === 'published' ? 'published' : 'updated'}`,
        timestamp: p.sys_updated_on || p.updatedAt || p.createdAt,
        initials: p.name ? p.name.charAt(0) : 'P'
      }));

    const quoteActivities = stats.quote
      .slice(0, 2)
      .map(q => ({
        description: `Quote ${q.number} was ${q.state.toLowerCase()}`,
        timestamp: q.updatedAt || q.createdAt,
        initials: 'Q'
      }));

    const opportunityActivities = stats.opportunities
      .slice(0, 2)
      .map(o => ({
        description: `Opportunity ${o.number} was ${o.stage?.display_value.toLowerCase()}`,
        timestamp: o.sys_updated_on || o.sys_created_on,
        initials: 'O'
      }));

    return [...productActivities, ...quoteActivities, ...opportunityActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 4);
  };

  const getTopCategories = () => {
    const categoryCounts = {};
    stats.products.forEach(product => {
      const categoryId = product.category?.sys_id;
      if (categoryId) {
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      }
    });

    return [...stats.categories]
      .sort((a, b) => (categoryCounts[b.sys_id] || 0) - (categoryCounts[a.sys_id] || 0))
      .slice(0, 5)
      .map(category => ({
        ...category,
        productCount: categoryCounts[category.sys_id] || 0
      }));
  };

  const getQuoteConversionRate = () => {
    const totalQuotes = stats.quote.length;
    const wonOpportunities = stats.opportunities.filter(o => o.stage?.display_value === 'Closed - Won').length;
    return totalQuotes > 0 ? (wonOpportunities / totalQuotes * 100).toFixed(1) : 0;
  };

  const getRecentQuotes = () => {
    return [...stats.quote]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(quote => ({
        ...quote,
        amount: parseFloat(quote.total_amount?.replace('$', '').replace(',', '') || 0)
      }));
  };

  const prepareChartData = () => {
    // Product status distribution
    const productStatusData = {
      labels: ['Published', 'Draft', 'Retired'],
      datasets: [{
        data: [
          stats.products.filter(p => p.status === 'Published').length,
          stats.products.filter(p => p.status === 'In Draft').length,
          stats.products.filter(p => p.status === 'Retired').length
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
          stats.quote.filter(q => q.state === 'Approved').length,
          stats.quote.filter(q => q.state === 'Draft').length,
          stats.quote.filter(q => q.state === 'Rejected').length
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

    // Monthly revenue data
    const monthlyRevenue = {};
    stats.quote.forEach(quote => {
      const month = new Date(quote.createdAt).toLocaleString('default', { month: 'short' });
      const amount = parseFloat(quote.total_amount?.replace('$', '').replace(',', '') || 0);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
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

    // Top products sales data
    const topProducts = getTopProducts();
    const topProductsData = {
      labels: topProducts.map(p => p.display_name || p.name),
      datasets: [{
        label: 'Units Sold',
        data: topProducts.map(p => p.sales),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    return {
      productStatusData,
      quoteStatusData,
      revenueData,
      topProductsData
    };
  };

  // Combine all data for the master table
  const allData = [
    ...stats.products.map(item => ({ ...item, type: 'Product' })),
    ...stats.specs.map(item => ({ ...item, type: 'Specification' })),
    ...stats.categories.map(item => ({ ...item, type: 'Category' })),
    ...stats.catalogs.map(item => ({ ...item, type: 'Catalog' })),
    ...stats.quote.map(item => ({ ...item, type: 'Quote', amount: parseFloat(item.total_amount?.replace('$', '').replace(',', '') || 0) })),
    ...stats.opportunities.map(item => ({ ...item, type: 'Opportunity' }))
  ];

  // Filter data based on user selections
  const filteredData = allData.filter(item => {
    const matchesSearch = searchText === '' || 
      (item.name && item.name.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.number && item.number.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesType = !selectedType || item.type === selectedType;
    
    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'active' && 
        (item.status === 'Published' || item.state === 'Approved' || item.stage?.display_value === 'Closed - Won')) ||
      (selectedStatus === 'draft' && 
        (item.status === 'In Draft' || item.state === 'Draft')) ||
      (selectedStatus === 'retired' && 
        (item.status === 'Retired' || item.stage?.display_value === 'Closed - Lost'));
    
    const matchesDate = dateRange.length === 0 || 
      (item.sys_updated_on && 
        new Date(item.sys_updated_on) >= dateRange[0] && 
        new Date(item.sys_updated_on) <= dateRange[1]);
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Prepare visualization data based on filtered data
  const prepareFilteredVisualizations = () => {
    if (filteredData.length === 0) {
      return {
        typeDistribution: null,
        statusDistribution: null,
        monthlyTrend: null
      };
    }

    // Type distribution
    const typeCounts = {};
    filteredData.forEach(item => {
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

    filteredData.forEach(item => {
      if (item.status === 'Published' || item.state === 'Approved' || item.stage?.display_value === 'Closed - Won') {
        statusCounts['Active']++;
      } else if (item.status === 'In Draft' || item.state === 'Draft') {
        statusCounts['Draft']++;
      } else if (item.status === 'Retired' || item.stage?.display_value === 'Closed - Lost') {
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
    filteredData.forEach(item => {
      const date = item.sys_updated_on || item.updatedAt || item.createdAt;
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
        { text: 'Product', value: 'Product' },
        { text: 'Specification', value: 'Specification' },
        { text: 'Category', value: 'Category' },
        { text: 'Catalog', value: 'Catalog' },
        { text: 'Quote', value: 'Quote' },
        { text: 'Opportunity', value: 'Opportunity' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Name/Number',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span>
          {record.display_name || record.name || record.number || 'N/A'}
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
          text === 'Published' || record.state === 'Approved' || record.stage?.display_value === 'Closed - Won' ? 
            'bg-green-100 text-green-800' :
          text === 'In Draft' || record.state === 'Draft' ? 
            'bg-yellow-100 text-yellow-800' :
          text === 'Retired' || record.stage?.display_value === 'Closed - Lost' ? 
            'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
        }`}>
          {text || record.state || record.stage?.display_value || 'N/A'}
        </span>
      ),
      filters: [
        { text: 'Published/Approved/Won', value: 'active' },
        { text: 'In Draft', value: 'draft' },
        { text: 'Retired/Lost', value: 'retired' },
      ],
      onFilter: (value, record) => {
        if (value === 'active') {
          return record.status === 'Published' || record.state === 'Approved' || record.stage?.display_value === 'Closed - Won';
        } else if (value === 'draft') {
          return record.status === 'In Draft' || record.state === 'Draft';
        } else if (value === 'retired') {
          return record.status === 'Retired' || record.stage?.display_value === 'Closed - Lost';
        }
        return true;
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'sys_updated_on',
      key: 'sys_updated_on',
      render: (text) => (
        <span>{text ? new Date(text).toLocaleDateString() : 'N/A'}</span>
      ),
      sorter: (a, b) => new Date(a.sys_updated_on || 0) - new Date(b.sys_updated_on || 0),
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
    <div className="w-full min-h-screen bg-gray-50 text-gray-800">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        <div className="mb-2"> 
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? `${tab.bgColor} ${tab.color} shadow-sm`
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">  
              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.products.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />  
                <div className="flex justify-between text-xs">  
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />  
                    {stats.products.filter(p => p.status === 'Published').length} Published
                  </span>
                  <span className="text-yellow-600">
                    <Edit className="inline w-3 h-3 mr-1" />  
                    {stats.products.filter(p => p.status === 'In Draft').length} Draft
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Quotes</p>
                    <p className="text-2xl font-bold text-pink-600">{stats.quote.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-pink-50 text-pink-600">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    {stats.quote.filter(q => q.state === 'Approved').length} Approved
                  </span>
                  <span className="text-yellow-600">
                    <Edit className="inline w-3 h-3 mr-1" />
                    {stats.quote.filter(q => q.state === 'Draft').length} Draft
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
                    <p className="text-2xl font-bold text-cyan-600">{stats.opportunities.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-50 text-cyan-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">
                    <TrendingUp className="inline w-3 h-3 mr-1" />
                    {stats.opportunities.filter(o => o.stage?.display_value === 'Closed - Won').length} Won
                  </span>
                  <span className="text-red-600">
                    <TrendingUp className="inline w-3 h-3 mr-1 transform rotate-180" />
                    {stats.opportunities.filter(o => o.stage?.display_value === 'Closed - Lost').length} Lost
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ${stats.quote.reduce((acc, quote) => {
                        const amount = parseFloat(quote.total_amount?.replace('$', '').replace(',', '') || 0);
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
                    Avg. Quote: ${(stats.quote.reduce((acc, quote) => {
                      const amount = parseFloat(quote.total_amount?.replace('$', '').replace(',', '') || 0);
                      return acc + amount;
                    }, 0) / (stats.quote.length || 1)).toFixed(2)}
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
                    <span className="text-sm font-medium">Product Status</span>  
                  </div>
                }
                className="shadow-sm border border-gray-200"
                bodyStyle={{ padding: '12px' }} 
              >
                <div className="h-48"> 
                  <Doughnut 
                    data={chartData.productStatusData}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8"> 
              <Card className="shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium">Quote Conversion</span>
                  </div>
                  <Badge count={`${conversionRate}%`} style={{ backgroundColor: '#52c41a' }} />
                </div>
                <Progress 
                  percent={parseFloat(conversionRate)} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  showInfo={false}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <Divider className="my-3" />
                <div className="text-xs text-gray-600">
                  <span>{stats.opportunities.filter(o => o.stage?.display_value === 'Closed - Won').length} won opportunities</span>
                </div>
              </Card>

              <Card 
                title={
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">Top Categories</span>
                  </div>
                }
                className="shadow-sm border border-gray-200"
              >
                <div className="space-y-3">
                  {topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{category.name || 'Unnamed Category'}</span>
                      <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                        {category.productCount} products
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card 
                title={
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-pink-500 mr-2" />
                    <span className="text-sm font-medium">Recent Quotes</span>
                  </div>
                }
                className="shadow-sm border border-gray-200"
              >
                <div className="space-y-3">
                  {recentQuotes.map((quote, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{quote.number}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-bold">${quote.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6"> 
              <Card 
                title={
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 text-amber-500 mr-2" />
                    <span className="text-sm font-medium">Top Products</span>
                  </div>
                }
                className="shadow-sm border border-gray-200"
                bodyStyle={{ padding: '12px' }}
              >
                <div className="space-y-3"> 
                  {getTopProducts().map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-md ${
                          index === 0 ? 'bg-amber-100' : 
                          index === 1 ? 'bg-blue-100' : 'bg-purple-100'
                        } flex items-center justify-center mr-2`}>
                          <span className={`text-xs ${
                            index === 0 ? 'text-amber-800' : 
                            index === 1 ? 'text-blue-800' : 'text-purple-800'
                          } font-medium`}>{product.code?.charAt(0) || 'P'}</span>
                        </div>
                        <span className="text-sm truncate max-w-[120px]">{product.display_name || product.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium">{product.sales} sold</span>
                        <span className={`block text-xs ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.growth >= 0 ? '+' : ''}{product.growth}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card 
                title={
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">Recent Activities</span>
                  </div>
                }
                className="shadow-sm border border-gray-200"
                bodyStyle={{ padding: '12px' }}
              >
                <ul className="space-y-3"> 
                  {recentActivities.map((activity, index) => (
                    <li key={index} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full ${
                        index === 0 ? 'bg-blue-100' : 
                        index === 1 ? 'bg-green-100' : 'bg-purple-100'
                      } flex items-center justify-center mr-2`}>
                        <span className={`text-xs ${
                          index === 0 ? 'text-blue-600' : 
                          index === 1 ? 'text-green-600' : 'text-purple-600'
                        } font-medium`}>{activity.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
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
                      <Option value="Product">Product</Option>
                      <Option value="Specification">Specification</Option>
                      <Option value="Category">Category</Option>
                      <Option value="Catalog">Catalog</Option>
                      <Option value="Quote">Quote</Option>
                      <Option value="Opportunity">Opportunity</Option>
                    </Select>
                    <Select
                      placeholder="Filter by status"
                      allowClear
                      onChange={setSelectedStatus}
                      className="w-full sm:w-40"
                    >
                      <Option value="active">Active</Option>
                      <Option value="draft">Draft</Option>
                      <Option value="retired">Retired</Option>
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
    Showing <span className="font-semibold text-cyan-700">{filteredData.length}</span> records
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
                  rowKey="sys_id"
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

            <AIML />
          </>
        ) : (
          <>
            {tabs.find((tab) => tab.id === activeTab)?.component}
            <AIML />
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8"> 
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            © {new Date().getFullYear()} ProductHub. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
            <a href="#" className="hover:text-gray-700">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;