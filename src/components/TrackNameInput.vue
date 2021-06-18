<template>
  <input :value="targetTrack.name" v-show="viewState.trackNameInputTarget" :style="style" @keypress.enter="onComplete" @blur="onComplete">
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Track from "@/data/Track";

@Component
export default class TrackNameInput extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }

  private get targetTrack(): Track | Record<string, never> {
    return this.viewState.trackNameInputTarget ?? {};
  }

  private get style(): unknown {
    return this.viewState.trackNameInputTarget ?
      {
        left: `${this.viewConfig.stationLabelLeftMargin + this.viewConfig.trackLabelLeftMargin}px`,
        top: `${this.context.getYByRelY(this.targetTrack.relY) - this.viewConfig.stationLabelFontSize - 4}px`,
        width: `${this.diagram.config.leftPaneWidth - this.viewConfig.stationLabelLeftMargin - this.viewConfig.trackLabelLeftMargin - this.viewConfig.stationLabelRightMargin}px`,
        height: `${this.viewConfig.stationLabelFontSize + 4}px`,
        paddingTop: "2px",
        lineHeight: `${this.viewConfig.stationLabelFontSize}px`,
        border: "none",
        fontSize: `${this.viewConfig.stationLabelFontSize}px`,
      } : {};
  }

  private onComplete(): void {
    const targetTrack = this.targetTrack;
    const name0 = targetTrack.name;
    const name1 = (this.$el as HTMLInputElement).value;
    if (name0 != name1) {
      targetTrack.name = name1;
      this.context.history.push({
        this: this,
        undo: () => { targetTrack.name = name0; },
        redo: () => { targetTrack.name = name1; }
      });
    }
    this.viewState.trackNameInputTarget = null;
  }
}
</script>

<style scoped lang="scss">
</style>
