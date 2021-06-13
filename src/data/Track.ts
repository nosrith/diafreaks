import Station from "./Station";

export default class Track {
    constructor(
        public readonly station: Station,
        public readonly id: number, 
        public name: string,
        public relY = 0,
    ) {}

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any, station: Station): Track {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.id != null)) {
            throw "Invalid JSON @ Track";
        }
        return new Track(station, o.id, o.name, o.relY);
    }

    toJSON(): unknown {
        return {
            id: this.id,
            name: this.name,
        };
    }
}