import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";


function Layout() {

    return (
        <div className="app-layout">

            <Sidebar />

            <Navbar />

            <main className="app-main">
                <Outlet />
            </main>

        </div>
    );
}


export default Layout;