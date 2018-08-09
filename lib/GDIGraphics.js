const util = require('./util');

const fontWeightMapping = {
  100: 100,
  thin: 100,
  200: 200,
  extralight: 200,
  ultralight: 200,
  300: 300,
  light: 300,
  lighter: 300,
  400: 400,
  normal: 400,
  regular: 400,
  500: 500,
  medium: 500,
  600: 600,
  semibold: 600,
  demibold: 600,
  700: 700,
  bold: 700,
  800: 800,
  bolder: 800,
  extrabold: 800,
  ultrabold: 800,
  900: 900,
  heavy: 900,
  black: 900
};

const GDIGraphics = (cb) => {
  let data = [];
  return {

    line (x1, y1, x2, y2) {
      if (!util.isFloat(x1) || !util.isFloat(y1) || !util.isFloat(x2) || !util.isFloat(y2)) {
        throw new Error('The parameters should be numeric values!');
      }
      data.push([1, x1, y1, x2, y2]);
      return this;
    },

    penColor (r, g, b, a = 255) {
      if (!util.isInteger(r) || !util.isInteger(g) || !util.isInteger(b) || !util.isInteger(a)) {
        throw new Error('The parameters should be integer values!');
      }
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) {
        throw new Error('The parameters should contain values between 0 - 255!');
      }
      data.push([2, r, g, b, a]);
      return this;
    },

    rectangle (x, y, width, height, stroke = true, fill = false) {
      if (!util.isFloat(x) || !util.isFloat(y) || !util.isFloat(width) || !util.isFloat(height)) {
        throw new Error('The parameters should be numeric values!');
      }
      if (width < 0 || height < 0) {
        throw new Error('Width and height should be positive!');
      }
      if (!util.isBoolean(stroke) || !util.isBoolean(fill)) {
        throw new Error('Stroke and fill should be booleans!');
      }
      data.push([3, x, y, width, height, stroke, fill]);
      return this;
    },

    ellipse (x, y, width, height, stroke = true, fill = false) {
      if (!util.isFloat(x) || !util.isFloat(y) || !util.isFloat(width) || !util.isFloat(height)) {
        throw new Error('The parameters should be numeric values!');
      }
      if (width < 0 || height < 0) {
        throw new Error('Width and height should be positive!');
      }
      if (!util.isBoolean(stroke) || !util.isBoolean(fill)) {
        throw new Error('Stroke and fill should be booleans!');
      }
      data.push([4, x, y, width, height, stroke, fill]);
      return this;
    },

    text (x, y, text, width, height) {
      if (!util.isFloat(x) || !util.isFloat(y)) {
        throw new Error('X and Y should be numeric values!');
      }
      if (!util.isString(text)) {
        throw new Error('Text should be a string!');
      }
      if (width === undefined && height === undefined) {
        data.push([5, x, y, -1, -1, text]);
        return this;
      }
      if (width && height) {
        if (!util.isFloat(width) || !util.isFloat(height)) {
          throw new Error('Width and height should be numeric values!');
        }
        if (width < 0 || height < 0) {
          throw new Error('Width and height should be positive!');
        }
        data.push([5, x, y, width, height, text]);
        return this;
      } else {
        throw new Error('Width and height should be both provided!');
      }
    },

    font (name, size = 14, weight = 400, italic = false, underline = false, strikeout = false) {
      if (!util.isString(name)) {
        throw new Error('Font name should be a string!');
      }
      if (!util.isInteger(size)) {
        throw new Error('Size should be integer!');
      }
      if (size < 0) {
        throw new Error('Size should be positive!');
      }
      if (fontWeightMapping[weight] === undefined) {
        throw new Error('Invalid weight!');
      }
      if (!util.isBoolean(italic) || !util.isBoolean(underline) || !util.isBoolean(strikeout)) {
        throw new Error('Italic, underline, strikeout parameters should be booleans!');
      }
      data.push([6, name, size, fontWeightMapping[weight], italic, underline, strikeout]);
      return this;
    },

    brushColor (r, g, b, a = 255) {
      if (!util.isInteger(r) || !util.isInteger(g) || !util.isInteger(b) || !util.isInteger(a)) {
        throw new Error('The parameters should be integer values!');
      }
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) {
        throw new Error('The parameters should contain values between 0 - 255!');
      }
      data.push([7, r, g, b, a]);
      return this;
    },

    setFormatFlags (flags) {
      const flagValues = {
        DIRECTION_RIGHT_TO_LEFT: 0x01,
        DIRECTION_VERTICAL: 0x02,
        NO_FIT_BLACK_BOX: 0x04,
        DISPLAY_FORMAT_CONTROL: 0x08,
        NO_FONT_FALLBACK: 0x10,
        MEASURE_TRAILING_SPACES: 0x20,
        NO_WRAP: 0x40,
        LINE_LIMIT: 0x80,
        NO_CLIP: 0x100
      };
      if (Array.util.isArray(flags)) {
        if (flags.some(f => !util.isString(f) || flagValues[f.toUpperCase()] === undefined)) {
          throw new Error('Invalid values in flags array!');
        }
        let val = 0;
        flags.forEach(f => { val |= flagValues[f.toUpperCase()]; });
        data.push([8, val]);
        return this;
      } else if (util.isString(flags) && flagValues[flags.toUpperCase()] !== undefined) {
        data.push([8, flagValues[flags.toUpperCase()]]);
        return this;
      } else {
        throw new Error('Invalid value for flags parameter!');
      }
    },

    setAlignment (alignment) {
      const alignmentValues = {
        LEFT: 0,
        CENTER: 1,
        RIGHT: 2
      };
      if (!util.isString(alignment) || alignmentValues[alignment.toUpperCase()] === undefined) {
        throw new Error('Alignment should have one of the following values: LEFT, CENTER, RIGHT!');
      }
      data.push([9, alignmentValues[alignment.toUpperCase()]]);
      return this;
    },

    rotate (angle, originX = 0, originY = 0) {
      if (!util.isFloat(angle) || !util.isFloat(originX) || !util.isFloat(originY)) {
        throw new Error('Angle, originX, originY should be numeric values!');
      }
      data.push([10, angle, originX, originY]);
      return this;
    },

    resetTransform () {
      data.push([11]);
      return this;
    },

    clear (r, g, b, a = 255) {
      if (!util.isInteger(r) || !util.isInteger(g) || !util.isInteger(b) || !util.isInteger(a)) {
        throw new Error('The parameters should be integer values!');
      }
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) {
        throw new Error('The parameters should contain values between 0 - 255!');
      }
      data.push([12, r, g, b, a]);
      return this;
    },

    brushLinearGradient (x1, y1, x2, y2, r1, g1, b1, r2, g2, b2, a1 = 255, a2 = 255) {
      if (!util.isFloat(x1) || !util.isFloat(y1) || !util.isFloat(x2) || !util.isFloat(y2)) {
        throw new Error('X and Y should be numeric values!');
      }
      if (!util.isInteger(r1) || !util.isInteger(g1) || !util.isInteger(b1) || !util.isInteger(a1)) {
        throw new Error('Color parameters should be integer values!');
      }
      if (r1 < 0 || r1 > 255 || g1 < 0 || g1 > 255 || b1 < 0 || b1 > 255 || a1 < 0 || a1 > 255) {
        throw new Error('Color parameters should contain values between 0 - 255!');
      }
      if (!util.isInteger(r2) || !util.isInteger(g2) || !util.isInteger(b2) || !util.isInteger(a2)) {
        throw new Error('Color parameters should be integer values!');
      }
      if (r2 < 0 || r2 > 255 || g2 < 0 || g2 > 255 || b2 < 0 || b2 > 255 || a2 < 0 || a2 > 255) {
        throw new Error('Color parameters should contain values between 0 - 255!');
      }
      data.push([13, x1, y1, x2, y2, r1, g1, b1, a1, r2, g2, b2, a2]);
      return this;
    },

    brushRadialGradient (x, y, width, height, r1, g1, b1, r2, g2, b2, a1 = 255, a2 = 255) {
      if (!util.isFloat(x) || !util.isFloat(y)) {
        throw new Error('X and Y should be numeric values!');
      }
      if (!util.isFloat(width) || !util.isFloat(height)) {
        throw new Error('Width and height should be numeric values!');
      }
      if (width < 0 || height < 0) {
        throw new Error('Width and height should be positive!');
      }
      if (!util.isInteger(r1) || !util.isInteger(g1) || !util.isInteger(b1) || !util.isInteger(a1)) {
        throw new Error('Color parameters should be integer values!');
      }
      if (r1 < 0 || r1 > 255 || g1 < 0 || g1 > 255 || b1 < 0 || b1 > 255 || a1 < 0 || a1 > 255) {
        throw new Error('Color parameters should contain values between 0 - 255!');
      }
      if (!util.isInteger(r2) || !util.isInteger(g2) || !util.isInteger(b2) || !util.isInteger(a2)) {
        throw new Error('Color parameters should be integer values!');
      }
      if (r2 < 0 || r2 > 255 || g2 < 0 || g2 > 255 || b2 < 0 || b2 > 255 || a2 < 0 || a2 > 255) {
        throw new Error('Color parameters should contain values between 0 - 255!');
      }
      data.push([14, x, y, width, height, r1, g1, b1, a1, r2, g2, b2, a2]);
      return this;
    },

    setClip (x, y, width, height, combineMode = 'REPLACE') {
      if (!util.isFloat(x) || !util.isFloat(y)) {
        throw new Error('X and Y should be numeric values!');
      }
      if (!util.isFloat(width) || !util.isFloat(height)) {
        throw new Error('Width and height should be numeric values!');
      }
      if (width < 0 || height < 0) {
        throw new Error('Width and height should be positive!');
      }
      const combineModeValues = {
        REPLACE: 0,
        INTERSECT: 1,
        UNION: 2,
        XOR: 3,
        EXCLUDE: 4,
        COMPLEMENT: 5
      };
      if (!util.isString(combineMode) || combineModeValues[combineMode.toUpperCase()] === undefined) {
        throw new Error('Invalid value for combine mode!');
      }
      data.push([15, x, y, width, height, combineModeValues[combineMode.toUpperCase()]]);
      return this;
    },

    resetClip () {
      data.push([16]);
      return this;
    },

    measure (text, width, height) {
      if (!util.isString(text)) {
        throw new Error('Text should be a string!');
      }
      if (width === undefined && height === undefined) {
        width = -1;
        height = -1;
      } else if (width && height) {
        if (!util.isFloat(width) || !util.isFloat(height)) {
          throw new Error('Width and height should be numeric values!');
        }
        if (width < 0 || height < 0) {
          throw new Error('Width and height should be positive!');
        }
      } else {
        throw new Error('Width and height should be both provided!');
      }
      data.push([17, text, width, height]);
      const ret = this.flush();
      if (width === -1) {
        return {
          width: ret[0],
          height: ret[1]
        };
      }
      return {
        width: ret[0],
        height: ret[1],
        charactersFitted: ret[2],
        linesFilled: ret[3]
      };
    },

    image (x, y, buf, width = -1, height = -1, srcX = 0, srcY = 0, srcWidth = -1, srcHeight = -1) { // PNG, JPG, BMP
      if (!util.isFloat(x) || !util.isFloat(y) || !util.isFloat(width) || !util.isFloat(height) || !util.isFloat(srcX) || !util.isFloat(srcY) || !util.isFloat(srcWidth) || !util.isFloat(srcHeight)) {
        throw new Error('Parameters should be numeric values!');
      }
      if (!Buffer.isBuffer(buf)) {
        throw new Error('Parameter buf should be a Node.js Buffer!');
      }
      data.push([18, buf, x, y, width, height, srcX, srcY, srcWidth, srcHeight]);
      return this;
    },

    polygon (points, stroke = true, fill = false) {
      if (!util.isArray(points)) {
        throw new Error('Parameter points should be an array!');
      }
      if (points.length < 4) {
        throw new Error('Minimum length is 2 points (4 values)!');
      }
      if (points.length % 2 !== 0) {
        throw new Error('Invalid length!');
      }
      if (points.some(v => !util.isFloat(v))) {
        throw new Error('Invalid values in array!');
      }
      if (!util.isBoolean(stroke) || !util.isBoolean(fill)) {
        throw new Error('Stroke and fill parameters should be booleans!');
      }
      data.push([19, points, stroke, fill]);
      return this;
    },

    pie (x, y, width, height, startAngle, sweepAngle, stroke = true, fill = false) {
      if (!util.isFloat(x) || !util.isFloat(y) || !util.isFloat(width) || !util.isFloat(height) || !util.isFloat(startAngle) || !util.isFloat(sweepAngle)) {
        throw new Error('Parameters should be numeric values!');
      }
      if (width < 0 || height < 0) {
        throw new Error('Width and height should be positive!');
      }
      if (!util.isBoolean(stroke) || !util.isBoolean(fill)) {
        throw new Error('Stroke and fill parameters should be booleans!');
      }
      data.push([20, x, y, width, height, startAngle, sweepAngle, stroke, fill]);
      return this;
    },

    arc (x, y, width, height, startAngle, sweepAngle) {
      if (!util.isFloat(x) || !util.isFloat(y) || !util.isFloat(width) || !util.isFloat(height) || !util.isFloat(startAngle) || !util.isFloat(sweepAngle)) {
        throw new Error('Parameters should be numeric values!');
      }
      if (width < 0 || height < 0) {
        throw new Error('Width and height should be positive!');
      }
      data.push([21, x, y, width, height, startAngle, sweepAngle]);
      return this;
    },

    bezier (points) {
      if (!util.isArray(points)) {
        throw new Error('Parameter points should be an array!');
      }
      if (points.length < 8) {
        throw new Error('Minimum length is 4 points (8 values)!');
      }
      if (points.length % 2 !== 0 || (points.length / 2 - 1) % 3 !== 0) {
        throw new Error('Invalid length!');
      }
      if (points.some(v => !util.isFloat(v))) {
        throw new Error('Invalid values in array!');
      }
      data.push([22, points]);
      return this;
    },

    curve (points, close = false, fill = false) {
      if (!util.isArray(points)) {
        throw new Error('Parameter points should be an array!');
      }
      if (points.length < 4) {
        throw new Error('Minimum length is 2 points (4 values)!');
      }
      if (points.length % 2 !== 0) {
        throw new Error('Invalid length!');
      }
      if (points.some(v => !util.isFloat(v))) {
        throw new Error('Invalid values in array!');
      }
      if (!util.isBoolean(close) || !util.isBoolean(fill)) {
        throw new Error('Close and fill parameters should be booleans!');
      }
      data.push([23, points, close, fill]);
      return this;
    },

    penWidth (width) {
      if (!util.isFloat(width)) {
        throw new Error('Pen width should be numeric value!');
      }
      data.push([24, width]);
      return this;
    },

    setTrimming (trimming) {
      const trimmingValues = {
        NONE: 0,
        CHARACTER: 1,
        WORD: 2,
        ELLIPSIS_CHARACTER: 3,
        ELLIPSIS_WORD: 4,
        ELLIPSIS_PATH: 5
      };
      if (!util.isString(trimming) || trimmingValues[trimming.toUpperCase()] === undefined) {
        throw new Error('Invalid value for trimming parameter!');
      }
      data.push([25, trimmingValues[trimming.toUpperCase()]]);
      return this;
    },

    flush () {
      if (data.length === 0) {
        return;
      }
      console.time('paint');
      const ret = cb(data);
      console.timeEnd('paint');
      data = [];
      return ret;
    }

  };
};

module.exports = GDIGraphics;
