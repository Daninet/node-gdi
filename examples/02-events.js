const GDILib = require('../');
const window = GDILib.init({ title: 'GDILib - Example 2.', appId: 'GDI_EXAMPLE_2' });

window.onClick(msg => {
  console.log('onClick', msg);
});

window.onClose(() => {
  console.log('onClose');
});

window.onCreate(() => {
  console.log('onCreate');
});

window.onKeyDown(msg => {
  console.log('onKeyDown', msg);
});

window.onKeyPress(msg => {
  console.log('onKeyPress', msg);
});

window.onKeyUp(msg => {
  console.log('onKeyUp', msg);
});

window.onMouseDown(msg => {
  console.log('onMouseDown', msg);
});

window.onMouseMove(msg => {
  console.log('onMouseMove', msg);
});

window.onMouseUp(msg => {
  console.log('onMouseUp', msg);
});

window.onMouseWheel(msg => {
  console.log('onMouseWheel', msg);
});

window.onPaint(g => {
  console.log('onPaint');
});

window.onResize(msg => {
  console.log('onResize', msg);
});
