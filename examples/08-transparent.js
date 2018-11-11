const GDILib = require('..');
const window = GDILib.init({ title: 'GDILib - Example 8.', appId: 'GDI_EXAMPLE_8', alwaysOnTop: true, transparency: true, transparentColor: [255, 0, 0] });

window.onPaint(g => {
  g.clear(255, 0, 0); // clear screen to transparent

  g.brushColor(100, 20, 0);
  g.penColor(255, 255, 255);
  g.font('Sergoe UI', 15, 400);
  g.rectangle(10, 20, 300, 100, false, true);
  g.text(20, 30, 'Transparent backgrounds');

  g.brushColor(255, 0, 0);
  g.rectangle(50, 60, 50, 30, false, true);
});
