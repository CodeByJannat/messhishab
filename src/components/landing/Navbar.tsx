import { useLocation, useNavigate } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, Globe } from "lucide-react";
import { useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = memo(function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "bn" ? "en" : "bn");
  }, [language, setLanguage]);

  const navLinks = [
    { href: "#pricing", label: t("nav.pricing") },
    { href: "#how-it-works", label: t("nav.howItWorks") },
    { href: "#faq", label: t("nav.faq") },
  ];

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const hash = href;
    
    if (location.pathname === "/") {
      // Already on homepage, just scroll to section
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Navigate to homepage with hash
      navigate("/" + hash);
    }
  }, [location.pathname, navigate]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <PreloadLink to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Mess Hishab" className="w-10 h-10 rounded-xl shadow-md" />
            <span className="font-display font-bold text-xl tracking-tight">
              <span className="text-foreground">Mess</span>
              <span className="text-primary ml-1">Hishab</span>
            </span>
          </PreloadLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="rounded-xl"
              title={language === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <PreloadLink to="/login">
              <Button variant="outline" className="rounded-xl">
                {t("nav.login")}
              </Button>
            </PreloadLink>
            <PreloadLink to="/register">
              <Button className="btn-primary-glow">{t("nav.register")}</Button>
            </PreloadLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-xl">
              <Globe className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-xl">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-muted-foreground hover:text-foreground transition-colors font-medium py-2 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      // Delay scroll to allow menu animation to complete
                      setTimeout(() => {
                        if (location.pathname === "/") {
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        } else {
                          navigate("/" + link.href);
                        }
                      }, 150);
                    }}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex gap-3 pt-4">
                  <PreloadLink to="/login" className="flex-1" onClick={closeMenu}>
                    <Button variant="outline" className="w-full rounded-xl">
                      {t("nav.login")}
                    </Button>
                  </PreloadLink>
                  <PreloadLink to="/register" className="flex-1" onClick={closeMenu}>
                    <Button className="w-full btn-primary-glow">{t("nav.register")}</Button>
                  </PreloadLink>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
});
