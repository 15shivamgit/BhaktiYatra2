import React, { useEffect, useState } from "react";
import { getTours, deleteTour } from "../api";
import { useNavigate } from "react-router-dom";

const AdminTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    const res = await getTours();
    if (res.success) setTours(res.tours);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this tour?")) return;
    const res = await deleteTour(id, token);
    if (res.success) load();
    else alert("Failed: " + res.message);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Heading */}
      <div className="flex justify-between items-center pb-3 mb-6 border-b">
        <h2 className="text-3xl font-bold text-gray-800">Manage Tours</h2>
        <button
          onClick={() => nav("/admin/tours/new")}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md"
        >
          ➕ Add New Tour
        </button>
      </div>

      {/* Loader */}
      {loading ? (
        <p className="text-center text-lg font-semibold">Loading...</p>
      ) : tours.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          No tours found. Click "Add New Tour".
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((t) => (
            <div
              key={t._id}
              className="bg-white shadow-xl hover:shadow-2xl transition rounded-xl overflow-hidden border"
            >
              {/* Image */}
              <img
                //src={`http://localhost:5000${t.image}`}
                src={
                  t.image?.startsWith("http")
                    ? t.image
                    : `http://localhost:5000${t.image}`
                }
                alt={t.name}
                className="h-48 w-full object-cover hover:scale-105 transition duration-300"
              />

              {/* Content */}
              <div className="p-4 space-y-1">
                <h3 className="text-xl font-semibold text-gray-800">
                  {t.name}
                </h3>
                <p className="text-gray-600">{t.description?.slice(0, 50)}...</p>
                <p className="text-red-600 font-bold text-lg">
                  ₹ {t.price}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex border-t">
                <button
                  onClick={() => nav(`/admin/tours/edit/${t._id}`)}
                  className="flex-1 py-2 text-blue-600 hover:bg-blue-50 font-medium"
                >
                  ✏ Edit
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="flex-1 py-2 text-red-600 hover:bg-red-50 font-medium"
                >
                  🗑 Delete
                </button>
                <button
                  onClick={() => nav(`/tours/${t._id}`)}
                  className="flex-1 py-2 text-green-600 hover:bg-green-50 font-medium"
                >
                  👁 View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTours;
