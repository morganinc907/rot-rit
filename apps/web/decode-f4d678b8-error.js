const { ethers } = require('ethers');

async function decodeError() {
  const ERROR_DATA = '0xf4d678b8';
  
  // Common ERC1155 and custom errors
  const possibleErrors = [
    'InsufficientBalance()',
    'ERC1155InsufficientBalance(address,uint256,uint256)',
    'NotEnoughKeys()',
    'InsufficientKeys()',
    'NoKeysToSacrifice()',
    'InvalidAmount()',
    'ZeroBalance()'
  ];
  
  console.log('🔍 Decoding error selector:', ERROR_DATA);
  console.log();
  
  for (const error of possibleErrors) {
    const selector = ethers.id(error).slice(0, 10);
    console.log(`${error} → ${selector} ${selector === ERROR_DATA ? '✅ MATCH!' : ''}`);
  }
  
  console.log();
  console.log('Error 0xf4d678b8 likely means: User has insufficient rusted keys to sacrifice');
}

decodeError();