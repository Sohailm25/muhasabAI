import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  FormControl,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  VStack,
  Card,
  CardBody,
  Divider,
  useToast
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

interface Masjid {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website?: string;
  phone?: string;
}

interface MasjidSearchProps {
  onMasjidSelect?: (masjid: Masjid) => void;
  showPreviousButton?: boolean;
  onPrevious?: () => void;
}

export const MasjidSearch = ({ 
  onMasjidSelect, 
  showPreviousButton = false,
  onPrevious
}: MasjidSearchProps) => {
  const [zipCode, setZipCode] = useState('');
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMasjid, setSelectedMasjid] = useState<Masjid | null>(null);
  
  const toast = useToast();

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(e.target.value);
  };

  const searchMasjids = async () => {
    if (!zipCode || zipCode.length !== 5) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/masjids/search?zipCode=${zipCode}`);
      setMasjids(response.data);
      
      if (response.data.length === 0) {
        setError('No masjids found in this area. Try another zip code.');
      }
    } catch (err) {
      console.error('Error searching for masjids:', err);
      setError('Failed to search for masjids. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMasjid = async (masjid: Masjid) => {
    setSelectedMasjid(masjid);
    
    try {
      await axios.post('/api/user/settings/preferred-masjid', {
        masjidId: masjid._id,
        masjidName: masjid.name,
        masjidAddress: `${masjid.address}, ${masjid.city}, ${masjid.state} ${masjid.zip}`,
        masjidZipCode: masjid.zip
      });
      
      toast({
        title: 'Masjid Selected',
        description: `${masjid.name} has been set as your preferred masjid.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      if (onMasjidSelect) {
        onMasjidSelect(masjid);
      }
    } catch (err) {
      console.error('Error setting preferred masjid:', err);
      toast({
        title: 'Error',
        description: 'Failed to set your preferred masjid. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" py={6}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="lg" textAlign="center">
          Find Your Local Masjid
        </Heading>
        
        <FormControl>
          <InputGroup size="lg">
            <Input
              placeholder="Enter zip code"
              value={zipCode}
              onChange={handleZipCodeChange}
              type="number"
              maxLength={5}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  searchMasjids();
                }
              }}
            />
            <InputRightElement width="4.5rem">
              <Button
                h="1.75rem"
                size="sm"
                onClick={searchMasjids}
                isLoading={loading}
              >
                <SearchIcon />
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>
        
        {error && (
          <Text color="red.500" textAlign="center">
            {error}
          </Text>
        )}
        
        {masjids.length > 0 && (
          <Box>
            <Text mb={4} fontWeight="medium">
              Found {masjids.length} masjids in {zipCode}:
            </Text>
            <Stack spacing={4}>
              {masjids.map((masjid) => (
                <Card 
                  key={masjid._id} 
                  variant="outline"
                  borderColor={selectedMasjid?._id === masjid._id ? "blue.500" : "gray.200"}
                  boxShadow={selectedMasjid?._id === masjid._id ? "md" : "none"}
                >
                  <CardBody>
                    <Stack spacing={2}>
                      <Heading size="md">{masjid.name}</Heading>
                      <Text>{masjid.address}, {masjid.city}, {masjid.state} {masjid.zip}</Text>
                      {masjid.phone && <Text>Phone: {masjid.phone}</Text>}
                      {masjid.website && (
                        <Text>
                          Website:{' '}
                          <a href={masjid.website} target="_blank" rel="noopener noreferrer">
                            {masjid.website}
                          </a>
                        </Text>
                      )}
                      <Divider my={2} />
                      <Button
                        colorScheme="blue"
                        onClick={() => handleSelectMasjid(masjid)}
                        isDisabled={selectedMasjid?._id === masjid._id}
                      >
                        {selectedMasjid?._id === masjid._id ? 'Selected' : 'Select This Masjid'}
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
        
        {showPreviousButton && onPrevious && (
          <Button onClick={onPrevious} mt={4} variant="outline">
            Go Back
          </Button>
        )}
      </VStack>
    </Container>
  );
};

export default MasjidSearch; 