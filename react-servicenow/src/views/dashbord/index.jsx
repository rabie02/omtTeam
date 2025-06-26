import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Layers3,
  PackageOpen,
  FileText,
  Repeat,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Zap,
  Activity,
  ShoppingCart,
  Tag,
  Award,ChevronDown ,
  TrendingUp as TrendingUpIcon,
  PieChart
} from 'lucide-react';
import { Progress, Badge, Divider } from 'antd';

import Category from "./Dashboard/Category";
import Catalog from "./Dashboard/Catalog";
import ProductOffering from "./Dashboard/ProductOffering";
import ProductSpecification from "./Dashboard/ProductSpecification";
import Quotes from "./Dashboard/Quotes";
import Opportunity from "./Dashboard/Opportunity";
import Dashboard from "./Dashboard/Dashboard";
import AIML from "./Dashboard/AI-ML";
import { useDispatch, useSelector } from 'react-redux';
import { getOpportunities } from '../../features/servicenow/opportunity/opportunitySlice';
import { getall as getProducts } from '../../features/servicenow/product-offering/productOfferingSlice';
import { getQuotes } from '../../features/servicenow/quote/quotaSlice';
import { getall as getCategories } from '../../features/servicenow/product-offering/productOfferingCategorySlice';

const TAB_DATA = [
  { key: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-1" /> },
  { key: 'Category', label: 'Category', icon: <FolderKanban className="w-4 h-4 mr-1" /> },
  { key: 'Catalog', label: 'Catalog', icon: <Layers3 className="w-4 h-4 mr-1" /> },
  { key: 'ProductOffering', label: 'Product Offering', icon: <PackageOpen className="w-4 h-4 mr-1" /> },
  { key: 'ProductSpecification', label: 'Specification', icon: <FileText className="w-4 h-4 mr-1" /> },
  { key: 'Quotes', label: 'Quotes', icon: <Repeat className="w-4 h-4 mr-1" /> },
  { key: 'Opportunity', label: 'Opportunity', icon: <TrendingUp className="w-4 h-4 mr-1" /> },
];


const Home = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [openCard, setOpenCard] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Redux state selectors
  const opportunitiesState = useSelector(state => state.opportunity) || {};
  const productsState = useSelector(state => state.productOffering) || {};
  const quotesState = useSelector(state => state.quotes) || {};
  const categoriesState = useSelector(state => state.productOfferingCategory) || {};

  const opportunities = opportunitiesState?.opportunities || [];
  const products = productsState?.data || [];
  const quotes = quotesState?.data || [];
  const categories = categoriesState?.data || [];

  useEffect(() => {
    dispatch(getOpportunities({ page: 1, limit: 20 }));
    dispatch(getProducts({ page: 1, limit: 20 }));
    dispatch(getQuotes({ page: 1, limit: 20 }));
    dispatch(getCategories({ page: 1, limit: 20 }));
  }, [dispatch]);

  // Helper functions
  const getRecentActivities = () => {
    const opportunityActivities = [...opportunities]
      .slice(0, 2)
      .map(o => ({
        description: `Opportunity ${o.number} was ${o.stage?.name.toLowerCase()}`,
        timestamp: o.updatedAt || o.createdAt,
        initials: 'O'
      }));

    const quoteActivities = [...quotes]
      .slice(0, 2)
      .map(q => ({
        description: `Quote ${q.number} was ${q.state.toLowerCase()}`,
        timestamp: q.updatedAt || q.createdAt,
        initials: 'Q'
      }));

    const productActivities = [...products]
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

  const getTopProductsInOpportunities = () => {
    const productCounts = {};
    [...opportunities].forEach(opp => {
      opp.line_items?.forEach(item => {
        const productId = item.productOffering?._id;
        if (productId) {
          productCounts[productId] = (productCounts[productId] || 0) + 1;
        }
      });
    });

    return [...products]
      .sort((a, b) => {
        const countA = productCounts[a._id] || 0;
        const countB = productCounts[b._id] || 0;
        return countB - countA;
      })
      .slice(0, 3)
      .map((product, index) => ({
        ...product,
        oppCount: productCounts[product._id] || 0,
        growth: index === 2 ? -3 : Math.floor(Math.random() * 15) + 5
      }));
  };

  const getQuoteConversionRate = () => {
    const totalQuotes = [...quotes].length;
    const wonOpportunities = [...opportunities].filter(o => o.stage?.name === 'Closed - Won').length;
    return totalQuotes > 0 ? (wonOpportunities / totalQuotes * 100).toFixed(1) : 0;
  };

  const getTopCategories = () => {
    const categoryCounts = {};
    [...products].forEach(product => {
      const categoryId = product.category?.[0]?._id;
      if (categoryId) {
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      }
    });

    return [...categories]
      .sort((a, b) => (categoryCounts[b._id] || 0) - (categoryCounts[a._id] || 0))
      .slice(0, 5)
      .map(category => ({
        ...category,
        productCount: categoryCounts[category._id] || 0
      }));
  };

  const getRecentQuotes = () => {
    return [...quotes]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(quote => ({
        ...quote,
        amount: quote.quote_lines?.reduce((sum, line) => sum + (parseFloat(line.unit_price) * parseInt(line.quantity || 1)), 0) || 0
      }));
  };

  const INFO_CARDS = [
    {
      key: 'activities',
      title: 'Recent Activities',
      icon: <Activity className="w-5 h-5 text-cyan-700" />,
      description: 'Track the latest updates across the platform.',
      content: (
        <ul className="space-y-3">
          {getRecentActivities().map((activity, index) => (
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
      ),
    },
    {
      key: 'topProducts',
      title: 'Top Products in Opportunities',
      icon: <ShoppingCart className="w-5 h-5 text-cyan-700" />,
      description: 'See which products are most frequently included in opportunities.',
      content: (
        <div className="space-y-3">
          {getTopProductsInOpportunities().map((product, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-md ${
                  index === 0 ? 'bg-amber-100' : 
                  index === 1 ? 'bg-blue-100' : 'bg-purple-100'
                } flex items-center justify-center mr-2`}>
                  <span className={`text-xs ${
                    index === 0 ? 'text-amber-800' : 
                    index === 1 ? 'text-blue-800' : 'text-purple-800'
                  } font-medium`}>{product.name?.charAt(0) || 'P'}</span>
                </div>
                <span className="text-sm truncate max-w-[120px]">{product.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium">{product.oppCount} opportunities</span>
                <span className={`block text-xs ${index === 2 ? 'text-red-600' : 'text-green-600'}`}>
                  {index === 2 ? '-' : '+'}{product.growth}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'conversion',
      title: 'Quote Conversion',
      icon: <TrendingUpIcon className="w-5 h-5 text-cyan-700" />,
      description: 'Track how many quotes convert to won opportunities.',
      content: (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <PieChart className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-sm font-medium">Conversion Rate</span>
            </div>
            <Badge count={`${getQuoteConversionRate()}%`} style={{ backgroundColor: '#52c41a' }} />
          </div>
          <Progress 
            percent={parseFloat(getQuoteConversionRate())} 
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
            <span>{[...opportunities].filter(o => o.stage?.name === 'Closed - Won').length} won opportunities</span>
          </div>
        </div>
      ),
    },
    {
      key: 'topCategories',
      title: 'Top Categories',
      icon: <Tag className="w-5 h-5 text-cyan-700" />,
      description: 'See which categories have the most products.',
      content: (
        <div className="space-y-3">
          {getTopCategories().map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{category.name || 'Unnamed Category'}</span>
              <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                {category.productCount} products
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'recentQuotes',
      title: 'Recent Quotes',
      icon: <Award className="w-5 h-5 text-cyan-700" />,
      description: 'View the most recently created quotes.',
      content: (
        <div className="space-y-3">
          {getRecentQuotes().map((quote, index) => (
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
      ),
    },
    {
      key: 'actions',
      title: 'Quick Actions',
      icon: <Zap className="w-5 h-5 text-cyan-700" />,
      description: 'Create new entries or view reports instantly.',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-700 text-white font-semibold shadow-md
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/catalog');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.00001V18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.0001 12H18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.0001H12" />
            </svg>
           Catalog
          </button>

          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-700 text-white font-semibold shadow-md
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/category');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M7.5 3H4.5A2.25 2.25 0 002.25 5.25v4.5A2.25 2.25 0 004.5 12h3V3z" />
            </svg>
            Category
          </button>

          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-700 text-white font-semibold shadow-md
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/product-specification');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h4.5m-4.5 3H12M9.75 21l-5.69-5.69a9 9 0 013.375-15.023A1.125 1.125 0 0110.125 3h4.5L21 8.875V19.5A2.25 2.25 0 0118.75 21H9.75z" />
            </svg>
          Specification
          </button>

          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-700 text-white font-semibold shadow-md
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/product-offering');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Product Offering
          </button>

          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-700 text-white font-semibold shadow-md
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/opportunity');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18V6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9L12 12.75L8.25 9" />
            </svg>
            Opportunity
          </button>

          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-700 text-white font-semibold shadow-md
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/quote');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M12 21a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            Quotes
          </button>
        </div>
      ),
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <Dashboard />;
      case 'Category': return <Category />;
      case 'Catalog': return <Catalog />;
      case 'ProductOffering': return <ProductOffering />;
      case 'ProductSpecification': return <ProductSpecification />;
      case 'Quotes': return <Quotes />;
      case 'Opportunity': return <Opportunity />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <div className="p-6 font-sans bg-gray-100 min-h-screen flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-700 pb-2 border-b-4 border-cyan-700 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-cyan-700" />
            Admin Dashboard
          </h1>
        </div>

        {/* Clickable Cards - updated to 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {INFO_CARDS.map((card) => (
            <div
              key={card.key}
              onClick={() => setOpenCard(openCard === card.key ? null : card.key)}
              className={`cursor-pointer bg-white p-4 rounded-lg shadow-md border border-gray-200 transition transform hover:scale-[1.02] ${
                openCard === card.key ? 'ring-2 ring-cyan-500' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {card.icon}
                <h3 className="text-cyan-700 font-semibold">{card.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{card.description}</p>

              {/* Revealed content - only shown when card is open */}
              {openCard === card.key && (
                <div className="mt-3 animate-fadeIn">
                  {card.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6 bg-white rounded-lg shadow-md p-3 border border-cyan-400">
          {TAB_DATA.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center justify-center gap-1 w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out
                ${activeTab === key
                  ? 'bg-cyan-700 text-white shadow-md shadow-cyan-400/30'
                  : 'text-cyan-800 hover:bg-cyan-100 hover:text-cyan-900'
                }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div>
  {renderContent()}
</div>

<div className="mt-10 bg-white border border-cyan-100 rounded-3xl shadow-2xl p-10 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:scale-[1.01] min-h-[520px]">
  <div className="flex flex-col items-start gap-6">
    <div className="flex items-center justify-between w-full">
      <h2 className="text-3xl font-bold text-cyan-800">
        🚀 AI Model Training Hub
      </h2>
      <div className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full shadow-sm border border-green-300">
        Pro
      </div>
    </div>

    <p className="text-gray-600 leading-relaxed text-base max-w-3xl">
      Train, monitor, and evaluate your machine learning models with powerful tools built for professionals. Gain insights and optimize performance with ease.
    </p>

    <div className="w-full mt-4">
      <AIML />
    </div>
  </div>
</div>



      </div>
      
      {/* Footer */}
      
      <footer className="bg-white border-t border-gray-200 py-4  mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <div className="mb-2 md:mb-0">
            © {new Date().getFullYear()} ProductHub. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
            <a href="#" className="hover:text-gray-700">Help Center</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home; 