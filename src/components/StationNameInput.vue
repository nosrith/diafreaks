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
  private get viewState() { return this.context.state; }

  private get targetStation(): Station | Record<string, never> {
    return this.viewState.stationNameInputTarget ?? {};
  }

  private get style(): unknown {
    return {
      left: `${this.diagram.config.stationLabelLeftMargin}px`,
      top: `${this.context.getYByRelY(this.targetStation.topRelY) - this.diagram.config.stationLabelFontSize - 4}px`,
      width: `${this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelLeftMargin - this.diagram.config.stationLabelRightMargin}px`,
      height: `${this.diagram.config.stationLabelFontSize + 4}px`,
      paddingTop: "2px",
      lineHeight: `${this.diagram.config.stationLabelFontSize}px`,
      border: "none",
      fontSize: `${this.diagram.config.stationLabelFontSize}px`,
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
