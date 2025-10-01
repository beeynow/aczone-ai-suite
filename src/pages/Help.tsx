import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

const faqs = [
  {
    question: "How do I generate images?",
    answer:
      "Navigate to the Image Generator page, enter a text prompt describing what you want to create, and click Generate. The AI will create 4 images based on your description using Stable Horde.",
  },
  {
    question: "What is the Stable Horde API?",
    answer:
      "Stable Horde is a crowdsourced distributed cluster of image generation workers. It allows you to generate AI images without needing expensive hardware or API credits.",
  },
  {
    question: "Can I use my own API key?",
    answer:
      "Yes! Go to Settings > API Keys and enter your own Stable Horde API key to override the default one. Your key will be stored securely in your browser.",
  },
  {
    question: "How do I upgrade to Pro?",
    answer:
      "Click the 'Upgrade to Pro' button in the sidebar to access premium features including unlimited generations, priority processing, and advanced AI models.",
  },
  {
    question: "Where is my generation history stored?",
    answer:
      "All your generations are stored locally in your browser using localStorage. This means your data stays private and is available offline.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "Images: JPG, PNG, WebP. Code: JavaScript, Python, TypeScript, Java, C++, Go. Videos: MP4. Websites: HTML with embedded CSS.",
  },
];

export default function Help() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Help & FAQ</h1>
        <p className="text-muted-foreground mt-1">
          Find answers to common questions
        </p>
      </div>

      <Card className="p-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Still need help?</h3>
        <p className="text-muted-foreground mb-4">
          Contact our support team at support@aczone.com or join our community
          Discord server.
        </p>
      </Card>
    </div>
  );
}
