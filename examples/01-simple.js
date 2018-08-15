const GDILib = require('../');
const window = GDILib.init({ title: 'GDILib - Example 1.' });

let angle = 0;

window.onPaint(g => {
  g.clear(39, 40, 34); // clear screen to gray

  // draw colored triangle
  g
    .penColor(255, 0, 0)
    .line(400, 30, 500, 200)
    .penColor(0, 255, 0)
    .line(400, 30, 300, 200)
    .penColor(0, 0, 255)
    .line(300, 200, 500, 200);

  // draw rotating rectangle
  g
    .rotate(angle, 50 + 80, 50 + 80)
    .penColor(255, 255, 255)
    .rectangle(80, 80, 100, 100);

  // draw text
  g
    .penColor(255, 255, 255)
    .font('Sergoe UI', 18, 400)
    .text(50, 30, 'Hello world from GDILib!');
});

setInterval(() => {
  angle += 1;
  window.repaint();
}, 30);
