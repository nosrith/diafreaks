import Stop from "./Stop";

export interface TrainStopRange {
    fromStopId: number;
    fromStopSide: "arr" | "dep";
    toStopId: number;
    toStopSide: "arr" | "dep";
}

export interface TrainStopEvent {
    stop: Stop;
    side: "arr" | "dep";
    time: number;
}

export default class Train {
    constructor(
        public id: number, 
        public name: string,
        public stops: Stop[] = [],
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
            o.stops.map((s: any) => Stop.fromJSON(s)),
        )
    }

    getStopEvent(stopId: number, side: "arr" | "dep"): TrainStopEvent | undefined {
        const stop = this.stops.find(s => s.id == stopId);
        return stop ?
            {
                stop: stop,
                side: side,
                time: side == "arr" ? stop.arrTime : stop.depTime
            } :
            undefined;
    }

    getStopEvents(stopRange: TrainStopRange | null = null): TrainStopEvent[] {
        const result: TrainStopEvent[] = [];
        let inRange = stopRange === null;
        for (const stop of this.stops) {
            if (stopRange && stopRange.fromStopId == stop.id && stopRange.fromStopSide == "arr") {
                inRange = true;
            }
            if (inRange) {
                result.push({ stop: stop, side: "arr", time: stop.arrTime });
            }
            if (stopRange && stopRange.toStopId == stop.id && stopRange.toStopSide == "arr") {
                inRange = false;
            }
            if (stopRange && stopRange.fromStopId == stop.id && stopRange.fromStopSide == "dep") {
                inRange = true;
            }
            if (inRange) {
                result.push({ stop: stop, side: "dep", time: stop.depTime });
            }
            if (stopRange && stopRange.toStopId == stop.id && stopRange.toStopSide == "dep") {
                inRange = false;
            }
        }
        return result;
    }

    getPreviousStopEvent(stopId: number, side: "arr" | "dep"): TrainStopEvent | undefined {
        const stop = this.stops.find(s => s.id == stopId);
        if (!stop) {
            return;
        } else if (side == "dep") {
            return { stop: stop, side: "arr", time: stop.arrTime };
        } else {
            const stopIndex = this.stops.indexOf(stop);
            if (stopIndex == 0) {
                return;
            } else {
                const prevStop = this.stops[stopIndex - 1];
                return { stop: prevStop, side: "dep", time: prevStop.depTime };
            }
        }
    }

    getNextStopEvent(stopId: number, side: "arr" | "dep"): TrainStopEvent | undefined {
        const stop = this.stops.find(s => s.id == stopId);
        if (!stop) {
            return;
        } else if (side == "arr") {
            return { stop: stop, side: "dep", time: stop.depTime };
        } else {
            const stopIndex = this.stops.indexOf(stop);
            if (stopIndex == this.stops.length - 1) {
                return;
            } else {
                const nextStop = this.stops[stopIndex + 1];
                return { stop: nextStop, side: "arr", time: nextStop.arrTime };
            }
        }
    }
}
