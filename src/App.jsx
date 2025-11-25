import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ScrollToTop from "react-scroll-to-top";

import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer";

import Home from "./Pages/Home";
import Tours from "./Pages/Tours";
import Gallery from "./Pages/Gallery";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import Login from "./Pages/Login";

import TourDetail from "./Pages/TourDetail";

import AdminDashboard from "./Pages/AdminDashboard";
import AdminTours from "./Pages/AdminTours";
import AddTour from "./Pages/AddTour";
import EditTour from "./Pages/EditTour";

import ProtectedAdminRoute from "./Components/ProtectedAdminRoute";

import BookTour from "./Pages/BookTour";
import MyBookings from "./Pages/MyBookings";
import AdminBookings from "./Pages/AdminBookings";
import SearchFilter from './Pages/SearchFilter'

const Layout = (page) => (
  <>
    <Navbar />
    {page}
    <Footer />
  </>
);

const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: Layout(<Home />) },
  { path: "/tours", element: Layout(<Tours />) },
  { path: "/tours/:id", element: Layout(<TourDetail />) }, // dynamic detail page
  { path: "/gallery", element: Layout(<Gallery />) },
  { path: "/about", element: Layout(<About />) },
  { path: "/contact", element: Layout(<Contact />) },
  { path: "/login", element: Layout(<Login />) },
  { path: "/search", element: Layout(<SearchFilter />) },


  {
    path: "/book/:id",
    element: <><Navbar/><BookTour/><Footer/></>
  },
  {
    path: "/my-bookings",
    element: <><Navbar/><MyBookings/><Footer/></>
  },
  {
    path: "/AdminBookings",
    element: <><Navbar /><AdminBookings /><Footer /></>
  },

  // Admin Routes (Protected)
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedAdminRoute>
        {Layout(<AdminDashboard />)}
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/tours",
    element: (
      <ProtectedAdminRoute>
        {Layout(<AdminTours />)}
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/tours/new",
    element: (
      <ProtectedAdminRoute>
        {Layout(<AddTour />)}
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/tours/edit/:id",
    element: (
      <ProtectedAdminRoute>
        {Layout(<EditTour />)}
      </ProtectedAdminRoute>
    ),
  },
]);

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
      <ScrollToTop
        color="white"
        smooth
        style={{
          backgroundColor: "#EF4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </>
  );
};

export default App;
