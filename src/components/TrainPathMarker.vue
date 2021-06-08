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
    const isLastStop = n.stop.id == n.train.stops[n.train.stops.length - 1].id;
    return (n.vSide == "top" || n.vSide == "bottom") &&
      ((isLastStop && n.side == "arr") || (!isLastStop && (n.side == "dep" || n.stop.arrTime != n.stop.depTime)));
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
    if (this.trainPathNode.side == "arr") {
      const prevSE = this.trainPathNode.train.getPreviousStopEvent(this.trainPathNode.stop.id, "arr");
      if (prevSE) {
        const thisTime = this.trainPathNode.side  == "arr" ? this.trainPathNode.stop.arrTime : this.trainPathNode.stop.depTime;
        const thisSta = this.diagram.stations[this.trainPathNode.stop.stationId];
        const prevSta = this.diagram.stations[prevSE.stop.stationId];
        const thisRelY = prevSta.mileage < thisSta.mileage ? thisSta.topRelY : thisSta.bottomRelY;
        const prevRelY = prevSta.mileage < thisSta.mileage ? prevSta.bottomRelY : prevSta.topRelY;
        const x = -this.viewConfig.markerLabelLineHeight *
          ((thisTime - prevSE.time) * this.diagram.config.xScale) /
          Math.abs(thisRelY - prevRelY);
        return {
          x: Math.max(x, -this.viewConfig.markerLabelMaxDistance),
          y: prevSta.mileage < thisSta.mileage ? 0 : this.viewConfig.markerLabelLineHeight
        };
      }
    }
    const dir = this.diagram.getTrainPathDirection(this.trainPathNode.train.id, this.trainPathNode.stop.id, this.trainPathNode.side);
    return {
      x: 0,
      y: dir < 0 || (dir == 0 && this.trainPathNode.side == "arr") ? 0 : this.viewConfig.markerLabelLineHeight
    };
  }

  onRectMouseMove(konvaEvent: KonvaEventObject<MouseEvent>): void {
    const event = konvaEvent.evt;
    if (!this.viewState.pointerPreciseState && !this.viewState.pointerDragging && !this.viewState.drawingState) {
      const station = this.diagram.stations[this.trainPathNode.stop.stationId];
      const track = this.trainPathNode.vSide == "track" ? 
        (station.tracks.find(t => t.id == this.trainPathNode.stop.trackId) ?? "top") :
        this.trainPathNode.vSide;
      this.viewState.pointerTargetLine = { station, track };
      this.viewState.pointerScreenX = event.screenX;
      this.viewState.pointerTime = this.trainPathNode.time;
      this.viewState.pointerY = this.trainPathNode.y;
      this.viewState.pointerOnMarker = true;
    }
  }

  onRectDoubleClick(): void {
    if (this.viewState.editMode && !this.viewState.drawingState) {
      const n = this.trainPathNode;
      if (n.stop.id == n.train.stops[0].id && (n.side == "arr" || n.stop.arrTime == n.stop.depTime)) {
        this.viewState.drawingState = { trainId: n.train.id, lastStopId: n.stop.id, direction: -1 };
        this.viewState.trainSelections[n.train.id].stopRange = null;
      } else if (n.stop.id == n.train.stops[n.train.stops.length - 1].id && (n.side == "dep" || n.stop.arrTime == n.stop.depTime)) {
        this.viewState.drawingState = { trainId: n.train.id, lastStopId: n.stop.id, direction: 1 };
        this.viewState.trainSelections[n.train.id].stopRange = null;
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
