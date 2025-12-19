import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to read from environment first (check both VITE_API_KEY and GEMINI_API_KEY for compatibility)
let apiKey = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;

// If not found, try reading .env file directly
if (!apiKey) {
  try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
    const match = envContent.match(/(?:VITE_API_KEY|GEMINI_API_KEY)\s*=\s*(.+)/);
    if (match) {
      apiKey = match[1].trim();
      // Remove quotes if present
      apiKey = apiKey.replace(/^["']|["']$/g, '');
    }
  } catch (err) {
    console.log('Could not read .env file');
  }
}

// Try .env.local
if (!apiKey) {
  try {
    const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8');
    const match = envContent.match(/(?:VITE_API_KEY|GEMINI_API_KEY)\s*=\s*(.+)/);
    if (match) {
      apiKey = match[1].trim();
      // Remove quotes if present
      apiKey = apiKey.replace(/^["']|["']$/g, '');
    }
  } catch (err) {
    console.log('Could not read .env.local file');
  }
}

console.log('='.repeat(60));
console.log('API Key Validation Test');
console.log('='.repeat(60));
console.log();

if (!apiKey) {
  console.error('❌ ERROR: VITE_API_KEY not found in environment variables or .env files');
  console.log();
  console.log('Please ensure you have a .env or .env.local file with:');
  console.log('VITE_API_KEY=your_api_key_here');
  console.log();
  console.log('Note: Do NOT use quotes around the API key in .env files');
  console.log('Note: The variable must be prefixed with VITE_ to work with Vite');
  process.exit(1);
}

console.log('✅ API Key found');
console.log(`   Length: ${apiKey.length} characters`);
console.log(`   Starts with: ${apiKey.substring(0, 10)}...`);
console.log(`   Ends with: ...${apiKey.substring(apiKey.length - 10)}`);
console.log();

// Check for common issues
const issues = [];
if (apiKey.includes('"') || apiKey.includes("'")) {
  issues.push('⚠️  API key contains quotes - remove quotes from .env file');
}
if (apiKey.startsWith(' ') || apiKey.endsWith(' ')) {
  issues.push('⚠️  API key has leading/trailing whitespace');
}
if (apiKey.length !== 39) {
  issues.push(`⚠️  API key length is ${apiKey.length}, expected 39`);
}

if (issues.length > 0) {
  console.log('Issues detected:');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log();
}

// Test the API key
console.log('Testing API key with Gemini API...');
console.log();

const MODEL_NAME = 'gemini-live-2.5-flash-native-audio';

try {
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  
  console.log(`Attempting to connect to model: ${MODEL_NAME}`);
  console.log();
  
  // Test with a simple live session connection
  const sessionPromise = ai.live.connect({
    model: MODEL_NAME,
    config: {
      responseModalities: [],
      systemInstruction: 'You are a test assistant.',
    },
    callbacks: {
      onopen: () => {
        console.log('✅ SUCCESS: Session opened successfully!');
        console.log('   API key is valid and has access to the model.');
        console.log();
        console.log('Closing test session...');
        sessionPromise.then(session => {
          if (session && typeof session.close === 'function') {
            try {
              const closeResult = session.close();
              // Check if close() returns a promise
              if (closeResult && typeof closeResult.then === 'function') {
                closeResult.then(() => {
                  console.log('✅ Test session closed');
                  process.exit(0);
                }).catch(err => {
                  console.error('Error closing session:', err);
                  process.exit(0);
                });
              } else {
                // close() doesn't return a promise, just exit
                console.log('✅ Test session closed');
                process.exit(0);
              }
            } catch (err) {
              console.error('Error calling session.close():', err);
              process.exit(0);
            }
          } else {
            console.log('⚠️  Session object missing or no close method');
            process.exit(0);
          }
        }).catch(err => {
          console.error('Error getting session:', err);
          process.exit(0);
        });
      },
      onclose: (event) => {
        console.log('❌ Session closed');
        if (event) {
          console.log(`   Code: ${event.code}`);
          console.log(`   Reason: ${event.reason || 'No reason provided'}`);
          console.log(`   Was Clean: ${event.wasClean}`);
        }
        console.log();
        if (event?.reason?.includes('API key')) {
          console.log('❌ ERROR: API key validation failed');
          console.log();
          console.log('Possible issues:');
          console.log('1. API key is invalid or expired');
          console.log('2. API key does not have access to this model');
          console.log('3. API key has extra whitespace or quotes');
          console.log('4. Wrong API key format');
          console.log();
          console.log('Please check:');
          console.log('- Your API key in .env or .env.local');
          console.log('- Ensure there are NO quotes around the key');
          console.log('- Ensure there is NO whitespace before/after the key');
          console.log('- Verify the key is active in Google Cloud Console');
        }
        process.exit(1);
      },
      onerror: (err) => {
        console.error('❌ ERROR:', err);
        console.log();
        console.log('This could indicate:');
        console.log('- Invalid API key');
        console.log('- Network connectivity issues');
        console.log('- API service unavailable');
        process.exit(1);
      },
      onmessage: () => {
        // Ignore messages for test
      }
    }
  });
  
  // Set a timeout
  setTimeout(() => {
    console.log('⏱️  Timeout: No response from API after 10 seconds');
    console.log('   This might indicate the API key is invalid or the model is unavailable');
    process.exit(1);
  }, 10000);
  
} catch (error) {
  console.error('❌ ERROR creating API client:', error.message);
  console.log();
  console.log('This could indicate:');
  console.log('- Invalid API key format');
  console.log('- Missing or incorrect API key');
  process.exit(1);
}

