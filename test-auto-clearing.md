# Auto-Clearing Test Scenarios

## Test Cases for New Auto-Clearing Behavior

### Scenario 1: Key → Cosmetic Switch
1. User selects 5 Keys
2. User selects 2 Fragments  
**Expected**: Keys reset to 0, Fragments = 2

### Scenario 2: Cosmetic → Glass Shard Switch  
1. User selects 2 Fragments + 1 Mask
2. User selects 10 Glass Shards
**Expected**: Fragments = 0, Masks = 0, Glass Shards = 10

### Scenario 3: Glass Shard → Demon Switch
1. User selects 15 Glass Shards
2. User selects 1 Dagger
**Expected**: Glass Shards = 0, Dagger = 1

### Scenario 4: Demon → Key Switch
1. User selects 2 Daggers + 1 Vial + Cultist
2. User selects 3 Keys
**Expected**: Daggers = 0, Vials = 0, Keys = 3, Contracts/Deeds reset

### Scenario 5: Contract Toggle
1. User selects 2 Daggers + 5 Keys + 1 Fragment  
2. User toggles Binding Contract ON
**Expected**: ALL items = 0, only Contract enabled

### Scenario 6: Mixed within same type (should work)
1. User selects 1 Fragment
2. User selects 2 Masks
**Expected**: Fragments = 1, Masks = 2 (both cosmetic type)

## User Experience Improvements

✅ **No more ignored items** - Users see exactly what will be sacrificed
✅ **Clear visual feedback** - Counters reset immediately  
✅ **No surprise transactions** - WYSIWYG behavior
✅ **Intuitive switching** - Selecting new type clears old type
✅ **Consistent behavior** - Works for all item combinations

## Implementation Benefits

- **Simple Logic**: Single transaction, no sequencing complexity
- **No Anti-Bot Issues**: Only one sacrifice type per transaction  
- **Predictable Gas**: User knows exactly what transaction will cost
- **Error-Free**: No "partial success" scenarios to handle
- **Clean UX**: Visual state matches transaction intent