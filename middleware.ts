import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is accessing protected routes
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/models",
          "/auth/signin",
          "/auth/signup",
          "/auth/error",
          "/docs",
          "/pricing"
        ]
        
        // API routes that are public
        const publicApiRoutes = [
          "/api/auth",
          "/api/webhooks",
          "/api/models/sync"
        ]
        
        // Allow public routes
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Allow public API routes
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
} 