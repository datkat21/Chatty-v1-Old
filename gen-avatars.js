// This file will generate pre-made avatar SVG images
let colors = require('./colors.json');
let fs = require('fs');
for (let i = 0; i < colors.length; i++) {
  let color = colors[i];
  let data = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" style="color:${color.t}">
<rect stroke="none" width="36" height="36" fill="${color.c}"></rect>
<circle fill="none" stroke="white" stroke-width="2" cx="18" cy="18" r="16" opacity="0.5">
</circle> 
<g opacity="0.5" transform="translate(6 6)" x="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path fill="none" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
<circle cx="12" cy="7" r="4" fill="none"></circle>
</g>
</svg>`;
  fs.writeFileSync(__dirname + '/public/avatars/' + i + '.svg', data);
}