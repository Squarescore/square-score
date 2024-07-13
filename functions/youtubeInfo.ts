import * as functions from 'firebase-functions';
import axios from 'axios';
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: functions.config().youtube.api_key // Make sure to set this in your Firebase config
});

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

    const videoResponse = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId]
    });

    const videoName = videoResponse.data.items?.[0]?.snippet?.title || 'Unknown';

    const captionsResponse = await youtube.captions.list({
      part: ['snippet'],
      videoId: videoId
    });

    let captionTrackUrl = '';
    for (const item of captionsResponse.data.items || []) {
      if (item.snippet?.language === 'en') {
        captionTrackUrl = item.snippet.trackKind === 'ASR' ? item.snippet.audioTrackType : '';
        break;
      }
    }

    if (!captionTrackUrl) {
      throw new functions.https.HttpsError('not-found', 'No English captions found for this video');
    }

    const captionResponse = await axios.get(captionTrackUrl);
    const captionContent = captionResponse.data;

    return {
      videoName,
      captions: captionContent
    };
  } catch (error) {
    console.error('Error fetching YouTube info:', error);
    throw new functions.https.HttpsError('internal', 'Error fetching YouTube info');
  }
});

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}