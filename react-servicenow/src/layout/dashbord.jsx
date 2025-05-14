import { Outlet } from "react-router-dom";
import Sidebar from "./dashbord/sidebar";
import Header from "./dashbord/header";
import Chatbot from '../components/dashbord/spec/Chatbot'

function Dashboard() {
    return (
        <div className="dashboard-layout flex">
            <Sidebar />
            <div className="dashboard-content w-full">
                <Header />
                <div   className="bg-gray-100/50">
                    <Outlet />
                </div>

            </div>
            <div className="fixed bottom-8 right-8 z-50">
                    <Chatbot />
                  </div>
        </div>
    );
}

export default Dashboard;