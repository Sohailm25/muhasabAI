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
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useLocation } from 'wouter';

interface UserPreferences {
  emailNotifications: boolean;
  darkMode: boolean;
  saveHistory: boolean;
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
  
  const toast = useToast();
  const [location, setLocation] = useLocation();
  
  // Parse query parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('returnTo') || '/';
  
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
  
  const handleDone = () => {
    setLocation(returnTo);
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
      
      <Stack spacing={6}>
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
    </Container>
  );
} 