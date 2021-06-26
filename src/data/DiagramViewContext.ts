import HistoryManager from "@/HistoryManager";
import Diagram from "./Diagram";
import ViewConfig from "./ViewConfig";
import ViewState from "./ViewState";

export default class DiagramViewContext {
    config: ViewConfig = new ViewConfig();
    state: ViewState = new ViewState();
    diagram: Diagram = Diagram.fromJSON({ stations: [], trains: [] });
    history = new HistoryManager(100);

    maxRelY = 0;

    get xPhysScale(): number { 
        return this.state.gScale * this.diagram.config.xScale; 
    }
    get yPhysScale(): number { 
        return this.state.gScale * this.diagram.config.yScale;
    }
    get subScale(): number { 
        return Math.sqrt(this.state.gScale); 
    }

    getYByRelY(relY: number): number {
        return (relY - this.diagram.config.scrollRelY) + this.config.plotPanePadding + this.config.topPaneHeight * this.subScale;
    }    
    getRelYByY(y: number): number {
        return y - this.config.plotPanePadding - this.config.topPaneHeight * this.subScale + this.diagram.config.scrollRelY;
    }
    getXByTime(time: number): number {
        return (time - this.diagram.config.scrollTime) * this.xPhysScale + this.diagram.config.leftPaneWidth * this.subScale;
    }
    getTimeByX(x: number): number {
        return (x - this.diagram.config.leftPaneWidth * this.subScale) / this.xPhysScale + this.diagram.config.scrollTime;
    }

    updateY(): void {
        if (Object.keys(this.diagram.stations).length == 0) {
            this.maxRelY = 0;
            return;
        }

        const stations = this.diagram.getStationsInMileageOrder();
    
        const initialMileage = stations[0].mileage;
        for (const s of stations) {
          s.mileage = s.mileage - initialMileage;
        }
    
        let y = 0;
        let lastMileage = 0;
        for (const s of stations) {
          y += (s.mileage - lastMileage) * this.yPhysScale;
          s.topRelY = y;
          if (s.expanded) {
            s.tracks.forEach((t, i) => {
              t.relY = y + (i + 1) * this.config.trackLineSpan * this.subScale;
            });
            s.bottomRelY = y + (s.tracks.length + 1) * this.config.trackLineSpan * this.subScale;
            y += (s.tracks.length + 1) * this.config.trackLineSpan * this.subScale;
          } else {
            Object.values(s.tracks).forEach(t => t.relY = y);
            s.bottomRelY = y;
          }
          lastMileage = s.mileage;
        }
    
        this.maxRelY = stations[stations.length - 1].bottomRelY;
    }

    truncateScrollPosition(): void {
        this.diagram.config.scrollTime = 
          Math.max(this.diagram.config.minPlotTime - this.config.plotPanePadding / this.xPhysScale, 
            Math.min(this.diagram.config.maxPlotTime - (this.state.viewWidth - this.diagram.config.leftPaneWidth * this.subScale - this.config.plotPanePadding) / this.xPhysScale,
                this.diagram.config.scrollTime));
        this.diagram.config.scrollRelY = 
          Math.max(0, 
            Math.min(this.maxRelY - (this.state.viewHeight - this.config.plotPanePadding - (this.config.topPaneHeight + this.config.trackLineSpan) * this.subScale), 
                this.diagram.config.scrollRelY));
    }
}
