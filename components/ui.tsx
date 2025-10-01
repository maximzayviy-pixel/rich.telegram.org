import { cn } from '../lib/utils';
export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-soft", className)}>{children}</div>
);
export const Button = ({ className, children, ...props }: any) => (
  <button className={cn("px-4 py-2 rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition", className)} {...props}>{children}</button>
);
