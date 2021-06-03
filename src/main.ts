import Vue from "vue";
import Buefy from "buefy";
import "buefy/dist/buefy.css";
import VueI18n from "vue-i18n";
import VueKonva from "vue-konva";
import App from "./App.vue";
import messages from "./messages";

Vue.config.productionTip = false
Vue.use(Buefy);
Vue.use(VueI18n);
Vue.use(VueKonva);

const i18n = new VueI18n({
  locale: "ja",
  messages,
});

new Vue({
  render: h => h(App),
  i18n,
}).$mount("#app");
