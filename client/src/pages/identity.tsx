import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { 
  PlusCircle, 
  ChevronRight, 
  CalendarDays, 
  Calendar, 
  User, 
  EyeIcon, 
  Settings, 
  Target, 
  Activity, 
  Sparkles,
  Info 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { API } from '@/lib/api';
import { IdentityFramework, FrameworkComponent } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Component types
type IdentityContent = {
  statements: string[];
};

type VisionContent = {
  statements: string[];
};

type SystemsContent = {
  processes: string[];
};

type GoalsContent = {
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
  successCriteria: string;
};

type HabitsContent = {
  habits: Array<{
    description: string;
    minimumVersion: string;
    expandedVersion: string;
    reward: string;
  }>;
};

type TriggersContent = {
  triggers: Array<{
    habitId: number;
    primaryTrigger: string;
    secondaryTrigger: string;
    environmentalSupports: string;
  }>;
};

// Extended framework type to include components
interface ExtendedFramework extends IdentityFramework {
  components?: FrameworkComponent[];
}

export default function IdentityPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hoveredFramework, setHoveredFramework] = useState<string | null>(null);

  // Use React Query for data fetching
  const { 
    data, 
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['identity-frameworks'],
    queryFn: async () => {
      // Use the api util instead of direct fetch
      try {
        const response = await API.get('/api/identity-frameworks');
        
        // Fetch components for each framework
        const frameworks = response.frameworks || [];
        
        // For each framework, fetch its components
        const extendedFrameworks: ExtendedFramework[] = await Promise.all(
          frameworks.map(async (framework: IdentityFramework) => {
            try {
              const componentsResponse = await API.get(`/api/identity-frameworks/${framework.id}`);
              return {
                ...framework,
                components: componentsResponse.framework?.components || []
              };
            } catch (error) {
              console.error(`Error fetching components for framework ${framework.id}:`, error);
              return framework;
            }
          })
        );
        
        return extendedFrameworks;
      } catch (error) {
        console.error('Error fetching frameworks:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });

  // React to query errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load frameworks",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  const handleCreateNew = () => {
    navigate('/identity/new');
  };
  
  const formatLastEdited = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Function to get component summary
  const getComponentSummary = (framework: ExtendedFramework, type: string) => {
    if (!framework.components) return null;
    
    const component = framework.components.find(c => c.componentType === type);
    if (!component) return null;
    
    switch (type) {
      case 'identity':
        const identityContent = component.content as IdentityContent;
        return identityContent.statements.filter(s => s.trim()).length > 0 
          ? identityContent.statements.filter(s => s.trim())[0]
          : null;
      
      case 'vision':
        const visionContent = component.content as VisionContent;
        return visionContent.statements.filter(s => s.trim()).length > 0
          ? visionContent.statements.filter(s => s.trim())[0]
          : null;
      
      case 'systems':
        const systemsContent = component.content as SystemsContent;
        return systemsContent.processes.filter(p => p.trim()).length > 0
          ? systemsContent.processes.filter(p => p.trim())[0]
          : null;
      
      case 'goals':
        const goalsContent = component.content as GoalsContent;
        return goalsContent.shortTerm || goalsContent.mediumTerm || goalsContent.longTerm
          ? `${goalsContent.shortTerm ? 'Short-term: ' + goalsContent.shortTerm.substring(0, 40) + '...' : ''}`
          : null;
      
      case 'habits':
        const habitsContent = component.content as HabitsContent;
        return habitsContent.habits && habitsContent.habits.length > 0
          ? `${habitsContent.habits.length} habit${habitsContent.habits.length !== 1 ? 's' : ''} defined`
          : null;
      
      case 'triggers':
        const triggersContent = component.content as TriggersContent;
        return triggersContent.triggers && triggersContent.triggers.length > 0
          ? `${triggersContent.triggers.length} trigger${triggersContent.triggers.length !== 1 ? 's' : ''} defined`
          : null;
      
      default:
        return null;
    }
  };
  
  // Get the icon for a component type
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'identity':
        return <User className="h-4 w-4" />;
      case 'vision':
        return <EyeIcon className="h-4 w-4" />;
      case 'systems':
        return <Settings className="h-4 w-4" />;
      case 'goals':
        return <Target className="h-4 w-4" />;
      case 'habits':
        return <Activity className="h-4 w-4" />;
      case 'triggers':
        return <Sparkles className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const frameworks = data || [];
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Identity Builder</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/identity/tracking')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Habit Tracking
            </Button>
            <Button onClick={handleCreateNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Framework
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-muted-foreground mb-4">
            Transform your spiritual aspirations into action with the Identity-to-Action framework
          </h2>
          <p className="text-muted-foreground">
            Build complete frameworks that connect your identity to your actions through a guided, 
            sequential process. Define who you are, why it matters, and create sustainable systems,
            goals, habits, and triggers that support your growth.
          </p>
        </div>
        
        <h2 className="text-xl font-bold uppercase tracking-tight mb-4">My Frameworks</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-[300px]">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="mt-4">
                    <Skeleton className="h-16 w-full mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-1/3" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : frameworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {frameworks.map((framework: ExtendedFramework) => (
              <Card 
                key={framework.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                onClick={() => navigate(`/identity/${framework.id}`)}
                onMouseEnter={() => setHoveredFramework(framework.id)}
                onMouseLeave={() => setHoveredFramework(null)}
              >
                <CardHeader className="pb-3">
                  <CardTitle>{framework.title}</CardTitle>
                  <CardDescription>
                    Framework for personal transformation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${framework.completionPercentage}%` }} 
                      />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {framework.completionPercentage}% complete
                    </div>
                  </div>
                  
                  <div className={`space-y-3 transition-all duration-300 overflow-hidden ${hoveredFramework === framework.id ? 'max-h-[500px]' : 'max-h-24'}`}>
                    {/* Show component summaries */}
                    {['identity', 'vision', 'systems', 'goals', 'habits', 'triggers'].map((type: string) => {
                      const summary = getComponentSummary(framework, type);
                      if (!summary) return null;
                      
                      return (
                        <div key={type} className="flex gap-2 items-start">
                          <div className="bg-primary/10 p-1.5 rounded">
                            {getComponentIcon(type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {type}
                            </p>
                            <p className="text-sm line-clamp-2">
                              {summary}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Show message if no components */}
                    {!framework.components || framework.components.length === 0 ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          Click to start building your framework
                        </p>
                      </div>
                    ) : null}
                  </div>
                  
                  {/* View more indicator */}
                  {(framework.components?.length || 0) > 2 && hoveredFramework !== framework.id && (
                    <div className="text-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        Hover to see more
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Last edited {formatLastEdited(framework.updatedAt)}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-primary/10 p-2 rounded-full">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View framework details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <PlusCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">No frameworks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first identity framework to begin your transformation journey.
            </p>
            <Button onClick={handleCreateNew}>
              Create Your First Framework
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
} 