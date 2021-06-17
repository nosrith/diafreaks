import { StopEventRange } from "./StopEvent";
import Train from "./Train";

export default interface TrainSelection {
    readonly train: Train;
    stevRange: StopEventRange | null;
}
