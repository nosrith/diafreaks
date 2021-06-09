<template>
  <v-group>
    <v-line :config="regularTrainPathConfig" @click="onTrainPathClick"></v-line>
    <template v-if="selectedTrainPathEnabled">
      <v-line :config="selectedTrainPathConfig" @click="onSelectedTrainPathClick" @dblclick="onSelectedTrainPathDoubleClick" @mousedown="onSelectedTrainPathMouseDown"></v-line>
      <train-path-marker v-for="(n, index) in selectedTrainPathNodes" :key="`train-path-${train.id}-marker-${index}`" :trainPathNode="n" @click="onMarkerClick" @mousedown="onMarkerMouseDown"></train-path-marker>
    </template>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import { KonvaEventObject } from "konva/types/Node";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import Stop from "@/data/Stop";
import TrainPathNode from "@/data/TrainPathNode";
import Train, { TrainStopRange, TrainStopEvent } from "@/data/Train";
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
    targetStopEvents: TrainStopEvent[] | null,
    targetStop: Stop | null,
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
        train: n.train, stop: n.stop, side: n.side, vSide: n.vSide,
        time, x: this.diagram.getXByTime(time),
        y: n.y, selected: n.selected
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
          train: n.train, stop: n.stop, side: n.side, vSide: n.vSide,
          time, x: this.diagram.getXByTime(time),
          y: n.y, selected: n.selected
        });
      }
    }
    return result;
  }

  get trainPathNodes(): TrainPathNode[] {
    const result: TrainPathNode[] = [];
    const stopEvents = this.train.getStopEvents();
    const selectedStopRange = this.viewState.trainSelections[this.train.id]?.stopRange;
    let inRange = selectedStopRange === null;
    for (let i = 0; i < stopEvents.length; i++) {
      const se = stopEvents[i];
      const station = this.diagram.stations[se.stop.stationId];
      if (selectedStopRange && selectedStopRange.fromStopId == se.stop.id && selectedStopRange.fromStopSide == se.side) {
        inRange = true;
      }
      const time = se.time;
      const x = this.diagram.getXByTime(time);
      if (station.expanded) {
        if (se.side == "arr" && i > 0) {
          const prevSE = stopEvents[i - 1];
          if (prevSE.stop.stationId != se.stop.stationId) {
            const prevStation = this.diagram.stations[prevSE.stop.stationId];
            result.push({ 
              train: this.train, stop: se.stop, side: "arr", 
              vSide: prevStation.mileage < station.mileage ? "top" : "bottom", 
              time, x, 
              y: this.diagram.getYByRelY(prevStation.mileage < station.mileage ? station.topRelY : station.bottomRelY),
              selected: inRange,
            });
          }
        }
        result.push({
          train: this.train, stop: se.stop, side: se.side, 
          vSide: "track", 
          time, x,
          y: this.diagram.getYByRelY(station.tracks.find(t => t.id == se.stop.trackId)?.relY ?? 0),
          selected: inRange,
        });
        if (se.side == "dep" && i < stopEvents.length - 1) {
          const nextSE = stopEvents[i + 1];
          if (nextSE.stop.stationId != se.stop.stationId) {
            const nextStation = this.diagram.stations[nextSE.stop.stationId];
            result.push({
              train: this.train, stop: se.stop, side: "dep", 
              vSide: nextStation.mileage > station.mileage ? "bottom" : "top",
              time: time, x,
              y: this.diagram.getYByRelY(nextStation.mileage > station.mileage ? station.bottomRelY : station.topRelY),
              selected: inRange,
            });
          }        
        }
      } else {
        result.push({ 
          train: this.train, stop: se.stop, side: se.side, vSide: "top", 
          time, x, 
          y: this.diagram.getYByRelY(station.topRelY),
          selected: inRange,
        });        
      }
      if (selectedStopRange && selectedStopRange.toStopId == se.stop.id && selectedStopRange.toStopSide == se.side) {
        inRange = false;
      }
    }
    return result;
  }

  onTrainPathClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const clickedStopRange = this.getClickedStopRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    this.changeTrainSelections(konvaEvent, clickedStopRange, false);
  }

  onSelectedTrainPathClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const clickedStopRange = this.getClickedStopRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    this.changeTrainSelections(konvaEvent, clickedStopRange, true);
  }

  onMarkerClick(konvaEvent: KonvaEventObject<MouseEvent>, trainPathNode: TrainPathNode): void {
    const clickedStopRange = {
      fromStopId: trainPathNode.stop.id,
      fromStopSide: trainPathNode.stop.arrTime != trainPathNode.stop.depTime ? trainPathNode.side : "arr",
      toStopId: trainPathNode.stop.id,
      toStopSide: trainPathNode.stop.arrTime != trainPathNode.stop.depTime ? trainPathNode.side : "dep"
    };
    this.changeTrainSelections(konvaEvent, clickedStopRange, true);
  }

  changeTrainSelections(konvaEvent: KonvaEventObject<MouseEvent>, clickedStopRange: TrainStopRange, clickSelected: boolean): void {
    if (!this.viewState.pointerDragging && !this.viewState.drawingState) {
      const sel = this.viewState.trainSelections[this.train.id];

      // Remove other trains if ctrl not pressed
      if (!konvaEvent.evt.ctrlKey) {
        this.viewState.trainSelections = sel ? { [this.train.id]: sel } : {};
      }

      if (!sel) {
        this.$set(this.viewState.trainSelections, this.train.id, { trainId: this.train.id, stopRange: null });
      } else {
        const selectedStopRange = sel.stopRange;
        if (!selectedStopRange) {
          sel.stopRange = clickedStopRange;
        } else if (!konvaEvent.evt.ctrlKey) {
          sel.stopRange = clickSelected ? clickedStopRange : null;
        } else {
          const selectedFromStopIndex = this.train.stops.findIndex(s => s.id == selectedStopRange.fromStopId);
          const selectedToStopIndex = this.train.stops.findIndex(s => s.id == selectedStopRange.toStopId);
          const clickedFromStopIndex = this.train.stops.findIndex(s => s.id == clickedStopRange.fromStopId);
          const clickedToStopIndex = this.train.stops.findIndex(s => s.id == clickedStopRange.toStopId);
          if (clickedFromStopIndex < selectedFromStopIndex || (clickedFromStopIndex == selectedFromStopIndex && clickedStopRange.fromStopSide == "arr")) {
            selectedStopRange.fromStopId = clickedStopRange.fromStopId;
            selectedStopRange.fromStopSide = clickedStopRange.fromStopSide;
          } else if (clickedToStopIndex > selectedToStopIndex || (clickedToStopIndex == selectedToStopIndex && clickedStopRange.toStopSide == "dep")) {
            selectedStopRange.toStopId = clickedStopRange.toStopId;
            selectedStopRange.toStopSide = clickedStopRange.toStopSide;
          } else {
            this.$delete(this.viewState.trainSelections, this.train.id);
          }
        }
      }
    }
  }

  getClickedStopRange(x: number, y: number): TrainStopRange {
    const targetTime = this.diagram.getTimeByX(x);
    for (let i = 0; i < this.train.stops.length; ++i) {
      const stop = this.train.stops[i];
      const station = this.diagram.stations[stop.stationId];

      if (y > this.diagram.getYByRelY(station.topRelY) - this.viewConfig.minHitWidth && y < this.diagram.getYByRelY(station.bottomRelY) + this.viewConfig.minHitWidth) {
        return { fromStopId: stop.id, fromStopSide: "arr", toStopId: stop.id, toStopSide: "dep" };
      }
      if (i > 0 && targetTime < stop.arrTime) {
        const prevStop = this.train.stops[i - 1];
        return { 
          fromStopId: prevStop.id,
          fromStopSide: prevStop.arrTime == prevStop.depTime ? "arr" : "dep",
          toStopId: stop.id,
          toStopSide: stop.arrTime == stop.depTime ? "dep" : "arr"
        };
      }
    }
    const lastStop = this.train.stops[this.train.stops.length - 1];
    return { fromStopId: lastStop.id, fromStopSide: "arr", toStopId: lastStop.id, toStopSide: "dep" };
  }

  onSelectedTrainPathDoubleClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (this.viewState.editMode && !this.viewState.drawingState) {
      const targetTime = this.viewState.pointerTime;
      const nearestSta = this.getNearestStation(konvaEvent.evt.clientY);
      const nearestStop = this.getNearestStop(targetTime);
      if (nearestSta.id != nearestStop.stationId) {
        const index = this.train.stops.findIndex(s => s.arrTime > targetTime);
        const id = this.diagram.genId();
        this.train.stops.splice(index, 0, new Stop(
          id,
          nearestSta.id,
          this.diagram.stations[nearestSta.id].tracks[0].id,
          targetTime,
          targetTime
        ));

        this.viewState.trainSelections = { [this.train.id]: {
          trainId: this.train.id,
          stopRange: { fromStopId: id, fromStopSide: "arr", toStopId: id, toStopSide: "dep" }
        } };
      } else if (nearestStop.arrTime == nearestStop.depTime) {
        if (targetTime < nearestStop.arrTime) {
          nearestStop.arrTime = targetTime;
          this.viewState.trainSelections = { [this.train.id]: {
            trainId: this.train.id,
            stopRange: { fromStopId: nearestStop.id, fromStopSide: "arr", toStopId: nearestStop.id, toStopSide: "arr" }
          } };
        } else if (targetTime > nearestStop.depTime) {
          nearestStop.depTime = targetTime;
          this.viewState.trainSelections = { [ this.train.id]: {
            trainId: this.train.id,
            stopRange: { fromStopId: nearestStop.id, fromStopSide: "dep", toStopId: nearestStop.id, toStopSide: "dep" }
          } };
        }
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

  getNearestStop(time: number): Stop {
    let minStop = this.train.stops[0];
    let minDist = Math.abs(time - minStop.arrTime);
    for (const s of this.train.stops) {
      if (Math.abs(time - s.arrTime) < minDist) {
        minStop = s;
        minDist = Math.abs(time - s.arrTime);
      }
      if (Math.abs(time - s.depTime) < minDist) {
        minStop = s;
        minDist = Math.abs(time - s.depTime);
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
      const stopRange = sel.stopRange;
      if (stopRange) {
        const train = this.diagram.trains[sel.trainId];
        const fromSE = train.getStopEvent(stopRange.fromStopId, stopRange.fromStopSide);
        const prevFromSE = fromSE ? train.getPreviousStopEvent(fromSE.stop.id, fromSE.side) : undefined;
        if (fromSE && prevFromSE) {
          minTimeShift = Math.max(minTimeShift, prevFromSE.time - fromSE.time);
        }
        const toSE = train.getStopEvent(stopRange.toStopId, stopRange.toStopSide);
        const nextToSE = toSE ? train.getNextStopEvent(toSE.stop.id, toSE.side) : undefined;  
        if (toSE && nextToSE) {
          maxTimeShift = Math.min(maxTimeShift, nextToSE.time - toSE.time);
        }
      }
    }

    const targetTime = this.diagram.getTimeByX(konvaEvent.evt.clientX);
    const targetStop = this.train.stops.find(s => s.arrTime <= targetTime && s.depTime >= targetTime);

    const firstNode = this.selectedTrainPathNodes[0];
    this.dragState = { 
      t0: firstNode.time, 
      sx0: konvaEvent.evt.screenX, 
      y0: firstNode.y,
      minTimeShift: minTimeShift,
      maxTimeShift: maxTimeShift,
      targetStopEvents: null,
      targetStop: targetStop ?? null
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
    
    const prevSE = node.side == "dep" && node.stop.arrTime == node.stop.depTime ? 
      this.train.getPreviousStopEvent(node.stop.id, "arr") :
      this.train.getPreviousStopEvent(node.stop.id, node.side);
    const nextSE = node.side == "arr" && node.stop.arrTime == node.stop.depTime ?
       this.train.getNextStopEvent(node.stop.id, "dep") :
       this.train.getNextStopEvent(node.stop.id, node.side);
    
    this.dragState = {
      t0: node.time,
      sx0: konvaEvent.evt.screenX,
      y0: node.y,
      minTimeShift: prevSE ? prevSE.time - node.time : -86400,
      maxTimeShift: nextSE ? nextSE.time - node.time : 86400,
      targetStopEvents: node.stop.arrTime == node.stop.depTime ?
        [ { stop: node.stop, side: "arr", time: node.stop.arrTime }, { stop: node.stop, side: "dep", time: node.stop.depTime } ] :
        [ node ],
      targetStop: node.stop
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
      if (this.dragState.targetStop) {
        const mouseRelY = this.diagram.getRelYByY(event.clientY);
        const targetStation = this.diagram.stations[this.dragState.targetStop.stationId];
        const mouseTrack = targetStation.tracks.find(t => Math.abs(t.relY - mouseRelY) < this.viewConfig.minHitWidth);
        if (mouseTrack) {
          this.dragState.targetStop.trackId = mouseTrack.id;
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
          this.dragState.targetStopEvents ??
          Object.values(this.viewState.trainSelections).flatMap(sel => this.diagram.trains[sel.trainId].getStopEvents(sel.stopRange));
        for (const se of targets) {
          const newTime = se.time + this.viewState.trainPathDragState.timeShift;
          if (se.side == "arr") {
            se.stop.arrTime = newTime;
          } else {
            se.stop.depTime = newTime;
          }
        }
      } else {
        for (const sel of Object.values(this.viewState.trainSelections)) {
          const targetTrain = this.diagram.trains[sel.trainId];
          const newStops: Stop[] = [];
          for (const se of targetTrain.getStopEvents(sel.stopRange)) {
            const time = se.time + this.viewState.trainPathDragState.timeShift;
            if (newStops.length > 0 && newStops[newStops.length - 1].stationId == se.stop.stationId) {
              newStops[newStops.length - 1].depTime = time;
            } else {
              const newStop = Stop.fromJSON({ 
                id: this.diagram.genId(), 
                stationId: se.stop.stationId, 
                trackId: se.stop.trackId, 
                arrTime: time, 
                depTime: time
              });
              newStops.push(newStop);
            }
          }
          const newTrain = Train.fromJSON({
            id: this.diagram.genId(),
            name: "",
            stops: newStops
          });
          this.$set(this.diagram.trains, newTrain.id, newTrain);
          this.$delete(this.viewState.trainSelections, sel.trainId);
          this.$set(this.viewState.trainSelections, newTrain.id, { trainId: newTrain.id, stopRange: null });
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
