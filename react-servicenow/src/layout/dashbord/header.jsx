import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import { userLogout, fetchUserInfo } from '../../features/auth/authActions';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector(state => state.auth);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user info on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token && !userInfo) {
          await dispatch(fetchUserInfo());
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [dispatch, userInfo]);

  // Get user data from Redux or localStorage
  const currentUser = userInfo || JSON.parse(localStorage.getItem('currentUser')) || {
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'System Administrator',
    lastLogin: new Date().toLocaleString()
  };

  // Admin notifications
  useEffect(() => {
    // Simulate fetching notifications
    const fetchNotifications = async () => {
      // In a real app, you would fetch these from an API
      const demoNotifications = [
        {
          id: 1,
          title: 'Security Alert',
          message: 'Unauthorized login attempt detected',
          time: '1 hour ago',
          read: false,
          icon: 'ri-shield-keyhole-line'
        },
        // ... other notifications
      ];
      setNotifications(demoNotifications);
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await dispatch(userLogout());
      localStorage.removeItem('access_token');
      localStorage.removeItem('currentUser');
      message.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      message.error('Logout failed');
      console.error('Logout error:', error);
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
    // ... other menu items
  ];

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-cyan-700 h-20">
        {/* Loading skeleton */}
        <div className="animate-pulse h-full w-full"></div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-cyan-700">
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
          <span>Last login: {currentUser.lastLogin}</span>
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
                {/* Notification dropdown content */}
                {/* ... (same as your existing notification dropdown) ... */}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 group relative cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-[#006080] flex items-center justify-center text-white font-medium shadow-sm">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-white">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-blue-200">{currentUser.role}</p>
            </div>

            {/* Profile Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#007B98] rounded-md shadow-lg py-1 z-50 hidden group-hover:block border border-[#006080]">
              <div className="px-4 py-3 border-b border-[#006080] bg-[#006080]">
                <p className="font-medium text-white">{currentUser.name}</p>
                <p className="text-sm text-blue-200 truncate">{currentUser.email}</p>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-blue-300">System Access</span>
                  <span className="text-blue-300">Full Privileges</span>
                </div>
              </div>
              <Link 
                to="/profile" 
                className="block px-4 py-2.5 text-white hover:bg-[#006080] hover:text-blue-200 transition-colors"
              >
                <i className="ri-user-settings-line mr-2" /> My Profile
              </Link>
              <Link 
                to="/settings" 
                className="block px-4 py-2.5 text-white hover:bg-[#006080] hover:text-blue-200 transition-colors"
              >
                <i className="ri-shield-user-line mr-2" /> Settings
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