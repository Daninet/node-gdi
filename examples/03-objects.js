const GDILib = require('../');
const window = GDILib.init({ title: 'GDILib - Example 3.', appId: 'GDI_EXAMPLE_3', width: 600, height: 420 });

window.onPaint(g => {
  g.clear(39, 40, 34);
  g.penColor(255, 255, 255);
  g.brushColor(255, 255, 255);
  g.font('Sergoe UI', 14, 400);

  g.text(40, 20, 'Line:');
  g.line(40, 50, 140, 50);

  g.text(180, 20, 'Bezier:');
  g.bezier([180, 50, 200, 30, 220, 70, 250, 50]);

  g.text(350, 20, 'Curve:');
  g.curve([350, 50, 370, 40, 390, 60, 410, 50]);

  g.text(430, 20, 'Closed curve:');
  g.curve([430, 50, 450, 40, 470, 60, 490, 50], true);

  g.text(40, 70, 'Rectangle:');
  g.rectangle(40, 90, 100, 40);

  g.text(180, 70, 'Filled rectangle:');
  g.rectangle(180, 90, 100, 40, false, true);

  g.text(40, 150, 'Ellipse:');
  g.ellipse(40, 170, 100, 40);

  g.text(180, 150, 'Filled ellipse:');
  g.ellipse(180, 170, 100, 40, false, true);

  g.text(40, 220, 'Polygon:');
  g.polygon([40, 270, 80, 240, 110, 250, 120, 300]);

  g.text(180, 220, 'Filled polygon:');
  g.polygon([180, 270, 220, 240, 250, 250, 260, 300], false, true);

  g.text(350, 70, 'Pie:');
  g.pie(350, 90, 40, 40, 0, 280);

  g.text(430, 70, 'Filled pie:');
  g.pie(430, 90, 40, 40, 0, 280, false, true);

  g.text(350, 150, 'Arc:');
  g.arc(350, 170, 40, 40, 0, 280);

  g.text(430, 150, 'Filled arc:');
  g.arc(430, 170, 40, 40, 0, 280, false, true);
});
