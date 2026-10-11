import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppContent, AppSidebar, AppHeader } from "../components/index";

const DefaultLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const isFullWidthPage = location.pathname.includes("/job-ledger");

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col w-0">
        <AppHeader toggleSidebar={toggleSidebar} />

        <main className={`flex-1 ${isFullWidthPage ? 'overflow-hidden p-0' : 'overflow-y-auto px-2'} bg-gray-100 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent`}>
          <AppContent />
        </main>

      </div>
    </div>
  );
};

export default DefaultLayout;
