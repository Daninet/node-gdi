const GDILib = require('../');
const window = GDILib.init({ title: 'GDILib - Example 1.' });

let angle = 0;

window.onPaint(g => {
  g.clear(39, 40, 34); // clear screen to gray

  // draw colored triangle
  g.penColor(255, 0, 0);
  g.line(400, 30, 500, 200);
  g.penColor(0, 255, 0);
  g.line(400, 30, 300, 200);
  g.penColor(0, 0, 255);
  g.line(300, 200, 500, 200);

  // draw rotating rectangle
  g.rotate(angle, 50 + 80, 50 + 80);
  g.penColor(255, 255, 255);
  g.rectangle(80, 80, 100, 100);

  // draw text
  g.penColor(255, 255, 255);
  g.font('Sergoe UI', 16, 400);
  g.text(50, 30, 'Hello world from GDILib!');
  g.brushColor(255, 0, 0);
  g.rectangle(10, 30, 100, 140, false, true);
});

setInterval(() => {
  angle = (angle + 1) % 360;
  window.repaint();
}, 30);
