import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import MorningRecommendations from "./components/MorningRecommendations";
import PortfolioPage from "./components/PortfolioPage";
import Analyse from "./pages/Analyse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Redirect "/" to "/portfolio" */}
            <Route path="/" element={<Navigate to="/portfolio" replace />} />
            <Route path="/today" element={<MorningRecommendations />} />
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