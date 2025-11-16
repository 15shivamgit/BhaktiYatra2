import React, { useState } from 'react';
import contactImg from '../assets/ContactImg.jpg';
import { sendContact } from "../api";

const Contact = () => {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await sendContact(form);
        
        setLoading(false);

        if (result.success) {
            setSuccess("Message sent successfully!");
            setForm({ name: "", email: "", message: "" });
        } else {
            setSuccess("Failed to send message.");
        }
    };

    return (
        <div className='flex flex-col max-w-7xl mx-auto md:flex-row lg:h-screen items-center'>
            {/* image section */}
            <div className='flex-1 bg-gray-100 flex justify-center items-center'>
                <img src={contactImg} alt="Contact Us" className='w-full h-full max-w-md md:max-w-full object-cover' />
            </div>

            {/* contact form section */}
            <div className='flex-1 bg-white w-full flex flex-col justify-center px-8 py-12'>
                <h2 className='text-3xl font-bold text-gray-800 mb-6'>Get in Touch</h2>

                {success && <p className='text-green-600 mb-3'>{success}</p>}

                <form className='space-y-6' onSubmit={handleSubmit}>
                    <div>
                        <label className='block text-sm font-medium text-gray-700'>Name</label>
                        <input
                            type="text"
                            name='name'
                            value={form.name}
                            onChange={handleChange}
                            placeholder='Enter your name'
                            className='mt-1 blcok w-full border border-gray-300 rounded-md p-2'
                            required
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700'>Email</label>
                        <input
                            type="email"
                            name='email'
                            value={form.email}
                            onChange={handleChange}
                            placeholder='Enter your email'
                            className='mt-1 blcok w-full border border-gray-300 rounded-md p-2'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700'>Message</label>
                        <textarea
                            name='message'
                            value={form.message}
                            onChange={handleChange}
                            rows='5'
                            placeholder='Enter your message'
                            className='mt-1 blcok w-full border border-gray-300 rounded-md p-2'
                            required
                        />
                    </div>

                    <button
                        type='submit'
                        className='w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600'
                    >
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Contact;
