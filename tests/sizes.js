const GDILib = require('..');
const window = GDILib.init({ title: 'GDILib', width: 600, height: 400 });

window.onPaint(g => {
  g.clear(39, 40, 34); // clear screen to gray

  const s = window.getSize();
  const { height } = g.measure('Text');

  // draw text
  g
    .penColor(255, 255, 255)
    .line(0, 0, s.width, s.height)
    .line(s.width, 0, 0, s.height)
    .font('Sergoe UI', 16, 400)
    .text(0, 0, 'Top left')
    .text(0, s.height - height, 'Bottom left')
    .setAlignment('right')
    .text(s.width, 0, 'Top right')
    .text(s.width, s.height - height, 'Bottom right');
});
