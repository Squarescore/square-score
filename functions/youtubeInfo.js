const functions = require('firebase-functions');
const axios = require('axios');

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url) => {
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

exports.getYouTubeInfo = functions.https.onCall(async (data, context) => {
  console.log('Request received for video processing');
  const { youtubeLink } = data;

  if (!youtubeLink) {
    throw new functions.https.HttpsError('invalid-argument', 'YouTube link is required');
  }

  try {
    // Extract video ID
    const videoId = extractVideoId(youtubeLink);
    if (!videoId) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid YouTube URL format');
    }

    console.log('Processing video ID:', videoId);

    // Get transcript using Supadata API
    const response = await axios.get('https://api.supadata.ai/v1/youtube/transcript', {
      params: {
        id: videoId,
        text: true, // Get plain text transcript
        lang: 'en'  // Specifically request English
      },
      headers: {
        'x-api-key': functions.config().supadata.api_key
      }
    });

    // Check if we got English captions
    if (response.data.lang !== 'en' && response.data.availableLangs?.includes('en')) {
      // If English is available but we got a different language, try again specifically for English
      console.log('Retrying with explicit English language request');
      const englishResponse = await axios.get('https://api.supadata.ai/v1/youtube/transcript', {
        params: {
          id: videoId,
          text: true,
          lang: 'en-US' // Try with more specific English locale
        },
        headers: {
          'x-api-key': functions.config().supadata.api_key
        }
      });
      response.data = englishResponse.data;
    }

    // Get video metadata
    const metadataResponse = await axios.get('https://api.supadata.ai/v1/youtube/video', {
      params: { id: videoId },
      headers: {
        'x-api-key': functions.config().supadata.api_key
      }
    });

    console.log('Successfully processed video:', {
      title: metadataResponse.data.title,
      transcriptLength: response.data.content.length,
      language: response.data.lang,
      availableLanguages: response.data.availableLangs
    });

    // If we still don't have English captions, inform the user
    if (response.data.lang !== 'en' && response.data.lang !== 'en-US') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `This video doesn't have English captions. Available languages: ${response.data.availableLangs.join(', ')}`
      );
    }

    return {
      title: metadataResponse.data.title,
      text: response.data.content,
      videoId: videoId,
      language: response.data.lang
    };

  } catch (error) {
    console.error('Error in getYouTubeInfo:', error.response?.data || error);
    
    if (error.response?.status === 404) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No captions found for this video. Please choose a video with English captions.'
      );
    }
    
    if (error.response?.status === 429) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'API rate limit exceeded. Please try again later.'
      );
    }

    if (error.response?.data?.error === 'invalid-request') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid request: ' + (error.response.data.details || error.response.data.message)
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to process YouTube video: ' + (error.message || 'Unknown error')
    );
  }
}); 