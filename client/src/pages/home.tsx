import { useState } from "react";
import { ReflectionInput } from "@/components/ReflectionInput";
import { ConversationView } from "@/components/ConversationView";
import { ActionItems } from "@/components/ActionItems";
import type { Message } from "@shared/schema";

export default function Home() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);

  const handleReflectionComplete = (data: any) => {
    setConversationId(data.conversation.id);
    setMessages(data.conversation.messages);
    setQuestions(data.questions);
  };

  const handleResponse = (data: any) => {
    setMessages(data.conversation.messages);
    setQuestions(data.questions);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-full flex items-center">
          <h1 className="text-xl font-semibold">Ramadan Reflections</h1>
        </div>
      </header>

      <main className="container pt-20 pb-24">
        {conversationId ? (
          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <ConversationView
              conversationId={conversationId}
              messages={messages}
              questions={questions}
              onResponse={handleResponse}
            />
            <ActionItems
              conversationId={conversationId}
              actionItems={actionItems}
              onGenerate={setActionItems}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="max-w-md text-center space-y-4">
              <h2 className="text-2xl font-semibold">Welcome to Your Reflection Space</h2>
              <p className="text-muted-foreground">
                Share your thoughts and experiences during this blessed month of Ramadan.
                Start by recording your voice or typing your reflection.
              </p>
            </div>
          </div>
        )}
      </main>

      <ReflectionInput onReflectionComplete={handleReflectionComplete} />
    </div>
  );
}
