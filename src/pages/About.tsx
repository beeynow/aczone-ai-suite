import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Target, Users, Zap, Award, Globe } from "lucide-react";

export default function About() {
  return (
    <>
      <Helmet>
        <title>About TryInterview - Founded by beeynow | AI Interview Coach Platform</title>
        <meta 
          name="description" 
          content="Learn about TryInterview, the world's leading AI-powered mock interview practice platform founded by beeynow. Master your interview skills with our intelligent AI interview coach and join thousands of successful candidates worldwide." 
        />
        <meta 
          name="keywords" 
          content="tryinterview.site founder, beeynow, mock interview practice, AI interview coach, interview preparation platform, AI-powered interviews, job interview training, tryinterview about us" 
        />
        <meta property="og:title" content="About TryInterview - Founded by beeynow" />
        <meta property="og:description" content="Discover how beeynow created TryInterview to revolutionize interview preparation with AI technology. Join our global community of successful interview candidates." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://tryinterview.site/about" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <main className="container mx-auto px-4 py-16 max-w-6xl">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <Badge className="mb-4 text-base px-6 py-2">About Us</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Revolutionizing Interview Preparation with AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Welcome to TryInterview - the world's most advanced AI interview coach platform, 
              founded by <strong className="text-foreground">beeynow</strong> to empower job seekers globally
            </p>
          </section>

          {/* Founder Section */}
          <Card className="mb-12 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                Meet the Founder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                  <h2 className="text-2xl font-bold text-primary">beeynow</h2>
                  <p className="text-lg font-semibold text-muted-foreground">Founder & CEO, TryInterview</p>
                  
                  <div className="space-y-4 text-foreground/90 leading-relaxed">
                    <p>
                      <strong>beeynow</strong> is a visionary technologist and the driving force behind TryInterview.site. 
                      With a passion for leveraging artificial intelligence to solve real-world problems, beeynow 
                      identified a critical gap in interview preparation and set out to democratize access to 
                      professional interview coaching.
                    </p>
                    
                    <p>
                      "I created TryInterview because I believe everyone deserves the opportunity to showcase their 
                      best self in interviews. Our AI interview coach provides personalized, judgment-free practice 
                      that adapts to each user's needs - making world-class interview preparation accessible to 
                      anyone, anywhere," says <strong>beeynow</strong>.
                    </p>

                    <p>
                      Under beeynow's leadership, TryInterview has become a trusted platform for mock interview 
                      practice, helping thousands of candidates worldwide land their dream jobs through our innovative 
                      AI-powered interview coaching system.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mission Section */}
          <Card className="mb-12 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-foreground/90 leading-relaxed">
                At TryInterview.site, our mission is to transform the way people prepare for interviews. 
                We combine cutting-edge AI technology with proven interview techniques to provide an 
                unparalleled mock interview practice experience. Whether you're preparing for your first 
                job or your next career move, our AI interview coach is here to help you succeed.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-10">Why Choose TryInterview?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <Bot className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>AI-Powered Coaching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our advanced AI interview coach provides real-time feedback, analyzes your responses, 
                    and offers personalized improvement strategies.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <Zap className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Instant Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get immediate, actionable insights on your interview performance with detailed 
                    scoring across multiple dimensions.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Gamified Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Earn points, unlock achievements, and track your progress on our leaderboards 
                    as you master interview skills.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <Globe className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Global Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Join thousands of users worldwide who are using TryInterview for mock interview 
                    practice and career advancement.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Group Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Practice with peers in group mock interviews, collaborate in virtual meetings, 
                    and learn from each other.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <Target className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Industry-Specific</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Access tailored interview questions and scenarios across various industries 
                    and experience levels.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* SEO Keywords Section */}
          <section className="text-center">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold mb-6">
                  The Future of Interview Preparation
                </h2>
                <p className="text-lg text-foreground/90 max-w-3xl mx-auto leading-relaxed">
                  Founded by <strong>beeynow</strong>, TryInterview.site is more than just a mock interview 
                  practice platform - it's a comprehensive AI interview coach that adapts to your unique needs. 
                  Whether you're searching for "mock interview practice," "AI interview coach," or the 
                  "tryinterview.site founder," you've found the right place to elevate your interview skills 
                  and land your dream job.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Badge variant="secondary" className="text-sm px-4 py-2">Mock Interview Practice</Badge>
                  <Badge variant="secondary" className="text-sm px-4 py-2">AI Interview Coach</Badge>
                  <Badge variant="secondary" className="text-sm px-4 py-2">Founded by beeynow</Badge>
                  <Badge variant="secondary" className="text-sm px-4 py-2">TryInterview.site</Badge>
                  <Badge variant="secondary" className="text-sm px-4 py-2">Interview Preparation</Badge>
                  <Badge variant="secondary" className="text-sm px-4 py-2">Career Success</Badge>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </>
  );
}
