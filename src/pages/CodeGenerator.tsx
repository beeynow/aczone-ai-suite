import { useState } from "react";
import { Code, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsLoading(true);

    // Mock code generation
    setTimeout(() => {
      const mockCode = `// Generated ${language} code for: ${prompt}

${language === "javascript" ? `
function ${prompt.replace(/\s+/g, "")}() {
  console.log("Hello from generated code!");
  
  // Your implementation here
  const result = performOperation();
  
  return result;
}

function performOperation() {
  // Mock implementation
  return { success: true, data: [] };
}

// Usage example
${prompt.replace(/\s+/g, "")}();
` : language === "python" ? `
def ${prompt.replace(/\s+/g, "_").toLowerCase()}():
    """
    Generated Python code for: ${prompt}
    """
    print("Hello from generated code!")
    
    # Your implementation here
    result = perform_operation()
    
    return result

def perform_operation():
    # Mock implementation
    return {"success": True, "data": []}

# Usage example
${prompt.replace(/\s+/g, "_").toLowerCase()}()
` : `
// ${language} code
public class GeneratedCode {
    public static void main(String[] args) {
        System.out.println("Hello from generated code!");
        
        // Your implementation here
        Object result = performOperation();
    }
    
    private static Object performOperation() {
        // Mock implementation
        return new Object();
    }
}
`}`;

      setGeneratedCode(mockCode);
      setIsLoading(false);
      toast.success("Code generated successfully!");

      // Save to localStorage
      const history = JSON.parse(localStorage.getItem("codeHistory") || "[]");
      localStorage.setItem(
        "codeHistory",
        JSON.stringify([
          ...history,
          { prompt, language, code: mockCode, timestamp: Date.now() },
        ])
      );
    }, 1500);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Code Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate code snippets in multiple languages
        </p>
      </div>

      {/* Input */}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the code you want to generate..."
              rows={3}
            />
          </div>
          <div className="space-y-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="go">Go</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateCode} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Output */}
      {generatedCode && (
        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-6 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span className="text-sm font-medium">{language}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={copyCode}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="p-6 bg-card">
            <pre className="text-sm overflow-x-auto">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!generatedCode && !isLoading && (
        <Card className="p-12 text-center">
          <Code className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No code generated yet</h3>
          <p className="text-muted-foreground">
            Enter a prompt above to start generating code
          </p>
        </Card>
      )}
    </div>
  );
}
