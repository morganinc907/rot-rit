# SESSION_MEMORY.md Updater

## Purpose
This tool helps maintain the SESSION_MEMORY.md file by automatically appending updates whenever changes are made to the project. This ensures continuity across Claude sessions.

## Usage

### Interactive Mode (Recommended)
```bash
node update-session-memory.js
```
This opens an interactive menu where you can select the type of update and enter details.

### Quick Commands
```bash
# Contract deployment
node update-session-memory.js contract 0xABC123... "Deployed new MawSacrificeV5"

# Frontend update
node update-session-memory.js frontend "MawNew.jsx" "Added error handling, Fixed state management"

# Bug fix
node update-session-memory.js fix "Cosmetic sacrifice not working" "Updated function signature"

# New feature
node update-session-memory.js feature "Glass Shard Converter" "5:1 conversion ratio implementation"

# Configuration change
node update-session-memory.js config ".env" "Updated RPC endpoint"

# Custom update
node update-session-memory.js custom "Category" "Title" "Content description"
```

## Update Categories

1. **Contract Deployment** - New smart contract deployments
2. **Frontend Update** - Changes to React components or hooks
3. **Bug Fix** - Issues resolved
4. **New Feature** - Features added
5. **Configuration Change** - Environment or config updates
6. **Custom Update** - Any other type of change

## When to Use

Run this updater whenever you:
- Deploy a new contract
- Fix a bug
- Add a new feature
- Update frontend components
- Change configuration
- Make any significant change to the project

## How It Works

The updater:
1. Reads the current SESSION_MEMORY.md file
2. Formats your update with timestamp and structure
3. Inserts the update in the appropriate location
4. Preserves all existing content

## Example Update Format

```markdown
## Session Update - 2025-01-02

### Bug Fix: Cosmetic sacrifice not working
**Issue:** Frontend calling wrong function name
**Solution:** Updated contract to use sacrificeForCosmetic(fragments, masks)
**Status:** ✅ Resolved

---
```

## Best Practices

1. **Be Specific** - Include contract addresses, file names, and function names
2. **Be Concise** - Summarize the change clearly
3. **Update Immediately** - Run the updater right after making changes
4. **Include Context** - Mention why the change was needed

## Integration with Claude

When starting a new Claude session:
1. Have Claude read SESSION_MEMORY.md first
2. Make your changes
3. Run the updater after each significant change
4. The next session will have complete context

This ensures seamless continuity across all Claude sessions working on this project.