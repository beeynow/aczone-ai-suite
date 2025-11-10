import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Check, Briefcase } from "lucide-react";

const templates: Array<{
  id: string;
  industry: string;
  title: string;
  summary: string;
  tags: string[];
  content: string;
}> = [
  {
    id: "software-engineer",
    industry: "Technology",
    title: "Software Engineer",
    summary: "Modern, impact-focused template highlighting projects, impact metrics, and core technologies.",
    tags: ["React", "Node.js", "TypeScript", "Cloud"],
    content: `Full Name\nCity, Country • email@example.com • +1 555-555-5555 • linkedin.com/in/username • github.com/username\n\nSUMMARY\nResults-driven Software Engineer with X years building scalable web applications. Strong in TypeScript, React, Node.js, and cloud-native architectures. Passionate about product impact and developer experience.\n\nSKILLS\nLanguages: TypeScript, JavaScript, Python\nFrameworks: React, Next.js, Node.js, Express\nCloud & DevOps: AWS (Lambda, S3, EC2), Docker, CI/CD\nDatabases: PostgreSQL, MongoDB\n\nEXPERIENCE\nCompany Name — Software Engineer | MM YYYY – Present\n- Built [feature] used by N users; improved conversion by X% (A/B tested)\n- Designed and implemented [service] with Node.js + PostgreSQL, reducing latency by Y%\n- Led migration to CI/CD pipelines, cutting deploy time from A mins to B mins\n\nCompany Name — Frontend Engineer | MM YYYY – MM YYYY\n- Shipped React components library adopted across 3 product teams\n- Implemented accessibility best practices (WCAG AA)\n\nPROJECTS\nProject Name — Open Source\n- Built [project] with [stack]; N stars on GitHub; wrote comprehensive docs/test suite\n\nEDUCATION\nB.Sc. in Computer Science — University Name\n`,
  },
  {
    id: "product-manager",
    industry: "Technology",
    title: "Product Manager",
    summary: "Outcome-driven template focusing on roadmaps, cross-functional leadership, and measurable results.",
    tags: ["Roadmaps", "Stakeholders", "Analytics"],
    content: `Full Name\nCity, Country • email@example.com • +1 555-555-5555 • linkedin.com/in/username\n\nSUMMARY\nProduct Manager with X years leading cross-functional teams to deliver user-centric products. Skilled in discovery, prioritization, experimentation, and analytics.\n\nCORE SKILLS\nProduct Discovery, Roadmapping, OKRs, Data Analysis (SQL), A/B Testing, Stakeholder Management\n\nEXPERIENCE\nCompany — Product Manager | MM YYYY – Present\n- Drove feature [name] increasing retention by X% across Y users\n- Defined and executed roadmap; aligned eng/design/marketing; improved NPS by Z\n- Set up experimentation pipeline; shipped A/B tests leading to +B% conversion\n\nEDUCATION\nB.A. — University Name\n`,
  },
  {
    id: "data-analyst",
    industry: "Data",
    title: "Data Analyst",
    summary: "Clean, ATS-friendly template emphasizing SQL, dashboards, and actionable insights.",
    tags: ["SQL", "Python", "Tableau", "Looker"],
    content: `Full Name\nCity, Country • email@example.com • +1 555-555-5555 • linkedin.com/in/username\n\nSUMMARY\nData Analyst with X years translating business questions into data-driven insights. Proficient in SQL, Python, and dashboarding.\n\nSKILLS\nSQL (CTEs, window functions), Python (pandas), Visualization (Tableau/Looker), Statistics, A/B Testing\n\nEXPERIENCE\nCompany — Data Analyst | MM YYYY – Present\n- Built executive dashboard used weekly; reduced reporting time by 60%\n- Automated ETL scripts in Python saving 10 hrs/week\n- Partnered with PMs to define metrics and run experiments\n\nEDUCATION\nB.Sc. in Statistics — University Name\n`,
  },
  {
    id: "marketing-manager",
    industry: "Marketing",
    title: "Marketing Manager",
    summary: "Metrics-first template with campaign outcomes, CAC/LTV understanding, and channel mix.",
    tags: ["Growth", "Lifecycle", "Content"],
    content: `Full Name\nCity, Country • email@example.com • +1 555-555-5555 • linkedin.com/in/username\n\nSUMMARY\nMarketing leader with X years across lifecycle, content, and paid channels. Delivers measurable pipeline and revenue impact.\n\nCORE SKILLS\nLifecycle (email/push), Paid Channels (Meta/Google), SEO, Content Strategy, Analytics\n\nEXPERIENCE\nCompany — Marketing Manager | MM YYYY – Present\n- Launched [campaign] growing MQLs by X% and reducing CAC by Y%\n- Built content engine: +N organic sessions/mo; +Z% keyword rankings\n\nEDUCATION\nB.A. in Marketing — University Name\n`,
  },
  {
    id: "nurse",
    industry: "Healthcare",
    title: "Registered Nurse",
    summary: "Patient-centered template with clinical competencies and outcomes.",
    tags: ["Clinical", "Patient Care", "EMR"],
    content: `Full Name\nCity, Country • email@example.com • +1 555-555-5555\n\nSUMMARY\nCompassionate RN with X years in acute care settings. Strong in patient education, triage, and EMR documentation.\n\nSKILLS\nClinical Procedures, Care Coordination, EMR (Epic), Medication Administration\n\nEXPERIENCE\nHospital — RN | MM YYYY – Present\n- Managed caseload of N patients/shift with 98% documentation accuracy\n- Educated patients/families, improving satisfaction scores by X%\n\nEDUCATION & CERTIFICATIONS\nB.S.N. — University Name | BLS/ACLS\n`,
  },
];

export default function ResumeTemplates({ onSelect }: { onSelect: (text: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Briefcase className="w-4 h-4" /> Browse Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Industry Templates Library
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <Card key={t.id} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{t.title}</h3>
                    <Badge variant="secondary">{t.industry}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{t.summary}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {t.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  <pre className="bg-muted/50 border rounded-md p-3 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">
                    {t.content}
                  </pre>
                </div>
                <div className="mt-4">
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      onSelect(t.content);
                      setOpen(false);
                    }}
                  >
                    <Check className="w-4 h-4" /> Use Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
