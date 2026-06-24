import { useState } from "react";

const ResumeAnalyzer = () => {
  const [resume, setResume] = useState(null);
  const [role, setRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const handleFileUpload = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = () => {
    // Placeholder logic
    setAnalysis("✅ Resume looks good for the selected role.");
    setSuggestions("🔹 Add more keywords from job description.");
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Resume Analyzer</h1>
        <div className="relative">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
            Username ▼
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel */}
        <div className="bg-white p-8 shadow-lg rounded-xl flex flex-col gap-6 h-fit md:col-span-1">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Upload your Resume</label>
            <input 
              type="file" 
              onChange={handleFileUpload} 
              className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Select your Desired Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select --</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="data">Data Scientist</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Enter Job Description</label>
            <textarea 
              rows="5"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the job description here..."
            />
          </div>

          <button 
            onClick={handleSubmit} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Analyze
          </button>
        </div>

        {/* Right Panel */}
        <div className="md:col-span-2 flex flex-col gap-8">
          <div className="bg-white p-8 shadow-lg rounded-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Analysis</h2>
            <div className="border border-green-300 bg-green-50 p-6 rounded-lg min-h-[150px] text-gray-700">
              {analysis || <span className="text-gray-400 italic">Your analysis will appear here.</span>}
            </div>
          </div>

          <div className="bg-white p-8 shadow-lg rounded-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Suggestions</h2>
            <div className="border border-blue-300 bg-blue-50 p-6 rounded-lg min-h-[150px] text-gray-700">
              {suggestions || <span className="text-gray-400 italic">Suggestions will appear here.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;