# YouTube Audio Downloader

A simple, secure web application to download YouTube videos as MP3 audio files.

![YouTube Audio Downloader](https://sharemyimage.com/image/Captura-de-pantalla-2025-03-15-a-las-17.42.35.HJ3750)

## ✨ Features

- **Simple Interface**: Easy-to-use web UI for downloading audio
- **Fast Conversion**: Extract audio from YouTube videos in MP3 format
- **Secure**: Built with security best practices including rate limiting and helmet protection
- **Mobile-Friendly**: Responsive design works on all devices
- **No Ads**: Clean, distraction-free experience
- **Auto Cleanup**: Temporary files are automatically removed
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm (comes with Node.js)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/youtube-audio-downloader.git
   cd youtube-audio-downloader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

The application will automatically open in your default browser at `http://localhost:3005`.

### Development Mode

To run the application in development mode with auto-reload:

```bash
npm run dev
```

## 🔧 Configuration

The application can be configured using environment variables:

- `PORT`: Server port (default: 3005)
- `DOWNLOADS_DIR`: Directory for temporary downloaded files
- `DEBUG`: Enable verbose logging (set to "true")
- `NODE_ENV`: Set to "production" for production environment

## 📋 Usage

1. Open the application in your browser
2. Paste a YouTube video URL in the input field
3. Click "Download" and wait for the processing to complete
4. The audio file will automatically download to your device

### Supported URLs

- Regular YouTube videos: `https://www.youtube.com/watch?v=VIDEO_ID`
- YouTube Shorts: `https://www.youtube.com/shorts/VIDEO_ID`
- Short YouTube links: `https://youtu.be/VIDEO_ID`

## 📡 API Endpoints

The application provides the following API endpoints:

### Download Audio

```
GET /download?url=YOUTUBE_URL
```

**Parameters:**
- `url` (required): A valid YouTube video URL

**Response:**
- Audio file (MP3) with appropriate headers for download
- Error message if the download fails

### Health Check

```
GET /health
```

**Response:**
- `200 OK` with message "Server is healthy"

### Version Information

```
GET /version
```

**Response:**
- JSON object with version information for Node.js, Express, youtube-dl, and the application

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse by limiting requests per IP
- **Content Security Policy**: Restricts resource loading to prevent XSS attacks
- **Input Validation**: Validates YouTube URLs before processing
- **Error Handling**: Proper error handling to prevent sensitive information disclosure
- **Automatic Cleanup**: Temporary files are removed after download and older files are cleaned up periodically

## 🛠️ Troubleshooting

### Common Issues

1. **Download fails with error**
   - Check if the video has copyright restrictions
   - Verify that the video is not private or deleted
   - Try again later if the server might be overloaded

2. **Server won't start**
   - Ensure you have Node.js 16.0.0 or higher installed
   - Check if port 3005 is already in use
   - Make sure all dependencies are installed correctly

3. **Slow downloads**
   - Large videos take longer to process
   - Check your internet connection
   - Server might be under heavy load

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/cativi/youtube-audio-downloader/issues) on GitHub.

---

Made with ❤️ by [Carlos](https://cafeconcarlos.com)