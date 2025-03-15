# YouTube Audio Downloader API

## Overview
This is a simple Express.js application that allows users to download audio from YouTube videos in MP3 format. The application utilizes `youtube-dl-exec` to extract audio and serves it to users as a downloadable file.

## Features
- Download YouTube videos as MP3 audio files.
- Automatic cleanup of old files (older than 1 hour) to save storage.
- Health check endpoint to verify the server status.
- Version info endpoint to check dependencies.
- **Auto-open browser** upon startup for better user experience.
- **Cross-platform support** (Windows, macOS, Linux).

## Requirements
- Node.js (Latest LTS recommended)
- `youtube-dl-exec` package
- `express` package

## Installation

1. Clone this repository:
   ```sh
   git clone https://github.com/your-username/youtube-audio-downloader.git
   cd youtube-audio-downloader
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the Server:
   ```sh
   node index.js
   ```

By default, the server runs on `http://localhost:3005` and will **automatically open** in your browser.

## Quick Start (One-Liner)
For experienced users:
```sh
npm install && node index.js
```

## Usage

### Endpoints

#### 1. Download YouTube Audio
**Endpoint:** `GET /download`

**Query Parameters:**
- `url` - (Required) The full YouTube video URL.

**Example Request:**
```
http://localhost:3005/download?url=https://www.youtube.com/watch?v=VIDEO_ID
```

**Response:**
- Returns an MP3 file for download.
- If an invalid URL is provided, returns a 400 error.
- If an internal error occurs, returns a 500 error.

#### 2. Health Check
**Endpoint:** `GET /health`

**Response:**
- `200 OK` if the server is running.

Example:
```
http://localhost:3005/health
```

#### 3. Version Info
**Endpoint:** `GET /version`

**Response:**
Returns JSON with the versions of Node.js, Express, and youtube-dl:
```json
{
  "node": "v18.16.0",
  "express": "4.18.2",
  "youtubeDl": "latest"
}
```

Example:
```
http://localhost:3005/version
```

## Automatic Cleanup
- The app automatically deletes MP3 files older than **1 hour** from the `downloads/` directory.
- Cleanup runs every **15 minutes** to prevent excessive file storage.

## FAQs
### **1. Why is my download failing?**
Ensure you have the latest version of `youtube-dl-exec` installed:
```sh
npm install -g youtube-dl-exec
```

### **2. How do I change the download format?**
Modify the `audioFormat` option in `index.js`.

### **3. Can I change the default download folder?**
Yes, update the `downloadsDir` variable in `index.js` to your preferred location.

## Troubleshooting
### Common Issues
1. **Error: youtube-dl not found**
   - Ensure `youtube-dl-exec` is installed globally:
     ```sh
     npm install -g youtube-dl-exec
     ```
2. **Permission Issues**
   - Make sure the application has read/write permissions to the `downloads/` directory.

## Contributing
Pull requests are welcome! If you have suggestions for improvements, feel free to open an issue or submit a PR.

## License
This project is licensed under the MIT License.

---
Developed by Carlos 🚀

