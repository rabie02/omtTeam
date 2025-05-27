import { Card, Row, Col, Statistic, Progress, Divider } from 'antd';
import {  Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import {getall as getProductOfferings} from '../../features/servicenow/product-offering/productOfferingSlice';
import {getall as getProductOfferingCatalog} from '../../features/servicenow/product-offering/productOfferingCatalogSlice';
import {getall as getProductOfferingCategory} from '../../features/servicenow/product-offering/productOfferingCategorySlice';
import {getQuotes} from '../../features/servicenow/quote/quotaSlice';
import {getPublished as getSpecs} from '../../features/servicenow/product-specification/productSpecificationSlice';
import { useEffect } from 'react';

const Home = () => {
  const dispatch = useDispatch();
  
  // Get required data from Redux store
  const {
    productOfferings,
    categories,
    catalogs,
    specs,
    quotes
  } = useSelector((state) => ({
    productOfferings: state.productOffering.totalItems || 0,
    categories: state.productOfferingCategory.totalItems || 0,
    catalogs: state.productOfferingCatalog.totalItems || 0,
    specs: state.productSpecification.totalItems || 0,
    quotes: state.quotes.total || 0
  }));

  useEffect(() => {
    dispatch(getProductOfferings({ page: 1, limit: 6 }));
    dispatch(getProductOfferingCatalog({ page: 1, limit: 6 }));
    dispatch(getProductOfferingCategory({ page: 1, limit: 6 }));
    dispatch(getQuotes({ page: 1, limit: 6 }));
    dispatch(getSpecs({ page: 1, limit: 6 }));
  }, [dispatch]);

  // Calculate totals for comparison
  const totalItems = productOfferings + categories + catalogs + specs + quotes;
  const maxCount = Math.max(productOfferings, categories, catalogs, specs, quotes);

  // Data for charts
  const pieData = [
    { name: 'Product Offerings', value: productOfferings, color: '#0891b2' },
    { name: 'Categories', value: categories, color: '#06b6d4' },
    { name: 'Catalogs', value: catalogs, color: '#22d3ee' },
    { name: 'Specifications', value: specs, color: '#67e8f9' },
    { name: 'Quotes', value: quotes, color: '#a7f3d0' },
  ];

  const barData = [
    { name: 'Offerings', value: productOfferings },
    { name: 'Categories', value: categories },
    { name: 'Catalogs', value: catalogs },
    { name: 'Specs', value: specs },
    { name: 'Quotes', value: quotes },
  ];

  // Sample trend data (you can replace with real historical data)
  const trendData = [
    { month: 'Jan', offerings: productOfferings * 0.7, categories: categories * 0.8 },
    { month: 'Feb', offerings: productOfferings * 0.8, categories: categories * 0.85 },
    { month: 'Mar', offerings: productOfferings * 0.9, categories: categories * 0.9 },
    { month: 'Apr', offerings: productOfferings * 0.95, categories: categories * 0.95 },
    { month: 'May', offerings: productOfferings, categories: categories },
  ];

  const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a7f3d0'];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-cyan-600">Dashboard</h1>
      
      {/* Summary Cards */}
      <Row gutter={16} className="mb-6">
        
          <Col span={6}>
          <Link to="/dashboard/product-offering">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic 
              title="Product Offerings" 
              value={productOfferings} 
              valueStyle={{ color: '#0891b2' }}
              prefix={<div className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>}
            />
            <Progress 
              percent={(productOfferings / maxCount) * 100} 
              showInfo={false} 
              strokeColor="#06b6d4"
            />
          </Card>
          </Link>
          </Col>
          
        
         <Col span={6}>
          <Link to="/dashboard/category">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic 
              title="Category" 
              value={productOfferings} 
              valueStyle={{ color: '#0891b2' }}
              prefix={<div className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>}
            />
            <Progress 
              percent={(productOfferings / maxCount) * 100} 
              showInfo={false} 
              strokeColor="#06b6d4"
            />
          </Card>
          </Link>
          </Col>


        <Col span={6}>
          <Link to="/dashboard/catalog">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic 
              title="Catalogs" 
              value={catalogs} 
              valueStyle={{ color: '#0891b2' }}
              prefix={<div className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>}
            />
            <Progress 
              percent={(catalogs / maxCount) * 100} 
              showInfo={false} 
              strokeColor="#06b6d4"
            />
          </Card>
          </Link>
        </Col>
        <Col span={6}>
          <Link to="/dashboard/quote">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic 
              title="Quotes" 
              value={quotes} 
              valueStyle={{ color: '#0891b2' }}
              prefix={<div className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>}
            />
            <Progress 
              percent={(quotes / maxCount) * 100} 
              showInfo={false} 
              strokeColor="#06b6d4"
            />
          </Card>
          </Link>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={16} className="mb-6">
        {/* Pie Chart */}
        <Col span={12}>
          <Card 
            title="Distribution Pie Chart" 
            className="shadow-md"
            headStyle={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e2e8f0' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Bar Chart */}
        <Col span={12}>
          <Card 
            title="Items Comparison" 
            className="shadow-md"
            headStyle={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e2e8f0' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Trend Charts Row */}
      <Row gutter={16} className="mb-6">
        {/* Line Chart */}
        <Col span={12}>
          <Card 
            title="Growth Trend" 
            className="shadow-md"
            headStyle={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e2e8f0' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="offerings" stroke="#0891b2" strokeWidth={2} />
                <Line type="monotone" dataKey="categories" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Area Chart */}
        <Col span={12}>
          <Card 
            title="Cumulative View" 
            className="shadow-md"
            headStyle={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e2e8f0' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="offerings" stackId="1" stroke="#0891b2" fill="#0891b2" fillOpacity={0.6} />
                <Area type="monotone" dataKey="categories" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={16}>
        {/* Left Column */}
        <Col span={12}>
          <Card 
            title="Distribution Overview" 
            className="shadow-md h-full"
            headStyle={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e2e8f0' }}
          >
            <div className="flex flex-col space-y-4">
              {[
                { name: 'Product Offerings', value: productOfferings, color: 'bg-cyan-500' },
                { name: 'Categories', value: categories, color: 'bg-cyan-400' },
                { name: 'Catalogs', value: catalogs, color: 'bg-cyan-300' },
                { name: 'Specifications', value: specs, color: 'bg-cyan-200' },
                { name: 'Quotes', value: quotes, color: 'bg-cyan-100' },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden bg-gray-200`}>
                    <div 
                      className={`h-full ${item.color}`} 
                      style={{ width: `${(item.value / totalItems) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right Column */}
        <Col span={12}>
          <Card 
            title="Quick Statistics" 
            className="shadow-md h-full"
            headStyle={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e2e8f0' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div className="bg-cyan-50 p-4 rounded-lg mb-4">
                  <div className="text-cyan-800 font-semibold">Total Items</div>
                  <div className="text-3xl font-bold text-cyan-600">{totalItems}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="bg-white p-4 rounded-lg mb-4 border border-cyan-100">
                  <div className="text-cyan-800 font-semibold">Highest Count</div>
                  <div className="text-3xl font-bold text-cyan-600">{maxCount}</div>
                </div>
              </Col>
            </Row>

            <Divider orientation="left" className="text-cyan-600">Ratios</Divider>
            
            <Row gutter={16}>
              <Col span={12}>
                <div className="p-4">
                  <div className="font-medium mb-2">Offerings to Categories</div>
                  <Progress 
                    percent={(productOfferings / categories) * 100} 
                    strokeColor="#06b6d4" 
                    format={() => `${(productOfferings / categories).toFixed(1)}:1`}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="p-4">
                  <div className="font-medium mb-2">Catalogs to Specs</div>
                  <Progress 
                    percent={(catalogs / specs) * 100} 
                    strokeColor="#06b6d4" 
                    format={() => `${(catalogs / specs).toFixed(1)}:1`}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;