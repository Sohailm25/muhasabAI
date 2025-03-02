import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'wouter';
import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  Text,
  VStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
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

export default function Home() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
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
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="2xl">MuhasabAI</Heading>
          <Link href="/settings">
            <Button leftIcon={<SettingsIcon />} size="sm">
              Settings
            </Button>
          </Link>
        </Flex>
        
        <Divider />
        
        {/* Prayer Times Section */}
        <Box>
          <PrayerTimes 
            selectedMasjid={settings?.preferences.selectedMasjid}
            onChangeSettings={() => window.location.href = '/settings?returnTo=/'}
          />
        </Box>
        
        <Divider />
        
        {/* Welcome Section */}
        <Box
          p={6}
          bg={bgColor}
          borderWidth="1px"
          borderRadius="lg"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <Heading as="h2" size="lg" mb={4}>
            Welcome to MuhasabAI
          </Heading>
          <Text mb={4}>
            MuhasabAI is your personal Islamic reflection companion. Combine the power of AI with your personal reflections to grow closer to Allah.
          </Text>
          <Text mb={4}>
            Our new prayer times feature helps you stay on track with your daily prayers by showing athan and iqama times for your local masjid.
          </Text>
          <Link href="/profile">
            <Button colorScheme="blue" mt={2}>
              Go to My Profile
            </Button>
          </Link>
        </Box>
      </VStack>
    </Container>
  );
} 