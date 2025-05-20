import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { userLogin } from '../../features/auth/authActions';
import { message } from 'antd';

const MESSAGE_MAPPINGS = {
  // Error messages
  missing_token: 'Invalid confirmation link',
  invalid_or_expired_token: 'Invalid or expired confirmation link',
  token_expired: 'Confirmation link has expired',
  user_exists: 'User already exists',
  timeout: 'Request timeout',
  auth_failed: 'Authentication failed',
  invalid_data: 'Invalid registration data',
  unknown_error: 'An unexpected error occurred',
  
  // Success messages
  registration_confirmed: 'Registration confirmed successfully! You can now log in.',
  default_success: 'Action completed successfully'
};

function LoginForm() {
  // Initialize with empty strings - no default credentials
  const [formData, setFormData] = useState({ 
    username: '',
    password: '' 
  });
  
  const [messageContent, setMessageContent] = useState({ text: '', type: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessageContent({ text: '', type: '' });

    if (!formData.username.trim() || !formData.password.trim()) {
      setMessageContent({
        text: 'Please enter both username and password',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await dispatch(userLogin(formData));

      if (userLogin.fulfilled.match(result)) {
        const token = result.payload?.id_token;
        if (token) {
          localStorage.setItem('access_token', `Bearer ${token}`);
          message.success('Login successful');
          navigate('/dashboard');
        } else {
          message.error('Login successful but no token received');
        }
      } else if (userLogin.rejected.match(result)) {
        const errorPayload = result.payload;
        const errorMessage = typeof errorPayload === 'object' 
          ? errorPayload.message || MESSAGE_MAPPINGS[errorPayload.type] || MESSAGE_MAPPINGS.unknown_error
          : errorPayload || MESSAGE_MAPPINGS.unknown_error;
        
        setMessageContent({
          text: errorMessage,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessageContent({
        text: MESSAGE_MAPPINGS.unknown_error,
        type: 'error'
      });
    } finally {
      setLoading(false); // This ensures loading is always reset
    }
  };

  
  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="mb-4">
        {/* Message display */}
        {messageContent.text && (
        <div className={`mb-4 p-3 rounded-md ${
          messageContent.type === 'success' 
            ? 'bg-green-100 text-green-800'
            : messageContent.type === 'error'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {messageContent.text}
        </div>
        )}

        {/* Username field */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-600 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            autoComplete="new-username"
          />
        </div>

        {/* Password field */}
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-600 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            autoComplete="new-password"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 cursor-pointer hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Sign up link */}
      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-500 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default LoginForm;