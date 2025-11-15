import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 bg-gradient-to-b from-orange-400 via-white to-green-500">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-orange-600 text-white min-h-screen p-4">
          <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
          <ul className="space-y-4">
            <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Dashboard</a></li>
            <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Manage Travel Plans</a></li>
            <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">User Management</a></li>
            <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Religious Sites</a></li>
            <li><a href="#" className="block py-2 px-4 rounded hover:bg-orange-700">Reports</a></li>
            <li>
              <button
                onClick={() => navigate('/login')}
                className="block py-2 px-4 rounded hover:bg-orange-700 w-full text-left"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">India Pilgrimage Travel - Admin Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-orange-600">Total Users</h3>
              <p className="text-2xl font-bold">1,250</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-green-600">Active Plans</h3>
              <p className="text-2xl font-bold">450</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-blue-600">Sites Listed</h3>
              <p className="text-2xl font-bold">75</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-purple-600">Revenue</h3>
              <p className="text-2xl font-bold">₹2.5L</p>
            </div>
          </div>
          
          {/* Table */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Recent Travel Plans</h2>
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Plan ID</th>
                  <th className="px-4 py-2 text-left">Destination</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">001</td>
                  <td className="px-4 py-2">Tirupati Temple</td>
                  <td className="px-4 py-2">Ram Sharma</td>
                  <td className="px-4 py-2">
                    <span className="bg-green-200 text-green-800 px-2 py-1 rounded">Active</span>
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-blue-500 hover:underline mr-2">Edit</button>
                    <button className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">002</td>
                  <td className="px-4 py-2">Golden Temple</td>
                  <td className="px-4 py-2">Priya Singh</td>
                  <td className="px-4 py-2">
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Pending</span>
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-blue-500 hover:underline mr-2">Edit</button>
                    <button className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
                {/* Add more rows dynamically if needed */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;