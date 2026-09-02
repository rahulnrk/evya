import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import Header from "./Header";


const Dashboard = () => {


  return (
    <div>
          <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 p-6 overflow-auto">
              <Outlet />
            </main>
            <Footer />
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
