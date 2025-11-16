import React, { useEffect, useState } from 'react';
import { getTours, deleteTour } from '../api';
import { useNavigate } from 'react-router-dom';

const AdminTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const token = localStorage.getItem('token');

  const load = async () => {
    setLoading(true);
    const res = await getTours();
    if (res.success) setTours(res.tours);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this tour?')) return;
    const res = await deleteTour(id, token);
    if (res.success) load();
    else alert('Failed: ' + res.message);
  };

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-2xl font-bold'>Manage Tours</h2>
        <button onClick={() => nav('/TourForm')} className='bg-red-500 text-white px-4 py-2 rounded'>Add New</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {tours.map(t => (
            <div key={t._id} className='border rounded p-3'>
              <img src={t.images?.[0] || '/placeholder.jpg'} alt={t.title} className='h-40 w-full object-cover rounded' />
              <h3 className='text-lg font-semibold mt-2'>{t.title}</h3>
              <p className='text-sm text-gray-600'>{t.location}</p>
              <div className='flex gap-2 mt-3'>
                <button onClick={() => nav(`/admin/tours/edit/${t._id}`)} className='px-3 py-1 bg-black text-white rounded'>Edit</button>
                <button onClick={() => handleDelete(t._id)} className='px-3 py-1 bg-red-500 text-white rounded'>Delete</button>
                <button onClick={() => nav(`/tours/${t._id}`)} className='px-3 py-1 bg-gray-200 rounded'>View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTours;
