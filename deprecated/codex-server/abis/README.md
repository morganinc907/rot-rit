# Contract ABIs

Place your deployed contract ABI JSON files in this directory:

- `MawManager.json` - Maw sacrifice and demon summoning events
- `CosmeticsV2.json` - Cosmetic equip/unequip and outfit binding events  
- `Raccoons.json` - Raccoon NFT transfer events

## How to get ABI files:

1. **From Hardhat compilation:**
   Copy from `artifacts/contracts/ContractName.sol/ContractName.json`

2. **From deployment scripts:**
   Usually saved during deployment process

3. **From Etherscan/Basescan:**
   Go to verified contract → Contract tab → Copy ABI

## Example structure:

```
MawManager.json:
[
  {
    "type": "event",
    "name": "RaccoonSacrificed", 
    "inputs": [...],
    "anonymous": false
  },
  ...
]
```

The server will use minimal fallback ABIs if these files are not found.