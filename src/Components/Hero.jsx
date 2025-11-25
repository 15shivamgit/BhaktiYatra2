import React from 'react'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import banner3 from '../assets/amarnath.jpg'
import banner2 from '../assets/banaras.jpg'
import banner1 from '../assets/ramMandir.jpg'
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1
      };
  return (
    <div className="slider-container -mt-12 overflow-hidden">
      <Slider {...settings}>
        <div className=''>
          <div className='h-[650px] lg:h-[800px] relative' 
          style={{
            backgroundImage: `url(${banner1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
            }}>
               <div className='absolute inset-0 bg-black opacity-60'></div>
               <div className='relative max-w-7xl mx-auto'>
                <div className='flex h-[650px] justify-center items-center lg:pt-0 pt-20'>
                    <div className='flex flex-col space-y-8 justify-center items-center text-center px-5 md:px-0'>
                        <h1 className='text-white font-bold text-4xl lg:text-6xl'>Embark on a Divine Journey</h1>
                        <p className='text-white lg:text-lg lg:w-[700px]'>Book Your Pligrimage to Sacred Hindu Tirth Places.</p>
                        <button onClick={() => {navigate('/gallery')}} className='bg-red-500 px-3 py-2 text-white rounded-md font-semibold'>Start Exploring</button>
                    </div>
                </div>
               </div>
          </div>
        </div>
        <div className=''>
          <div className='h-[650px] lg:h-[800px] relative' 
          style={{
            backgroundImage: `url(${banner2})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
            }}>
               <div className='absolute inset-0 bg-black opacity-60'></div>
               <div className='relative max-w-7xl mx-auto'>
                <div className='flex h-[650px] justify-center items-center lg:pt-0 pt-20'>
                    <div className='flex flex-col space-y-8 justify-center items-center text-center px-5 md:px-0'>
                        <h1 className='text-white font-bold text-4xl lg:text-6xl'>Discover Your Next Adventure</h1>
                        <p className='text-white lg:text-lg lg:w-[700px]'>Explore breathtaking destinations, create unforgettable memories and embark on the journey of a lifetime.</p>
                        <button className='bg-red-500 px-3 py-2 text-white rounded-md font-semibold'>Start Exploring</button>
                    </div>
                </div>
               </div>
          </div>
        </div>
        <div className=''>
          <div className='h-[650px] lg:h-[800px] relative' 
          style={{
            backgroundImage: `url(${banner3})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
            }}>
               <div className='absolute inset-0 bg-black opacity-60'></div>
               <div className='relative max-w-7xl mx-auto'>
                <div className='flex h-[650px] justify-center items-center lg:pt-0 pt-20'>
                    <div className='flex flex-col space-y-8 justify-center items-center text-center px-5 md:px-0'>
                        <h1 className='text-white font-bold text-4xl lg:text-6xl'>Discover Your Next Adventure</h1>
                        <p className='text-white lg:text-lg lg:w-[700px]'>Explore breathtaking destinations, create unforgettable memories and embark on the journey of a lifetime.</p>
                        <button className='bg-red-500 px-3 py-2 text-white rounded-md font-semibold'>Start Exploring</button>
                    </div>
                </div>
               </div>
          </div>
        </div>
      </Slider>
      <div className='bg-white border border-gray-300 shadow-lg rounded-md z-10 left-[15%] absolute hidden lg:block bottom-[15%] items-center justify-center w-[1050px] mx-auto p-4'>
        <div className='flex gap-3 items-center'>
            <div className='grid gap-5 grid-cols-4 flex-grow'>
                <div className='flex flex-col gap-2'>
                    <label htmlFor="" className='flex font-semibold gap-1 items-center'><Search className='w-4 h-4'/>Location</label>
                    <select name="" id="" className='border border-gray-300 rounded-sm p-1'>
                        <option value="">Select Options</option>
                        <option value="">Banars</option>
                        <option value="">Ayodhya</option>
                        <option value="">Amarnath</option>
                        <option value="">Prem-Mandir</option>
                        <option value="">KedarNath</option>
                    </select>
                </div>
                <div className='flex flex-col gap-2'>
                    <label htmlFor="" className='font-semibold'>Check In</label>
                    <input type="date" className='border p-1 border-gray-300 rounded-sm'/>
                </div>
                <div className='flex flex-col gap-2'>
                    <label htmlFor="" className='font-semibold'>Check Out</label>
                    <input type="date" className='border p-1 border-gray-300 rounded-sm' readOnly/>
                </div>
                <div className='flex flex-col gap-2'>
                    <label htmlFor="" className='flex font-semibold gap-1 items-center'><Search className='w-4 h-4'/>Guest</label>
                    <select name="" id="" className='border border-gray-300 rounded-sm p-1'>
                        <option value="">Select Options</option>
                        <option value="">2 Guest 1 Children</option>
                        <option value="">2 Guest 1 Children</option>
                        <option value="">2 Guest 1 Children</option>
                        <option value="">2 Guest 1 Children</option>
                        <option value="">2 Guest 1 Children</option>
                    </select>
                </div>
            </div>
            <div className='flex flex-col'>
                <label htmlFor="" className='text-white'>Transmissioin</label>
                <button className='bg-red-500 transition-all ease-in text-white hover:bg-black hover:text-white px-3 h-8 py-1 rounded-md'>Book Now</button>
            </div>

        </div>
      </div>
    </div>
  )
}

export default Hero
