const express = require('express');
const { exec } = require('youtube-dl-exec');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const open = (...args) => import('open').then(({ default: open }) => open(...args));
const app = express();
const port = process.env.PORT || 3005;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/download', limiter);

// Enhanced logging with timestamp
const log = {
    info: (message, data = '') => console.log(`[INFO][${new Date().toISOString()}] ${message}`, data),
    error: (message, error) => {
        console.error(`[ERROR][${new Date().toISOString()}] ${message}:`, error);
        if (error.stack) console.error(`[ERROR][${new Date().toISOString()}] Stack trace:`, error.stack);
    },
    debug: (message, data = '') => {
        if (process.env.DEBUG === 'true') {
            console.log(`[DEBUG][${new Date().toISOString()}] ${message}`, data);
        }
    }
};

// Set downloads directory (configurable via env variable)
const downloadsDir = process.env.DOWNLOADS_DIR || path.join(__dirname, 'downloads');

// Ensure downloads directory exists
async function ensureDirectoryExists(directory) {
    try {
        await fs.access(directory);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(directory, { recursive: true });
            log.info(`Created directory: ${directory}`);
        } else {
            throw error;
        }
    }
}

// URL validation function
function isValidYoutubeUrl(url) {
    if (!url) return false;
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}(\?.*)?$/;
    return regex.test(url);
}

// Function to clean up old files
async function cleanupOldFiles() {
    try {
        const files = await fs.readdir(downloadsDir);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(downloadsDir, file);
            const stats = await fs.stat(filePath);

            // Remove files older than 1 hour
            if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
                await fs.unlink(filePath);
                log.info(`Cleaned up old file: ${file}`);
            }
        }
    } catch (error) {
        log.error('Error during cleanup', error);
    }
}

// Middleware to check dependencies
app.use(async (req, res, next) => {
    // Only check once per server start
    if (!app.locals.dependenciesChecked) {
        try {
            // Check if youtube-dl-exec is installed
            require.resolve('youtube-dl-exec');

            // Ensure downloads directory exists
            await ensureDirectoryExists(downloadsDir);

            // Run initial cleanup
            await cleanupOldFiles();

            app.locals.dependenciesChecked = true;
        } catch (e) {
            log.error('Dependency check failed', e);
            return res.status(500).send('Server configuration error. Please check logs.');
        }
    }
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Download endpoint
app.get('/download', async (req, res) => {
    const { url } = req.query;
    log.info('Received download request for URL:', url);

    if (!isValidYoutubeUrl(url)) {
        log.error('Invalid URL provided:', url);
        return res.status(400).send('Invalid or missing YouTube URL');
    }

    let outputPath = null;

    try {
        // Generate a unique filename
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 10);
        outputPath = path.join(downloadsDir, `audio_${timestamp}_${uniqueId}.mp3`);

        log.info('Starting download process...');

        // Configure youtube-dl options
        const options = {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0, // Best quality
            output: outputPath,
            noWarnings: true,
            preferFreeFormats: true,
            noCheckCertificate: true // Avoid certificate issues
        };

        if (process.env.DEBUG === 'true') {
            options.verbose = true;
        }

        log.debug('Executing youtube-dl with options:', options);

        // Execute with timeout
        const downloadPromise = exec(url, options);

        // Add timeout for the download
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Download timeout after 3 minutes')), 3 * 60 * 1000);
        });

        await Promise.race([downloadPromise, timeoutPromise]);

        log.info('Download completed successfully');

        // Check if file exists and has content
        const fileStats = await fs.stat(outputPath);
        if (fileStats.size === 0) {
            throw new Error('Downloaded file is empty');
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', fileStats.size);
        res.setHeader('Content-Disposition', `attachment; filename="youtube_audio_${timestamp}.mp3"`);

        // Create read stream and pipe to response
        const fileStream = fsSync.createReadStream(outputPath);
        fileStream.pipe(res);

        // Clean up file after sending
        fileStream.on('end', async () => {
            try {
                await fs.unlink(outputPath);
                log.info('Temporary file removed successfully');
            } catch (err) {
                log.error('Error removing file:', err);
            }
        });

        // Handle errors
        fileStream.on('error', (error) => {
            log.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).send('Error streaming audio file');
            }
        });

        // Handle client disconnection
        res.on('close', async () => {
            fileStream.destroy();
            try {
                await fs.access(outputPath);
                await fs.unlink(outputPath);
                log.info('Cleaned up after client disconnection');
            } catch (err) {
                // File might already be deleted, which is fine
            }
        });

    } catch (error) {
        log.error('Download process error:', error);

        // Clean up any partially downloaded file
        if (outputPath) {
            try {
                await fs.access(outputPath);
                await fs.unlink(outputPath);
                log.info('Cleaned up partial file after error');
            } catch (err) {
                // File might not exist, which is fine
            }
        }

        if (!res.headersSent) {
            if (error.message.includes('timeout')) {
                res.status(504).send('Download took too long. Try a shorter video.');
            } else if (error.message.includes('COPYRIGHT_CLAIM')) {
                res.status(403).send('This video cannot be downloaded due to copyright restrictions.');
            } else if (error.message.includes('Video unavailable')) {
                res.status(404).send('This video is unavailable or private.');
            } else {
                res.status(500).send('Error processing request. Please try again later.');
            }
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
        youtubeDl: require('youtube-dl-exec/package.json').version || 'latest',
        app: require('./package.json').version
    };
    log.info('Version info:', versions);
    res.json(versions);
});

// Root endpoint - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Handle errors
app.use((err, req, res, next) => {
    log.error('Unhandled error', err);
    res.status(500).send('Something went wrong!');
});

// Start server
const server = app.listen(port, async () => {
    log.info(`Server running at http://localhost:${port}`);
    log.info('Available endpoints:');
    log.info(`- Download: http://localhost:${port}/download?url=YOUTUBE_URL`);
    log.info(`- Health: http://localhost:${port}/health`);
    log.info(`- Version: http://localhost:${port}/version`);

    // Run cleanup periodically
    setInterval(cleanupOldFiles, 15 * 60 * 1000); // Every 15 minutes

    // Auto-open browser if not in production
    if (process.env.NODE_ENV !== 'production') {
        try {
            await open(`http://localhost:${port}`);
        } catch (error) {
            log.error('Failed to open browser', error);
        }
    }
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    log.info('Received shutdown signal');

    server.close(() => {
        log.info('HTTP server closed');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        log.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

module.exports = app; 