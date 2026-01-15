import { Suspense } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check, ArrowRight, Shield, Bot, Video, BarChart3, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/OptimizedImage";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
              TryInterview
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/about">About</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="gradient-primary text-white">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_30%,transparent_70%)]">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[480px] w-[960px] rounded-full bg-gradient-primary blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="mb-4" variant="secondary">AI-Powered Coaching</Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Ace your next interview with real-time AI feedback
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Practice mock interviews tailored to your role and experience, get instant feedback, and see exactly where to improve.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="gradient-primary text-white">
                <Link to="/auth">Start Practicing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/about">Learn more</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Real-time feedback</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Role-specific questions</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Detailed analytics</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Certificates</div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-xl border border-border bg-card/50 p-2 shadow-sm">
              <Suspense fallback={<div className="aspect-video w-full rounded-lg bg-muted animate-pulse" /> }>
                <OptimizedImage
                  src="/placeholder.svg"
                  alt="Interview preview"
                  className="rounded-lg w-full"
                  loading="lazy"
                  priority={false}
                />
              </Suspense>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden sm:block">
              <Card className="shadow-lg">
                <CardContent className="p-4 flex items-center gap-3">
                  <Bot className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">AI Coach</div>
                    <div className="text-xs text-muted-foreground">Personalized guidance</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / Social Proof */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center text-xs uppercase tracking-wider text-muted-foreground">Trusted by candidates and teams at</div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 items-center opacity-70">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-muted/60" />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-2 text-muted-foreground">From setup to insights in minutes</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[{
              icon: Sparkles, title: "Choose your role", desc: "Pick a role and seniority to tailor the questions."
            },{
              icon: Video, title: "Run the mock", desc: "Answer realistic questions with time-boxed prompts."
            },{
              icon: BarChart3, title: "Review & improve", desc: "Get instant feedback and a plan to level up."
            }].map((s, i) => (
              <Card key={i} className="bg-background/80">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Features */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className="text-3xl font-bold">Everything you need to practice smarter</div>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /> Role, seniority, and domain-specific interview sets</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /> Real-time hints and structured feedback after each answer</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /> Benchmarking, trends, and targeted improvement plan</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /> Certificates and shareable summaries</li>
              </ul>
              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <Link to="/auth">Try a mock now</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/about">See features</Link>
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="rounded-xl border border-border bg-card/50 p-2 shadow-sm">
                <Suspense fallback={<div className="aspect-video w-full rounded-lg bg-muted animate-pulse" /> }>
                  <OptimizedImage
                    src="/placeholder.svg"
                    alt="Analytics preview"
                    className="rounded-lg w-full"
                    loading="lazy"
                    priority={false}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-2 text-muted-foreground">Start free, upgrade when you're ready</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[{
              name: "Starter", price: "Free", features: ["Basic mock interviews", "Email support", "Community access"], highlighted: false
            },{
              name: "Pro", price: "$12/mo", features: ["Unlimited mocks", "Advanced analytics", "Priority support"], highlighted: true
            },{
              name: "Team", price: "$29/mo", features: ["Team analytics", "Shared question bank", "Admin controls"], highlighted: false
            }].map((p, i) => (
              <Card key={i} className={`bg-background/80 ${p.highlighted ? 'ring-1 ring-primary' : ''}`}>
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-semibold">{p.name}</div>
                    {p.highlighted && <Badge className="bg-primary text-primary-foreground">Popular</Badge>}
                  </div>
                  <div className="text-3xl font-bold">{p.price}</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-2 w-full">
                    <Link to="/auth">Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Loved by candidates</h2>
            <p className="mt-2 text-muted-foreground">Real stories from people who landed offers</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { quote: "The feedback was specific and actionable. I improved in one week more than in months before.", name: "Alex P.", role: "Frontend Engineer" },
              { quote: "I finally understood what I was doing wrong. The analytics made it obvious.", name: "Maya R.", role: "Data Scientist" },
              { quote: "I practiced system design with tailored prompts—felt like a real interview.", name: "Sam K.", role: "Backend Engineer" },
            ].map((t, i) => (
              <Card key={i} className="bg-background/80">
                <CardContent className="p-6">
                  <div className="text-sm">“{t.quote}”</div>
                  <div className="mt-4 text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
            <p className="mt-2 text-muted-foreground">Everything you need to know</p>
          </div>
          <div className="mt-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is there a free plan?</AccordionTrigger>
                <AccordionContent>Yes. You can start with the Starter plan for free and upgrade anytime.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I practice for specific roles?</AccordionTrigger>
                <AccordionContent>Absolutely. Pick your role, seniority, and domain to tailor the interview.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How does feedback work?</AccordionTrigger>
                <AccordionContent>After each answer, you’ll receive structured, actionable feedback and an improvement plan.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-transparent to-primary/10 p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xl font-semibold">Ready to get started?</div>
              <div className="text-sm text-muted-foreground">Create an account and run your first mock interview in minutes.</div>
            </div>
            <Button asChild size="lg" className="gradient-primary text-white">
              <Link to="/auth" className="inline-flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} TryInterview. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
