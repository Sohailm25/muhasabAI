interface TranscriptionResponse {
  text: string;
}

interface TranscriptionError {
  error: string;
  details?: string;
}

export class TranscriptionService {
  private readonly API_URL: string;

  constructor() {
    this.API_URL = `${process.env.NEXT_PUBLIC_API_URL}/transcribe`;
  }

  public async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData: TranscriptionError = await response.json();
        throw new Error(errorData.details || errorData.error);
      }

      const data: TranscriptionResponse = await response.json();
      return data.text;
    } catch (error) {
      console.error('Transcription request failed:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to transcribe audio. Please try again.'
      );
    }
  }
} 