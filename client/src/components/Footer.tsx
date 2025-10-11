import { Link } from "wouter";
import { Briefcase, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl">Kamgar Naka</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting customers with skilled workers instantly. Verified, safe, and transparent.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    About Us
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Contact
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    How It Works
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* For Workers */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">For Workers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/get-started">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Register as Worker
                  </span>
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Safety Guidelines
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Earnings & Payments
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@kamgarnaka.in</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Mumbai, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kamgar Naka. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
