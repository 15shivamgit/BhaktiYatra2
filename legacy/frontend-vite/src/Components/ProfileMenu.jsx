
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Icon */}
      <FaUserCircle
        size={42}
        className="cursor-pointer text-white hover:text-red-400 transition duration-300"
        onClick={() => setOpen(!open)}
      />

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl shadow-md bg-white text-black py-3 animate-dropdown z-50"
          style={{ animation: "dropdown 0.25s ease" }}
        >
          {/* User Info */}
          {user && (
            <div className="px-4 pb-3 border-b">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          )}

          {/* Guest Menu */}
          {!user && (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>
                <p className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  Login / Register
                </p>
              </Link>
            </>
          )}

          {/* Logged In – Normal User */}
          {user && user.role !== "admin" && (
            <>
              <Link to="/my-bookings" onClick={() => setOpen(false)}>
                <p className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  My Bookings
                </p>
              </Link>
            </>
          )}

          {/* Logged In – Admin User */}
          {user?.role === "admin" && (
            <Link to="/admin/dashboard" onClick={() => setOpen(false)}>
              <p className="px-4 py-2 font-semibold text-red-600 hover:bg-red-50 cursor-pointer">
                Admin Dashboard
              </p>
            </Link>
          )}

          {/* Logout Button */}
          {user && (
            <p
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 font-semibold"
              onClick={logout}
            >
              Logout
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
