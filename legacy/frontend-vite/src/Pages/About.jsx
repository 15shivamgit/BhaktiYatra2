import React from 'react'
import TopBanner from '../Components/TopBanner'
import trip from '../assets/trip.gif'
import time from '../assets/fire-time.gif'
import price from '../assets/best-price.gif'
import banner1 from '../assets/vaishnodevi.jpg'

const About = () => {
  return (
    <div>
     <TopBanner text='About'/>
     <div className='max-w-7xl mx-auto my-10'>
      <div className='flex flex-col md:flex-row px-4 md:px-0 gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <img src={banner1} alt="travel" className='rounded-lg'/>
            <div className='absolute bottom-[45%] right-0 p-4 bg-red-500 text-white font-bold md:text-4xl rounded-lg'>
              HOW WE ARE BEST <br /> FOR TRAVEL!
            </div>
          
          </div>
          <h1 className='md:text-4xl font-bold mt-6 mb-4 text-3xl'>How We Are Best For Travel !</h1>
          <p className='text-gray-500'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatibus incidunt aperiam vel laboriosam odio officia, tenetur iure qui? Officiis placeat iste ratione perspiciatis rerum sed magni commodi pariatur reiciendis dicta molestiae dolor tenetur, dolorem minus exercitationem quod adipisci, ad tempore. Suscipit iste impedit soluta omnis laborum quisquam eveniet. Eos ipsam sed eligendi architecto libero doloremque nobis fugit, asperiores molestiae ullam nulla mollitia quidem maxime totam delectus itaque? Quisquam impedit, cum quo tempore at velit? Voluptate rerum possimus vel numquam perspiciatis sint adipisci, veritatis ullam placeat, repellat similique ea pariatur officiis laborum eligendi porro eos perferendis consectetur, et ex tempore. Facilis, incidunt? Libero nostrum tempore repellat iste assumenda nulla doloremque similique sequi, facere tempora voluptates enim aspernatur quod voluptatibus tenetur dicta, nesciunt explicabo! Veritatis, officia a!</p>
        </div>
        <div className='flex-1'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <div className='flex flex-col md:flex-row items-start mb-4'>
              <img src={trip} alt="" className='w-20'/>
              <div>
                <h2 className='ml-2 text-2xl font-semibold mb-1'>50+ Destination</h2>
                <p className='text-gray-700 ml-2 lg:mr-28'>We offer the best travel experiences with personalized services and unbeatable prices.</p>
              </div>
            </div>
            
          </div>
          <div className='bg-white p-6 my-4 rounded-lg shadow-md'>
            <div className='flex flex-col md:flex-row items-start mb-4'>
              <img src={price} alt="" className='w-20'/>
              <div>
                <h2 className='ml-2 text-2xl font-semibold mb-1'>Best Price</h2>
                <p className='text-gray-700 ml-2 lg:mr-28'>We offer the best travel experiences with personalized services and unbeatable prices.</p>
              </div>
            </div>
            
          </div>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <div className='flex flex-col md:flex-row items-start mb-4'>
              <img src={time} alt="" className='w-20'/>
              <div>
                <h2 className='ml-2 text-2xl font-semibold mb-1'>Super Fast Booking</h2>
                <p className='text-gray-700 ml-2 lg:mr-28'>We offer the best travel experiences with personalized services and unbeatable prices.</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
     </div>
    </div>
  )
}

export default About
