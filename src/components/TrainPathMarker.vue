<template>
  <v-group>
    <v-rect
      :config="rectConfig"
      @click="$emit('click', $event, trainPathNode)"
      @mousemove="onRectMouseMove"
      @mousedown="$emit('mousedown', $event, trainPathNode)"
      @dblclick="onRectDoubleClick"
    ></v-rect>
    <v-text v-if="labelEnabled" :config="labelConfig"></v-text>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import { getTimeText } from "@/utils";
import DiagramViewContext from "@/data/DiagramViewContext";
import TrainPathNode from "@/data/TrainPathNode";

@Component
export default class TrainPathMarker extends Vue {
  @InjectReactive() context!: DiagramViewContext;
  private get diagram() {
    return this.context.diagram;
  }
  private get viewConfig() {
    return this.context.config;
  }
  private get viewState() {
    return this.context.state;
  }
  @Prop() trainPathNode!: TrainPathNode;

  get rectConfig(): unknown {
    const width =
      this.viewConfig.selectedTrainPathMarkerWidth * this.context.subScale;
    return {
      x: this.context.getXByTime(this.trainPathNode.time) - width * 0.5,
      y: this.context.getYByRelY(this.trainPathNode.relY) - width * 0.5,
      width: width,
      height: width,
      fill:
        this.trainPathNode.stev.train.color || this.viewConfig.trainPathColor,
    };
  }

  get labelEnabled(): boolean {
    const n = this.trainPathNode;
    return (
      n.phase != "track" ||
      !(
        n.stev.station.expanded &&
        ((n.stev.prev && n.stev.prev.station != n.stev.station) ||
          (n.stev.next && n.stev.next.station != n.stev.station))
      )
    );
  }

  get labelConfig(): unknown {
    const labelPosition = this.getLabelPosition();
    return {
      x:
        this.context.getXByTime(this.trainPathNode.time) +
        labelPosition.x -
        this.viewConfig.markerLabelFontSize * this.context.subScale * 8,
      y:
        this.context.getYByRelY(this.trainPathNode.relY) +
        labelPosition.y -
        this.viewConfig.markerLabelLineHeight * this.context.subScale,
      width: this.viewConfig.markerLabelFontSize * this.context.subScale * 8,
      height: this.viewConfig.markerLabelLineHeight * this.context.subScale,
      text: getTimeText(
        this.trainPathNode.time,
        this.viewState.pointerPreciseState != null && this.viewState.trainPathDragState != null
      ),
      fontSize: this.viewConfig.pointerLabelFontSize * this.context.subScale,
      fontFamily: this.viewConfig.fontFamily,
      fill:
        this.trainPathNode.stev.train.color || this.viewConfig.trainPathColor,
      align: "right",
      verticalAlign: "bottom",
      listening: false,
    };
  }

  getLabelPosition(): { x: number; y: number } {
    const thisStev = this.trainPathNode.stev;
    const prevStev = thisStev.prev;
    const nextStev = thisStev.next;
    if (
      prevStev &&
      prevStev.track != thisStev.track &&
      (this.trainPathNode.phase == "arr" || !nextStev || nextStev.track == thisStev.track)
    ) {
      const thisRelY =
        prevStev.station.mileage < thisStev.station.mileage
          ? thisStev.station.topRelY
          : thisStev.station.bottomRelY;
      const prevRelY =
        prevStev.station.mileage < thisStev.station.mileage
          ? prevStev.station.bottomRelY
          : prevStev.station.topRelY;
      const x =
        thisRelY == prevRelY
          ? 0
          : (-this.viewConfig.markerLabelLineHeight *
              ((thisStev.time - prevStev.time) * this.context.xPhysScale)) /
            Math.abs(thisRelY - prevRelY);
      return {
        x: Math.max(x, -this.viewConfig.markerLabelMaxDistance),
        y:
          prevStev.station.mileage < thisStev.station.mileage
            ? 0
            : this.viewConfig.markerLabelLineHeight * this.context.subScale,
      };
    }

    return {
      x: 0,
      y:
        (nextStev && nextStev.station.mileage < thisStev.station.mileage) ||
        (prevStev && prevStev.station.mileage > thisStev.station.mileage)
          ? 0
          : this.viewConfig.markerLabelLineHeight * this.context.subScale,
    };
  }

  onRectMouseMove(): void {
    this.viewState.pointerTargetTrainPath = {
      train: this.trainPathNode.stev.train,
      stevRange: { from: this.trainPathNode.stev, to: this.trainPathNode.stev },
    };
  }

  onRectDoubleClick(): void {
    if (this.viewState.editMode) {
      if (!this.viewState.drawingState) {
        const n = this.trainPathNode;
        if (!n.stev.next || !n.stev.prev) {
          this.viewState.drawingState = {
            train: n.stev.train,
            lastStev: n.stev,
            direction: !n.stev.next && !n.stev.prev ? 0 : !n.stev.next ? 1 : -1,
            stableEnd: n.stev,
            floating: null,
          };
          this.viewState.trainSelections[n.stev.train.id].stevRange = null;
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
