import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import { userLogout } from '../../features/auth/authActions';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get user data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
      setCurrentUser(userData);
    }
  }, []);

  const adminUser = {
    name: currentUser?.name || user?.name || 'Admin User',
    email: currentUser?.email || user?.email || 'admin@company.com',
    role: currentUser?.role || user?.role || 'System Administrator',
    lastLogin: currentUser?.lastLogin || user?.lastLogin || new Date().toLocaleString()
  };

  // Admin-specific notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Security Alert',
      message: 'Unauthorized login attempt detected',
      time: '1 hour ago',
      read: false,
      icon: 'ri-shield-keyhole-line'
    },
    {
      id: 2,
      title: 'System Update',
      message: 'New system update available for installation',
      time: '3 hours ago',
      read: false,
      icon: 'ri-system-update-line'
    },
    {
      id: 3,
      title: 'New User Request',
      message: '5 pending user registration requests',
      time: '1 day ago',
      read: true,
      icon: 'ri-user-add-line'
    },
    {
      id: 4,
      title: 'Backup Completed',
      message: 'Nightly database backup completed successfully',
      time: '2 days ago',
      read: true,
      icon: 'ri-database-2-line'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      // Perform comprehensive client-side cleanup first
      const cleanupClientStorage = () => {
        // Clear all localStorage items
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
        
        // Clear service worker cache (if used)
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      };

      // Execute cleanup
      cleanupClientStorage();
      
      // Dispatch Redux logout action
      const result = await dispatch(userLogout());
      
      if (userLogout.fulfilled.match(result)) {
        message.success('Logged out successfully');
      }
      
      // Redirect to login page
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Logged out locally (API failed)');
      navigate('/login', { replace: true });
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, read: true} : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
  };

  const quickAccessItems = [
    { label: 'Dashboard', path: '/dashboard' },
    // { label: 'Users', path: '/admin/users' },
    // { label: 'System', path: '/admin/system' },
    // { label: 'Reports', path: '/admin/reports' },
    // { label: 'Logs', path: '/admin/logs' }
  ];

  return (
    <header className="sticky top-0 z-50  bg-cyan-700">
      {/* Top Bar */}
      <div className="bg-[#006080] text-blue-100 px-6 py-2 text-sm flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-medium flex items-center">
            <i className="ri-shield-keyhole-line mr-2 text-blue-200" />
            Admin Console
          </span>
          <span className="w-px h-5 bg-blue-200/30"></span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span>Production</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Last login: {adminUser.lastLogin}</span>
          <span className="w-px h-5 bg-blue-200/30"></span>
          <button 
            onClick={handleLogout}
            className="hover:text-blue-200 transition-colors flex items-center"
          >
            <i className="ri-logout-circle-r-line mr-1" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="px-6 py-3 flex items-center justify-between bg-cyan-700">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-[#006080] flex items-center justify-center text-white mr-3">
              <i className="ri-admin-line text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Portal</h1>
              <p className="text-xs text-blue-200">System Management</p>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {quickAccessItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className="text-white hover:text-blue-200 font-medium transition-colors relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-6">
          {/* Search Bar */}
          <div className="hidden md:block w-64">
            
          </div>

          {/* Notification Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 rounded-full hover:bg-[#006080] text-blue-100 hover:text-white transition-colors relative"
            >
              <i className="ri-notification-3-line text-xl"></i>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#007B98] rounded-lg shadow-xl border border-[#006080] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#006080] bg-[#006080] flex justify-between items-center">
                  <h3 className="font-medium text-white">Admin Notifications</h3>
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-200 hover:text-white"
                  >
                    Mark all as read
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`px-4 py-3 border-b border-[#006080] hover:bg-[#006080] transition-colors cursor-pointer ${
                          !notification.read ? 'bg-[#006080]' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start">
                          <div className={`p-2 rounded-full mr-3 ${
                            !notification.read ? 'bg-blue-300/20 text-blue-200' : 'bg-blue-100/10 text-blue-100'
                          }`}>
                            <i className={`${notification.icon} text-lg`}></i>
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              !notification.read ? 'text-white' : 'text-blue-100'
                            }`}>{notification.title}</h4>
                            <p className="text-sm text-blue-200">{notification.message}</p>
                            <p className="text-xs text-blue-200/70 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-200 ml-2 mt-1.5"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <i className="ri-notification-off-line text-3xl text-blue-200/50 mb-2"></i>
                      <p className="text-blue-200/70">No notifications</p>
                    </div>
                  )}
                </div>

                <div className="px-4 py-2 border-t border-[#006080] bg-[#006080] text-center">
                  <Link 
                    to="/admin/notifications" 
                    className="text-sm text-blue-200 hover:text-white inline-block"
                    onClick={() => setNotificationOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 group relative cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-[#006080] flex items-center justify-center text-white font-medium shadow-sm">
              {adminUser.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="font-medium text-white group-hover:text-blue-200 transition-colors">
                {adminUser.name}
              </p>
              <p className="text-xs text-blue-200">{adminUser.role}</p>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#007B98] rounded-md shadow-lg py-1 z-50 hidden group-hover:block border border-[#006080]">
              <div className="px-4 py-3 border-b border-[#006080] bg-[#006080]">
                <p className="font-medium text-white">Admin Account</p>
                <p className="text-sm text-blue-200 truncate">{adminUser.email}</p>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-blue-300">System Access</span>
                  <span className="text-blue-300">Full Privileges</span>
                </div>
              </div>
              <Link to="/admin/profile" className="block px-4 py-2.5 text-white hover:bg-[#006080] hover:text-blue-200 transition-colors">
                <i className="ri-user-settings-line mr-2" /> My Profile
              </Link>
              <Link to="/admin/settings" className="block px-4 py-2.5 text-white hover:bg-[#006080] hover:text-blue-200 transition-colors">
                <i className="ri-shield-user-line mr-2" /> Admin Settings
              </Link>
              <div className="border-t border-[#006080]"></div>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2.5 text-white hover:bg-[#006080] hover:text-red-400 transition-colors"
              >
                <i className="ri-logout-circle-r-line mr-2" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;