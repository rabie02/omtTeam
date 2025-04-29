import { Outlet } from "react-router-dom";
import Sidebar from "./dashbord/sidebar";
import Header from "./dashbord/header";

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
        </div>
    );
}

export default Dashboard;