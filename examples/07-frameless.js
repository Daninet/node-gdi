const GDILib = require('../');

const buttonWidth = 30;
const titleBarHeight = 30;

let closeButtonHover = false;

const window = GDILib.init({ title: 'GDILib - Example 7.', appId: 'GDI_EXAMPLE_7', width: 600, height: 500, frameless: true, titleBarHeight });

window.onPaint(g => {
  const { width, height } = window.getSize();
  g.clear(39, 40, 34);
  g.penColor(255, 255, 255);
  g.font('Consolas', 16, 400);

  // outer border
  g.penColor(69, 70, 64);
  g.rectangle(0, 0, width, height);

  // titlebar
  g.brushColor(49, 50, 44);
  g.rectangle(0, 0, width, titleBarHeight, false, true);
  g.penColor(210, 210, 210);
  const titleWidth = g.measure('Frameless').width;
  g.text(width / 2 - titleWidth / 2, 7, 'Frameless');

  // titlebar close button
  g.brushColor(89, 90, 84);
  if (closeButtonHover) {
    g.rectangle(width - buttonWidth, 0, buttonWidth, titleBarHeight, false, true);
  }
  g.line(width - buttonWidth / 2 - 5, 10, width - buttonWidth / 2 + 5, titleBarHeight - 10);
  g.line(width - buttonWidth / 2 - 5, titleBarHeight - 10, width - buttonWidth / 2 + 5, 10);
});

function closeButtonHitTest (x, y) {
  const { width } = window.getSize();
  return y < titleBarHeight && x > width - buttonWidth;
}

window.onMouseMove(msg => {
  if (closeButtonHitTest(msg.x, msg.y)) {
    if (!closeButtonHover) {
      closeButtonHover = true;
      window.repaint();
    }
  } else {
    if (closeButtonHover) {
      closeButtonHover = false;
      window.repaint();
    }
  }
});

window.onMouseDown(msg => {
  if (closeButtonHitTest(msg.x, msg.y)) {
    window.close();
  }
});
