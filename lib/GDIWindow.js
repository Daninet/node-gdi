const GDIGraphics = require('./GDIGraphics');
const Win32Constants = require('./Win32Constants');
const addon = require('../build/Release/gdi.node');
const util = require('./util');

// var SegfaultHandler = require('segfault-handler');
// SegfaultHandler.registerHandler("crash.log");

let mainLoop;
let currentWindow = null;

const windowObj = () => {
  const ret = {
    __cbCreate: () => {},
    __cbPaint: () => {},
    __cbResize: () => {},
    __cbClose: () => {},
    __cbClick: () => {},
    __cbMouseUp: () => {},
    __cbMouseDown: () => {},
    __cbMouseMove: () => {},
    __cbKeyUp: () => {},
    __cbKeyDown: () => {},
    __cbKeyPress: () => {},
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
    onCreate (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbCreate = cb;
    },
    onPaint (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbPaint = cb;
    },
    onResize (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbResize = cb;
    },
    onClose (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbClose = cb;
    },
    onClick (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbClick = cb;
    },
    onMouseUp (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbMouseUp = cb;
    },
    onMouseDown (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbMouseDown = cb;
    },
    onMouseMove (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbMouseMove = cb;
    },
    onKeyUp (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbKeyUp = cb;
    },
    onKeyDown (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbKeyDown = cb;
    },
    onKeyPress (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbKeyPress = cb;
    },
    setCursor (type) {
      const cursorTypes = {
        'ARROW': 32512, // IDC_ARROW
        'WAIT': 32514, // IDC_WAIT
        'CROSS': 32515, // IDC_CROSS
        'IBEAM': 32513, // IDC_IBEAM
        'NO': 32648, // IDC_NO
        'HELP': 32651, // IDC_HELP
        'HAND': 32649, // IDC_HAND
        'SIZENWSE': 32642, // IDC_SIZENWSE
        'SIZENESW': 32643, // IDC_SIZENESW
        'SIZEWE': 32644, // IDC_SIZEWE
        'SIZENS': 32645, // IDC_SIZENS
        'SIZEALL': 32646 // IDC_SIZEALL
      };
      if (!util.isString(type) || cursorTypes[type.toUpperCase()] === undefined) {
        throw new Error('Invalid value for cursor!');
      }
      addon.setCursor(cursorTypes[type.toUpperCase()]);
    },
    close () {
      addon.closeWindow();
    }
  };
  return ret;
};

function onPaint (cb) {
  const g = GDIGraphics(arr => {
    return cb.run(arr);
  });
  currentWindow.__cbPaint(g);
  g.flush();
  return true;
}

let shiftPressed = false;
let controlPressed = false;

function parseMask (value, mask) {
  const res = [];
  Object.keys(mask).forEach(k => {
    if (value & k) {
      res.push(mask[k]);
    }
  });
  return res;
}

function onMsg (event) {
  if (!Win32Constants.wndProcMsgConstants[event.msg]) {
    return true;
  }
  const msg = {
    type: Win32Constants.wndProcMsgConstants[event.msg],
    event
  };
  if (!msg) {
    return true;
  }
  // console.log('msg', msg);
  if (msg.type === 'WM_CLOSE') {
    currentWindow.__cbClose(msg);
  } else if (msg.type === 'WM_SIZE') {
    currentWindow.__cbResize();
  } else if (msg.type === 'WM_MOUSEMOVE') {
    currentWindow.__cbMouseMove({
      x: msg.event.llParam,
      y: msg.event.hlParam
    });
  } else if (['WM_LBUTTONDOWN', 'WM_RBUTTONDOWN', 'WM_MBUTTONDOWN', 'WM_XBUTTONDOWN'].includes(msg.type)) {
    currentWindow.__cbMouseDown({
      keys: parseMask(event.lwParam, Win32Constants.buttonDownMaskConstants)
    });
  } else if (['WM_LBUTTONUP', 'WM_RBUTTONUP', 'WM_MBUTTONUP', 'WM_XBUTTONUP'].includes(msg.type)) {
    currentWindow.__cbMouseUp({
      keys: parseMask(event.lwParam, Win32Constants.buttonDownMaskConstants)
    });
  } else if (msg.type === 'WM_KEYDOWN') {
    const key = Win32Constants.virtualKeyCodes[msg.event.lwParam];

    if (key === 'SHIFT') shiftPressed = true;
    else if (key === 'CONTROL') controlPressed = true;

    currentWindow.__cbKeyDown({
      key,
      shift: shiftPressed,
      control: controlPressed
    });
  } else if (msg.type === 'WM_KEYUP') {
    const key = Win32Constants.virtualKeyCodes[msg.event.lwParam];

    if (key === 'SHIFT') shiftPressed = false;
    else if (key === 'CONTROL') controlPressed = false;

    currentWindow.__cbKeyUp({
      key,
      shift: shiftPressed,
      control: controlPressed
    });
  } else if (msg.type === 'WM_CHAR') {
    currentWindow.__cbKeyPress({
      char: String.fromCharCode(msg.event.lwParam),
      shift: shiftPressed,
      control: controlPressed
    });
  } else if (msg.type === 'WM_CREATE') {
    currentWindow.__cbCreate();
  } else if (msg.type === 'WM_NCDESTROY') {
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
      title: 'GDILib - Example 1.',
      width: 700,
      height: 500,
      r: 39,
      g: 40,
      b: 34
    });

    mainLoop = setInterval(() => {
      addon.processMessages();
    }, 15);

    setTimeout(() => {
      currentWindow.repaint();
    });

    return currentWindow;
  }
};
