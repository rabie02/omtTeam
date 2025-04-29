import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from "../../components/auth/RegisterForm";

function Register() {
    const navigate = useNavigate();

    const handleSignInRedirect = () => {
        navigate('/login');  // Redirect to the login page
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                            onClick={handleSignInRedirect}  // Use the navigate function for redirection
                            className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
                <RegisterForm />
            </div>
        </div>
    );
}

export default Register;
