const BASE_URL = "http://localhost:5000";

export const getMandirs = async () => {
  const res = await fetch(`${BASE_URL}/api/mandirs`);
  return await res.json();
};

// export const getTours = async () => {
//   const res = await fetch(`${BASE_URL}/api/tours`);
//   return await res.json();
// };

// export const loginUser = async (data) => {
//   const res = await fetch(`${BASE_URL}/api/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   return await res.json();
// };

export const signupUser = async (data) => {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const sendContact = async (data) => {
  const res = await fetch(`${BASE_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};


// export const getTours = async () => {
//   const res = await fetch("http://localhost:5000/api/tours");
//   return await res.json();
// };




// TOURS
export const getTours = async (params = {}) => {
  // params: { q, minPrice, maxPrice, location, sort, page, limit }
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/tours?${qs}`);
  return await res.json();
};

export const getTour = async (id) => {
  const res = await fetch(`${BASE_URL}/api/tours/${id}`);
  return await res.json();
};

export const addTour = async (formData, token) => {
  const res = await fetch(`${BASE_URL}/api/tours`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: formData // formData with images fields
  });
  return await res.json();
};

export const updateTour = async (id, formData, token) => {
  const res = await fetch(`${BASE_URL}/api/tours/${id}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + token },
    body: formData
  });
  return await res.json();
};

export const deleteTour = async (id, token) => {
  const res = await fetch(`${BASE_URL}/api/tours/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });
  return await res.json();
};

// BOOKINGS
export const createBooking = async (data) => {
  // data: { tour, userName, userEmail, userPhone, seatsBooked }
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const getBookingsAdmin = async (token) => {
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  return await res.json();
};

export const getMyBookings = async (email) => {
  const qs = new URLSearchParams({ email }).toString();
  const res = await fetch(`${BASE_URL}/api/bookings/my?${qs}`);
  return await res.json();
};

export const registerUser = async (data) => {
  const res = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const loginUser = async (data) => {
  const res = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};
