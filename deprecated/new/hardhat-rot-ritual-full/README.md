# Rot Ritual — Full Hardhat Project

Includes:
- All contracts (Raccoons, Cultists, Demons, Relics, CosmeticsV2 [5-slot], MawSacrificeV2, RaccoonRenderer, KeyShop, RitualReadAggregator)
- Scripts: deploy, verify, seed, smoke
- Tests: maw.flow smoke test

Quickstart:
```bash
npm i
cp .env.example .env
# set RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY, BASE_TYPE_URI, BOUND_BASE_URI

npx hardhat compile
NETWORK=localhost npm run deploy
npm run smoke
NETWORK=custom npm run verify
NETWORK=custom npm run seed
```


## Gas & Coverage
- Gas report (set env flag):  
  ```bash
  REPORT_GAS=true npx hardhat test
  npm run gas
  ```
- Coverage:

  ```bash
  npm run coverage
  ```
- Fuzz (fast-check) is included in `test/wardrobe.paging.fuzz.test.js`.

## ABI Distribution (gh-pages + npm)

We ship ABIs + `deploy.output.json` via two automated channels:

1) **GitHub Pages**
   - Workflow: `.github/workflows/pages.yml`
   - Publishes to `https://<your-username>.github.io/<repo>/`
   - Files:
     - `abis/*.abi.json`
     - `deploy.output.json` (if present)
     - `index.json` (build metadata)

2) **npm package**
   - Workflow: `.github/workflows/npm.yml`
   - Requires repository **Secrets**:
     - `NPM_TOKEN` — npm auth token with publish rights
   - Optional repository **Variables**:
     - `NPM_SCOPE` — scope used for package name (defaults to `rotritual`), producing `@<scope>/abis`
   - Tag a version to publish:
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```
   - Frontend usage:
     ```bash
     npm i @rotritual/abis  # or your chosen scope
     // import in code
     import CosmeticsV2 from '@rotritual/abis/abis/CosmeticsV2.abi.json' assert { type: 'json' }
     import deployments from '@rotritual/abis/deploy.output.json' assert { type: 'json' }
     ```
