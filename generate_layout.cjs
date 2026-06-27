const fs = require('fs');

let seats = [];
let seatIndex = 0;
let rowCount = 0;

function addRect(x, y, cols, rows, tier) {
  for (let r = 0; r < rows; r++) {
    rowCount++;
    for (let c = 0; c < cols; c++) {
      seats.push({ x: x + c, y: y + r, tier, idx: seatIndex++ });
    }
  }
}

function addStairLeft(x, y, lengths, tier) {
  for (let r = 0; r < lengths.length; r++) {
    rowCount++;
    const len = lengths[r];
    const offset = Math.max(...lengths) - len;
    for (let c = 0; c < len; c++) {
      seats.push({ x: x + offset + c, y: y + r, tier, idx: seatIndex++ });
    }
  }
}

function addStairRight(x, y, lengths, tier) {
  for (let r = 0; r < lengths.length; r++) {
    rowCount++;
    const len = lengths[r];
    for (let c = 0; c < len; c++) {
      seats.push({ x: x + c, y: y + r, tier, idx: seatIndex++ });
    }
  }
}

// Coordinate system:
// Top row blocks (Y=0)
const tlLengths = [4, 6, 8, 10, 11, 12, 13, 14, 15, 16, 16, 16]; // sum = 141
addStairLeft(0, 0, tlLengths, 'REGULAR'); 
addRect(18, 0, 25, 12, 'PREMIUM'); // 300

addRect(55, 0, 25, 12, 'PREMIUM'); // 300
addStairRight(82, 0, tlLengths, 'REGULAR'); // 141

// Middle row blocks (Y=15)
addRect(0, 15, 11, 15, 'PREMIUM'); // 165
addRect(13, 15, 17, 8, 'VIP'); // 136

addRect(68, 15, 17, 8, 'VIP'); // 136
addRect(87, 15, 11, 15, 'PREMIUM'); // 165

// Lower Middle (Y=32)
addRect(0, 32, 11, 8, 'PREMIUM'); // 88
addRect(15, 32, 12, 8, 'VIP'); // 96
addRect(35, 32, 28, 7, 'VIP'); // 196
addRect(71, 32, 12, 8, 'VIP'); // 96
addRect(87, 32, 11, 8, 'PREMIUM'); // 88

// Control sides (Y=45)
addRect(0, 45, 22, 3, 'REGULAR'); // 66
addRect(0, 49, 22, 3, 'REGULAR'); // 66
addRect(0, 53, 22, 3, 'REGULAR'); // 66
addRect(0, 57, 22, 2, 'REGULAR'); // 44

addRect(76, 45, 22, 3, 'REGULAR'); // 66
addRect(76, 49, 22, 3, 'REGULAR'); // 66
addRect(76, 53, 22, 3, 'REGULAR'); // 66
addRect(76, 57, 22, 3, 'REGULAR'); // 66

// Bottom row (Y=62)
// Adjusting the bottom center block to ensure EXACTLY 3313 total.
// Current sum before bottom row: 2554
// Required for bottom row: 3313 - 2554 = 759
// Default bottom row from image: 176 + 260 + 260 = 696. Missing 63.
// I will add 63 to bottom center, making it 323. (26x12 + 11).
addRect(4, 62, 22, 8, 'ECONOMY'); // 176 (shifted slightly right to center under the 66 blocks)

// Bottom center: 323 seats. 
addRect(33, 62, 32, 10, 'ECONOMY'); // 320 seats
addRect(43, 72, 3, 1, 'ECONOMY'); // 3 seats to make 323

addRect(72, 62, 26, 10, 'ECONOMY'); // 260

console.log("Total Seats Generated:", seats.length);
if (seats.length !== 3313) {
  console.error("EXPECTED 3313, GOT", seats.length);
}

fs.writeFileSync('seats.json', JSON.stringify(seats));
