// Sidebar.jsx
import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { Tooltip } from 'antd';

const Sidebar = ({ toggleSidebar, open, isSidebarCollapsed }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (path) => {
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const isActive = (path) => location.pathname.toLowerCase() === path.toLowerCase();

  const isChildActive = (children) => children.some(child =>
    location.pathname.toLowerCase().startsWith(child.path.toLowerCase())
  );

  const navItems = [
    {
      path: '/dashboard',
      icon: 'dashboard-line',
      text: 'Dashboard'
    },
    {
      path: '/dashboard/product',
      icon: 'shopping-bag-line',
      text: 'Product',
      children: [
        { path: '/dashboard/catalog', icon: 'book-open-line', text: 'Catalogs' },
        { path: '/dashboard/category', icon: 'folder-line', text: 'Categories' },
        { path: '/dashboard/product-specification', icon: 'file-list-line', text: 'Product Specification' },
        { path: '/dashboard/product-offering', icon: 'shopping-bag-line', text: 'Product Offerings' },

      ]
    },
    {
      path: '/dashboard/oreder',
      icon: 'shopping-cart-line',
      text: 'Order',
      children: [
        { path: '/dashboard/opportunity', icon: 'shining-line', text: 'Opportunity' },
        { path: '/dashboard/price-list', icon: 'price-tag-3-line', text: 'Price List' },
        { path: '/dashboard/quote', icon: 'contract-line', text: 'Quote' }
      ]
    },
    {
      path: '/dashboard/account',
      icon: 'info-card-line',
      text: 'Client',
      children: [
        { path: '/dashboard/account', icon: 'account-circle-line', text: 'Accounts' },
        { path: '/dashboard/contact', icon: 'contacts-book-line', text: 'Contacts' },
        { path: '/dashboard/location', icon: 'map-pin-line', text: 'Locations' },
      ]
    }
  ];

  return (
    <>
      <aside className={`z-50 h-screen fixed bg-cyan-800 inset-y-0 pt-4  shadow-lg overflow-hidden ${open ? 'w-[4rem]' : 'w-64'
        } transition-all duration-400 flex flex-col`}
      >
        <div className="mb-8 mt-2 h-12 flex justify-center items-center px-2 text-white font-bold text-xl truncate">
          <i className={`ri-admin-line  text-blue-200 ${open ? '' : 'mr-2'}  `} />
          <span className={`${open ? 'hidden ' : 'inline'}`}>
            Admin Studio
          </span>
        </div>

        <nav className={`flex-1 overflow-y-auto custom-scrollbar ${open ? 'px-2' : 'px-4'}`}>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const hasChildren = item.children?.length > 0;
              const isItemActive = isActive(item.path) || (hasChildren && isChildActive(item.children));
              const isExpanded = expandedItems[item.path];

              return (
                <li key={item.path}>
                  {/* Removed overflow-hidden from this div */}
                  <div className="flex flex-col rounded-lg">
                    <Link
                      to={item.path}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          toggleExpand(item.path);
                        }
                      }}
                      className={`flex items-center px-3 py-2.5 transition-all duration-200 ${isItemActive
                        ? 'bg-cyan-700 text-white shadow-md'
                        : 'text-white hover:bg-cyan-700 hover:text-white'
                        }`}
                    >
                      <i className={`ri-${item.icon} text-2xl ${open ? '' : 'mr-3'}`} />
                      <span className={`font-medium flex-1 ${open ? 'hidden ' : 'inline'
                        }`}>
                        {item.text}
                      </span>
                      {hasChildren && (
                        <i className={`ri-arrow-right-s-line transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''
                          } ${open ? 'hidden ' : 'inline'}`} />
                      )}
                    </Link>

                    {hasChildren && isExpanded && !open && (
                      <ul className="ml-8 mt-1 space-y-1 py-1 animate-fadeIn">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={`flex items-center px-3 py-2 text-sm rounded transition-all duration-200 ${isActive(child.path)
                                ? 'bg-[#e6f4ff] text-[#007B98] font-medium'
                                : 'text-white hover:bg-cyan-700 hover:text-white'
                                }`}
                            >
                              <i className={`ri-${child.icon} mr-3 text-base`} />
                              <span className={`${open ? 'hidden ' : 'inline'}`}>
                                {child.text}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex justify-center items-center   ">
          <Tooltip title={!isSidebarCollapsed ? "open" : "close"}>
            <button
              onClick={toggleSidebar}
              className="text-white py-4 bg-cyan-700 w-full"
            >
              <i className={`ri-${!isSidebarCollapsed ? 'arrow-right-s-line' : 'arrow-left-s-line'} text-2xl `} />
            </button>
          </Tooltip>
        </div>
      </aside>

      <div className={`transition-all duration-400  ${open ? 'ml-15' : 'ml-64'}`} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #006080;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Sidebar;