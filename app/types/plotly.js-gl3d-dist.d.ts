// Type shim for plotly.js-gl3d-dist — the official Plotly GL3D partial bundle.
// The package ships no declaration file; the API surface used by Canvas3D
// (scatter3d, relayout, Plots.resize) is identical to the full Plotly build.
declare module "plotly.js-gl3d-dist" {
  export * from "plotly.js";
}
