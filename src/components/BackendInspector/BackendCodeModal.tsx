import React, { useState, useEffect } from "react";
import { Terminal, Copy, Check, FileCode, Server, Database, Layers } from "lucide-react";
import { api } from "../../services/api";

export const BackendCodeModal: React.FC = () => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>("main.py");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchCode = async () => {
      setLoading(true);
      try {
        const codeMap = await api.getBackendCode();
        setFiles(codeMap);
        if (codeMap["main.py"]) {
          setSelectedFile("main.py");
        } else if (Object.keys(codeMap).length > 0) {
          setSelectedFile(Object.keys(codeMap)[0]);
        }
      } catch (err) {
        console.error("Failed to load backend files", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCode();
  }, []);

  const handleCopy = () => {
    const content = files[selectedFile] || "";
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fileList = Object.keys(files).sort();

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <Server className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Python FastAPI & PostgreSQL Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Backend Specification & REST API Code
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Clean architectural separation for enterprise scale, future mobile apps, and automated pipelines. Fully documented Pydantic v2 schemas and SQLAlchemy 2.0 ORM models.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono-num">Framework</span>
            <span className="text-xs font-bold text-emerald-400 font-mono-num">FastAPI 0.110+</span>
          </div>
          <div className="text-right border-l border-slate-700 pl-3">
            <span className="text-[10px] text-slate-400 block font-mono-num">Database</span>
            <span className="text-xs font-bold text-blue-400 font-mono-num">PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-4 min-h-[550px]">
        {/* Sidebar File List */}
        <div className="bg-slate-50 border-r border-slate-200 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
            Backend Source Files
          </span>
          {fileList.map((file) => {
            const isSelected = selectedFile === file;
            return (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center space-x-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content Area */}
        <div className="md:col-span-3 flex flex-col bg-slate-950 text-slate-200">
          {/* File Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-300 font-semibold">
                /backend/{selectedFile}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer */}
          <div className="p-4 flex-1 overflow-x-auto overflow-y-auto max-h-[600px] text-xs font-mono leading-relaxed select-text">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading code preview...</div>
            ) : (
              <pre className="whitespace-pre text-slate-300">
                <code>{files[selectedFile] || "// File content not available"}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
