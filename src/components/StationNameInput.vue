<template>
  <input :value="targetStation.name" v-show="viewState.stationNameInputTarget" :style="style" @keypress.enter="onComplete" @blur="onComplete">
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Station from "@/data/Station";

@Component
export default class StationNameInput extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }

  $el!: HTMLInputElement;

  private get targetStation(): Station | Record<string, never> {
    return this.viewState.stationNameInputTarget ?? {};
  }

  private get style(): unknown {
    return {
      left: `${this.viewConfig.stationLabelLeftMargin * this.context.subScale}px`,
      top: `${this.context.getYByRelY(this.targetStation.topRelY) - this.viewConfig.stationLabelFontSize * this.context.subScale - 4}px`,
      width: `${(this.diagram.config.leftPaneWidth - this.viewConfig.stationLabelLeftMargin - this.viewConfig.stationLabelRightMargin) * this.context.subScale}px`,
      height: `${this.viewConfig.stationLabelFontSize * this.context.subScale + 4}px`,
      paddingTop: "2px",
      lineHeight: `${this.viewConfig.stationLabelFontSize * this.context.subScale}px`,
      border: "none",
      fontSize: `${this.viewConfig.stationLabelFontSize * this.context.subScale}px`,
    };
  }

  private onComplete(): void {
    const targetStation = this.targetStation;
    const name0 = this.targetStation.name;
    const name1 = (this.$el as HTMLInputElement).value;
    if (name0 != name1) {
      targetStation.name = name1;
      this.context.history.push({
        this: this,
        undo: () => { targetStation.name = name0; },
        redo: () => { targetStation.name = name1; }
      });
    }
    this.viewState.stationNameInputTarget = null;
  }
}
</script>

<style scoped lang="scss">
</style>
