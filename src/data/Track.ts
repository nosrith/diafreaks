export default class Track {
    constructor(
        public id: number, 
        public name: string,
        public relY: number = 0,
    ) {}

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): Track {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.id != null && o.name != null)) {
            throw "Invalid JSON @ Track";
        }
        return new Track(o.id, o.name);
    }

    toJSON(): unknown {
        return {
            id: this.id,
            name: this.name,
        };
    }
}