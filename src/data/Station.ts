import Track from "./Track";

export default class Station {
    constructor(
        public readonly id: number, 
        public name = "",
        public mileage = 0,
        public expanded = false,
        public topRelY = 0,
        public bottomRelY = 0,
    ) {}
    tracks: Track[] = [ new Track(this, 1) ];

    addNewTrack(track?: Track, index: number = this.tracks.length): Track {
        if (!track) {
            const id = Math.max(0, ...this.tracks.map(t => t.id)) + 1;
            track = new Track(this, id);
        }
        this.tracks.splice(index, 0, track);
        return this.tracks[index];
    }

    removeTrack(t: Track): void {
        const index = this.tracks.indexOf(t);
        if (index >= 0) this.tracks.splice(index, 1);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): Station {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.id != null && o.name != null && o.mileage != null && Array.isArray(o.tracks))) {
            throw "Invalid JSON @ Station"
        }
        const station = new Station(o.id, o.name, o.mileage, !!o.expanded);
        station.tracks = (o.tracks as any[]).map((t: any) => Track.fromJSON(t, station));
        return station;
    }

    toJSON(): unknown {
        return {
            id: this.id,
            name: this.name,
            mileage: this.mileage,
            tracks: this.tracks,
            expanded: this.expanded,
        };
    }
}
