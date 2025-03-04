import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { halaqaService } from "@/services/halaqaService";
import { Halaqa } from "@/types";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import { Plus, Search, BookOpen, Calendar, User, ChevronRight, CheckCircle, Circle } from "lucide-react";

export default function HalaqaPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [halaqas, setHalaqas] = useState<Halaqa[]>([]);
  const [filteredHalaqas, setFilteredHalaqas] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch user's halaqas
  useEffect(() => {
    const fetchHalaqas = async () => {
      if (!user?.id) {
        setError("You must be logged in to view your halaqas");
        setLoading(false);
        return;
      }
      
      try {
        const userHalaqas = await halaqaService.getHalaqasByUserId(user.id);
        setHalaqas(userHalaqas);
        setFilteredHalaqas(userHalaqas);
      } catch (error) {
        console.error("Error fetching halaqas:", error);
        setError("Failed to load halaqas. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchHalaqas();
  }, [user]);
  
  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredHalaqas(halaqas);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = halaqas.filter(
      (halaqa) =>
        halaqa.title.toLowerCase().includes(query) ||
        (halaqa.speaker && halaqa.speaker.toLowerCase().includes(query)) ||
        halaqa.topic.toLowerCase().includes(query) ||
        halaqa.keyReflection.toLowerCase().includes(query)
    );
    
    setFilteredHalaqas(filtered);
  }, [searchQuery, halaqas]);
  
  // Calculate action item completion percentage
  const getCompletionPercentage = (halaqa: Halaqa) => {
    if (!halaqa.actionItems || halaqa.actionItems.length === 0) {
      return 0;
    }
    
    const completedCount = halaqa.actionItems.filter(item => item.completed).length;
    return Math.round((completedCount / halaqa.actionItems.length) * 100);
  };
  
  if (loading) {
    return (
      <Layout title="Halaqa AI">
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (error && !user?.id) {
    return (
      <Layout title="Halaqa AI">
        <div className="container py-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/login")}>
                Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Halaqa AI">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Halaqa AI</h1>
            <p className="text-muted-foreground mt-1">
              Document and reflect on Islamic lectures and classes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search halaqas..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate("/halaqa/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Halaqa
            </Button>
          </div>
        </div>
        
        {filteredHalaqas.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Halaqas Found</CardTitle>
              <CardDescription>
                {searchQuery
                  ? "No halaqas match your search criteria."
                  : "You haven't created any halaqa notes yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search or clear it to see all your halaqas."
                  : "Create your first halaqa note to start documenting your Islamic learning journey."}
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/halaqa/new")}>
                <Plus className="mr-2 h-4 w-4" /> Create First Halaqa Note
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredHalaqas.map((halaqa) => {
              const completionPercentage = getCompletionPercentage(halaqa);
              return (
                <Card 
                  key={halaqa.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/halaqa/${halaqa.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{halaqa.title}</CardTitle>
                      <div className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {halaqa.topic}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(new Date(halaqa.date))}</span>
                      </div>
                      {halaqa.speaker && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{halaqa.speaker}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Created {formatDate(new Date(halaqa.createdAt))}</span>
                      </div>
                    </div>
                    
                    <p className="mt-4 line-clamp-2 text-muted-foreground">
                      {halaqa.keyReflection}
                    </p>
                    
                    {/* Action Items Progress */}
                    {halaqa.actionItems && halaqa.actionItems.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Action Items: {halaqa.actionItems.filter(item => item.completed).length}/{halaqa.actionItems.length}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {completionPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {halaqa.actionItems.slice(0, 2).map((item) => (
                            <li key={item.id} className="flex items-start space-x-2">
                              {item.completed ? (
                                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              )}
                              <span className={`text-xs ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                                {item.description}
                              </span>
                            </li>
                          ))}
                          {halaqa.actionItems.length > 2 && (
                            <li className="text-xs text-muted-foreground ml-6">
                              +{halaqa.actionItems.length - 2} more action items
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center text-primary text-sm">
                      View Details <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
} 