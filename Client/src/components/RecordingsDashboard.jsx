// Here recordings will be found
import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle, X } from "lucide-react";

// Get API URL from environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function RecordingsDashboard() {
  const [recordings, setRecordings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/recordings`)
      .then((res) => res.json())
      .then((data) => {
        // Keep only recordings with a valid path
        const existing = data.filter((rec) => rec.path);
        setRecordings(existing);
      })
      .catch((err) => console.error("Error fetching recordings:", err));
  }, []);

  // ===== Filter logic =====
  const filteredRecordings = recordings.filter((rec) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const recDate = rec.createdAt.slice(0, 10);

    switch (filter) {
      case "today":
        return recDate === today;
      case "yesterday":
        return recDate === yesterday;
      case "last week":
        return recDate > lastWeek;
      case "last month":
        return recDate > lastMonth;
      default:
        return true;
    }
  });

  // ===== Calendar helpers =====
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    for (let i = 1; i <= numDays; i++)
      calendarDays.push(
        <div
          key={`day-${i}`}
          className="w-8 h-8 flex items-center justify-center cursor-pointer rounded-full hover:bg-blue-200"
        >
          {i}
        </div>
      );
    return calendarDays;
  };

  const handlePrevMonth = () => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const openModal = (recording) => {
    console.log('Opening recording:', recording);
    console.log('Video URL:', recording.url);
    console.log('Video path:', recording.path);
    setSelectedRecording(recording);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecording(null);
  };

  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen font-sans p-4 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Recordings */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-extrabold text-gray-800">Interview Recordings</h1>
            <div className="flex items-center space-x-4">
              <span className="text-lg text-gray-600 font-medium">Date: </span>
              <span className="text-lg text-gray-800 font-semibold">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecordings.map((rec) => (
              <div
                key={rec._id}
                className="relative aspect-video bg-gray-300 rounded-xl overflow-hidden shadow-lg flex items-center justify-center group cursor-pointer"
                onClick={() => openModal(rec)}
              >
                <PlayCircle className="absolute w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition duration-300 z-10" />
                <video
                  src={rec.url || `${API_BASE_URL}${rec.path}`}
                  className="w-full h-full object-cover pointer-events-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.classList.add('bg-gray-500');
                  }}
                />
<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
  <span className="block text-sm font-semibold truncate">{rec.filename}</span>
  <span className="block text-xs text-gray-300">
    {new Date(rec.createdAt).toLocaleDateString()}
  </span>
  <span className="block text-xs text-gray-300">
    Role: {rec.role}, Difficulty: {rec.difficulty}
  </span>
</div>

              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filter */}
          <div className="p-6 bg-gray-200 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Filter</h2>
            <select
              className="w-full p-2 rounded-lg bg-gray-300 border border-gray-400 text-gray-700"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">all</option>
              <option value="today">today</option>
              <option value="yesterday">yesterday</option>
              <option value="last week">last week</option>
              <option value="last month">last month</option>
            </select>
          </div>

          {/* Calendar */}
          <div className="p-6 bg-gray-200 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 text-gray-700 font-semibold text-xl">
              <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-300 transition duration-200">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span>
                {selectedDate.toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
              <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-300 transition duration-200">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 mb-2">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>
            <div className="grid grid-cols-7 text-center">{renderCalendar()}</div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isModalOpen && selectedRecording && (
        <div 
          className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition duration-200 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">{selectedRecording.filename}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-300">
                <span>📅 {new Date(selectedRecording.createdAt).toLocaleString()}</span>
                <span>👔 Role: {selectedRecording.role}</span>
                <span>⚡ Difficulty: {selectedRecording.difficulty}</span>
                {selectedRecording.size && (
                  <span>📦 Size: {(selectedRecording.size / (1024 * 1024)).toFixed(2)} MB</span>
                )}
              </div>
            </div>

            {/* Video Player */}
            <div className="relative bg-black">
              <video
                key={selectedRecording._id}
                controls
                autoPlay
                className="w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  console.error('Video load error:', e);
                  console.error('Attempted URL:', selectedRecording.url || `${API_BASE_URL}${selectedRecording.path}`);
                }}
              >
                <source 
                  src={selectedRecording.url || `${API_BASE_URL}${selectedRecording.path}`} 
                  type="video/webm" 
                />
                Your browser does not support the video tag.
              </video>
              {/* Debug info - you can remove this later */}
              <div className="text-white text-xs p-2 bg-gray-700">
                Video URL: {selectedRecording.url || `${API_BASE_URL}${selectedRecording.path}`}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {selectedRecording.bucket && `Bucket: ${selectedRecording.bucket}`}
                </span>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
