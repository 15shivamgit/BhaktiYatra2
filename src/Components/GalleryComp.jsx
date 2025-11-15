import React from 'react'
import LightGallery from 'lightgallery/react';
import prem from '../Assets/prerm2.jpg'
import ps1 from '../Assets/vaishno5.jpg'
import ashok from '../Assets/ashok.jpg'
import pashupati from '../Assets/pashupati2.jpg'
import sai from '../Assets/sai.jpg'
import kashi from '../Assets/kash2.jpg'
import kedar from '../Assets/kedar6.jpg'
import dwarka from '../Assets/dwarka1.jpg'
import ambaji from '../Assets/ambaji1.jpg'
import haridwar from '../Assets/haridwar.jpg'
import sarnath from '../Assets/sarnath.jpg'
import sri from '../Assets/sri2.jpg'
import aayodhya from '../Assets/ram7.jpg'
import akshardham from '../Assets/akshardham4.jpg'
import tiru from '../Assets/tiru4.jpg'

import './Css/Gallery.css'

// import styles
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';

// import plugins if you need
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';

const GalleryComp = () => {
    const onInit = () => {
        console.log('lightGallery has been initialized');
    };
  return (
    <div className='max-w-7xl mx-auto mb-16 px-4 md:px-0 mt-10'>
        <div className=''>
            <h2 className='text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-3 font-serif'>
                Our Gallery
            </h2>
            <hr className='text-red-500 w-[200px] bg-red-500 mx-auto h-1 mb-10'/>
        </div>

        <div className="App">
            <LightGallery
                onInit={onInit}
                speed={500}
                plugins={[lgThumbnail, lgZoom]}
            >
                <a href={prem}>
                    <img alt="img1" src={prem} />
                </a>
                <a href={ps1}>
                    <img alt="img2" src={ps1} />
                </a>
                <a href={ashok}>
                    <img alt="img2" src={ashok} />
                </a>
                <a href={pashupati}>
                    <img alt="img2" src={pashupati} />
                </a>
                <a href={sai}>
                    <img alt="img2" src={sai} />
                </a>
                <a href={kashi}>
                    <img alt="img2" src={kashi} />
                </a>
                <a href={kedar}>
                    <img alt="img2" src={kedar} />
                </a>
                <a href={dwarka}>
                    <img alt="img2" src={dwarka} />
                </a>
                <a href={akshardham}>
                    <img alt="img2" src={akshardham} />
                </a>
                <a href={tiru}>
                    <img alt="img2" src={tiru} />
                </a>
                <a href={sai}>
                    <img alt="img2" src={sai} />
                </a>
                <a href={aayodhya}>
                    <img alt="img2" src={aayodhya} />
                </a>
                <a href={ambaji}>
                    <img alt="img2" src={ambaji} />
                </a>
                <a href={sarnath}>
                    <img alt="img2" src={sarnath} />
                </a>
                <a href={sri}>
                    <img alt="img2" src={sri} />
                </a>
            </LightGallery>
        </div>
    </div>
  )
}

export default GalleryComp
