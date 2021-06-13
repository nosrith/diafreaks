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
        if (!(o && typeof o == "object" && typeof o.stations == "object" && typeof o.trains == "object")) {
            throw "Invalid JSON";
        }
        const config = DiagramConfig.fromJSON(o.config || {});
        const stations: { [id: number]: Station } = Object.fromEntries(Object.values(o.stations).map((s: any) => [ s.id, Station.fromJSON(s) ]));
        const trains: { [id: number]: Train } = Object.fromEntries(Object.values(o.trains).map((t: any) => [ t.id, Train.fromJSON(t) ]));

        let maxId = o.maxId ? Math.max(o.maxId, 0) : 0;
        for (const s of Object.values(stations)) {
            maxId = Math.max(s.id, maxId);
            for (const t of s.tracks) {
                maxId = Math.max(t.id, maxId);
            }
        }
        for (const t of Object.values(trains)) {
            maxId = Math.max(t.id, maxId);
        }

        return new Diagram(config, stations, trains, maxId);
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

    genId(): number {
        return ++this.maxId;
    }

    releaseId(id: number) {
        if (id == this.maxId) --this.maxId;
    }

    toJSON(): unknown {
        return {
            config: this.config,
            stations: this.stations,
            trains: this.trains,
        };
    }
}