export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/wizard/:path*',
    '/generate/:path*',
    '/report/:path*',
    '/settings/:path*',
    '/billing/:path*',
  ],
};
