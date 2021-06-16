<template>
  <b-carousel :autoplay="false" :indicator-inside="false">
    <b-carousel-item>
      <div class="help-item">
        <div class="help-image">
          <img src="@/assets/help_add_new_station.png">
        </div>
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.addNewStationTitle')"></h5>
          <p v-html="$t('message.help.addNewStationBody')"></p>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <div class="help-image">
          <img src="@/assets/help_add_new_train.png">
        </div>
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.addNewTrainTitle')"></h5>
          <p v-html="$t('message.help.addNewTrainBody')"></p>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <div class="help-image">
          <img src="@/assets/help_select_train.png">
        </div>
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.selectTrainTitle')"></h5>
          <p v-html="$t('message.help.selectTrainBody')"></p>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <div class="help-image">
          <img src="@/assets/help_edit_train.png">
        </div>
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.editTrainTitle')"></h5>
          <p v-html="$t('message.help.editTrainBody')"></p>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <div class="help-image">
          <img src="@/assets/help_edit_time.png">
        </div>
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.editTimeTitle')"></h5>
          <p v-html="$t('message.help.editTimeBody')"></p>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <img src="@/assets/help_tips.png">
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.tipsTitle')"></h5>
          <p v-html="$t('message.help.tipsBody')"></p>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.contactTitle')"></h5>
          <p v-html="$t('message.help.contactBody')"></p>
        </div>
      </div>
    </b-carousel-item>
  </b-carousel>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class HelpPane extends Vue {
}
</script>

<style lang="scss" scoped>
.help-item {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  min-height: 15rem;
}
.help-item .help-image {
  position: relative;
}
.help-item .help-image:after {
  position: absolute;
  display: block;
  content: "";
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-shadow: 
    inset 0 0 20px #fff,
    inset 0 0 20px #fff,
    inset 0 0 20px #fff,
    inset 0 0 20px #fff;
}
.help-item img {
  display: block;
}
.help-item .help-desc {
  flex: 1 1 0;
  margin: 0 0 0 2rem;
  min-width: 360px;
  max-width: 640px;
}
</style>
