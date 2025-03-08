import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import axios from "axios";
import { Layout } from "@/components/Layout";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  PlusCircle, 
  BookOpen, 
  ClipboardList, 
  ChevronRight, 
  BookMarked, 
  Sparkles, 
  PenLine, 
  Clock,
  Calendar,
  Trophy,
  ArrowUpRight
} from "lucide-react";
import { ConversationList } from "@/components/ConversationList";
import { motion } from "framer-motion";

// Define user settings interface
interface UserSettings {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  preferences: {
    emailNotifications: boolean;
    darkMode: boolean;
    saveHistory: boolean;
    selectedMasjid?: any;
  };
  timestamp: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [, setLocation] = useLocation();

  // Fetch user settings to get name for greeting
  useEffect(() => {
    async function loadUserSettings() {
      try {
        const response = await axios.get('/api/user/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    }
    
    loadUserSettings();
  }, []);

  // Get first name from full name
  const firstName = settings?.name?.split(' ')[0] || 'Muslim';

  // Get time of day for greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const coreFeatures = [
    {
      title: "MuhasabAI",
      arabic: "محاسبة",
      description: "Share your thoughts and engage in Islamic self-reflection",
      icon: <PenLine className="h-6 w-6 text-primary" />,
      action: "New Reflection",
      onClick: () => setLocation('/new'),
      color: "bg-blue-500/10 dark:bg-blue-500/20",
      iconColor: "text-blue-500"
    },
    {
      title: "HalaqAI",
      arabic: "حلقة",
      description: "Document insights from Islamic talks and lectures",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      action: "Explore HalaqAI",
      onClick: () => setLocation('/halaqa'),
      color: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-500"
    },
    {
      title: "WirdhAI",
      arabic: "ورد",
      description: "Track your daily Islamic practices and habits",
      icon: <ClipboardList className="h-6 w-6 text-primary" />,
      action: "Explore WirdhAI",
      onClick: () => setLocation('/wirdh'),
      color: "bg-amber-500/10 dark:bg-amber-500/20",
      iconColor: "text-amber-500"
    }
  ];

  const quickActions = [
    {
      title: "New Reflection",
      description: "Start a new reflection session",
      icon: <PlusCircle className="h-5 w-5" />,
      onClick: () => setLocation('/new'),
      color: "bg-primary"
    },
    {
      title: "Identity Builder",
      description: "Define your spiritual identity",
      icon: <Sparkles className="h-5 w-5" />,
      onClick: () => setLocation('/identity'),
      color: "bg-purple-500 dark:bg-purple-600"
    },
    {
      title: "View History",
      description: "Review past reflections",
      icon: <Clock className="h-5 w-5" />,
      onClick: () => setLocation('/history'),
      color: "bg-gray-500 dark:bg-gray-600"
    }
  ];

  return (
    <Layout title="Islamic Reflection Space">
      {isLoading && <LoadingAnimation message="Loading..." />}
      
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Welcome Section with Islamic greeting */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-medium text-primary/80">
                السلام عليكم ورحمة الله وبركاته
              </h2>
              <h1 className="text-3xl font-bold tracking-tight mt-2">
                {getTimeBasedGreeting()}, {firstName}
              </h1>
            </div>
            <p className="mt-3 text-muted-foreground">
              Welcome to your personal Islamic reflection space. What would you like to do today?
            </p>
          </div>
        </motion.div>
        
        {/* Quick Action Buttons */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickActions.map((action, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Button 
                className={`w-full h-auto py-4 px-4 text-white ${action.color} hover:opacity-90 transition-all`}
                onClick={action.onClick}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-white/20 rounded-full p-2">
                    {action.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs font-normal opacity-80">{action.description}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </div>
              </Button>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Core Features Section */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold mb-4">Core Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="h-full border overflow-hidden">
                  <div className={`${feature.color} p-6 relative overflow-hidden`}>
                    <span className="absolute top-3 right-3 opacity-40 font-arabic text-2xl">{feature.arabic}</span>
                    <div className={`p-2 rounded-full bg-white/20 inline-flex ${feature.iconColor}`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mt-3">{feature.title}</h3>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between hover:bg-muted/50"
                      onClick={feature.onClick}
                    >
                      {feature.action}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Recent Activity Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Activity</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm flex items-center gap-1"
              onClick={() => setLocation('/history')}
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Card className="border">
            <CardContent className="pt-6">
              <ConversationList />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
