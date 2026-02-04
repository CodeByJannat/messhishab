import { useLocation, useNavigate } from 'react-router-dom';
import { PreloadLink } from '@/components/PreloadLink';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Users,
  Utensils,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Globe,
  CreditCard,
  MessageSquare,
  History,
  Receipt,
  X,
} from 'lucide-react';
import { useState, memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SuspendedMessModal } from './SuspendedMessModal';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { UnreadIndicator } from '@/components/messaging/UnreadIndicator';

const managerNavItems = [
  { href: '/manager/dashboard', icon: Home, labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard' },
  { href: '/manager/members', icon: Users, labelBn: 'মেম্বার', labelEn: 'Members' },
  { href: '/manager/meals', icon: Utensils, labelBn: 'মিল', labelEn: 'Meals' },
  { href: '/manager/bazar', icon: ShoppingCart, labelBn: 'বাজার', labelEn: 'Bazar' },
  { href: '/manager/deposits', icon: Wallet, labelBn: 'জমা', labelEn: 'Deposits' },
  { href: '/manager/additional-costs', icon: Receipt, labelBn: 'অতিরিক্ত খরচ', labelEn: 'Additional Costs' },
  { href: '/manager/balance', icon: BarChart3, labelBn: 'ব্যালেন্স', labelEn: 'Balance' },
  { href: '/manager/messages', icon: MessageSquare, labelBn: 'মেসেজ', labelEn: 'Messages', showUnread: true },
  { href: '/manager/subscription', icon: CreditCard, labelBn: 'সাবস্ক্রিপশন', labelEn: 'Subscription' },
  { href: '/manager/payment-history', icon: History, labelBn: 'পেমেন্ট হিস্ট্রি', labelEn: 'Payment History' },
  { href: '/manager/helpdesk', icon: MessageSquare, labelBn: 'হেল্প ডেস্ক', labelEn: 'Help Desk' },
];

export const DashboardLayout = memo(function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, mess, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { hasUnread, unreadCount } = useUnreadMessages({
    messId: mess?.id,
    isManager: true,
  });

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  }, [language, setLanguage]);

  const handleContactAdmin = useCallback(() => {
    navigate('/manager/helpdesk');
  }, [navigate]);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const isMessSuspended = mess?.status === 'suspended';

  return (
    <div className="min-h-screen bg-background">
      {/* Suspended Mess Modal */}
      <SuspendedMessModal 
        isOpen={isMessSuspended}
        suspendReason={mess?.suspend_reason}
        onContactAdmin={handleContactAdmin}
      />
      
      {/* Mobile Header */}
      <header className="lg:hidden glass-nav fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-3 safe-area-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-xl h-10 w-10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Mess Hishab" className="w-7 h-7 rounded-lg shadow-sm" />
          <span className="font-display font-bold text-sm tracking-tight">
            <span className="text-foreground">Mess</span>
            <span className="text-primary ml-0.5">Hishab</span>
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-xl h-9 w-9">
            <Globe className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-9 w-9">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-card border-r border-border z-50"
          >
            <div className="flex flex-col h-full">
              {/* Logo with close button */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/favicon.png" alt="Mess Hishab" className="w-9 h-9 rounded-xl shadow-md" />
                  <div>
                    <span className="font-display font-bold text-base tracking-tight block">
                      <span className="text-foreground">Mess</span>
                      <span className="text-primary ml-0.5">Hishab</span>
                    </span>
                    {mess && (
                      <span className="text-xs text-muted-foreground">{mess.mess_id}</span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={closeSidebar}
                  className="rounded-xl h-9 w-9"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 overflow-y-auto">
                <ul className="space-y-1">
                  {managerNavItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.href}>
                        <PreloadLink
                          to={item.href}
                          onClick={closeSidebar}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80'
                          }`}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate flex-1">{language === 'bn' ? item.labelBn : item.labelEn}</span>
                          {item.showUnread && hasUnread && !isActive && (
                            <UnreadIndicator count={unreadCount} />
                          )}
                        </PreloadLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bottom Section */}
              <div className="p-3 border-t border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start rounded-xl h-auto py-2">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-medium">{user?.email?.[0].toUpperCase()}</span>
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
                        </p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => { navigate('/manager/settings'); closeSidebar(); }}>
                      <Settings className="w-4 h-4 mr-2" />
                      {language === 'bn' ? 'সেটিংস' : 'Settings'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {language === 'bn' ? 'লগআউট' : 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Always visible on lg+ */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="Mess Hishab" className="w-10 h-10 rounded-xl shadow-md" />
              <div>
                <span className="font-display font-bold text-lg tracking-tight block">
                  <span className="text-foreground">Mess</span>
                  <span className="text-primary ml-0.5">Hishab</span>
                </span>
                {mess && (
                  <span className="text-xs text-muted-foreground">{mess.mess_id}</span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {managerNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <PreloadLink
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="flex-1">{language === 'bn' ? item.labelBn : item.labelEn}</span>
                      {item.showUnread && hasUnread && !isActive && (
                        <UnreadIndicator count={unreadCount} />
                      )}
                    </PreloadLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-xl">
                <Globe className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">{user?.email?.[0].toUpperCase()}</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/manager/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'সেটিংস' : 'Settings'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'লগআউট' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-3 md:p-4 lg:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
});
