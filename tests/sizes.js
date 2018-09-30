const GDILib = require('..');
const window = GDILib.init({ title: 'GDILib', width: 600, height: 400 });

window.onPaint(g => {
  g.clear(39, 40, 34); // clear screen to gray

  const s = window.getSize();
  const { height } = g.measure('Text');

  g.penColor(255, 255, 255);
  g.line(0, 0, s.width, s.height);
  g.line(s.width, 0, 0, s.height);
  g.font('Sergoe UI', 16, 400);

  const { width: textWidth } = g.measure('Measure text ');
  g.text(10, 50, 'Measure text ');
  g.text(10 + textWidth, 50, 'is okay');

  g.text(0, 0, 'Top left');
  g.text(0, s.height - height, 'Bottom left');
  g.setAlignment('right');
  g.text(s.width, 0, 'Top right');
  g.text(s.width, s.height - height, 'Bottom right');
});
