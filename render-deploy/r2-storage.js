const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Configure R2 client (uses S3-compatible API)
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://rotandritual.work';

/**
 * Generate stable version hash for caching
 */
function versionHash({ tokenId, equipped }) {
  const payload = `${tokenId}|${equipped.join(',')}`;
  return crypto.createHash('sha1').update(payload).digest('hex').substring(0, 12);
}

/**
 * Build R2 object key for a rendered raccoon
 * Format: raccoon/{tokenId}/{version}.{ext}
 */
function buildKey({ tokenId, version, ext = 'png' }) {
  return `raccoon/${tokenId}/${version}.${ext}`;
}

/**
 * Build public CDN URL for a rendered raccoon
 */
function buildPublicUrl({ tokenId, version, ext = 'png' }) {
  return `${PUBLIC_URL}/${buildKey({ tokenId, version, ext })}`;
}

/**
 * Check if object exists in R2 (HEAD request)
 */
async function exists({ tokenId, version, ext = 'png' }) {
  const key = buildKey({ tokenId, version, ext });

  try {
    await R2.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    console.log(`   ✅ R2 HIT: ${key}`);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`   ❌ R2 MISS: ${key}`);
      return false;
    }
    // Other errors (network, permissions, etc)
    console.error(`   ⚠️ R2 HEAD error for ${key}:`, error.message);
    throw error;
  }
}

/**
 * Upload rendered image to R2 with immutable cache headers
 */
async function upload({ tokenId, version, buffer, ext = 'png' }) {
  const key = buildKey({ tokenId, version, ext });
  const contentType = ext === 'gif' ? 'image/gif' : 'image/png';

  console.log(`   📤 Uploading to R2: ${key} (${buffer.length} bytes)`);

  try {
    await R2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year, immutable
      Metadata: {
        'token-id': String(tokenId),
        'version': version,
        'generated': new Date().toISOString(),
      }
    }));

    const publicUrl = buildPublicUrl({ tokenId, version, ext });
    console.log(`   ✅ Uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`   ❌ R2 upload failed for ${key}:`, error.message);
    throw error;
  }
}

/**
 * Download from R2 (fallback if CDN not configured)
 */
async function download({ tokenId, version, ext = 'png' }) {
  const key = buildKey({ tokenId, version, ext });

  console.log(`   📥 Downloading from R2: ${key}`);

  try {
    const response = await R2.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    console.log(`   ✅ Downloaded: ${key} (${buffer.length} bytes)`);
    return buffer;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      console.log(`   ❌ Not found in R2: ${key}`);
      return null;
    }
    console.error(`   ⚠️ R2 download error for ${key}:`, error.message);
    throw error;
  }
}

module.exports = {
  versionHash,
  buildKey,
  buildPublicUrl,
  exists,
  upload,
  download,
  R2,
  BUCKET,
};
