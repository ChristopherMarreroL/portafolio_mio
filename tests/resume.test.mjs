import assert from "node:assert/strict";
import test from "node:test";
import { deleteResume, getResume, saveResume, validateResume } from "../src/lib/resume.ts";

const pdf = () => new File(["%PDF-1.7\nCV"], "curriculum.pdf", { type: "application/pdf" });

function storageMock() {
  let stored = null;
  let failure = null;
  const calls = [];
  const bucket = {
    async list() { return { data: stored ? [stored] : [], error: failure }; },
    getPublicUrl(path) { return { data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/portfolio-resume/${path}` } }; },
    async upload(path, file, options) {
      calls.push({ operation: "upload", path, options });
      if (failure) return { error: failure };
      stored = { name: path, updated_at: String(calls.length), id: "cv-id" };
      return { error: null };
    },
    async remove(paths) {
      calls.push({ operation: "remove", paths });
      if (failure) return { error: failure };
      stored = null;
      return { error: null };
    },
  };
  const client = { storage: { from(name) { assert.equal(name, "portfolio-resume"); return bucket; } } };
  return { client, calls, fail(error) { failure = error; } };
}

test("CV validation rejects other formats, fake PDFs, empty files and oversized PDFs before upload", async () => {
  await validateResume(pdf());
  const invalid = [
    new File(["%PDF-1.7"], "cv.png", { type: "application/pdf" }),
    new File(["%PDF-1.7"], "cv.pdf", { type: "image/png" }),
    new File(["<html>fake</html>"], "cv.pdf", { type: "application/pdf" }),
    new File([], "cv.pdf", { type: "application/pdf" }),
    new File(["%PDF-", new Uint8Array(5 * 1024 * 1024)], "cv.pdf", { type: "application/pdf" }),
  ];
  for (const file of invalid) {
    const mock = storageMock();
    await assert.rejects(saveResume(mock.client, file));
    assert.equal(mock.calls.length, 0);
  }
});

test("first upload, replacement and deletion use a single stored CV and versioned download links", async () => {
  const mock = storageMock();
  assert.equal(await getResume(mock.client), null);
  await saveResume(mock.client, pdf());
  const first = await getResume(mock.client);
  assert.equal(new URL(first.downloadUrl).searchParams.get("download"), "Christopher-CV.pdf");
  assert.equal(new URL(first.viewUrl).searchParams.has("download"), false);
  await saveResume(mock.client, pdf());
  const second = await getResume(mock.client);
  assert.notEqual(first.viewUrl, second.viewUrl);
  assert.equal(mock.calls.filter((call) => call.operation === "remove").length, 0);
  for (const call of mock.calls) {
    assert.equal(call.path, "cv.pdf");
    assert.equal(call.options.upsert, true);
    assert.equal(call.options.contentType, "application/pdf");
    assert.equal(call.options.cacheControl, "0");
  }
  await deleteResume(mock.client);
  assert.deepEqual(mock.calls.at(-1).paths, ["cv.pdf"]);
  assert.equal(await getResume(mock.client), null);
});

test("upload and deletion failures propagate and preserve the previously stored CV", async () => {
  const mock = storageMock();
  await saveResume(mock.client, pdf());
  const previous = await getResume(mock.client);
  const error = new Error("Storage unavailable");
  mock.fail(error);
  await assert.rejects(saveResume(mock.client, pdf()), error);
  await assert.rejects(deleteResume(mock.client), error);
  await assert.rejects(getResume(mock.client), error);
  mock.fail(null);
  assert.deepEqual(await getResume(mock.client), previous);
});
