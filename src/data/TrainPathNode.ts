import StopEvent from "./StopEvent";
import Train from "./Train";

export default interface TrainPathNode {
    train: Train;
    stev: StopEvent;
    vSide: "top" | "bottom" | "track";
    time: number;
    x: number;
    y: number;
    selected: boolean;
}