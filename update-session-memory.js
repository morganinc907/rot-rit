#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SESSION_MEMORY_PATH = path.join(__dirname, 'SESSION_MEMORY.md');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function formatDate() {
  return new Date().toISOString().split('T')[0];
}

function appendToSessionMemory(category, title, content) {
  const timestamp = formatDate();
  
  // Read current content
  let currentContent = '';
  if (fs.existsSync(SESSION_MEMORY_PATH)) {
    currentContent = fs.readFileSync(SESSION_MEMORY_PATH, 'utf8');
  }
  
  // Find the section to update or create new section
  const updateSection = `
## Session Update - ${timestamp}

### ${category}: ${title}
${content}

---
`;
  
  // Append before the final line if it exists, otherwise just append
  const lines = currentContent.split('\n');
  const lastLineIndex = lines.length - 1;
  
  // Insert the update before the last few lines (usually status summary)
  lines.splice(lastLineIndex - 2, 0, updateSection);
  
  // Write back to file
  fs.writeFileSync(SESSION_MEMORY_PATH, lines.join('\n'));
  
  console.log(`${colors.green}✅ SESSION_MEMORY.md updated successfully!${colors.reset}`);
  console.log(`${colors.cyan}Category:${colors.reset} ${category}`);
  console.log(`${colors.cyan}Title:${colors.reset} ${title}`);
}

// Quick update functions for common changes
const quickUpdates = {
  contract: (address, description) => {
    appendToSessionMemory(
      'Contract Deployment',
      description,
      `**New Contract Address:** \`${address}\`\n**Network:** Base Sepolia\n**Status:** Deployed and verified`
    );
  },
  
  frontend: (component, changes) => {
    appendToSessionMemory(
      'Frontend Update',
      component,
      `**Component:** \`${component}\`\n**Changes:**\n${changes.split(',').map(c => `- ${c.trim()}`).join('\n')}`
    );
  },
  
  fix: (issue, solution) => {
    appendToSessionMemory(
      'Bug Fix',
      issue,
      `**Issue:** ${issue}\n**Solution:** ${solution}\n**Status:** ✅ Resolved`
    );
  },
  
  feature: (name, description) => {
    appendToSessionMemory(
      'New Feature',
      name,
      `**Feature:** ${name}\n**Description:** ${description}\n**Status:** ✅ Implemented`
    );
  },
  
  config: (file, changes) => {
    appendToSessionMemory(
      'Configuration Update',
      file,
      `**File:** \`${file}\`\n**Changes:** ${changes}`
    );
  }
};

// Interactive CLI
async function interactiveUpdate() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  console.log(`${colors.bright}${colors.magenta}🔄 SESSION_MEMORY.md Updater${colors.reset}\n`);
  
  // Show quick update options
  console.log(`${colors.yellow}Quick Update Options:${colors.reset}`);
  console.log('1. Contract Deployment');
  console.log('2. Frontend Update');
  console.log('3. Bug Fix');
  console.log('4. New Feature');
  console.log('5. Configuration Change');
  console.log('6. Custom Update\n');
  
  const choice = await question(`${colors.cyan}Select option (1-6): ${colors.reset}`);
  
  switch(choice) {
    case '1':
      const contractAddr = await question('Contract address: ');
      const contractDesc = await question('Description: ');
      quickUpdates.contract(contractAddr, contractDesc);
      break;
      
    case '2':
      const component = await question('Component/File: ');
      const frontendChanges = await question('Changes (comma-separated): ');
      quickUpdates.frontend(component, frontendChanges);
      break;
      
    case '3':
      const issue = await question('Issue description: ');
      const solution = await question('Solution: ');
      quickUpdates.fix(issue, solution);
      break;
      
    case '4':
      const featureName = await question('Feature name: ');
      const featureDesc = await question('Description: ');
      quickUpdates.feature(featureName, featureDesc);
      break;
      
    case '5':
      const configFile = await question('Config file: ');
      const configChanges = await question('Changes: ');
      quickUpdates.config(configFile, configChanges);
      break;
      
    case '6':
      const category = await question('Category: ');
      const title = await question('Title: ');
      const content = await question('Content (use \\n for newlines): ');
      appendToSessionMemory(category, title, content.replace(/\\n/g, '\n'));
      break;
      
    default:
      console.log(`${colors.yellow}Invalid option${colors.reset}`);
  }
  
  rl.close();
}

// Command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  interactiveUpdate();
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`${colors.bright}Usage:${colors.reset}`);
  console.log('  node update-session-memory.js                     # Interactive mode');
  console.log('  node update-session-memory.js contract <addr> <desc>');
  console.log('  node update-session-memory.js frontend <component> <changes>');
  console.log('  node update-session-memory.js fix <issue> <solution>');
  console.log('  node update-session-memory.js feature <name> <description>');
  console.log('  node update-session-memory.js config <file> <changes>');
  console.log('  node update-session-memory.js custom <category> <title> <content>');
} else {
  // Direct command mode
  const [type, ...params] = args;
  
  switch(type) {
    case 'contract':
      if (params.length >= 2) quickUpdates.contract(params[0], params.slice(1).join(' '));
      break;
    case 'frontend':
      if (params.length >= 2) quickUpdates.frontend(params[0], params.slice(1).join(' '));
      break;
    case 'fix':
      if (params.length >= 2) quickUpdates.fix(params[0], params.slice(1).join(' '));
      break;
    case 'feature':
      if (params.length >= 2) quickUpdates.feature(params[0], params.slice(1).join(' '));
      break;
    case 'config':
      if (params.length >= 2) quickUpdates.config(params[0], params.slice(1).join(' '));
      break;
    case 'custom':
      if (params.length >= 3) appendToSessionMemory(params[0], params[1], params.slice(2).join(' '));
      break;
    default:
      console.log(`${colors.yellow}Unknown command: ${type}${colors.reset}`);
      console.log('Use --help for usage information');
  }
}