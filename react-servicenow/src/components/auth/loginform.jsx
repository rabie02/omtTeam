import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { userLogin, fetchUserInfo } from '../../features/auth/authActions';
import { message } from 'antd';

const MESSAGE_MAPPINGS = {
  missing_token: 'Invalid confirmation link',
  invalid_or_expired_token: 'Invalid or expired confirmation link',
  token_expired: 'Confirmation link has expired',
  user_exists: 'User already exists',
  timeout: 'Request timeout',
  auth_failed: 'Authentication failed',
  invalid_data: 'Invalid registration data',
  unknown_error: 'An unexpected error occurred',
  registration_confirmed: 'Registration confirmed successfully! You can now log in.',
  default_success: 'Action completed successfully'
};

// Yup validation schema
const validationSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required')
});

function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const result = await dispatch(userLogin(values));

        if (userLogin.fulfilled.match(result)) {
          const token = result.payload?.id_token;
          if (token) {
            localStorage.setItem('access_token', `Bearer ${token}`);
            await dispatch(fetchUserInfo());
            message.success('Login successful');
            navigate('/dashboard');
          } else {
            message.error('Login successful but no token received');
          }
        } else {
          const errorPayload = result.payload;
          const errorMessage = typeof errorPayload === 'object'
            ? errorPayload.message || MESSAGE_MAPPINGS[errorPayload.type] || MESSAGE_MAPPINGS.unknown_error
            : errorPayload || MESSAGE_MAPPINGS.unknown_error;

          message.error(errorMessage);
        }
      } catch (error) {
        console.error('Login error:', error);
        message.error(MESSAGE_MAPPINGS.unknown_error);
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={formik.handleSubmit} className="mb-4 space-y-5">

        {/* Username Field */}
        <div>
          <div className="shadow-lg flex gap-2 items-center bg-white p-2  rounded group duration-300">
            <i className="ri-user-2-line group-hover:rotate-[360deg] duration-300"></i>
            <input
              type="text"
              name="username"
              placeholder="Username"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
              className="flex-1 focus:outline-none"
              autoComplete="username"
            />
          </div>
          {formik.touched.username && formik.errors.username && (
            <p className="text-red-500 text-sm ml-1">{formik.errors.username}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="shadow-lg flex gap-2 items-center bg-white p-2  rounded group duration-300">
            <i className="ri-lock-2-line group-hover:rotate-[360deg] duration-300"></i>
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              className="flex-1 focus:outline-none"
              autoComplete="current-password"
            />
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500 text-sm ml-1">{formik.errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formik.isSubmitting}
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-300 ${formik.isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>


    </div>
  );
}

export default LoginForm;
