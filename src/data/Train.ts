import StopEvent, { StopEventRange } from "./StopEvent";

export default class Train {
    constructor(
        public id: number, 
        public name: string,
        public stevs: StopEvent[] = [],
    ) {}

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    static fromJSON(o: any): Train {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (!(o && typeof o == "object" && o.id != null && o.name != null && Array.isArray(o.stops))) {
            throw "Invalid JSON @ Train";
        }
        return new Train(
            o.id,
            o.name,
            o.stops.flatMap((s: any) => StopEvent.fromJSON(s)),
        )
    }

    getPreviousStopEvent(stev: StopEvent): StopEvent | undefined {
        const index = this.stevs.indexOf(stev);
        return index > 0 ? this.stevs[index - 1] : undefined;
    }

    getNextStopEvent(stev: StopEvent): StopEvent | undefined {
        const index = this.stevs.indexOf(stev);
        return index < this.stevs.length - 1 ? this.stevs[index + 1] : undefined;
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
}
