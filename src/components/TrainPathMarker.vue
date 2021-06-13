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
    return n.stev.station.expanded ? n.vSide == "track" : n.vSide != "track";
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
    const prevStev = thisStev.prev;
    const nextStev = thisStev.next;
    if (prevStev && prevStev.track != thisStev.track && (!nextStev || nextStev.track == thisStev.track)) {
      const thisRelY = prevStev.station.mileage < thisStev.station.mileage ? thisStev.station.topRelY : thisStev.station.bottomRelY;
      const prevRelY = prevStev.station.mileage < thisStev.station.mileage ? prevStev.station.bottomRelY : prevStev.station.topRelY;
      const x = thisRelY == prevRelY ? 0:
        -this.viewConfig.markerLabelLineHeight *
        ((thisStev.time - prevStev.time) * this.diagram.config.xScale) /
        Math.abs(thisRelY - prevRelY);
      return {
        x: Math.max(x, -this.viewConfig.markerLabelMaxDistance),
        y: prevStev.station.mileage < thisStev.station.mileage ? 0 : this.viewConfig.markerLabelLineHeight
      };
    }

    return {
      x: 0,
      y: nextStev && nextStev.station.mileage < thisStev.station.mileage || prevStev && prevStev.station.mileage > thisStev.station.mileage ? 0 : this.viewConfig.markerLabelLineHeight,
    };
  }

  onRectMouseMove(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const event = konvaEvent.evt;
    if (!this.viewState.pointerPreciseState && !this.viewState.pointerDragging && !this.viewState.drawingState) {
      const station = this.trainPathNode.stev.station;
      const track = this.trainPathNode.vSide == "track" ? 
        this.trainPathNode.stev.track : this.trainPathNode.vSide;
      this.viewState.pointerTargetLine = { station, track };
      this.viewState.pointerScreenX = event.screenX;
      this.viewState.pointerTime = this.trainPathNode.time;
      this.viewState.pointerY = this.trainPathNode.y;
    }
  }

  onRectDoubleClick(): void {
    if (this.viewConfig.editMode) {
      if (!this.viewState.drawingState) {
        const n = this.trainPathNode;
        if (!n.stev.prev) {
          this.viewState.drawingState = {
            train: n.train,
            lastStev: n.stev,
            direction: -1,
            stableEnd: n.stev,
            floating: null
          };
          this.viewState.trainSelections[n.train.id].stevRange = null;
        } else if (!n.stev.next) {
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
