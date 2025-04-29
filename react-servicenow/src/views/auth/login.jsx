// Login.js
import LoginForm from "../../components/auth/loginform";
import { Link } from "react-router-dom";
import Logo from '@assets/nbg-e-omt.png';

function Login() {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="relative py-3 sm:max-w-xs sm:mx-auto">
        <div className="min-h-96 px-8 py-6 mt-4 text-left bg-white rounded-xl shadow-lg">
          <div className="flex flex-col justify-center items-center h-full select-none">
            <div className="flex flex-col items-center justify-center gap-2 mb-8">
            <img 
              src={Logo} 
              className="w-[100px] h-[100px] object-contain" // Exact dimensions with proper fitting
              alt="Logo" 
            />  
              <p className="m-0 text-[16px] font-semibold">Login to your Account</p>
              <span className="m-0 text-xs max-w-[90%] text-center text-[#8B8E98]">
                Get started with our app, just sign in and enjoy the experience.
              </span>
            </div>
            
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
