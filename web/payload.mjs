const escapeWifi = (value) => value.replace(/[\\;,:\"]/g, "\\$&");
export function makePayload(type, values) {
  if (type === "url") {
    const value = values.url.trim();
    if (!value) throw new Error("Add a website address to create your code.");
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(
        "Enter a complete address, starting with https:// or http://.",
      );
    }
    if (!["https:", "http:"].includes(url.protocol) || !url.hostname)
      throw new Error(
        "Use a website address starting with https:// or http://.",
      );
    if (url.username || url.password)
      throw new Error("Use an address without embedded login details.");
    return url.href;
  }
  if (type === "text") {
    if (!values.text.trim())
      throw new Error("Write a little text to create your code.");
    return values.text;
  }
  if (type === "wifi") {
    if (!values.ssid.trim()) throw new Error("Enter your Wi-Fi network name.");
    const security = values.security === "nopass" ? "nopass" : "WPA";
    if (security !== "nopass" && !values.password)
      throw new Error("Enter the Wi-Fi password, or choose an open network.");
    return `WIFI:T:${security};S:${escapeWifi(values.ssid)};P:${security === "nopass" ? "" : escapeWifi(values.password)};H:${values.hidden ? "true" : "false"};;`;
  }
  throw new Error("Choose a supported content type.");
}

export const palettes = {
  graphite: { dark: "#171a17", light: "#ffffff" },
  forest: { dark: "#194d3b", light: "#ffffff" },
  indigo: { dark: "#323477", light: "#ffffff" },
};
export function qrOptions(palette = "graphite", level = "M", width = 1024) {
  return {
    errorCorrectionLevel: level,
    margin: 4,
    width,
    color: palettes[palette] || palettes.graphite,
  };
}
