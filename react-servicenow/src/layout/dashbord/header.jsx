import Avatarj from "@assets/sunday.jpg";
import { Badge, Dropdown, Space, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userLogout } from '../../features/auth/authActions';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
  
  const items = [
    {
      label: <Link to="/profile" className="text-md"><i className="ri-user-line mr-1"></i> Profile</Link>,
      key: 'profile',
    },
    {
      label: <Link to="/settings" className="text-md"><i className="ri-settings-3-line mr-1"></i> Settings</Link>,
      key: 'settings',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <div className="text-md" onClick={handleLogout}>
          <i className="ri-shut-down-line mr-1"></i> Logout
        </div>
      ),
      key: 'logout',
    },
  ];
  
  return (
    <header className="p-5 pb-2 sticky top-0 shadow-md flex justify-end bg-white">
      <div className="space-x-5 flex items-center">
        <div>
          <Badge count={5}>
            <i className="ri-notification-3-line text-3xl"></i>
          </Badge>
        </div>

        <Dropdown 
          menu={{ items }} 
          trigger={['click']}
          placement="bottomRight"
        >
          <a onClick={(e) => e.preventDefault()}>
            <Space align="center">
              <div className="h-10 w-10 flex justify-center items-center rounded-full bg-orange-100 overflow-hidden">
                <img src={Avatarj} alt="User avatar" className="h-full w-full object-cover" />
              </div>
            </Space>
          </a>
        </Dropdown>
      </div>
    </header>
  );
}

export default Header;