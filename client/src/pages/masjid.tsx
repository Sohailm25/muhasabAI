import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout } from "@/components/Layout";
import { Tabs, TabList, TabPanels, Tab, TabPanel, Card, CardBody, Box, Heading, Text, useToast } from '@chakra-ui/react';
import MasjidSearch from '../components/MasjidSearch';
import PrayerTimes from '../components/PrayerTimes';

interface SelectedMasjid {
  id: string;
  name: string;
  address: string;
  zipCode: string;
}

interface UserPreferences {
  emailNotifications: boolean;
  darkMode: boolean;
  saveHistory: boolean;
  selectedMasjid?: SelectedMasjid;
}

interface UserSettings {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  preferences: UserPreferences;
  timestamp: string;
}

export default function MasjidPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/settings');
      setSettings(response.data);
      
      // If user has a selected masjid, show the prayer times tab by default
      if (response.data?.preferences?.selectedMasjid) {
        setActiveTab(0);
      } else {
        // Otherwise show the search tab
        setActiveTab(1);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user settings.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMasjidSelect = async (masjid: any) => {
    // When a masjid is selected, switch to the prayer times tab
    await loadUserSettings(); // Reload settings to get the updated masjid
    setActiveTab(0);
  };

  return (
    <Layout title="Masjid & Prayer Times">
      <div className="container max-w-4xl mx-auto py-8">
        <Tabs isFitted variant="enclosed" index={activeTab} onChange={setActiveTab}>
          <TabList mb="1em">
            <Tab>Prayer Times</Tab>
            <Tab>Find Masjid</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              {settings?.preferences.selectedMasjid ? (
                <PrayerTimes 
                  selectedMasjid={settings.preferences.selectedMasjid}
                  onChangeSettings={() => setActiveTab(1)}
                />
              ) : (
                <Card>
                  <CardBody>
                    <Box textAlign="center" py={10}>
                      <Heading size="md" mb={4}>No Masjid Selected</Heading>
                      <Text mb={6}>Please select your local masjid to view prayer times.</Text>
                      <button 
                        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        onClick={() => setActiveTab(1)}
                      >
                        Find Masjid
                      </button>
                    </Box>
                  </CardBody>
                </Card>
              )}
            </TabPanel>
            
            <TabPanel>
              <MasjidSearch onMasjidSelect={handleMasjidSelect} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Layout>
  );
} 