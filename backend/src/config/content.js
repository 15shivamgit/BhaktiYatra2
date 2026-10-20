/** Closed sets used by content models, validators and the admin UI. */

export const CONTENT_STATUSES = Object.freeze(['draft', 'published', 'archived']);
export const RELIGIONS = Object.freeze(['hindu', 'jain', 'sikh', 'buddhist', 'other']);

/** Suggested deities for the admin picker; the field itself accepts free text. */
export const DEITY_SUGGESTIONS = Object.freeze([
  'Shiva',
  'Vishnu',
  'Devi',
  'Krishna',
  'Rama',
  'Hanuman',
  'Ganesha',
  'Murugan',
  'Surya',
  'Jain Tirthankara',
  'Other',
]);

/** States and union territories of India (official English names). */
export const INDIAN_STATES = Object.freeze([
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]);

export const MAX_TEMPLE_IMAGES = 12;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MIN_DESCRIPTION_CHARS = 200;
export const NEARBY_RADIUS_KM = 100;

/** Cache tag shared by every public content fetch on the frontend. */
export const CONTENT_CACHE_TAG = 'content';
