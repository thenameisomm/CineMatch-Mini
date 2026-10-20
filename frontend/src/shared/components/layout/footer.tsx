import { Link } from 'react-router-dom';
import { Film, Heart, Database, GitBranch } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50" role="contentinfo">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold text-primary"
              aria-label="CineMatch Home"
            >
              <Film className="h-6 w-6" />
              <span>CineMatch</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Intelligent entertainment discovery platform. Find movies and TV shows you'll love
              with natural-language search and personalized recommendations.
            </p>
          </div>

          <nav aria-label="Product links">
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/browse" className="hover:text-foreground transition-colors">
                  Browse
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-foreground transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-foreground transition-colors">
                  Recommendations
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-foreground transition-colors">
                  Watchlist
                </Link>
              </li>
              <li>
                <Link to="/ratings" className="hover:text-foreground transition-colors">
                  Ratings
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <div className="space-y-4">
            <h3 className="font-semibold">Connect</h3>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <GitBranch className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
              Built for movie lovers
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" aria-hidden="true" />
              Powered by local MongoDB
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CineMatch. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
