import Whisper from 'node-whisper';

export async function transcribeAudio(audioBase64: string): Promise<string> {
  try {
    // Remove the data URL prefix
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Initialize Whisper
    const whisper = new Whisper({
      modelName: 'base',
      temperature: 0.0,
      language: 'en',
    });

    // Transcribe the audio
    const { text } = await whisper.transcribe(audioBuffer);
    return text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}