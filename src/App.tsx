import React, { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/themes/prism-tomorrow.css";
import { 
  Play, 
  Sparkles, 
  Info, 
  Trash2, 
  Copy, 
  Check, 
  Code2, 
  ChevronDown,
  Terminal,
  FileCode,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { explainCode, suggestFix } from "./services/geminiService";

const LANGUAGES = [
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "css", name: "CSS" },
  { id: "json", name: "JSON" },
  { id: "bash", name: "Bash" },
];

export default function App() {
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem("code-editor-content");
    return saved || `// Welcome to Code Editor\n// Start writing code here...\n\nfunction helloWorld() {\n  console.log("Hello, World!");\n}\n\nhelloWorld();`;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("code-editor-language") || "javascript";
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  // Auto-save logic
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem("code-editor-content", code);
      localStorage.setItem("code-editor-language", language);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaved(now);
      console.log("Auto-saved at", now);
    }, 30000);

    return () => clearInterval(interval);
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      setCode("");
    }
  };

  const handleAiAction = async (action: "explain" | "fix") => {
    if (!code.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const response = action === "explain" 
        ? await explainCode(code, language)
        : await suggestFix(code, language);
      setAiResponse(response || "No response from AI.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Error: Failed to get AI response. Please check your API key.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#161b22] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Code2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Code Editor</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Powered by Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-gray-700 rounded-lg text-sm font-medium transition-all"
            >
              <FileCode className="w-4 h-4 text-blue-400" />
              {LANGUAGES.find(l => l.id === language)?.name}
              <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showLanguageMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-[#21262d] transition-colors flex items-center justify-between ${language === lang.id ? 'text-blue-400 bg-blue-500/5' : 'text-gray-400'}`}
                    >
                      {lang.name}
                      {language === lang.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleCopy}
            className="p-2.5 bg-[#21262d] hover:bg-[#30363d] border border-gray-700 rounded-lg transition-all group relative"
            title="Copy Code"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400 group-hover:text-white" />}
          </button>

          <button 
            onClick={handleClear}
            className="p-2.5 bg-[#21262d] hover:bg-red-500/10 border border-gray-700 hover:border-red-500/50 rounded-lg transition-all group"
            title="Clear Editor"
          >
            <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[70vh]">
            <div className="px-4 py-2 bg-[#0d1117] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <span className="text-xs text-gray-500 font-mono ml-2">main.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleAiAction("explain")}
                  disabled={isAiLoading}
                  className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  Explain
                </button>
                <button 
                  onClick={() => handleAiAction("fix")}
                  disabled={isAiLoading}
                  className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Fix Errors
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <Editor
                value={code}
                onValueChange={code => setCode(code)}
                highlight={code => Prism.highlight(code, Prism.languages[language] || Prism.languages.javascript, language)}
                padding={24}
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontSize: 14,
                  minHeight: "100%",
                  backgroundColor: "transparent",
                }}
                className="focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-6 text-xs text-gray-500 font-mono">
              <span>Characters: {code.length}</span>
              <span>Lines: {code.split('\n').length}</span>
              {lastSaved && (
                <span className="text-blue-500/60 flex items-center gap-1.5">
                  <Check className="w-3 h-3" />
                  Auto-saved at {lastSaved}
                </span>
              )}
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
              <Play className="w-4 h-4 fill-current" />
              Run Code
            </button>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="space-y-6">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full min-h-[400px]">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold text-white">AI Insights</h2>
              </div>
              {aiResponse && (
                <button 
                  onClick={() => setAiResponse(null)}
                  className="p-1 hover:bg-gray-800 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            <div className="flex-1 p-5 overflow-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {isAiLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full space-y-4 text-center"
                  >
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 animate-pulse">Consulting Gemini Engine...</p>
                  </motion.div>
                ) : aiResponse ? (
                  <motion.div 
                    key="response"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert prose-sm max-w-none"
                  >
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed font-sans">
                      {aiResponse}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full space-y-4 text-center opacity-40"
                  >
                    <Terminal className="w-12 h-12 text-gray-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-400">No active insights</p>
                      <p className="text-xs text-gray-500">Use the AI tools above to analyze your code</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Pro Tip
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              You can use the <span className="text-blue-400 font-semibold">Explain</span> tool to get a step-by-step breakdown of complex logic, or <span className="text-purple-400 font-semibold">Fix Errors</span> to debug syntax issues instantly.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
        .prism-editor__textarea:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  );
}
