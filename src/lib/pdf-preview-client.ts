import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { clampPdfZoom, fitPdfPage, pdfPixelRatio } from "./pdf-preview";

let pdfLibrary: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | undefined;

export function initPdfPreviews() {
  for (const root of document.querySelectorAll<HTMLElement>("[data-pdf-preview]")) {
    if (root.dataset.initialized) continue;
    root.dataset.initialized = "true";
    const dialog = root.closest("dialog");
    const stage = root.querySelector<HTMLElement>("[data-pdf-stage]")!;
    let canvas = root.querySelector<HTMLCanvasElement>("[data-pdf-canvas]")!;
    const status = root.querySelector<HTMLElement>("[data-pdf-status]")!;
    const zoomLabel = root.querySelector<HTMLOutputElement>("[data-pdf-zoom]")!;
    const pageLabel = root.querySelector<HTMLOutputElement>("[data-pdf-page]")!;
    const pages = root.querySelector<HTMLElement>("[data-pdf-pages]")!;
    const zoomIn = root.querySelector<HTMLButtonElement>("[data-pdf-in]")!;
    const zoomOut = root.querySelector<HTMLButtonElement>("[data-pdf-out]")!;
    const fit = root.querySelector<HTMLButtonElement>("[data-pdf-fit]")!;
    const previous = root.querySelector<HTMLButtonElement>("[data-pdf-prev]")!;
    const next = root.querySelector<HTMLButtonElement>("[data-pdf-next]")!;
    const es = root.dataset.lang === "es";
    let active = false;
    let epoch = 0;
    let revision = 0;
    let pdf: PDFDocumentProxy | null = null;
    let loading: PDFDocumentLoadingTask | null = null;
    let rendering: RenderTask | null = null;
    let draining = false;
    let requested = false;
    let pageNumber = 1;
    let zoom = 1;

    function updateControls(ready: boolean) {
      zoomIn.disabled = !ready || zoom >= 4;
      zoomOut.disabled = !ready || zoom <= 0.25;
      fit.disabled = !ready;
      previous.disabled = !ready || pageNumber <= 1;
      next.disabled = !ready || pageNumber >= (pdf?.numPages || 1);
      zoomLabel.textContent = ready ? `${Math.round(zoom * 100)}%` : "";
      pageLabel.textContent = pdf ? `${pageNumber} / ${pdf.numPages}` : "";
    }

    function showError() {
      status.textContent = es
        ? "No se pudo mostrar la vista previa. Usa «Abrir PDF completo» para consultar el certificado."
        : "The preview could not be displayed. Use ‘Open full PDF’ to view the certificate.";
      stage.setAttribute("aria-busy", "false");
      updateControls(false);
    }

    async function drainRenders() {
      if (draining) return;
      draining = true;
      let drainEpoch = epoch;
      try {
        while (requested && active && pdf) {
          requested = false;
          const token = epoch;
          drainEpoch = token;
          const renderRevision = revision;
          const documentToRender = pdf;
          const page = await documentToRender.getPage(pageNumber);
          if (!active || token !== epoch) continue;
          const natural = page.getViewport({ scale: 1 });
          stage.style.aspectRatio = `${natural.width} / ${natural.height}`;
          const scale = fitPdfPage(natural.width, natural.height, stage.clientWidth - 18, stage.clientHeight - 18) * zoom;
          if (!scale) continue;
          const viewport = page.getViewport({ scale });
          const ratio = pdfPixelRatio(viewport.width, viewport.height, window.devicePixelRatio || 1);
          const nextCanvas = document.createElement("canvas");
          nextCanvas.width = Math.ceil(viewport.width * ratio);
          nextCanvas.height = Math.ceil(viewport.height * ratio);
          nextCanvas.style.width = `${viewport.width}px`;
          nextCanvas.style.height = `${viewport.height}px`;
          nextCanvas.className = "block bg-white shadow-sm";
          nextCanvas.dataset.pdfCanvas = "";
          nextCanvas.setAttribute("role", "img");
          nextCanvas.setAttribute("aria-label", canvas.getAttribute("aria-label") || "PDF");
          const task = page.render({
            canvas: nextCanvas,
            viewport: page.getViewport({ scale: scale * ratio }),
            background: "rgb(255,255,255)",
          });
          rendering = task;
          try {
            await task.promise;
          } catch (error) {
            if (!active || token !== epoch || (error as Error).name === "RenderingCancelledException") continue;
            throw error;
          } finally {
            if (rendering === task) rendering = null;
          }
          if (!active || token !== epoch || renderRevision !== revision) continue;
          canvas.replaceWith(nextCanvas);
          canvas.width = canvas.height = 0;
          canvas = nextCanvas;
          stage.setAttribute("aria-busy", "false");
          status.textContent = es
            ? "100% muestra la página completa. Usa + y − para el zoom y desliza para desplazarte."
            : "100% shows the whole page. Use + and − to zoom, and scroll to move.";
          updateControls(true);
        }
      } catch (error) {
        console.error('Could not render certificate PDF:', error);
        if (active && drainEpoch === epoch) showError();
      } finally {
        draining = false;
        if (requested && active && pdf) void drainRenders();
      }
    }

    function requestRender() {
      revision++;
      requested = true;
      stage.setAttribute("aria-busy", "true");
      void drainRenders();
    }

    function changeZoom(value: number) {
      if (!pdf) return;
      zoom = clampPdfZoom(value);
      stage.scrollTo(0, 0);
      requestRender();
    }

    async function activate() {
      if (active) return;
      active = true;
      const token = ++epoch;
      pageNumber = 1;
      zoom = 1;
      updateControls(false);
      stage.scrollTo(0, 0);
      stage.setAttribute("aria-busy", "true");
      status.textContent = es ? "Cargando certificado..." : "Loading certificate...";
      try {
        const library = await (pdfLibrary ??= import("pdfjs-dist/legacy/build/pdf.mjs").catch((error) => { pdfLibrary = undefined; throw error; }));
        if (!active || token !== epoch) return;
        library.GlobalWorkerOptions.workerSrc = workerUrl;
        const task = library.getDocument({
          url: root.dataset.src!,
          cMapUrl: "/pdf-assets/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdf-assets/standard_fonts/",
          wasmUrl: "/pdf-assets/wasm/",
          enableXfa: false,
        });
        loading = task;
        const loaded = await task.promise;
        if (!active || token !== epoch) return;
        pdf = loaded;
        pages.classList.toggle("hidden", loaded.numPages <= 1);
        pages.classList.toggle("flex", loaded.numPages > 1);
        requestRender();
      } catch (error) {
        console.error('Could not load certificate PDF:', error);
        if (active && token === epoch) showError();
      }
    }

    function deactivate() {
      active = false;
      epoch++;
      requested = false;
      rendering?.cancel();
      if (loading) void loading.destroy().catch(() => undefined);
      loading = null;
      pdf = null;
      canvas.width = canvas.height = 0;
      canvas.classList.add("hidden");
      updateControls(false);
    }

    zoomIn.addEventListener("click", () => changeZoom(zoom + 0.25));
    zoomOut.addEventListener("click", () => changeZoom(zoom - 0.25));
    fit.addEventListener("click", () => changeZoom(1));
    function changePage(delta: number) {
      if (!pdf) return;
      pageNumber = Math.max(1, Math.min(pdf.numPages, pageNumber + delta));
      zoom = 1;
      stage.scrollTo(0, 0);
      requestRender();
    }
    previous.addEventListener("click", () => changePage(-1));
    next.addEventListener("click", () => changePage(1));
    new ResizeObserver(() => {
      if (active && pdf) requestRender();
    }).observe(stage);
    if (dialog) {
      new MutationObserver(() => {
        if (dialog.open) void activate();
        else deactivate();
      }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
      if (dialog.open) void activate();
    } else {
      new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void activate();
        }
      }).observe(root);
    }
  }
}