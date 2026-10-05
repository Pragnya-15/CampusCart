import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { ShoppingCart, GraduationCap, Mail, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 mt-auto">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Logo size="md" light />
            <p className="mt-4 text-sm text-slate-400 max-w-md">
              Buy Smart. Sell Easy. Share More. Your campus marketplace for everything students actually need.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <ShoppingCart size={16} className="text-navy-400" />
                <span>Marketplace</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <GraduationCap size={16} className="text-navy-400" />
                <span>Student Community</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
              <li><Link to="/requests" className="hover:text-white transition-colors">Request Board</Link></li>
              <li><Link to="/impact" className="hover:text-white transition-colors">Sustainability</Link></li>
              <li><Link to="/recommendations" className="hover:text-white transition-colors">Recommendations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link to="/sell" className="hover:text-white transition-colors">Sell an Item</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CampusCart. Built for students, by students.
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Made with <Heart size={12} className="text-red-400 fill-red-400" /> for sustainable campus exchange
          </p>
        </div>
      </div>
    </footer>
  );
}
