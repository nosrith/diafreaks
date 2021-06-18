<template>
  <div class="train-info-editor-box box" :style="groupStyle">
    <input ref="trainNameInput" class="train-name-input" :value="targetTrain.name" :style="trainNameInputStyle" @keypress.enter="onComplete">
  </div>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Train from "@/data/Train";

@Component
export default class TrackNameInput extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }

  $refs!: {
    trainNameInput: HTMLInputElement
  };

  private get targetTrain(): Train | Record<string, never> {
    return this.viewState.trainInfoEditorTarget?.train ?? {};
  }

  private get groupStyle(): unknown {
    const state = this.viewState.trainInfoEditorTarget;
    return state ?
      {
        left: `${state.x}px`,
        top: `${state.y + (state.verticalAlign == "bottom" ? -this.$el?.clientHeight ?? 0 : 0)}px`,
      } : {
        left: "0px",
        top: `${this.viewState.viewHeight}px`
      };
  }

  private get trainNameInputStyle(): unknown {
    return this.viewState.trainInfoEditorTarget ?
      {
        lineHeight: `${this.viewConfig.stationLabelFontSize}px`,
        fontSize: `${this.viewConfig.stationLabelFontSize}px`,
      } : {};
  }

  onComplete(): void {
    const targetTrain = this.targetTrain;
    const name0 = targetTrain.name;
    const name1 = this.$refs.trainNameInput.value;
    if (name0 != name1) {
      targetTrain.name = name1;
      this.context.history.push({
        this: this,
        undo: () => { targetTrain.name = name0; },
        redo: () => { targetTrain.name = name1; }
      });
    }
    this.viewState.trainInfoEditorTarget = null;
  }
}
</script>

<style scoped lang="scss">
.train-info-editor-box {
  margin: 0;
  padding: 0.5rem;
}
.train-info-editor-box input.train-name-input {
  width: 8rem;
}
</style>
