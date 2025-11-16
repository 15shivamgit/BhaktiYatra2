import React, { useEffect, useState } from 'react';
import { getTour, createBooking } from '../api';
import { useParams } from 'react-router-dom';

const TourDetail = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [form, setForm] = useState({ userName:'', userEmail:'', userPhone:'', seatsBooked:1 });
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    (async ()=> {
      const res = await getTour(id);
      if (res.success) setTour(res.tour);
    })();
  }, [id]);

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = { ...form, tour: id, seatsBooked: Number(form.seatsBooked) };
    const res = await createBooking(data);
    setLoading(false);
    if (res.success) {
      alert('Booking successful!');
      // optionally navigate to bookings page
    } else alert('Booking failed: ' + res.message);
  };

  if (!tour) return <p>Loading...</p>;
  return (
    <div className='max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6'>
      <div>
        <img src={tour.images?.[0] || '/placeholder.jpg'} className='w-full h-72 object-cover rounded' alt={tour.title}/>
        <h1 className='text-2xl font-bold mt-3'>{tour.title}</h1>
        <p className='text-gray-600'>{tour.location} • {tour.durationDays} days</p>
        <p className='mt-4'>{tour.description}</p>
      </div>

      <div className='border p-4 rounded'>
        <h3 className='text-xl font-semibold mb-2'>Book This Tour</h3>
        <p className='mb-2'>Price per seat: ₹{tour.price}</p>
        <p className='mb-2'>Seats available: {tour.seatsAvailable}</p>

        <form onSubmit={handleBook} className='space-y-3'>
          <input name='userName' value={form.userName} onChange={handleChange} placeholder='Your name' className='w-full p-2 border' required/>
          <input name='userEmail' value={form.userEmail} onChange={handleChange} placeholder='Email' className='w-full p-2 border'/>
          <input name='userPhone' value={form.userPhone} onChange={handleChange} placeholder='Phone' className='w-full p-2 border'/>
          <input name='seatsBooked' type='number' min='1' max={tour.seatsAvailable} value={form.seatsBooked} onChange={handleChange} className='w-full p-2 border' />
          <button className='w-full bg-red-500 text-white py-2 rounded'>{loading ? 'Booking...' : 'Confirm Booking'}</button>
        </form>
      </div>
    </div>
  );
};

export default TourDetail;
