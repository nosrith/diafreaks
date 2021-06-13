import Station from "./Station";
import StopEvent, { StopEventRange } from "./StopEvent";
import Track from "./Track";
import Train from "./Train";

export interface TrainSelectionState {
    trainId: number;
    stevRange: StopEventRange | null;
}

export default class ViewState {
    viewWidth = 0;
    viewHeight = 0;
    trainSelections: { [trainId: number]: TrainSelectionState } = {};
    pointerScreenX = 0;
    pointerTime = 0;
    pointerY = 0;
    pointerTargetTrainPath: { train: Train, stevRange: StopEventRange } | null = null;
    pointerTargetLine: { station: Station, track: Track | null, relY: number } | null = null;
    pointerPreciseState: { sx0: number, t0: number } | null = null;
    drawingState: {
        train: Train,
        lastStev: StopEvent,
        direction: number,
        stableEnd: StopEvent | null,
        floating: StopEvent | null
    } | null = null;
    trainPathDragState: { 
        dragging: boolean,
        targets: { [trainId: number]: TrainSelectionState },
        timeShift: number 
    } | null = null;
    stationNameInputTarget: { stationId: number } | null = null;
    trackNameInputTarget: { stationId: number, trackId: number } | null = null;
    controlKeyPressed = false;

    get isInputEnabled(): boolean {
        return this.stationNameInputTarget != null || this.trackNameInputTarget != null;
    }
}
