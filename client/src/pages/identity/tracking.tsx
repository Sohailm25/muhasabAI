import { useState } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CalendarDays, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface Habit {
  id: string;
  description: string;
  minimumVersion: string;
  expandedVersion: string;
  frameworkTitle: string;
  frameworkId: string;
  tracking?: {
    id: string;
    currentStreak: number;
    longestStreak: number;
    lastCompleted: Date | null;
  };
}

export default function HabitTrackingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all frameworks to extract habits
  const { data: frameworks, isLoading } = useQuery({
    queryKey: ['identity-frameworks'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/identity-frameworks');
        return response.frameworks || [];
      } catch (error) {
        console.error('Error fetching frameworks:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });

  // Complete habit mutation
  const completeHabit = useMutation({
    mutationFn: async (habitId: string) => {
      try {
        const response = await api.post(`/api/habit-tracking/${habitId}/complete`);
        return response;
      } catch (error) {
        console.error('Error completing habit:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Habit marked as complete",
      });
      // Refresh all frameworks data to update tracking info
      queryClient.invalidateQueries({ queryKey: ['identity-frameworks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete habit",
        variant: "destructive"
      });
    }
  });

  // Extract all habits from frameworks
  const habits: Habit[] = [];
  
  if (frameworks) {
    frameworks.forEach((framework: any) => {
      // For each framework, fetch the detailed version to get components
      const habitsComponent = framework.components?.find((c: any) => c.componentType === 'habits');
      
      if (habitsComponent && habitsComponent.content.habits) {
        habitsComponent.content.habits.forEach((habit: any, index: number) => {
          const tracking = framework.habitTracking?.find((t: any) => t.habitIndex === index);
          
          habits.push({
            id: tracking?.id || `temp-${framework.id}-${index}`,
            description: habit.description,
            minimumVersion: habit.minimumVersion,
            expandedVersion: habit.expandedVersion,
            frameworkTitle: framework.title,
            frameworkId: framework.id,
            tracking: tracking ? {
              id: tracking.id,
              currentStreak: tracking.currentStreak,
              longestStreak: tracking.longestStreak,
              lastCompleted: tracking.lastCompleted ? new Date(tracking.lastCompleted) : null
            } : undefined
          });
        });
      }
    });
  }

  const handleCompleteHabit = (habit: Habit) => {
    if (habit.tracking?.id) {
      completeHabit.mutate(habit.tracking.id);
    } else {
      toast({
        title: "Error",
        description: "This habit isn't set up for tracking yet",
        variant: "destructive"
      });
    }
  };

  const formatLastCompleted = (date: Date | null) => {
    if (!date) return 'Never';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => navigate('/identity')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Frameworks
          </Button>
          <h1 className="text-3xl font-bold">Habit Tracking</h1>
        </div>

        <div className="mb-8">
          <p className="text-muted-foreground">
            Track your habits and build consistent streaks to reinforce your identity.
            Mark habits as complete each day to strengthen your practice.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading habits...</div>
        ) : habits.length > 0 ? (
          <div className="space-y-6">
            {habits.map((habit) => (
              <Card key={habit.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{habit.description}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        From framework: {habit.frameworkTitle}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleCompleteHabit(habit)}
                      disabled={completeHabit.isPending}
                      variant="secondary"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Minimum Version</h3>
                      <p>{habit.minimumVersion || "Not specified"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Expanded Version</h3>
                      <p>{habit.expandedVersion || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/25 flex justify-between">
                  <div className="flex items-center text-sm">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Last completed: {formatLastCompleted(habit.tracking?.lastCompleted || null)}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-sm">
                      <span className="font-medium">Current streak:</span> {habit.tracking?.currentStreak || 0} days
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Longest streak:</span> {habit.tracking?.longestStreak || 0} days
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <h3 className="text-xl font-medium mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't defined any habits in your identity frameworks yet.
            </p>
            <Button onClick={() => navigate('/identity')}>
              Go to Identity Builder
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
} 