import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Heading,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Flex,
  Badge,
  Spinner,
  Text,
  Button,
  Stack,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';

interface SelectedMasjid {
  id: string;
  name: string;
  address: string;
  zipCode: string;
}

interface PrayerTime {
  name: string;
  athan: string;
  iqama: string;
}

interface DailyPrayerTimes {
  date: string;
  fajr: PrayerTime;
  dhuhr: PrayerTime;
  asr: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
  jummah?: PrayerTime[];
}

interface PrayerTimesProps {
  selectedMasjid?: SelectedMasjid;
  onChangeSettings?: () => void;
}

export const PrayerTimes = ({ selectedMasjid, onChangeSettings }: PrayerTimesProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayPrayers, setTodayPrayers] = useState<DailyPrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string, remaining: string } | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('blue.50', 'blue.900');
  
  useEffect(() => {
    if (selectedMasjid) {
      loadPrayerTimes();
      const interval = setInterval(updateNextPrayer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [selectedMasjid]);
  
  const loadPrayerTimes = async () => {
    if (!selectedMasjid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const response = await axios.get(`/api/masjids/${selectedMasjid.id}/prayertimes?date=${today}`);
      setTodayPrayers(response.data);
      updateNextPrayer();
    } catch (err) {
      console.error('Error loading prayer times:', err);
      setError('Unable to load prayer times. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateNextPrayer = () => {
    if (!todayPrayers) return;
    
    const prayers = [
      { name: 'Fajr', athan: todayPrayers.fajr.athan, iqama: todayPrayers.fajr.iqama },
      { name: 'Dhuhr', athan: todayPrayers.dhuhr.athan, iqama: todayPrayers.dhuhr.iqama },
      { name: 'Asr', athan: todayPrayers.asr.athan, iqama: todayPrayers.asr.iqama },
      { name: 'Maghrib', athan: todayPrayers.maghrib.athan, iqama: todayPrayers.maghrib.iqama },
      { name: 'Isha', athan: todayPrayers.isha.athan, iqama: todayPrayers.isha.iqama }
    ];
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Find the next iqama time
    let nextOne = null;
    
    for (const prayer of prayers) {
      const iqamaTime = new Date(`${todayStr}T${prayer.iqama}:00`);
      
      if (iqamaTime > now) {
        nextOne = {
          name: prayer.name,
          time: prayer.iqama,
          remaining: getTimeRemaining(now, iqamaTime)
        };
        break;
      }
    }
    
    // If no remaining prayers for today, the next one is Fajr tomorrow
    if (!nextOne) {
      nextOne = {
        name: 'Fajr (Tomorrow)',
        time: prayers[0].iqama,
        remaining: '—'
      };
    }
    
    setNextPrayer(nextOne);
  };
  
  const getTimeRemaining = (now: Date, futureTime: Date): string => {
    const diff = futureTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  const formatTime = (timeStr: string): string => {
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  if (!selectedMasjid) {
    return (
      <Box textAlign="center" py={10}>
        <Text mb={4}>No masjid selected yet.</Text>
        {onChangeSettings && (
          <Button
            leftIcon={<SettingsIcon />}
            colorScheme="blue"
            onClick={onChangeSettings}
          >
            Select Your Masjid
          </Button>
        )}
      </Box>
    );
  }
  
  return (
    <Container maxW="container.md" py={6}>
      <Card
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        borderColor={borderColor}
        boxShadow="md"
      >
        <CardHeader pb={0}>
          <Flex justify="space-between" align="center">
            <Box>
              <Heading as="h2" size="md">
                {selectedMasjid.name}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {selectedMasjid.address}
              </Text>
            </Box>
            {onChangeSettings && (
              <Button
                size="sm"
                leftIcon={<SettingsIcon />}
                onClick={onChangeSettings}
                variant="outline"
              >
                Change
              </Button>
            )}
          </Flex>
        </CardHeader>
        
        <CardBody>
          {loading ? (
            <Flex justify="center" align="center" direction="column" py={10}>
              <Spinner size="xl" mb={4} />
              <Text>Loading prayer times...</Text>
            </Flex>
          ) : error ? (
            <Text color="red.500" textAlign="center">{error}</Text>
          ) : todayPrayers ? (
            <Stack spacing={6}>
              {nextPrayer && (
                <Box
                  p={4}
                  borderRadius="md"
                  bg={highlightColor}
                  textAlign="center"
                >
                  <Text fontWeight="bold" mb={1}>Next Prayer</Text>
                  <Heading size="lg">{nextPrayer.name}</Heading>
                  <Text fontSize="2xl" fontWeight="bold">{formatTime(nextPrayer.time)}</Text>
                  <Badge colorScheme="blue" fontSize="sm" mt={1}>
                    {nextPrayer.remaining !== '—' ? `in ${nextPrayer.remaining}` : nextPrayer.remaining}
                  </Badge>
                </Box>
              )}
              
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Tbody>
                    <Tr bg={nextPrayer?.name === 'Fajr' ? highlightColor : undefined}>
                      <Td fontWeight="bold">Fajr</Td>
                      <Td>Athan: {formatTime(todayPrayers.fajr.athan)}</Td>
                      <Td>Iqama: {formatTime(todayPrayers.fajr.iqama)}</Td>
                    </Tr>
                    <Tr bg={nextPrayer?.name === 'Dhuhr' ? highlightColor : undefined}>
                      <Td fontWeight="bold">Dhuhr</Td>
                      <Td>Athan: {formatTime(todayPrayers.dhuhr.athan)}</Td>
                      <Td>Iqama: {formatTime(todayPrayers.dhuhr.iqama)}</Td>
                    </Tr>
                    <Tr bg={nextPrayer?.name === 'Asr' ? highlightColor : undefined}>
                      <Td fontWeight="bold">Asr</Td>
                      <Td>Athan: {formatTime(todayPrayers.asr.athan)}</Td>
                      <Td>Iqama: {formatTime(todayPrayers.asr.iqama)}</Td>
                    </Tr>
                    <Tr bg={nextPrayer?.name === 'Maghrib' ? highlightColor : undefined}>
                      <Td fontWeight="bold">Maghrib</Td>
                      <Td>Athan: {formatTime(todayPrayers.maghrib.athan)}</Td>
                      <Td>Iqama: {formatTime(todayPrayers.maghrib.iqama)}</Td>
                    </Tr>
                    <Tr bg={nextPrayer?.name === 'Isha' ? highlightColor : undefined}>
                      <Td fontWeight="bold">Isha</Td>
                      <Td>Athan: {formatTime(todayPrayers.isha.athan)}</Td>
                      <Td>Iqama: {formatTime(todayPrayers.isha.iqama)}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
              
              {todayPrayers.jummah && todayPrayers.jummah.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Heading as="h3" size="sm" mb={2}>
                      Jummah Prayer Times
                    </Heading>
                    <SimpleGrid columns={todayPrayers.jummah.length > 1 ? 2 : 1} spacing={4}>
                      {todayPrayers.jummah.map((jummah, index) => (
                        <Stat key={index} p={2} borderRadius="md" borderWidth="1px">
                          <StatLabel>Jummah {todayPrayers.jummah!.length > 1 ? `#${index + 1}` : ''}</StatLabel>
                          <StatNumber>{formatTime(jummah.iqama)}</StatNumber>
                          <StatHelpText>Khutbah: {formatTime(jummah.athan)}</StatHelpText>
                        </Stat>
                      ))}
                    </SimpleGrid>
                  </Box>
                </>
              )}
            </Stack>
          ) : null}
        </CardBody>
      </Card>
    </Container>
  );
};

export default PrayerTimes; 