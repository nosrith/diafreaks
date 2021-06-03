export default class Stop {
    constructor(
        public id: number,
        public stationId: number,
        public trackId: number,
        public arrTime: number,
        public depTime: number,
    ) {}

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): Stop {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.stationId != null && o.trackId != null && (o.arrTime != null || o.depTime != null))) {
            throw "Invalid JSON @ Stop";
        }
        return new Stop(
            o.id,
            o.stationId,
            o.trackId,
            o.arrTime != null ? o.arrTime : o.depTime,
            o.depTime != null ? o.depTime : o.arrTime
        );
    }
}