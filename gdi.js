const bundleUtil = require('./bundleUtil');
var SegfaultHandler = require('segfault-handler');
const Win32Helper = require('./Win32Helper');

const fs = require('fs');

SegfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name

const addon = require('./build/Release/gdi.node');

setInterval(() => console.log('JS Alive'), 1000);

addon.setWinProcCallback(event => {
  const msg = Win32Helper.readWndProcMsg(event);
  if (!msg) {
    return true;
  }
  // console.log(msg);
  if (msg.type === 'WM_NCDESTROY') {
    process.exit();
  }
  return true;
});


const formatFlags = {
  DirectionRightToLeft: 0x01,
  DirectionVertical: 0x02,
  NoFitBlackBox: 0x04,
  DisplayFormatControl: 0x08,
  NoFontFallback: 0x10,
  MeasureTrailingSpaces: 0x20,
  NoWrap: 0x40,
  LineLimit: 0x80,
  NoClip: 0x100,
};

addon.setPaintCallback(cb => {
  const p = painter(cb);
  p.penColor(255, 0, 0, 50)
  .penWidth(11)
    .line(200, 50, 300, 80)
    .line(20, 200, 300, 80)
    // .penColor(255, 255, 255)
    // .rectangle(20, 20, 40, 50)
    .brushColor(255, 255, 255)
    // .ellipse(300, 300, 35, 39)
    .font('Consolas', 14, 100)
    .setAlignment(0)
    .text(70, 20, 'In particular, this affects tablet PCs, where')
    .setAlignment(1)
    .text(70, 30, 'In particular, this affects tablet PCs, where')
    .setAlignment(2)
    .text(70, 40, 'In particular, this affects tablet PCs, where')
    .setAlignment(0)
    .setFormatFlags(formatFlags.NoWrap | formatFlags.NoClip)
    .text(70, 50, 'In particular, this affects tablet PCs, where', 90, 120)


    
    //.bgColor(255, 20, 20)
    //.rotate(10)
    .rectangle(150, 140, 40, 50)
    .measure('dani hdf df dh f2');
    // .text(70, 20, 'dani')
    // .image(100, 50, fs.readFileSync('jpg.jpg'), 50, 90)
    // .polygon([10,10,20,10,40,40,10,20])
    // .pie(200, 400, 100, 70, 15, 134)
    // .arc(200, 300, 100, 70, 15, 134)
    // .bezier([10,10, 100, 100, 200, 100, 300, 300])
    // .curve([10,10, 100, 100, 200, 100, 300, 300])
    // .font('Arial', 25, 100)
    // .text(150, 20, 'dani')
    // .gradientRectangle(120, 120, 160, 160, 255, 0, 0, 40, 255, 0, true);

  console.log('jobs', cb.run(p.data));
  return true;
});

addon.createWindow({
  title: 'test window',
  width: 700,
  height: 500,
  r: 39,
  g: 40,
  b: 34,
});

// addon.resizeWindow(100, 100);

// addon.messageBox('test msgbox text', 'test title');

const mainLoop = setInterval(() => {addon.processMessages()}, 15);

process.on('exit', code => {
  console.log(`About to exit with code: ${code}`);
  
  clearInterval(mainLoop);
  addon.exit();
  console.log('DLL exit');
  bundleUtil.cleanup();
});

process.on('SIGINT', () => {
  process.exit();
});


