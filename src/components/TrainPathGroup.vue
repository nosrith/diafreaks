<template>
  <v-group>
    <v-text :config="trainNameLabelConfig" @click="onTrainNameLabelClick"></v-text>
    <v-line :config="regularTrainPathConfig" @click="onTrainPathClick" @mousemove="onTrainPathMouseMove" @tap="onTrainPathTap"></v-line>
    <template v-if="selectedTrainPathEnabled">
      <v-line :config="selectedTrainPathConfig" @click="onSelectedTrainPathClick" @dblclick="onSelectedTrainPathDoubleClick" @mousedown="onSelectedTrainPathMouseDown" @mousemove="onSelectedTrainPathMouseMove"></v-line>
      <train-path-marker v-for="n in selectedTrainPathNodes" :key="`marker-${train.id}-${n.stev.privateId}-${n.phase}`" :trainPathNode="n" @click="onMarkerClick" @mousedown="onMarkerMouseDown"></train-path-marker>
    </template>
  </v-group>
</template>

<script lang="ts">
import { Component, Inject, InjectReactive, Prop, Vue } from "vue-property-decorator";
import { KonvaEventObject } from "konva/types/Node";
import { getTextWidth } from "@/utils";
import HistoryManager from "@/HistoryManager";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import StopEvent, { StopEventRange } from "@/data/StopEvent";
import Track from "@/data/Track";
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
  @Inject() historyManager!: HistoryManager;
  @Prop() train!: Train;

  dragState: { 
    t0: number, 
    y0: number,
    sx0: number, 
    sy0: number,
    track0: Track | null,
    minTimeShift: number,
    maxTimeShift: number,
    changeTimeTargets: StopEvent[] | null,
    changeTrackTargets: StopEvent[] | null,
  } | null = null;

  get trainNameLabelConfig(): unknown {
    return {
      text: this.trainNameLabelText, 
      ...this.trainNameLabelRect,
      fontSize: this.diagram.config.trainNameLabelFontSize,
      fontFamily: this.diagram.config.fontFamily,
      fill: this.diagram.config.trainPathColor,
    };
  }

  get trainNameLabelText(): string {
    return this.train.name != "" ? this.train.name : `Train #${this.train.id}`;
  }

  get trainNameLabelRect(): { x: number, y: number, width: number, height: number, rotation: number } {
    const text = this.trainNameLabelText;
    const textWidth = getTextWidth(text, this.diagram.config.fontFamily, this.diagram.config.trainNameLabelFontSize);
    const firstNodeRunning = this.trainPathNodes.find((n, i) => i < this.trainPathNodes.length - 1 && this.trainPathNodes[i + 1].stev.station != n.stev.station);
    if (firstNodeRunning) {
      let forwardIndex = this.trainPathNodes.indexOf(firstNodeRunning) + 1;
      for (; forwardIndex < this.trainPathNodes.length - 1; ++forwardIndex) {
        const forwardNode = this.trainPathNodes[forwardIndex];
        const forwardDist = Math.hypot(forwardNode.x - firstNodeRunning.x, forwardNode.y - firstNodeRunning.y);
        if (forwardDist >= textWidth) break;
      }
      const forwardNode = this.trainPathNodes[forwardIndex];

      const segDistX = forwardNode.x - firstNodeRunning.x;
      const segDistY = forwardNode.y - firstNodeRunning.y;
      const segDist = Math.hypot(segDistX, segDistY);
      const x = forwardNode.relY >= firstNodeRunning.relY ?
        segDistY / segDist * this.diagram.config.trainNameLabelFontSize + firstNodeRunning.x : 
        -segDistY / segDist * (this.diagram.config.trainNameLabelLineHeight - this.diagram.config.trainNameLabelFontSize) + firstNodeRunning.x;
      const y = forwardNode.relY >= firstNodeRunning.relY ?
        -segDistX / segDist * this.diagram.config.trainNameLabelFontSize + firstNodeRunning.y : 
        segDistX / segDist * (this.diagram.config.trainNameLabelLineHeight - this.diagram.config.trainNameLabelFontSize) + firstNodeRunning.y;
      const rotation = Math.atan2(segDistY, segDistX) / Math.PI * 180;
      return { 
        x, y, rotation,
        width: textWidth,
        height: this.diagram.config.trainNameLabelFontSize,
      };
    } else {
      return {
        x: this.trainPathNodes[0].x,
        y: this.trainPathNodes.reduce((v, n) => Math.min(v, n.y), this.trainPathNodes[0].y) - this.diagram.config.trainNameLabelFontSize,
        rotation: 0,
        width: textWidth,
        height: this.diagram.config.trainNameLabelFontSize,
      };
    }
  }

  get regularTrainPathConfig(): unknown {
    return {
      points: this.regularTrainPathNodes.flatMap(n => [n.x, n.y]),
      stroke: this.diagram.config.trainPathColor,
      opacity: Object.keys(this.viewState.trainSelections).length > 0 ? this.viewConfig.unselectedTrainPathOpacity : 1,
      strokeWidth: this.diagram.config.trainPathWidth,
      hitStrokeWidth: Math.max(this.diagram.config.trainPathWidth, this.viewConfig.minHitWidth * 2),
    }
  }

  get regularTrainPathNodes(): (TrainPathNode & { x: number, y: number })[] {
    const nodes = this.trainPathNodes;

    const dragState = this.viewState.trainPathDragState;
    const dragTarget = dragState?.targets[this.train.id];
    if (dragState && dragTarget && !this.viewState.controlKeyPressed) {
      let inRange = !dragTarget.stevRange;
      for (const node of nodes) {
        if (node.stev == dragTarget.stevRange?.from) inRange = true;
        if (inRange) node.time += dragState.timeShift;
        if (node.stev == dragTarget.stevRange?.to) inRange = false;
      }
    }

    return nodes;
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

  get selectedTrainPathNodes(): (TrainPathNode & { x: number, y: number })[] {
    const stevRange = this.viewState.trainSelections[this.train.id]?.stevRange;
    let inRange = !stevRange;
    const nodes = this.trainPathNodes.filter(n => {
      if (n.stev == stevRange?.from) inRange = true;
      const nInRange = inRange;
      if (n.stev == stevRange?.to) inRange = false;
      return nInRange;
    });

    const dragState = this.viewState.trainPathDragState;
    const dragTarget = dragState?.targets[this.train.id];
    if (dragState && dragTarget) {
      for (const node of nodes) {
        node.time += dragState.timeShift;
      }
    }

    return nodes;
  }

  get trainPathNodes(): (TrainPathNode & { x: number, y: number })[] {
    return this.train.getTrainPathNodes().map(n => { 
      return { ...n, x: this.diagram.getXByTime(n.time), y: this.diagram.getYByRelY(n.relY) };
    });
  }

  onTrainNameLabelClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (konvaEvent.target == konvaEvent.currentTarget && this.viewConfig.editMode) {
      this.viewState.trainNameInputTarget = {
        train: this.train,
        ...this.trainNameLabelRect,
      };
    }
  }

  onTrainPathMouseMove(): void {
    this.viewState.pointerTargetTrainPath = null;
  }

  onSelectedTrainPathMouseMove(konvaEvent: KonvaEventObject<MouseEvent>): void {
    this.viewState.pointerTargetTrainPath = { 
      train: this.train, 
      stevRange: this.getPointedStevRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY)
    };
  }

  onTrainPathClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const clickedStopRange = this.getPointedStevRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    this.changeTrainSelections(konvaEvent, clickedStopRange, false);
  }

  onSelectedTrainPathClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const clickedStopRange = this.getPointedStevRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    this.changeTrainSelections(konvaEvent, clickedStopRange, true);
  }

  onMarkerClick(konvaEvent: KonvaEventObject<MouseEvent>, trainPathNode: TrainPathNode): void {
    const clickedStevRange = { from: trainPathNode.stev, to: trainPathNode.stev };
    this.changeTrainSelections(konvaEvent, clickedStevRange, true);
  }

  changeTrainSelections(konvaEvent: KonvaEventObject<MouseEvent>, clickedStevRange: StopEventRange, clickSelected: boolean): void {
    if (!this.viewState.trainPathDragState?.dragging && !this.viewState.drawingState) {
      const sel = this.viewState.trainSelections[this.train.id];

      // Remove other trains if shift not pressed
      if (!konvaEvent.evt.shiftKey) {
        this.viewState.trainSelections = sel ? { [this.train.id]: sel } : {};
      }

      if (!sel) {
        this.$set(this.viewState.trainSelections, this.train.id, { train: this.train, stevRange: null });
      } else {
        const selectedStevRange = sel.stevRange;
        if (!selectedStevRange) {
          sel.stevRange = clickedStevRange;
        } else if (!konvaEvent.evt.shiftKey) {
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

  onTrainPathTap(): void {
    this.viewState.trainSelections = { [this.train.id]: { train: this.train, stevRange: null } };
  }

  getPointedStevRange(x: number, y: number): StopEventRange {
    if (this.train.stevs.length <= 2) {
      return { from: this.train.stevs[0], to: this.train.stevs[this.train.stevs.length - 1] };
    }

    // TODO: more precise detection
    for (let i = 0; i < this.train.stevs.length - 1; ++i) {
      const thisStev = this.train.stevs[i];
      const nextStev = this.train.stevs[i + 1];
      const leftX = this.diagram.getXByTime(thisStev.time) - this.viewConfig.minHitWidth;
      const rightX = this.diagram.getXByTime(nextStev.time) + this.viewConfig.minHitWidth;
      const topY = this.diagram.getYByRelY(Math.min(thisStev.track.relY, nextStev.track.relY)) - this.viewConfig.minHitWidth;
      const bottomY = this.diagram.getYByRelY(Math.max(thisStev.track.relY, nextStev.track.relY)) + this.viewConfig.minHitWidth;
      if (leftX < x && x < rightX && topY < y && y < bottomY) {
        return { from: thisStev, to: nextStev };
      }
    }
    return { from: this.train.stevs[0], to: this.train.stevs[this.train.stevs.length - 1] };
  }

  onSelectedTrainPathDoubleClick(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (this.viewConfig.editMode && !this.viewState.drawingState) {
      const targetTime = this.viewState.pointerTime;
      const nearestStation = this.getNearestStation(konvaEvent.evt.clientY);
      const nearestStev = this.getNearestStopEvent(targetTime);
      if (!(nearestStation == nearestStev.station && (nearestStev.prev?.track == nearestStev.track || nearestStev.next?.track == nearestStev.track))) {
        const index = this.train.stevs.findIndex(s => s.time > targetTime);
        const newStev = this.train.addNewStopEvent(new StopEvent(this.train, nearestStation.tracks[0], targetTime), index);
        this.viewState.trainSelections = { 
          [this.train.id]: {
            train: this.train,
            stevRange: { from: newStev, to: newStev }
          } 
        };
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
    if (!this.viewConfig.editMode) {
      return;
    }

    let minTimeShift = -86400;
    let maxTimeShift = 86400;
    for (const sel of Object.values(this.viewState.trainSelections)) {
      const stevRange = sel.stevRange;
      if (stevRange) {
        if (stevRange.from.prev) {
          minTimeShift = Math.max(minTimeShift, stevRange.from.prev.time - stevRange.from.time);
        }
        if (stevRange.to.next) {
          maxTimeShift = Math.min(maxTimeShift, stevRange.to.next.time - stevRange.to.time);
        }
      }
    }

    const clickedStevRange = this.getPointedStevRange(konvaEvent.evt.clientX, konvaEvent.evt.clientY);
    const changeTrackTargets = 
      clickedStevRange.from == clickedStevRange.to ? [ clickedStevRange.from ] : 
      clickedStevRange.from.track == clickedStevRange.to.track ? [ clickedStevRange.from, clickedStevRange.to ] :
      null;

    const firstNode = this.selectedTrainPathNodes[0];
    this.dragState = { 
      t0: firstNode.time, 
      y0: this.diagram.getYByRelY(firstNode.relY),
      sx0: konvaEvent.evt.screenX, 
      sy0: konvaEvent.evt.screenY,
      track0: changeTrackTargets ? changeTrackTargets[0].track : null,
      minTimeShift: minTimeShift,
      maxTimeShift: maxTimeShift,
      changeTimeTargets: null,
      changeTrackTargets: changeTrackTargets ?? null
    };
    this.viewState.trainPathDragState = {
      dragging: false,
      targets: this.viewState.trainSelections,
      timeShift: 0
    };
    window.addEventListener("mousemove", this.onWindowMouseMove);
    window.addEventListener("mouseup", this.onWindowMouseUp);
  }

  onMarkerMouseDown(konvaEvent: KonvaEventObject<MouseEvent>, node: TrainPathNode): void {
    if (!this.viewConfig.editMode) {
      return;
    }

    this.dragState = {
      t0: node.time,
      y0: this.diagram.getYByRelY(node.relY),
      track0: node.stev.track,
      sx0: konvaEvent.evt.screenX,
      sy0: konvaEvent.evt.screenY,
      minTimeShift: node.stev.prev ? node.stev.prev.time - node.time : -86400,
      maxTimeShift: node.stev.next ? node.stev.next.time - node.time : 86400,
      changeTimeTargets: [ node.stev ],
      changeTrackTargets: [ node.stev ]
    };
    this.viewState.trainPathDragState = {
      dragging: false,
      targets: { [node.stev.train.id]: { train: node.stev.train, stevRange: { from: node.stev, to: node.stev } } },
      timeShift: 0
    };
    window.addEventListener("mousemove", this.onWindowMouseMove);
    window.addEventListener("mouseup", this.onWindowMouseUp);
  }

  onWindowMouseMove(event: MouseEvent): void {
    if (this.dragState && this.viewState.trainPathDragState) {
      if (!this.viewState.trainPathDragState.dragging && Math.hypot(event.clientX - this.dragState.sx0, event.clientY - this.dragState.sy0) > 1) {
        this.viewState.trainPathDragState.dragging = true;
        this.viewState.pointerY = this.dragState.y0;
      }
      if (this.viewState.trainPathDragState.dragging) {
        if (!this.viewState.pointerPreciseState) {
          this.viewState.pointerTime = this.dragState.t0 + Math.floor((event.screenX - this.dragState.sx0) / this.diagram.config.xScale / 60) * 60;
        }
        this.viewState.trainPathDragState.timeShift = 
          !this.viewState.controlKeyPressed ?
            Math.min(this.dragState.maxTimeShift, Math.max(this.dragState.minTimeShift, this.viewState.pointerTime - this.dragState.t0)) :
            this.viewState.pointerTime - this.dragState.t0;
        if (this.dragState.changeTrackTargets) {
          const mouseRelY = this.diagram.getRelYByY(event.clientY);
          const targetStation = this.dragState.changeTrackTargets[0].station;
          const mouseTrack = targetStation.tracks.find(t => Math.abs(t.relY - mouseRelY) < this.viewConfig.minHitWidth);
          if (mouseTrack) {
            for (const stev of this.dragState.changeTrackTargets) {
              stev.track = mouseTrack;
            }
          }
        }
      }
    }
  }

  onWindowMouseUp(): void {
    if (this.dragState && this.viewState.trainPathDragState) {
      window.removeEventListener("mousemove", this.onWindowMouseMove);
      window.removeEventListener("mouseup", this.onWindowMouseUp);
      if (this.viewState.trainPathDragState.dragging) {
        if (this.dragState.changeTrackTargets && this.dragState.track0) {
          const targets = this.dragState.changeTrackTargets;
          const track0 = this.dragState.track0;
          const track1 = this.dragState.changeTrackTargets[0].track;
          if (track0 != track1) {
            this.historyManager.push({
              this: this,
              undo: () => { targets.forEach(stev => stev.track = track0); },
              redo: () => { targets.forEach(stev => stev.track = track1); }
            });
          }
        }

        const timeShift = this.viewState.trainPathDragState.timeShift;
        if (timeShift != 0) {
          if (!this.viewState.controlKeyPressed) {
            const targets = 
              this.dragState.changeTimeTargets ??
              Object.values(this.viewState.trainSelections).flatMap(sel => {
                return sel.stevRange ? sel.train.getStopEventsInRange(sel.stevRange) : sel.train.stevs;
              });
            targets.forEach(stev => stev.time += timeShift);
            this.historyManager.push({
              this: this,
              undo: () => { targets.forEach(stev => stev.time -= timeShift); },
              redo: () => { targets.forEach(stev => stev.time += timeShift); }
            });
          } else {
            const newTrains = Object.values(this.viewState.trainSelections).map(sel => {
              const srcTrain = sel.train;
              const srcStevs = sel.stevRange ? srcTrain.getStopEventsInRange(sel.stevRange) : srcTrain.stevs;
              const newTrain = this.diagram.addNewTrain(new Train(this.diagram.genId(), ""));
              for (const srcStev of srcStevs) {
                newTrain.addNewStopEvent(new StopEvent(newTrain, srcStev.track, srcStev.time + timeShift));
              }
              this.$delete(this.viewState.trainSelections, sel.train.id);
              this.$set(this.viewState.trainSelections, newTrain.id, { train: newTrain, stevRange: null });
              return newTrain;
            });
            this.historyManager.push({
              this: this,
              undo: () => { newTrains.forEach(train => this.diagram.removeTrain(train)); },
              redo: () => { newTrains.forEach(train => this.diagram.addNewTrain(train)); }
            });
          }
        }
      }
      this.viewState.trainPathDragState = null;
      this.dragState = null;
    }
  }
}
</script>

<style scoped lang="scss">
</style>
