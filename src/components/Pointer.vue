<template>
  <v-group v-if="pointerEnabled">
    <v-rect :config="rectConfig"></v-rect>
    <v-text :config="labelConfig"></v-text>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import { getTimeText } from "@/utils";
import DiagramViewContext from "@/data/DiagramViewContext";

@Component
export default class TrainPathGroup extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }

  private get pointerEnabled(): unknown {
    return this.viewState.pointerTargetLine && !this.viewState.pointerTargetTrainPath &&
      !this.viewState.trainPathDragState && !this.viewState.drawingState;
  }

  private get rectConfig(): unknown {
    const width = this.viewState.drawingState ? this.viewConfig.selectedTrainPathMarkerWidth : this.viewConfig.pointerWidth;
    return {
      x: this.context.getXByTime(this.viewState.pointerTime) - width * 0.5,
      y: this.viewState.pointerY - width * 0.5,
      width: width,
      height: width,
      fill: this.viewConfig.pointerColor,
      listening: false,
    };
  }

  private get labelConfig(): unknown {
    const time = this.viewState.pointerTime >= 0 ? 
      this.viewState.pointerTime : 
      this.viewState.pointerTime + Math.ceil(-this.viewState.pointerTime / 3600) * 3600;
    return {
      x: this.context.getXByTime(this.viewState.pointerTime),
      y: this.viewState.pointerY - this.viewConfig.pointerLabelFontSize,
      height: this.viewConfig.pointerLabelFontSize,
      text: getTimeText(time, this.viewState.pointerPreciseState != null),
      fontSize: this.viewConfig.pointerLabelFontSize,
      fontFamily: this.viewConfig.fontFamily,
      fill: this.viewConfig.pointerColor,
      align: "left",
      verticalAlign: "bottom",
      listening: false,
    }
  }
}
</script>

<style scoped lang="scss">
</style>
