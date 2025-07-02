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
  Lightbulb, // Icon for AI/ML
  Zap,
  Activity,
  ShoppingCart,
  Tag,
  Award,
  ChevronDown,
  TrendingUp as TrendingUpIcon,
  PieChart,
  Users,
  User,
  MapPin,
  Briefcase,
  Phone,
  Globe
} from 'lucide-react';
import { Progress, Badge, Divider } from 'antd';

// Dashboard components
import Dashboard from "./Dashboard/Dashboard";
import Category from "./Dashboard/Category";
import Catalog from "./Dashboard/Catalog";
import ProductOffering from "./Dashboard/ProductOffering";
import ProductSpecification from "./Dashboard/ProductSpecification";
import Quotes from "./Dashboard/Quotes";
import Opportunity from "./Dashboard/Opportunity";
// Client components
import Client from "./Dashboard/Client";
import Account from "./Dashboard/Account";
import Contact from "./Dashboard/Contact";
import Location from "./Dashboard/Location";
import AIML from "./Dashboard/AI-ML"; // Import the AIML component
import { useDispatch, useSelector } from 'react-redux';
import { getOpportunities } from '../../features/servicenow/opportunity/opportunitySlice';
import { getall as getProducts } from '../../features/servicenow/product-offering/productOfferingSlice';
import { getQuotes } from '../../features/servicenow/quote/quotaSlice';
import { getall as getCategories } from '../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getAccount } from '../../features/servicenow/account/accountSlice';
import { getContacts } from '../../features/servicenow/contact/contactSlice';
import { getLocations } from '../../features/servicenow/location/locationSlice';

const TAB_DATA = [
  { 
    key: 'Dashboard', 
    label: 'Dashboard', 
    icon: <LayoutDashboard className="w-4 h-4 mr-1" />,
    subTabs: [
      { key: 'Dashboard', label: 'Overview', icon: <BarChart3 className="w-4 h-4 mr-1" /> },
      { key: 'Category', label: 'Category', icon: <FolderKanban className="w-4 h-4 mr-1" /> },
      { key: 'Catalog', label: 'Catalog', icon: <Layers3 className="w-4 h-4 mr-1" /> },
      { key: 'ProductOffering', label: 'Products', icon: <PackageOpen className="w-4 h-4 mr-1" /> },
      { key: 'ProductSpecification', label: 'Specifications', icon: <FileText className="w-4 h-4 mr-1" /> },
      { key: 'Quotes', label: 'Quotes', icon: <Repeat className="w-4 h-4 mr-1" /> },
      { key: 'Opportunity', label: 'Opportunities', icon: <TrendingUp className="w-4 h-4 mr-1" /> }
    ]
  },
  { 
    key: 'Client', 
    label: 'Client', 
    icon: <Users className="w-4 h-4 mr-1" />,
    subTabs: [
      { key: 'Client', label: 'Overview', icon: <Users className="w-4 h-4 mr-1" /> },
      { key: 'Account', label: 'Accounts', icon: <User className="w-4 h-4 mr-1" /> },
      { key: 'Contact', label: 'Contacts', icon: <User className="w-4 h-4 mr-1" /> },
      { key: 'Location', label: 'Locations', icon: <MapPin className="w-4 h-4 mr-1" /> }
    ]
  }
];

const Home = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSubTab, setActiveSubTab] = useState('Dashboard');
  const [openCard, setOpenCard] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state selectors
  const opportunitiesState = useSelector(state => state.opportunity) || {};
  const productsState = useSelector(state => state.productOffering) || {};
  const quotesState = useSelector(state => state.quotes) || {};
  const categoriesState = useSelector(state => state.productOfferingCategory) || {};
  const accountsState = useSelector(state => state.account) || {};
  const contactsState = useSelector(state => state.contact) || {};
  const locationsState = useSelector(state => state.location) || {};

  const opportunities = opportunitiesState?.opportunities || [];
  const products = productsState?.data || [];
  const quotes = quotesState?.data || [];
  const categories = categoriesState?.data || [];
  const accounts = accountsState?.data || [];
  const contacts = contactsState?.data || [];
  const locations = locationsState?.data || [];

  useEffect(() => {
    dispatch(getOpportunities({ page: 1, limit: 20 }));
    dispatch(getProducts({ page: 1, limit: 20 }));
    dispatch(getQuotes({ page: 1, limit: 20 }));
    dispatch(getCategories({ page: 1, limit: 20 }));
    dispatch(getAccount({ page: 1, limit: 5 }));
    dispatch(getContacts({ page: 1, limit: 5 }));
    dispatch(getLocations({ page: 1, limit: 5 }));
  }, [dispatch]);

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

  const getRecentAccounts = () => {
    return [...accounts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(account => ({
        ...account,
        contactCount: account.contacts?.length || 0
      }));
  };

  const getRecentContacts = () => {
    return [...contacts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };

  const getRecentLocations = () => {
    return [...locations]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
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
      key: 'recentAccounts',
      title: 'Recent Accounts',
      icon: <Briefcase className="w-5 h-5 text-cyan-700" />,
      description: 'Recently created client accounts.',
      content: (
        <div className="space-y-3">
          {getRecentAccounts().map((account, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{account.name}</p>
                <p className="text-xs text-gray-500">
                  {account.email}
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-600 rounded-full">
                {account.contactCount} contacts
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'recentContacts',
      title: 'Recent Contacts',
      icon: <Phone className="w-5 h-5 text-cyan-700" />,
      description: 'Recently created contacts.',
      content: (
        <div className="space-y-3">
          {getRecentContacts().map((contact, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{contact.firstName} {contact.lastName}</p>
                <p className="text-xs text-gray-500">
                  {contact.email}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {contact.account?.name || 'No account'}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'recentLocations',
      title: 'Recent Locations',
      icon: <Globe className="w-5 h-5 text-cyan-700" />,
      description: 'Recently created locations.',
      content: (
        <div className="space-y-3">
          {getRecentLocations().map((location, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{location.name}</p>
                <p className="text-xs text-gray-500">
                  {location.city}, {location.country}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {location.account?.name || 'No account'}
              </span>
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
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/catalog');
            }}
          >
            <Layers3 className="w-3 h-3" />
            <span>Catalog</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/category');
            }}
          >
            <FolderKanban className="w-3 h-3" />
            <span>Category</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/product-specification');
            }}
          >
            <FileText className="w-3 h-3" />
            <span>Spec</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/product-offering');
            }}
          >
            <PackageOpen className="w-3 h-3" />
            <span>Product</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/opportunity');
            }}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Opp</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/quote');
            }}
          >
            <Repeat className="w-3 h-3" />
            <span>Quotes</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/account');
            }}
          >
            <User className="w-3 h-3" />
            <span>Accounts</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/contact');
            }}
          >
            <User className="w-3 h-3" />
            <span>Contacts</span>
          </button>

          <button
            className="flex items-center justify-center gap-1 p-2 text-xs rounded-md bg-cyan-700 text-white font-medium shadow-sm
                       hover:bg-cyan-600 active:bg-cyan-800 transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/location');
            }}
          >
            <MapPin className="w-3 h-3" />
            <span>Locations</span>
          </button>
        </div>
      ),
    },
  ];

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    // Reset to main tab when switching between Dashboard and Client
    setActiveSubTab(tabKey);
  };

  const handleSubTabChange = (subTabKey) => {
    setActiveSubTab(subTabKey);
  };

  const renderContent = () => {
    switch (activeSubTab) {
      // Dashboard components
      case 'Dashboard': return <Dashboard />;
      case 'Category': return <Category />;
      case 'Catalog': return <Catalog />;
      case 'ProductOffering': return <ProductOffering />;
      case 'ProductSpecification': return <ProductSpecification />;
      case 'Quotes': return <Quotes />;
      case 'Opportunity': return <Opportunity />;
      
      // Client components
      case 'Client': return <Client />;
      case 'Account': return <Account />;
      case 'Contact': return <Contact />;
      case 'Location': return <Location />;
      
      default: return <Dashboard />;
    }
  };

  const currentTabData = TAB_DATA.find(tab => tab.key === activeTab);

  return (
    <div className="p-6 font-sans bg-gray-100 min-h-screen flex flex-col">

      {/* Info Cards */}
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

            {openCard === card.key && (
              <div className="mt-3 animate-fadeIn">
                {card.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex flex-col mb-6 bg-white rounded-lg shadow-md p-3 border border-cyan-400">
        {/* Primary Tabs */}
        <div className="flex mb-3">
          {TAB_DATA.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out mr-2
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

        {/* Secondary Tabs */}
        {currentTabData?.subTabs && (
          <div className="flex flex-wrap gap-2">
            {currentTabData.subTabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => handleSubTabChange(key)}
                className={`flex items-center justify-center gap-1 px-3 py-1 text-sm font-medium rounded-md transition-all duration-300 ease-in-out
                  ${activeSubTab === key
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-400/30'
                    : 'text-cyan-800 hover:bg-cyan-100 hover:text-cyan-900'
                  }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 mb-6"> {/* Added mb-6 for spacing before the new section */}
        {renderContent()}
      </div>
      
      {/* AI/ML Section - Added here as requested */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-blue-300">
          <h1 className="text-xl font-bold text-cyan-700 mb-4 flex items-center">
              <Lightbulb className="w-6 h-6 mr-2 text-blue-600" /> AI & Machine Learning Insights
          </h1>
          <AIML />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto"> {/* Changed mt-8 to mt-auto for sticky footer behavior */}
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
    </div>
  );
};

export default Home;
