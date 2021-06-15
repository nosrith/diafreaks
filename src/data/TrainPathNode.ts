import StopEvent from "./StopEvent";

export default interface TrainPathNode {
    readonly stev: StopEvent;
    readonly phase: "arr" | "track" | "dep";
    readonly time: number;
    readonly relY: number;
}