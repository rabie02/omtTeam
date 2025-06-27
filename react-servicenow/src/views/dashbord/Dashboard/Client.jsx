import React, { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  MapPin,
  Search,
  Filter,
  Edit,
  Download,
  RefreshCw,
  BarChart2,
  PieChart,
  LineChart,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  CheckCircle2,
  FileText,
  Database,
  ArrowUpRight,
  Clock,
  Tag,
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
import { getAccount } from '../../../features/servicenow/account/accountSlice';
import { getContacts } from '../../../features/servicenow/contact/contactSlice';
import { getLocations } from '../../../features/servicenow/location/locationSlice';

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

const ClientDashboard = () => {
  const dispatch = useDispatch();
  const accountState = useSelector(state => state.account) || {};
  const contactState = useSelector(state => state.contact) || {};
  const locationState = useSelector(state => state.location) || {};

  const accounts = accountState?.data || [];
  const contacts = contactState?.data || [];
  const locations = locationState?.data || [];

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [visualizationType, setVisualizationType] = useState('bar');

  useEffect(() => {
    dispatch(getAccount({ page: 1, limit: 20 }));
    dispatch(getContacts({ page: 1, limit: 20 }));
    dispatch(getLocations({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    if (accounts.length > 0 || contacts.length > 0 || locations.length > 0) {
      setLoading(false);
    }
  }, [accounts, contacts, locations]);

  // Combine all data for the master table
  const allData = [
    ...accounts.map(item => ({ ...item, type: 'Account', active: item.status === 'active' })),
    ...contacts.map(item => ({ ...item, type: 'Contact', active: item.active })),
    ...locations.map(item => ({ ...item, type: 'Location', active: !item.archived }))
  ];

  // Filter data based on user selections
  const filteredData = allData.filter(item => {
    const name = item.name || item.firstName || '';
    const email = item.email || '';
    const phone = item.phone || '';

    const matchesSearch = searchText === '' ||
      (typeof name === 'string' && name.toLowerCase().includes(searchText.toLowerCase())) ||
      (typeof email === 'string' && email.toLowerCase().includes(searchText.toLowerCase())) ||
      (typeof phone === 'string' && phone.toLowerCase().includes(searchText.toLowerCase()));

    const matchesType = !selectedType || item.type === selectedType;

    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'active' && item.active === true) ||
      (selectedStatus === 'inactive' && item.active === false);

    const matchesDate = !dateRange || dateRange.length === 0 || 
      (item.updatedAt && 
        new Date(item.updatedAt) >= dateRange[0] && 
        new Date(item.updatedAt) <= dateRange[1]);

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const exportData = (format) => {
    const dataToExport = filteredData.map(item => ({
      Type: item.type,
      Name: item.name || `${item.firstName} ${item.lastName}` || 'N/A',
      Email: item.email || 'N/A',
      Phone: item.phone || 'N/A',
      Status: item.active ? 'Active' : 'Inactive',
      'Last Updated': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'
    }));

    if (format === 'csv') {
      const csvContent = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(item => Object.values(item).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `clients-export-${new Date().toISOString().slice(0,10)}.csv`);
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
      XLSX.writeFile(workbook, `clients-export-${new Date().toISOString().slice(0,10)}.xlsx`);
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      saveAs(blob, `clients-export-${new Date().toISOString().slice(0,10)}.json`);
    }
  };

  const exportMenu = (
    <Menu onClick={({ key }) => exportData(key)}>
      <Menu.Item key="csv">CSV</Menu.Item>
      <Menu.Item key="excel">Excel</Menu.Item>
      <Menu.Item key="json">JSON</Menu.Item>
    </Menu>
  );

  // Prepare visualization data
  const prepareVisualizations = () => {
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
          'rgba(6, 182, 212, 0.6)', // cyan-500
          'rgba(8, 145, 178, 0.6)', // cyan-600
          'rgba(14, 116, 144, 0.6)'  // cyan-700
        ],
        borderColor: [
          'rgba(6, 182, 212, 1)',
          'rgba(8, 145, 178, 1)',
          'rgba(14, 116, 144, 1)'
        ],
        borderWidth: 1
      }]
    };

    // Status distribution
    const statusCounts = {
      'Active': filteredData.filter(item => item.active).length,
      'Inactive': filteredData.filter(item => !item.active).length
    };

    const statusDistribution = {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Records by Status',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(6, 182, 212, 0.6)', // cyan-500
          'rgba(239, 68, 68, 0.6)'   // red-500
        ],
        borderColor: [
          'rgba(6, 182, 212, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }]
    };

    // Monthly trend
    const monthlyCounts = {};
    filteredData.forEach(item => {
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
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderColor: 'rgba(6, 182, 212, 1)',
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

  const { typeDistribution, statusDistribution, monthlyTrend } = prepareVisualizations();

  const getRecentActivities = () => {
    const accountActivities = accounts
      .slice(0, 2)
      .map(a => ({
        description: `Account ${a.name} was updated`,
        timestamp: a.updatedAt || a.createdAt,
        initials: 'A'
      }));

    const contactActivities = contacts
      .slice(0, 2)
      .map(c => ({
        description: `Contact ${c.firstName} ${c.lastName} was updated`,
        timestamp: c.updatedAt || c.createdAt,
        initials: 'C'
      }));

    const locationActivities = locations
      .slice(0, 2)
      .map(l => ({
        description: `Location ${l.name} was updated`,
        timestamp: l.updatedAt || l.createdAt,
        initials: 'L'
      }));

    return [...accountActivities, ...contactActivities, ...locationActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 4);
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Account', value: 'Account' },
        { text: 'Contact', value: 'Contact' },
        { text: 'Location', value: 'Location' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (text) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          text === 'Account' ? 'bg-blue-100 text-blue-800' :
          text === 'Contact' ? 'bg-purple-100 text-purple-800' :
          'bg-indigo-100 text-indigo-800'
        }`}>
          {text}
        </span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span>
          {record.type === 'Contact' ? 
            `${record.firstName || ''} ${record.lastName || ''}`.trim() : 
            record.name || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span>{text || 'N/A'}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => <span>{text || 'N/A'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'status',
      render: (text) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          text ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {text ? 'Active' : 'Inactive'}
        </span>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => {
        if (value === 'active') return record.active === true;
        if (value === 'inactive') return record.active === false;
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
    if (filteredData.length === 0) {
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const recentActivities = getRecentActivities();

  return (
    <div>
      <main>
        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">  
              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Accounts</p>
                    <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />  
                <div className="flex justify-between text-xs">  
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    {accounts.filter(a => a.status === 'active').length} Active
                  </span>
                  <span className="text-gray-600">
                    {accounts.filter(a => a.status !== 'active').length} Inactive
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Contacts</p>
                    <p className="text-2xl font-bold text-purple-600">{contacts.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    {contacts.filter(c => c.active).length} Active
                  </span>
                  <span className="text-gray-600">
                    {contacts.filter(c => !c.active).length} Inactive
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Locations</p>
                    <p className="text-2xl font-bold text-indigo-600">{locations.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    {locations.filter(l => !l.archived).length} Active
                  </span>
                  <span className="text-gray-600">
                    {locations.filter(l => l.archived).length} Inactive
                  </span>
                </div>
              </Card>

              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Clients</p>
                    <p className="text-2xl font-bold text-cyan-600">
                      {accounts.length + contacts.length + locations.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-50 text-cyan-600">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="text-xs text-gray-600">
                  <span>
                    <ArrowUpRight className="inline w-3 h-3 mr-1" />
                    {accounts.filter(a => a.status === 'active').length + 
                     contacts.filter(c => c.active).length + 
                     locations.filter(l => !l.archived).length} Active
                  </span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">  
              <Card 
                title={
                  <div className="flex items-center">
                    <LineChart className="w-4 h-4 text-blue-600 mr-2" /> 
                    <span className="text-sm font-medium">Client Growth</span> 
                  </div>
                }
                className="shadow-sm border border-gray-200"
                bodyStyle={{ padding: '12px' }} 
              >
                <div className="h-48"> 
                  <Line 
                    data={monthlyTrend}
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
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
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
                    <PieChart className="w-4 h-4 text-purple-600 mr-2" />  
                    <span className="text-sm font-medium">Client Types</span>  
                  </div>
                }
                className="shadow-sm border border-gray-200"
                bodyStyle={{ padding: '12px' }} 
              >
                <div className="h-48"> 
                  <Doughnut 
                    data={typeDistribution}
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
                title="Client Records"
                className="shadow-sm border border-gray-200"
                extra={
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      placeholder="Filter by type"
                      allowClear
                      onChange={setSelectedType}
                      className="w-full sm:w-40"
                    >
                      <Option value="Account">Account</Option>
                      <Option value="Contact">Contact</Option>
                      <Option value="Location">Location</Option>
                    </Select>
                    <Select
                      placeholder="Filter by status"
                      allowClear
                      onChange={setSelectedStatus}
                      className="w-full sm:w-40"
                    >
                      <Option value="active">Active</Option>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
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
              </Card>

              <div className="mt-6">
                {renderVisualizations()}
              </div>

              <div className="mt-6">
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
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default ClientDashboard;