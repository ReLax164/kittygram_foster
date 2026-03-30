export const URL = "";

export const colorsList = [
  "#FFE4C4",
  "#DEB887",
  "#FFA500",
  "#FF8C00",
  "#D2691E",
  "#8B4513",
  "#FFFFFF",
  "#F5F5F5",
  "#DCDCDC",
  "#A9A9A9",
  "#808080",
  "#000000",
];

export const colorsNames = {
  "bisque": "#FFE4C4",
  "burlywood": "#DEB887",
  "orange": "#FFA500",
  "darkorange": "#FF8C00",
  "chocolate": "#D2691E",
  "saddlebrown": "#8B4513",
  "white": "#FFFFFF",
  "whitesmoke": "#F5F5F5",
  "gainsboro": "#DCDCDC",
  "darkgrey": "#A9A9A9",
  "gray": "#808080",
  "black": "#000000",
};

export const ownershipStatusLabels = {
  home: "Домашний",
  foster: "На передержке",
};

export const formatAchievementsText = (value) => {
  if (!value) {
    return "";
  }

  const items = Array.isArray(value)
    ? value
    : value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return items
    .map((item, index) => {
      const normalized = item.trim();
      if (!normalized) {
        return "";
      }
      if (index === 0) {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      }
      return normalized.charAt(0).toLowerCase() + normalized.slice(1);
    })
    .filter(Boolean)
    .join(", ");
};

export const formatDisplayDate = (value) => {
  if (!value || typeof value !== "string") {
    return value;
  }

  const parts = value.split("-");
  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;
  return `${day}.${month}.${year}`;
};

export const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
