document.addEventListener('DOMContentLoaded', function () {
    // Set up accordion functionality
    setupAccordions();

    // Get app version from the server
    fetchAppVersion();

    // Add event listener for the download button
    document.getElementById('downloadBtn').addEventListener('click', downloadAudio);

    // Add event listener for Enter key on input field
    document.getElementById('videoUrl').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            downloadAudio();
        }
    });
});

/**
 * Sets up accordion functionality for FAQ and instructions
 */
function setupAccordions() {
    const accordions = document.querySelectorAll('.accordion-header');

    accordions.forEach(accordion => {
        accordion.addEventListener('click', function () {
            const parent = this.parentElement;
            parent.classList.toggle('active');
        });
    });
}

/**
 * Fetches the app version from the server
 */
function fetchAppVersion() {
    fetch('/version')
        .then(response => response.json())
        .then(data => {
            document.getElementById('appVersion').textContent = data.app || '1.0.0';
        })
        .catch(error => {
            console.error('Error fetching version:', error);
        });
}

/**
 * Sets up event listeners for the application
 */
function setupEventListeners() {
    // Focus the input when the page loads
    const input = document.getElementById('videoUrl');
    input.focus();
}

/**
 * Validates a YouTube URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidYoutubeUrl(url) {
    if (!url) return false;
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}(\?.*)?$/;
    return regex.test(url);
}

/**
 * Handles the download process
 */
function downloadAudio() {
    const inputField = document.getElementById('videoUrl');
    const url = inputField.value.trim();
    const downloadBtn = document.getElementById('downloadBtn');

    // Validate URL
    if (!url) {
        showStatus('Please enter a YouTube URL', 'error');
        inputField.focus();
        return;
    }

    if (!isValidYoutubeUrl(url)) {
        showStatus('Invalid YouTube URL. Please enter a valid URL', 'error');
        inputField.focus();
        return;
    }

    // Show loading state
    const originalButtonContent = downloadBtn.innerHTML;
    downloadBtn.innerHTML = 'Processing...';
    downloadBtn.disabled = true;
    showStatus('Processing your request... This may take a minute for longer videos.', 'info', true);

    // Use fetch to monitor when the server actually has the file ready
    fetch(`/download?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
            'Accept': 'audio/mpeg',
        }
    })
        .then(response => {
            // Once we get a response, the server has processed the video
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }

            // Get the filename from the Content-Disposition header if available
            let filename = 'youtube_audio.mp3';
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.includes('filename=')) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Create a download link and trigger it
            return response.blob().then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                // Now that download has actually started, update UI
                downloadBtn.innerHTML = originalButtonContent;
                downloadBtn.disabled = false;
                inputField.value = '';
                // Remove pulsing message and show success
                const statusElement = document.getElementById('statusMessage');
                statusElement.classList.remove('pulsing');
                showStatus('Download successful! Check your downloads folder.', 'success');
                inputField.focus();
            });
        })
        .catch(error => {
            console.error('Download error:', error);
            downloadBtn.innerHTML = originalButtonContent;
            downloadBtn.disabled = false;
            // Remove pulsing message and show error
            const statusElement = document.getElementById('statusMessage');
            statusElement.classList.remove('pulsing');
            showStatus('Download failed. Please try again.', 'error');
        });
}

/**
 * Displays a status message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, error, info)
 * @param {boolean} pulsing - Whether to add a pulsing animation
 */
function showStatus(message, type, pulsing = false) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;

    // Remove any existing classes
    statusElement.className = 'status-message';

    // Add appropriate class based on type
    if (type) {
        statusElement.classList.add(type);
    }

    // Add pulsing animation if requested
    if (pulsing) {
        statusElement.classList.add('pulsing');
    }

    // Only add animation class if not pulsing
    if (!pulsing) {
        // Add animation class
        statusElement.classList.add('status-animate');

        // Remove animation class after it completes
        setTimeout(() => {
            statusElement.classList.remove('status-animate');
        }, 3000);
    }
}