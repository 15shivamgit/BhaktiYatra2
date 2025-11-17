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
  };

  return (
    <div className="relative" ref={menuRef}>
      <FaUserCircle
        size={42}
        className="cursor-pointer text-white hover:text-red-400 transition"
        onClick={() => setOpen(!open)}
      />

      {open && (
        <div className="absolute right-0 mt-2 bg-white text-black shadow-lg rounded-lg w-48 py-2 z-50 animate-slideDown">
          {/* If NOT logged in */}
          {!user && (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>
                <p className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Login</p>
              </Link>
              <Link to="/login" onClick={() => setOpen(false)}>
                <p className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Register</p>
              </Link>
            </>
          )}

          {/* If logged in */}
          {user && (
            <>
              <p className="px-3 py-2 text-sm text-gray-500 border-b">
                {user.name}
              </p>

              <Link to="/tours" onClick={() => setOpen(false)}>
                <p className="px-3 py-2 hover:bg-gray-100 cursor-pointer">My Bookings</p>
              </Link>

              {user.role === "admin" && (
                <Link to="/admin/dashboard" onClick={() => setOpen(false)}>
                  <p className="px-3 py-2 hover:bg-gray-100 cursor-pointer font-semibold text-red-500">
                    Admin Dashboard
                  </p>
                </Link>
              )}

              <p
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                onClick={logout}
              >
                Logout
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
