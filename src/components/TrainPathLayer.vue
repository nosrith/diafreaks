<template>
  <v-layer id="train-path-layer" ref="trainPathLayer" :config="layerConfig">
    <train-path-group v-for="t in Object.values(diagram.trains).filter(t => !viewState.trainSelections[t.id])" :key="`train-${t.id}`" :train="t"></train-path-group>
    <train-path-group v-for="t in Object.values(diagram.trains).filter(t => viewState.trainSelections[t.id])" :key="`train-${t.id}`" :train="t"></train-path-group>
  </v-layer>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import ViewState from "@/data/ViewState";
import TrainPathGroup from "./TrainPathGroup.vue";

@Component({
  components: {
    TrainPathGroup
  },
})
export default class BackLayer extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;

  // mounted(): void {
  //   const hitCanvas = (this.$refs.trainPathLayer as any).getNode().hitCanvas._canvas;
  //   document.body.appendChild(hitCanvas);
  // }

  get layerConfig(): unknown {
    return {
      clip: {
        x: this.diagram.config.leftPaneWidth,
        y: this.diagram.config.topPaneHeight,
        width: this.viewState.viewWidth - this.diagram.config.leftPaneWidth,
        height: this.viewState.viewHeight - this.diagram.config.topPaneHeight,
      }
    };
  }
}
</script>

<style scoped lang="scss">
</style>
