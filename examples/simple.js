const GDILib = require('../');

const window = GDILib.init({ title: 'GDILib - Example 1.' });

let angle = 0;

window.onPaint(p => {
  console.log('Painting');

  p.clear(39, 40, 34);

  // draw text
  p
    .brushColor(255, 255, 255)
    .font('Consolas', 16, 400)
    .text(30, 30, 'Hello world from GDILib!');

  // draw colored triangle
  p
    .penColor(255, 0, 0)
    .line(400, 30, 500, 200)
    .penColor(0, 255, 0)
    .line(400, 30, 300, 200)
    .penColor(0, 0, 255)
    .line(300, 200, 500, 200);

  // draw gradient rectangle
  p
    .rotate(angle, 50 + 80, 50 + 80)
    .penColor(255, 255, 255)
    .rectangle(80, 80, 100, 100);

  // for (let i = 0; i < 2000; i++) {
  //   p.line(Math.random()* 500, Math.random() * 500, Math.random() * 500, Math.random() * 500);
  // }

});

setInterval(() => {
  angle += 1;
  window.repaint();
}, 25);