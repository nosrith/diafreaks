import Station from "./Station";
import Track from "./Track";
import Train from "./Train";

export default class StopEvent {
    static maxPrivateId = 0;

    constructor(
        public readonly train: Train,
        public track: Track,
        public time: number
    ) {}
    readonly privateId: number = ++StopEvent.maxPrivateId;

    get station(): Station {
        return this.track.station;
    }
    get next(): StopEvent | undefined {
        const index = this.train.stevs.indexOf(this);
        return index >= 0 ? this.train.stevs[index + 1] : undefined;
    }
    get prev(): StopEvent | undefined {
        const index = this.train.stevs.indexOf(this);
        return index >= 0 ? this.train.stevs[index - 1] : undefined;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSONStop(o: any, train: Train, stations: { [id: number]: Station }): StopEvent[] {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const stationId = o.stationId ?? o.s;
        const trackId = o.trackId ?? o.t;
        const arrTime = o.arrTime ?? o.a;
        const depTime = o.depTime ?? o.d;
        if (!(o && typeof o == "object" && stationId != null && trackId != null && arrTime != null && depTime != null)) {
            throw "Invalid JSON @ Stop";
        }
        const station = stations[stationId];
        const track = station && station.tracks.find(t => t.id == trackId);
        if (!(station && track)) {
            throw "Invalid data @ Stop";
        }
        return arrTime == depTime ?
            [ new StopEvent(train, track, arrTime) ] :
            [ new StopEvent(train, track, arrTime), new StopEvent(train, track, depTime) ];
    }
}

export interface StopEventRange {
    from: StopEvent;
    to: StopEvent;
}
