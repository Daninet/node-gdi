const GDILib = require('../');
const SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler('crash.log');

const window = GDILib.init({ title: 'GDILib - Example 1.' });

let angle = 0;
let str = 'Hello world from GDILib!';

window.onPaint(p => {
  p.clear(39, 40, 34); // clear screen to gray

  // draw text
  p
    .brushColor(255, 255, 255)
    .penColor(255, 255, 255)
    .font('Sergoe UI', 18, 400);

  const size = p.measure(str);
  p.rectangle(50, 30, size.width, size.height);
  p.text(50, 30, str);
  p.setAlignment('CENTER');
  p.text(300, 70, str);
  p.setAlignment('RIGHT');
  p.text(300, 140, str);
  p.setAlignment('LEFT');
  p.text(300, 190, str);

  p.rectangle(100, 100, 100, 100);
  p.text(100, 200, str, 100, 100, {});

  // draw colored triangle
  p
    .penColor(255, 0, 0)
    .line(400, 30, 500, 200)
    .penColor(0, 255, 0)
    .line(400, 30, 300, 200)
    .penColor(0, 0, 255)
    .line(300, 200, 500, 200);

  // draw rotating rectangle
  p
    .rotate(angle, 50 + 80, 50 + 80)
    .penColor(255, 255, 255)
    .rectangle(80, 80, 100, 100);

  // p.flush();
});

setInterval(() => {
  angle += 1;
  window.repaint();
}, 40);

window.onMouseMove(msg => {
  console.log('move', msg);
});

window.onKeyDown(msg => {
  console.log('onKeyDown', msg);
});

window.onKeyUp(msg => {
  console.log('onKeyUp', msg);
});

window.onKeyPress(msg => {
  console.log('onKeyPress', msg);
});

window.onResize(msg => {
  console.log('onResize', msg);
});

window.onMouseDown(msg => {
  console.log('onMouseDown', msg);
});

window.onMouseUp(msg => {
  console.log('onMouseUp', msg);
});

window.onMouseWheel(msg => {
  console.log('onMouseWheel', msg);
});
