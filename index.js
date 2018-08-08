const GDIWindow = require('./GDIWindow');

const GDILib = {
  init (config) {
    return GDIWindow.init(config);
  }
};

module.exports = GDILib;

// setInterval(() => console.log('JS Alive'), 1000);

// let window = GDILib.init({ title: 'test' });
// window.hide();
// window.show();
// window.setTitle('test2');
// window.minimize();
// window.maximize();

// window.onResize((width, height) => {
//   console.log('Resized', width, height);
// });

// window.onPaint(p => {
//   console.log('Painting');
//   p//.penWidth(11)
//     .penColor(255, 255, 255)
//     // .line(200, 50, 300, 80)
//     // .line(20, 200, 300, 80)
//     // // .rectangle(20, 20, 40, 50)
//     // .brushColor(255, 255, 255)
//     // // .ellipse(300, 300, 35, 39)
//     // .font('Consolas', 14, 400);
//     // console.log('measure', p.measure('dani hdf df dh f2'));
//     // p.setAlignment(0)
//     // .text(170, 20, 'In particular, this affects tablet PCs, where')
//     // .setAlignment(1)
//     // .text(170, 30, 'In particular, this affects tablet PCs, where')
//     // .setAlignment(2)
//     // .text(170, 40, 'In particular, this affects tablet PCs, where')
//     // .setAlignment(0)
//     // .setFormatFlags(formatFlags.NoWrap | formatFlags.NoClip)
    
//     // .text(70, 50, 'In particular, this affects tablet PCs, where', 90, 120)
//     // .bgColor(255, 20, 20)
//     // .rotate(10)
//     // .rectangle(150, 140, 40, 50)
//     // .measure('dani hdf df dh f2');
//     // .text(70, 20, 'dani')
//     // .image(100, 50, fs.readFileSync('jpg.jpg'), 50, 90)
//     // .polygon([10,10,20,10,40,40,10,20])
//     // .pie(200, 400, 100, 70, 15, 134)
//     // .arc(200, 300, 100, 70, 15, 134)
//     // .curve([10, 10, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200.4])
//     // .polygon([10, 20, 20, 40])
//     // .curve([10,10, 100, 100, 200, 100, 300, 300])
//     // .font('Arial', 25, 100)
//     // .text(150, 20, 'dani')
//     // .gradientRectangle(120, 120, 160, 160, 255, 0, 0, 40, 255, 0, true);

//   for (let i = 0; i < 500; i++) {
//     p.rectangle(Math.random()* 500, Math.random() * 500, Math.random() * 500, Math.random() * 500);
//   }
// });

// window.repaint();
// // window.onKeyPress(key => {
// //   console.log('Key press', key);
// // });

// // window.onKeyDown(key => {
// //   console.log('Key down', key);
// // });

// // window.onKeyUp(key => {
// //   console.log('Key up', key);
// // });

// const {width, height} = window.getSize();
// console.log('width', width, 'height', height);

// // window.setSize(width , height * 2);

// const {x, y} = window.getPosition();
// console.log('x', x, 'y', y);

// window.setPosition(-10, 0);

// // window.setCursor('');

// // window.close();

