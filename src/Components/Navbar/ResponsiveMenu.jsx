import { X } from 'lucide-react'
import React from 'react'
import { FaUserCircle } from "react-icons/fa";
import { Link } from 'react-router-dom';

const ResponsiveMenu = ({ showMenu, setShowMenu }) => {
    return (
        <div className={`${showMenu ? 'right-0' : "-right-[100%]"} fixed bottom-0 top-0 x-20 flex h-screen w-[75%] flex-col justify-between bg-white px-8 pb-6 pt-16 text-black transition-all duration-200 md:hidden rounded-r-xl shadow-md`}>
            <div>
                <button className='border border-black rounded-lg absolute top-4 right-9' onClick={()=>setShowMenu(false)}><X /></button>
                <div className='flex items-center justify-start gap-3'>
                    <FaUserCircle size={50} />
                    <div>
                        <h1>Hello User</h1>
                        <h1 className='text-sm text-slate-500'>Premium User</h1>
                    </div>
                </div>
                <nav className='mt-12'>
                    <ul className='space-y-4 text-xl text-black flex flex-col'>
                        <Link to='/'><li onClick={()=>setShowMenu(false)}>Home</li></Link>
                        <Link to='/about'><li onClick={()=>setShowMenu(false)}>About Us</li></Link>
                        <Link to='/tours'><li onClick={()=>setShowMenu(false)}>Tours</li></Link>
                        <Link to='/gallery'><li onClick={()=>setShowMenu(false)}>Gallery</li></Link>
                        <Link to='/contact'><li onClick={()=>setShowMenu(false)}>Contact</li></Link>
                        <Link to='/login'><li onClick={()=>setShowMenu(false)}>Login</li></Link>
                        <Link to='#'><button onClick={()=>setShowMenu(false)} className='bg-red-500 text-white px-4 py-1 rounded-md font-semibold'>Book Now</button></Link>
                    </ul>
                </nav>
            </div>
            <div>
                <h1>Made with ❤️ by Shivam</h1>
            </div>
        </div>
    )
}

export default ResponsiveMenu
