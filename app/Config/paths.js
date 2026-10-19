const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

module.exports = {
  PROJECT_ROOT,
  PUBLIC_PATH: path.join(PROJECT_ROOT, "public"),
  VIEW_PATH: path.join(PROJECT_ROOT, "app", "Views", "index.html"),
};
