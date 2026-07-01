import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { makeAuthenticatedRequest } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CodeEditor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const problemId = searchParams.get('id');

  // State Management
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [showOutput, setShowOutput] = useState(false);
  
  // AI review results
  const [aiFeedback, setAiFeedback] = useState(null);
  
  // Time and Layout
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [outputHeight, setOutputHeight] = useState(40);
  const [isDraggingOutput, setIsDraggingOutput] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch target coding problem metadata
  const loadProblemData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let id = problemId;
      // Default fallback: get the first problem from DB if none specified in URL query
      if (!id) {
        const listRes = await makeAuthenticatedRequest(`${API_BASE_URL}/api/coding/problems`);
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.success && listData.problems.length > 0) {
            id = listData.problems[0]._id;
          }
        }
      }

      if (!id) {
        setError('No coding problems found. Please create one on the Practice dashboard.');
        setLoading(false);
        return;
      }

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/coding/problems/${id}`);
      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.problem) {
          setProblem(resData.problem);
          // Load default starter template
          const defaultLang = 'javascript';
          setSelectedLanguage(defaultLang);
          setCode(resData.problem.starterCode?.[defaultLang] || '// Write your solution here');
        } else {
          setError('Could not locate the requested problem details.');
        }
      } else {
        setError('Failed to fetch coding problem from the server.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblemData();
  }, [problemId]);

  // Start/Stop Timer
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive]);

  useEffect(() => {
    setIsTimerActive(true);
    return () => clearInterval(timerRef.current);
  }, []);

  // Update editor templates on language change
  useEffect(() => {
    if (problem) {
      const template = problem.starterCode?.[selectedLanguage] || '// Write your solution here';
      setCode(template);
    }
  }, [selectedLanguage, problem]);

  // Resizing Panels
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOutputMouseDown = (e) => {
    setIsDraggingOutput(true);
    e.preventDefault();
  };

  const handleOutputMouseMove = (e) => {
    if (!isDraggingOutput) return;
    const rightPanel = document.querySelector('.right-panel');
    if (!rightPanel) return;
    const rightPanelRect = rightPanel.getBoundingClientRect();
    const newHeight = ((rightPanelRect.bottom - e.clientY) / rightPanelRect.height) * 100;
    if (newHeight >= 15 && newHeight <= 70) {
      setOutputHeight(newHeight);
    }
  };

  const handleOutputMouseUp = () => {
    setIsDraggingOutput(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDraggingOutput) {
      document.addEventListener('mousemove', handleOutputMouseMove);
      document.addEventListener('mouseup', handleOutputMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleOutputMouseMove);
      document.removeEventListener('mouseup', handleOutputMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleOutputMouseMove);
      document.removeEventListener('mouseup', handleOutputMouseUp);
    };
  }, [isDraggingOutput]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('notionTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'dc2626' },
      ],
      colors: {
        'editor.background': '#fafafa',
        'editor.foreground': '#374151',
        'editorCursor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f3f4f6',
        'editorLineNumber.foreground': '#9ca3af',
        'editor.selectionBackground': '#ddd6fe40',
        'editorWidget.background': '#ffffff',
        'editorWidget.border': '#e5e7eb',
      }
    });
    monaco.editor.setTheme('notionTheme');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Run Code (Dry run of first test case/raw code execution)
  const runCode = async () => {
    if (!code.trim()) {
      setExecutionOutput('❌ Error: No code to execute');
      setShowOutput(true);
      return;
    }

    setIsExecuting(true);
    setShowOutput(true);
    setExecutionOutput('🔄 Compiling and executing code against sample test cases...\n');

    try {
      const payload = {
        code,
        language: selectedLanguage
      };
      
      // If we have a problem, append the dry run first test case
      if (problem && problem.testRunners?.[selectedLanguage] && problem.testCases?.[0]) {
        payload.code = problem.testRunners[selectedLanguage]
          .replace("__USER_CODE__", code)
          .replace("__TEST_INPUT__", problem.testCases[0].input);
      }

      const response = await fetch(`${API_BASE_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      const timestamp = new Date().toLocaleTimeString();
      const status = result.success ? '✅' : '❌';
      const header = `${status} Dry-Run Execution Completed at ${timestamp}\n`;
      const languageInfo = `Language: ${selectedLanguage.toUpperCase()}\n`;
      const separator = '─'.repeat(50) + '\n';
      
      setExecutionOutput(header + languageInfo + separator + (result.output || 'No stdout logs generated.'));
    } catch (error) {
      setExecutionOutput(`❌ Execution Error:\n${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Submit Solution (Evaluates against ALL test cases, logs submission, gets AI review)
  const submitCode = async () => {
    if (!code.trim() || !problem) return;

    setIsSubmitting(true);
    setShowOutput(true);
    setExecutionOutput('🚀 Submitting code to evaluation suite...\n');
    setIsTimerActive(false);

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/coding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem._id,
          code,
          language: selectedLanguage,
          timeSpent
        })
      });

      if (!response.ok) throw new Error('Submission evaluation failed.');
      const result = await response.json();

      if (result.success) {
        const timestamp = new Date().toLocaleTimeString();
        const header = `${result.status === 'Accepted' ? '✅' : '❌'} Submission Status: ${result.status} at ${timestamp}\n`;
        const scoreInfo = `Test Cases: ${result.passedCount} / ${result.totalCount} Passed\n`;
        const separator = '═'.repeat(50) + '\n';
        
        // Build run logs
        let testLog = '';
        if (result.details) {
          result.details.forEach((d, idx) => {
            testLog += `Case ${idx + 1}: ${d.passed ? 'PASS ✅' : 'FAIL ❌'}\n  Input: ${d.input}\n  Expected: ${d.expected}\n  Got: ${d.got}\n\n`;
          });
        }

        setExecutionOutput(header + scoreInfo + separator + testLog);
        
        // Save AI feedback and switch activeTab to 'ai review'
        setAiFeedback(result.aiFeedback);
        setActiveTab('ai review');
      } else {
        setExecutionOutput(`❌ Submission failed: ${result.message}`);
      }
    } catch (error) {
      setExecutionOutput(`❌ Error submitting solution:\n${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Hard': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <svg className="animate-spin h-10 w-10 text-slate-900 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-600 font-bold">Spinning up code workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center bg-white p-8 rounded-3xl shadow border border-slate-100 space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-slate-800">Workspace Error</h2>
          <p className="text-slate-600 text-sm">{error}</p>
          <button 
            onClick={() => navigate('/practice')}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-bold shadow text-sm transition"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen bg-white flex relative overflow-hidden">
      
      {/* Left Panel - Description, solution reviews */}
      <div 
        className="border-r border-slate-200 flex flex-col transition-all duration-200 bg-white"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {/* Problem Header */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate('/practice')}
                  className="px-2.5 py-1 text-xs border border-slate-200 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                {problem.title}
              </h1>
              <div className="flex items-center space-x-3 text-sm mt-3">
                <span className={`px-3 py-0.5 border text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
                <span className="text-slate-500 font-semibold">{problem.category || 'General'}</span>
                <span className="text-slate-400 font-semibold">•</span>
                <span className="text-slate-500 font-medium">Acceptance: {problem.acceptance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50">
          <nav className="flex space-x-6 px-6">
            {[
              { id: 'description', label: 'Description' },
              { id: 'ai review', label: '✨ AI Code Review' },
              { id: 'submissions', label: 'Submissions History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'description' && (
            <div className="space-y-6">
              
              {/* Problem description markup */}
              <div 
                className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              />

              {/* Examples rendered */}
              <div>
                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Examples</h3>
                {problem.examples.map((example, index) => (
                  <div key={index} className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="font-bold text-slate-800 text-xs mb-2">Example {index + 1}:</div>
                    <div className="space-y-1 text-xs font-mono text-slate-700 leading-snug">
                      <div><strong>Input:</strong> {example.input}</div>
                      <div><strong>Output:</strong> {example.output}</div>
                      {example.explanation && (
                        <div className="mt-2 text-slate-500 font-sans"><strong>Explanation:</strong> {example.explanation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Constraints list */}
              {problem.constraints && problem.constraints.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Constraints</h3>
                  <ul className="space-y-1 text-slate-600 text-xs font-mono">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-slate-400 mr-2">•</span>
                        <code>{constraint}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow Up block */}
              {problem.followUp && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <div className="font-bold text-indigo-900 text-xs uppercase tracking-wider mb-1">Follow-up:</div>
                  <div className="text-indigo-800 text-xs leading-relaxed">{problem.followUp}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai review' && (
            <div className="space-y-6">
              {aiFeedback ? (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Readiness & complexity metrics banner */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-2xl text-center">
                      <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Interview Readiness</div>
                      <div className="text-lg font-black text-indigo-950 mt-1">{aiFeedback.interviewReadiness}</div>
                    </div>
                    <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl text-center">
                      <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Time / Space Complexity</div>
                      <div className="text-lg font-black text-emerald-950 mt-1">{aiFeedback.timeComplexity} / {aiFeedback.spaceComplexity}</div>
                    </div>
                  </div>

                  {/* Feedback grid */}
                  <div className="space-y-4">
                    
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <h4 className="font-bold text-slate-900 text-sm">Correctness & Code Quality</h4>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">{aiFeedback.correctness || 'Correctness looks good.'} • {aiFeedback.codeQuality}</p>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <h4 className="font-bold text-slate-900 text-sm">Readability & Naming Conventions</h4>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">Readability: <strong>{aiFeedback.readability}</strong>. Naming conventions are evaluated as <strong>{aiFeedback.naming}</strong>.</p>
                    </div>

                    {aiFeedback.optimizationOpportunities && (
                      <div className="p-4 border border-amber-100 bg-amber-50/20 rounded-2xl">
                        <h4 className="font-bold text-amber-900 text-sm">💡 Optimization Opportunities</h4>
                        <p className="text-amber-800 text-xs mt-1 leading-relaxed">{aiFeedback.optimizationOpportunities}</p>
                      </div>
                    )}

                    <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl">
                      <h4 className="font-bold text-slate-200 text-sm">Detailed AI Review Summary</h4>
                      <p className="text-slate-300 text-xs mt-2 leading-relaxed whitespace-pre-line">{aiFeedback.detailedReview}</p>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="font-bold text-slate-800 text-base">AI Code Mentor</h3>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed">
                    Submit your solution to trigger an automated AI analysis detailing correctness, time complexity, readability, and interview readiness feedback.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-slate-800 text-base">Submission History Log</h3>
              <p className="text-slate-500 text-xs max-w-xs mx-auto mt-1">Submit multiple solutions to see how your scores, runtime, and complexities improve over time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel resizing handle */}
      <div
        className={`w-1 bg-slate-200 hover:bg-slate-300 cursor-ew-resize flex-shrink-0 relative group ${
          isDragging ? 'bg-indigo-400' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-slate-300 group-hover:bg-opacity-50 transition-colors"></div>
      </div>

      {/* Right Panel - Monaco Editor & Output Terminal */}
      <div 
        className="flex-1 flex flex-col bg-slate-50 right-panel"
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        
        {/* Editor Settings Header */}
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="border border-slate-200 bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="font-medium">{selectedLanguage.toUpperCase()} environment ready</span>
              </div>
              
              <div className={`text-sm flex items-center space-x-1 font-semibold ${isTimerActive ? 'text-slate-600' : 'text-slate-400'}`}>
                <span>⏱️ Time: {formatTime(timeSpent)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCode(problem.starterCode?.[selectedLanguage] || '')}
                className="px-3.5 py-2.5 text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Reset Template
              </button>
              <button
                onClick={runCode}
                disabled={isExecuting || isSubmitting}
                className="px-4 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {isExecuting ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={submitCode}
                disabled={isExecuting || isSubmitting}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Evaluating...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {/* Monaco Editor Component */}
        <div 
          className="flex-1 transition-all duration-200"
          style={{ height: showOutput ? `${100 - outputHeight}%` : '100%' }}
        >
          <Editor
            height="100%"
            language={selectedLanguage}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              lineHeight: 24,
              renderLineHighlight: 'gutter',
              selectionHighlight: false,
              occurrencesHighlight: false,
              contextmenu: false,
            }}
          />
        </div>

        {/* Output Panel resizing anchor */}
        {showOutput && (
          <div
            className={`h-1 bg-slate-200 hover:bg-indigo-300 cursor-ns-resize flex-shrink-0 relative group ${
              isDraggingOutput ? 'bg-indigo-400' : ''
            }`}
            onMouseDown={handleOutputMouseDown}
          >
            <div className="absolute inset-x-0 -top-1 -bottom-1"></div>
          </div>
        )}

        {/* Interactive Output Panel Terminal */}
        {showOutput && (
          <div 
            className="bg-white border-t border-slate-200 flex flex-col transition-all duration-200"
            style={{ height: `${outputHeight}%` }}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Output Terminal</span>
                {isExecuting && <span className="text-xs text-indigo-600 animate-pulse font-medium">Executing code dry-run...</span>}
                {isSubmitting && <span className="text-xs text-emerald-600 animate-pulse font-medium">Submitting cases to MongoDB compiler...</span>}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowOutput(false)}
                  className="p-1 hover:bg-slate-200 rounded-md transition text-slate-500 font-semibold text-xs"
                >
                  ✕ Close Terminal
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {executionOutput}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default CodeEditor;
