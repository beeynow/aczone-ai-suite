import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TextGenerator from "./pages/TextGenerator";
import ImageGenerator from "./pages/ImageGenerator";
import CodeGenerator from "./pages/CodeGenerator";
import ImageEditor from "./pages/ImageEditor";
import VideoGenerator from "./pages/VideoGenerator";
import EmailGenerator from "./pages/EmailGenerator";
import WebsiteGenerator from "./pages/WebsiteGenerator";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import ReleaseNotes from "./pages/ReleaseNotes";
import Terms from "./pages/Terms";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="text" element={<TextGenerator />} />
            <Route path="image" element={<ImageGenerator />} />
            <Route path="code" element={<CodeGenerator />} />
            <Route path="editor" element={<ImageEditor />} />
            <Route path="video" element={<VideoGenerator />} />
            <Route path="email" element={<EmailGenerator />} />
            <Route path="website" element={<WebsiteGenerator />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
            <Route path="releases" element={<ReleaseNotes />} />
            <Route path="terms" element={<Terms />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
