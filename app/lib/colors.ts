const COUNTRY_PALETTE = [
  "#e74c3c",
  "#1482e6",
  "#28a56b",
  "#8e44ef",
  "#f39c12",
  "#e83e8c",
  "#14b8c4",
  "#7cb342",
  "#5b6cff",
  "#f06b2f",
  "#c34ad6",
  "#2f9d57",
];

const CLUSTER_HUES = [4, 18, 34, 48, 72, 96, 132, 164, 192, 214, 236, 258, 282, 312, 336];
const CLUSTER_LIGHTNESS = [48, 54, 60];

export function buildCountryPalette(countryCodes: string[]) {
  return Object.fromEntries(
    countryCodes.map((countryCode, index) => {
      const baseColor = COUNTRY_PALETTE[index % COUNTRY_PALETTE.length];
      return [countryCode, baseColor];
    }),
  );
}

export function colorForCluster(clusterId: number) {
  if (clusterId < 0) {
    return "#94a3b8";
  }

  const hue = CLUSTER_HUES[clusterId % CLUSTER_HUES.length];
  const lightness =
    CLUSTER_LIGHTNESS[Math.floor(clusterId / CLUSTER_HUES.length) % CLUSTER_LIGHTNESS.length];
  return hslToHex(hue, 82, lightness);
}

export function mixWithCanvas(hexOrHsl: string, mix = 0.32) {
  if (!hexOrHsl.startsWith("#")) {
    return hexOrHsl;
  }

  const normalized = hexOrHsl.slice(1);
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => value + value)
          .join("")
      : normalized;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgb(${Math.round(red + (244 - red) * mix)} ${Math.round(
    green + (241 - green) * mix,
  )} ${Math.round(blue + (231 - blue) * mix)})`;
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = l - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = secondary;
  } else if (segment < 2) {
    red = secondary;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = secondary;
  } else if (segment < 4) {
    green = secondary;
    blue = chroma;
  } else if (segment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  return `#${toHex(red + match)}${toHex(green + match)}${toHex(blue + match)}`;
}

function toHex(channel: number) {
  return Math.round(channel * 255)
    .toString(16)
    .padStart(2, "0");
}
