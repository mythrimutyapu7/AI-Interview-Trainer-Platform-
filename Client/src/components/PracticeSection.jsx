import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeAuthenticatedRequest } from '../utils/authUtils';

const PracticeSection = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // State Management
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({
    totalSolved: 0,
    acceptanceRate: 0,
    currentStreak: 0,
    weakTopic: 'None',
    strongTopic: 'None',
    solvedEasy: 0,
    solvedMedium: 0,
    solvedHard: 0,
    avgScore: 0,
    totalSubmissions: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // AI Problem Generator form state
  const [genRole, setGenRole] = useState('Software Engineer');
  const [genCompany, setGenCompany] = useState('Google');
  const [genTopic, setGenTopic] = useState('Arrays & Hashing');
  const [genDifficulty, setGenDifficulty] = useState('Medium');
  const [genError, setGenError] = useState(null);

  // Fetch Dashboard Stats & Problems
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Stats & Recommendations
      const statsRes = await makeAuthenticatedRequest(`${API_BASE_URL}/api/coding/dashboard/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
          setRecommendations(statsData.recommendations || []);
        }
      }

      // Fetch Problems List
      const url = new URL(`${API_BASE_URL}/api/coding/problems`);
      if (search) url.searchParams.append('search', search);
      if (selectedDifficulty) url.searchParams.append('difficulty', selectedDifficulty);
      if (selectedCategory) url.searchParams.append('category', selectedCategory);

      const problemsRes = await makeAuthenticatedRequest(url.toString());
      if (problemsRes.ok) {
        const probData = await problemsRes.json();
        if (probData.success) {
          setProblems(probData.problems || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch coding platform data. Ensure backend server is up.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [search, selectedDifficulty, selectedCategory]);

  // Handle AI question generation
  const handleGenerateProblem = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/coding/problems/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: genRole,
          company: genCompany,
          topic: genTopic,
          difficulty: genDifficulty
        })
      });

      if (!response.ok) throw new Error('Failed to generate problem. Make sure API key is loaded.');
      const resData = await response.json();
      
      if (resData.success && resData.problem) {
        // Redirect directly to the code editor for this problem
        navigate(`/code?id=${resData.problem._id}`);
      } else {
        throw new Error('No problem data returned');
      }
    } catch (err) {
      console.error(err);
      setGenError(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Get distinct categories for filters
  const categories = ['Arrays & Hashing', 'Linked Lists', 'Trees', 'Dynamic Programming', 'Graph Algorithms', 'Strings', 'General'];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      
      {/* Top Banner / Heading */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AI Coding Workspace</h1>
          <p className="text-slate-500 mt-2">Elevate your programming skills with real-time compilers, hidden test case assessments, and deep AI code quality reviews.</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="self-start md:self-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition shadow-sm"
        >
          ↻ Refresh Dashboard
        </button>
      </div>

      {/* Analytics stats row */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Solved Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Solved Problems</span>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{stats.totalSolved}</span>
            <div className="flex gap-2 mt-2 text-xs font-semibold">
              <span className="text-emerald-600">E: {stats.solvedEasy}</span>
              <span className="text-amber-600">M: {stats.solvedMedium}</span>
              <span className="text-rose-600">H: {stats.solvedHard}</span>
            </div>
          </div>
        </div>

        {/* Acceptance rate card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Acceptance Rate</span>
            <span className="text-2xl">📈</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{stats.acceptanceRate}%</span>
            <span className="text-slate-500 text-xs block mt-1">Total Submissions: {stats.totalSubmissions}</span>
          </div>
        </div>

        {/* Streak card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Practice Streak</span>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{stats.currentStreak} Days</span>
            <span className="text-slate-500 text-xs block mt-1">Keep the momentum going!</span>
          </div>
        </div>

        {/* Focus areas card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">AI Focus Metric</span>
            <span className="text-2xl">🧠</span>
          </div>
          <div className="mt-4">
            <div className="text-slate-800 font-extrabold text-lg">Weakest: <span className="text-rose-600 text-sm font-semibold">{stats.weakTopic}</span></div>
            <div className="text-slate-800 font-extrabold text-lg mt-1">Strongest: <span className="text-emerald-600 text-sm font-semibold">{stats.strongTopic}</span></div>
          </div>
        </div>

      </div>

      {/* Main split grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Filter and Problems Table */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="Search coding problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm text-slate-700 bg-slate-50"
              />
              <span className="absolute left-3 top-3.5 text-slate-400 text-sm">🔍</span>
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="flex-1 md:flex-none border border-slate-200 bg-slate-50 text-slate-700 px-4 py-3 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm font-medium"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 md:flex-none border border-slate-200 bg-slate-50 text-slate-700 px-4 py-3 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm font-medium"
              >
                <option value="">All Categories</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Problems List Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-slate-800 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-slate-500 font-medium">Fetching coding library...</p>
              </div>
            ) : error ? (
              <div className="p-10 text-center text-rose-600 font-medium">
                ⚠️ {error}
              </div>
            ) : problems.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                📭 No coding problems found. Try creating one using the AI Generator on the right!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-xs font-bold border-b border-slate-100">
                      <th className="p-4 pl-6">Status</th>
                      <th className="p-4">Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Difficulty</th>
                      <th className="p-4">Acceptance</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition duration-150">
                        <td className="p-4 pl-6 text-sm">
                          {p.status === 'Solved' && <span className="text-emerald-500 text-lg">✅</span>}
                          {p.status === 'Attempted' && <span className="text-amber-500 text-lg">🟡</span>}
                          {p.status === 'Unsolved' && <span className="text-slate-300 text-lg">⚪</span>}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 text-sm">{p.title}</span>
                          {p.isAI && <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-md uppercase tracking-tight">AI Generated</span>}
                        </td>
                        <td className="p-4 text-slate-500 text-sm">{p.category || 'General'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 border text-xs font-bold rounded-full ${getDifficultyColor(p.difficulty)}`}>
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-sm">{p.acceptance}</td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => navigate(`/code?id=${p._id}`)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition"
                          >
                            Solve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Spawner and recommendations */}
        <div className="space-y-8">
          
          {/* AI Generator form */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">AI Coding Spawner</h3>
              <p className="text-xs text-slate-500 mt-1">Spawn realistic coding challenges targeted at specific roles and companies.</p>
            </div>

            <form onSubmit={handleGenerateProblem} className="space-y-4">
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase">Target Role</label>
                <select
                  value={genRole}
                  onChange={(e) => setGenRole(e.target.value)}
                  className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm text-slate-700 bg-slate-50 font-medium"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Frontend Developer">Frontend Engineer</option>
                  <option value="Backend Developer">Backend Engineer</option>
                  <option value="ML Engineer">Machine Learning Engineer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase">Target Company</label>
                <select
                  value={genCompany}
                  onChange={(e) => setGenCompany(e.target.value)}
                  className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm text-slate-700 bg-slate-50 font-medium"
                >
                  <option value="Google">Google</option>
                  <option value="Meta">Meta</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Netflix">Netflix</option>
                  <option value="Stripe">Stripe</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Topic</label>
                  <select
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm text-slate-700 bg-slate-50 font-medium"
                  >
                    <option value="Arrays & Hashing">Arrays</option>
                    <option value="Linked Lists">Linked Lists</option>
                    <option value="Trees">Trees</option>
                    <option value="Dynamic Programming">DP</option>
                    <option value="Strings">Strings</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Difficulty</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm text-slate-700 bg-slate-50 font-medium"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {genError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  ⚠️ {genError}
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-850 hover:to-slate-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Spawning Problem...
                  </>
                ) : '✨ Create Custom Problem'}
              </button>

            </form>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Adaptive Recommendations</h3>
              <p className="text-xs text-slate-500">Suggested problems based on your recent activity and focus areas.</p>
            </div>

            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-slate-400 text-xs py-4">Complete problems to receive recommendations!</div>
              ) : (
                recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate(`/code?id=${rec._id}`)}
                    className="p-4 border border-slate-100 hover:border-slate-300 rounded-xl cursor-pointer flex justify-between items-center transition"
                  >
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{rec.title}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{rec.category || 'General'}</span>
                    </div>
                    <span className={`px-2 py-0.5 border text-xs font-bold rounded-full ${getDifficultyColor(rec.difficulty)}`}>
                      {rec.difficulty}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PracticeSection;
