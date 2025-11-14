// src/components/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar fixe */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
