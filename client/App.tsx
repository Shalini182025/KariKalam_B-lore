import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EventRegistration from "./pages/EventRegistration";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";
import Admin from "./pages/Admin";
import Reception from "./pages/Reception";
import { PlaceholderPage, SiteLayout, ReservationProvider } from "@/components/SiteLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ReservationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['receptionist', 'admin']} />}>
              <Route path="/reception" element={<Reception />} />
            </Route>
            <Route path="/keda-virundhu" element={<EventRegistration />} />
            <Route path="/event-registration" element={<EventRegistration />} />
            <Route path="/my-bookings" element={<SiteLayout><MyBookings /></SiteLayout>} />
            <Route path="/login" element={<SiteLayout><Login /></SiteLayout>} />
            <Route path="/privacy-policy" element={<SiteLayout><PlaceholderPage title="Privacy Policy" /></SiteLayout>} />
            <Route path="/terms" element={<SiteLayout><PlaceholderPage title="Terms & Conditions" /></SiteLayout>} />
            <Route path="*" element={<SiteLayout><NotFound /></SiteLayout>} />
          </Routes>
        </BrowserRouter>
      </ReservationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
