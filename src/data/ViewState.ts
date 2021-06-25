import Station from "./Station";
import StopEvent, { StopEventRange } from "./StopEvent";
import Track from "./Track";
import Train from "./Train";
import TrainSelection from "./TrainSelection";

export default class ViewState {
    editMode = true;
    viewWidth = 0;
    viewHeight = 0;
    trainSelections: { [trainId: number]: TrainSelection } = {};
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
        targets: { [trainId: number]: TrainSelection },
        timeShift: number 
    } | null = null;
    stationNameInputTarget: Station | null = null;
    trackNameInputTarget: Track | null = null;
    trainInfoEditorTarget: {
        train: Train,
        x: number,
        y: number,
        verticalAlign: "top" | "bottom"
    } | null = null;
    controlKeyPressed = false;

    get busy(): boolean {
        return this.drawingState != null || 
            this.trainPathDragState != null ||
            this.inputEnabled;
    }

    get inputEnabled(): boolean {
        return this.stationNameInputTarget != null || 
            this.trackNameInputTarget != null ||
            this.trainInfoEditorTarget != null;
    }
}
