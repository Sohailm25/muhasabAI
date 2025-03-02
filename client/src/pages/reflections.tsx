import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

// Mock reflection data - in a real app, this would come from an API
const mockReflections = [
  {
    id: "1",
    title: "Morning Reflection",
    date: "2023-04-10",
    content: "Today I reflected on Surah Al-Fatiha and its importance in daily prayers.",
    mood: "peaceful",
    tags: ["prayer", "quran"],
  },
  {
    id: "2",
    title: "Evening Dhikr",
    date: "2023-04-09",
    content: "I spent time doing evening dhikr and felt a deep connection to Allah.",
    mood: "grateful",
    tags: ["dhikr", "evening"],
  },
  {
    id: "3",
    title: "Weekly Reflection",
    date: "2023-04-05",
    content: "Reflecting on my week and how I can improve my relationship with Allah.",
    mood: "contemplative",
    tags: ["weekly", "improvement"],
  },
];

export default function ReflectionsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter and search reflections
  const filteredReflections = mockReflections.filter((reflection) => {
    // Apply tag filter
    if (filter !== "all" && !reflection.tags.includes(filter)) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm && !reflection.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !reflection.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Get unique tags for filter options
  const uniqueTags = Array.from(new Set(mockReflections.flatMap(r => r.tags)));
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Reflections</h1>
        <Link href="/new">
          <a className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
            New Reflection
          </a>
        </Link>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search reflections..."
            className="w-full px-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="px-4 py-2 border rounded-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Tags</option>
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredReflections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No reflections found matching your criteria.</p>
          <button 
            className="mt-4 text-primary hover:underline"
            onClick={() => {
              setFilter("all");
              setSearchTerm("");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReflections.map((reflection) => (
            <div key={reflection.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{reflection.title}</h2>
                  <span className="text-sm text-gray-500">
                    {new Date(reflection.date).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {reflection.content}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {reflection.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <Link href={`/reflection/${reflection.id}`}>
                  <a className="text-primary hover:underline">View full reflection</a>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 