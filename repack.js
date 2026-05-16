import tmp from 'tmp';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

import texturePacker from 'free-tex-packer-core';
import { Jimp } from 'jimp';

tmp.setGracefulCleanup(); // CRITICAL: hook into process exit event and clean up after process exit

function findAllFiles(baseDir, fileName, ext = null) { // search directory for filename match. if ext is null, then fileName is base; otherwise just name (without ext)
  const files = fs.readdirSync(baseDir, { recursive: true }); // Read all files in directory and subdirectories recursively

  const matches = files.filter(file => { // Filter to return an array of all matches
    const parsed = path.parse(file);
    return !ext 
        ? parsed.base === fileName // filename with extension compared with base (filename with extension)
        : parsed.name === fileName && parsed.ext.toLowerCase() === ext.toLowerCase(); // file name (without extension) compared to name and extension compared separately
  });

  return matches.map(file => path.resolve(baseDir, file)); // Map relative results to absolute system paths
}

async function processSheet(repackFile, frameWidth, frameHeight, tmpDir) {
    console.log(`jimp: ${repackFile}`);
    const buffer = fs.readFileSync(repackFile);
    const image = await Jimp.read(buffer);
    const { width, height } = image.bitmap;
    
    const frames = [];
    let count = 0;

    // 1. Slice the sheet into individual frame buffers
    for (let y = 0; y < height; y += frameHeight) {
        for (let x = 0; x < width; x += frameWidth) {
            const frame = image.clone().crop(x, y, frameWidth, frameHeight);
            const buffer = await frame.getBufferAsync(Jimp.MIME_PNG);
            
            frames.push({
                path: `frame_${count++}.png`,
                contents: buffer
            });
        }
    }

    // 2. Repack with trimming for Phaser
    const options = {
        textureName: "trimmed_sheet",
        allowTrim: true,
        trimMode: "trim",
        exporter: "Phaser3",
        removeFileExtension: true,
        padding: 2
    };

    texturePacker(frames, options, (files, error) => {
        if (error) throw error;
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        files.forEach(item => {
            fs.writeFileSync(path.join(tmpDir, item.name), item.buffer);
            console.log(`Exported: ${item.name}`);
        });
    });
}


const args = process.argv.slice(2); // get params
assert(args.length > 0, 'Usage: node repack filename.ext [frame_width [frame_height]]'); // usage
const repackFileName = args[0]; // 1st parameter - filename WITH extension
const frameWidth = args.length > 1 ? args[1] : 32; // 2nd parameter frame width, default 32
const frameHeight = args.length > 2 ? args[2] : frameWidth; // 3nd parameter frame width, else default to frameWidth (i.e. 32 or specified width)

const repackFilesList = findAllFiles("./docs/Assets", repackFileName); // get all matching file names

console.log(`look for ${repackFileName} in ${JSON.stringify(repackFilesList)}`);

for (const repackFile of repackFilesList) {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true }); // Create a temporary directory that will be deleted on process exit
    console.log(`process ${repackFile} ${frameWidth}x${frameHeight} in temp dir ${tmpDir.name}`);
    processSheet(repackFile, frameWidth, frameHeight, tmpDir);
}
