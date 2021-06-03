<template>
  <v-group>
    <v-group v-if="isTopLineIntersectingTrainPathArea">
      <v-line :config="topLineConfig"></v-line>
      <v-text v-for="c in labelCharacters" :key="c.key" :config="c"></v-text>
      <v-rect :config="labelRectConfig" @click="onStationLabelClick"></v-rect>
    </v-group>
    <v-line v-if="station.expanded && isTopLineIntersectingTrainPathArea" :config="bottomLineConfig"></v-line>
    <template v-if="station.expanded">
      <track-group v-for="t in station.tracks" :key="`track-${station.id}-${t.id}`" :station="station" :track="t" v-on="$listeners"></track-group>
    </template>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";
import TrackGroup from "./TrackGroup.vue";

@Component({
  components: {
    TrackGroup
  },
})
export default class StationGroup extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Prop() station!: Station;

  get topLineConfig(): unknown {
    return {
      points: [
        0, 
        this.diagram.getYByRelY(this.station.topRelY), 
        this.viewState.viewWidth, 
        this.diagram.getYByRelY(this.station.topRelY)
      ],
      stroke: this.diagram.config.stationLineColor,
      strokeWidth: this.diagram.config.stationLineWidth,
      listening: false,
    }
  }

  get bottomLineConfig(): unknown {
    return {
      points: [
        0, 
        this.diagram.getYByRelY(this.station.bottomRelY), 
        this.viewState.viewWidth, 
        this.diagram.getYByRelY(this.station.bottomRelY)
      ],
      stroke: this.diagram.config.stationLineColor,
      strokeWidth: this.diagram.config.stationLineWidth,
      listening: false,
    }
  }

  get labelRectConfig(): unknown {
    return {
      id: `station-label-${this.station.id}`,
      x: this.diagram.config.stationLabelLeftMargin,
      y: this.diagram.getYByRelY(this.station.topRelY) - this.diagram.config.stationLabelFontSize,
      width: this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelLeftMargin - this.diagram.config.stationLabelRightMargin,
      height: this.diagram.config.stationLabelFontSize,
    };
  }

  get labelCharacters(): unknown {
    const widthForChars = this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelLeftMargin - this.diagram.config.stationLabelRightMargin - this.diagram.config.stationLabelFontSize;
    const charSpan = this.station.name.length > 1 ? widthForChars / (this.station.name.length - 1) : 0;
    return Array.from(this.station.name).map((c, index) => {
      return {
        key: `station-label-${this.station.id}-${index}`,
        x: this.station.name.length > 1 ? 
            this.diagram.config.stationLabelLeftMargin + index * charSpan :
            this.diagram.config.stationLabelLeftMargin + widthForChars * 0.5,
        y: this.diagram.getYByRelY(this.station.topRelY) - this.diagram.config.stationLabelFontSize,
        height: this.diagram.config.stationLabelFontSize,
        text: c,
        fontSize: this.diagram.config.stationLabelFontSize,
        fontFamily: this.diagram.config.fontFamily,
        fill: this.diagram.config.stationLabelColor,
        align: "left",
        verticalAlign: "bottom",
      }
    });
  }

  get isTopLineIntersectingTrainPathArea(): boolean {
    return this.diagram.getYByRelY(this.station.topRelY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.station.topRelY) < this.viewState.viewHeight;
  }

  get isBottomLineIntersectingTrainPathArea(): boolean {
    return this.diagram.getYByRelY(this.station.bottomRelY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.station.bottomRelY) < this.viewState.viewHeight;
  }

  onStationLabelClick(): void {
    if (this.viewState.editMode && !this.viewState.isInputEnabled) {
      this.viewState.stationNameInputTarget = { stationId: this.station.id };
      this.$emit("stationNameInputStart");
    }
  }
}
</script>

<style scoped lang="scss">
</style>
