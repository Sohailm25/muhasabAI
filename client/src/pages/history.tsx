import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Mock history data - in a real app, this would come from an API
const mockHistory = [
  {
    id: "1",
    type: "reflection",
    title: "Morning Reflection",
    date: "2023-04-10T08:30:00",
    summary: "Reflected on Surah Al-Fatiha"
  },
  {
    id: "2",
    type: "chat",
    title: "Chat with AI Assistant",
    date: "2023-04-09T14:15:00",
    summary: "Discussed patience in difficult times"
  },
  {
    id: "3",
    type: "halaqa",
    title: "Weekly Halaqa Session",
    date: "2023-04-07T19:00:00",
    summary: "Participated in group discussion on Seerah"
  },
  {
    id: "4",
    type: "reflection",
    title: "Evening Reflection",
    date: "2023-04-05T21:45:00",
    summary: "Reflected on daily deeds and improvement"
  },
  {
    id: "5",
    type: "chat",
    title: "Chat with AI Assistant",
    date: "2023-04-03T10:20:00",
    summary: "Asked about maintaining consistent prayer"
  },
  {
    id: "6",
    type: "halaqa",
    title: "Study Circle",
    date: "2023-04-01T18:30:00",
    summary: "Discussion about Islamic ethics"
  },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  
  // Filter history items by type
  const filteredHistory = filter === "all" 
    ? mockHistory 
    : mockHistory.filter(item => item.type === filter);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Activity History</h1>
      
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${filter === "all" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-md ${filter === "reflection" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setFilter("reflection")}
          >
            Reflections
          </button>
          <button
            className={`px-4 py-2 rounded-md ${filter === "chat" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setFilter("chat")}
          >
            Chats
          </button>
          <button
            className={`px-4 py-2 rounded-md ${filter === "halaqa" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setFilter("halaqa")}
          >
            Halaqa
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center"
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4
              ${item.type === "reflection" ? "bg-blue-100 text-blue-600" : 
                item.type === "chat" ? "bg-green-100 text-green-600" : 
                "bg-purple-100 text-purple-600"}`}
            >
              {item.type === "reflection" ? (
                <span>📝</span>
              ) : item.type === "chat" ? (
                <span>💬</span>
              ) : (
                <span>👥</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium">{item.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {item.summary}
              </p>
            </div>
            
            <button className="ml-4 text-primary hover:underline text-sm">View</button>
          </div>
        ))}
        
        {filteredHistory.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No history found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
} 