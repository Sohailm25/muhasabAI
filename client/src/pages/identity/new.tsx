import { useState } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { API } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function NewIdentityFramework() {
  const [title, setTitle] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query for creating framework
  const createFramework = useMutation({
    mutationFn: async (title: string) => {
      try {
        const response = await API.post('/api/identity-frameworks', { title });
        return response;
      } catch (error) {
        console.error('Error creating framework:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate frameworks query to refresh list
      queryClient.invalidateQueries({ queryKey: ['identity-frameworks'] });
      
      toast({
        title: "Success",
        description: "Your new identity framework has been created",
      });
      
      navigate(`/identity/${data.framework.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create framework. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your framework",
        variant: "destructive",
      });
      return;
    }
    
    // Store the title in localStorage for immediate use in the framework editor
    console.log('Storing framework title for suggestions:', title.trim());
    localStorage.setItem('lastFrameworkTitle', title.trim());
    
    createFramework.mutate(title.trim());
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/identity')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Frameworks
        </Button>
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create New Identity Framework</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Framework Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <Label htmlFor="title" className="mb-2 block">
                    What spiritual aspect would you like to develop?
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Becoming more mindful in daily life"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Give your framework a descriptive title that captures the identity you want to develop.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={createFramework.isPending || !title.trim()}
                  >
                    {createFramework.isPending ? 'Creating...' : 'Begin Framework'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">About the Identity-to-Action Framework</h2>
            <p className="mb-4 text-muted-foreground">
              This framework will guide you through a structured process to transform your spiritual
              aspirations into concrete habits and actions. The process includes:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Card className="p-4">
                <h3 className="font-medium mb-2">1. Identity (Who I Am / Want to Be)</h3>
                <p className="text-sm text-muted-foreground">
                  Define the core values and attributes of the identity you want to embody.
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium mb-2">2. Vision (Why It Matters)</h3>
                <p className="text-sm text-muted-foreground">
                  Describe why this identity is important to you and what impact it will have.
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium mb-2">3. Systems (How I Operate)</h3>
                <p className="text-sm text-muted-foreground">
                  Establish the principles and processes that will support this identity.
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium mb-2">4. Goals (What I Am Aiming For)</h3>
                <p className="text-sm text-muted-foreground">
                  Set specific, measurable goals for different timeframes.
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium mb-2">5. Habits (What I Repeatedly Do)</h3>
                <p className="text-sm text-muted-foreground">
                  Define daily habits that reinforce this identity, with minimum viable versions.
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium mb-2">6. Triggers (When & Where I Act)</h3>
                <p className="text-sm text-muted-foreground">
                  Establish environmental cues and reminders to initiate your habits.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 