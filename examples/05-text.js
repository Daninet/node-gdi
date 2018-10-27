const GDILib = require('../');
const window = GDILib.init({ title: 'GDILib - Example 5.', width: 600, height: 380 });

window.onPaint(g => {
  g.clear(39, 40, 34);
  g.penColor(255, 255, 255);
  g.font('Sergoe UI', 18, 400);

  g.text(40, 20, 'Simple text');

  g.text(40, 50, 'Measured text');
  const { width, height } = g.measure('Measured text');
  g.rectangle(40, 50, width, height);

  g.rectangle(40, 80, 235, 18);
  g.text(40, 80, 'Cropped text - Lorem ipsum', 235, 18);
  g.rectangle(40, 110, 235, 16);
  g.text(40, 110, 'Ellipsis points - Lorem ipsum', 235, 16, { wordEllipsis: true });

  g.rectangle(40, 150, 235, 50);
  g.text(40, 150, 'Wrapped text - Lorem ipsum', 235, 50, { wordBreak: true });

  g.rectangle(40, 220, 235, 50);
  g.text(40, 220, 'Centered text', 235, 50, { vCenter: true, singleLine: true, center: true });

  g.line(450, 20, 450, 100);
  g.rectangle(450, 20, 100, 90);
  g.text(450, 20, 'Left', 100, 50);
  g.text(450, 50, 'Center', 100, 50, { center: true });
  g.text(450, 90, 'Right', 100, 50, { right: true });
});
