import Track from "./Track";

export default class Station {
    constructor(
        public id: number, 
        public name: string,
        public mileage: number = 0,
        public tracks: Track[] = [],
        public expanded: boolean = false,
        public topRelY: number = 0,
        public bottomRelY: number = 0,
        public floating: number = 0,
    ) {}

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): Station {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.id != null && o.name != null && o.mileage != null && Array.isArray(o.tracks))) {
            throw "Invalid JSON @ Station"
        }
        return new Station(
            o.id,
            o.name,
            o.mileage,
            o.tracks.map((t: any) => Track.fromJSON(t)),
            o.expanded,
        )
    }
}
