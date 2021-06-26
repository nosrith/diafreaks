export default class DiagramConfig {
  minimumTimeUnit = 5;
  minPlotTime = 0;
  maxPlotTime = 30 * 3600;
  leftPaneWidth = 160;
  scrollTime = 6 * 3600;
  scrollRelY = 0;
  xScale = 0.1;
  yScale = 12;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  static fromJSON(o: any): DiagramConfig {
    if (!(o && typeof o == "object")) {
      throw "Invalid JSON";
    }
    const dc = new DiagramConfig();
    Object.assign(
      dc,
      Object.fromEntries(
        Object.keys(dc)
          .filter((key) => o[key] !== undefined)
          .map((key) => [key, o[key]])
      )
    );
    return dc;
  }
}
