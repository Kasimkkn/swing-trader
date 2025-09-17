
const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full md:pl-[70px] border-b border-border bg-white/5 backdrop-blur-md text-white">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            Signal Analyzer
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;