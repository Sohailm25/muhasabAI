import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-2 sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-xl font-bold">SahabAI Privacy Policy</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            Last updated on 05/06/2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="p-6 pt-0 h-full max-h-[calc(80vh-120px)]">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              SahabAI is committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, store, and protect your data when you use our application, 
              with a particular focus on our personalization system.
            </p>

            <h2>Our Commitment to Privacy</h2>
            <p>
              We've designed SahabAI with privacy as a foundational principle. Our MuhasabAI reflection feature implements:
            </p>
            <ol>
              <li><strong>End-to-end encryption</strong> for sensitive personal data</li>
              <li><strong>Local-only storage options</strong> that keep your data on your device</li>
              <li><strong>Granular privacy controls</strong> that give you full control over what is shared</li>
              <li><strong>Minimized data collection</strong> to only process what's necessary for the service</li>
            </ol>

            <h2>Information We Collect</h2>
            
            <h3>Public Profile Information</h3>
            <p>
              The following information may be stored on our servers:
            </p>
            <ul>
              <li>User ID (randomly generated, not tied to personal identifiers)</li>
              <li>General preferences (input method, reflection frequency, language)</li>
              <li>Privacy settings</li>
              <li>Non-sensitive usage statistics (number of reflections, streak days)</li>
              <li>Account creation and update timestamps</li>
            </ul>
            <p>
              This information helps us provide basic functionality and improve our service.
            </p>

            <h3>Private Profile Information</h3>
            <p>
              The following sensitive information is <strong>always encrypted on your device before transmission</strong>:
            </p>
            <ul>
              <li>Spiritual journey information</li>
              <li>Personal goals and interests</li>
              <li>Knowledge level and life stage</li>
              <li>Cultural and community background</li>
              <li>Reflection preferences</li>
              <li>Topics of interest</li>
              <li>Interaction history</li>
            </ul>
            <p>
              The encryption key for this data <strong>never leaves your device</strong> unless you explicitly export it for backup or multi-device use.
            </p>

            <h2>How We Use Your Information</h2>
            
            <h3>Personalization</h3>
            <p>
              SahabAI's MuhasabAI feature uses your information to:
            </p>
            <ul>
              <li>Personalize Islamic reflections to your spiritual journey</li>
              <li>Adapt content to match your knowledge level and interests</li>
              <li>Remember context from previous interactions</li>
              <li>Improve suggestions based on your engagement patterns</li>
            </ul>

            <h3>Improvement of Services</h3>
            <p>
              We use aggregated, anonymized data to:
            </p>
            <ul>
              <li>Identify common patterns of usage</li>
              <li>Improve our AI responses and features</li>
              <li>Fix technical issues</li>
              <li>Develop new features</li>
            </ul>

            <h2>Data Storage and Security</h2>
            
            <h3>End-to-End Encryption</h3>
            <p>
              All sensitive personal information is encrypted using AES-256 encryption before leaving your device. The encryption key is:
            </p>
            <ul>
              <li>Generated and stored locally on your device</li>
              <li>Never transmitted to our servers</li>
              <li>Required to decrypt your private information</li>
            </ul>

            <h3>Storage Options</h3>
            <p>
              You can choose between:
            </p>
            <ul>
              <li><strong>Local storage only</strong>: All data stays on your device and is never sent to our servers</li>
              <li><strong>Encrypted cloud storage</strong>: Encrypted data is stored on our servers but can only be decrypted with your key</li>
              <li><strong>Multi-device sync</strong>: Securely transfer your profile between devices using our key export feature</li>
            </ul>

            <h3>Security Measures</h3>
            <p>
              We implement the following security measures:
            </p>
            <ul>
              <li>Secure HTTPS connections for all data transmission</li>
              <li>Regular security audits</li>
              <li>Database access controls and monitoring</li>
              <li>Data segregation between public and private information</li>
            </ul>

            <h2>Your Privacy Controls</h2>
            <p>
              SahabAI gives you comprehensive control over your data:
            </p>
            
            <h3>Privacy Settings</h3>
            <ul>
              <li><strong>Local storage only</strong>: Opt out of server storage completely</li>
              <li><strong>Personalization controls</strong>: Choose what aspects of your profile can be used for personalization</li>
              <li><strong>Sync settings</strong>: Enable or disable profile synchronization across devices</li>
            </ul>

            <h3>Data Management</h3>
            <ul>
              <li><strong>Export</strong>: Download a copy of all your data</li>
              <li><strong>Delete</strong>: Permanently remove your profile and data from our servers</li>
              <li><strong>Reset</strong>: Start fresh with a new profile</li>
              <li><strong>Key backup</strong>: Securely back up your encryption key for recovery</li>
            </ul>

            <h2>Children's Privacy</h2>
            <p>
              SahabAI is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@sahabai.com</li>
            </ul>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 