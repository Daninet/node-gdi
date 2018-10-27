#include <node_api.h>
#define UNICODE 1
#include <assert.h>
#include <cstdio>
#include <vector>
#include <windows.h>
#include <Windowsx.h>
#include <objidl.h>
#define GDIPVER 0x0110
#include <gdiplus.h>
#include <shlwapi.h>
using namespace Gdiplus;

const char16_t g_szClassName[] = u"node-gdi";

HMODULE g_hmodDLL;
EXTERN_C IMAGE_DOS_HEADER __ImageBase;

napi_ref cb_wndProc;
napi_ref cb_paint;
napi_env env_global;

HBITMAP screen_buffer;

HDC hdc_global;

HWND hwnd;
HFONT font = NULL;

Graphics *current_graphics;
Pen *current_pen;
Brush *current_brush;
StringFormat *current_stringformat;

bool rotated = false;

bool showTitleBar;
uint32_t titleBarHeight;

double currentDpi = 0;

napi_value run_paint_op(napi_env env, napi_value op) {
  napi_value val;
  assert(napi_get_element(env, op, 0, &val) == napi_ok);

  uint32_t opcode;
  assert(napi_get_value_uint32(env, val, &opcode) == napi_ok);

  if (opcode == 1) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }
    assert(current_graphics->DrawLine(current_pen, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3]) == Ok);
  } else if (opcode == 2) {
    uint32_t col[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_uint32(env, val, &col[i]) == napi_ok);
    }
    // HPEN hPen = CreatePen(PS_SOLID, 1, RGB(col[0], col[1], col[2]));
    // SelectObject(hdc_global, hPen);
    assert(SetDCPenColor(hdc_global, RGB(col[0], col[1], col[2])) != CLR_INVALID);
    assert(SetTextColor(hdc_global, RGB(col[0], col[1], col[2])) != CLR_INVALID);
    assert(current_pen->SetColor(Color(col[3], col[0], col[1], col[2])) == Ok);
  } else if (opcode == 3) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }

    bool stroke;
    assert(napi_get_element(env, op, 5, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &stroke) == napi_ok);

    bool fill;
    assert(napi_get_element(env, op, 6, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &fill) == napi_ok);

    if (stroke) {
      assert(current_graphics->DrawRectangle(current_pen, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3]) == Ok);
    }
    if (fill) {
      assert(current_graphics->FillRectangle(current_brush, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3]) == Ok);
    }
  } else if (opcode == 4) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }

    bool stroke;
    assert(napi_get_element(env, op, 5, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &stroke) == napi_ok);

    bool fill;
    assert(napi_get_element(env, op, 6, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &fill) == napi_ok);

    if (stroke) {
      assert(current_graphics->DrawEllipse(current_pen, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3]) == Ok);
    }
    if (fill) {
      assert(current_graphics->FillEllipse(current_brush, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3]) == Ok);
    }
  } else if (opcode == 5) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
      coord[i] *= currentDpi / 96;
    }

    char16_t str[4096];
    assert(napi_get_element(env, op, 6, &val) == napi_ok);
    size_t len;
    assert(napi_get_value_string_utf16(env, val, str, 4096, &len) == napi_ok);
  
    uint32_t options;
    assert(napi_get_element(env, op, 5, &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &options) == napi_ok);

    if (rotated) {
      Matrix m;
      assert(current_graphics->GetTransform(&m) == Ok);
      REAL v[6];
      assert(m.GetElements(v) == Ok);
      XFORM xForm;
      xForm.eM11 = v[0];
      xForm.eM12 = v[1];
      xForm.eM21 = v[2];
      xForm.eM22 = v[3];
      xForm.eDx  = v[4];
      xForm.eDy  = v[5];
      SetWorldTransform(hdc_global, &xForm);
    }

    if (coord[2] < 0 || coord[3] < 0) {
      RECT rect = { (int32_t)coord[0], (int32_t)coord[1], 65536, 65536 };
      assert(DrawTextExW(hdc_global, (LPWSTR)str, len, &rect, options, NULL));
    } else {
      RECT rect = { (int32_t)coord[0], (int32_t)coord[1], (int32_t)(coord[0] + coord[2]), (int32_t)(coord[1] + coord[3]) };
      assert(DrawTextExW(hdc_global, (LPWSTR)str, len, &rect, options, NULL));
    }

    if (rotated) {
      ModifyWorldTransform(hdc_global, NULL, MWT_IDENTITY);
    }

  } else if (opcode == 6) {
    char16_t font_name[4096];
    assert(napi_get_element(env, op, 1, &val) == napi_ok);
    size_t font_name_len;
    assert(napi_get_value_string_utf16(env, val, font_name, 4096, &font_name_len) == napi_ok);

    int32_t font_size;
    assert(napi_get_element(env, op, 2, &val) == napi_ok);
    assert(napi_get_value_int32(env, val, &font_size) == napi_ok);

    uint32_t font_weight;
    assert(napi_get_element(env, op, 3, &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &font_weight) == napi_ok);

    switch (font_weight) {
      case 100:
        font_weight = FW_THIN;
        break;
      case 200:
        font_weight = FW_EXTRALIGHT;
        break;
      case 300:
        font_weight = FW_LIGHT;
        break;
      case 400:
        font_weight = FW_NORMAL;
        break;
      case 500:
        font_weight = FW_MEDIUM;
        break;
      case 600:
        font_weight = FW_SEMIBOLD;
        break;
      case 700:
        font_weight = FW_BOLD;
        break;
      case 800:
        font_weight = FW_EXTRABOLD;
        break;
      case 900:
        font_weight = FW_BLACK;
        break;
      default:
        font_weight = FW_DONTCARE;
    }

    bool italic;
    assert(napi_get_element(env, op, 4, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &italic) == napi_ok);

    bool underline;
    assert(napi_get_element(env, op, 5, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &underline) == napi_ok);

    bool strikeout;
    assert(napi_get_element(env, op, 6, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &strikeout) == napi_ok);

    if (font != NULL) {
      DeleteObject(font);
    }

    font_size = (int32_t)(font_size * currentDpi / 96);
    font = CreateFontW(-font_size, 0, 0, 0, font_weight, italic, underline, strikeout, DEFAULT_CHARSET,
      OUT_OUTLINE_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, FIXED_PITCH, (LPCWSTR)font_name);
    assert(font);
    SelectObject(hdc_global, font);
  } else if (opcode == 7) {
    uint32_t col[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_uint32(env, val, &col[i]) == napi_ok);
    }

    delete current_brush;
    current_brush = new SolidBrush(Color(col[3], col[0], col[1], col[2]));
    SetBkColor(hdc_global, RGB(col[3], col[0], col[1]));
  } else if (opcode == 8) {
    uint32_t flags;
    assert(napi_get_element(env, op, 1, &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &flags) == napi_ok);

    uint32_t formatFlags = 0;
    if (flags & 0x01) {
      formatFlags |= StringFormatFlagsDirectionRightToLeft;
    } else if (flags & 0x02) {
      formatFlags |= StringFormatFlagsDirectionVertical;
    } else if (flags & 0x04) {
      formatFlags |= StringFormatFlagsNoFitBlackBox;
    } else if (flags & 0x08) {
      formatFlags |= StringFormatFlagsDisplayFormatControl;
    } else if (flags & 0x10) {
      formatFlags |= StringFormatFlagsNoFontFallback;
    } else if (flags & 0x20) {
      formatFlags |= StringFormatFlagsMeasureTrailingSpaces;
    } else if (flags & 0x40) {
      formatFlags |= StringFormatFlagsNoWrap;
    } else if (flags & 0x80) {
      formatFlags |= StringFormatFlagsLineLimit;
    } else if (flags & 0x100) {
      formatFlags |= StringFormatFlagsNoClip;
    }

    current_stringformat->SetFormatFlags(formatFlags);
  } else if (opcode == 9) {
    // uint32_t alignment;
    // assert(napi_get_element(env, op, 1, &val) == napi_ok);
    // assert(napi_get_value_uint32(env, val, &alignment) == napi_ok);

    // UINT sa;
    // switch (alignment) {
    //   case 0:
    //     sa = TA_LEFT;
    //     break;
    //   case 1:
    //     sa = TA_CENTER;
    //     break;
    //   case 2:
    //     sa = TA_RIGHT;
    //     break;
    // }
    // // current_stringformat->SetAlignment(sa);
    // SetTextAlign(hdc_global, sa);
  } else if (opcode == 10) {
    double angle, dx, dy;

    assert(napi_get_element(env, op, 1, &val) == napi_ok);
    assert(napi_get_value_double(env, val, &angle) == napi_ok);

    assert(napi_get_element(env, op, 2, &val) == napi_ok);
    assert(napi_get_value_double(env, val, &dx) == napi_ok);

    assert(napi_get_element(env, op, 3, &val) == napi_ok);
    assert(napi_get_value_double(env, val, &dy) == napi_ok);

    assert(current_graphics->TranslateTransform((REAL)dx, (REAL)dy) == Ok);
    assert(current_graphics->RotateTransform((REAL)angle) == Ok);
    assert(current_graphics->TranslateTransform(-(REAL)dx, -(REAL)dy) == Ok);

    rotated = true;
  } else if (opcode == 11) {
    assert(current_graphics->ResetTransform() == Ok);
  } else if (opcode == 12) {
    uint32_t col[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_uint32(env, val, &col[i]) == napi_ok);
    }
    assert(current_graphics->Clear(Color(col[3], col[0], col[1], col[2])) == Ok);
  } else if (opcode == 13) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }

    uint32_t colors[8];

    for (uint32_t i = 0; i < 8; i++) {
      assert(napi_get_element(env, op, i + 5, &val) == napi_ok);
      assert(napi_get_value_uint32(env, val, &colors[i]) == napi_ok);
    }

    delete current_brush;
    current_brush = new LinearGradientBrush(
      PointF((REAL)coord[0], (REAL)coord[1]),
      PointF((REAL)coord[2], (REAL)coord[3]),
      Color(colors[3], colors[0], colors[1], colors[2]),
      Color(colors[7], colors[4], colors[5], colors[6]));
  } else if (opcode == 14) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }

    uint32_t colors[8];

    for (uint32_t i = 0; i < 8; i++) {
      assert(napi_get_element(env, op, i + 5, &val) == napi_ok);
      assert(napi_get_value_uint32(env, val, &colors[i]) == napi_ok);
    }

    GraphicsPath path;
    path.AddEllipse((REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[4]);

    PathGradientBrush *brush = new PathGradientBrush(&path);
    brush->SetCenterColor(Color(colors[3], colors[0], colors[1], colors[2]));
    Color colorArr[] = {Color(colors[7], colors[4], colors[5], colors[6])};
    int colorCount = 1;
    brush->SetSurroundColors(colorArr, &colorCount);
    delete current_brush;
    current_brush = brush;
  } else if (opcode == 15) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }

    uint32_t combine_mode;

    assert(napi_get_element(env, op, 5, &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &combine_mode) == napi_ok);

    CombineMode cm = CombineModeReplace;
    int32_t gdiMode = RGN_COPY;
    switch  (combine_mode) {
      case 0:
        cm = CombineModeReplace;
        gdiMode = RGN_COPY;
        break;
      case 1:
        cm = CombineModeIntersect;
        gdiMode = RGN_AND;
        break;
      case 2:
        cm = CombineModeUnion;
        gdiMode = RGN_OR;
        break;
      case 3:
        cm = CombineModeXor;
        gdiMode = RGN_XOR;
        break;
      case 4:
        cm = CombineModeExclude;
        gdiMode = RGN_DIFF;
        break;
      case 5:
        cm = CombineModeComplement;
        break;
    }

    RectF rect((REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3]);
    assert(current_graphics->SetClip(rect, cm) == Ok);
    HRGN hRegion = CreateRectRgn((int)coord[0], (int)coord[1], (int)coord[2], (int)coord[3]);
    ExtSelectClipRgn(hdc_global, hRegion, gdiMode);
    DeleteObject(hRegion);
  } else if (opcode == 16) {
    assert(current_graphics->ResetClip() == Ok);
    SelectClipRgn(hdc_global, NULL);
  } else if (opcode == 17) {
    char16_t str[4096];
    assert(napi_get_element(env, op, 1, &val) == napi_ok);
    size_t len;
    assert(napi_get_value_string_utf16(env, val, str, 4096, &len) == napi_ok);

    SIZE gdiSize;
    assert(GetTextExtentPoint32W(hdc_global, (WCHAR*)str, len, &gdiSize));

    napi_value ret;
    assert(napi_create_array_with_length(env, 2, &ret) == napi_ok);
    napi_value ret_arr[2];

    assert(napi_create_double(env, gdiSize.cx * 96 / currentDpi, &ret_arr[0]) == napi_ok);
    assert(napi_create_double(env, gdiSize.cy * 96 / currentDpi, &ret_arr[1]) == napi_ok);

    assert(napi_set_element(env, ret, 0, ret_arr[0]) == napi_ok);
    assert(napi_set_element(env, ret, 1, ret_arr[1]) == napi_ok);
    return ret;
  } else if (opcode == 18) {
    void *data;
    assert(napi_get_element(env, op, 1, &val) == napi_ok);
    size_t len;
    assert(napi_get_buffer_info(env, val, &data, &len) == napi_ok);

    IStream *istream = SHCreateMemStream((BYTE*)data, len);
    Image image(istream, true);

    int32_t destRect[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 2, &val) == napi_ok);
      assert(napi_get_value_int32(env, val, &destRect[i]) == napi_ok);
    }

    if (destRect[2] < 0) {
      destRect[2] = image.GetWidth();
      if (destRect[3] > 0) {
        double ratio = (double)destRect[3] / image.GetHeight();
        destRect[2] = (int32_t)(destRect[2] * ratio);
      }
    }

    if (destRect[3] < 0) {
      destRect[3] = image.GetHeight();
      if (destRect[2] > 0) {
        double ratio = (double)destRect[2] / image.GetWidth();
        destRect[3] = (int32_t)(destRect[3] * ratio);
      }
    }

    int32_t srcRect[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 6, &val) == napi_ok);
      assert(napi_get_value_int32(env, val, &srcRect[i]) == napi_ok);
    }

    if (srcRect[2] < 0) {
      srcRect[2] = image.GetWidth();
      if (srcRect[3] > 0) {
        double ratio = (double)srcRect[3] / image.GetHeight();
        srcRect[2] = (int32_t)(srcRect[2] * ratio);
      }
    }

    if (srcRect[3] < 0) {
      srcRect[3] = image.GetHeight();
      if (srcRect[2] > 0) {
        double ratio = (double)srcRect[2] / image.GetWidth();
        srcRect[3] = (int32_t)(srcRect[3] * ratio);
      }
    }

    Rect dest(destRect[0], destRect[1], destRect[2], destRect[3]);
    assert(current_graphics->DrawImage(&image, dest, srcRect[0], srcRect[1], srcRect[2], srcRect[3], UnitPixel, NULL, NULL, NULL) == Ok);
    istream->Release();
  } else if (opcode == 19) {
    napi_value arr;
    assert(napi_get_element(env, op, 1, &arr) == napi_ok);
    uint32_t array_len = 0;
    assert(napi_get_array_length(env, arr, &array_len) == napi_ok);

    std::vector<PointF> points;
    points.reserve(array_len / 2);
    
    for (uint32_t i = 0; i < array_len; i += 2) {
      double x, y;
      assert(napi_get_element(env, arr, i, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &x) == napi_ok);

      assert(napi_get_element(env, arr, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &y) == napi_ok);

      points.push_back(PointF((REAL)x, (REAL)y));
    }

    PointF* pPoints = &points[0];

    bool stroke;
    assert(napi_get_element(env, op, 2, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &stroke) == napi_ok);

    bool fill;
    assert(napi_get_element(env, op, 3, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &fill) == napi_ok);

    if (stroke) {
      assert(current_graphics->DrawPolygon(current_pen, pPoints, array_len / 2) == Ok);
    }

    if (fill) {
      assert(current_graphics->FillPolygon(current_brush, pPoints, array_len / 2) == Ok);
    }
  } else if (opcode == 20) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }

    double angles[2];

    for (uint32_t i = 0; i < 2; i++) {
      assert(napi_get_element(env, op, i + 5, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &angles[i]) == napi_ok);
    }

    bool stroke;
    assert(napi_get_element(env, op, 7, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &stroke) == napi_ok);

    bool fill;
    assert(napi_get_element(env, op, 8, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &fill) == napi_ok);

    if (stroke) {
      assert(current_graphics->DrawPie(current_pen, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3], (REAL)angles[0], (REAL)angles[1]) == Ok);
    }
    if (fill) {
      assert(current_graphics->FillPie(current_brush, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3], (REAL)angles[0], (REAL)angles[1]) == Ok);
    }
  } else if (opcode == 21) {
    double coord[4];

    for (uint32_t i = 0; i < 4; i++) {
      assert(napi_get_element(env, op, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &coord[i]) == napi_ok);
    }

    double angles[2];

    for (uint32_t i = 0; i < 2; i++) {
      assert(napi_get_element(env, op, i + 5, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &angles[i]) == napi_ok);
    }

    assert(current_graphics->DrawArc(current_pen, (REAL)coord[0], (REAL)coord[1], (REAL)coord[2], (REAL)coord[3], (REAL)angles[0], (REAL)angles[1]) == Ok);
  } else if (opcode == 22) {
    napi_value arr;
    assert(napi_get_element(env, op, 1, &arr) == napi_ok);
    uint32_t array_len = 0;
    assert(napi_get_array_length(env, arr, &array_len) == napi_ok);

    std::vector<PointF> points;
    points.reserve(array_len / 2);
    
    for (uint32_t i = 0; i < array_len; i += 2) {
      double x, y;
      assert(napi_get_element(env, arr, i, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &x) == napi_ok);

      assert(napi_get_element(env, arr, i + 1, &val) == napi_ok);
      assert(napi_get_value_double(env, val, &y) == napi_ok);

      points.push_back(PointF((REAL)x, (REAL)y));
    }

    PointF* pPoints = &points[0];

    assert(current_graphics->DrawBeziers(current_pen, pPoints, array_len / 2) == Ok);
  } else if (opcode == 23) {
    napi_value arr;
    assert(napi_get_element(env, op, 1, &arr) == napi_ok);
    uint32_t array_len = 0;
    assert(napi_get_array_length(env, arr, &array_len) == napi_ok);

    std::vector<Point> points;
    points.reserve(array_len / 2);
    
    for (uint32_t i = 0; i < array_len; i += 2) {
      int32_t x, y;
      assert(napi_get_element(env, arr, i, &val) == napi_ok);
      assert(napi_get_value_int32(env, val, &x) == napi_ok);

      assert(napi_get_element(env, arr, i + 1, &val) == napi_ok);
      assert(napi_get_value_int32(env, val, &y) == napi_ok);

      points.push_back(Point(x, y));
    }

    Point* pPoints = &points[0];

    bool close;
    assert(napi_get_element(env, op, 2, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &close) == napi_ok);

    bool fill;
    assert(napi_get_element(env, op, 3, &val) == napi_ok);
    assert(napi_get_value_bool(env, val, &fill) == napi_ok);

    if (fill) {
      assert(current_graphics->FillClosedCurve(current_brush, pPoints, array_len / 2) == Ok);
    } else if (close) {
      assert(current_graphics->DrawClosedCurve(current_pen, pPoints, array_len / 2) == Ok);
    } else {
      assert(current_graphics->DrawCurve(current_pen, pPoints, array_len / 2) == Ok);
    }
  } else if (opcode == 24) {
    double width;

    assert(napi_get_element(env, op, 1, &val) == napi_ok);
    assert(napi_get_value_double(env, val, &width) == napi_ok);

    assert(current_pen->SetWidth((REAL)width) == Ok);
  } else if (opcode == 25) {
    uint32_t trimming;
    assert(napi_get_element(env, op, 1, &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &trimming) == napi_ok);

    StringTrimming st = StringTrimmingCharacter;
    switch (trimming) {
      case 0:
        st = StringTrimmingNone;
        break;
      case 1:
        st = StringTrimmingCharacter;
        break;
      case 2:
        st = StringTrimmingWord;
        break;
      case 3:
        st = StringTrimmingEllipsisCharacter;
        break;
      case 4:
        st = StringTrimmingEllipsisWord;
        break;
      case 5:
        st = StringTrimmingEllipsisPath;
        break;
    }

    assert(current_stringformat->SetTrimming(st) == Ok);
  } else if (opcode == 26) {
    
  } else if (opcode == 27) {
    Matrix matrix;
    assert(current_graphics->GetTransform(&matrix) == Ok);

    REAL matrix_el[6];
    matrix.GetElements(matrix_el);
  
    napi_value ret;
    assert(napi_create_array_with_length(env, 6, &ret) == napi_ok);
    napi_value ret_arr[6];

    for (uint32_t i = 0; i < 6; i++) {
      assert(napi_create_double(env, matrix_el[i], &ret_arr[i]) == napi_ok);
      assert(napi_set_element(env, ret, i, ret_arr[i]) == napi_ok);
    }
    return ret;
  }

  return 0;
}

napi_value API_RunPaintTasks(napi_env env, napi_callback_info info) {
  size_t argsLength = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);
  uint32_t array_len = 0;
  assert(napi_get_array_length(env, args[0], &array_len) == napi_ok);

  napi_value ret;

  for (uint32_t i = 0; i < array_len; i++) {
    napi_value op;
    assert(napi_get_element(env, args[0], i, &op) == napi_ok);
    ret = run_paint_op(env, op);
    if (ret != 0) {
      break;
    }
  }

  return ret;
}

napi_value CreatePaintResponse(napi_env env) {
  napi_value response_object;
  assert(napi_create_object(env, &response_object) == napi_ok);

  napi_value runFunc;
  assert(napi_create_function(env, NULL, 0, API_RunPaintTasks, NULL, &runFunc) == napi_ok);
  assert(napi_set_named_property(env, response_object, "run", runFunc) == napi_ok);

  return response_object;
}

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {

  napi_value cb_wndProc_val;
  assert(napi_get_reference_value(env_global, cb_wndProc, &cb_wndProc_val) == napi_ok);

  napi_value cb_paint_val;
  assert(napi_get_reference_value(env_global, cb_paint, &cb_paint_val) == napi_ok);

  napi_value null;
  assert(napi_get_null(env_global, &null) == napi_ok);

  napi_value response_object;
  assert(napi_create_object(env_global, &response_object) == napi_ok);

  napi_value paint_response = CreatePaintResponse(env_global);

  HDC hDC;
  PAINTSTRUCT Ps;

  RECT rect;
  GetClientRect(hwnd, &rect);

  RECT windowRect;
  GetWindowRect(hwnd, &windowRect);

  napi_value paint_result;

  HBITMAP hbmOld;

  LRESULT r = 0;
  int32_t x, y;

  POINT p;

  LPARAM jsLParam = lParam;

  switch(msg) {
    case WM_CLOSE:
      DestroyWindow(hwnd);
      break;
    case WM_DESTROY:
      if (screen_buffer) {
        DeleteObject(screen_buffer);
      }
      PostQuitMessage(0);
      break;
    case WM_CREATE:
      if (screen_buffer) {
        DeleteObject(screen_buffer);
      }
      screen_buffer = NULL;
      break;
    case WM_SIZE:
      if (screen_buffer) {
        DeleteObject(screen_buffer);
      }
      screen_buffer = NULL;
      break;
    
    case WM_NCLBUTTONUP:
    case WM_NCRBUTTONUP:
    case WM_NCMBUTTONUP:
    case WM_NCXBUTTONUP:
    case WM_NCLBUTTONDOWN:
    case WM_NCRBUTTONDOWN:
    case WM_NCMBUTTONDOWN:
    case WM_NCXBUTTONDOWN:
    case WM_NCMOUSEMOVE:
      p = { LOWORD(lParam), HIWORD(lParam) };
      ScreenToClient(hwnd, &p);
      jsLParam = MAKELPARAM(p.x, p.y);
      r = DefWindowProc(hwnd, msg, wParam, lParam);
      break;

    // case WM_NCCREATE:
    // {
    //   EnableNonClientDpiScaling(hwnd);
    //   return (DefWindowProc(hwnd, msg, wParam, lParam));
    // }
    // case WM_NCPAINT:
    //   hDC = GetDCEx(hwnd, (HRGN)wParam, DCX_WINDOW | DCX_INTERSECTRGN);
    //   printf("test");
    //   SetDCBrushColor(hDC, RGB(255, 0, 0));
    //   Rectangle(hDC, 0, 0, 1000, 1000);
    //   ReleaseDC(hwnd, hDC);
    //   break;
    case WM_DPICHANGED:{
      UINT dpi = HIWORD(wParam);
      currentDpi = dpi;
      if (screen_buffer) {
        DeleteObject(screen_buffer);
      }
      screen_buffer = NULL;
      RECT* const prcNewWindow = (RECT*)lParam;
      SetWindowPos(hwnd,
          NULL,
          prcNewWindow->left,
          prcNewWindow->top,
          prcNewWindow->right - prcNewWindow->left,
          prcNewWindow->bottom - prcNewWindow->top,
          SWP_NOZORDER | SWP_NOACTIVATE);
      InvalidateRect(hwnd, NULL, NULL);
      break;
    }
    case WM_PAINT: {
      hDC = BeginPaint(hwnd, &Ps);
      hdc_global = CreateCompatibleDC(hDC);
      SetGraphicsMode(hdc_global, GM_ADVANCED);
      SetBkMode(hdc_global, TRANSPARENT);

      if (screen_buffer == NULL) {
        screen_buffer = CreateCompatibleBitmap(hDC, rect.right - rect.left, rect.bottom - rect.top);
      }
      hbmOld = (HBITMAP)SelectObject(hdc_global, screen_buffer);

      current_graphics = Graphics::FromHDC(hdc_global);

      if (currentDpi == 0) { // on first paint
        currentDpi = current_graphics->GetDpiX();
        if (abs(currentDpi - 96) > 0.001) { // if DPI is non-standard then the window should be resized to have correct sizes
          SetWindowPos(hwnd,
            NULL,
            NULL,
            NULL,
            (int32_t)(rect.right * currentDpi / 96),
            (int32_t)(rect.bottom * currentDpi / 96),
            SWP_NOZORDER | SWP_NOACTIVATE | SWP_NOMOVE);
          InvalidateRect(hwnd, NULL, NULL);
          break;
        }
      }
      assert(current_graphics->ScaleTransform((REAL)(currentDpi / 96), (REAL)(currentDpi / 96)) == Ok);
      assert(current_graphics->SetTextRenderingHint(TextRenderingHintClearTypeGridFit) == Ok);
      assert(current_graphics->SetCompositingQuality(CompositingQualityHighQuality) == Ok);
      assert(current_graphics->SetSmoothingMode(SmoothingModeAntiAlias) == Ok);
      current_pen = new Pen(Color(255, 0, 0, 0));
      // current_font = new Font(hDC);
      current_brush = new SolidBrush(Color(255, 0, 0, 0));
      current_stringformat = new StringFormat(0);

      // printf("wm_paint js callback start\n");
      assert(napi_call_function(env_global, null, cb_paint_val, 1, &paint_response, &paint_result) == napi_ok);
      // printf("wm_paint js callback end\n");

      // screen_graphics = new Graphics(hDC);
      // screen_graphics->DrawImage(screen_buffer,rect.left,rect.top,rect.right,rect.bottom);
      if (rotated) {
        assert(ModifyWorldTransform(hdc_global, NULL, MWT_IDENTITY));
      }
      assert(BitBlt(hDC, 0, 0, rect.right, rect.bottom, hdc_global, 0, 0, SRCCOPY));

      // delete screen_graphics;
      delete current_graphics;
      delete current_pen;
      // delete current_font;
      delete current_brush;
      delete current_stringformat;

      SelectObject(hdc_global, hbmOld);
      DeleteObject(hbmOld);
      DeleteDC(hdc_global);

      EndPaint(hwnd, &Ps);
      break;
    }
    case WM_NCHITTEST:
      if (showTitleBar) {
        r = DefWindowProc(hwnd, msg, wParam, lParam);
      } else {
        r = HTCLIENT;
        x = GET_X_LPARAM(lParam);
        y = GET_Y_LPARAM(lParam);
        if (windowRect.bottom - y < 5) {
          if (x - windowRect.left < 5)
            r = HTBOTTOMLEFT;
          else if (windowRect.right - x < 5)
            r = HTBOTTOMRIGHT;
          else
            r = HTBOTTOM;
        } else if (y - windowRect.top < 5) {
          if (x - windowRect.left < 5)
            r = HTTOPLEFT;
          else if (windowRect.right - x < 5)
            r = HTTOPRIGHT;
          else
            r = HTTOP;
        } else if (windowRect.right - x < 5) {
          r = HTRIGHT;
        } else if (x - windowRect.left < 5) {
          r = HTLEFT;
        } else if (titleBarHeight > 0 && y - windowRect.top < (int32_t)titleBarHeight * currentDpi / 96) {
          r = HTCAPTION;
        }
      }
      break;
    default:
      r = DefWindowProc(hwnd, msg, wParam, lParam);
  }

  napi_value n_msg;
  assert(napi_create_uint32(env_global, msg, &n_msg) == napi_ok);
  assert(napi_set_named_property(env_global, response_object, "msg", n_msg) == napi_ok);

  napi_value n_lwParam;
  assert(napi_create_uint32(env_global, LOWORD(wParam), &n_lwParam) == napi_ok);
  assert(napi_set_named_property(env_global, response_object, "lwParam", n_lwParam) == napi_ok);

  napi_value n_hwParam;
  assert(napi_create_uint32(env_global, HIWORD(wParam), &n_hwParam) == napi_ok);
  assert(napi_set_named_property(env_global, response_object, "hwParam", n_hwParam) == napi_ok);

  napi_value n_llParam;
  assert(napi_create_uint32(env_global, LOWORD(jsLParam), &n_llParam) == napi_ok);
  assert(napi_set_named_property(env_global, response_object, "llParam", n_llParam) == napi_ok);

  napi_value n_hlParam;
  assert(napi_create_uint32(env_global, HIWORD(jsLParam), &n_hlParam) == napi_ok);
  assert(napi_set_named_property(env_global, response_object, "hlParam", n_hlParam) == napi_ok);

  napi_value result;
  assert(napi_call_function(env_global, null, cb_wndProc_val, 1, &response_object, &result) == napi_ok);

  napi_valuetype resultType;
  assert(napi_typeof(env_global, result, &resultType) == napi_ok);

  int32_t wndProcResult;
  if (resultType == napi_number) {
    assert(napi_get_value_int32(env_global, result, &wndProcResult) == napi_ok);
  }

  if (resultType != napi_undefined) {
    return wndProcResult;
  }

  return r;
}

ULONG_PTR gdiplusToken;

BOOL APIENTRY DllMain(HMODULE hModule, DWORD reason, LPVOID lpReserved) {
  if (reason == DLL_PROCESS_ATTACH) {
    g_hmodDLL = hModule;
    GdiplusStartupInput gdiplusStartupInput;
    assert(GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL) == Ok);
  } else if (reason == DLL_PROCESS_DETACH) {
    GdiplusShutdown(gdiplusToken);
  }
  return TRUE;
}


napi_value API_SetPaintCallback(napi_env env, napi_callback_info info) {
  env_global = env;
  size_t argc = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argc, args, NULL, NULL) == napi_ok);

  napi_value cb_val = args[0];
  assert(napi_create_reference(env, cb_val, 1, &cb_paint) == napi_ok);

  return 0;
}

napi_value API_SetWinProcCallback(napi_env env, napi_callback_info info) {
  env_global = env;

  size_t argc = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argc, args, NULL, NULL) == napi_ok);

  napi_value cb_val = args[0];

  assert(napi_create_reference(env, cb_val, 100, &cb_wndProc) == napi_ok);

  return 0;
}

napi_value API_StartWindow(napi_env env, napi_callback_info info) {
  size_t argsLength = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);

  napi_value obj = args[0];

  napi_value val;
  assert(napi_get_named_property(env, obj, "title", &val) == napi_ok);
  char16_t window_title[512];
  size_t len;
  assert(napi_get_value_string_utf16(env, val, window_title, 512, &len) == napi_ok);

  uint32_t window_width, window_height;
  assert(napi_get_named_property(env, obj, "width", &val) == napi_ok);
  assert(napi_get_value_uint32(env, val, &window_width) == napi_ok);
  assert(napi_get_named_property(env, obj, "height", &val) == napi_ok);
  assert(napi_get_value_uint32(env, val, &window_height) == napi_ok);

  uint32_t bg_r, bg_g, bg_b;
  assert(napi_get_named_property(env, obj, "r", &val) == napi_ok);
  assert(napi_get_value_uint32(env, val, &bg_r) == napi_ok);
  assert(napi_get_named_property(env, obj, "g", &val) == napi_ok);
  assert(napi_get_value_uint32(env, val, &bg_g) == napi_ok);
  assert(napi_get_named_property(env, obj, "b", &val) == napi_ok);
  assert(napi_get_value_uint32(env, val, &bg_b) == napi_ok);

  assert(napi_get_named_property(env, obj, "showTitleBar", &val) == napi_ok);
  assert(napi_get_value_bool(env, val, &showTitleBar) == napi_ok);

  assert(napi_get_named_property(env, obj, "titleBarHeight", &val) == napi_ok);
  assert(napi_get_value_uint32(env, val, &titleBarHeight) == napi_ok);

  bool alwaysOnTop;
  assert(napi_get_named_property(env, obj, "alwaysOnTop", &val) == napi_ok);
  assert(napi_get_value_bool(env, val, &alwaysOnTop) == napi_ok);

  bool transparency;
  assert(napi_get_named_property(env, obj, "transparency", &val) == napi_ok);
  assert(napi_get_value_bool(env, val, &transparency) == napi_ok);

  assert(
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2) ||
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE) ||
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_SYSTEM_AWARE)
    );

  WNDCLASSEX wc;

  wc.cbSize        = sizeof(WNDCLASSEX);
  wc.style         = 0;
  wc.lpfnWndProc   = WndProc;
  wc.cbClsExtra    = 0;
  wc.cbWndExtra    = 0;
  wc.hInstance     = g_hmodDLL;
  wc.hIcon         = LoadIcon(NULL, IDI_APPLICATION);
  wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
  wc.hbrBackground = CreateSolidBrush( RGB(bg_r, bg_g, bg_b) );
  wc.lpszMenuName  = NULL;
  wc.lpszClassName = (LPCWSTR)g_szClassName;
  wc.hIconSm       = LoadIcon(NULL, IDI_APPLICATION);

  if (!RegisterClassEx(&wc)) {
    MessageBox(NULL, (LPCWSTR)u"Window Registration Failed!", (LPCWSTR)u"Error!", MB_ICONEXCLAMATION | MB_OK);
    return 0;
  }

  hwnd = CreateWindowExW(
    0,
    (LPCWSTR)g_szClassName,
    (LPCWSTR)window_title,
    showTitleBar ? WS_OVERLAPPEDWINDOW | WS_VISIBLE : WS_POPUP,
    CW_USEDEFAULT, CW_USEDEFAULT, window_width, window_height,
    NULL, NULL, g_hmodDLL, NULL
  );

  if (hwnd == NULL) {
    MessageBox(NULL, (LPCWSTR)u"Window Creation Failed!", (LPCWSTR)u"Error!", MB_ICONEXCLAMATION | MB_OK);
    return 0;
  }

  if (alwaysOnTop) {
    SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
  }

  if (transparency) {
    uint32_t r, g, b;
    assert(napi_get_named_property(env, obj, "transparentColorR", &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &r) == napi_ok);
    assert(napi_get_named_property(env, obj, "transparentColorG", &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &g) == napi_ok);
    assert(napi_get_named_property(env, obj, "transparentColorB", &val) == napi_ok);
    assert(napi_get_value_uint32(env, val, &b) == napi_ok);

    SetWindowLong(hwnd, GWL_EXSTYLE, GetWindowLong(hwnd, GWL_EXSTYLE) | WS_EX_LAYERED);
    SetLayeredWindowAttributes(hwnd, RGB(r, g, b), 0, LWA_COLORKEY);
  }

  ShowWindow(hwnd, SW_SHOW);
  UpdateWindow(hwnd);

  return 0;
}

napi_value API_MessageBox(napi_env env, napi_callback_info info) {
  size_t argsLength = 3;
  napi_value args[3];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);

  char16_t text[4096], title[1024];
  size_t len;
  assert(napi_get_value_string_utf16(env, args[0], text, 4096, &len) == napi_ok);
  assert(napi_get_value_string_utf16(env, args[1], title, 1024, &len) == napi_ok);

  MessageBox(NULL, (LPCWSTR)text, (LPCWSTR)title, MB_ICONEXCLAMATION | MB_OK);
  return 0;
}

napi_value API_SetWindowTitle(napi_env env, napi_callback_info info) {
  size_t argsLength = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);

  char16_t title[1024];
  size_t len;
  assert(napi_get_value_string_utf16(env, args[0], title, 1024, &len) == napi_ok);

  SetWindowText(hwnd, (LPCWSTR)title);
  return 0;
}

napi_value API_SetWindowRect(napi_env env, napi_callback_info info) {
  size_t argsLength = 4;
  napi_value args[4];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);

  int32_t x, y, width, height;
  assert(napi_get_value_int32(env, args[0], &x) == napi_ok);
  assert(napi_get_value_int32(env, args[1], &y) == napi_ok);
  assert(napi_get_value_int32(env, args[2], &width) == napi_ok);
  assert(napi_get_value_int32(env, args[3], &height) == napi_ok);

  if (x == -1) { // setting size
    SetWindowPos(hwnd, NULL, 0, 0, width, height, SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOOWNERZORDER | SWP_NOZORDER);
  } else { // setting position
    SetWindowPos(hwnd, NULL, x, y, 0, 0, SWP_NOACTIVATE | SWP_NOSIZE | SWP_NOOWNERZORDER | SWP_NOZORDER);
  }
  return 0;
}

napi_value API_GetWindowRect(napi_env env, napi_callback_info info) {
  RECT rect;
  GetWindowRect(hwnd, &rect);

  napi_value ret;
  assert(napi_create_array_with_length(env, 4, &ret) == napi_ok);
  napi_value ret_arr[4];
  assert(napi_create_int32(env, rect.left, &ret_arr[0]) == napi_ok);
  assert(napi_create_int32(env, rect.top, &ret_arr[1]) == napi_ok);
  assert(napi_set_element(env, ret, 0, ret_arr[0]) == napi_ok);
  assert(napi_set_element(env, ret, 1, ret_arr[1]) == napi_ok);

  GetClientRect(hwnd, &rect);
  assert(napi_create_double(env, (rect.right - 1) * 96 / currentDpi, &ret_arr[2]) == napi_ok);
  assert(napi_create_double(env, (rect.bottom - 1) * 96 / currentDpi, &ret_arr[3]) == napi_ok);
  assert(napi_set_element(env, ret, 2, ret_arr[2]) == napi_ok);
  assert(napi_set_element(env, ret, 3, ret_arr[3]) == napi_ok);

  return ret;
}

napi_value API_SetClipboard(napi_env env, napi_callback_info info) {
  size_t argsLength = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);

  char16_t tmp[1];
  size_t len;

  assert(napi_get_value_string_utf16(env, args[0], tmp, 0, &len) == napi_ok);

  if (OpenClipboard(NULL)) {
    EmptyClipboard();
    size_t size = (len + 1) * sizeof(char16_t);
    HGLOBAL hClipboardData = GlobalAlloc(NULL, size);
    if (hClipboardData) {
      char16_t* pchData = (char16_t*) GlobalLock(hClipboardData);
      if (pchData) {
        assert(napi_get_value_string_utf16(env, args[0], pchData, size, &len) == napi_ok);
        GlobalUnlock(hClipboardData);
        SetClipboardData(CF_UNICODETEXT, hClipboardData);
      }
    }
    CloseClipboard();
  }
  return 0;
}

napi_value API_GetClipboard(napi_env env, napi_callback_info info) {
  napi_value str;
  if (OpenClipboard(NULL)) {
    HANDLE hClipboardData = GetClipboardData(CF_UNICODETEXT);
    if (hClipboardData){
      char16_t *pchData = (char16_t*) GlobalLock(hClipboardData);
      if (pchData){
        assert(napi_create_string_utf16(env, pchData, NAPI_AUTO_LENGTH, &str) == napi_ok);
        GlobalUnlock(hClipboardData);
      }
    }
    CloseClipboard();
  }
  return str;
}

napi_value API_GetDpi(napi_env env, napi_callback_info info) {
  napi_value val;
  assert(napi_create_double(env, currentDpi, &val) == napi_ok);
  return val;
}

napi_value API_ShowWindow(napi_env env, napi_callback_info info) {
  size_t argsLength = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);

  uint32_t val;
  assert(napi_get_value_uint32(env, args[0], &val) == napi_ok);

  ShowWindow(hwnd, val);
  return 0;
}

napi_value API_CloseWindowFunc(napi_env env, napi_callback_info info) {
  DestroyWindow(hwnd);
  UnregisterClass((LPCWSTR)g_szClassName, NULL);
  return 0;
}

napi_value API_Repaint(napi_env env, napi_callback_info info) {
  InvalidateRect(hwnd, NULL, NULL);
  return 0;
}

napi_value API_SetCursorIcon(napi_env env, napi_callback_info info) {
  size_t argsLength = 1;
  napi_value args[1];
  assert(napi_get_cb_info(env, info, &argsLength, args, NULL, 0) == napi_ok);

  uint32_t val;
  assert(napi_get_value_uint32(env, args[0], &val) == napi_ok);

  HCURSOR cursor = LoadCursor(NULL, MAKEINTRESOURCE(val));
  SetCursor(cursor);
  
  return 0;
}

napi_value API_ProcessMessages(napi_env env, napi_callback_info info) {
  MSG msg;

  while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
    TranslateMessage(&msg);
    DispatchMessage(&msg);
  }

  return 0;
}

napi_value API_ExitFunc(napi_env env, napi_callback_info info) {
  CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)FreeLibrary, &__ImageBase, 0, NULL);
  return 0;
}

void AddFunc(napi_env env, napi_value exports, napi_callback cb, const char* utf8Name) {
  napi_value myFunc;

  assert(napi_create_function(env, NULL, 0, cb, NULL, &myFunc) == napi_ok);
  assert(napi_set_named_property(env, exports, utf8Name, myFunc) == napi_ok);
}

napi_value Init(napi_env env, napi_value exports) {
  AddFunc(env, exports, API_StartWindow, "createWindow");
  AddFunc(env, exports, API_ExitFunc, "exit");
  AddFunc(env, exports, API_ProcessMessages, "processMessages");
  AddFunc(env, exports, API_SetWinProcCallback, "setWinProcCallback");
  AddFunc(env, exports, API_SetPaintCallback, "setPaintCallback");
  AddFunc(env, exports, API_MessageBox, "messageBox");
  AddFunc(env, exports, API_SetWindowRect, "setWindowRect");
  AddFunc(env, exports, API_GetWindowRect, "getWindowRect");
  AddFunc(env, exports, API_ShowWindow, "showWindow");
  AddFunc(env, exports, API_SetCursorIcon, "setCursor");
  AddFunc(env, exports, API_SetWindowTitle, "setWindowTitle");
  AddFunc(env, exports, API_CloseWindowFunc, "closeWindow");
  AddFunc(env, exports, API_Repaint, "repaint");
  AddFunc(env, exports, API_SetClipboard, "setClipboard");
  AddFunc(env, exports, API_GetClipboard, "getClipboard");
  AddFunc(env, exports, API_GetDpi, "getDpi");

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)

