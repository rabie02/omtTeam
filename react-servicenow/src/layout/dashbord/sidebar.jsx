import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const handleLogout = async (e) => {
    e.preventDefault();
    console.log('Logging out...');
  };

  const toggleExpand = (path) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const isActive = (path) => {
    return location.pathname.toLowerCase() === path.toLowerCase();
  };

  const isChildActive = (children) => {
    return children.some(child =>
      location.pathname.toLowerCase().startsWith(child.path.toLowerCase())
    );
  };


  const navItems = [
    { 
      path: '/dashboard', 
      icon: 'dashboard-line', 
      text: 'Dashboard' 
    },
    { 
      path: '/dashboard/product-offering', 
      icon: 'shopping-bag-line', 
      text: 'Product Offering', 
      children: [
        { path: '/dashboard/catalog', icon: 'book-open-line', text: 'Catalogs' },
        { path: '/dashboard/category', icon: 'folder-line', text: 'Categories' },
        { path: '/dashboard/product-offering', icon: 'shopping-bag-line', text: 'Product Offerings' }
      ] 
    },
    { 
      path: '/dashboard/product-specification', 
      icon: 'file-list-line', 
      text: 'Product Specification' 
    }
  ];

  return (
    <>
      <aside className="z-30 h-screen fixed bg-[#007B98] inset-y-0 pt-4 px-4 shadow-lg overflow-hidden w-64  flex flex-col">
        {/* Logo Section */}
        <div className="mb-8 mt-2 h-12 flex items-center px-2 text-white font-bold text-xl">
          <i className="ri-admin-line mr-2 text-blue-200" />
          Admin Studio
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const hasChildren = item.children?.length > 0;
              const isItemActive = isActive(item.path) || (hasChildren && isChildActive(item.children));
              const isExpanded = expandedItems[item.path];

              return (
                <li key={item.path}>
                  <div className="flex flex-col overflow-hidden rounded-lg">
                    <Link
                      to={item.path}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          toggleExpand(item.path);
                        }
                      }}
                      className={`flex items-center px-3 py-2.5 transition-all duration-200 ${
                        isItemActive 
                          ? 'bg-[#006080] text-white shadow-md' 
                          : 'text-white hover:bg-[#006080] hover:text-white'
                      }`}
                    >
                      <i className={`ri-${item.icon} mr-3 text-lg`} />
                      <span className="font-medium flex-1">{item.text}</span>
                      {hasChildren && (
                        <i className={`ri-arrow-right-s-line transition-transform duration-200 ${
                          isExpanded ? 'transform rotate-90' : ''
                        }`} />
                      )}
                    </Link>

                    {hasChildren && isExpanded && (
                      <ul className="ml-8 mt-1 space-y-1 py-1 animate-fadeIn">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={`flex items-center px-3 py-2 text-sm rounded transition-all duration-200 ${
                                isActive(child.path) 
                                  ? 'bg-[#e6f4ff] text-[#007B98] font-medium' 
                                  : 'text-white hover:bg-[#006080] hover:text-white'
                              }`}
                            >
                              <i className={`ri-${child.icon} mr-3 text-base`} />
                              <span>{child.text}</span>
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

        {/* Logout Section */}
        <div className="border-t border-[#006080] pt-2 pb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-white hover:bg-[#006080] transition-colors duration-200 group rounded-lg"
          >
            <i className="ri-logout-circle-r-line mr-3 text-lg group-hover:animate-pulse" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div className="ml-64" />
      
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #006080;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #004d66;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .group-hover\:animate-pulse:hover {
          animation: pulse 1s infinite;
        }
      `}</style>
    </>
  );
};

export default Sidebar;