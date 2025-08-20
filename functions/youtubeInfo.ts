import * as functions from 'firebase-functions';
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: functions.config().youtube.api_key
});

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const getYouTubeInfo = functions.https.onCall(async (data, context) => {
  const { youtubeLink } = data;

  if (!youtubeLink) {
    throw new functions.https.HttpsError('invalid-argument', 'YouTube link is required');
  }

  try {
    const videoId = extractVideoId(youtubeLink);
    if (!videoId) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid YouTube link');
    }

    // Get video details
    const videoResponse = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId]
    });

    if (!videoResponse.data.items?.length) {
      throw new functions.https.HttpsError('not-found', 'Video not found');
    }

    const videoTitle = videoResponse.data.items[0].snippet?.title || 'Untitled';

    // Get caption tracks
    const captionsResponse = await youtube.captions.list({
      part: ['snippet'],
      videoId: videoId
    });

    // Look for English captions
    const englishCaptions = captionsResponse.data.items?.find(item => 
      item.snippet?.language === 'en' && 
      (item.snippet?.trackKind === 'standard' || item.snippet?.trackKind === 'ASR')
    );

    if (!englishCaptions) {
      throw new functions.https.HttpsError(
        'failed-precondition', 
        'No English captions found for this video. Please choose a video with English captions.'
      );
    }

    // Get the caption content
    const captionTrack = await youtube.captions.download({
      id: englishCaptions.id!
    });

    // Process captions into plain text
    const captionText = captionTrack.data
      .replace(/\[\w+\]|\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g, '') // Remove timestamps and [Sound effects]
      .replace(/\n\n/g, ' ') // Replace double newlines with space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return {
      title: videoTitle,
      text: captionText,
      videoId: videoId
    };

  } catch (error: any) {
    console.error('Error fetching YouTube info:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process YouTube video: ' + (error.message || 'Unknown error')
    );
  }
});