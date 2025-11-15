import React from 'react'
import Navbar from './Components/Navbar/Navbar'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './Pages/Home'
import Tours from './Pages/Tours'
import Gallery from './Pages/Gallery'
import About from './Pages/About'
import Contact from './Pages/Contact'
import Login from './Pages/Login'
import Footer from './Components/Footer'
import ScrollToTop from "react-scroll-to-top";
import AdminDashboard from './Pages/AdminDashboard'

const router = createBrowserRouter([
  {
    path:'/',
    element: <><Navbar/><Home/><Footer/></>
  },
  {
    path:'/tours',
    element: <><Navbar/><Tours/><Footer/></>
  },
  {
    path:'/gallery',
    element: <><Navbar/><Gallery/><Footer/></>
  },
  {
    path:'/about',
    element: <><Navbar/><About/><Footer/></>
  },
  {
    path:'/contact',
    element: <><Navbar/><Contact/><Footer/></>
  },
  {
    path:'/contact',
    element: <><Navbar/><Contact/><Footer/></>
  },
  {
    path:'/login',
    element: <><Navbar/><Login/><Footer/></>
  },
  {
    path:'/AdminDashboard',
    element: <><Navbar/><AdminDashboard/><Footer/></>
  },
])

const App = () => {
  return (
    <>
      <RouterProvider router={router}/>
      <ScrollToTop color='white' smooth style={{backgroundColor:'#EF4444', display:'flex', alignItems:'center', justifyContent:'center'}}/>
    </>
  )
}

export default App
