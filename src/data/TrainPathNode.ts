import StopEvent from "./StopEvent";

export default interface TrainPathNode {
    stev: StopEvent;
    line: "station" | "track";
    time: number;
    relY: number;
}