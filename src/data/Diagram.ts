import Vue from "vue";
import DiagramConfig from "./DiagramConfig";
import Station from "./Station";
import Train from "./Train";

export default class Diagram {
    constructor(
        public config: DiagramConfig,
        public stations: { [id: number]: Station },
        public trains: { [id: number]: Train },
    ) {}
    maxId = 0;
    maxRelY = 0;
    
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): Diagram {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && typeof o.stations == "object" && typeof o.trains == "object")) {
            throw "Invalid JSON";
        }
        const config = DiagramConfig.fromJSON(o.config || {});
        const stations: { [id: number]: Station } = Object.fromEntries(Object.values(o.stations).map((s: any) => [ s.id, Station.fromJSON(s) ]));
        const trains: { [id: number]: Train } = Object.fromEntries(Object.values(o.trains).map((t: any) => [ t.id, Train.fromJSON(t, stations) ]));
        const diagram = new Diagram(config, stations, trains);

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
        diagram.maxId = maxId;

        diagram.updateY();

        return diagram;
    }

    getStationsInMileageOrder(): Station[] {
        return Object.values(this.stations).sort((a, b) => a.mileage - b.mileage);
    }

    genId(): number {
        return ++this.maxId;
    }
    releaseId(id: number): void {
        if (id == this.maxId) --this.maxId;
    }

    addNewStation(station: Station): Station {
        return Vue.set(this.stations, station.id, station);
    }
    removeStation(station: Station): void {
        Vue.delete(this.stations, station.id);
    }
    addNewTrain(train: Train): Train {
        return Vue.set(this.trains, train.id, train);
    }
    removeTrain(train: Train): void {
        Vue.delete(this.trains, train.id);
    }

    updateY(): void {
        if (Object.keys(this.stations).length == 0) {
            this.maxRelY = 0;
            return;
        }

        const stations = this.getStationsInMileageOrder();
    
        const initialMileage = stations[0].mileage;
        for (const s of stations) {
          s.mileage = s.mileage - initialMileage;
        }
    
        let y = this.config.plotPanePadding;
        let lastMileage = 0;
        for (const s of stations) {
          y += (s.mileage - lastMileage) * this.config.yScale;
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
    
        this.maxRelY = stations[stations.length - 1].bottomRelY + this.config.plotPanePadding;
      }
    
    toJSON(): unknown {
        return {
            config: this.config,
            stations: this.stations,
            trains: this.trains,
        };
    }
}