<template>
  <v-layer id="train-path-layer" ref="trainPathLayer" :config="layerConfig">
    <train-path-group v-for="t in Object.values(diagram.trains).filter(t => !viewState.trainSelections[t.id])" :key="`train-${t.id}`" :train="t" v-on="$listeners"></train-path-group>
    <train-path-group v-for="t in Object.values(diagram.trains).filter(t => viewState.trainSelections[t.id])" :key="`train-${t.id}`" :train="t" v-on="$listeners"></train-path-group>
  </v-layer>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import TrainPathGroup from "./TrainPathGroup.vue";

@Component({
  components: {
    TrainPathGroup
  },
})
export default class BackLayer extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }

  // private mounted(): void {
  //   const hitCanvas = (this.$refs.trainPathLayer as any).getNode().hitCanvas._canvas;
  //   document.body.appendChild(hitCanvas);
  // }

  private get layerConfig(): unknown {
    return {
      clip: {
        x: this.diagram.config.leftPaneWidth,
        y: this.viewConfig.topPaneHeight,
        width: this.viewState.viewWidth - this.diagram.config.leftPaneWidth,
        height: this.viewState.viewHeight - this.viewConfig.topPaneHeight,
      }
    };
  }
}
</script>

<style scoped lang="scss">
</style>
