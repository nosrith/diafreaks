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

        diagram.updateY();

        return diagram;
    }

    getStationsInMileageOrder(): Station[] {
        return Object.values(this.stations).sort((a, b) => a.mileage - b.mileage);
    }

    addNewStation(station?: Station): Station {
        if (!station) {
            const id = Math.max(0, ...Object.values(this.stations).map(s => s.id)) + 1;
            station = new Station(id);
        }
        return Vue.set(this.stations, station.id, station);
    }
    removeStation(station: Station): void {
        Vue.delete(this.stations, station.id);
    }
    addNewTrain(train?: Train): Train {
        if (!train) {
            const id = Math.max(0, ...Object.values(this.trains).map(t => t.id)) + 1;
            train = new Train(id);
        }
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
    
        let y = 0;
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
    
        this.maxRelY = stations[stations.length - 1].bottomRelY;
      }
    
    toJSON(): unknown {
        return {
            config: this.config,
            stations: this.stations,
            trains: this.trains,
        };
    }
}