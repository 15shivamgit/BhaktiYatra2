import { useEffect, useState } from "react";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/bookings/my", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => res.json())
      .then(data => setBookings(data.bookings));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h2 className="text-3xl font-bold mb-4">My Bookings</h2>
      {bookings.map(b => (
        <div key={b._id} className="p-4 border rounded shadow">
          <h3 className="text-xl font-semibold">{b.tour?.name}</h3>
          <p>Seats: {b.seats}</p>
          <p>Total Amount: ₹{b.amount}</p>
          <p>Status: {b.status}</p>

          <p>Status: {b.status}</p>
          <p>Payment ID: {b.paymentId}</p>
          <p>Invoice: {b.invoiceNumber}</p>

          {b.ticketPdfPath && (
            <a
              href={`http://localhost:5000${b.ticketPdfPath}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="px-4 py-2 mt-2 bg-green-600 text-white rounded hover:bg-green-700">
                🎟 Download Ticket
              </button>
            </a>
          )}


        </div>
      ))}
    </div>
  );
};

export default MyBookings;
