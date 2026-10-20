export function fitPdfPage(pageWidth: number, pageHeight: number, availableWidth: number, availableHeight: number) {
  if ([pageWidth, pageHeight, availableWidth, availableHeight].some((value) => !Number.isFinite(value) || value <= 0)) return 0;
  return Math.min(availableWidth / pageWidth, availableHeight / pageHeight);
}

export function clampPdfZoom(value: number) {
  return Math.max(0.25, Math.min(4, Math.round(value * 100) / 100));
}

export function pdfPixelRatio(width: number, height: number, deviceRatio: number) {
  // Bound canvas memory on phones, including large landscape certificates at high zoom.
  return Math.min(Math.max(1, deviceRatio), 2, 4096 / width, 4096 / height, Math.sqrt(6_000_000 / (width * height)));
}