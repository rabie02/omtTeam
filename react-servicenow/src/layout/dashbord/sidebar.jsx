import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Logo from '@assets/nbg-e-omt.svg';

const Sidebar = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const handleLogout = async (e) => {
    e.preventDefault();
    // Your logout logic
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

  return (
    <>
      <aside className="z-30 h-lvh fixed bg-white inset-y-0 py-4 px-4 shadow-md overflow-hidden w-[15rem] shadow-xl/30">
        {/* Logo */}
        <div className="mb-20 mt-3 h-4">
          <Link to="/" className="max-w-24">
            <img src={Logo} alt="Logo" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-180px)] overflow-y-auto ">
          <ul className="space-y-2">
            {[
              { path: '/dashboard', icon: 'dashboard', text: 'Dashboard' },
              { 
                path: '/dashboard/product-offering', 
                icon: 'shopping-bag', 
                text: 'Product Offering', 
                children: [
                  { path: '/dashboard/catalog', icon: 'book-open', text: 'Catalogs' },
                  { path: '/dashboard/category', icon: 'folder', text: 'Categories' },
                  { path: '/dashboard/product-offering', icon: 'shopping-bag', text: 'Product Offerings' }
                ] 
              },
              { path: '/dashboard/product-specification', icon: 'file-list', text: 'Product Specification' },
            ].map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isItemActive = isActive(item.path) || (hasChildren && isChildActive(item.children));
              const isExpanded = expandedItems[item.path];

              return (
                <li key={item.path}>
                  <div className="flex flex-col overflow-hidden">
                    <Link
                      to={item.path}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          toggleExpand(item.path);
                        }
                      }}
                      className={`flex items-center px-2 py-3  hover:bg-cyan-100 hover:text-cyan-600 ${
                        isItemActive ? 'bg-cyan-600 text-cyan-50' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <i className={`ri-${item.icon}-line mr-3 text-lg`} />
                      <span className="font-medium flex-1">{item.text}</span>
                      {hasChildren && (
                        <i className={`ri-arrow-right-s-line transition-transform ${
                          isExpanded ? 'transform rotate-90' : ''
                        }`} />
                      )}
                    </Link>

                    {hasChildren && isExpanded && (
                      <ul className="mt-1 space-y-1 translate-1 max-w-full " >
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={`flex items-center px-2 py-3  text-sm hover:bg-cyan-100 hover:text-cyan-600 ${
                                isActive(child.path) ? 'bg-cyan-600 text-cyan-50' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <i className={`ri-${child.icon}-line mr-3 text-lg`} />
                              <span className="font-medium">{child.text}</span>
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

        {/* Logout */}
        <div className=" group absolute bottom-0 left-0 right-0 border-t-2 border-cyan-600 py-2 pl-2 bg-white text-cyan-700 hover:bg-cyan-700 hover:text-white transition-all duration-150" >
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-2 cursor-pointer"
          >
            <i className="ri-shut-down-line mr-3 text-lg shake" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Main content spacer */}
      <div className="ml-60" />
    </>
  );
};

export default Sidebar;