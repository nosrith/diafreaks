<template>
  <v-group>
    <v-rect :config="rectConfig" @click="$emit('click', $event, trainPathNode)" @mousemove="onRectMouseMove" @mousedown="$emit('mousedown', $event, trainPathNode)" @dblclick="onRectDoubleClick"></v-rect>
    <v-text v-if="labelEnabled" :config="labelConfig"></v-text>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import { KonvaEventObject } from "konva/types/Node";
import { getTimeText } from "@/utils";
import Diagram from "@/data/Diagram";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";
import TrainPathNode from "@/data/TrainPathNode";

@Component
export default class TrainPathMarker extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Prop() trainPathNode!: TrainPathNode;

  get rectConfig(): unknown {
    return {
      x: this.trainPathNode.x - this.viewConfig.selectedTrainPathMarkerWidth * 0.5,
      y: this.trainPathNode.y - this.viewConfig.selectedTrainPathMarkerWidth * 0.5,
      width: this.viewConfig.selectedTrainPathMarkerWidth,
      height: this.viewConfig.selectedTrainPathMarkerWidth,
      fill: this.viewConfig.selectedTrainPathMarkerColor,
    };
  }

  get labelEnabled(): boolean {
    const n = this.trainPathNode;
    const station = this.diagram.stations[n.stev.stationId];
    return station.expanded ? n.vSide == "track" : n.vSide != "track";
  }

  get labelConfig(): unknown {
    const labelPosition = this.getLabelPosition();
    return {
      x: this.trainPathNode.x + labelPosition.x - this.viewConfig.markerLabelFontSize * 8,
      y: this.trainPathNode.y + labelPosition.y - this.viewConfig.markerLabelLineHeight,
      width: this.viewConfig.markerLabelFontSize * 8,
      height: this.viewConfig.markerLabelLineHeight,
      text: getTimeText(this.trainPathNode.time, this.viewState.pointerPreciseState != null),
      fontSize: this.viewConfig.pointerLabelFontSize,
      fontFamily: this.diagram.config.fontFamily,
      fill: this.viewConfig.markerLabelColor,
      align: "right",
      verticalAlign: "bottom",
      listening: false,
    }
  }

  getLabelPosition(): { x: number, y: number } {
    const thisStev = this.trainPathNode.stev;
    const prevStev = this.trainPathNode.train.getPreviousStopEvent(thisStev);
    const nextStev = this.trainPathNode.train.getNextStopEvent(thisStev);
    const thisSta = this.diagram.stations[thisStev.stationId];
    if (prevStev && prevStev.trackId != thisStev.trackId && (!nextStev || nextStev.trackId == thisStev.trackId)) {
      const prevSta = this.diagram.stations[prevStev.stationId];
      const thisRelY = prevSta.mileage < thisSta.mileage ? thisSta.topRelY : thisSta.bottomRelY;
      const prevRelY = prevSta.mileage < thisSta.mileage ? prevSta.bottomRelY : prevSta.topRelY;
      const x = thisRelY == prevRelY ? 0:
        -this.viewConfig.markerLabelLineHeight *
        ((thisStev.time - prevStev.time) * this.diagram.config.xScale) /
        Math.abs(thisRelY - prevRelY);
      return {
        x: Math.max(x, -this.viewConfig.markerLabelMaxDistance),
        y: prevSta.mileage < thisSta.mileage ? 0 : this.viewConfig.markerLabelLineHeight
      };
    }

    const prevSta = prevStev ? this.diagram.stations[prevStev.stationId] : undefined;
    const nextSta = nextStev ? this.diagram.stations[nextStev.stationId] : undefined;
    return {
      x: 0,
      y: nextSta && nextSta.mileage < thisSta.mileage || prevSta && prevSta.mileage > thisSta.mileage ? 0 : this.viewConfig.markerLabelLineHeight,
    };
  }

  onRectMouseMove(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const event = konvaEvent.evt;
    if (!this.viewState.pointerPreciseState && !this.viewState.pointerDragging && !this.viewState.drawingState) {
      const station = this.diagram.stations[this.trainPathNode.stev.stationId];
      const track = this.trainPathNode.vSide == "track" ? 
        (station.tracks.find(t => t.id == this.trainPathNode.stev.trackId) ?? "top") :
        this.trainPathNode.vSide;
      this.viewState.pointerTargetLine = { station, track };
      this.viewState.pointerScreenX = event.screenX;
      this.viewState.pointerTime = this.trainPathNode.time;
      this.viewState.pointerY = this.trainPathNode.y;
      this.viewState.pointerOnMarker = true;
    }
  }

  onRectDoubleClick(): void {
    if (this.viewState.editMode) {
      if (!this.viewState.drawingState) {
        const n = this.trainPathNode;
        if (!n.train.getPreviousStopEvent(n.stev)) {
          this.viewState.drawingState = {
            train: n.train,
            lastStev: n.stev,
            direction: -1,
            stableEnd: n.stev,
            floating: null
          };
          this.viewState.trainSelections[n.train.id].stevRange = null;
        } else if (!n.train.getNextStopEvent(n.stev)) {
          this.viewState.drawingState = {
            train: n.train,
            lastStev: n.stev,
            direction: 1,
            stableEnd: n.stev,
            floating: null
          };
          this.viewState.trainSelections[n.train.id].stevRange = null;
        }
      } else {
        this.viewState.drawingState = null;
        this.viewState.trainSelections = {};
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
