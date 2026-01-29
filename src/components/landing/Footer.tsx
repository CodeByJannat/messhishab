import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Facebook, MessageCircle } from 'lucide-react';

export function Footer() {
  const { t, language } = useLanguage();
  const currentYear = new Date().getFullYear();

  const links = [
    { key: 'footer.about', href: '/about' },
    { key: 'footer.contact', href: '/contact' },
    { key: 'footer.refund', href: '/refund' },
    { key: 'footer.terms', href: '/terms' },
    { key: 'footer.privacy', href: '/privacy' },
  ];

  return (
    <footer className="border-t border-border py-12">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <span className="font-bold text-xl text-foreground">MessHishab</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 glass-card flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Facebook className="w-5 h-5 text-foreground" />
            </a>
            <a
              href="https://wa.me/8801XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 glass-card flex items-center justify-center hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-5 h-5 text-foreground" />
            </a>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-8 border-t border-border text-center space-y-2">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Mess Hishab. {language === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
          <p className="text-muted-foreground text-sm">
            {language === 'bn' ? 'ডেভেলপড বাই ' : 'Developed by '}
            <a
              href="https://softauro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Softauro
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
