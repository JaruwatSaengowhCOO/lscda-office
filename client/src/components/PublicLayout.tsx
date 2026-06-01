import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLoginUrl } from "@/const";

const LOGO_URL = "/uploads/DAOCoLS.webp";

const navLinks = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About DA Office", href: "/about" },
      { label: "History", href: "/about/history" },
      { label: "Organizational Structure", href: "/about/org-structure" },
      { label: "Rules & Regulations", href: "/about/rules" },
      { label: "Privacy Policy", href: "/about/privacy-policy" },
    ],
  },
  {
    label: "News & Notices",
    href: "/press-releases",
    children: [
      { label: "Press Releases", href: "/press-releases" },
      { label: "Public Notices", href: "/notices" },
    ],
  },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Submit a Tip", href: "/services/tip" },
      { label: "Submit a Request", href: "/services/request" },
      { label: "Check Case Status", href: "/services/case-status" },
      { label: "Download Documents", href: "/services/documents" },
    ],
  },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

function DropdownNav({ link, currentPath }: { link: typeof navLinks[0]; currentPath: string }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    // Small delay so mouse can travel to the dropdown without it closing
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          currentPath.startsWith(link.href!)
            ? "text-accent bg-accent/10"
            : "text-foreground/80 hover:text-foreground hover:bg-muted"
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {link.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Invisible bridge between button and dropdown to prevent gap-triggered close */}
      {open && (
        <div className="absolute top-full left-0 w-full h-2" />
      )}

      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 w-56 bg-white dark:bg-navy-800 border border-border rounded-lg shadow-xl py-1 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {link.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Bar */}
      <div className="bg-navy-gradient text-white py-1.5 px-4 text-xs hidden md:block">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-6 text-white/70">
            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> (213) 974-3512</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> da@lscda.gov</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> 210 W Temple St, Los Santos</span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <span>Office Hours: Mon–Fri 8:00 AM – 5:00 PM</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src={LOGO_URL}
                alt="DA Office of County of Los Santos"
                className="w-11 h-11 rounded-full object-cover shadow-md group-hover:shadow-lg transition-shadow"
              />
              <div className="hidden sm:block">
                <div className="font-serif font-bold text-sm leading-tight text-foreground">
                  Los Santos County
                </div>
                <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                  District Attorney's Office
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) =>
                link.children ? (
                  <DropdownNav key={link.label} link={link} currentPath={location} />
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      location === link.href
                        ? "text-accent bg-accent/10"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                className="hidden md:flex bg-navy-gradient text-white hover:opacity-90 border-0 font-medium"
              >
                <a href={getLoginUrl()}>Staff Portal</a>
              </Button>
              <button
                className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-white dark:bg-navy-900 py-3 px-4">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.children ? (
                  <>
                    <button
                      className="flex items-center justify-between w-full py-2.5 text-sm font-medium text-foreground/80 hover:text-foreground border-b border-border/50"
                      onClick={() => setMobileExpanded(mobileExpanded === link.label ? null : link.label)}
                    >
                      {link.label}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === link.label && "rotate-180")} />
                    </button>
                    {mobileExpanded === link.label && link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block py-2 pl-4 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className="block py-2.5 text-sm font-medium text-foreground/80 hover:text-foreground border-b border-border/50 last:border-0"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <Button asChild size="sm" className="mt-3 w-full bg-navy-gradient text-white">
              <a href={getLoginUrl()}>Staff Portal Login</a>
            </Button>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 page-enter">{children}</main>

      {/* Footer */}
      <footer className="bg-navy-gradient text-white mt-auto">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={LOGO_URL} alt="DA Office" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-serif font-bold text-sm">Los Santos County</div>
                  <div className="text-xs text-white/60 uppercase tracking-wide">District Attorney</div>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Committed to justice, integrity, and the safety of our community.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-accent mb-3 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {[
                  { label: "About DA Office", href: "/about" },
                  { label: "History", href: "/about/history" },
                  { label: "Press Releases", href: "/press-releases" },
                  { label: "Careers", href: "/careers" },
                  { label: "Contact Us", href: "/contact" },
                ].map(l => (
                  <li key={l.href}><Link href={l.href} className="hover:text-accent transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold text-accent mb-3 text-sm uppercase tracking-wider">Services</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {[
                  { label: "Submit a Tip", href: "/services/tip" },
                  { label: "Submit a Request", href: "/services/request" },
                  { label: "Check Case Status", href: "/services/case-status" },
                  { label: "Download Documents", href: "/services/documents" },
                ].map(l => (
                  <li key={l.href}><Link href={l.href} className="hover:text-accent transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-accent mb-3 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" /><span>210 W Temple St, Suite 1800<br />Los Santos, SA 90012</span></li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-accent" />(213) 974-3512</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-accent" />da@lscda.gov</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/40">
            <span>© {new Date().getFullYear()} Los Santos County District Attorney's Office. All rights reserved.</span>
            <span className="flex gap-4">
              <Link href="/about/privacy-policy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
              <Link href="/about/rules" className="hover:text-white/70 transition-colors">Rules & Regulations</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
