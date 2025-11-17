import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTours, getBookingsAdmin } from "../api";

import {
  LayoutDashboard,
  Plane,
  LogOut,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ tours: 0, bookings: 0, earnings: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const t = await getTours();
    if (t.success) stats.tours = t.tours.length;

    const b = await getBookingsAdmin(token);
    if (b.success) {
      stats.bookings = b.bookings.length;
      stats.earnings = b.bookings.reduce((sum, i) => sum + i.totalAmount, 0);
      setRecentBookings(b.bookings.slice(0, 6));
    }

    setStats({ ...stats });
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Collapsible Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-[#111] text-white px-4 py-8 space-y-6 shadow-2xl transition-all duration-300 relative`}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 bg-red-500 text-white p-1 rounded-full shadow cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Title */}
        {!collapsed && (
          <h2 className="text-2xl font-bold tracking-wider mb-8 text-center">
            ⚜ Admin Panel
          </h2>
        )}

        {/* Menu */}
        <nav className="space-y-3 text-lg mt-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className={`flex items-center gap-3 hover:bg-[#222] w-full px-4 py-2 rounded-md transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LayoutDashboard size={22} />
            {!collapsed && "Dashboard"}
          </button>

          <button
            onClick={() => navigate("/admin/tours")}
            className={`flex items-center gap-3 hover:bg-[#222] w-full px-4 py-2 rounded-md transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Plane size={22} />
            {!collapsed && "Manage Tours"}
          </button>

          <button
            onClick={() => navigate("/admin/tours/new")}
            className={`flex items-center gap-3 hover:bg-[#222] w-full px-4 py-2 rounded-md transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Ticket size={22} />
            {!collapsed && "Add New Tour"}
          </button>
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-semibold transition ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={22} />
          {!collapsed && "Logout"}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-10">
          Dashboard Overview
        </h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white shadow-lg p-6 rounded-xl border-l-8 border-red-500">
            <p className="text-gray-500">Total Tours</p>
            <h2 className="text-4xl font-bold text-gray-900">{stats.tours}</h2>
          </div>

          <div className="bg-white shadow-lg p-6 rounded-xl border-l-8 border-blue-500">
            <p className="text-gray-500">Total Bookings</p>
            <h2 className="text-4xl font-bold text-gray-900">
              {stats.bookings}
            </h2>
          </div>

          <div className="bg-white shadow-lg p-6 rounded-xl border-l-8 border-green-500">
            <p className="text-gray-500">Total Earnings</p>
            <h2 className="text-4xl font-bold text-gray-900">
              ₹{stats.earnings.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Recent Bookings */}
        <h2 className="text-2xl font-semibold mb-4">Recent Bookings</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="p-3">User</th>
                <th className="p-3">Tour</th>
                <th className="p-3">Seats</th>
                <th className="p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length > 0 ? (
                recentBookings.map((b) => (
                  <tr key={b._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{b.userName}</td>
                    <td className="p-3">{b.tour?.name}</td>
                    <td className="p-3">{b.seatsBooked}</td>
                    <td className="p-3 text-red-600 font-semibold">
                      ₹{b.totalAmount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-gray-500 text-center">
                    No recent bookings
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
