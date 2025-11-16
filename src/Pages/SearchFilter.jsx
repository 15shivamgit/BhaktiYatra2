import React, { useState } from 'react';

const SearchFilter = ({ onSearch }) => {
  const [q, setQ] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSearch({ q, minPrice, maxPrice, location });
  };

  return (
    <form onSubmit={submit} className='flex gap-2 flex-wrap'>
      <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder='Search' className='p-2 border' />
      <input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder='Location' className='p-2 border' />
      <input value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} placeholder='Min price' className='p-2 border w-24' />
      <input value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder='Max price' className='p-2 border w-24' />
      <button className='bg-black text-white px-3 py-2 rounded'>Search</button>
    </form>
  );
};

export default SearchFilter;
