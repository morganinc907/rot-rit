const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// NFT.Storage is free for NFT metadata
// Get your API key at https://nft.storage/manage
const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY || 'YOUR_NFT_STORAGE_KEY_HERE';

if (NFT_STORAGE_KEY === 'YOUR_NFT_STORAGE_KEY_HERE') {
  console.error('❌ Please set your NFT.Storage API key');
  console.log('\n📝 How to get a free NFT.Storage API key:');
  console.log('1. Go to https://nft.storage');
  console.log('2. Sign up for free with GitHub or email');
  console.log('3. Go to https://nft.storage/manage');
  console.log('4. Create a new API key');
  console.log('5. Run: export NFT_STORAGE_KEY="your_key_here"');
  console.log('\n✨ NFT.Storage is FREE and unlimited for NFT metadata!');
  process.exit(1);
}

const ROOT = process.argv[2] || '/tmp/raccoon-upload';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (!file.startsWith('.')) { // Skip hidden files like .DS_Store
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function upload() {
  console.log(`📁 Preparing to upload folder: ${ROOT}`);
  
  const files = getAllFiles(ROOT);
  
  if (!files.length) {
    throw new Error(`No files found under ${ROOT}`);
  }
  
  console.log(`📊 Found ${files.length} files to upload (excluding hidden files)`);
  
  const form = new FormData();
  
  // Add each file with proper filepath to preserve folder structure
  files.forEach((filePath) => {
    // Get relative path from the parent of ROOT
    const relativePath = path.relative(path.dirname(ROOT), filePath);
    const filepath = relativePath.replace(/\\/g, '/'); // Ensure forward slashes
    
    console.log(`  Adding: ${filepath}`);
    
    // For NFT.Storage, we need to use the exact path structure
    form.append('file', fs.createReadStream(filePath), filepath);
  });
  
  console.log('\n🚀 Uploading to NFT.Storage (FREE)...');
  
  try {
    const res = await axios.post(
      'https://api.nft.storage/upload',
      form,
      { 
        headers: {
          'Authorization': `Bearer ${NFT_STORAGE_KEY}`,
          ...form.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 300000 // 5 minutes
      }
    );
    
    return res.data;
  } catch (error) {
    if (error.response) {
      console.error('❌ NFT.Storage API error:', error.response.status);
      console.error('Response:', error.response.data);
      throw new Error(`API error: ${error.response.status}`);
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

async function verifyUpload(cid) {
  console.log('\n🔍 Verifying upload...');
  
  // Test accessing files through various gateways
  const gateways = [
    'https://nftstorage.link',
    'https://ipfs.io',
    'https://dweb.link'
  ];
  
  for (const gateway of gateways) {
    const testUrl = `${gateway}/ipfs/${cid}/metadata/1.json`;
    try {
      console.log(`  Testing: ${testUrl}`);
      const response = await axios.head(testUrl, { timeout: 10000 });
      if (response.status === 200) {
        console.log(`  ✅ Accessible via ${gateway}`);
        break;
      }
    } catch (error) {
      console.log(`  ⏳ Not yet available on ${gateway}`);
    }
  }
}

async function main() {
  try {
    const result = await upload();
    
    const cid = result.value.cid;
    
    console.log('\n✅ SUCCESS! Files uploaded to IPFS via NFT.Storage');
    console.log('📌 Upload Details:');
    console.log(`  CID: ${cid}`);
    console.log(`  Size: ${result.value.size} bytes`);
    console.log(`  Type: ${result.value.type}`);
    console.log(`  Files: ${result.value.files?.length || 'N/A'}`);
    
    console.log('\n🌐 Access your content at:');
    console.log(`  https://nftstorage.link/ipfs/${cid}/`);
    console.log(`  https://ipfs.io/ipfs/${cid}/`);
    console.log(`  ipfs://${cid}/`);
    
    console.log('\n📝 Next steps:');
    console.log(`1. Update your smart contract base URI to: ipfs://${cid}/metadata/`);
    console.log(`2. Test metadata: https://nftstorage.link/ipfs/${cid}/metadata/1.json`);
    console.log(`3. Test image: https://nftstorage.link/ipfs/${cid}/images/1.png`);
    
    // Verify the upload
    await verifyUpload(cid);
    
    console.log('\n🎉 Your NFT collection is now permanently stored on IPFS!');
    console.log('   NFT.Storage provides free, permanent storage for NFT metadata.');
    
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

main();