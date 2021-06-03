import DiagramConfig from "./DiagramConfig";
import Station from "./Station";
import Train from "./Train";

export default class Diagram {
    constructor(
        public config: DiagramConfig,
        public stations: { [id: number]: Station },
        public trains: { [id: number]: Train },
        public maxId: number,
    ) {}
    
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): Diagram {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && Array.isArray(o.stations) && Array.isArray(o.trains))) {
            throw "Invalid JSON";
        }
        return new Diagram(
            DiagramConfig.fromJSON(o.config || {}),
            Object.fromEntries(o.stations.map((s: any) => [ s.id, Station.fromJSON(s) ])),
            Object.fromEntries(o.trains.map((t: any) => [ t.id, Train.fromJSON(t) ])),
            o.maxId || 0,
        );
    }

    getYByRelY(relY: number) {
        return relY + this.config.topPaneHeight - this.config.scrollY;
    }
    getRelYByY(y: number) {
        return y - this.config.topPaneHeight + this.config.scrollY;
    }
    getXByTime(time: number) {
        return time * this.config.xScale + this.config.leftPaneWidth - this.config.scrollX;
    }
    getTimeByX(x: number) {
        return (x - this.config.leftPaneWidth + this.config.scrollX) / this.config.xScale;
    }

    getStationsInMileageOrder(): Station[] {
        return Object.values(this.stations).sort((a, b) => a.mileage - b.mileage);
    }

    getTrainPathDirection(trainId: number, stopId: number, side: "arr" | "dep"): number {
        const train = this.trains[trainId];
        if (!train) return 0;

        const stop = train.stops.find(s => s.id == stopId);
        if (!stop) return 0;

        const sta = this.stations[stop.stationId];
        if (!sta) return 0;

        const nextSE = side == "arr" ? train.getPreviousStopEvent(stopId, "arr") : train.getNextStopEvent(stopId, "dep");
        if (nextSE) {
            const nextSta = this.stations[nextSE.stop.stationId];
            if (!nextSta) return 0;
            return Math.sign(nextSta.mileage - sta.mileage);
        }

        const revNextSE = side == "arr" ? train.getNextStopEvent(stopId, "dep") : train.getPreviousStopEvent(stopId, "arr");
        if (revNextSE) {
            const revNextSta = this.stations[revNextSE.stop.stationId];
            if (!revNextSta) return 0;
            return Math.sign(sta.mileage - revNextSta.mileage);
        }

        return 0;
    }

    genId(): number {
        return ++this.maxId;
    }
}