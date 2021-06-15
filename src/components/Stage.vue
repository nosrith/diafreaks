<template>
  <v-stage v-if="diagram" :config="stageConfig" 
    @mousedown="onStageMouseDown" 
    @mousemove="onStageMouseMove" 
    @click="onStageClick" 
    @dblclick="onStageDoubleClick" 
    @wheel="onStageMouseWheel"
    @contextmenu="onContextMenu">
    <back-layer v-on="$listeners"></back-layer>
    <train-path-layer></train-path-layer>
    <v-layer>
      <pointer></pointer>
    </v-layer>
  </v-stage>
</template>

<script lang="ts">
import { Component, Inject, InjectReactive, Vue } from "vue-property-decorator";
import { KonvaEventObject } from "konva/types/Node";
import Hammer from "hammerjs";
import HistoryManager from "@/HistoryManager";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import StopEvent from "@/data/StopEvent";
import Track from "@/data/Track";
import Train from "@/data/Train";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";
import BackLayer from "./BackLayer.vue";
import Pointer from "./Pointer.vue";
import TrainPathLayer from "./TrainPathLayer.vue";

@Component({
  components: {
    BackLayer, Pointer, TrainPathLayer
  },
})
export default class Stage extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Inject() historyManager!: HistoryManager;

  $el!: HTMLElement;

  stageDragState: { scrollX0: number, scrollY0: number, x0: number, y0: number, dragging: boolean } | null = null;
  pinchState: { lastScale: number } | null = null;

  get stageConfig(): unknown {
    return {
      width: this.viewState.viewWidth,
      height: this.viewState.viewHeight
    };
  }

  get stationsInMileageOrder(): Station[] {
    return this.diagram.getStationsInMileageOrder();
  }

  mounted(): void {
    window.addEventListener("mousemove", this.onWindowMouseMove);
    window.addEventListener("mouseup", this.onWindowMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);

    const hammer = new Hammer(this.$el);
    hammer.get("pan").set({ direction: Hammer.DIRECTION_ALL });
    hammer.get("pinch").set({ enable: true });
    hammer.on("panstart", this.onPanStart);
    hammer.on("panmove", this.onPanMove);
    hammer.on("panend", this.onPanEnd);
    hammer.on("pinchstart", this.onPinchStart);
    hammer.on("pinchmove", this.onPinchMove);
    hammer.on("pinchend", this.onPinchEnd);
  }

  unmounted(): void {
    window.removeEventListener("mousemove", this.onWindowMouseMove);
    window.removeEventListener("mouseup", this.onWindowMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
  }

  onStageMouseMove(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const event = konvaEvent.evt;

    // Update pointer state
    this.viewState.pointerScreenX = event.screenX;
    if (this.viewState.pointerPreciseState) {
      const dUnit = Math.round((event.screenX - this.viewState.pointerPreciseState.sx0) / this.viewConfig.pointerPrecisePixelPerTimeUnit);
      this.viewState.pointerTime = dUnit * this.diagram.config.minimumTimeUnit + this.viewState.pointerPreciseState.t0;
    } else if (!this.viewState.trainPathDragState?.dragging) {
      this.viewState.pointerTime = Math.round(this.diagram.getTimeByX(event.clientX) / 60) * 60;
      if (event.clientX >= this.diagram.config.leftPaneWidth) {
        const pointerTargetLine = this.findPointerTargetLine(event.clientY);
        if (pointerTargetLine) {
          this.viewState.pointerTargetLine = pointerTargetLine ?? null;
          this.viewState.pointerY = this.diagram.getYByRelY(pointerTargetLine.relY);
        } else {
          this.viewState.pointerTargetLine = null;
        }
      } else {
        this.viewState.pointerTargetLine = null;
      }
    }
    if (konvaEvent.target == konvaEvent.currentTarget) {
      this.viewState.pointerTargetTrainPath = null;
    }

    // Update drawing floating
    const drawingState = this.viewState.drawingState;
    if (drawingState) {
      if (drawingState.direction > 0) {
        this.viewState.pointerTime = Math.max(this.viewState.pointerTime, drawingState.lastStev.time);
      } else if (drawingState.direction < 0) {
        this.viewState.pointerTime = Math.min(this.viewState.pointerTime, drawingState.lastStev.time);
      }

      if (drawingState.floating) {
        drawingState.train.stevs.splice(drawingState.train.stevs.indexOf(drawingState.floating), 1);
        drawingState.floating = null;
      }

      const pointerTargetLine = event.clientX >= this.diagram.config.leftPaneWidth ?
        this.findPointerTargetLine(event.clientY) : undefined;
      if (pointerTargetLine) {
        const targetTrack = pointerTargetLine.track ?? pointerTargetLine.station.tracks[0];
        const newStev = drawingState.train.addNewStopEvent(
          new StopEvent(
            drawingState.train,
            targetTrack,
            this.viewState.pointerTime
          ),
          drawingState.direction > 0 || (drawingState.direction == 0 && this.viewState.pointerTime >= drawingState.lastStev.time) ? undefined : 0
        );
        drawingState.floating = newStev;
      }
    }
  }

  findPointerTargetLine(y: number): { station: Station, track: Track | null, relY: number } | undefined {
    const stationPointedOnTop = this.stationsInMileageOrder.find(s => 
      Math.abs(this.diagram.getYByRelY(s.topRelY) - y) < Math.max(this.diagram.config.stationLineWidth * 0.5, this.viewConfig.minHitWidth));
    if (stationPointedOnTop) {
      return { station: stationPointedOnTop, track: null, relY: stationPointedOnTop.topRelY };
    }

    const stationPointedOnBottom = this.stationsInMileageOrder.find(s =>
      Math.abs(this.diagram.getYByRelY(s.bottomRelY) - y) < Math.max(this.diagram.config.stationLineWidth * 0.5, this.viewConfig.minHitWidth));
    if (stationPointedOnBottom) {
      return { station: stationPointedOnBottom, track: null, relY: stationPointedOnBottom.bottomRelY };
    }

    const station = this.stationsInMileageOrder.find(s => 
      this.diagram.getYByRelY(s.topRelY) + this.diagram.config.trackLineSpan - Math.max(this.diagram.config.trackLineWidth * 0.5, this.viewConfig.minHitWidth) < y &&
      this.diagram.getYByRelY(s.bottomRelY) - this.diagram.config.trackLineSpan + Math.max(this.diagram.config.trackLineWidth * 0.5, this.viewConfig.minHitWidth) > y
    );
    if (station) {
      const pointedTrack = station.tracks.find(t => Math.abs(this.diagram.getYByRelY(t.relY) - y) < Math.max(this.diagram.config.trackLineWidth * 0.5, this.viewConfig.minHitWidth));
      if (pointedTrack) {
        return { station, track: pointedTrack, relY: pointedTrack.relY };
      }
    }
  }

  onStageClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const drawingState = this.viewState.drawingState;
    if (drawingState) {
      if (konvaEvent.evt.button == 0 && this.viewState.pointerTargetLine) {
        if (drawingState.direction == 0) {
          drawingState.direction = Math.sign(this.viewState.pointerTime - drawingState.lastStev.time);
        }
        if (drawingState.floating){
          const triple = drawingState.floating.track == drawingState.lastStev.track && (
            drawingState.direction > 0 && drawingState.lastStev.track == drawingState.lastStev.prev?.track ||
            drawingState.direction < 0 && drawingState.lastStev.track == drawingState.lastStev.next?.track
          );
          if (triple) {
            drawingState.lastStev.time = this.viewState.pointerTime;
            drawingState.train.stevs.splice(drawingState.train.stevs.indexOf(drawingState.floating), 1);
          } else {
            drawingState.lastStev = drawingState.floating;
          }
          drawingState.floating = null;
        }
      }
      if (konvaEvent.evt.button == 2) {
        if (drawingState.lastStev == drawingState.stableEnd) {
          if (drawingState.floating) {
            drawingState.train.stevs.splice(drawingState.train.stevs.indexOf(drawingState.floating), 1);
          }
          this.viewState.drawingState = null;
        } else {
          const newLastStev = drawingState.direction > 0 ? drawingState.lastStev.prev : drawingState.lastStev.next;
          if (newLastStev) {
            drawingState.train.stevs.splice(drawingState.train.stevs.indexOf(drawingState.lastStev), 1);
            drawingState.lastStev = newLastStev;
          } else {
            this.$delete(this.diagram.trains, drawingState.train.id);
            this.viewState.drawingState = null;
          }
        }
      }
    }

    if (konvaEvent.target == konvaEvent.currentTarget && 
        !konvaEvent.evt.ctrlKey && 
        !this.stageDragState?.dragging && 
        !this.viewState.trainPathDragState?.dragging && 
        !this.viewState.drawingState) {
      this.viewState.trainSelections = {};
    }
  }

  onStageDoubleClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (konvaEvent.target == konvaEvent.currentTarget && this.viewState.drawingState) {
      const drawingState = this.viewState.drawingState;
      if (drawingState.floating) {
        drawingState.train.stevs.splice(drawingState.train.stevs.indexOf(drawingState.floating), 1);
      }
      if (drawingState.train.stevs.length <= 1) {
        this.$delete(this.diagram.trains, drawingState.train.id);
      } else {
        const stableEnd = drawingState.stableEnd;
        if (stableEnd) {
          const stableIndex = drawingState.train.stevs.indexOf(stableEnd);
          const addedStevs = drawingState.direction > 0 ? 
            drawingState.train.stevs.filter((e, i) => i > stableIndex) : drawingState.train.stevs.filter((e, i) => i < stableIndex);
          if (drawingState.direction > 0) {
            this.historyManager.push({
              this: this,
              undo: () => { drawingState.train.stevs.splice(stableIndex + 1); },
              redo: () => { addedStevs.forEach(stev => drawingState.train.stevs.push(stev)); }
            });
          } else {
            this.historyManager.push({
              this: this,
              undo: () => { drawingState.train.stevs.splice(0, stableIndex); },
              redo: () => { drawingState.train.stevs = addedStevs.concat(drawingState.train.stevs); }
            });
          }
        } else {
          this.historyManager.push({
            this: this,
            undo: () => { this.$delete(this.diagram.trains, drawingState.train.id); },
            redo: () => { this.$set(this.diagram.trains, drawingState.train.id, drawingState.train) }
          });
        }
      }
      this.viewState.drawingState = null;
      this.viewState.trainSelections = {};
    } else if (konvaEvent.target == konvaEvent.currentTarget && this.viewConfig.editMode) {
      if (konvaEvent.evt.clientX >= this.diagram.config.leftPaneWidth) {
        const targetLine = this.viewState.pointerTargetLine;
        if (targetLine && (targetLine.track || !targetLine.station.expanded)) {
          const track = targetLine.track ?? targetLine.station.tracks[0];
          const train = this.diagram.addNewTrain(new Train(this.diagram.genId(), ""));
          train.addNewStopEvent(new StopEvent(train, track, this.viewState.pointerTime));
          this.viewState.trainSelections = { [train.id]: { train: train, stevRange: null } };
          this.viewState.drawingState = {
            train: this.diagram.trains[train.id],
            lastStev: this.diagram.trains[train.id].stevs[0],
            direction: 0,
            stableEnd: null,
            floating: null
          };
        }
      } else {
        const relY = this.diagram.getRelYByY(konvaEvent.evt.clientY);
        const prevSta = this.stationsInMileageOrder.reverse().find(s => s.topRelY < relY);
        const mileage = prevSta ?
          (relY - prevSta.bottomRelY) / this.diagram.config.yScale + prevSta.mileage :
          relY / this.diagram.config.yScale;
        const station = Station.fromJSON({
          id: this.diagram.genId(),
          name: "",
          mileage,
          tracks: [ { id: this.diagram.genId(), name: "" } ],
        });
        this.$set(this.diagram.stations, station.id, station);
        this.diagram.updateY();

        this.historyManager.push({
          this: this,
          undo: () => { 
            this.$delete(this.diagram.stations, station.id);
            this.diagram.updateY();
          },
          redo: () => { 
            this.$set(this.diagram.stations, station.id, station);
            this.diagram.updateY();
          }
        });

        this.viewState.stationNameInputTarget = station;
        this.$emit("stationNameInputStart");
      }
    }
  }

  onStageMouseDown(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (konvaEvent.target == konvaEvent.currentTarget) {
      this.startDrag(konvaEvent.evt.screenX, konvaEvent.evt.screenY);
    }
  }

  onWindowMouseMove(event: MouseEvent): void {
    this.moveDrag(event.screenX, event.screenY);
  }

  onWindowMouseUp(event: MouseEvent): void {
    this.endDrag(event.screenX, event.screenY);
  }

  onPanStart(event: { pointerType: string, center: { x: number, y: number } }): void {
    if (event.pointerType != "mouse") {
      this.startDrag(event.center.x, event.center.y);
    }
  }

  onPanMove(event: { pointerType: string, center: { x: number, y: number } }): void {
    if (event.pointerType != "mouse") {
      this.moveDrag(event.center.x, event.center.y);
    }
  }

  onPanEnd(event: { pointerType: string, center: { x: number, y: number } }): void {
    if (event.pointerType != "mouse") {
      this.endDrag(event.center.x, event.center.y);
    }
  }

  startDrag(x: number, y: number): void {
    this.stageDragState = {
      scrollX0: this.diagram.config.scrollX,
      scrollY0: this.diagram.config.scrollY,
      x0: x,
      y0: y,
      dragging: false,
    };
  }

  moveDrag(x: number, y: number): void {
    if (this.stageDragState) {
      if (Math.hypot(x - this.stageDragState.x0, y - this.stageDragState.y0) > 1) {
        this.stageDragState.dragging = true;
      }
      if (this.stageDragState.dragging) {
        this.stageDragState.dragging = true;
        this.diagram.config.scrollX = this.stageDragState.scrollX0 - (x - this.stageDragState.x0);
        this.diagram.config.scrollY = 
          Math.max(0, Math.min(this.diagram.maxRelY + this.diagram.config.topPaneHeight - this.viewState.viewHeight, 
            this.stageDragState.scrollY0 - (y - this.stageDragState.y0)));
      }
    }
  }

  endDrag(x: number, y: number): void {
    if (this.stageDragState) {
      this.moveDrag(x, y);
      this.stageDragState = null;
    }
  }

  onStageMouseWheel(konvaEvent: KonvaEventObject<WheelEvent>): void {
    // const f = Math.pow(2, -konvaEvent.evt.deltaY * this.viewConfig.wheelScale * 0.001);
    const f = Math.pow(2, -Math.sign(konvaEvent.evt.deltaY) * this.viewConfig.wheelScale);
    this.diagram.config.scrollX += (f - 1) * (konvaEvent.evt.clientX - this.diagram.config.leftPaneWidth + this.diagram.config.scrollX);
    this.diagram.config.scrollY = 
      Math.max(0, Math.min(this.diagram.maxRelY + this.diagram.config.topPaneHeight - this.viewState.viewHeight,
      this.diagram.config.scrollY + (f - 1) * (konvaEvent.evt.clientY - this.diagram.config.topPaneHeight + this.diagram.config.scrollY)));
    this.diagram.config.xScale *= f;
    this.diagram.config.yScale *= f;
    this.diagram.updateY();
    konvaEvent.evt.preventDefault();
  }

  onPinchStart(event: { scale: number }): void {
    this.pinchState = { lastScale: event.scale };
  }

  onPinchMove(event: { center: { x: number, y: number }, scale: number }): void {
    if (this.pinchState) {
      this.diagram.config.scrollX += (event.scale / this.pinchState.lastScale - 1) * (event.center.x - this.diagram.config.leftPaneWidth + this.diagram.config.scrollX);
      this.diagram.config.scrollY = 
        Math.max(0, Math.min(this.diagram.maxRelY + this.diagram.config.topPaneHeight - this.viewState.viewHeight,
        this.diagram.config.scrollY + (event.scale / this.pinchState.lastScale - 1) * (event.center.y - this.diagram.config.topPaneHeight + this.diagram.config.scrollY)));
      this.diagram.config.xScale *= event.scale / this.pinchState.lastScale;
      this.diagram.config.yScale *= event.scale / this.pinchState.lastScale;
      this.pinchState.lastScale = event.scale;
      this.diagram.updateY();
    }
  }

  onPinchEnd(event: { center: { x: number, y: number }, scale: number }): void {
    if (this.pinchState) {
      this.onPinchMove(event);
      this.pinchState = null;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!event.repeat) {
      if (event.key == "Shift") {
        this.viewState.pointerPreciseState = {
          sx0: this.viewState.pointerScreenX,
          t0: this.viewState.pointerTime
        };
      }
      if (event.key == "Control") {
        this.viewState.controlKeyPressed = true;
      }
      if (event.key == "Delete" && this.viewConfig.editMode && !this.viewState.busy) {
        const deletingTrains: Train[] = [];
        const deletingStevs: { stev: StopEvent, index: number }[] = [];
        for (const sel of Object.values(this.viewState.trainSelections)) {
          if (!sel.stevRange) {
            deletingTrains.push(sel.train);
          } else {
            const fromIndex = sel.train.stevs.indexOf(sel.stevRange.from);
            const toIndex = sel.train.stevs.indexOf(sel.stevRange.to);
            const size = toIndex - fromIndex + 1;
            if (size >= sel.train.stevs.length - 1) {
              deletingTrains.push(sel.train);
            } else {
              for (let i = fromIndex; i <= toIndex; ++i) {
                deletingStevs.push({ stev: sel.train.stevs[i], index: i });
              }
            }
          }
        }
        deletingTrains.forEach(train => this.$delete(this.diagram.trains, train.id));
        deletingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
        this.historyManager.push({
          this: this,
          undo: () => {
            deletingStevs.forEach(e => e.stev.train.addNewStopEvent(e.stev, e.index));
            deletingTrains.forEach(train => this.$set(this.diagram.trains, train.id, train));
          },
          redo: () => {
            deletingTrains.forEach(train => this.$delete(this.diagram.trains, train.id));
            deletingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
          }
        });
        this.viewState.trainSelections = {};
      }
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key == "Shift") {
      this.viewState.pointerPreciseState = null;
    }
    if (event.key == "Control") {
      this.viewState.controlKeyPressed = false;
    }
  }

  onContextMenu(konvaEvent: KonvaEventObject<MouseEvent>): boolean {
    konvaEvent.evt.preventDefault();
    return false;
  }
}
</script>

<style scoped lang="scss">
</style>
