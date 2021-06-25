<template>
  <div class="train-info-editor-group">
    <div ref="trainInfoEditorBox" class="train-info-editor-box box" :style="trainInfoEditorBoxStyle">
      <input ref="trainNameInput" class="train-name-input" :value="targetTrain.name" :style="trainNameInputStyle" @keypress.enter="onComplete">
      <span ref="colorPickerTrigger" class="color-picker picker" :style="{ background: targetTrain.color || viewConfig.trainPathColor }" @click="onColorPickerTriggerClick"></span>
      <span ref="lineWidthPickerTrigger" class="line-width-picker picker" @click="onLineWidthPickerTriggerClick"><span class="line-width-picker-preview" :style="{ background: targetTrain.color || viewConfig.trainPathColor, height: `${getDispLineWidthByValue(targetTrain.lineWidth || viewConfig.trainPathWidth)}px` }"></span></span>
    </div>
    <div class="color-picker-box picker-box box" :style="colorPickerBoxStyle">
      <div><span class="color-picker picker" style="background: #000" @click="onColorPickerClick('#000')"></span></div>
      <div><span class="color-picker picker" v-for="(c, i) in colorPickerColors" :key="`train-path-color-picker-${i}`" :style="{ background: c }" @click="onColorPickerClick(c)"></span></div>
    </div>
    <div class="line-width-picker-box picker-box box" :style="lineWidthPickerBoxStyle">
      <div><span class="line-width-picker picker" v-for="(w, i) in lineWidthPickerValues" :key="`train-path-line-width-picker-${i}`" @click="onLineWidthPickerClick(w.value)"><span class="line-width-picker-preview" :style="{ background: targetTrain.color || viewConfig.trainPathColor, height: `${w.disp}px` }"></span></span></div>
    </div>
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
    trainInfoEditorBox: HTMLElement,
    trainNameInput: HTMLInputElement,
    colorPickerTrigger: HTMLElement,
    lineWidthPickerTrigger: HTMLElement,
  };

  private pickerMode: "none" | "color" | "lineWidth" = "none";

  private get targetTrain(): Train | Record<string, never> {
    return this.viewState.trainInfoEditorTarget?.train ?? {};
  }

  private get trainInfoEditorBoxTop(): number {
    const state = this.viewState.trainInfoEditorTarget;
    return state ?
      state.y + (state.verticalAlign == "bottom" ? -this.$refs.trainInfoEditorBox.clientHeight ?? 0 : 0) :
      this.viewState.viewHeight;
  }

  private get trainInfoEditorBoxStyle(): unknown {
    const state = this.viewState.trainInfoEditorTarget;
    return state ?
      {
        left: `${state.x}px`,
        top: `${this.trainInfoEditorBoxTop}px`,
      } : {
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

  private get colorPickerBoxStyle(): unknown {
    const state = this.viewState.trainInfoEditorTarget;
    return state && this.pickerMode == "color" ?
      {
        left: `calc(${state.x + this.$refs.colorPickerTrigger.offsetLeft}px - 0.5rem)`,
        top: `${this.trainInfoEditorBoxTop + this.$refs.trainInfoEditorBox.clientHeight}px`,
      } : {
        top: `${this.viewState.viewHeight}px`
      };
  }

  private get colorPickerColors() {
    return [
      "#ce1a34",
      "#dd7d15",
      "#ceae0f",
      "#298e30",
      "#2d75bc",
      "#790894",
    ];
  }

  private get lineWidthPickerBoxStyle(): unknown {
    const state = this.viewState.trainInfoEditorTarget;
    return state && this.pickerMode == "lineWidth" ?
      {
        left: `calc(${state.x + this.$refs.lineWidthPickerTrigger.offsetLeft}px - 0.5rem)`,
        top: `${this.trainInfoEditorBoxTop + this.$refs.trainInfoEditorBox.clientHeight}px`,
      } : {
        top: `${this.viewState.viewHeight}px`
      };
  }

  private getDispLineWidthByValue(value: number) {
    return this.lineWidthPickerValues.find(e => e.value == value)?.disp ?? value;
  }

  private get lineWidthPickerValues() {
    return [ { value: 1, disp: 0.75 }, { value: 2, disp: 2.25 } ];
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
    this.pickerMode = "none";
  }

  private onColorPickerTriggerClick(): void {
    this.pickerMode = this.pickerMode == "color" ? "none" : "color";
  }

  private onLineWidthPickerTriggerClick(): void {
    this.pickerMode = this.pickerMode == "lineWidth" ? "none" : "lineWidth";
  }

  private onColorPickerClick(color: string): void {
    this.targetTrain.color = color;
  }

  private onLineWidthPickerClick(lineWidth: number): void {
    this.targetTrain.lineWidth = lineWidth;
  }
}
</script>

<style scoped lang="scss">
.train-info-editor-group {
  width: 100%;
  height: 100%;
  pointer-events: none !important;
}
.train-info-editor-group > * {
  position: absolute;
  pointer-events: all;
}
.train-info-editor-box {
  margin: 0;
  padding: 0.5rem;
  display: flex;
  align-items: center;
}
.train-info-editor-box > :not(:first-child) {
  margin-left: 0.5rem;
}
.train-info-editor-box input.train-name-input {
  width: 8rem;
}
.picker-box {
  margin: 0;
  padding: 0.5rem;
  max-height: 5.4rem;
}
.picker-box > * {
  display: flex;
  flex-flow: wrap;
}
.picker-box > :not(:first-child) {
  margin-top: 0.5rem;
}
.picker-box > * > :not(:first-child) {
  margin-left: 0.4rem;
}
.picker {
  display: inline-block;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.4rem;
}
.line-width-picker-preview {
  display: inline-block;
  width: 1.4rem;
  height: 1px;
  vertical-align: middle;
}
</style>
