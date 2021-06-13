import Station from "./Station";
import Track from "./Track";
import Train from "./Train";

export interface StopEventRange {
    from: StopEvent;
    to: StopEvent;
}

export default class StopEvent {
    constructor(
        public stationId: number,
        public trackId: number,
        public time: number
    ) {}

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): StopEvent[] {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.id != null && o.stationId != null && o.trackId != null && o.arrTime != null && o.depTime != null)) {
            throw "Invalid JSON @ Stop";
        }
        return o.arrTime == o.depTime ?
            [ new StopEvent(o.stationId, o.trackId, o.arrTime) ] :
            [ new StopEvent(o.stationId, o.trackId, o.arrTime), new StopEvent(o.stationId, o.trackId, o.depTime) ];
    }
}

export interface StopEventRange {
    from: StopEvent;
    to: StopEvent;
}
