<template>
  <v-stage v-if="diagram" :config="stageConfig" 
    @mousedown="onStageMouseDown" @mousemove="onStageMouseMove" @click="onStageClick" @dblclick="onStageDoubleClick" @contextmenu="onContextMenu">
    <back-layer v-on="$listeners"></back-layer>
    <train-path-layer></train-path-layer>
    <v-layer>
      <pointer></pointer>
    </v-layer>
  </v-stage>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import { KonvaEventObject } from "konva/types/Node";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import Stop from "@/data/Stop";
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

  stageDragState: { scrollX0: number, scrollY0: number, screenX0: number, screenY0: number, dragged: boolean } | null = null;

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
  }

  unmounted(): void {
    window.removeEventListener("mousemove", this.onWindowMouseMove);
    window.removeEventListener("mouseup", this.onWindowMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
  }

  onStageMouseDown(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (konvaEvent.target == konvaEvent.currentTarget) {
      const event = konvaEvent.evt;
      this.stageDragState = {
        scrollX0: this.diagram.config.scrollX,
        scrollY0: this.diagram.config.scrollY,
        screenX0: event.screenX,
        screenY0: event.screenY,
        dragged: false,
      };
    }
  }

  onStageMouseMove(konvaEvent: KonvaEventObject<MouseEvent>): void {
    this.viewState.pointerOnMarker = false;

    const event = konvaEvent.evt;
    this.viewState.pointerScreenX = event.screenX;
    if (this.viewState.pointerPreciseState) {
      const dUnit = Math.round((event.screenX - this.viewState.pointerPreciseState.sx0) / this.viewConfig.pointerPrecisePixelPerTimeUnit);
      this.viewState.pointerTime = dUnit * this.diagram.config.minimumTimeUnit + this.viewState.pointerPreciseState.t0;
    } else if (!this.viewState.pointerDragging) {
      this.viewState.pointerTime = Math.round(this.diagram.getTimeByX(event.clientX) / 60) * 60;
      if (event.clientX >= this.diagram.config.leftPaneWidth) {
        const pointerTargetLine = this.findPointerTargetLine(event.clientY);
        if (pointerTargetLine) {
          this.viewState.pointerTargetLine = pointerTargetLine ?? null;
          this.viewState.pointerY = this.diagram.getYByRelY(pointerTargetLine.track?.relY ?? pointerTargetLine.station.topRelY);
        } else {
          this.viewState.pointerTargetLine = null;
        }
      } else {
        this.viewState.pointerTargetLine = null;
      }
    }
    if (this.viewState.drawingState) {
      const train = this.diagram.trains[this.viewState.drawingState.trainId];
      const lastStop = train.stops.find(s => s.id == this.viewState.drawingState?.lastStopId);
      if (lastStop) {
        if (this.viewState.drawingState.direction > 0) {
          this.viewState.pointerTime = Math.max(this.viewState.pointerTime, lastStop.depTime);
        } else if (this.viewState.drawingState.direction < 0) {
          this.viewState.pointerTime = Math.min(this.viewState.pointerTime, lastStop.arrTime);
        }
      }
    }
  }

  findPointerTargetLine(y: number): { station: Station, track?: Track } | undefined {
    const pointedStation = this.stationsInMileageOrder.find(s => 
      Math.min(Math.abs(this.diagram.getYByRelY(s.topRelY) - y), Math.abs(this.diagram.getYByRelY(s.bottomRelY) - y)) < 
        Math.max(this.diagram.config.stationLineWidth * 0.5, this.viewConfig.minHitWidth)
    );
    if (pointedStation) {
      return { station: pointedStation };
    }

    const station = this.stationsInMileageOrder.find(s => 
      this.diagram.getYByRelY(s.topRelY) + this.diagram.config.trackLineSpan - Math.max(this.diagram.config.trackLineWidth * 0.5, this.viewConfig.minHitWidth) < y &&
      this.diagram.getYByRelY(s.bottomRelY) - this.diagram.config.trackLineSpan + Math.max(this.diagram.config.trackLineWidth * 0.5, this.viewConfig.minHitWidth) > y
    );
    if (station) {
      const pointedTrack = station.tracks.find(t => Math.abs(this.diagram.getYByRelY(t.relY) - y) < Math.max(this.diagram.config.trackLineWidth * 0.5, this.viewConfig.minHitWidth));
      if (pointedTrack) {
        return { station, track: pointedTrack };
      }
    }
  }

  onStageClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const drawingState = this.viewState.drawingState;
    if (drawingState) {
      const train = this.diagram.trains[drawingState.trainId];
      if (this.viewState.pointerTargetLine) {
        const lastStop = train.stops.find(s => s.id == drawingState.lastStopId);
        if (lastStop) {
          if (drawingState.direction == 0) {
            drawingState.direction = Math.sign(this.viewState.pointerTime - lastStop.arrTime);
          }
          if (this.viewState.pointerTargetLine.station.id == lastStop.stationId) {
            if (drawingState.direction > 0) {
              lastStop.depTime = this.viewState.pointerTime;
            } else {
              lastStop.arrTime = this.viewState.pointerTime;
            }
          } else {
            const stop = Stop.fromJSON({ 
              id: this.diagram.genId(), 
              stationId: this.viewState.pointerTargetLine.station.id,
              trackId: this.viewState.pointerTargetLine.track?.id ?? this.viewState.pointerTargetLine.station.tracks[0].id,
              arrTime: this.viewState.pointerTime,
              depTime: this.viewState.pointerTime
            });
            if (drawingState.direction > 0) {
              train.stops.push(stop);
            } else {
              train.stops.splice(0, 0, stop);
            }
            drawingState.lastStopId = stop.id;
          }
        }
      } else {
        if (train.stops.length == 0) {
          this.$delete(this.diagram.trains, train.id);
        }
        this.viewState.drawingState = null;
      }
    }

    if (konvaEvent.target == konvaEvent.currentTarget && !konvaEvent.evt.ctrlKey && !this.stageDragState?.dragged && !this.viewState.pointerDragging && !this.viewState.drawingState) {
      this.viewState.trainSelections = {};
    }
  }

  onStageDoubleClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (konvaEvent.target == konvaEvent.currentTarget && this.viewState.editMode) {
      if (konvaEvent.evt.clientX >= this.diagram.config.leftPaneWidth) {
        const targetLine = this.viewState.pointerTargetLine;
        if (targetLine && (targetLine.track || !targetLine.station.expanded)) {
          const track = targetLine.track ?? targetLine.station.tracks[0];
          const stop = Stop.fromJSON({
            id: this.diagram.genId(),
            stationId: targetLine.station.id,
            trackId: track.id,
            arrTime: this.viewState.pointerTime,
            depTime: this.viewState.pointerTime,
          });
          const train = Train.fromJSON({
            id: this.diagram.genId(),
            name: "",
            stops: [ stop ]
          });
          this.$set(this.diagram.trains, train.id, train);
          this.viewState.trainSelections = { [train.id]: { trainId: train.id, stopRange: null } };
          this.viewState.drawingState = { trainId: train.id, lastStopId: stop.id, direction: 0 };
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
        this.$emit("updateY");

        this.viewState.stationNameInputTarget = { stationId: station.id };
        this.$emit("stationNameInputStart");
      }
    }
  }

  onWindowMouseMove(event: MouseEvent): void {
    if (this.stageDragState) {
      this.stageDragState.dragged = true;
      this.diagram.config.scrollX = this.stageDragState.scrollX0 - (event.screenX - this.stageDragState.screenX0);
      this.diagram.config.scrollY = 
        Math.max(
          0, 
          Math.min(
            this.viewState.maxRelY + this.diagram.config.topPaneHeight - this.viewState.viewHeight, 
            this.stageDragState.scrollY0 - (event.screenY - this.stageDragState.screenY0)));
    }
  }

  onWindowMouseUp(event: MouseEvent): void {
    if (this.stageDragState) {
      this.onWindowMouseMove(event);
      this.stageDragState = null;
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
      if (event.key == "Delete") {
        let notEnd = false;
        for (const sel of Object.values(this.viewState.trainSelections)) {
          const stopRange = sel.stopRange;
          if (!stopRange) {
            this.$delete(this.diagram.trains, sel.trainId);
            this.$delete(this.viewState.trainSelections, sel.trainId);
          } else {
            const train = this.diagram.trains[sel.trainId];
            if (stopRange.fromStopId == train.stops[0].id && stopRange.fromStopSide == "arr") {
              if (stopRange.toStopId == stopRange.fromStopId && stopRange.toStopSide == "arr") {
                train.stops[0].arrTime = train.stops[0].depTime;
              } else if (stopRange.toStopId == stopRange.fromStopId && train.stops[0].arrTime == train.stops[0].depTime) {
                train.stops.splice(0, 1);
              } else {
                const toStopIndex = train.stops.findIndex(s => s.id == stopRange.toStopId);
                train.stops.splice(0, toStopIndex);
                if (stopRange.toStopSide == "dep") {
                  train.stops[0].arrTime = train.stops[0].depTime;
                }
              }
              if (train.stops.length == 1 && train.stops[0].arrTime == train.stops[0].depTime) {
                this.$delete(this.diagram.trains, sel.trainId);
              }
              this.$delete(this.viewState.trainSelections, sel.trainId);
            } else if (stopRange.toStopId == train.stops[train.stops.length - 1].id && stopRange.toStopSide == "dep") {
              const lastStop = train.stops[train.stops.length - 1];
              if (stopRange.fromStopId == stopRange.toStopId && stopRange.fromStopSide == "dep") {
                lastStop.depTime = lastStop.arrTime;
              } else if (stopRange.fromStopId == stopRange.toStopId && lastStop.arrTime == lastStop.depTime) {
                train.stops.splice(train.stops.length - 1, 1);
              } else {
                const fromStopIndex = train.stops.findIndex(s => s.id == stopRange.fromStopId);
                train.stops.splice(fromStopIndex + 1, train.stops.length - fromStopIndex - 1);
                if (stopRange.fromStopSide == "arr") {
                  train.stops[fromStopIndex].depTime = train.stops[fromStopIndex].arrTime;
                }
              }
              if (train.stops.length == 1 && train.stops[0].arrTime == train.stops[0].depTime) {
                this.$delete(this.diagram.trains, sel.trainId);
              }
              this.$delete(this.viewState.trainSelections, sel.trainId);
            } else {
              notEnd = true;
            }
          }
        }
        if (notEnd) {
          // this.$buefy.notification.open({ message: this.$t("message.tryedToDeleteMiddleOfTrainPath").toString(), type: "is-danger" });
        }
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
