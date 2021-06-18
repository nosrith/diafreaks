import HistoryManager from "@/HistoryManager";
import Diagram from "./Diagram";
import ViewConfig from "./ViewConfig";
import ViewState from "./ViewState";

export default class DiagramViewContext {
    config: ViewConfig = new ViewConfig();
    state: ViewState = new ViewState();
    diagram: Diagram = Diagram.fromJSON({ stations: [], trains: [] });
    history = new HistoryManager(100);

    getYByRelY(relY: number): number {
        return relY + this.config.plotPanePadding + this.config.topPaneHeight - this.diagram.config.scrollY;
    }    
    getRelYByY(y: number): number {
        return y - this.config.plotPanePadding - this.config.topPaneHeight + this.diagram.config.scrollY;
    }
    getXByTime(time: number): number {
        return time * this.diagram.config.xScale + this.diagram.config.leftPaneWidth - this.diagram.config.scrollX;
    }
    getTimeByX(x: number): number {
        return (x - this.diagram.config.leftPaneWidth + this.diagram.config.scrollX) / this.diagram.config.xScale;
    }
}
