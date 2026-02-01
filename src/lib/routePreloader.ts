import { lazy, ComponentType } from 'react';

// Route component map for preloading
const routeComponents: Record<string, () => Promise<{ default: ComponentType<unknown> }>> = {
  '/': () => import('@/pages/Index'),
  '/login': () => import('@/pages/Login'),
  '/register': () => import('@/pages/Register'),
  '/about': () => import('@/pages/AboutPage'),
  '/contact': () => import('@/pages/ContactPage'),
  '/refund': () => import('@/pages/RefundPage'),
  '/terms': () => import('@/pages/TermsPage'),
  '/privacy': () => import('@/pages/PrivacyPage'),
  '/forgot-password': () => import('@/pages/ForgotPassword'),
  '/reset-password': () => import('@/pages/ResetPassword'),
  // Manager routes
  '/manager/dashboard': () => import('@/pages/dashboard/ManagerDashboard'),
  '/manager/members': () => import('@/pages/dashboard/MembersPage'),
  '/manager/meals': () => import('@/pages/dashboard/MealsPage'),
  '/manager/bazar': () => import('@/pages/dashboard/BazarPage'),
  '/manager/deposits': () => import('@/pages/dashboard/DepositsPage'),
  '/manager/balance': () => import('@/pages/dashboard/BalancePage'),
  '/manager/additional-costs': () => import('@/pages/dashboard/AdditionalCostsPage'),
  '/manager/notifications': () => import('@/pages/dashboard/NotificationsPage'),
  '/manager/subscription': () => import('@/pages/dashboard/SubscriptionPage'),
  '/manager/payment': () => import('@/pages/dashboard/PaymentPage'),
  '/manager/payment-history': () => import('@/pages/dashboard/PaymentHistoryPage'),
  '/manager/helpdesk': () => import('@/pages/dashboard/ManagerHelpDeskPage'),
  // Member routes
  '/member/dashboard': () => import('@/pages/member/MemberDashboard'),
  '/member/meals': () => import('@/pages/member/MemberMealsPage'),
  '/member/bazar': () => import('@/pages/member/MemberBazarPage'),
  '/member/deposits': () => import('@/pages/member/MemberDepositsPage'),
  '/member/notifications': () => import('@/pages/member/MemberNotificationsPage'),
  '/member/contact': () => import('@/pages/member/MemberContactPage'),
  // Admin routes
  '/admin/dashboard': () => import('@/pages/admin/AdminDashboard'),
  '/admin/subscription': () => import('@/pages/admin/AdminSubscriptionPage'),
  '/admin/mess': () => import('@/pages/admin/AdminMessPage'),
  '/admin/coupon': () => import('@/pages/admin/AdminCouponPage'),
  '/admin/helpdesk': () => import('@/pages/admin/AdminHelpDeskPage'),
  '/admin/messages': () => import('@/pages/admin/AdminMessagesPage'),
};

// Cache for already preloaded routes
const preloadedRoutes = new Set<string>();

/**
 * Preload a route component by path
 */
export function preloadRoute(path: string): void {
  // Normalize path (remove trailing slash, handle hash routes)
  const normalizedPath = path.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  
  if (preloadedRoutes.has(normalizedPath)) {
    return;
  }
  
  const loader = routeComponents[normalizedPath];
  if (loader) {
    preloadedRoutes.add(normalizedPath);
    // Use requestIdleCallback for non-blocking preload
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => loader(), { timeout: 2000 });
    } else {
      setTimeout(() => loader(), 100);
    }
  }
}

/**
 * Preload multiple routes at once
 */
export function preloadRoutes(paths: string[]): void {
  paths.forEach(preloadRoute);
}

/**
 * Preload adjacent routes based on current location
 */
export function preloadAdjacentRoutes(currentPath: string): void {
  const adjacentRoutes: Record<string, string[]> = {
    '/': ['/login', '/register', '/about', '/contact'],
    '/login': ['/register', '/forgot-password', '/manager/dashboard', '/member/dashboard'],
    '/register': ['/login', '/'],
    '/manager/dashboard': ['/manager/members', '/manager/meals', '/manager/subscription'],
    '/manager/members': ['/manager/dashboard', '/manager/meals'],
    '/manager/meals': ['/manager/dashboard', '/manager/bazar'],
    '/manager/bazar': ['/manager/meals', '/manager/deposits'],
    '/manager/deposits': ['/manager/bazar', '/manager/balance'],
    '/manager/balance': ['/manager/deposits', '/manager/dashboard'],
    '/member/dashboard': ['/member/meals', '/member/bazar', '/member/deposits'],
    '/member/meals': ['/member/dashboard', '/member/bazar'],
    '/member/bazar': ['/member/meals', '/member/deposits'],
    '/member/deposits': ['/member/bazar', '/member/dashboard'],
    '/admin/dashboard': ['/admin/subscription', '/admin/mess'],
  };

  const routes = adjacentRoutes[currentPath];
  if (routes) {
    preloadRoutes(routes);
  }
}

export { routeComponents };
