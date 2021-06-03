<template>
  <input v-model="targetTrack.name" v-show="viewState.trackNameInputTarget" :style="style" @keypress.enter="onComplete" @blur="onComplete">
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Track from "@/data/Track";
import ViewState from "@/data/ViewState";

@Component
export default class TrackNameInput extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;

  get targetTrack(): Track | Record<string, never> {
    const tar = this.viewState.trackNameInputTarget;
    return tar ? (this.diagram.stations[tar.stationId].tracks.find(t => t.id == tar.trackId) ?? {}) : {};
  }

  get style(): unknown {
    return this.viewState.trackNameInputTarget ?
      {
        left: `${this.diagram.config.stationLabelLeftMargin + this.diagram.config.trackLabelLeftMargin}px`,
        top: `${this.diagram.getYByRelY(this.targetTrack.relY) - this.diagram.config.stationLabelFontSize - 4}px`,
        width: `${this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelLeftMargin - this.diagram.config.trackLabelLeftMargin - this.diagram.config.stationLabelRightMargin}px`,
        height: `${this.diagram.config.stationLabelFontSize + 4}px`,
        paddingTop: "2px",
        lineHeight: `${this.diagram.config.stationLabelFontSize}px`,
        border: "none",
        fontSize: `${this.diagram.config.stationLabelFontSize}px`,
      } : {};
  }

  onComplete(): void {
    this.viewState.trackNameInputTarget = null;
  }
}
</script>

<style scoped lang="scss">
</style>
