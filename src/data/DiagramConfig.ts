export default class DiagramConfig {
    minimumTimeUnit = 5;
    minPlotTime = 0;
    maxPlotTime = 30 * 3600;
    fontFamily = "Verdana, sans-serif";
    topPaneHeight = 30;
    hourlyLabelBottomMargin = 4;
    hourlyLabelFontSize = 14;
    hourlyLabelColor = "rgb(128, 192, 128)";
    hourlyGridLineWidth = 2.25;
    hourlyGridLineColor = "rgb(128, 192, 128)";
    majorMinutelyGridLineSpan = 10 * 60;
    majorMinutelyGridLineWidth = 1.5;
    majorMinutelyGridLineColor = "rgb(128, 192, 128)";
    minorMinutelyGridLineSpan = 2 * 60;
    minorMinutelyGridLineWidth = 0.75;
    minorMinutelyGridLineColor = "rgb(128, 192, 128)";
    leftPaneWidth = 140;
    stationLabelLeftMargin = 14;
    stationLabelRightMargin = 14;
    stationLabelFontSize = 14;
    stationLabelColor = "rgb(128, 192, 128)";
    stationLineWidth = 1;
    stationLineColor = "rgb(128, 192, 128)";
    plotPanePadding = 4;
    trackLabelLeftMargin = 10;
    trackLabelFontSize = 11;
    trackLabelColor = "rgb(128, 192, 128)";
    trackLineWidth = 0.75;
    trackLineColor = "rgb(128, 192, 128)";
    trackLineSpan = 12;
    scrollX = 6 * 3600 * 0.08;
    scrollY = 0;
    xScale = 0.08;
    yScale = 10;
    trainPathWidth = 1;
    trainPathColor = "rgb(0, 0, 0)";

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): DiagramConfig {
        if (!(o && typeof o == "object")) {
            throw "Invalid JSON";
        }
        const dc = new DiagramConfig();
        Object.assign(dc, o);
        return dc;
    }
}