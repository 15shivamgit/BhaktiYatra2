import React, { useState, useEffect } from 'react';
import { addTour, getTour, updateTour } from '../api';
import { useNavigate, useParams } from 'react-router-dom';

const TourForm = () => {
  const { id } = useParams(); // if edit
  const nav = useNavigate();
  const token = localStorage.getItem('token');

  const [form, setForm] = useState({
    title:'', location:'', price:'', durationDays:'', itinerary:'', inclusions:'', description:''
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (id) (async ()=> {
      const res = await getTour(id);
      if (res.success) {
        const t = res.tour;
        setForm({
          title:t.title, location:t.location, price:t.price, durationDays:t.durationDays || '',
          itinerary:t.itinerary || '', inclusions:(t.inclusions||[]).join(', '), description:t.description || ''
        });
      }
    })();
  }, [id]);

  const handleFile = (e) => setImages([...e.target.files]);

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    images.forEach((file) => fd.append('images', file));

    let res;
    if (id) res = await updateTour(id, fd, token);
    else res = await addTour(fd, token);

    if (res.success) {
      alert('Saved');
      nav('/AdminTours');
    } else alert('Error: ' + res.message);
  };

  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-4'>{id ? 'Edit Tour' : 'Add New Tour'}</h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <input name='title' value={form.title} onChange={handleChange} placeholder='Title' className='w-full p-2 border' required/>
        <input name='location' value={form.location} onChange={handleChange} placeholder='Location' className='w-full p-2 border' required/>
        <input name='price' value={form.price} onChange={handleChange} placeholder='Price' className='w-full p-2 border' required/>
        <input name='durationDays' value={form.durationDays} onChange={handleChange} placeholder='Duration (days)' className='w-full p-2 border'/>
        <input name='inclusions' value={form.inclusions} onChange={handleChange} placeholder='Inclusions (comma separated)' className='w-full p-2 border'/>
        <textarea name='description' value={form.description} onChange={handleChange} placeholder='Description' className='w-full p-2 border'/>
        <input type='file' multiple accept='image/*' onChange={handleFile} />
        <button className='bg-red-500 text-white px-4 py-2 rounded'>{id ? 'Update' : 'Create'}</button>
      </form>
    </div>
  );
};

export default TourForm;
