const Win32Helper = require('./Win32Helper');
const GDIGraphics = require('./GDIGraphics');
const addon = require('./build/Release/gdi.node');

var SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler("crash.log");

let mainLoop;
let currentWindow = null;

const windowObj = () => {
  const ret = {
    __cbPaint: () => { },
    show () {
      addon.showWindow(0x05); // SW_SHOW
    },
    hide () {
      addon.showWindow(0x00); // SW_HIDE
    },
    maximize () {
      addon.showWindow(0x03); // SW_MAXIMIZE
    },
    minimize () {
      addon.showWindow(0x06); // SW_MINIMIZE
    },
    restore () {
      addon.showWindow(0x09); // SW_RESTORE
    },
    messageBox (text, title = 'Message') {
      if (typeof text !== 'string') {
        throw new Error('Text should be string');
      }
      if (typeof title !== 'string') {
        throw new Error('Title should be string');
      }
      addon.messageBox(text, title);
    },
    setTitle (title) {
      if (typeof title !== 'string') {
        throw new Error('Title should be string');
      }
      addon.setWindowTitle(title);
    },
    getSize () {
      const rect = addon.getWindowRect();
      return { width: rect[2], height: rect[3] };
    },
    setSize (width, height) {
      if (!Number.isInteger(width) || !Number.isInteger(height)) {
        throw new Error('Width and height should be integers!');
      }
      if (width < 0 || height < 0) {
        throw new Error('Width and height should be positive integers!');
      }
      addon.setWindowRect(-1, -1, width, height);
    },
    setPosition (x, y) {
      if (!Number.isInteger(x) || !Number.isInteger(y)) {
        throw new Error('X and Y should be integers!');
      }
      addon.setWindowRect(x, y, -1, -1);
    },
    getPosition () {
      const rect = addon.getWindowRect();
      return { x: rect[0], y: rect[1] };
    },
    repaint () {
      addon.repaint();
    },
    onPaint (cb) {
      ret.__cbPaint = cb;
    },
    setCursor (type) {
      let val = 32512; // IDC_ARROW
      switch(type) {
        case 'ARROW':
          val = 32512; // IDC_ARROW
          break;
        case 'WAIT':
          val = 32514; // IDC_WAIT
          break;
        case 'CROSS':
          val = 32515; // IDC_CROSS
          break;
        case 'IBEAM':
          val = 32513; // IDC_IBEAM
          break;
        case 'NO':
          val = 32648; // IDC_NO
          break;
        case 'HELP':
          val = 32651; // IDC_HELP
          break;
        case 'HAND':
          val = 32649; // IDC_HAND
          break;
        case 'SIZENWSE':
          val = 32642; // IDC_SIZENWSE
          break;
        case 'SIZENESW':
          val = 32643; // IDC_SIZENESW
          break;
        case 'SIZEWE':
          val = 32644; // IDC_SIZEWE
          break;
        case 'SIZENS':
          val = 32645; // IDC_SIZENS
          break;
        case 'SIZEALL':
          val = 32646; // IDC_SIZEALL
          break;
      }
      addon.setCursor(val);
    },
    close () {
      addon.closeWindow();
    },
  };
  return ret;
}

function onPaint(cb) {
  const g = GDIGraphics(arr => {
    return cb.run(arr);
  });
  currentWindow.__cbPaint(g);
  g.flush();
  return true;
}

function onMsg(event) {
  const msg = Win32Helper.readWndProcMsg(event);
  if (!msg) {
    return true;
  }
  if (msg.type === 'WM_NCDESTROY') {
    clearInterval(mainLoop);
    currentWindow = null;
    process.exit();
  }
  return true;
}

module.exports = {
  init (config) {
    if (currentWindow !== null) {
      throw new Error('A window is already created');
    }
    currentWindow = windowObj(mainLoop);
    addon.setPaintCallback(onPaint);
    addon.setWinProcCallback(onMsg);
    addon.createWindow({
      title: 'test window',
      width: 700,
      height: 500,
      r: 39,
      g: 40,
      b: 34,
    });
    mainLoop = setInterval(() => {
      addon.processMessages();
    }, 15);
    setTimeout(() => {
      currentWindow.repaint();
    })
    return currentWindow;
  },
};