const GDILib = require('..');
const fs = require('fs');
const window = GDILib.init({ title: 'GDILib - Example 9.', width: 550, height: 380 });

const imageBuffer = fs.readFileSync('examples/04-images-smiley.png');

let clipPosX = 0;
let clipPosY = 0;
let clipIncX = true;
let clipIncY = true;

window.onPaint(g => {
  g.clear(39, 40, 34);
  g.penColor(255, 255, 255);
  g.setClip(clipPosX, clipPosY, 200, 100);
  g.setClip(clipPosX - 50, clipPosY - 50, 50, 50, 'UNION');

  g.font('Sergoe UI', 18, 400);

  g.text(40, 20, 'Simple text');

  g.text(40, 50, 'Measured text', 200, 200);
  const { width, height } = g.measure('Measured text');
  g.rectangle(40, 50, width, height);

  g.rectangle(40, 80, 235, 18);
  g.text(40, 80, 'Cropped text - Lorem ipsum', 235, 18);

  g.resetClip();
  g.rectangle(40, 110, 235, 16);
  g.text(40, 110, 'Not clipped', 235, 16, { wordEllipsis: true });

  g.setClip(clipPosX, clipPosY, 200, 100);
  g.setClip(clipPosX - 50, clipPosY - 50, 50, 50, 'UNION');

  g.rectangle(40, 150, 235, 50);
  g.text(40, 150, 'Wrapped text - Lorem ipsum', 235, 50, { wordBreak: true });

  g.rectangle(40, 220, 235, 50);
  g.text(40, 220, 'Centered text', 235, 50, { vCenter: true, singleLine: true, center: true });

  g.ellipse(340, 220, 100, 40);
  g.image(315, 50, imageBuffer);
  g.resetClip();
  g.rectangle(clipPosX - 50, clipPosY - 50, 50, 50);
  g.rectangle(clipPosX, clipPosY, 200, 100);
});

setInterval(() => {
  clipPosX = clipIncX ? clipPosX + 2 : clipPosX - 2;
  if (clipPosX > 300) {
    clipIncX = false;
  }
  if (clipPosX < 5) {
    clipIncX = true;
  }
  clipPosY = clipIncY ? clipPosY + 2 : clipPosY - 2;
  if (clipPosY > 175) {
    clipIncY = false;
  }
  if (clipPosY < 5) {
    clipIncY = true;
  }
  window.repaint();
}, 30);
