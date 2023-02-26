const fs = require('fs');
const random = require('random-color');
let colors = [];

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
function darkOrLight(red, green, blue) {
  var brightness;
  brightness = (red * 299) + (green * 587) + (blue * 114);
  brightness = brightness / 255000;

  if (brightness >= 0.5) {
    return '#000';
  } else {
    return '#fff';
  }
}

for (let i = 0; i < 36; i++) {
  let s = Math.random();
  // let v = Math.random();
  let c = random().hexString().toLowerCase();
  console.log(c);
  let r = hexToRgb(c);
  colors.push({c,t:darkOrLight(r.r, r.g, r.b)});
}
fs.writeFileSync('./colors.json', JSON.stringify(colors, null, 4));