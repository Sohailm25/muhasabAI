import { Layout } from "@/components/Layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  return (
    <Layout title="Your Profile">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Your Profile</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" defaultValue="Muslim User" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Your email" defaultValue="user@example.com" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your experience with SahabAI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email reminders for daily reflections
                  </p>
                </div>
                <Switch id="notifications" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch id="darkMode" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="saveHistory">Save Reflection History</Label>
                  <p className="text-sm text-muted-foreground">
                    Store your reflection history locally
                  </p>
                </div>
                <Switch id="saveHistory" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Data Management</CardTitle>
              <CardDescription>
                Manage your data and account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                These actions are permanent and cannot be undone.
              </p>
              <div className="flex space-x-2">
                <Button variant="outline">Export All Data</Button>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 