const GDIGraphics = require('./GDIGraphics');
const Win32Constants = require('./Win32Constants');
const addon = require('./binding/gdi.node');
const util = require('./util');

let mainLoop;
let currentWindow = null;
let windowConfig = null;

let windowStarted = false;

const windowObj = (mainLoop, windowConfig) => {
  let currentCursor = 0;
  const ret = {
    __cbCreate: () => {},
    __cbCustomMsg: () => {},
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
    __cbMouseWheel: () => {},
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
      if (!windowStarted) {
        return {
          width: windowConfig.width,
          height: windowConfig.height
        };
      }
      const rect = addon.getWindowRect();
      return { width: rect[2], height: rect[3], windowWidth: rect[4], windowHeight: rect[5] };
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
    onMouseWheel (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbMouseWheel = cb;
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
    onCustomMsg (cb) {
      if (!util.isFunction(cb)) {
        throw new Error('A callback function should be passed!');
      }
      ret.__cbCustomMsg = cb;
    },
    setCursor (type) {
      const cursorTypes = {
        ARROW: 32512, // IDC_ARROW
        WAIT: 32514, // IDC_WAIT
        CROSS: 32515, // IDC_CROSS
        IBEAM: 32513, // IDC_IBEAM
        NO: 32648, // IDC_NO
        HELP: 32651, // IDC_HELP
        HAND: 32649, // IDC_HAND
        SIZENWSE: 32642, // IDC_SIZENWSE
        SIZENESW: 32643, // IDC_SIZENESW
        SIZEWE: 32644, // IDC_SIZEWE
        SIZENS: 32645, // IDC_SIZENS
        SIZEALL: 32646 // IDC_SIZEALL
      };
      if (!util.isString(type) || cursorTypes[type.toUpperCase()] === undefined) {
        throw new Error('Invalid value for cursor!');
      }
      if (currentCursor === cursorTypes[type.toUpperCase()]) {
        return;
      }
      addon.setCursor(cursorTypes[type.toUpperCase()]);
      currentCursor = cursorTypes[type.toUpperCase()];
    },
    getClipboard () {
      return addon.getClipboard();
    },
    setClipboard (str) {
      if (!util.isString(str)) {
        throw new Error('Only string clipboard is supported!');
      }
      addon.setClipboard(str);
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
  try {
    currentWindow.__cbPaint(g);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  g.flush();
  return true;
}

let shiftPressed = false;
let controlPressed = false;
let currentScaleMultiplier = null; // 96 / currentDpi

function onMsg (event) {
  if (!Win32Constants.wndProcMsgConstants[event.msg]) {
    return;
  }

  const msg = {
    type: Win32Constants.wndProcMsgConstants[event.msg],
    event
  };

  if (!msg) {
    return;
  }

  const customResponse = currentWindow.__cbCustomMsg(msg);
  if (customResponse !== undefined) {
    if (!util.isInteger(customResponse)) {
      throw new Error('Custom msg response result should be an integer.');
    }
    return customResponse;
  }

  if (msg.type === 'WM_CLOSE') {
    try {
      currentWindow.__cbClose();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_SIZE') {
    try {
      const newDpi = addon.getDpi();
      if (newDpi === 0) {
        return;
      }
      currentScaleMultiplier = 96 / newDpi;
      currentWindow.__cbResize({
        maximized: event.lwParam === 2,
        minimized: event.lwParam === 1,
        restored: event.lwParam === 0,
        width: event.llParam * currentScaleMultiplier,
        height: event.hlParam * currentScaleMultiplier
      });
      currentWindow.repaint();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_MOUSEMOVE') {
    try {
      currentWindow.__cbMouseMove({
        x: msg.event.llParam * currentScaleMultiplier,
        y: msg.event.hlParam * currentScaleMultiplier
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_NCMOUSEMOVE') {
    try {
      currentWindow.__cbMouseMove({
        x: msg.event.llParam * currentScaleMultiplier,
        y: msg.event.hlParam * currentScaleMultiplier
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_MOUSEWHEEL') {
    try {
      currentWindow.__cbMouseWheel({
        delta: msg.event.hwParam >= Math.pow(2, 15) ? -(~msg.event.hwParam + 1 & 0xFFFF) : msg.event.hwParam,
        x: msg.event.llParam * currentScaleMultiplier,
        y: msg.event.hlParam * currentScaleMultiplier
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (['WM_LBUTTONDOWN', 'WM_RBUTTONDOWN', 'WM_MBUTTONDOWN', 'WM_XBUTTONDOWN', 'WM_NCLBUTTONDOWN', 'WM_NCRBUTTONDOWN', 'WM_NCMBUTTONDOWN', 'WM_NCXBUTTONDOWN'].includes(msg.type)) {
    let button;
    if (msg.type.includes('LBUTTONDOWN')) {
      button = 0;
    } else if (msg.type.includes('MBUTTONDOWN')) {
      button = 1;
    } else if (msg.type.includes('RBUTTONDOWN')) {
      button = 2;
    }
    try {
      if (msg.type.startsWith('WM_NC')) {
        currentWindow.__cbMouseDown({
          button,
          x: event.llParam * currentScaleMultiplier,
          y: event.hlParam * currentScaleMultiplier
        });
      } else {
        currentWindow.__cbMouseDown({
          control: !!(event.lwParam & 8),
          shift: !!(event.lwParam & 4),
          button,
          x: event.llParam * currentScaleMultiplier,
          y: event.hlParam * currentScaleMultiplier
        });
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (['WM_LBUTTONUP', 'WM_RBUTTONUP', 'WM_MBUTTONUP', 'WM_XBUTTONUP', 'WM_NCLBUTTONUP', 'WM_NCRBUTTONUP', 'WM_NCMBUTTONUP', 'WM_NCXBUTTONUP'].includes(msg.type)) {
    let button;
    if (msg.type.includes('LBUTTONUP')) {
      button = 0;
    } else if (msg.type.includes('MBUTTONUP')) {
      button = 1;
    } else if (msg.type.includes('RBUTTONUP')) {
      button = 2;
    }
    try {
      if (msg.type.startsWith('WM_NC')) {
        currentWindow.__cbMouseUp({
          button,
          x: event.llParam * currentScaleMultiplier,
          y: event.hlParam * currentScaleMultiplier
        });
      } else {
        currentWindow.__cbMouseUp({
          control: !!(event.lwParam & 8),
          shift: !!(event.lwParam & 4),
          button,
          x: event.llParam * currentScaleMultiplier,
          y: event.hlParam * currentScaleMultiplier
        });
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_KEYDOWN') {
    const key = Win32Constants.virtualKeyCodes[msg.event.lwParam];

    if (key === 'SHIFT') shiftPressed = true;
    else if (key === 'CONTROL') controlPressed = true;

    try {
      currentWindow.__cbKeyDown({
        key,
        shift: shiftPressed,
        control: controlPressed
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_KEYUP') {
    const key = Win32Constants.virtualKeyCodes[msg.event.lwParam];

    if (key === 'SHIFT') shiftPressed = false;
    else if (key === 'CONTROL') controlPressed = false;

    try {
      currentWindow.__cbKeyUp({
        key,
        shift: shiftPressed,
        control: controlPressed
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_CHAR') {
    try {
      currentWindow.__cbKeyPress({
        char: String.fromCharCode(msg.event.lwParam),
        shift: shiftPressed,
        control: controlPressed
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_CREATE') {
    try {
      currentWindow.__cbCreate();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else if (msg.type === 'WM_DESTROY') {
    if (windowConfig.persistPosition) {
      const size = currentWindow.getSize();
      const saveBuf = Buffer.alloc(msg.event.winPos.length + 8);
      msg.event.winPos.copy(saveBuf);
      saveBuf.writeInt32LE(size.windowWidth, msg.event.winPos.length);
      saveBuf.writeInt32LE(size.windowHeight, msg.event.winPos.length + 4);
      savePosData(saveBuf);
    }
  } else if (msg.type === 'WM_NCDESTROY') {
    clearInterval(mainLoop);
    currentWindow = null;
    process.exit(0);
  } else if (msg.type === 'WM_DPICHANGED') {
    currentScaleMultiplier = 96 / msg.event.lwParam;
  } else if (msg.type === 'WM_PAINT') {
    if (currentScaleMultiplier === null) {
      currentScaleMultiplier = 96 / addon.getDpi();
    }
  }
}

function validateOptions (options) {
  if (!util.isObject(options)) {
    throw new Error('Options should be a parameter object!');
  }
  if (options.title !== undefined && !util.isString(options.title)) {
    throw new Error('Title should be a string!');
  }
  if (options.appId !== undefined && !util.isString(options.appId)) {
    throw new Error('AppID should be a string!');
  }
  if (options.width !== undefined && !util.isInteger(options.width)) {
    throw new Error('Width should be an integer!');
  }
  if (options.height !== undefined && !util.isInteger(options.height)) {
    throw new Error('Height should be an integer!');
  }
  if (options.backgroundColor !== undefined) {
    if (!util.isArray(options.backgroundColor)) {
      throw new Error('backgroundColor should be an array!');
    }
    if (options.backgroundColor.length !== 3) {
      throw new Error('backgroundColor should have length of 3: [r, g, b]!');
    }
    if (options.backgroundColor.some(c => !util.isInteger(c) || c < 0 || c > 255)) {
      throw new Error('Invalid background color!');
    }
  }
  if (options.frameless !== undefined && !util.isBoolean(options.frameless)) {
    throw new Error('Frameless flag should be a boolean!');
  }
  if (options.alwaysOnTop !== undefined && !util.isBoolean(options.alwaysOnTop)) {
    throw new Error('AlwaysOnTop flag should be a boolean!');
  }
  if (options.transparency !== undefined && !util.isBoolean(options.transparency)) {
    throw new Error('Transparency flag should be a boolean!');
  }
  if (options.transparentColor !== undefined) {
    if (!util.isArray(options.transparentColor)) {
      throw new Error('transparentColor should be an array!');
    }
    if (options.transparentColor.length !== 3) {
      throw new Error('transparentColor should have length of 3: [r, g, b]!');
    }
    if (options.transparentColor.some(c => !util.isInteger(c) || c < 0 || c > 255)) {
      throw new Error('Invalid transparent color value!');
    }
  }
  if (options.persistPosition !== undefined && !util.isBoolean(options.persistPosition)) {
    throw new Error('PersistPosition flag should be a boolean!');
  }
  if (options.minWidth !== undefined && !util.isInteger(options.minWidth)) {
    throw new Error('Minimum width should be an integer!');
  }
  if (options.maxWidth !== undefined && !util.isInteger(options.maxWidth)) {
    throw new Error('Minimum width should be an integer!');
  }
}

function getDataPath () {
  const tmpDir = require('os').tmpdir();
  const fileName = `${windowConfig.appId.toLowerCase()}.dat`;
  return require('path').join(tmpDir, fileName);
}

function savePosData (data) {
  const fs = require('fs');
  fs.writeFileSync(getDataPath(), data);
}

function loadPosData () {
  const fs = require('fs');
  const path = getDataPath();
  try {
    const buf = fs.readFileSync(path);
    if (buf.length !== 52 || buf[0] !== 44) return null;
    return buf;
  } catch (err) {}
  return null;
}

module.exports = {
  init (options = {}) {
    validateOptions(options);
    const defaultConfig = {
      title: 'GDI Window',
      appId: 'NODE_GDI',
      width: 600,
      height: 400,
      backgroundColor: [39, 40, 34],
      frameless: false,
      titleBarHeight: 0,
      transparency: false,
      transparentColor: [255, 0, 0],
      alwaysOnTop: false,
      persistPosition: true,
      minWidth: 150,
      minHeight: 150
    };
    windowConfig = { ...defaultConfig, ...options };

    let winPos;
    if (windowConfig.persistPosition) {
      winPos = loadPosData();
    }

    if (currentWindow !== null) {
      throw new Error('A window was already created');
    }

    currentWindow = windowObj(mainLoop, windowConfig);

    addon.setPaintCallback(onPaint);
    addon.setWinProcCallback(onMsg);

    process.nextTick(() => {
      addon.createWindow({
        title: windowConfig.title,
        appId: windowConfig.appId,
        width: windowConfig.width,
        height: windowConfig.height,
        r: windowConfig.backgroundColor[0],
        g: windowConfig.backgroundColor[1],
        b: windowConfig.backgroundColor[2],
        showTitleBar: !windowConfig.frameless,
        titleBarHeight: windowConfig.titleBarHeight,
        transparency: windowConfig.transparency,
        transparentColorR: windowConfig.transparentColor[0],
        transparentColorG: windowConfig.transparentColor[1],
        transparentColorB: windowConfig.transparentColor[2],
        alwaysOnTop: windowConfig.alwaysOnTop,
        ...(windowConfig.persistPosition && winPos ? {
          winPos
        } : {}),
        minWidth: windowConfig.minWidth,
        minHeight: windowConfig.minHeight
      });
      windowStarted = true;
    });

    mainLoop = setInterval(() => {
      addon.processMessages();
    }, 15);

    setTimeout(() => {
      currentWindow.repaint();
    }, 0);

    return currentWindow;
  }
};
