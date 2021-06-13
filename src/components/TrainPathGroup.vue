<template>
  <v-group>
    <v-line :config="regularTrainPathConfig" @click="onTrainPathClick"></v-line>
    <template v-if="selectedTrainPathEnabled">
      <v-line :config="selectedTrainPathConfig" @click="onSelectedTrainPathClick" @dblclick="onSelectedTrainPathDoubleClick" @mousedown="onSelectedTrainPathMouseDown"></v-line>
      <train-path-marker v-for="(n, i) in selectedTrainPathNodes" :key="`marker-${train.id}-${i}-${n.vSide}`" :trainPathNode="n" @click="onMarkerClick" @mousedown="onMarkerMouseDown"></train-path-marker>
    </template>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import { KonvaEventObject } from "konva/types/Node";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import StopEvent, { StopEventRange } from "@/data/StopEvent";
import TrainPathNode from "@/data/TrainPathNode";
import Train from "@/data/Train";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";
import TrainPathMarker from "./TrainPathMarker.vue";

@Component({
  components: {
    TrainPathMarker
  },
})
export default class TrainPathGroup extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Prop() train!: Train;

  dragState: { 
    t0: number, 
    sx0: number, 
    y0: number,
    minTimeShift: number,
    maxTimeShift: number,
    changeTimeTargets: StopEvent[] | null,
    changeTrackTargets: StopEvent[] | null,
  } | null = null;

  get regularTrainPathConfig(): unknown {
    return {
      points: this.regularTrainPathNodes.map(n => [n.x, n.y]).flat(),
      stroke: this.diagram.config.trainPathColor,
      opacity: Object.keys(this.viewState.trainSelections).length > 0 ? this.viewConfig.unselectedTrainPathOpacity : 1,
      strokeWidth: this.diagram.config.trainPathWidth,
      hitStrokeWidth: Math.max(this.diagram.config.trainPathWidth, this.viewConfig.minHitWidth * 2),
    }
  }

  get regularTrainPathNodes(): TrainPathNode[] {
    const result: TrainPathNode[] = [];
    for (const n of this.trainPathNodes) {
      const time = n.time + (this.selectedTrainPathEnabled && n.selected && this.viewState.trainPathDragState && !this.viewState.controlKeyPressed ? this.viewState.trainPathDragState.timeShift : 0);
      result.push({
        train: n.train, 
        stev: n.stev, 
        vSide: n.vSide,
        time, 
        x: this.diagram.getXByTime(time),
        y: n.y, 
        selected: n.selected
      });
    }
    return result;
  }

  get selectedTrainPathEnabled(): boolean {
    return this.viewState.trainSelections[this.train.id] != null;
  }

  get selectedTrainPathConfig(): unknown {
    return {
      points: this.selectedTrainPathNodes.flatMap(n => [n.x, n.y]),
      stroke: this.viewConfig.selectedTrainPathColor,
      strokeWidth: this.diagram.config.trainPathWidth * this.viewConfig.selectedTrainPathWidthScale,
      hitStrokeWidth: Math.max(this.diagram.config.trainPathWidth * this.viewConfig.selectedTrainPathWidthScale, this.viewConfig.minHitWidth * 2)
    };
  }

  get selectedTrainPathNodes():TrainPathNode[] {
    const result: TrainPathNode[] = [];
    for (const n of this.trainPathNodes) {
      if (n.selected) {
        const time = n.time + (this.viewState.trainPathDragState?.timeShift ?? 0);
        result.push({
          train: n.train, 
          stev: n.stev, 
          vSide: n.vSide,
          time, 
          x: this.diagram.getXByTime(time),
          y: n.y, 
          selected: n.selected
        });
      }
    }
    return result;
  }

  get trainPathNodes(): TrainPathNode[] {
    const result: TrainPathNode[] = [];
    const selectedStevRange = this.viewState.trainSelections[this.train.id]?.stevRange;
    let inRange = selectedStevRange === null;
    for (const stev of this.train.stevs) {
      const station = this.diagram.stations[stev.stationId];
      if (selectedStevRange && selectedStevRange.from == stev) {
        inRange = true;
      }
      const time = stev.time;
      const x = this.diagram.getXByTime(time);
      if (station.expanded) {
        const prevStev = this.train.getPreviousStopEvent(stev);
        if (prevStev && prevStev.stationId != stev.stationId) {
          const prevStation = this.diagram.stations[prevStev.stationId];
          result.push({ 
            train: this.train, 
            stev, 
            vSide: prevStation.mileage < station.mileage ? "top" : "bottom", 
            time, x, 
            y: this.diagram.getYByRelY(prevStation.mileage < station.mileage ? station.topRelY : station.bottomRelY),
            selected: inRange,
          });
        }
        result.push({
          train: this.train, 
          stev, 
          vSide: "track", 
          time, x,
          y: this.diagram.getYByRelY(station.tracks.find(t => t.id == stev.trackId)?.relY ?? 0),
          selected: inRange,
        });
        const nextStev = this.train.getNextStopEvent(stev);
        if (nextStev && nextStev.stationId != stev.stationId) {
          const nextStation = this.diagram.stations[nextStev.stationId];
          result.push({
            train: this.train, 
            stev, 
            vSide: nextStation.mileage > station.mileage ? "bottom" : "top",
            time, x,
            y: this.diagram.getYByRelY(nextStation.mileage > station.mileage ? station.bottomRelY : station.topRelY),
            selected: inRange,
          });
        }
      } else {
        result.push({ 
          train: this.train, 
          stev,
          vSide: "top", 
          time, x, 
          y: this.diagram.getYByRelY(station.topRelY),
          selected: inRange,
        });        
      }
      if (selectedStevRange && selectedStevRange.to == stev) {
        inRange = false;
      }
    }
    return result;
  }

  onTrainPathClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const clickedStopRange = this.getClickedStevRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    this.changeTrainSelections(konvaEvent, clickedStopRange, false);
  }

  onSelectedTrainPathClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const clickedStopRange = this.getClickedStevRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    this.changeTrainSelections(konvaEvent, clickedStopRange, true);
  }

  onMarkerClick(konvaEvent: KonvaEventObject<MouseEvent>, trainPathNode: TrainPathNode): void {
    const clickedStevRange = { from: trainPathNode.stev, to: trainPathNode.stev };
    this.changeTrainSelections(konvaEvent, clickedStevRange, true);
  }

  changeTrainSelections(konvaEvent: KonvaEventObject<MouseEvent>, clickedStevRange: StopEventRange, clickSelected: boolean): void {
    if (!this.viewState.pointerDragging && !this.viewState.drawingState) {
      const sel = this.viewState.trainSelections[this.train.id];

      // Remove other trains if ctrl not pressed
      if (!konvaEvent.evt.ctrlKey) {
        this.viewState.trainSelections = sel ? { [this.train.id]: sel } : {};
      }

      if (!sel) {
        this.$set(this.viewState.trainSelections, this.train.id, { trainId: this.train.id, stevRange: null });
      } else {
        const selectedStevRange = sel.stevRange;
        if (!selectedStevRange) {
          sel.stevRange = clickedStevRange;
        } else if (!konvaEvent.evt.ctrlKey) {
          sel.stevRange = clickSelected ? clickedStevRange : null;
        } else {
          let selStart = false, selEnd = false, changed = false;
          for (const stev of this.train.stevs) {
            if (!selStart && stev == clickedStevRange.from) {
              selectedStevRange.from = clickedStevRange.from;
              changed = true;
            }
            if (stev == selectedStevRange.from) selStart = true;
            if (stev == selectedStevRange.to) selEnd = true;
            if (selEnd && stev == clickedStevRange.to) {
              selectedStevRange.to = clickedStevRange.to;
              changed = true;
            }
          }
          if (!changed) {
            this.$delete(this.viewState.trainSelections, this.train.id);
          }
        }
      }
    }
  }

  getClickedStevRange(x: number, y: number): StopEventRange {
    const targetTime = this.diagram.getTimeByX(x);
    if (this.train.stevs.length <= 2) {
      return { from: this.train.stevs[0], to: this.train.stevs[this.train.stevs.length - 1] };
    }

    // TODO: more precise detection
    for (let i = 0; i < this.train.stevs.length - 1; ++i) {
      const thisStev = this.train.stevs[i];
      const nextStev = this.train.stevs[i + 1];
      const thisTrack = this.diagram.stations[thisStev.stationId].tracks.find(t => t.id == thisStev.trackId);
      const nextTrack = this.diagram.stations[nextStev.stationId].tracks.find(t => t.id == nextStev.trackId);
      if (thisTrack && nextTrack) {
        const leftX = this.diagram.getXByTime(thisStev.time) - this.viewConfig.minHitWidth;
        const rightX = this.diagram.getXByTime(nextStev.time) + this.viewConfig.minHitWidth;
        const topY = this.diagram.getYByRelY(Math.min(thisTrack.relY, nextTrack.relY)) - this.viewConfig.minHitWidth;
        const bottomY = this.diagram.getYByRelY(Math.max(thisTrack.relY, nextTrack.relY)) + this.viewConfig.minHitWidth;
        if (leftX < x && x < rightX && topY < y && y < bottomY) {
          return { from: thisStev, to: nextStev };
        }
      }
    }
    return { from: this.train.stevs[0], to: this.train.stevs[this.train.stevs.length - 1] };
  }

  onSelectedTrainPathDoubleClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (this.viewState.editMode && !this.viewState.drawingState) {
      const targetTime = this.viewState.pointerTime;
      const nearestSta = this.getNearestStation(konvaEvent.evt.clientY);
      const nearestStev = this.getNearestStopEvent(targetTime);
      if (!(nearestSta.id == nearestStev.stationId &&
        this.train.getPreviousStopEvent(nearestStev)?.trackId == nearestStev.trackId &&
        this.train.getNextStopEvent(nearestStev)?.trackId == nearestStev.trackId)) {
        const newStev = new StopEvent(
          this.diagram.genId(),
          this.diagram.stations[nearestSta.id].tracks[0].id,
          targetTime
        );
        const index = this.train.stevs.findIndex(s => s.time > targetTime);
        this.train.stevs.splice(index, 0, newStev);
        this.viewState.trainSelections = { [this.train.id]: {
          trainId: this.train.id,
          stevRange: { from: this.train.stevs[index], to: this.train.stevs[index] }
        } };
      }
    }
  }

  getNearestStation(y: number): Station {
    const stations = this.diagram.getStationsInMileageOrder();
    const relY = this.diagram.getRelYByY(y);
    let minSta = stations[0];
    let minDist = Math.abs(relY - minSta.bottomRelY);
    for (const s of stations) {
      if (Math.abs(relY - s.topRelY) < minDist) {
        minSta = s;
        minDist = Math.abs(relY - s.topRelY);
      }
      if (Math.abs(relY - s.bottomRelY) < minDist) {
        minSta = s;
        minDist = Math.abs(relY - s.bottomRelY);
      }
    }
    return minSta;
  }

  getNearestStopEvent(time: number): StopEvent {
    let minStop = this.train.stevs[0];
    let minDist = Math.abs(time - minStop.time);
    for (const s of this.train.stevs) {
      if (Math.abs(time - s.time) < minDist) {
        minStop = s;
        minDist = Math.abs(time - s.time);
      }
    }
    return minStop;
  }

  onSelectedTrainPathMouseDown(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (!this.viewState.editMode) {
      return;
    }

    let minTimeShift = -86400;
    let maxTimeShift = 86400;
    for (const sel of Object.values(this.viewState.trainSelections)) {
      const stevRange = sel.stevRange;
      if (stevRange) {
        const train = this.diagram.trains[sel.trainId];
        const prevFrom = train.getPreviousStopEvent(stevRange.from);
        if (prevFrom) {
          minTimeShift = Math.max(minTimeShift, prevFrom.time - stevRange.from.time);
        }
        const nextTo = train.getNextStopEvent(stevRange.to);  
        if (nextTo) {
          maxTimeShift = Math.min(maxTimeShift, nextTo.time - stevRange.to.time);
        }
      }
    }

    const clickedStevRange = this.getClickedStevRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    const changeTrackTargets = 
      clickedStevRange.from == clickedStevRange.to ? [ clickedStevRange.from ] : 
      clickedStevRange.from.trackId == clickedStevRange.to.trackId ? [ clickedStevRange.from, clickedStevRange.to ] :
      null;

    const firstNode = this.selectedTrainPathNodes[0];
    this.dragState = { 
      t0: firstNode.time, 
      sx0: konvaEvent.evt.screenX, 
      y0: firstNode.y,
      minTimeShift: minTimeShift,
      maxTimeShift: maxTimeShift,
      changeTimeTargets: null,
      changeTrackTargets: changeTrackTargets ?? null
    };
    this.viewState.trainPathDragState = {
      timeShift: 0
    };
    window.addEventListener("mousemove", this.onWindowMouseMove);
    window.addEventListener("mouseup", this.onWindowMouseUp);
  }

  onMarkerMouseDown(konvaEvent: KonvaEventObject<MouseEvent>, node: TrainPathNode): void {
    if (!this.viewState.editMode) {
      return;
    }
    
    const prevStev = this.train.getPreviousStopEvent(node.stev);
    const nextStev = this.train.getNextStopEvent(node.stev);

    this.dragState = {
      t0: node.time,
      sx0: konvaEvent.evt.screenX,
      y0: node.y,
      minTimeShift: prevStev ? prevStev.time - node.time : -86400,
      maxTimeShift: nextStev ? nextStev.time - node.time : 86400,
      changeTimeTargets: [ node.stev ],
      changeTrackTargets: [ node.stev ]
    };
    this.viewState.trainPathDragState = {
      timeShift: 0
    };
    window.addEventListener("mousemove", this.onWindowMouseMove);
    window.addEventListener("mouseup", this.onWindowMouseUp);
  }

  onWindowMouseMove(event: MouseEvent): void {
    if (this.dragState && this.viewState.trainPathDragState) {
      if (!this.viewState.pointerDragging) {
        this.viewState.pointerDragging = true;
        this.viewState.pointerY = this.dragState.y0;
      }
      if (!this.viewState.pointerPreciseState) {
        this.viewState.pointerTime = this.dragState.t0 + Math.floor((event.screenX - this.dragState.sx0) / this.diagram.config.xScale / 60) * 60;
      }
      this.viewState.trainPathDragState.timeShift = 
        Math.min(this.dragState.maxTimeShift, Math.max(this.dragState.minTimeShift, this.viewState.pointerTime - this.dragState.t0));
      if (this.dragState.changeTrackTargets) {
        const mouseRelY = this.diagram.getRelYByY(event.clientY);
        const targetStation = this.diagram.stations[this.dragState.changeTrackTargets[0].stationId];
        const mouseTrack = targetStation.tracks.find(t => Math.abs(t.relY - mouseRelY) < this.viewConfig.minHitWidth);
        if (mouseTrack) {
          for (const stev of this.dragState.changeTrackTargets) {
            stev.trackId = mouseTrack.id;
          }
        }
      }
    }
  }

  onWindowMouseUp(): void {
    if (this.dragState && this.viewState.trainPathDragState) {
      window.removeEventListener("mousemove", this.onWindowMouseMove);
      window.removeEventListener("mouseup", this.onWindowMouseUp);
      if (!this.viewState.controlKeyPressed) {
        const targets = 
          this.dragState.changeTimeTargets ??
          Object.values(this.viewState.trainSelections).flatMap(sel => {
            const train = this.diagram.trains[sel.trainId];
            return sel.stevRange ? train.getStopEventsInRange(sel.stevRange) : train.stevs;
          });
        for (const stev of targets) {
          stev.time += this.viewState.trainPathDragState.timeShift;
        }
      } else {
        for (const sel of Object.values(this.viewState.trainSelections)) {
          const newStevs: StopEvent[] = [];
          const srcTrain = this.diagram.trains[sel.trainId];
          const srcStevs = sel.stevRange ? srcTrain.getStopEventsInRange(sel.stevRange) : srcTrain.stevs;
          for (const srcStev of srcStevs) {
            const newStev = new StopEvent( 
              srcStev.stationId, 
              srcStev.trackId, 
              srcStev.time + this.viewState.trainPathDragState.timeShift
            );
            newStevs.push(newStev);
          }
          const newTrain = new Train(
            this.diagram.genId(),
            "",
            newStevs
          );
          this.$set(this.diagram.trains, newTrain.id, newTrain);
          this.$delete(this.viewState.trainSelections, sel.trainId);
          this.$set(this.viewState.trainSelections, newTrain.id, { trainId: newTrain.id, stevRange: null });
        }
      }
      this.viewState.pointerDragging = false;
      this.viewState.trainPathDragState = null;
      this.dragState = null;
    }
  }
}
</script>

<style scoped lang="scss">
</style>
