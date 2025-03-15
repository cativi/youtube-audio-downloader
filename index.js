const express = require('express');
const { exec } = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const open = (...args) => import('open').then(({ default: open }) => open(...args));
const app = express();
const port = 3005;

// Check if youtube-dl-exec is installed
try {
    require.resolve('youtube-dl-exec');
} catch (e) {
    console.error('youtube-dl-exec not found! Install it with: npm install youtube-dl-exec');
    process.exit(1);
}

// Enhanced logging function
const log = {
    info: (message, data = '') => console.log(`[INFO] ${message}`, data),
    error: (message, error) => {
        console.error(`[ERROR] ${message}:`, error);
        if (error.stack) console.error('[ERROR] Stack trace:', error.stack);
    },
    debug: (message, data = '') => console.log(`[DEBUG] ${message}`, data)
};

// Set downloads directory (configurable via env variable)
const downloadsDir = process.env.DOWNLOADS_DIR || path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Function to clean up old files
const cleanupOldFiles = () => {
    const files = fs.readdirSync(downloadsDir);
    const now = Date.now();
    files.forEach(file => {
        const filePath = path.join(downloadsDir, file);
        const stats = fs.statSync(filePath);
        // Remove files older than 1 hour
        if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
            fs.unlinkSync(filePath);
            log.info(`Cleaned up old file: ${file}`);
        }
    });
};

// Clean up periodically
setInterval(cleanupOldFiles, 15 * 60 * 1000); // Every 15 minutes

app.get('/download', async (req, res) => {
    const { url } = req.query;
    log.info('Received download request for URL:', url);

    if (!url || (!url.includes('youtube.com/watch?v=') && !url.includes('youtube.com/shorts/'))) {
        log.error('Invalid URL provided:', url);
        return res.status(400).send('Invalid or missing YouTube URL');
    }

    try {
        // Generate a unique filename
        const timestamp = Date.now();
        const outputPath = path.join(downloadsDir, `audio_${timestamp}.mp3`);

        log.info('Starting download process...');

        // Configure youtube-dl options
        const options = {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0, // Best quality
            output: outputPath,
            verbose: true // Debugging info
        };

        log.debug('Executing youtube-dl with options:', options);
        await exec(url, options);

        log.info('Download completed successfully');

        // Set headers for file download
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="audio_${timestamp}.mp3"`);

        // Create read stream and pipe to response
        const fileStream = fs.createReadStream(outputPath);
        fileStream.pipe(res);

        // Clean up file after sending
        fileStream.on('end', () => {
            fs.unlink(outputPath, (err) => {
                if (err) log.error('Error removing file:', err);
                else log.info('Temporary file removed successfully');
            });
        });

        // Handle errors
        fileStream.on('error', (error) => {
            log.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).send('Error streaming audio file');
            }
        });

        // Handle client disconnection
        res.on('close', () => {
            fileStream.destroy();
            fs.unlink(outputPath, () => {
                log.info('Cleaned up after client disconnection');
            });
        });

    } catch (error) {
        log.error('Download process error:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing request');
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    log.info('Health check requested');
    res.status(200).send('Server is healthy');
});

// Version info endpoint
app.get('/version', (req, res) => {
    const versions = {
        node: process.version,
        express: require('express/package.json').version,
        youtubeDl: 'latest'
    };
    log.info('Version info:', versions);
    res.json(versions);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(port, async () => {
    log.info(`Server running at http://localhost:${port}`);
    log.info('Available endpoints:');
    log.info(`- Download: http://localhost:${port}/download?url=YOUTUBE_URL`);
    log.info(`- Health: http://localhost:${port}/health`);
    log.info(`- Version: http://localhost:${port}/version`);

    // Auto-open browser
    await open(`http://localhost:${port}`);
});
