const http = require('http');
const https = require('https');

// Configuration
const PORT = process.env.PORT || 3001;
const MISSION_CONTROL_API_URL = 'https://effervescent-chicken-480.convex.cloud/api/tasks';
const MISSION_CONTROL_API_TOKEN = 'mc-api-2026-krystalklean';
const DISCORD_CONFIRMATION_WEBHOOK_URL = 'https://discord.com/api/webhooks/1477438592493293638/xaV90J-QFspID5sqCqS1MD_QralgYh1q1GaamEOksFmIV4anjESshzEP3sbvYgzDxQJZ';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/jarvis-idea') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const ideaData = JSON.parse(body);

        // 1. Forward the idea to Mission Control
        const mcResponse = await forwardToMissionControl(ideaData);

        // 2. Post a confirmation back to Discord
        if (mcResponse.success && mcResponse.taskId) {
          await postToDiscord(`✅ Idea captured! Mission Control task ID: `${mcResponse.taskId}``);
        }

        // 3. Respond to the initial request
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Idea relayed to Mission Control.', mcResponse }));

      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to relay idea.' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found. Use POST /jarvis-idea');
  }
});

async function forwardToMissionControl(data) {
  const postData = JSON.stringify({
    ...data,
    source: 'discord' // Ensure source is set
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISSION_CONTROL_API_TOKEN}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(MISSION_CONTROL_API_URL, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseBody));
        } catch (e) {
          reject(new Error('Failed to parse Mission Control response.'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function postToDiscord(message) {
  const postData = JSON.stringify({ content: message });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(DISCORD_CONFIRMATION_WEBHOOK_URL, options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`Discord webhook failed with status: ${res.statusCode}`));
      }
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

server.listen(PORT, () => {
  console.log(`Jarvis Discord Relay Server running on http://localhost:${PORT}`);
  console.log('Listening for POST requests on /jarvis-idea');
});
