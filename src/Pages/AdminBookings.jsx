import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/bookings/admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (data.success) setBookings(data.bookings);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    if (!confirm(`Are you sure to ${status} this booking?`)) return;

    const res = await fetch(`http://localhost:5000/api/bookings/status/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (data.success) load();
    else alert("Failed to update status");
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Manage Bookings</h2>

      {loading ? (
        <p className="text-lg font-semibold text-center">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Tour</th>
                <th className="p-3">Seats</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{b.user?.name}</td>
                  <td className="p-3">{b.tour?.name}</td>
                  <td className="p-3 text-center">{b.seats}</td>
                  <td className="p-3 font-semibold text-red-600">₹{b.amount}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm font-semibold ${
                        b.status === "paid"
                          ? "bg-green-200 text-green-800"
                          : b.status === "cancelled"
                          ? "bg-red-200 text-red-700"
                          : "bg-yellow-200 text-yellow-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="p-3 flex gap-2 justify-center">
                    {b.status === "paid" && (
                      <button
                        onClick={() => updateStatus(b._id, "confirmed")}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status !== "cancelled" && (
                      <button
                        onClick={() => updateStatus(b._id, "cancelled")}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </td>

                  <td>
                    {b.ticketPdfPath && (
                      <a
                        href={`http://localhost:5000${b.ticketPdfPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                          Download
                        </button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}

              {bookings.length === 0 && (
                <tr>
                  <td className="p-4 text-center" colSpan={6}>
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
