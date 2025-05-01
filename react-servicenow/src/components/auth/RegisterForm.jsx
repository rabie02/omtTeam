// RegisterForm.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from "../../features/auth/authActions";
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    user_name: '',
    user_password: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile_phone: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [messageContent, setMessageContent] = useState({ text: '', type: '' });

  const validateForm = () => {
    const errors = {};
    if (!formData.user_name.trim()) errors.user_name = 'Username is required';
    if (formData.user_password.length < 6) errors.user_password = 'Password must be at least 6 characters';
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Valid email is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessageContent({ text: '', type: '' });
    
    if (!validateForm()) return;

    try {
      const result = await dispatch(registerUser(formData));
      
      if (registerUser.fulfilled.match(result)) {
        setMessageContent({
          text: 'A confirmation email has been sent. Please check your inbox to complete registration.',
          type: 'success'
        });
        
        setFormData({
          user_name: '',
          user_password: '',
          first_name: '',
          last_name: '',
          email: '',
          mobile_phone: ''
        });
        
        setTimeout(() => {
          navigate('/', { state: { successMessage: 'A confirmation email has been sent to your address. Please check your inbox to complete your registration.' } });
        }, 5000);
      } else if (registerUser.rejected.match(result)) {
        setMessageContent({
          text: result.payload || 'Registration failed',
          type: 'error'
        });
      }
    } catch (err) {
      setMessageContent({
        text: 'An unexpected error occurred during registration',
        type: 'error'
      });
      console.error('Registration error:', err);
    }
  };

  return (
    <form onSubmit={handleRegister} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md">
      {messageContent.text && (
        <div className={`p-3 rounded-md text-sm ${
          messageContent.type === 'error' 
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {messageContent.text}
        </div>
      )}

      {/* Rest of your form fields */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="user_name" className="block text-sm font-medium text-gray-700">
            Username *
          </label>
          <input
            type="text"
            id="user_name"
            name="user_name"
            className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${validationErrors.user_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            value={formData.user_name}
            onChange={handleChange}
            autoComplete="username"
          />
          {validationErrors.user_name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.user_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="user_password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            id="user_password"
            name="user_password"
            className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${validationErrors.user_password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            value={formData.user_password}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {validationErrors.user_password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.user_password}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${validationErrors.first_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              value={formData.first_name}
              onChange={handleChange}
              autoComplete="given-name"
            />
            {validationErrors.first_name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${validationErrors.last_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              value={formData.last_name}
              onChange={handleChange}
              autoComplete="family-name"
            />
            {validationErrors.last_name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="mobile_phone" className="block text-sm font-medium text-gray-700">
            Mobile Phone
          </label>
          <input
            type="tel"
            id="mobile_phone"
            name="mobile_phone"
            className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.mobile_phone}
            onChange={handleChange}
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Register'}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;