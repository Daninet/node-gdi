const GDILib = require('../');
const fs = require('fs');
const window = GDILib.init({ title: 'GDILib - Example 4.', width: 600, height: 380 });

const imageBuffer = fs.readFileSync('examples/04-images-smiley.png');

window.onPaint(g => {
  g.clear(39, 40, 34);
  g.penColor(255, 255, 255);
  g.font('Sergoe UI', 16, 400);

  g.text(40, 20, 'Original size');
  g.image(40, 50, imageBuffer);

  g.text(250, 20, 'Keep ratio');
  g.image(250, 50, imageBuffer, 70, -1);
  g.image(330, 50, imageBuffer, -1, 70);

  g.text(430, 20, 'Stretched');
  g.image(430, 50, imageBuffer, 90, 70);

  g.text(250, 150, 'Crop');
  g.image(250, 180, imageBuffer, 90, -1, 30, 30);
  g.image(350, 180, imageBuffer, 70, -1, 25, 25, 100, -1);
  g.image(450, 180, imageBuffer, 70, -1, 25, 25, 100, 80);
});
