import test from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { makePayload, qrOptions } from "../web/payload.mjs";

const cases = [
  ["url", { url: "https://sakariaahmed.com/?hello=world&source=qr" }],
  ["text", { text: "Hei, verden! ÆØÅ — a note\nwith two lines." }],
  [
    "wifi",
    {
      ssid: "Home;office",
      password: "a:b\\c;d",
      security: "WPA",
      hidden: true,
    },
  ],
  [
    "wifi",
    { ssid: "Guest", password: "ignored", security: "nopass", hidden: false },
  ],
];
for (const [kind, values] of cases) {
  test(`${kind} survives PNG export and independent QR decoding: ${values.ssid || ""}`, async () => {
    const payload = makePayload(kind, values);
    for (const palette of ["graphite", "forest", "indigo"]) {
      const buffer = await QRCode.toBuffer(
        payload,
        qrOptions(palette, "M", 512),
      );
      const png = PNG.sync.read(buffer);
      const result = jsQR(
        new Uint8ClampedArray(png.data),
        png.width,
        png.height,
      );
      assert.equal(result?.data, payload);
      assert.equal(png.width, 512);
      assert.deepEqual([...png.data.slice(0, 4)], [255, 255, 255, 255]);
    }
  });
}
test("Wi-Fi escaping and open networks preserve the scanner format", () => {
  assert.equal(
    makePayload("wifi", cases[2][1]),
    "WIFI:T:WPA;S:Home\\;office;P:a\\:b\\\\c\\;d;H:true;;",
  );
  assert.equal(
    makePayload("wifi", cases[3][1]),
    "WIFI:T:nopass;S:Guest;P:;H:false;;",
  );
});
test("invalid, empty, unsafe and credential-bearing URLs are rejected", () => {
  for (const url of [
    "",
    "example.com",
    "javascript:alert(1)",
    "file:///tmp/example",
    "https://user:pass@example.com",
  ])
    assert.throws(() => makePayload("url", { url }));
  assert.throws(() => makePayload("text", { text: "   " }));
  assert.throws(() =>
    makePayload("wifi", { ssid: "Home", password: "", security: "WPA" }),
  );
});
test("all export sizes and recovery levels stay readable", async () => {
  for (const size of [512, 1024, 2048])
    for (const level of ["M", "Q", "H"]) {
      const png = PNG.sync.read(
        await QRCode.toBuffer(
          "https://sakariaahmed.com/",
          qrOptions("graphite", level, size),
        ),
      );
      assert.equal(png.width, size);
      assert.equal(
        jsQR(new Uint8ClampedArray(png.data), size, size)?.data,
        "https://sakariaahmed.com/",
      );
      const svg = await QRCode.toString("https://sakariaahmed.com/", {
        ...qrOptions("graphite", level, size),
        type: "svg",
      });
      assert.match(svg, /<svg[^>]*viewBox=/);
      assert.match(svg, /#ffffff/);
    }
});
test("oversized content reports capacity failure", () => {
  assert.throws(() =>
    QRCode.create("🙂".repeat(1800), { errorCorrectionLevel: "H" }),
  );
});
