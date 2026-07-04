import { useState, useEffect } from 'react';
import { LayoutDashboard, User, BarChart, LineChart, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { makeAuthenticatedRequest } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// A helper component to dynamically render the Bar Chart
const ScoreBarChart = ({ topicAnalysis }) => {
  const maxScore = 100;
  return (
    <div className="flex w-full h-48 items-end justify-around p-4 space-x-4">
      {topicAnalysis.map((item) => {
        const heightPercentage = `${(item.score / maxScore) * 100}%`;
        const barColor = item.score > 80 ? 'bg-green-500' : item.score > 60 ? 'bg-yellow-500' : 'bg-red-500';

        return (
          <div key={item.topic} className="flex flex-col items-center group cursor-help relative">
            <div
              style={{ height: heightPercentage }}
              className={`w-10 ${barColor} rounded-t-lg transition-all duration-500 ease-out shadow-md hover:shadow-xl`}
            ></div>
            <p className="text-xs mt-2 text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis w-10 text-center" title={item.topic}>
              {item.topic.split(' ')[0]}
            </p>
            {/* Tooltip on hover */}
            <span className="absolute bottom-full mb-2 hidden group-hover:block px-3 py-1 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-25 whitespace-nowrap">
              {item.topic}: {item.score}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

// A helper component to dynamically render a simple Line Chart using SVG
const ProgressLineChart = ({ progress }) => {
  if (!progress || progress.length < 2) {
    // If we only have 1 data point, we need at least 2 to draw a line. Let's make an artificial start or single dot
    if (progress && progress.length === 1) {
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <circle cx="50" cy={100 - progress[0]} r="4" fill="#1e40af" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#d1d5db" strokeDasharray="1,1" strokeWidth="0.5" />
          <text x="0" y="52" fill="#6b7280" fontSize="4" dominantBaseline="hanging">50%</text>
        </svg>
      );
    }
    return <div className="text-center text-gray-500 py-10">Complete more interviews to view progress trend.</div>;
  }
  
  const maxProgress = 100;
  const points = progress.map((value, index) => {
    const x = (index / (progress.length - 1)) * 100;
    // In SVG, Y=0 is the top, so we subtract from maxProgress (100)
    const y = maxProgress - (value / maxProgress) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      {/* Line connecting the points */}
      <polyline
        fill="none"
        stroke="#3b82f6" // Tailwind's blue-500
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Points (Circles) */}
      {progress.map((value, index) => {
        const cx = (index / (progress.length - 1)) * 100;
        const cy = maxProgress - (value / maxProgress) * 100;
        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r="2"
            fill="#1e40af" // Tailwind's blue-800 for the points
          />
        );
      })}
      {/* Horizontal lines for context (e.g., 50% and 100%) */}
      <line x1="0" y1="50" x2="100" y2="50" stroke="#d1d5db" strokeDasharray="1,1" strokeWidth="0.5" />
      <text x="0" y="52" fill="#6b7280" fontSize="4" dominantBaseline="hanging">50%</text>
    </svg>
  );
};


// Main App component that renders the entire application
export default function InterviewReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
 
   useEffect(() => {
     makeAuthenticatedRequest(`${API_BASE_URL}/api/interview/report`)
       .then((res) => {
         if (!res.ok) throw new Error("Failed to fetch report");
         return res.json();
       })
       .then((resData) => {
         if (resData.success) {
           setData(resData.data);
         }
         setLoading(false);
       })
       .catch((err) => {
         console.error("Error fetching report:", err);
         setLoading(false);
       });
   }, []);

   // Conditional rendering for the loading state
   if (loading) {
     return (
       <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800">
         <div className="flex flex-col items-center">
           <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <p className="mt-4 text-xl font-medium">Analyzing interview data...</p>
         </div>
       </div>
     );
   }

   // Handle Empty State
   if (!data) {
     return (
       <div className="flex bg-gray-50 text-gray-800 min-h-screen font-sans">
         <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4 sticky top-0 h-screen shadow-lg">
           <div className="text-2xl font-bold text-blue-600 mb-8">Analyzer <span className="text-sm font-light">v1.0</span></div>
           <nav className="space-y-2">
             <a href="#" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 transition duration-150 hover:bg-gray-100" onClick={() => navigate('/dashboard')}>
               <LayoutDashboard className="w-5 h-5" />
               <span>Dashboard</span>
             </a>
             <a href="#" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 transition duration-150 hover:bg-gray-100" onClick={() => navigate('/profile')}>
               <User className="w-5 h-5" />
               <span>Candidate Profile</span>
             </a>
           </nav>
         </aside>
         <main className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-center">
           <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
             <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
               📊
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-3">No Analytics Available</h2>
             <p className="text-gray-600 mb-6">
               You haven't completed any mock interviews yet. Take an interview in the Speech Section to generate your dynamic feedback report.
             </p>
             <button
               onClick={() => navigate('/start-interview')}
               className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
             >
               Start Your First Interview
             </button>
           </div>
         </main>
       </div>
     );
   }

   // Calculate overall score for a metric card
   const overallScore = data.topicAnalysis.reduce((acc, item) => acc + item.score, 0) / data.topicAnalysis.length;

   // Once data is loaded, render the dashboard
   return (
     <div className="flex bg-gray-50 text-gray-800 min-h-screen font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4 sticky top-0 h-screen shadow-lg">
        <div className="text-2xl font-bold text-blue-600 mb-8">Analyzer <span className="text-sm font-light">v1.0</span></div>
        <nav className="space-y-2">
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 text-blue-700 font-semibold transition duration-150 hover:bg-blue-100" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 transition duration-150 hover:bg-gray-100" onClick={() => navigate('/profile')}>
            <User className="w-5 h-5" />
            <span>Candidate Profile</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">Interview Report: Performance Insights</h1>

        {/* Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-500">Overall Score</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{overallScore.toFixed(0)}%</p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-500">Topics Covered</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data.topicsCovered.length}</p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-yellow-500">
            <p className="text-sm font-medium text-gray-500">Highest Score</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{Math.max(...data.topicAnalysis.map(t => t.score))}%</p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-lg border-l-4 border-red-500">
            <p className="text-sm font-medium text-gray-500">Lowest Score</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{Math.min(...data.topicAnalysis.map(t => t.score))}%</p>
          </div>
        </section>

        {/* Chart and Detailed Analysis Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Topics & Bar Chart */}
          <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow-xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center"><BarChart className="w-6 h-6 mr-2 text-blue-600" /> Topic-wise Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dynamic Bar Chart */}
                <div className="h-64 border p-4 rounded-lg bg-gray-50">
                    <ScoreBarChart topicAnalysis={data.topicAnalysis} />
                </div>
                {/* Detailed Analysis List */}
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {data.topicAnalysis.map((item, index) => (
                        <div key={index} className="p-3 border-b hover:bg-blue-50 transition-colors duration-150 rounded-md">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-md font-medium text-gray-700">{item.topic}</h3>
                                <span className={`text-lg font-bold ${item.score > 80 ? 'text-green-600' : item.score > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {item.score}%
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 italic">{item.analysis}</p>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="p-6 bg-white rounded-xl shadow-xl flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center"><LineChart className="w-6 h-6 mr-2 text-blue-600" /> Interview Progress Trend</h2>
            <div className="w-full h-48 flex-grow flex items-center justify-center p-4 border rounded-lg bg-gray-50">
              <ProgressLineChart progress={data.progress} />
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">Score progression across your last 6 interviews.</p>
          </div>

        </section>

        {/* Summary, Pros & Cons, and Suggestions Sections */}
        <section className="space-y-6 mt-8">
            
            {/* Summary */}
            <div className="p-6 bg-white rounded-xl shadow-xl border-t-4 border-blue-600">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600" /> Brief Summary</h2>
                <p className="text-gray-600 leading-relaxed italic">{data.summary}</p>
            </div>

            {/* Pros & Cons */}
            <div className="p-6 bg-white rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Strengths & Areas for Development</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-medium text-green-600 mb-3 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" /> Strengths (Pros)
                        </h3>
                        <ul className="list-none space-y-2 text-gray-700">
                            {data.pros.map((pro, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-green-500 text-lg mr-2">•</span> {pro}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-red-600 mb-3 flex items-center">
                            <XCircle className="w-5 h-5 mr-2" /> Improvements (Cons)
                        </h3>
                        <ul className="list-none space-y-2 text-gray-700">
                            {data.cons.map((con, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-red-500 text-lg mr-2">•</span> {con}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Suggestions */}
            <div className="p-6 bg-white rounded-xl shadow-xl border-b-4 border-blue-600">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Recommendations & Next Steps</h2>
                <p className="text-gray-600 leading-relaxed font-medium">{data.suggestions}</p>
            </div>

        </section>

      </main>
    </div>
   );
}