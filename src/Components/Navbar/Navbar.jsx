import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiMenuAlt1 } from "react-icons/hi";
import ResponsiveMenu from "./ResponsiveMenu";
import logo from "../../assets/logo.png";
import ProfileMenu from "../ProfileMenu";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <header className="sticky mx-auto top-0 transition-all py-6 bg-transparent z-10">
      <div className="bg-transparent/75 px-4 fixed w-full z-50 top-0 py-2">
        <div className="max-w-7xl mx-auto py-2 px-5 flex justify-between items-center">
          <Link to="/">
            <div className="flex items-center gap-2">
              <img src={logo} alt="" className="w-12 h-12 object-contain" />
              <h1 className="text-2xl text-white font-bold">
                Bhakti<span className="text-red-500">Yatra</span>
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden md:flex gap-7">
              <ul className="flex items-center font-semibold text-white text-xl gap-7">
                <Link to="/"><li>Home</li></Link>
                <Link to="/about"><li>About Us</li></Link>
                <Link to="/tours"><li>Tours</li></Link>
                <Link to="/gallery"><li>Gallery</li></Link>
                <Link to="/contact"><li>Contact</li></Link>

                {user?.role === "admin" && (
                  <Link to="/admin/dashboard">
                    <li className="text-red-400 font-bold">Admin</li>
                  </Link>
                )}

                <li><ProfileMenu /></li>
              </ul>

              <button
                onClick={() => navigate("/tours")}
                className="bg-red-500 text-white px-4 py-1 rounded-md font-semibold"
              >
                Book Now
              </button>
            </nav>

            <HiMenuAlt1
              onClick={() => setShowMenu(!showMenu)}
              className="cursor-pointer md:hidden text-white"
              size={30}
            />
          </div>
        </div>

        <ResponsiveMenu showMenu={showMenu} setShowMenu={setShowMenu} />
      </div>
    </header>
  );
};

export default Navbar;
