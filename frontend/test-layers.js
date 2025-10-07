// Test what z-index each layer should have
const LAYER_ORDER = {
  bg: 1,        // Background - layer 1 -> z-index 10
  fur: 2,       // Fur - layer 2 -> z-index 20  
  body: 3,      // Body - layer 3 -> z-index 30
  face: 4,      // Face - layer 4 -> z-index 40
  head: 5,      // Head - layer 5 -> z-index 50
};

console.log('Expected rendering order (bottom to top):');
console.log('  Background (z-index 10) - slot 4');
console.log('  Fur/Color (z-index 20) - slot 3');
console.log('  Body (z-index 30) - slot 2');  
console.log('  Face (z-index 40) - slot 1');
console.log('  Head (z-index 50) - slot 0');
console.log('');
console.log('Base raccoon image should be at z-index 10 (layer 1)');
console.log('So it shows behind everything except background cosmetics');
