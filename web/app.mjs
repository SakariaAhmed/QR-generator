import QRCode from "qrcode";
import { makePayload, qrOptions } from "./payload.mjs";
const $ = (selector) => document.querySelector(selector);
const canvas = $("#qr-canvas");
const status = $("#status");
const buttons = [$("#download-png"), $("#download-svg")];
let current = null;
let generation = 0;
let timer;
const selected = (name) => $(`input[name="${name}"]:checked`).value;
function read() {
  const form = new FormData($("#content-form"));
  const values = Object.fromEntries(form.entries());
  values.hidden = $("#hidden").checked;
  return {
    type: selected("type"),
    values,
    palette: selected("palette"),
    level: $("#correction").value,
    size: Number($("#size").value),
  };
}
function invalidate() {
  generation++;
  current = null;
  buttons.forEach((button) => (button.disabled = true));
  $("#export-status").textContent = "";
}
async function render() {
  invalidate();
  const run = generation;
  const state = read();
  document
    .querySelectorAll("[data-panel]")
    .forEach((panel) => (panel.hidden = panel.dataset.panel !== state.type));
  $("#password-field").hidden = state.values.security === "nopass";
  status.classList.remove("error");
  try {
    const payload = makePayload(state.type, state.values);
    // Validate capacity before drawing so a failed update can never export the previous code.
    const qr = QRCode.create(payload, { errorCorrectionLevel: state.level });
    const offscreen = document.createElement("canvas");
    await QRCode.toCanvas(
      offscreen,
      payload,
      qrOptions(state.palette, state.level, 560),
    );
    if (run !== generation) return;
    canvas.width = offscreen.width;
    canvas.height = offscreen.height;
    canvas.getContext("2d").drawImage(offscreen, 0, 0);
    canvas.hidden = false;
    $("#placeholder").hidden = true;
    canvas.setAttribute(
      "aria-label",
      `QR code for ${state.type === "wifi" ? "a Wi-Fi network" : state.type === "url" ? "a website" : "your text"}`,
    );
    current = { ...state, payload };
    status.textContent = `Ready to scan · ${qr.modules.size} × ${qr.modules.size} modules`;
    buttons.forEach((button) => (button.disabled = false));
  } catch (error) {
    if (run !== generation) return;
    canvas.hidden = true;
    $("#placeholder").hidden = false;
    status.classList.add("error");
    status.textContent = /too big|amount of data|code length|version/i.test(
      error.message,
    )
      ? "This content is too long for a QR code. Shorten it or use a lower recovery setting."
      : error.message;
  }
}
function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function download(format) {
  const snapshot = current;
  if (!snapshot) return;
  try {
    const options = qrOptions(snapshot.palette, snapshot.level, snapshot.size);
    if (format === "svg") {
      const svg = await QRCode.toString(snapshot.payload, {
        ...options,
        type: "svg",
      });
      save(
        new Blob([svg], { type: "image/svg+xml" }),
        `qr-${snapshot.type}.svg`,
      );
    } else {
      const output = document.createElement("canvas");
      await QRCode.toCanvas(output, snapshot.payload, options);
      const blob = await new Promise((resolve) =>
        output.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not create the image.");
      save(blob, `qr-${snapshot.type}.png`);
    }
    $("#export-status").textContent =
      `${format.toUpperCase()} download started.`;
  } catch {
    $("#export-status").textContent =
      "Download could not be created. Please try again.";
  }
}
$("#content-form").addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(timer);
  render();
});
document.addEventListener("input", (event) => {
  if (!event.target.matches("input, textarea, select")) return;
  invalidate();
  clearTimeout(timer);
  timer = setTimeout(
    render,
    event.target.matches("[type=radio], [type=checkbox], select") ? 0 : 150,
  );
});
$("#download-png").addEventListener("click", () => download("png"));
$("#download-svg").addEventListener("click", () => download("svg"));
render();
