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

    getYByRelY(relY: number): number {
        return relY + this.config.plotPanePadding + this.config.topPaneHeight - this.diagram.config.scrollY;
    }    
    getRelYByY(y: number): number {
        return y - this.config.plotPanePadding - this.config.topPaneHeight + this.diagram.config.scrollY;
    }
    getXByTime(time: number): number {
        return time * this.diagram.config.xPhysScale + this.diagram.config.leftPaneWidth - this.diagram.config.scrollX;
    }
    getTimeByX(x: number): number {
        return (x - this.diagram.config.leftPaneWidth + this.diagram.config.scrollX) / this.diagram.config.xPhysScale;
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
          y += (s.mileage - lastMileage) * this.diagram.config.yPhysScale;
          s.topRelY = y;
          if (s.expanded) {
            s.tracks.forEach((t, i) => {
              t.relY = y + (i + 1) * this.config.trackLineSpan;
            });
            s.bottomRelY = y + (s.tracks.length + 1) * this.config.trackLineSpan;
            y += (s.tracks.length + 1) * this.config.trackLineSpan;
          } else {
            Object.values(s.tracks).forEach(t => t.relY = y);
            s.bottomRelY = y;
          }
          lastMileage = s.mileage;
        }
    
        this.maxRelY = stations[stations.length - 1].bottomRelY;
    }
}
