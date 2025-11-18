/**
 * upload-to-cloudinary.js
 * Usage: node upload-to-cloudinary.js
 *
 * - Reads LOCAL_FOLDER (relative to this script)
 * - Uploads files as home-bg/bg-001, home-bg/bg-002, ...
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// load cloudinary config from .env
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Missing Cloudinary credentials in .env. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// CONFIG — change these to match your setup
const LOCAL_FOLDER = path.join(__dirname, "homebg"); // local folder containing images
const CLOUD_FOLDER = "home-bg"; // folder in Cloudinary
const FILENAME_PREFIX = "bg-"; // will produce bg-001, bg-002...
const FILENAME_PAD = 3; // digits, e.g. 3 -> 001
const NUM_IMAGES = null; // if null -> detect from files; otherwise will upload only first NUM_IMAGES files
const MAX_RETRIES = 2; // retries per file on failure
const SEQUENTIAL = true; // set false to upload in parallel (not recommended for large batches)

// helper to pad numbers
function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

// read files from local folder
async function getLocalFiles() {
  if (!fs.existsSync(LOCAL_FOLDER)) {
    throw new Error(`Local folder not found: ${LOCAL_FOLDER}`);
  }
  const all = fs.readdirSync(LOCAL_FOLDER)
    // filter common image extensions
    .filter((f) => /\.(jpe?g|png|webp|gif|tiff|bmp)$/i.test(f))
    // sort alpha-numeric so order is deterministic
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  if (all.length === 0) {
    throw new Error(`No image files found in ${LOCAL_FOLDER}`);
  }

  return all;
}

async function uploadFile(localFilename, targetPublicId, attempt = 0) {
  const localPath = path.join(LOCAL_FOLDER, localFilename);
  try {
    console.log(`Uploading ${localFilename} -> ${targetPublicId} (attempt ${attempt + 1})`);
    const res = await cloudinary.uploader.upload(localPath, {
      folder: CLOUD_FOLDER,      // optional: sets folder in Cloudinary as well
      public_id: targetPublicId, // Cloudinary will set final public id as "${CLOUD_FOLDER}/${targetPublicId}"
      overwrite: true,           // overwrite if exists
      resource_type: "image",
      use_filename: false,       // we control public_id; prevent auto filename behavior
      unique_filename: false,
    });
    console.log(`✅ Uploaded: ${localFilename} => ${res.secure_url}`);
    return res;
  } catch (err) {
    console.error(`❌ Upload failed for ${localFilename} (attempt ${attempt + 1}):`, err.message || err);
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying ${localFilename}...`);
      return uploadFile(localFilename, targetPublicId, attempt + 1);
    } else {
      throw err;
    }
  }
}

async function main() {
  try {
    const files = await getLocalFiles();
    const toUploadCount = NUM_IMAGES ? Math.min(NUM_IMAGES, files.length) : files.length;

    console.log(`Found ${files.length} image(s). Uploading ${toUploadCount} file(s).`);

    // If you want a specific mapping (i -> file i) you can use files[i-1].
    // Here we'll upload in the order of sorted `files` list and name them sequentially.
    const tasks = [];
    for (let i = 1; i <= toUploadCount; i++) {
      const fileIndex = i - 1; // zero-based index in sorted files array
      const localFilename = files[fileIndex];
      const padded = pad(i, FILENAME_PAD);
      const publicId = `${FILENAME_PREFIX}${padded}`; // e.g. bg-001
      // We'll set public_id *without* folder (cloudinary will apply folder option),
      // final public id in Cloudinary will be `${CLOUD_FOLDER}/${publicId}`
      if (SEQUENTIAL) {
        // await sequentially to avoid burst
        await uploadFile(localFilename, publicId);
      } else {
        // collect promises for parallel upload (use with caution)
        tasks.push(uploadFile(localFilename, publicId));
      }
    }

    if (!SEQUENTIAL && tasks.length > 0) {
      await Promise.all(tasks);
    }

    console.log("All done.");
  } catch (err) {
    console.error("Script aborted:", err);
    process.exit(1);
  }
}

main();
