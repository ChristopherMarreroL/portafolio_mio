import assert from "node:assert/strict";
import test from "node:test";
import { clampPdfZoom, fitPdfPage, pdfPixelRatio } from "../src/lib/pdf-preview.ts";

test("PDF fitting keeps landscape and portrait certificates wholly inside mobile and desktop previews", () => {
  for (const [width, height] of [[1190, 842], [595, 842], [2400, 600], [600, 2400]]) {
    for (const [availableWidth, availableHeight] of [[250, 280], [320, 400], [690, 512], [550, 192]]) {
      const scale = fitPdfPage(width, height, availableWidth, availableHeight);
      assert.ok(width * scale <= availableWidth + 0.001);
      assert.ok(height * scale <= availableHeight + 0.001);
      assert.ok(Math.abs(width * scale - availableWidth) < 0.001 || Math.abs(height * scale - availableHeight) < 0.001);
    }
  }
  assert.equal(fitPdfPage(595, 842, 0, 400), 0);
});

test("PDF zoom can go below fitted size and back to a complete-page view", () => {
  assert.equal(clampPdfZoom(0.75), 0.75);
  assert.equal(clampPdfZoom(0), 0.25);
  assert.equal(clampPdfZoom(1), 1);
  assert.equal(clampPdfZoom(10), 4);
});

test("PDF rendering caps canvas memory and dimensions on high-density phones", () => {
  for (const [width, height, ratio] of [[320, 200, 3], [2800, 4000, 3], [6000, 4000, 2]]) {
    const output = pdfPixelRatio(width, height, ratio);
    assert.ok(width * output <= 4096.001);
    assert.ok(height * output <= 4096.001);
    assert.ok(width * height * output ** 2 <= 6_000_001);
  }
});