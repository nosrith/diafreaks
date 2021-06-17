<template>
  <div :style="groupStyle">
    <input :value="targetTrain.name" v-show="viewState.trainNameInputTarget" :style="trainNameInputStyle" @keypress.enter="onComplete" @blur="onComplete">
  </div>
</template>

<script lang="ts">
import { Component, Inject, InjectReactive, Vue } from "vue-property-decorator";
import HistoryManager from "@/HistoryManager";
import Diagram from "@/data/Diagram";
import Train from "@/data/Train";
import ViewState from "@/data/ViewState";

@Component
export default class TrackNameInput extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Inject() historyManager!: HistoryManager;

  get targetTrain(): Train | Record<string, never> {
    return this.viewState.trainNameInputTarget?.train ?? {};
  }

  get groupStyle(): unknown {
    const state = this.viewState.trainNameInputTarget;
    return state ?
      {
        left: `${state.x}px`,
        top: `${state.y - this.diagram.config.stationLabelFontSize - 4}px`,
      } : {};
  }

  get trainNameInputStyle(): unknown {
    return this.viewState.trainNameInputTarget ?
      {
        width: "6rem",
        height: `${this.diagram.config.stationLabelFontSize + 4}px`,
        paddingTop: "2px",
        lineHeight: `${this.diagram.config.stationLabelFontSize}px`,
        fontSize: `${this.diagram.config.stationLabelFontSize}px`,
      } : {};
  }

  onComplete(): void {
    // pass
  }
}
</script>

<style scoped lang="scss">
</style>
