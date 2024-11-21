"use client"
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import { CodeInput } from "@/components/CodeInput";

export default function Home() {
  const [userQuestion, setUserQuestion] = useState("");
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant. Always respond using Markdown. \
Format your answers with proper headers, paragraphs, and code blocks where appropriate to improve readability"
  );
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPromptSettings, setShowPromptSettings] = useState(false);

  const handleSubmit = async () => {
    let userMessage:string = prompt + userQuestion;

    console.log("FULL PROMPT \n", userMessage);
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userMessage,
          systemPrompt,
          temperature,
          top_p: topP
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error fetching API:", error);
      setResponse("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side: Input */}
      <div className="w-1/2 flex flex-col p-8 border-r border-gray-300">
        <h1 className="text-4xl font-bold mb-6">Qwen2.5 Chat</h1>
        <div className="w-full space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowPromptSettings(!showPromptSettings)}
                className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
              >
                <Info size={16} />
                {showPromptSettings ? "Hide Settings" : "Show Settings"}
              </button>
            </div>

            {showPromptSettings && (
              <Card className="mb-4">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">System Prompt</Label>
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Enter system prompt..."
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="font-medium">Temperature: {temperature}</Label>
                        <span className="text-sm text-gray-500">
                          Controls randomness (0 = deterministic, 1 = creative)
                        </span>
                      </div>
                      <Slider
                        value={[temperature]}
                        onValueChange={(value) => setTemperature(value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="font-medium">Top P: {topP}</Label>
                        <span className="text-sm text-gray-500">
                          Controls focus (lower = more focused on likely tokens)
                        </span>
                      </div>
                      <Slider
                        value={[topP]}
                        onValueChange={(value) => setTopP(value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded mb-4"
              placeholder="Enter your message"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
            />
            <CodeInput onUpdatePrompt={setPrompt} />
            <button
              className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Response */}
      <div className="w-1/2 p-8">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        )}
        {!loading && response && (
          <div className="p-1 rounded border-gray-300 markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const isBlockCode = !!className;
                  return isBlockCode ? (
                    <SyntaxHighlighter
                      style={prism}
                      language={className?.replace("language-", "") || ""}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).trim()}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-200 p-1 rounded text-sm">{children}</code>
                  );
                },
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}