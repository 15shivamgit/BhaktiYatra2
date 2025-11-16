import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddTour = () => {
  const [form, setForm] = useState({ name: "", price: "", image: "" });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:5000/api/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    navigate("/AdminTours");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Add New Tour</h1>
      <form onSubmit={submit} className="space-y-4">
        <input className="border p-2 w-full" placeholder="Tour Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Price"
          onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Image URL"
          onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          Save Tour
        </button>
      </form>
    </div>
  );
};
export default AddTour;
