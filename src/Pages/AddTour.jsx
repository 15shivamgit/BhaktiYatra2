import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddTour = () => {
  const [form, setForm] = useState({ name: "", price: "" });
  const [image, setImage] = useState(null); // file store
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", form.name);
    data.append("price", form.price);
    data.append("image", image);
    data.append("seatsAvailable", form.seatsAvailable);


    await fetch("http://localhost:5000/api/tours", {
      method: "POST",
       headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: data, // NO headers, browser handles automatically
      
    });

    navigate("/admin/tours");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Tour</h1>

      <form onSubmit={submit} className="space-y-6">
        <input
          className="border p-3 w-full rounded"
          placeholder="Tour Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Total Seats"
          className="border p-3 w-full rounded"
          onChange={(e) => setForm({ ...form, seatsAvailable: Number(e.target.value) })}
          required
        />


        <input
          className="border p-3 w-full rounded"
          placeholder="Price"
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />

        {/* Image Select */}
        <input
          type="file"
          accept="image/*"
          className="border p-3 w-full rounded bg-white"
          onChange={(e) => setImage(e.target.files[0])}
          required
        />

        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Save Tour
        </button>
      </form>
    </div>
  );
};

export default AddTour;
