require('dotenv').config();
const r2 = require('./r2-storage');
const sharp = require('sharp');

async function testR2Upload() {
  console.log('🧪 Testing R2 Upload...\n');

  // Create a test image
  console.log('1️⃣ Creating test image...');
  const testImage = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  })
  .png()
  .toBuffer();

  console.log(`   ✅ Created ${testImage.length} byte PNG\n`);

  // Generate version hash
  const tokenId = 999;
  const equipped = [0, 0, 0, 0, 0];
  const version = r2.versionHash({ tokenId, equipped });

  console.log(`2️⃣ Version hash: ${version}\n`);

  // Upload to R2
  console.log('3️⃣ Uploading to R2...');
  try {
    const publicUrl = await r2.upload({
      tokenId,
      version,
      buffer: testImage,
      ext: 'png'
    });

    console.log(`   ✅ Uploaded successfully!`);
    console.log(`   📍 Public URL: ${publicUrl}\n`);

    // Check if it exists
    console.log('4️⃣ Checking if file exists in R2...');
    const exists = await r2.exists({ tokenId, version, ext: 'png' });
    console.log(`   ${exists ? '✅' : '❌'} File ${exists ? 'exists' : 'does not exist'}\n`);

    // Try to download
    if (exists) {
      console.log('5️⃣ Testing download...');
      const downloaded = await r2.download({ tokenId, version, ext: 'png' });
      console.log(`   ✅ Downloaded ${downloaded.length} bytes\n`);
    }

    console.log('🎉 R2 Integration Test: PASSED');
    console.log(`\n📋 Next: Try accessing the image at:`);
    console.log(`   ${publicUrl}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testR2Upload();
