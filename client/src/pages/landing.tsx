import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";

const features = [
  {
    title: "Daily Reflections",
    description: "Receive personalized Islamic reflections tailored to your spiritual journey.",
    icon: "🌙"
  },
  {
    title: "Quran & Hadith",
    description: "Access relevant verses and hadiths with scholarly explanations.",
    icon: "📚"
  },
  {
    title: "Personal Action Plans",
    description: "Get practical steps to implement Islamic teachings in your daily life.",
    icon: "✅"
  },
  {
    title: "Halaqa Helper",
    description: "Plan and organize Islamic study circles with AI assistance.",
    icon: "👥"
  },
  {
    title: "Prayer Times",
    description: "Track prayer times for your location with helpful reminders.",
    icon: "⏰"
  },
  {
    title: "Masjid Finder",
    description: "Discover nearby mosques and community events.",
    icon: "🕌"
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <header className="w-full py-6 px-4 md:px-8">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">MuhasabAI</h1>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login?signup=true">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 md:px-8 py-10 md:py-20">
        <section className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Your Personal Islamic Reflection Companion
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            MuhasabAI helps you deepen your Islamic practice through personalized reflections, 
            practical guidance, and spiritual insights.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/login">Get Started</Link>
            </Button>
          </motion.div>
        </section>

        <section className="mb-16 md:mb-24">
          <h3 className="text-2xl md:text-3xl font-semibold text-center mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <CardTitle className="mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="text-center max-w-3xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-semibold mb-6">Start Your Journey</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of Muslims using MuhasabAI to enhance their spiritual journey with privacy-focused, 
            personalized Islamic guidance.
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link href="/login">Get Started</Link>
          </Button>
        </section>
      </main>

      <footer className="w-full py-6 px-4 md:px-8 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} MuhasabAI. All rights reserved.</p>
          <p className="text-sm mt-2">Privacy-focused Islamic reflection assistant</p>
        </div>
      </footer>
    </div>
  );
} 