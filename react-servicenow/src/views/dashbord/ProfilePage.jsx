import { useSelector } from 'react-redux';

const ProfilePage = () => {
  const { userInfo } = useSelector(state => state.auth);

  // Redirect if not logged in


  if (!userInfo) {
    return <div className="w-full h-screen flex items-center justify-center">Loading profile...</div>;
  }

  // Format user data with fallbacks specific to ServiceNow response
  const getUserData = () => {
    // Default ServiceNow user object structure
    return {
      name: userInfo.name || 'Admin User',
      email: userInfo.email || userInfo.user_email || 'admin@company.com',
      firstName: userInfo.first_name || userInfo.name?.split(' ')[0] || 'Admin',
      lastName: userInfo.last_name || userInfo.name?.split(' ').slice(1).join(' ') || 'User',
      role: userInfo.title || userInfo.role || 'System Administrator',
      location: userInfo.location || `${userInfo.city || ''}${userInfo.city && userInfo.country ? ', ' : ''}${userInfo.country || ''}` || 'Location not specified',
      phone: userInfo.phone || userInfo.mobile_phone || 'Phone not specified',
      lastLogin: userInfo.last_login_time ? new Date(userInfo.last_login_time).toLocaleString() : 'Not available',
      avatar: userInfo.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || 'Admin')}&background=006080&color=fff`,
      active: userInfo.active || 'not specified',
      manager: userInfo.manager?.display_value || userInfo.manager || 'Not specified',
      username: userInfo.user_name || 'N/A'
    };
  };

  const userData = getUserData();

  return (
    <section className="w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col">
        {/* Cover Image */}
        <div className="w-full xl:h-[10rem] lg:h-[18rem] md:h-[16rem] sm:h-[14rem] h-[11rem] bg-gradient-to-b from-cyan-700  from-10% to-cyan-700/40  to-90%  to-white">
        </div>

        {/* Profile Header */}
        <div className="sm:w-[80%] w-[90%] mx-auto flex flex-col sm:flex-row">
          <div className="flex items-start">
            <img 
              src={userData.avatar} 
              alt="User Profile"
              className="rounded-md lg:w-[12rem] lg:h-[12rem] md:w-[10rem] md:h-[10rem] sm:w-[8rem] sm:h-[8rem] w-[7rem] h-[7rem] border-4 border-white dark:border-gray-800 shadow-md relative lg:bottom-[5rem] sm:bottom-[4rem] bottom-[3rem] object-cover"
            />
            
            <div className="sm:ml-4 pl-4 sm:mt-0 mt-4 lg:-mt-0">
              <h1 className="text-gray-800 dark:text-white lg:text-4xl md:text-3xl sm:text-3xl text-xl font-bold">
                {userData.name}
              </h1>
              <p className="text-blue-600 dark:text-blue-400 mt-1">{userData.role}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                <i className="ri-login-circle-line mr-1"></i> Last login: {userData.lastLogin}
              </p>
            </div>
          </div>
        </div>

        <div className="xl:w-[80%] lg:w-[90%] md:w-[90%] sm:w-[92%] w-[90%] mx-auto flex flex-col gap-4 items-center relative lg:-top-8 md:-top-6 -top-4">
          {/* User Details */}
          <div className="w-full my-auto py-6 flex flex-col justify-center gap-2">
            <div className="w-full flex sm:flex-row flex-col gap-6 justify-center">
              {/* Personal Info Column */}
              <div className="w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Personal Information
                  </h2>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">First Name</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">{userData.firstName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Last Name</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">{userData.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">{userData.email}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">{userData.phone}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* System Info Column */}
              <div className="w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    System Information
                  </h2>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Username</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{userData.username}</code>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Active</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">{userData.active}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Manager</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">{userData.manager}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                      <dd className="text-lg font-medium text-gray-800 dark:text-white mt-1">{userData.location}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            {/* <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => navigate('/profile/edit')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="ri-edit-line mr-2"></i> Edit Profile
              </button>
              <button
                onClick={() => navigate('/change-password')}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="ri-lock-password-line mr-2"></i> Change Password
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;