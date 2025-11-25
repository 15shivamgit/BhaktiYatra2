const BASE = "http://localhost:5000/api";

/* ---------------------- AUTH ---------------------- */
export const signupUser = async (data) => {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

/* ---------------------- TOURS ---------------------- */
export const getTours = async () => {
  const res = await fetch(`${BASE}/tours`);
  return res.json();
};

export const getTour = async (id) => {
  const res = await fetch(`${BASE}/tours/${id}`);
  return res.json();
};

export const addTour = async (formData, token) => {
  const res = await fetch(`${BASE}/tours`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const updateTour = async (id, formData, token) => {
  const res = await fetch(`${BASE}/tours/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const deleteTour = async (id, token) => {
  const res = await fetch(`${BASE}/tours/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

/* ---------------------- BOOKINGS (Razorpay Flow) ---------------------- */
export const createBooking = async (data, token) => {
  const res = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(data)
  });
  return res.json();
};


export const verifyPayment = async (bookingId, token) => {
  const res = await fetch(`${BASE}/bookings/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ bookingId }),
  });
  return res.json();
};


export const getMyBookings = async (token) => {
  const res = await fetch(`${BASE}/bookings/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getBookingsAdmin = async (token) => {
  const res = await fetch(`${BASE}/bookings/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

/* ---------------------- CONTACT ---------------------- */
export const sendContact = async (data) => {
  const res = await fetch(`${BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

/* ---------------------- REGISTER (extra) ---------------------- */
export const registerUser = async (data) => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
