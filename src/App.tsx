import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import Analyse from "./pages/Analyse";
import PortfolioPage from "./components/PortfolioPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<NavLink to="/today" />} />
            <Route path="/today" element={<Index />} />
            <Route path="/analyse" element={<Analyse />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/wishlist" element={<div>Wishlist Page</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;