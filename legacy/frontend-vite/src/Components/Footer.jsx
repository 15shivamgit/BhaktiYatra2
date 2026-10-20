import React from "react";
import footer from "../assets/footer-pattern.jpg";
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaLocationArrow,
  FaPhone,
  FaTwitter,
} from "react-icons/fa";
import { IoMdMail } from "react-icons/io";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer
      className="bg-gray-800 text-white py-10"
      style={{
        backgroundImage: `url(${footer})`,
        backgroundPosition: "bottom",
        backgroundSize: "cover",
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h1 className="font-bold text-4xl mb-4">
              <span className="text-red-500">
                <Link to="/">
                  <img
                    src={logo}
                    alt=""
                    className="w-12 h-12 object-contain inline-block"
                  />
                </Link>
                Bhakti
              </span>
              Yatra
            </h1>
            <p className="text-sm">
              We're dedicated to making your travel dreams come true with
              expertly curated tours and unforgettable experiences.
            </p>
          </div>
          <div className="flex flex-col lg:items-center">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:underline">
                  Home
                </a>
              </li>
              <li>
                <a href="/gallery" className="hover:underline">
                  Destinations
                </a>
              </li>
              <li>
                <a href="/tours" className="hover:underline">
                  Tours
                </a>
              </li>
              <li>
                <a href="/about" className="hover:underline">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:underline">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FaLocationArrow className="hover:text-red-500" />
                Ramdiri Begusarai, Bihar, India
              </li>

              <li className="flex items-center gap-2">
                <FaPhone className="hover:text-red-500" />
                <Link to="tel:7488881563">+91 7488881563</Link>
              </li>

              <li className="flex items-center gap-2">
                <IoMdMail className="hover:text-red-500" />
                <Link to="mailto:15shivambgs@gmail.com">
                  info@bhaktiyatra.com
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4 ">
              <Link to="https://facebook.com">
                <FaFacebook className="hover:text-red-500" />
              </Link>
              <Link to="https://instagram.com/15shivambgs">
                <FaInstagram className="hover:text-red-500" />
              </Link>
              <Link to="https://x.com/Shivam748888">
                <FaTwitter className="hover:text-red-500" />
              </Link>
              <Link to="https://linkedin.com/in/15shivambgs">
                <FaLinkedin className="hover:text-red-500" />
              </Link>
              <Link to="https://github.com/15shivamgit">
                <FaGithub className="hover:text-red-500" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center justify-end text-sm">
          <p>
            &copy; {new Date().getFullYear()} TravelEase. All rights reserved{" "}
            <Link to="https://www.linkedin.com/in/15shivambgs">
              Shivam Kumar
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
