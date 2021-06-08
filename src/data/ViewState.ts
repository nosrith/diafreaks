import Station from "./Station";
import { TrainStopRange } from "./Train";
import Track from "./Track";

export interface TrainSelectionState {
    trainId: number;
    stopRange: TrainStopRange | null;
}

export default class ViewState {
    viewWidth = 0;
    viewHeight = 0;
    maxRelY = 0;
    trainSelections: { [trainId: number]: TrainSelectionState } = {};
    pointerDragging = false;
    pointerOnMarker = false;
    pointerScreenX = 0;
    pointerTime = 0;
    pointerY = 0;
    pointerTargetLine: { station: Station, track: "top" | "bottom" | Track } | null = null;
    pointerPreciseState: { sx0: number, t0: number } | null = null;
    editMode = true;
    drawingState: { trainId: number, lastStopId: number, direction: number } | null = null;
    trainPathDragState: { timeShift: number } | null = null;
    stationNameInputTarget: { stationId: number } | null = null;
    trackNameInputTarget: { stationId: number, trackId: number } | null = null;
    controlKeyPressed = false;
    diagramFileName = "";
    helpPaneEnabled = false;

    get isInputEnabled(): boolean {
        return this.stationNameInputTarget != null || this.trackNameInputTarget != null;
    }
}
