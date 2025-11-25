import React, { useEffect, useState } from "react";
import { getTour, createBooking, verifyPayment } from "../api";
import { useParams, useNavigate } from "react-router-dom";

const TourDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    userPhone: "",
    seatsBooked: 1,
  });

  useEffect(() => {
    (async () => {
      const res = await getTour(id);
      if (res.success) setTour(res.tour);
    })();
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!tour) return;

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) return navigate("/login");

    const seats = Number(form.seatsBooked);
    if (seats < 1) return alert("At least 1 seat required");
    if (seats > tour.seatsAvailable)
      return alert(`Only ${tour.seatsAvailable} seats available`);

    setLoading(true);

    const payload = {
      user: user._id,
      tour: id,
      seats,
      amount: seats * tour.price,
      userName: form.userName,
      userEmail: form.userEmail,
      userPhone: form.userPhone,
    };

    const orderRes = await createBooking(payload, token);
    setLoading(false);

    if (!orderRes.success) return alert(orderRes.message);

    const { key, amount, orderId, bookingId } = orderRes;

    const options = {
      key,
      amount: amount * 100,
      currency: "INR",
      name: "BhaktiYatra",
      description: `Booking for ${tour.title || tour.name}`,
      order_id: orderId,

      handler: async () => {
        const verifyRes = await verifyPayment(bookingId, token);
        if (verifyRes.success) {
          alert("Payment Successful! Ticket sent to your email.");
          navigate("/my-bookings");
        } else alert("Payment failed: " + verifyRes.message);
      },

      prefill: {
        name: form.userName,
        email: form.userEmail,
        contact: form.userPhone,
      },
      theme: { color: "#EF4444" },
    };

    new window.Razorpay(options).open();
  };

  if (!tour) return <p>Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6">
      <div>
        <img
          src={
            tour.image
              ? `http://localhost:5000${tour.image}`
              : tour.images?.[0]
              ? `http://localhost:5000${tour.images[0]}`
              : "/placeholder.jpg"
          }
          className="w-full h-72 object-cover rounded"
          alt={tour.title}
        />
        <h1 className="text-2xl font-bold mt-3">{tour.title || tour.name}</h1>
        <p className="text-gray-600">
          {tour.location} • {tour.durationDays || "—"} days
        </p>
        <p className="mt-4">{tour.description}</p>
      </div>

      <div className="border p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Book This Tour</h3>
        <p className="text-lg mb-1">💰 ₹{tour.price} per seat</p>
        <p className="mb-3 text-green-600 font-semibold">
          Seats Available: {tour.seatsAvailable}
        </p>

        <form onSubmit={handlePayment} className="space-y-3">
          <input name="userName" value={form.userName} onChange={handleChange}
            placeholder="Full Name" className="w-full p-2 border rounded" required/>
          <input name="userEmail" value={form.userEmail} onChange={handleChange}
            placeholder="Email" className="w-full p-2 border rounded" required/>
          <input name="userPhone" value={form.userPhone} onChange={handleChange}
            placeholder="Phone Number" className="w-full p-2 border rounded" required/>
          <input name="seatsBooked" type="number" min="1" max={tour.seatsAvailable}
            value={form.seatsBooked} onChange={handleChange}
            className="w-full p-2 border rounded"/>

          <button className="w-full bg-red-500 text-white py-2 rounded"
            disabled={loading}>
            {loading ? "Processing Payment..." : "Pay & Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TourDetail;