import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditTour = () => {
  const { id } = useParams();
  const [tour, setTour] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`http://localhost:5000/api/tours/${id}`)
      .then((res) => res.json())
      .then((data) => setTour(data.tour));
  }, [id]);

  const update = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", tour.name);
    formData.append("price", tour.price);
    formData.append("seatsAvailable", tour.seatsAvailable);


    // only add image if newly selected
    if (tour.newImage) {
      formData.append("image", tour.newImage);
    }

    await fetch(`http://localhost:5000/api/tours/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    alert("Tour updated successfully");
    navigate("/admin/tours");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Tour</h1>

      <form onSubmit={update} className="space-y-4">
        {/* Tour Name */}
        <input
          className="border p-2 w-full"
          value={tour.name || ""}
          placeholder="Tour Name"
          onChange={(e) => setTour({ ...tour, name: e.target.value })}
          required
        />

        {/* Price */}
        <input
          type="number"
          className="border p-2 w-full"
          value={tour.price || ""}
          placeholder="Price"
          onChange={(e) => setTour({ ...tour, price: Number(e.target.value) })}
          required
        />

        {/* 🔥 NEW: Seats Available */}
        <input
          type="number"
          className="border p-2 w-full"
          value={tour.seatsAvailable || ""}
          placeholder="Seats Available"
          onChange={(e) =>
            setTour({ ...tour, seatsAvailable: Number(e.target.value) })
          }
          required
        />

        {/* Image preview */}
        {tour.image && (
          <img
            src={
              tour.image.startsWith("http")
                ? tour.image
                : `http://localhost:5000${tour.image}`
            }
            alt="Tour"
            className="w-40 h-28 object-cover rounded border"
          />
        )}

        {/* New Image Upload */}
        <input
          type="file"
          accept="image/*"
          className="border p-2 w-full bg-white"
          onChange={(e) => setTour({ ...tour, newImage: e.target.files[0] })}
        />

        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Update Tour
        </button>
      </form>
    </div>
  );
};

export default EditTour;
