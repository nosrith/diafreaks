import Station from "./Station";
import StopEvent, { StopEventRange } from "./StopEvent";
import TrainPathNode from "./TrainPathNode";

export default class Train {
    constructor(
        public readonly id: number, 
        public name: string = "",
        public color: string | null = null,
        public lineWidth: number | null = null,
    ) {}
    stevs: StopEvent[] = [];

    addNewStopEvent(stev: StopEvent, index: number = this.stevs.length): StopEvent {
        this.stevs.splice(index, 0, stev);
        return this.stevs[index];
    }

    removeStopEvent(stev: StopEvent): void {
        const index = this.stevs.indexOf(stev);
        if (index >= 0) this.stevs.splice(index, 1);
    }

    getStopEventsInRange(stevRange: StopEventRange): StopEvent[] {
        const result = [];
        let inRange = false;
        for (const stev of this.stevs) {
            if (stev == stevRange.from) inRange = true;
            if (inRange) result.push(stev);
            if (stev == stevRange.to) inRange = false;
        }
        return result;
    }

    getTrainPathNodes(): TrainPathNode[] {
        const nodes: TrainPathNode[] = [];
        for (const stev of this.stevs) {
          if (stev.station.expanded && stev.prev && stev.prev.station != stev.station) {
            nodes.push({ 
              stev, 
              phase: "arr",
              time: stev.time, 
              relY: stev.prev.station.mileage < stev.station.mileage ? stev.station.topRelY : stev.station.bottomRelY
            });
          }
          nodes.push({
            stev,
            phase: "track",
            time: stev.time,
            relY: stev.track.relY
          });
          if (stev.station.expanded && stev.next && stev.next.station != stev.station) {
            nodes.push({ 
              stev, 
              phase: "dep",
              time: stev.time, 
              relY: stev.next.station.mileage < stev.station.mileage ? stev.station.topRelY : stev.station.bottomRelY
            });
          }
        }
        return nodes;
      }
    
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any, stations: { [id: number]: Station }): Train {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const name = o.name ?? o.n ?? "";
        const color = o.color ?? o.c;
        const lineWidth = o.lineWidth ?? o.w;
        const stops = o.stops ?? o.s;
        if (!(o && typeof o == "object" && o.id != null && Array.isArray(stops))) {
            throw "Invalid JSON @ Train";
        }
        const train = new Train(o.id, name, color, lineWidth);
        (stops as any[]).flatMap((s: any) => StopEvent.fromJSONStop(s, train, stations))
            .forEach(stev => train.stevs.push(stev));
        return train;
    }

    toJSON(): unknown {
        const stops: { s: number, t: number, a: number, d: number }[] = [];
        for (const stev of this.stevs) {
            const lastStop = stops[stops.length - 1];
            if (lastStop && lastStop.t == stev.track.id && lastStop.a == lastStop.d) {
                lastStop.d = stev.time;
            } else {
                stops.push({ 
                    s: stev.station.id, 
                    t: stev.track.id, 
                    a: stev.time, 
                    d: stev.time 
                });
            }
        }
        return {
            id: this.id,
            n: this.name || undefined,
            c: this.color ?? undefined,
            w: this.lineWidth ?? undefined,
            s: stops
        };
    }
}
