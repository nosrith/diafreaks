import Stop from "./Stop";
import Train from "./Train";

export default interface TrainPathNode {
    train: Train;
    stop: Stop;
    side: "arr" | "dep";
    vSide: "top" | "bottom" | "track";
    time: number;
    x: number;
    y: number;
    selected: boolean;
}