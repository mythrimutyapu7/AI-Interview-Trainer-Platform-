import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
            <div className="space-y-2 text-gray-700 text-sm">
              <p>
                <span className="font-medium">Interview Date:</span> 05 Sept 2025
              </p>
              <p>
                <span className="font-medium">Position:</span> Frontend Developer
              </p>
              <p>
                <span className="font-medium">Strengths:</span> Clear communication,
                problem-solving
              </p>
              <p>
                <span className="font-medium">Areas to Improve:</span> Time
                management under pressure
              </p>
              <p>
                <span className="font-medium">Overall Score:</span>{" "}
                <span className="text-indigo-600 font-bold">7.5 / 10</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <button
              onClick={() => navigate("/page9")}
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
              You have practiced{" "}
              <span className="font-bold">5 days</span> in a row this week! Keep it
              up to build consistency.
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
              <span className="text-indigo-300 font-semibold">2 days ago</span>
            </p>
          </div>

          {/* Performance Summary */}
          <div className="bg-gray-900 border-t-4 border-purple-400 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <p className="font-semibold text-white mb-3 text-lg">
              Performance Summary
            </p>
            <ul className="space-y-2 text-sm text-white">
              <li>
                <span className="font-medium text-purple-300">Accuracy Rate:</span>{" "}
                75%
              </li>
              <li>
                <span className="font-medium text-purple-300">Weakest Areas:</span>{" "}
                Algorithms
              </li>
              <li>
                <span className="font-medium text-purple-300">Average Score:</span>{" "}
                7.8
              </li>
            </ul>
          </div>

           {/* Badges */}
          <div className="bg-gray-900 border border-gray-200 p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <p className="font-semibold text-white mb-4">🏅 Badges Earned</p>
            <div className="flex space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-3xl shadow-md hover:scale-110 transition">
                🏅
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-green-500 rounded-full flex items-center justify-center text-3xl shadow-md hover:scale-110 transition">
                ✅
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Recommendations */}
      <div className="mt-10 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-sm hover:shadow-md transition">
        <p className="text-gray-700 font-medium">
          Recommended For You: You’ve struggled with{" "}
          <span className="font-bold text-yellow-700">Algorithms</span> – Try
          these{" "}
          <span className="text-indigo-600 font-bold">5 practice problems</span>.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
