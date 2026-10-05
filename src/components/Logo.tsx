import { ShoppingCart, GraduationCap } from 'lucide-react';

export function Logo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', cart: 14 },
    md: { icon: 'w-9 h-9', text: 'text-xl', cart: 18 },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', cart: 24 },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <div className={`${s.icon} rounded-xl bg-gradient-to-br from-navy-500 to-brand-600 flex items-center justify-center relative shadow-lg shadow-navy-500/30`}>
        <ShoppingCart size={s.cart} className="text-white" strokeWidth={2.5} />
        <GraduationCap size={s.cart * 0.7} className="text-white absolute -top-1 -right-1 bg-brand-600 rounded-full p-0.5 shadow-md" strokeWidth={2.5} />
      </div>
      <span className={`${s.text} font-display font-bold tracking-tight ${light ? 'text-white' : 'text-navy-900'}`}>
        Campus<span className="text-navy-500">Cart</span>
      </span>
    </div>
  );
}
