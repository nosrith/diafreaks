import StopEvent from "./StopEvent";

export default interface TrainPathNode {
    stev: StopEvent;
    phase: "arr" | "track" | "dep";
    time: number;
    relY: number;
}