// import React, { useEffect, useState } from "react";
// import { getTours } from "../api";
// import TopBanner from '../Components/TopBanner'
// import kashi from '../assets/kash1.jpg'
// import prem from '../assets/prerm10.jpg'
// import ram from '../assets/ram7.jpg'
// import rames from '../assets/rames.jpg'
// import kedar from '../assets/kedar6.jpg'
// import vaishno from '../assets/vaishno4.jpg'
// import tiru from '../assets/tiru3.jpg'
// import dhari from '../assets/dharidevi3.jpg'
// import { Clock, Star } from 'lucide-react'

// const Tours = () => {
//   const [tours, setTours] = useState([]);

//   useEffect(() => {
//     const loadTours = async () => {
//       const data = await getTours();
//       if (data.success) setTours(data.tours);
//     };
//     loadTours();
//   }, []);

//   const destinationJson = [
//     { name: 'Kashi Vishwanath', img: kashi, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//     { name: 'Vaishno Devi', img: vaishno, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//     { name: 'Kedar-nath Temple', img: kedar, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//     { name: 'Rameshwaram', img: rames, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//     { name: 'Prem Mandir', img: prem, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//     { name: 'Ram Mandir', img: ram, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//     { name: 'Tri-Puri', img: tiru, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//     { name: 'Dhari Devi', img: dhari, time: '5 Days - 4 Nights', star: '3 (12 reviews)', price: '69,999' },
//   ]
//   return (
//     <>
//       <TopBanner text='Tours' />
//       <div className='max-w-7xl md:mx-auto my-10'>
//         <h1 className='text-3xl lg:text-4xl font-serif mb-3 font-semibold text-center'>Top Destination</h1>
//         <hr className='text-red-500 w-[200px] bg-red-500 mx-auto h-1 mb-10' />
//         <div className='grid gird-cols-1 md:grid-cols-2 lg:grid-cols-4 place-items-center'>
//           {
//             destinationJson.map((destination) => (
//               <div>
//                 <div key={destination.name} className='overflow-hidden border shadow-lg shadow-gray-500 rounded-lg mb-5 md:mr-5'>
//                   <div className=''>
//                     <img
//                       src={destination.img}
//                       alt={destination.name}
//                       width={600}
//                       height={400}
//                       className='object-cover w-full h-48 hover:scale-110 transition-all'
//                     />
//                     <div className='p-4'>
//                       <p className='text-gray-500 flex items-center gap-1 text-sm mb-1'><Clock width={15} />{destination.time}</p>
//                       <h3 className='text-xl font-bold mb-2'>{destination.name}</h3>
//                       <p className='flex gap-1 items-center'><Star width={20} fill='red' />{destination.star}</p>
//                       <p className='text-gray-600 mb-4 mt-2'>Experience the beauty and culture of {destination.name}</p>
//                       <div className='flex gap-4'>
//                         <button className='px-3 py-2 bg-red-500 rounded-md text-white'>${destination.price}</button>
//                         <button className='px-3 py-2 bg-black rounded-md text-white'>Learn More</button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))
//           }
//         </div>
//       </div>
//     </>
//   )
// }

// export default Tours;

import React, { useEffect, useState } from "react";
import { getTours } from "../api";
import SearchFilter from "../pages/SearchFilter";
import { useNavigate } from "react-router-dom";

const Tours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = async (params = {}) => {
    setLoading(true);
    const res = await getTours(params);
    if (res.success) setTours(res.tours);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <SearchFilter onSearch={(p) => load(p)} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {loading ? (
          <p>Loading...</p>
        ) : (
          tours.map((t) => (
            <div key={t._id} className="border rounded overflow-hidden">
              <img
                src={`http://localhost:5000${t.image}`}
                alt={t.title}
                width={600}
                height={400}
                className='object-cover w-full h-48 hover:scale-110 transition-all'
              />
              <div className="p-3">
                <h3 className="font-bold">{t.title}</h3>
                <p className="text-sm text-gray-600">{t.location}</p>
                <p className="mt-2 font-semibold">₹{t.price}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => nav(`/tours/${t._id}`)}
                    className="px-3 py-1 bg-black text-white rounded"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tours;
