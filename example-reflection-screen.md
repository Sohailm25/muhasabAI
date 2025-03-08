# Example Reflection Screen Implementation

This is an example of how the new reflection screen would be implemented in React Native, demonstrating UI components, styling, and business logic integration.

## New Reflection Screen

```typescript
// src/screens/reflections/NewReflectionScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextInput, Button, Surface, Divider } from 'react-native-paper';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useAuthenticatedApi } from '../../context/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import WaveformVisualizer from '../../components/audio/WaveformVisualizer';

// Define the form validation schema
const reflectionSchema = z.object({
  content: z.string().min(10, 'Reflection must be at least 10 characters'),
});

type ReflectionFormData = z.infer<typeof reflectionSchema>;

// Define navigation type
type NavigationProp = NativeStackNavigationProp<{
  ReflectionList: undefined;
  ReflectionDetail: { id: string };
}>;

const NewReflectionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const api = useAuthenticatedApi();
  
  // Form state
  const { control, handleSubmit, formState: { errors }, setValue } = useForm<ReflectionFormData>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      content: '',
    }
  });
  
  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [audioPermission, setAudioPermission] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Request audio permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === 'granted');
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    })();
    
    // Cleanup on unmount
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);
  
  // Duration timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);
  
  // Start recording function
  const startRecording = async () => {
    try {
      if (!audioPermission) {
        Alert.alert('Permission Required', 'Please grant microphone permissions to record audio');
        return;
      }
      
      // Reset state
      setRecordingDuration(0);
      
      // Create new recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };
  
  // Stop recording function
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      
      // Start transcription if we have a recording
      if (uri) {
        transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };
  
  // Transcribe audio function
  const transcribeAudio = async (uri: string) => {
    try {
      setIsTranscribing(true);
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any);
      
      // Send to transcription API
      const response = await api.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update form with transcription
      if (response.data?.text) {
        setValue('content', response.data.text);
      } else {
        Alert.alert('Transcription Error', 'Could not transcribe audio properly');
      }
    } catch (error) {
      console.error('Failed to transcribe audio', error);
      Alert.alert('Error', 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Mutation for submitting the reflection
  const createReflectionMutation = useMutation({
    mutationFn: async (data: ReflectionFormData) => {
      const response = await api.post('/api/reflections', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Navigate to the reflection detail page with the new ID
      navigation.navigate('ReflectionDetail', { id: data.id });
    },
    onError: (error) => {
      console.error('Failed to create reflection', error);
      Alert.alert('Error', 'Failed to create reflection. Please try again.');
    },
  });
  
  // Submit handler
  const onSubmit = (data: ReflectionFormData) => {
    createReflectionMutation.mutate(data);
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            New Reflection
          </Text>
          
          {/* Voice Recording Section */}
          <View style={styles.recordingSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Record Your Thoughts
            </Text>
            
            <View style={styles.recordingControls}>
              {isRecording ? (
                <>
                  <View style={styles.recordingIndicator}>
                    <Icon name="mic" size={20} color={theme.colors.error} />
                    <Text style={{ color: theme.colors.error, marginLeft: 8 }}>
                      Recording... {formatDuration(recordingDuration)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.recordButton, { backgroundColor: theme.colors.error }]}
                    onPress={stopRecording}
                  >
                    <Icon name="square" size={24} color="white" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.recordButton, { backgroundColor: theme.colors.primary }]}
                  onPress={startRecording}
                  disabled={isTranscribing}
                >
                  <Icon name="mic" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
            
            {recordingUri && !isTranscribing && (
              <View style={styles.waveformContainer}>
                <WaveformVisualizer audioUri={recordingUri} />
              </View>
            )}
            
            {isTranscribing && (
              <View style={styles.transcribingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={{ marginLeft: 10, color: theme.colors.onSurface }}>
                  Transcribing your recording...
                </Text>
              </View>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          {/* Text Input Section */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Write Your Reflection
          </Text>
          
          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={8}
                placeholder="Share your thoughts, experiences, or reflections..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={styles.textInput}
                error={!!errors.content}
              />
            )}
          />
          
          {errors.content && (
            <Text style={styles.errorText}>
              {errors.content.message}
            </Text>
          )}
          
          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={createReflectionMutation.isPending}
            disabled={createReflectionMutation.isPending || isTranscribing}
          >
            Save Reflection
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={createReflectionMutation.isPending || isTranscribing}
          >
            Cancel
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  recordingSection: {
    marginBottom: 24,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  waveformContainer: {
    height: 60,
    marginVertical: 12,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  divider: {
    marginVertical: 16,
  },
  textInput: {
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 8,
  }
});

export default NewReflectionScreen;
```

## Waveform Visualizer Component

The audio waveform component that's used in the reflection screen:

```typescript
// src/components/audio/WaveformVisualizer.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';

interface WaveformVisualizerProps {
  audioUri: string;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioUri }) => {
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  // Generate random waveform data for visualization
  // In a real app, you would analyze the audio file for actual amplitude data
  useEffect(() => {
    if (audioUri) {
      // Generate some random data for visualization
      const bars = 30;
      const randomData = Array.from({ length: bars }, () => 
        Math.random() * 0.8 + 0.2
      );
      setWaveformData(randomData);
      
      // Load the sound
      (async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: false }
          );
          setSound(sound);
        } catch (error) {
          console.error('Failed to load audio', error);
        }
      })();
    }
    
    // Cleanup
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);
  
  // Play/pause control
  const togglePlayback = async () => {
    if (!sound) return;
    
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
      
      // Monitor playback status to update UI when finished
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.waveform}>
        {waveformData.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: `${height * 100}%`,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        ))}
      </View>
      
      <View style={styles.playButton} onTouchEnd={togglePlayback}>
        <View style={[
          styles.playIcon,
          { borderLeftColor: theme.colors.onSurface }
        ]}>
          {isPlaying ? null : (
            <View style={[
              styles.triangle,
              { borderLeftColor: theme.colors.onSurface }
            ]} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  triangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});

export default WaveformVisualizer;
```

## Usage and Implementation Notes

1. **Audio Recording**:
   - Uses Expo's Audio API for recording and playback
   - Handles permissions automatically
   - Implements a timer to show recording duration
   - Shows visualizer for recorded audio

2. **Form Handling**:
   - Uses React Hook Form for form management
   - Implements Zod for validation
   - Handles form errors with appropriate UI feedback

3. **API Integration**:
   - Uses the authenticated API instance from auth context
   - Sends audio to backend for transcription
   - Submits the reflection data to the server

4. **UI Adaptation**:
   - Uses React Native Paper components for material design
   - Implements responsive layouts with flexbox
   - Handles keyboard behavior for better UX
   - Adapts to theme colors from the theme context

5. **Navigation**:
   - Implements React Navigation for screen transitions
   - Handles navigation based on successful form submission

This implementation demonstrates how the web app's reflection creation feature would be adapted to the iOS native environment while maintaining the same functionality and user experience. 