import { Card } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Terms & Policy</h1>
        <p className="text-muted-foreground mt-1">
          Last updated: January 15, 2024
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Terms of Service</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              By using AcZone, you agree to these terms. Please read them
              carefully.
            </p>
            <p>
              AcZone provides AI-powered generation tools for personal and
              commercial use. You retain full ownership of content you create
              using our platform.
            </p>
            <p>
              You may not use our service for illegal activities, generating
              harmful content, or violating third-party rights.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Privacy Policy</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              We respect your privacy. All generations are stored locally in
              your browser using localStorage.
            </p>
            <p>
              We do not collect, store, or share your personal data or generated
              content on our servers.
            </p>
            <p>
              API keys are stored securely in your browser and are never
              transmitted to our servers.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Content Policy</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Users are responsible for ensuring their generated content
              complies with applicable laws and regulations.
            </p>
            <p>
              We prohibit generation of content that is illegal, harmful,
              discriminatory, or violates intellectual property rights.
            </p>
            <p>
              Generated images may be subject to the terms of Stable Horde and
              underlying AI models.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              AcZone is provided "as is" without warranties. We are not liable
              for any damages arising from use of the service.
            </p>
            <p>
              AI-generated content may contain errors or inaccuracies. Users
              should verify important information.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-sm text-muted-foreground">
            For questions about these terms, contact us at legal@aczone.com
          </p>
        </section>
      </Card>
    </div>
  );
}
