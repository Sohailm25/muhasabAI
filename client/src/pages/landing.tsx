import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Star, ShieldCheck, Clock, BookOpen, PenLine, ClipboardList } from "lucide-react";

// Core features with detailed descriptions
const coreFeatures = [
  {
    title: "HalaqAI",
    arabic: "حلقة",
    arabicName: "Halaqa",
    description: "Document and extract meaningful insights from Islamic lectures, classes, and study circles. Transform passive listening into actionable knowledge with personalized implementation plans.",
    icon: <BookOpen className="h-12 w-12 text-primary" />,
    benefits: ["Extract key learnings from Islamic talks", "Document insights for future reference", "Get personalized action steps"],
    color: "from-emerald-500/20 to-emerald-500/5"
  },
  {
    title: "MuhasabAI",
    arabic: "محاسبة",
    arabicName: "Muhasaba",
    description: "Engage in guided self-reflection based on the Islamic practice of self-accountability. Receive thoughtful follow-up questions that deepen your understanding and growth.",
    icon: <PenLine className="h-12 w-12 text-primary" />,
    benefits: ["Private space for Islamic reflection", "AI-guided follow-up questions", "Personal insights and growth tracking"],
    color: "from-blue-500/20 to-blue-500/5"
  },
  {
    title: "WirdhAI",
    arabic: "ورد",
    arabicName: "Wird",
    description: "Build consistent spiritual routines with realistic goals and habit tracking. Use our unique CLEAR framework and 30-day challenges to establish meaningful Islamic practices.",
    icon: <ClipboardList className="h-12 w-12 text-primary" />,
    benefits: ["30-day spiritual challenges", "Identity-based habit formation", "Progress visualization and tracking"],
    color: "from-amber-500/20 to-amber-500/5"
  }
];

// Testimonials from users
const testimonials = [
  {
    quote: "MuhasabAI has transformed my Islamic practice by helping me translate knowledge into action. The reflections have been incredibly insightful.",
    name: "Ahmed K.",
    role: "Student",
  },
  {
    quote: "Using WirdhAI helped me build consistency in my daily adhkar and Quran reading. The 30-day challenges are perfect for building lasting habits.",
    name: "Fatima R.",
    role: "Professional",
  },
  {
    quote: "HalaqAI turns every lecture into a treasure of knowledge. Being able to document insights and get personalized action steps has been revolutionary.",
    name: "Ibrahim M.",
    role: "Teacher",
  }
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: custom * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom: number) => ({
    opacity: 1,
    scale: 1,
    transition: { 
      delay: custom * 0.1,
      duration: 0.5 
    }
  })
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Islamic Pattern Background - Subtle and tasteful */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none z-0 bg-repeat" 
           style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }} />
      
      {/* Header */}
      <header className="w-full py-6 px-4 md:px-8 relative z-10">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <h1 className="text-2xl font-bold text-primary">MuhasabAI</h1>
            <span className="text-xl text-primary/70 font-arabic">محاسبة</span>
          </motion.div>
          <motion.div 
            className="flex gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login?signup=true">Sign Up</Link>
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 md:px-8 relative z-10">
        {/* Hero Section with Islamic Calligraphy Element */}
        <section className="py-16 md:py-24 relative">
          {/* Decorative element - subtle Islamic calligraphy */}
          <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/3 opacity-10 dark:opacity-5 pointer-events-none">
            <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M40,100 Q50,50 100,50 Q150,50 160,100 Q150,150 100,150 Q50,150 40,100 Z" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M70,80 L130,80 M70,100 L130,100 M70,120 L130,120" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { 
                    staggerChildren: 0.2 
                  } 
                }
              }}
            >
              <motion.h2 
                variants={fadeIn}
                custom={0}
                className="text-4xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight"
              >
                Your Personal Islamic <br/>
                Reflection Companion
              </motion.h2>

              <motion.p 
                variants={fadeIn}
                custom={1}
                className="text-xl md:text-2xl text-muted-foreground mx-auto max-w-2xl mb-6 md:mb-8"
              >
                Deepen your spiritual journey with AI-guided reflections, habit tracking, and meaningful Islamic practices.
              </motion.p>

              <motion.div
                variants={fadeIn}
                custom={2}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              >
                <Button size="lg" asChild className="text-lg px-8 py-6">
                  <Link href="/login?signup=true">
                    Get Started
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                  <Link href="/help">
                    Learn More
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Trust Elements */}
            <motion.div 
              className="flex flex-wrap gap-6 justify-center items-center text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Client-side Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span>Authentic Islamic Content</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Consistent Growth</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="py-16 md:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <motion.h3 
              variants={fadeIn}
              custom={0}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Core Features
            </motion.h3>
            <motion.p 
              variants={fadeIn}
              custom={1}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              MuhasabAI combines Islamic traditions with modern AI to help you grow spiritually
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                custom={index}
                className="h-full"
              >
                <Card className="h-full overflow-hidden border-0 shadow-md">
                  <div className={`bg-gradient-to-br ${feature.color} p-8 relative overflow-hidden`}>
                    <span className="absolute top-4 right-4 opacity-30 font-arabic text-3xl">{feature.arabic}</span>
                    <div className="mb-4 relative z-10">{feature.icon}</div>
                    <h4 className="text-2xl font-bold mb-1 relative z-10">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2 relative z-10">
                      {feature.arabicName} • {feature.arabic}
                    </p>
                  </div>
                  <CardContent className="p-6">
                    <p className="mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                            <ChevronRight className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 md:py-24 relative">
          {/* Decorative element - subtle Islamic geometric pattern */}
          <div className="absolute left-0 top-1/2 -translate-x-1/2 opacity-10 dark:opacity-5 pointer-events-none">
            <svg width="300" height="300" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50,10 L90,50 L50,90 L10,50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M25,25 L75,25 L75,75 L25,75 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h3 
              variants={fadeIn}
              custom={0}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Your Journey With Us
            </motion.h3>
            <motion.p 
              variants={fadeIn}
              custom={1}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              A simple process to deepen your Islamic practice
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { 
                title: "Reflect", 
                description: "Share your thoughts in a private, secure space designed for Islamic reflection and growth." 
              },
              { 
                title: "Learn", 
                description: "Receive personalized insights and follow-up questions that deepen your understanding." 
              },
              { 
                title: "Grow", 
                description: "Track your spiritual progress and build consistency in your Islamic practices." 
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                custom={i}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 text-xl font-bold">
                    {i + 1}
                  </div>
                  <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full -translate-x-1/2 text-muted-foreground/30 transform rotate-[-30deg]">
                    <ChevronRight className="h-8 w-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-muted/30 rounded-2xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h3 
              variants={fadeIn}
              custom={0}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              What Our Users Say
            </motion.h3>
            <motion.p 
              variants={fadeIn}
              custom={1}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Join thousands of Muslims enhancing their spiritual journey
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                custom={i}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex text-amber-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="italic mb-4">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { 
                  staggerChildren: 0.2 
                } 
              }
            }}
            className="max-w-3xl mx-auto"
          >
            <motion.h3 
              variants={fadeIn}
              custom={0}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Begin Your Spiritual Journey
            </motion.h3>
            <motion.p 
              variants={fadeIn}
              custom={1}
              className="text-xl text-muted-foreground mb-8 mx-auto max-w-2xl"
            >
              Join a community of Muslims using MuhasabAI to enhance their spiritual growth with privacy-focused, 
              personalized Islamic guidance.
            </motion.p>
            
            <motion.div
              variants={fadeIn}
              custom={2}
            >
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/login?signup=true">
                  Get Started Now
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="w-full py-12 px-4 md:px-8 relative z-10 border-t">
        <div className="container mx-auto text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-primary">MuhasabAI</h2>
            <span className="text-lg text-primary/70 font-arabic">محاسبة</span>
          </div>
          
          <div className="mb-6 flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              Help & Support
            </Link>
            <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Use
            </Link>
            <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              About Us
            </Link>
          </div>
          
          <div className="text-muted-foreground">
            <p>© {new Date().getFullYear()} MuhasabAI. All rights reserved.</p>
            <p className="text-sm mt-2">
              "Whoever takes a path to gain knowledge, Allah will make easy for him the path to Paradise." - Prophet Muhammad ﷺ
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 