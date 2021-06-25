import Track from "./Track";

export default class Station {
    constructor(
        public readonly id: number, 
        public name?: string,
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
        const name = o.name ?? o.n;
        const mileage = o.mileage ?? o.m;
        const expanded = !!(o.expanded ?? o.e);
        const tracks = o.tracks ?? o.t;
        if (!(o && typeof o == "object" && o.id != null && mileage != null && Array.isArray(tracks))) {
            throw "Invalid JSON @ Station"
        }
        const station = new Station(o.id, name, mileage, expanded);
        station.tracks = (tracks as any[]).map((t: any) => Track.fromJSON(t, station));
        return station;
    }

    toJSON(): unknown {
        return {
            id: this.id,
            n: this.name,
            m: this.mileage,
            t: this.tracks,
            e: this.expanded,
        };
    }
}
