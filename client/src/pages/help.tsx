import { Layout } from "@/components/Layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Help() {
  return (
    <Layout title="Help Center">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">How can we help you?</h2>
            <p className="text-muted-foreground">
              Find answers to common questions about using SahabAI to enhance your Islamic journey.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is SahabAI?</AccordionTrigger>
                  <AccordionContent>
                    SahabAI is your AI companion for Islamic reflection and learning. It helps you document and gain insights from your daily Islamic practice, track your learning from classes or seminars, and grow in your faith journey.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I create a reflection?</AccordionTrigger>
                  <AccordionContent>
                    You can create a new reflection by clicking the "New Reflection" button in the sidebar or on the Home page. Then, simply type or record your thoughts, and SahabAI will provide insightful responses to help deepen your understanding.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>What is HalaqaHelper?</AccordionTrigger>
                  <AccordionContent>
                    HalaqaHelper is a feature designed to help you track and organize your learning from Islamic classes, seminars, and study circles (halaqas). It allows you to take notes, save key points, and review your learning journey over time.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>Is my data private?</AccordionTrigger>
                  <AccordionContent>
                    Yes, your reflections and notes are stored locally on your device. We value your privacy and do not share your personal reflections with anyone else.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>How can I provide feedback?</AccordionTrigger>
                  <AccordionContent>
                    We appreciate your feedback! Please use the contact information below to share your thoughts, suggestions, or report any issues you encounter while using SahabAI.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                If you need further assistance or have questions not covered in the FAQ, please reach out to our support team:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p>Email: support@sahabai.com</p>
                <p>Hours: Monday-Friday, 9am-5pm EST</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 