const win32Constants = require('./Win32Constants');

function parseMask(value, mask) {
  const res = [];
  Object.keys(mask).forEach(k => {
    if (value & k) {
      res.push(mask[k]);
    }
  });
  return res
}

module.exports = {
  readWndProcMsg (event) {
    if (!win32Constants.wndProcMsgConstants[event.msg]) {
      return null;
    }
    const res = {
      type: win32Constants.wndProcMsgConstants[event.msg],
      event
    };
    switch (res.type) {
      case 'WM_SIZE':
        res.width = event.llParam;
        res.height = event.hlParam;
        break;
      case 'WM_MOVE':
        res.x = event.llParam;
        res.y = event.hlParam;
        break;
      case 'WM_LBUTTONDOWN':
      case 'WM_LBUTTONUP':
      case 'WM_LBUTTONDBLCLK':
      case 'WM_MBUTTONDOWN':
      case 'WM_MBUTTONUP':
      case 'WM_MBUTTONDBLCLK':
      case 'WM_RBUTTONDOWN':
      case 'WM_RBUTTONUP':
      case 'WM_RBUTTONDBLCLK':
      case 'WM_XBUTTONDOWN':
      case 'WM_XBUTTONUP':
      case 'WM_XBUTTONDBLCLK':
      case 'WM_MOUSEHOVER':
      case 'WM_MOUSEHWHEEL':
      case 'WM_MOUSEWHEEL':
      case 'WM_MOUSELEAVE':
      case 'WM_MOUSEMOVE':
        res.keys = parseMask(event.lwParam, win32Constants.buttonDownMaskConstants);
        res.x = event.llParam;
        res.y = event.hlParam;
        break;
      case 'WM_KEYDOWN':
      case 'WM_KEYUP':
        res.key = win32Constants.virtualKeyCodes[event.lwParam];
        break;
      case 'WM_CHAR':
        res.key = String.fromCharCode(event.lwParam);
        break;
      case 'WM_CLOSE':
      case 'WM_DESTROY':
      case 'WM_NCDESTROY':
        break;
      default:
        return null;
    }
    return res; 
  }
};