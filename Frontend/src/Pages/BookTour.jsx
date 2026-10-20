import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BookTour = () => {
  const { id } = useParams(); // tourId
  const [seats, setSeats] = useState(1);
  const [tour, setTour] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // tour detail laane ke liye (optional)
    fetch(`http://localhost:5000/api/tours/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTour(data.tour);
      });
  }, [id]);

  const handlePayment = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      return navigate("/login");
    }

    // 1) Backend se Razorpay Order create karao
    const res = await fetch("http://localhost:5000/api/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tourId: id, seats: Number(seats) }),
    });

    const data = await res.json();
    if (!data.success) {
      alert("Failed to create order");
      return;
    }

    const { key, order, amount, tourName } = data;

    // 2) Razorpay checkout open karo
    const options = {
      key,
      amount,
      currency: "INR",
      name: "BhaktiYatra",
      description: `Booking for ${tourName}`,
      order_id: order.id,
      handler: async function (response) {
        // 3) Payment verify backend pe
        const verifyRes = await fetch(
          "http://localhost:5000/api/payments/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...response,
              tourId: id,
              seats: Number(seats),
            }),
          }
        );

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          alert("Payment Successful! Booking Confirmed ✅");
          navigate("/my-bookings");
        } else {
          alert("Payment verification failed!");
        }
      },
      prefill: {
        name: "BhaktiYatra User",
        email: "user@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#EF4444",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-2">
        Book Tour {tour ? `– ${tour.name}` : ""}
      </h2>

      <label className="block mb-2 font-semibold">Seats</label>
      <input
        type="number"
        min="1"
        className="border p-2 rounded w-full mb-4"
        value={seats}
        onChange={(e) => setSeats(e.target.value)}
      />

      <button
        className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        onClick={handlePayment}
      >
        Pay & Confirm
      </button>
    </div>
  );
};

export default BookTour;
