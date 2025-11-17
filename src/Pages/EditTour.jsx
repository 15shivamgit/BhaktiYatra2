import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditTour = () => {
  const { id } = useParams();
  const [tour, setTour] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/tours/${id}`)
      .then(res => res.json())
      .then(data => setTour(data.tour));
  }, []);

  const update = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:5000/api/tours/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tour)
    });
    navigate("/admin/tours");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Tour</h1>
      <form onSubmit={update} className="space-y-4">
        <input className="border p-2 w-full"
          value={tour.name || ""}
          onChange={(e) => setTour({ ...tour, name: e.target.value })} />
        <input className="border p-2 w-full"
          value={tour.price || ""}
          onChange={(e) => setTour({ ...tour, price: e.target.value })} />
        <input className="border p-2 w-full"
          value={tour.image || ""}
          onChange={(e) => setTour({ ...tour, image: e.target.value })} />
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          Update
        </button>
      </form>
    </div>
  );
};
export default EditTour;
