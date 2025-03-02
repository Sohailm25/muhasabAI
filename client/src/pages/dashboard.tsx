import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // If not authenticated and finished loading, redirect to home
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600 dark:text-gray-300">
            View your recent reflections and interactions.
          </p>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
            View Activity
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Daily Goals</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your progress on your daily spiritual goals.
          </p>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
            Set Goals
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Personalized Insights</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Get insights based on your reflections and activities.
          </p>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
            View Insights
          </button>
        </div>
      </div>
    </div>
  );
} 