import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Bell,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Globe,
  CreditCard,
  MessageSquare,
  History,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SuspendedMessModal } from './SuspendedMessModal';

const managerNavItems = [
  { href: '/dashboard', icon: Home, labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard' },
  { href: '/dashboard/members', icon: Users, labelBn: 'মেম্বার', labelEn: 'Members' },
  { href: '/dashboard/meals', icon: Utensils, labelBn: 'মিল', labelEn: 'Meals' },
  { href: '/dashboard/bazar', icon: ShoppingCart, labelBn: 'বাজার', labelEn: 'Bazar' },
  { href: '/dashboard/deposits', icon: Wallet, labelBn: 'জমা', labelEn: 'Deposits' },
  { href: '/dashboard/balance', icon: BarChart3, labelBn: 'ব্যালেন্স', labelEn: 'Balance' },
  { href: '/dashboard/notifications', icon: Bell, labelBn: 'নোটিফিকেশন', labelEn: 'Notifications' },
  { href: '/dashboard/subscription', icon: CreditCard, labelBn: 'সাবস্ক্রিপশন', labelEn: 'Subscription' },
  { href: '/dashboard/payment-history', icon: History, labelBn: 'পেমেন্ট হিস্ট্রি', labelEn: 'Payment History' },
  { href: '/dashboard/helpdesk', icon: MessageSquare, labelBn: 'হেল্প ডেস্ক', labelEn: 'Help Desk' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, mess, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const handleContactAdmin = () => {
    navigate('/dashboard/helpdesk');
  };

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
      <header className="lg:hidden glass-nav fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="rounded-xl"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">M</span>
          </div>
          <span className="font-bold text-foreground">MessHishab</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-xl">
            <Globe className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
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
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 glass-card rounded-none z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">M</span>
              </div>
              <div>
                <span className="font-bold text-lg text-foreground block">MessHishab</span>
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
                    <Link
                      to={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-border">
            <div className="hidden lg:flex items-center gap-2 mb-4">
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
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
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
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
