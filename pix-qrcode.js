(function (root, factory) {
  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.PixQRCode = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const PIX_GUI = "br.gov.bcb.pix";
  const MAX_KEY_BYTES = 77;
  const MAX_NAME_BYTES = 25;
  const MAX_CITY_BYTES = 15;

  function utf8Bytes(value) {
    if (typeof TextEncoder === "undefined") {
      throw new Error("Este ambiente não oferece suporte a TextEncoder.");
    }

    return new TextEncoder().encode(String(value));
  }

  function byteLength(value) {
    return utf8Bytes(value).length;
  }

  function inputError(message, field) {
    const error = new Error(message);
    error.field = field;
    return error;
  }

  function crc16(value) {
    let crc = 0xffff;

    for (const byte of utf8Bytes(value)) {
      crc ^= byte << 8;

      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xffff;
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  function tlv(id, value) {
    const text = String(value);
    const length = byteLength(text);

    if (length > 99) {
      throw inputError(`O campo ${id} excede o limite de 99 bytes.`, "key");
    }

    return `${id}${String(length).padStart(2, "0")}${text}`;
  }

  function normalizeAmount(value) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "";
    }

    let amount = String(value).trim().replace(/^R\$\s*/i, "").replace(/\s+/g, "");

    if (amount.includes(",")) {
      if ((amount.match(/,/g) || []).length !== 1) {
        throw inputError("Informe um valor válido, como 49,90.", "amount");
      }

      amount = amount.replace(/\./g, "").replace(",", ".");
    }

    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amount)) {
      throw inputError("Use até duas casas decimais, por exemplo 49,90.", "amount");
    }

    let [whole, cents = ""] = amount.split(".");
    whole = whole.replace(/^0+(?=\d)/, "");
    cents = cents.padEnd(2, "0");

    if (/^0+$/.test(whole) && /^0+$/.test(cents)) {
      throw inputError("O valor precisa ser maior que zero.", "amount");
    }

    return `${whole}.${cents}`;
  }

  function normalizeCity(value) {
    const city = value === undefined || value === null ? "SAO PAULO" : value;

    return String(city)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  }

  function qrDimension(value, fallback, label) {
    const dimension = value === undefined ? fallback : Number(value);

    if (!Number.isInteger(dimension) || dimension < 64 || dimension > 1024) {
      throw new RangeError(`${label} deve ser um número inteiro entre 64 e 1024.`);
    }

    return dimension;
  }

  function qrColor(value, fallback, label) {
    const color = value === undefined ? fallback : String(value);

    if (!/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)) {
      throw new TypeError(`${label} deve ser uma cor hexadecimal válida.`);
    }

    return color;
  }

  function qrErrorCorrection(renderer, requested) {
    const levels = renderer.CorrectLevel;

    if (!levels) {
      if (requested === undefined) return undefined;
      if (!Number.isInteger(requested) || requested < 0 || requested > 3) {
        throw new TypeError("Nível de correção QR inválido.");
      }
      return requested;
    }

    if (requested === undefined) return levels.M;
    if (typeof requested === "string" && Object.prototype.hasOwnProperty.call(levels, requested.toUpperCase())) {
      return levels[requested.toUpperCase()];
    }
    if (Object.values(levels).includes(requested)) return requested;

    throw new TypeError("Use um nível de correção QR L, M, Q ou H.");
  }

  function generatePixPayload(data) {
    if (!data || typeof data !== "object") {
      throw new TypeError("Informe os dados do Pix em um objeto.");
    }

    const key = String(data.key || "").trim();
    const name = String(data.name || "").trim();
    const city = normalizeCity(data.city);
    const amount = normalizeAmount(data.amount);

    if (!key) {
      throw inputError("Informe a chave Pix.", "key");
    }

    if (byteLength(key) > MAX_KEY_BYTES) {
      throw inputError("A chave Pix deve ter no máximo 77 bytes.", "key");
    }

    if (!name) {
      throw inputError("Informe o nome do recebedor.", "name");
    }

    if (byteLength(name) > MAX_NAME_BYTES) {
      throw inputError("O nome deve ter no máximo 25 bytes.", "name");
    }

    if (!city) {
      throw inputError("Informe a cidade do recebedor.", "city");
    }

    if (byteLength(city) > MAX_CITY_BYTES) {
      throw inputError("A cidade deve ter no máximo 15 bytes.", "city");
    }

    const merchantAccount = tlv("00", PIX_GUI) + tlv("01", key);
    const amountField = amount ? tlv("54", amount) : "";

    let payload =
      tlv("00", "01") +
      tlv("26", merchantAccount) +
      tlv("52", "0000") +
      tlv("53", "986") +
      amountField +
      tlv("58", "BR") +
      tlv("59", name) +
      tlv("60", city) +
      tlv("62", tlv("05", "***"));

    payload += "6304";
    return payload + crc16(payload);
  }

  function renderPixQRCode(target, data, options) {
    const settings = Object.assign({}, options);
    const renderer = settings.QRCode || (root && root.QRCode);
    const ariaLabel = settings.ariaLabel || "QR Code Pix";

    if (typeof target === "string" && root && root.document) {
      target = root.document.getElementById(target);
    }

    if (!target || typeof target.replaceChildren !== "function") {
      throw new TypeError("Informe um elemento HTML para exibir o QR Code.");
    }

    if (typeof renderer !== "function") {
      throw new Error("Carregue uma biblioteca QRCode.js antes de renderizar o QR Code.");
    }

    const payload = generatePixPayload(data);
    const qrOptions = {
      text: payload,
      width: qrDimension(settings.width, 256, "A largura"),
      height: qrDimension(settings.height, 256, "A altura"),
      colorDark: qrColor(settings.colorDark, "#10251a", "A cor escura"),
      colorLight: qrColor(settings.colorLight, "#ffffff", "A cor clara"),
    };
    const correctLevel = qrErrorCorrection(renderer, settings.correctLevel);

    if (correctLevel !== undefined) {
      qrOptions.correctLevel = correctLevel;
    }

    target.replaceChildren();
    target.setAttribute("role", "img");
    target.setAttribute("aria-label", ariaLabel);

    const instance = new renderer(target, qrOptions);

    return { payload, instance };
  }

  return {
    crc16,
    generatePixPayload,
    renderPixQRCode,
  };
});
