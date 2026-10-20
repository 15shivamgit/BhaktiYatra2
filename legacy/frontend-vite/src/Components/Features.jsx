import React from 'react'
import { Plane, Hotel, Map, Camera, Headphones, Shield } from 'lucide-react'

const Features = () => {
    const features = [
        {
          icon: <Plane className="h-8 w-8 mb-2 text-primary" />,
          title: "Exclusive Flight Deals",
          description: "Access to premium airlines and discounted airfares for your journey."
        },
        {
          icon: <Hotel className="h-8 w-8 mb-2 text-primary" />,
          title: "Luxury Accommodations",
          description: "Hand-picked hotels and resorts for a comfortable and memorable stay."
        },
        {
          icon: <Map className="h-8 w-8 mb-2 text-primary" />,
          title: "Customized Itineraries",
          description: "Tailor-made travel plans to suit your preferences and interests."
        },
        {
          icon: <Camera className="h-8 w-8 mb-2 text-primary" />,
          title: "Guided Tours",
          description: "Expert local guides to enhance your travel experience and knowledge."
        },
        {
          icon: <Headphones className="h-8 w-8 mb-2 text-primary" />,
          title: "24/7 Customer Support",
          description: "Round-the-clock assistance for any queries or emergencies during your trip."
        },
        {
          icon: <Shield className="h-8 w-8 mb-2 text-primary" />,
          title: "Travel Insurance",
          description: "Comprehensive coverage options for a worry-free vacation."
        }
      ]
  return (
    <section className='pyy-12 md:py-20'>
      <div className='max-w-7xl mx-auto px-4 md:px-6'>
        <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold tracking-tighter sm:text-5xl'>
                Why Choose Our Travel Services
            </h2>
            <p className='mt-4 text-muted-foreground md:text-xl'>Discover the unique features that make your journey with us extraordinary</p>
        </div>
        <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature, index)=> (
                <div key={index} className='transition-all bg-red-50 border rounded-lg hover:shadow-lg'>
                    <div className='p-6 text-center'>
                        {feature.icon}
                        <h3 className='text-xl font-bold mb-2'>{feature.title}</h3>
                        <p className='text-muted-foreground'>{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  )
}

export default Features
