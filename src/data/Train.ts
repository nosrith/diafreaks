import Station from "./Station";
import StopEvent, { StopEventRange } from "./StopEvent";

export default class Train {
    constructor(
        public readonly id: number, 
        public name: string,
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

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any, stations: { [id: number]: Station }): Train {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.id != null && o.name != null && Array.isArray(o.stops))) {
            throw "Invalid JSON @ Train";
        }
        const train = new Train(o.id, o.name);
        (o.stops as any[]).flatMap((s: any) => StopEvent.fromJSONStop(s, train, stations))
            .forEach(stev => train.stevs.push(stev));
        return train;
    }

    toJSON(): unknown {
        const stops: { stationId: number, trackId: number, arrTime: number, depTime: number }[] = [];
        for (const stev of this.stevs) {
            const lastStop = stops[stops.length - 1];
            if (lastStop && lastStop.trackId == stev.track.id && lastStop.arrTime == lastStop.depTime) {
                lastStop.depTime = stev.time;
            } else {
                stops.push({ 
                    stationId: stev.station.id, 
                    trackId: stev.track.id, 
                    arrTime: stev.time, 
                    depTime: stev.time 
                });
            }
        }
        return {
            id: this.id,
            name: this.name,
            stops: stops
        };
    }
}
