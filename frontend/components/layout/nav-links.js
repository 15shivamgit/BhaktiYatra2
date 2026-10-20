/** Primary navigation. Tours appears once Phase 4 sets NEXT_PUBLIC_FEATURE_TOURS=true. */
export const NAV_LINKS = [
  { href: '/temples', key: 'nav.temples' },
  { href: '/circuits', key: 'nav.circuits' },
  ...(process.env.NEXT_PUBLIC_FEATURE_TOURS === 'true'
    ? [{ href: '/tours', key: 'nav.tours' }]
    : []),
  { href: '/about', key: 'nav.about' },
  { href: '/contact', key: 'nav.contact' },
];
