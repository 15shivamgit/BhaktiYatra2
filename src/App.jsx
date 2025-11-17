// import React from 'react'
// import Navbar from './Components/Navbar/Navbar'
// import { createBrowserRouter, RouterProvider } from 'react-router-dom'
// import Home from './Pages/Home'
// import Tours from './Pages/Tours'
// import Gallery from './Pages/Gallery'
// import About from './Pages/About'
// import Contact from './Pages/Contact'
// import Login from './Pages/Login'
// import Footer from './Components/Footer'
// import ScrollToTop from "react-scroll-to-top";
// import AdminDashboard from './Pages/AdminDashboard'
// import ProtectedAdminRoute from './Components/ProtectedAdminRoute'
// import AdminTours from './Pages/AdminTours'
// import AddTour from './Pages/AddTour'
// import EditTour from './Pages/EditTour'
// import SearchFilter from './Pages/SearchFilter'
// import TourDetail from './Pages/TourDetail'
// import TourForm from './Pages/TourForm'
// import ProfileMenu from './Components/ProfileMenu'

// const router = createBrowserRouter([
//   {
//     path:'/',
//     element: <><Navbar/><Home/><Footer/></>
//   },
//   {
//     path:'/tours',
//     element: <><Navbar/><Tours/><Footer/></>
//   },
//   {
//     path:'/gallery',
//     element: <><Navbar/><Gallery/><Footer/></>
//   },
//   {
//     path:'/about',
//     element: <><Navbar/><About/><Footer/></>
//   },
//   {
//     path:'/contact',
//     element: <><Navbar/><Contact/><Footer/></>
//   },
//   {
//     path:'/login',
//     element: <><Navbar/><Login/><Footer/></>
//   },

//   {
//   path: "/AdminDashboard",
//   element: <><Navbar /><AdminDashboard /><Footer /></>     
//   },
//   {
//     path: "/AdminTours",
//     element: <><Navbar /><AdminTours /><Footer /></>
//   },
//   {
//     path: "/AddTour",
//     element: <><Navbar /><AddTour /><Footer /></>
//   },
//   {
//     path: "/EditTour/:id",
//     element: <><Navbar /><EditTour /><Footer /></>
//   },
//   {
//     path: "/ProfileMenu",
//     element: <><Navbar /><ProfileMenu /><Footer /></>
//   },
//   {
//     path: "/SearchFilter",
//     element: <><Navbar /><SearchFilter /><Footer /></>
//   },
//   {
//     path: "/TourDetail",
//     element: <><Navbar /><TourDetail /><Footer /></>
//   },
//   {
//     path: "/TourForm",
//     element: <><Navbar /><TourForm /><Footer /></>
//   },


//   // 🔐 Admin Protected Route
//   {
//     path:'/AdminDashboard',
//     element: (
//       <ProtectedAdminRoute>
//         <>
//           <Navbar />
//           <AdminDashboard />
//           <Footer />
//         </>
//       </ProtectedAdminRoute>
//     )
//   },
// ])

// const App = () => {
//   return (
//     <>
//       <RouterProvider router={router}/>
//       <ScrollToTop
//         color='white'
//         smooth
//         style={{
//           backgroundColor:'#EF4444',
//           display:'flex',
//           alignItems:'center',
//           justifyContent:'center'
//         }}
//       />
//     </>
//   )
// }

// export default App






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
import SearchFilter from "./pages/SearchFilter";

const Layout = (page) => (
  <>
    <Navbar />
    {page}
    <Footer />
  </>
);

const router = createBrowserRouter([
  // 🌍 Public Routes
  { path: "/", element: Layout(<Home />) },
  { path: "/tours", element: Layout(<Tours />) },
  { path: "/tours/:id", element: Layout(<TourDetail />) }, // dynamic detail page
  { path: "/gallery", element: Layout(<Gallery />) },
  { path: "/about", element: Layout(<About />) },
  { path: "/contact", element: Layout(<Contact />) },
  { path: "/login", element: Layout(<Login />) },
  { path: "/search", element: Layout(<SearchFilter />) },

  // 🔐 Admin Routes (Protected)
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
