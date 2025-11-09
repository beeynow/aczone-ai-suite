import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CreateInterview from "./pages/CreateInterview";
import InterviewRoom from "./pages/InterviewRoom";
import CreateMeeting from "./pages/CreateMeeting";
import MeetingRoom from "./pages/MeetingRoom";
import JoinInterview from "./pages/JoinInterview";
import Settings from "./pages/Settings";
import Certificates from "./pages/Certificates";
import QuestionBank from "./pages/QuestionBank";
import Analytics from "./pages/Analytics";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import Leaderboard from "./pages/Leaderboard";
import Referrals from "./pages/Referrals";
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
          <Route path="/join-interview" element={<JoinInterview />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="create-interview" element={<CreateInterview />} />
            <Route path="interview/:id" element={<InterviewRoom />} />
            <Route path="create-meeting" element={<CreateMeeting />} />
            <Route path="meeting/:id" element={<MeetingRoom />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="question-bank" element={<QuestionBank />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="resume-analyzer" element={<ResumeAnalyzer />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
