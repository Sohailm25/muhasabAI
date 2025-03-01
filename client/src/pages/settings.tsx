import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import MasjidSearch from '../components/MasjidSearch';
import { useRouter } from 'next/router';

interface UserPreferences {
  emailNotifications: boolean;
  darkMode: boolean;
  saveHistory: boolean;
  selectedMasjid?: {
    id: string;
    name: string;
    address: string;
    zipCode: string;
  };
}

interface UserSettings {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  preferences: UserPreferences;
  timestamp: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const toast = useToast();
  const router = useRouter();
  
  // From URL query parameters - used for returning to previous page
  const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : '/';
  
  useEffect(() => {
    loadUserSettings();
  }, []);
  
  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/settings');
      setSettings(response.data);
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
  
  const updateSettings = async (newPreferences: Partial<UserPreferences>) => {
    if (!settings) return;
    
    try {
      setSaving(true);
      
      const updatedPreferences = {
        ...settings.preferences,
        ...newPreferences
      };
      
      const response = await axios.post('/api/user/settings', {
        preferences: updatedPreferences
      });
      
      setSettings(response.data);
      
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleSwitch = (field: keyof UserPreferences) => {
    if (!settings) return;
    
    const newValue = !settings.preferences[field];
    updateSettings({ [field]: newValue });
  };
  
  const handleMasjidSelect = async (masjid: any) => {
    // When a masjid is selected from MasjidSearch, switch back to the general tab
    setActiveTab(0);
  };
  
  const handleDone = () => {
    router.push(returnTo);
  };
  
  return (
    <Container maxW="container.md" py={6}>
      <Box mb={6}>
        <Button 
          leftIcon={<ArrowBackIcon />} 
          onClick={handleDone}
          variant="ghost"
        >
          Back
        </Button>
      </Box>
      
      <Heading as="h1" mb={6}>Settings</Heading>
      
      <Tabs isFitted variant="enclosed" index={activeTab} onChange={setActiveTab}>
        <TabList mb="1em">
          <Tab>General</Tab>
          <Tab>Change Masjid</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            <Stack spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Prayer Times</Heading>
                </CardHeader>
                <CardBody>
                  {settings?.preferences.selectedMasjid ? (
                    <Box>
                      <Text fontWeight="bold">{settings.preferences.selectedMasjid.name}</Text>
                      <Text>{settings.preferences.selectedMasjid.address}</Text>
                      <Button 
                        mt={4}
                        colorScheme="blue"
                        onClick={() => setActiveTab(1)}
                      >
                        Change Masjid
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Text mb={4}>You haven't selected a masjid yet. Select your local masjid to see prayer times.</Text>
                      <Button 
                        colorScheme="blue"
                        onClick={() => setActiveTab(1)}
                      >
                        Select Masjid
                      </Button>
                    </Box>
                  )}
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="md">Application Settings</Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={4}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="email-notifications" mb="0">
                        Email Notifications
                      </FormLabel>
                      <Switch
                        id="email-notifications"
                        isChecked={settings?.preferences.emailNotifications}
                        onChange={() => handleToggleSwitch('emailNotifications')}
                        isDisabled={loading || saving}
                      />
                    </FormControl>
                    
                    <Divider />
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="dark-mode" mb="0">
                        Dark Mode
                      </FormLabel>
                      <Switch
                        id="dark-mode"
                        isChecked={settings?.preferences.darkMode}
                        onChange={() => handleToggleSwitch('darkMode')}
                        isDisabled={loading || saving}
                      />
                    </FormControl>
                    
                    <Divider />
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="save-history" mb="0">
                        Save History
                      </FormLabel>
                      <Switch
                        id="save-history"
                        isChecked={settings?.preferences.saveHistory}
                        onChange={() => handleToggleSwitch('saveHistory')}
                        isDisabled={loading || saving}
                      />
                    </FormControl>
                  </Stack>
                </CardBody>
              </Card>
            </Stack>
          </TabPanel>
          
          <TabPanel px={0}>
            <MasjidSearch 
              onMasjidSelect={handleMasjidSelect}
              showPreviousButton={true}
              onPrevious={() => setActiveTab(0)}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 