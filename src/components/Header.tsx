import { BarChart3 } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-accent-blue" />
          <h1 className="text-xl font-semibold text-foreground">
            Signal Analyzer
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;