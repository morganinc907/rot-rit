const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// You need to set your Pinata JWT token here or in environment variable
const PINATA_JWT = process.env.PINATA_JWT || 'YOUR_PINATA_JWT_HERE';

if (PINATA_JWT === 'YOUR_PINATA_JWT_HERE') {
  console.error('❌ Please set your Pinata JWT token in the script or as PINATA_JWT environment variable');
  console.log('\nTo get your Pinata JWT:');
  console.log('1. Go to https://app.pinata.cloud/developers/api-keys');
  console.log('2. Create a new API key');
  console.log('3. Copy the JWT token');
  console.log('4. Run: export PINATA_JWT="your_jwt_here"');
  process.exit(1);
}

const ROOT = process.argv[2] || '/tmp/raccoon-upload';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
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
  
  console.log(`📊 Found ${files.length} files to upload`);
  
  const form = new FormData();
  
  // Add each file with proper filepath to preserve folder structure
  files.forEach((filePath) => {
    // Get relative path from the parent of ROOT
    const relativePath = path.relative(path.dirname(ROOT), filePath);
    const filepath = relativePath.replace(/\\/g, '/'); // Ensure forward slashes
    
    console.log(`  Adding: ${filepath}`);
    form.append('file', fs.createReadStream(filePath), { filepath });
  });
  
  // Add metadata for the pin
  form.append('pinataMetadata', JSON.stringify({ 
    name: `raccoon-nft-${Date.now()}`,
    keyvalues: {
      collection: 'trash-raccoons',
      totalFiles: files.length.toString()
    }
  }));
  
  // Use CID version 1
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
  
  console.log('\n🚀 Uploading to Pinata...');
  
  const headers = {
    Authorization: `Bearer ${PINATA_JWT}`,
    ...form.getHeaders(), // CRITICAL: This adds the multipart headers
  };
  
  try {
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      form,
      { 
        headers, 
        maxBodyLength: Infinity, 
        maxContentLength: Infinity, 
        timeout: 300000 // 5 minutes timeout
      }
    );
    
    return res.data;
  } catch (error) {
    if (error.response) {
      console.error('❌ Pinata API error:', error.response.status, error.response.data);
      throw new Error(`Pinata API error: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('❌ No response from Pinata:', error.message);
      throw new Error(`Network error: ${error.message}`);
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

async function verifyUpload(cid) {
  console.log('\n🔍 Verifying upload...');
  
  // Test accessing a sample file through Pinata gateway
  const testUrls = [
    `https://gateway.pinata.cloud/ipfs/${cid}/metadata/1.json`,
    `https://gateway.pinata.cloud/ipfs/${cid}/images/1.png`
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`  Testing: ${url}`);
      const response = await axios.head(url, { timeout: 10000 });
      if (response.status === 200) {
        console.log(`  ✅ Accessible`);
      }
    } catch (error) {
      console.log(`  ⚠️  Not immediately accessible (may need time to propagate)`);
    }
  }
}

async function main() {
  try {
    const result = await upload();
    
    console.log('\n✅ SUCCESS! Files uploaded to IPFS');
    console.log('📌 Pin Details:');
    console.log(`  CID: ${result.IpfsHash}`);
    console.log(`  Size: ${result.PinSize} bytes`);
    console.log(`  Timestamp: ${result.Timestamp}`);
    
    console.log('\n🌐 Access your content at:');
    console.log(`  https://gateway.pinata.cloud/ipfs/${result.IpfsHash}/`);
    console.log(`  ipfs://${result.IpfsHash}/`);
    
    console.log('\n📝 Next steps:');
    console.log(`1. Update your smart contract base URI to: ipfs://${result.IpfsHash}/metadata/`);
    console.log(`2. Test a specific token: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}/metadata/1.json`);
    
    // Verify the upload
    await verifyUpload(result.IpfsHash);
    
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

main();