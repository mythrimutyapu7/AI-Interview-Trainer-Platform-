import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { makeAuthenticatedRequest } from "../utils/authUtils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    makeAuthenticatedRequest(`${API_BASE_URL}/api/profile/dashboard`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((resData) => {
        if (resData.success) {
          setStats(resData.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading dashboard statistics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading your profile dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    lastInterview,
    streak = 0,
    lastPracticed = "Never",
    performanceSummary = { accuracyRate: 0, weakestArea: "None", averageScore: 0 },
    badges = [],
    recommendations = { weakestArea: "Algorithms", practiceCount: 5 }
  } = stats || {};

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Welcome Section */}
      <section className="mb-10">
        <h2 className="text-4xl font-extrabold text-gray-800">
          Welcome back,{" "}
          <span className="text-indigo-600">
            {user?.firstName || user?.name || "User"}
          </span>{" "}
          👋
        </h2>
        <p className="text-gray-600 mt-3 text-lg">
          Ready to <span className="font-semibold text-indigo-500">ace</span>{" "}
          your next interview?
        </p>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Last Interview */}
          <div className="bg-white border-l-4 border-indigo-500 p-8 rounded-2xl shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Last Interview Result
            </h3>
            {lastInterview ? (
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <span className="font-medium">Interview Date:</span> {lastInterview.date}
                </p>
                <p>
                  <span className="font-medium">Category:</span> {lastInterview.position}
                </p>
                <p>
                  <span className="font-medium">Strengths:</span> {lastInterview.strengths || "Clear response construction"}
                </p>
                <p>
                  <span className="font-medium">Areas to Improve:</span> {lastInterview.improvements || "Try elaborating on metrics"}
                </p>
                <p>
                  <span className="font-medium">Overall Score:</span>{" "}
                  <span className="text-indigo-600 font-bold">{lastInterview.score} / 10</span>
                </p>
              </div>
            ) : (
              <div className="text-gray-500 text-sm py-4 italic">
                No mock interviews completed yet. Practicing regularly builds muscle memory! Click "Start Interview" below to take your first session.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <button
              onClick={() => navigate("/start-interview")}
              className="p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition transform hover:-translate-y-1 hover:scale-105"
            >
              Start Interview
            </button>
            <button
              onClick={() => navigate("/interview-report")}
              className="p-5 bg-gray-900 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition transform hover:-translate-y-1 hover:scale-105"
            >
              Previous Insights
            </button>
            <button
              onClick={() => navigate("/recordings")}
              className="p-5 bg-gray-900 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition transform hover:-translate-y-1 hover:scale-105"
            >
              Check Recording
            </button>
          </div>

          {/* Practice Streak */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl text-white shadow-md">
            <h3 className="font-semibold mb-3 text-lg">🔥 Practice Streak</h3>
            <p className="text-sm">
              {streak > 0 ? (
                <>
                  You have practiced <span className="font-bold">{streak} days</span> in a row! Keep it up to build consistency.
                </>
              ) : (
                "Start practicing today to build your streak and stay consistent!"
              )}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <div className="bg-gray-900 border-t-4 border-indigo-400 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <p className="text-sm text-purple-300">Recent Activity</p>
            <p className="text-white font-medium mt-2">
              Last Practiced:{" "}
              <span className="text-indigo-300 font-semibold">{lastPracticed}</span>
            </p>
          </div>

          {/* Performance Summary */}
          <div className="bg-gray-900 border-t-4 border-purple-400 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <p className="font-semibold text-white mb-3 text-lg">
              Performance Summary
            </p>
            <ul className="space-y-2 text-sm text-white">
              <li>
                <span className="font-medium text-purple-300">Average Score:</span>{" "}
                {performanceSummary.averageScore > 0 ? `${performanceSummary.averageScore} / 10` : "N/A"}
              </li>
              <li>
                <span className="font-medium text-purple-300">Accuracy Rate:</span>{" "}
                {performanceSummary.accuracyRate > 0 ? `${performanceSummary.accuracyRate}%` : "N/A"}
              </li>
              <li>
                <span className="font-medium text-purple-300">Weakest Areas:</span>{" "}
                {performanceSummary.weakestArea}
              </li>
            </ul>
          </div>

          {/* Badges */}
          <div className="bg-gray-900 border border-gray-200 p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <p className="font-semibold text-white mb-4">🏅 Badges Earned</p>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.name}
                    className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-3xl shadow-md hover:scale-110 transition cursor-help"
                  >
                    {badge.icon}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Complete mock interviews to unlock badges!</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-10 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-sm hover:shadow-md transition">
        {recommendations.weakestArea !== "None" ? (
          <p className="text-gray-700 font-medium">
            Recommended For You: You’ve struggled with{" "}
            <span className="font-bold text-yellow-700">{recommendations.weakestArea}</span> – Try these{" "}
            <span className="text-indigo-600 font-bold">{recommendations.practiceCount} practice problems</span> in the Practice Section.
          </p>
        ) : (
          <p className="text-gray-700 font-medium">
            Recommended For You: Keep up the excellent work! You are performing well across all categories. Try exploring new challenges in the Practice Section.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
