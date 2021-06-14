<template>
  <input :value="targetTrack.name" v-show="viewState.trackNameInputTarget" :style="style" @keypress.enter="onComplete" @blur="onComplete">
</template>

<script lang="ts">
import { Component, Inject, InjectReactive, Vue } from "vue-property-decorator";
import HistoryManager from "@/HistoryManager";
import Diagram from "@/data/Diagram";
import Track from "@/data/Track";
import ViewState from "@/data/ViewState";

@Component
export default class TrackNameInput extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Inject() historyManager!: HistoryManager;

  get targetTrack(): Track | Record<string, never> {
    return this.viewState.trackNameInputTarget ?? {};
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
    const targetTrack = this.targetTrack;
    const name0 = targetTrack.name;
    const name1 = (this.$el as HTMLInputElement).value;
    targetTrack.name = name1;
    this.historyManager.push({
      undo: () => { targetTrack.name = name0; },
      redo: () => { targetTrack.name = name1; }
    });
    this.viewState.trackNameInputTarget = null;
  }
}
</script>

<style scoped lang="scss">
</style>
