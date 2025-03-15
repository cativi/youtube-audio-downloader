#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    bold: '\x1b[1m'
};

// Print banner
console.log(`
${colors.blue}${colors.bold}================================================
YouTube Audio Downloader - Setup
================================================${colors.reset}
`);

// Create necessary directories
const directories = [
    path.join(__dirname, '..', 'downloads'),
    path.join(__dirname, '..', 'public')
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`${colors.green}✓ Created directory: ${dir}${colors.reset}`);
        } catch (error) {
            console.error(`${colors.red}✗ Failed to create directory: ${dir}${colors.reset}`);
            console.error(error);
        }
    } else {
        console.log(`${colors.yellow}⚠ Directory already exists: ${dir}${colors.reset}`);
    }
});

// Create public directory structure
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
    // Move index.html to public if it exists in the root
    const rootIndexPath = path.join(__dirname, '..', 'index.html');
    const publicIndexPath = path.join(publicDir, 'index.html');

    if (fs.existsSync(rootIndexPath) && !fs.existsSync(publicIndexPath)) {
        try {
            fs.copyFileSync(rootIndexPath, publicIndexPath);
            console.log(`${colors.green}✓ Moved index.html to public directory${colors.reset}`);
        } catch (error) {
            console.error(`${colors.red}✗ Failed to move index.html to public directory${colors.reset}`);
            console.error(error);
        }
    }
}

// Check for required dependencies
console.log(`\n${colors.blue}${colors.bold}Checking dependencies...${colors.reset}`);

const checkDependency = (command, name) => {
    try {
        execSync(`${command} --version`, { stdio: 'ignore' });
        console.log(`${colors.green}✓ ${name} is installed${colors.reset}`);
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ ${name} is not installed${colors.reset}`);
        return false;
    }
};

// Check for Node.js version
const nodeVersion = process.version;
const requiredNodeVersion = 'v16.0.0';
if (compareVersions(nodeVersion, requiredNodeVersion) >= 0) {
    console.log(`${colors.green}✓ Node.js ${nodeVersion} is installed (required: ${requiredNodeVersion}+)${colors.reset}`);
} else {
    console.log(`${colors.red}✗ Node.js ${nodeVersion} is below the required version ${requiredNodeVersion}${colors.reset}`);
    console.log(`${colors.yellow}Please update your Node.js version: https://nodejs.org/en/download/${colors.reset}`);
}

// Check for youtube-dl-exec
try {
    require.resolve('youtube-dl-exec');
    console.log(`${colors.green}✓ youtube-dl-exec is installed${colors.reset}`);
} catch (error) {
    console.log(`${colors.red}✗ youtube-dl-exec is not installed${colors.reset}`);
    console.log(`${colors.yellow}Installing youtube-dl-exec...${colors.reset}`);
    try {
        execSync('npm install youtube-dl-exec', { stdio: 'inherit' });
        console.log(`${colors.green}✓ youtube-dl-exec installed successfully${colors.reset}`);
    } catch (installError) {
        console.error(`${colors.red}✗ Failed to install youtube-dl-exec${colors.reset}`);
        console.error(installError);
    }
}

// Final message
console.log(`\n${colors.green}${colors.bold}Setup completed!${colors.reset}`);
console.log(`Run ${colors.blue}npm start${colors.reset} to start the application.`);
console.log(`Run ${colors.blue}npm run dev${colors.reset} to start the application in development mode.`);

// Helper function to compare version strings
function compareVersions(a, b) {
    const partsA = a.replace('v', '').split('.').map(Number);
    const partsB = b.replace('v', '').split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;

        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }

    return 0;
}