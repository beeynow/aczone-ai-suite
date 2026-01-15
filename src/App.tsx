import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateInterview = lazy(() => import("./pages/CreateInterview"));
const InterviewRoom = lazy(() => import("./pages/InterviewRoom"));
const CreateMeeting = lazy(() => import("./pages/CreateMeeting"));
const MeetingRoom = lazy(() => import("./pages/MeetingRoom"));
const JoinInterview = lazy(() => import("./pages/JoinInterview"));
const JoinMeetingByCode = lazy(() => import("./pages/JoinMeetingByCode"));
const Settings = lazy(() => import("./pages/Settings"));
const Certificates = lazy(() => import("./pages/Certificates"));
const QuestionBank = lazy(() => import("./pages/QuestionBank"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ResumeAnalyzer = lazy(() => import("./pages/ResumeAnalyzer"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Achievements = lazy(() => import("./pages/Achievements"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen grid place-items-center"><LoadingSpinner size="lg" /></div>}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/join-interview" element={<JoinInterview />} />
            <Route path="/join-meeting/:code" element={<JoinMeetingByCode />} />
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
              <Route path="achievements" element={<Achievements />} />
              <Route path="about" element={<About />} />
              <Route path="terms" element={<Terms />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
