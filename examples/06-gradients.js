const GDILib = require('../');
const window = GDILib.init({ title: 'GDILib - Example 6.', width: 600, height: 500 });

window.onPaint(g => {
  g.clear(39, 40, 34);
  g.penColor(255, 255, 255);
  g.font('Sergoe UI', 18, 400);

  g.text(40, 30, 'Linear gradient');
  g.brushLinearGradient(40, 70, 40 + 150, 70 + 100, 255, 0, 0, 0, 255, 0);
  g.rectangle(40, 70, 150, 100, false, true);

  g.brushLinearGradient(250, 70, 250, 70 + 101, 255, 0, 0, 0, 255, 0);
  g.rectangle(250, 70, 100, 100, false, true);

  g.brushLinearGradient(400, 70, 400 + 101, 70, 255, 0, 0, 0, 255, 0);
  g.rectangle(400, 70, 100, 100, false, true);
});
