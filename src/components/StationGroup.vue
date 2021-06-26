<template>
  <v-group>
    <v-group v-if="isTopLineIntersectingPlotPane">
      <v-line :config="topLineConfig"></v-line>
      <v-text v-for="c in labelCharacters" :key="c.key" :config="c"></v-text>
      <v-rect :config="labelRectConfig" @click="onStationLabelClick" @mousedown="onStationLabelMouseDown"></v-rect>
    </v-group>
    <v-line v-if="station.expanded && isBottomLineIntersectingPlotPane" :config="bottomLineConfig"></v-line>
    <template v-if="station.expanded">
      <track-group v-for="t in station.tracks" :key="`track-${station.id}-${t.id}`" :station="station" :track="t" v-on="$listeners"></track-group>
    </template>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Station from "@/data/Station";
import TrackGroup from "./TrackGroup.vue";
import { KonvaEventObject } from "konva/types/Node";

@Component({
  components: {
    TrackGroup
  },
})
export default class StationGroup extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }
  @Prop() private station!: Station;

  private dragState: { sy0: number, mileage0: number, dragging: boolean } | null = null;

  private get topLineConfig(): unknown {
    return {
      points: [
        0, 
        this.context.getYByRelY(this.station.topRelY), 
        this.viewState.viewWidth, 
        this.context.getYByRelY(this.station.topRelY)
      ],
      stroke: this.viewConfig.stationLineColor,
      strokeWidth: this.viewConfig.stationLineWidth,
      listening: false,
    }
  }

  private get bottomLineConfig(): unknown {
    return {
      points: [
        0, 
        this.context.getYByRelY(this.station.bottomRelY), 
        this.viewState.viewWidth, 
        this.context.getYByRelY(this.station.bottomRelY)
      ],
      stroke: this.viewConfig.stationLineColor,
      strokeWidth: this.viewConfig.stationLineWidth,
      listening: false,
    }
  }

  private get labelRectConfig(): unknown {
    return {
      id: `station-label-${this.station.id}`,
      x: this.viewConfig.stationLabelLeftMargin,
      y: this.context.getYByRelY(this.station.topRelY) - this.viewConfig.stationLabelFontSize,
      width: this.diagram.config.leftPaneWidth - this.viewConfig.stationLabelLeftMargin - this.viewConfig.stationLabelRightMargin,
      height: this.viewConfig.stationLabelFontSize,
    };
  }

  private get labelCharacters(): unknown {
    const widthForChars = this.diagram.config.leftPaneWidth - this.viewConfig.stationLabelLeftMargin - this.viewConfig.stationLabelRightMargin - this.viewConfig.stationLabelFontSize;
    const stationName = this.station.name;
    const charSpan = stationName.length > 1 ? widthForChars / (stationName.length - 1) : 0;
    return Array.from(stationName).map((c, index) => {
      return {
        key: `station-label-${this.station.id}-${index}`,
        x: stationName.length > 1 ? 
            this.viewConfig.stationLabelLeftMargin + index * charSpan :
            this.viewConfig.stationLabelLeftMargin + widthForChars * 0.5,
        y: this.context.getYByRelY(this.station.topRelY) - this.viewConfig.stationLabelFontSize,
        height: this.viewConfig.stationLabelFontSize,
        text: c,
        fontSize: this.viewConfig.stationLabelFontSize,
        fontFamily: this.viewConfig.fontFamily,
        fill: this.viewConfig.stationLabelColor,
        align: "left",
        verticalAlign: "bottom",
      }
    });
  }

  private get isTopLineIntersectingPlotPane(): boolean {
    return this.context.getYByRelY(this.station.topRelY) >= this.viewConfig.topPaneHeight && 
      this.context.getYByRelY(this.station.topRelY) < this.viewState.viewHeight;
  }

  private get isBottomLineIntersectingPlotPane(): boolean {
    return this.context.getYByRelY(this.station.bottomRelY) >= this.viewConfig.topPaneHeight && 
      this.context.getYByRelY(this.station.bottomRelY) < this.viewState.viewHeight;
  }

  private onStationLabelClick(): void {
    if (this.viewState.editMode && !this.viewState.busy && !this.dragState?.dragging) {
      this.viewState.stationNameInputTarget = this.station;
      this.$emit("stationNameInputStart");
    }
  }

  private onStationLabelMouseDown(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (this.viewState.editMode && !this.viewState.inputEnabled) {
      this.dragState = {
        sy0: konvaEvent.evt.screenY,
        mileage0: this.station.mileage,
        dragging: false,
      };
      window.addEventListener("mousemove", this.onWindowMouseMove);
      window.addEventListener("mouseup", this.onWindowMouseUp);
    }
  }

  private onWindowMouseMove(event: MouseEvent): void {
    if (this.dragState) {
      if (Math.abs(event.screenY - this.dragState.sy0) > 1) {
        this.dragState.dragging = true;
      }
      if (this.dragState.dragging) {
        this.station.mileage = this.dragState.mileage0 + (event.screenY - this.dragState.sy0) / this.diagram.config.yScale;
        this.context.updateY();
      }
    }
  }

  private onWindowMouseUp(event: MouseEvent): void {
    if (this.dragState) {
      window.removeEventListener("mousemove", this.onWindowMouseMove);
      window.removeEventListener("mouseup", this.onWindowMouseUp);
      this.onWindowMouseMove(event);

      if (this.dragState.dragging) {
        const mileage0 = this.dragState.mileage0;
        const mileage1 = this.station.mileage;
        this.context.history.push({
          this: this,
          undo: () => { this.station.mileage = mileage0; },
          redo: () => { this.station.mileage = mileage1; }
        });
      }

      this.dragState = null;
    }
  }
}
</script>

<style scoped lang="scss">
</style>
