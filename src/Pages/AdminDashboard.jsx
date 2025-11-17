// // import React from 'react';
// // import { useNavigate } from 'react-router-dom';

// // const AdminDashboard = () => {
// //   const navigate = useNavigate();

// //   return (
// //     <div className="min-h-screen bg-gray-100 bg-gradient-to-b from-orange-400 via-white to-green-500">
// //       <div className="flex">
// //         {/* Sidebar */}
// //         <div className="w-64 bg-orange-600 text-white min-h-screen p-4">
// //           <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
// //           <ul className="space-y-4">
// //             <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Dashboard</a></li>
// //             <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Manage Travel Plans</a></li>
// //             <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">User Management</a></li>
// //             <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Religious Sites</a></li>
// //             <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Reports</a></li>
// //             <li>
// //               <button
// //                 onClick={() => navigate('/login')}
// //                 className="block py-2 px-4 rounded hover:bg-orange-700 w-full text-left"
// //               >
// //                 Logout
// //               </button>
// //             </li>
// //           </ul>
// //         </div>

// //         {/* Main Content */}
// //         <div className="flex-1 p-6">
// //           <h1 className="text-3xl font-bold text-gray-800 mb-6">India Pilgrimage Travel - Admin Dashboard</h1>

// //           {/* Stats Cards */}
// //           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
// //             <div className="bg-white p-4 rounded-lg shadow">
// //               <h3 className="text-lg font-semibold text-orange-600">Total Users</h3>
// //               <p className="text-2xl font-bold">1,250</p>
// //             </div>
// //             <div className="bg-white p-4 rounded-lg shadow">
// //               <h3 className="text-lg font-semibold text-green-600">Active Plans</h3>
// //               <p className="text-2xl font-bold">450</p>
// //             </div>
// //             <div className="bg-white p-4 rounded-lg shadow">
// //               <h3 className="text-lg font-semibold text-blue-600">Sites Listed</h3>
// //               <p className="text-2xl font-bold">75</p>
// //             </div>
// //             <div className="bg-white p-4 rounded-lg shadow">
// //               <h3 className="text-lg font-semibold text-purple-600">Revenue</h3>
// //               <p className="text-2xl font-bold">₹2.5L</p>
// //             </div>
// //           </div>

// //           {/* Table */}
// //           <div className="bg-white p-4 rounded-lg shadow">
// //             <h2 className="text-xl font-bold mb-4">Recent Travel Plans</h2>
// //             <table className="w-full table-auto">
// //               <thead>
// //                 <tr className="bg-gray-200">
// //                   <th className="px-4 py-2 text-left">Plan ID</th>
// //                   <th className="px-4 py-2 text-left">Destination</th>
// //                   <th className="px-4 py-2 text-left">User</th>
// //                   <th className="px-4 py-2 text-left">Status</th>
// //                   <th className="px-4 py-2 text-left">Actions</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 <tr>
// //                   <td className="px-4 py-2">001</td>
// //                   <td className="px-4 py-2">Tirupati Temple</td>
// //                   <td className="px-4 py-2">Ram Sharma</td>
// //                   <td className="px-4 py-2">
// //                     <span className="bg-green-200 text-green-800 px-2 py-1 rounded">Active</span>
// //                   </td>
// //                   <td className="px-4 py-2">
// //                     <button className="text-blue-500 hover:underline mr-2">Edit</button>
// //                     <button className="text-red-500 hover:underline">Delete</button>
// //                   </td>
// //                 </tr>
// //                 <tr>
// //                   <td className="px-4 py-2">002</td>
// //                   <td className="px-4 py-2">Golden Temple</td>
// //                   <td className="px-4 py-2">Priya Singh</td>
// //                   <td className="px-4 py-2">
// //                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Pending</span>
// //                   </td>
// //                   <td className="px-4 py-2">
// //                     <button className="text-blue-500 hover:underline mr-2">Edit</button>
// //                     <button className="text-red-500 hover:underline">Delete</button>
// //                   </td>
// //                 </tr>
// //                 {/* Add more rows dynamically if needed */}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default AdminDashboard;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getTours, getBookingsAdmin } from "../api"; // API imports
// import admintour from './AdminTours';

// const AdminDashboard = () => {
//   const [stats, setStats] = useState({
//     tours: 0,
//     bookings: 0,
//     earnings: 0,
//   });
//   const [recentBookings, setRecentBookings] = useState([]);

//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     // get Tours
//     const t = await getTours();
//     if (t.success) stats.tours = t.tours.length;

//     // get Bookings
//     const b = await getBookingsAdmin(token);
//     if (b.success) {
//       stats.bookings = b.bookings.length;
//       stats.earnings = b.bookings.reduce((sum, i) => sum + i.totalAmount, 0);
//       setRecentBookings(b.bookings.slice(0, 5)); // only latest 5
//     }

//     setStats({ ...stats });
//   };

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen flex bg-gray-100">
//       {/* Sidebar */}
//       <aside className="w-64 bg-black text-white p-6 space-y-6">
//         <h2 className="text-2xl font-bold">Admin Panel</h2>
//         <nav className="space-y-3 text-lg">
//           <button onClick={() => navigate("/admin/dashboard")} className="block hover:text-orange-400">
//             Dashboard
//           </button>
//           <button onClick={() => navigate("/admin/tours")} className="block hover:text-orange-400">
//             Manage Tours
//           </button>
//           <button onClick={() => navigate("/TourDetail")} className="block hover:text-orange-400">
//             Bookings
//           </button>
//           <button onClick={() => navigate("/SearchFilter")} className="block hover:text-orange-400">
//             Users
//           </button>
//         </nav>
//         <button
//           onClick={handleLogout}
//           className="w-full bg-orange-500 py-2 rounded hover:bg-orange-600 font-semibold"
//         >
//           Logout
//         </button>
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

//         {/* Stats Cards */}
//         <div className="grid md:grid-cols-3 gap-6 mb-10">
//           <div className="bg-white shadow-md p-6 rounded-lg">
//             <p className="text-gray-600">Total Tours</p>
//             <h2 className="text-4xl font-bold text-orange-500">{stats.tours}</h2>
//           </div>
//           <div className="bg-white shadow-md p-6 rounded-lg">
//             <p className="text-gray-600">Total Bookings</p>
//             <h2 className="text-4xl font-bold text-orange-500">{stats.bookings}</h2>
//           </div>
//           <div className="bg-white shadow-md p-6 rounded-lg">
//             <p className="text-gray-600">Total Earnings</p>
//             <h2 className="text-4xl font-bold text-orange-500">₹{stats.earnings}</h2>
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <h2 className="text-2xl font-semibold mb-3">Quick Actions</h2>
//         <div className="flex flex-wrap gap-4 mb-10">
//           <button
//             onClick={() => navigate("/admin/tours/new")}
//             className="px-4 py-2 bg-black text-white rounded-md hover:bg-orange-500"
//           >
//             ➕ Add New Tour
//           </button>
//           <button
//             onClick={() => navigate("/EditTour")}
//             className="px-4 py-2 bg-black text-white rounded-md hover:bg-orange-500"
//           >
//             🛠 Manage Tours
//           </button>
//           <button
//             onClick={() => navigate("/TourDetail")}
//             className="px-4 py-2 bg-black text-white rounded-md hover:bg-orange-500"
//           >
//             📖 All Bookings
//           </button>
//         </div>

//         {/* Recent Bookings */}
//         <h2 className="text-2xl font-semibold mb-3">Recent Bookings</h2>
//         <div className="bg-white rounded shadow-md overflow-hidden">
//           <table className="w-full text-left">
//             <thead>
//               <tr className="bg-gray-200">
//                 <th className="p-3">User</th>
//                 <th className="p-3">Tour</th>
//                 <th className="p-3">Seats</th>
//                 <th className="p-3">Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentBookings.length > 0 ? (
//                 recentBookings.map((b) => (
//                   <tr key={b._id} className="border-b hover:bg-gray-50">
//                     <td className="p-3">{b.userName}</td>
//                     <td className="p-3">{b.tour?.title}</td>
//                     <td className="p-3">{b.seatsBooked}</td>
//                     <td className="p-3 text-orange-500">₹{b.totalAmount}</td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td className="p-3" colSpan={4}>
//                     No recent bookings
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default AdminDashboard;

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
