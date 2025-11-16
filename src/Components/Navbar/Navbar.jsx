import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiMenuAlt1 } from "react-icons/hi";
import ResponsiveMenu from "./ResponsiveMenu";
import logo from "../../assets/logo.png";
import ProfileMenu from "../ProfileMenu"; // add import

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const toggleMenu = () => setShowMenu(!showMenu);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="sticky mx-auto top-0 transition-all py-6 bg-transparent z-10">
      <div className="bg-transparent/75 px-4 fixed w-full z-50 top-0 py-2">
        <div className="max-w-7xl mx-auto py-2 px-5 flex bg-transparent justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl text-white font-bold">
              <img
                src={logo}
                alt=""
                className="w-12 h-12 object-contain inline-block"
              />
              Bhakti<span className="text-red-500">Yatra</span>
            </h1>
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden md:flex gap-7">
              <ul className="flex items-center font-semibold text-white text-xl gap-7">
                <Link to="/">
                  <li>Home</li>
                </Link>
                <Link to="/about">
                  <li>About Us</li>
                </Link>
                <Link to="/tours">
                  <li>Tours</li>
                </Link>
                <Link to="/gallery">
                  <li>Gallery</li>
                </Link>
                <Link to="/contact">
                  <li>Contact</li>
                </Link>

                {/* 👉 Admin Link Only For Admin */}
                {user?.role === "admin" && (
                  <Link to="/AdminDashboard">
                    <li className="text-red-400 font-bold">Admin</li>
                  </Link>
                )}

                {/* 👉 If user NOT logged in → show Login */}
                {!user && (
                  <Link to="/login">
                    <li>
                      <ProfileMenu />
                    </li>
                  </Link>
                )}

                {/* 👉 If user logged in → Logout */}
                {user && (
                  <li
                    onClick={handleLogout}
                    className="cursor-pointer hover:text-red-400"
                  >
                    <ProfileMenu />
                  </li>
                )}
              </ul>

              {/* Book Now Button (same for all users) */}
              <button
                onClick={() => navigate("/tours")}
                className="bg-red-500 text-white px-4 py-1 rounded-md font-semibold"
              >
                Book Now
              </button>
            </nav>

            <HiMenuAlt1
              onClick={toggleMenu}
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
