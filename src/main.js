import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as vuetifyComponents from 'vuetify/components';
import * as vuetifyDirectives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import 'vuetify/styles';
import { create } from 'axios';
import { MolstarService } from './MolstarService.mjs';

import {
    mdiHistory,
    mdiChevronLeft,
    mdiChevronRight,
    mdiClockOutline,
    mdiAlertCircleOutline,
    mdiHelpCircleOutline,
    mdiMagnify,
    mdiTune,
    mdiDns,
    mdiReorderHorizontal,
    mdiDelete,
    mdiFileDownloadOutline,
    mdiCloudDownloadOutline,
    mdiFormatListBulleted,
    mdiLabel,
    mdiLabelOutline,
    mdiNotificationClearAll,
    mdiProgressWrench,
    mdiRestore,
    mdiFullscreen,
    mdiArrowRightCircle,
    mdiArrowRightCircleOutline,
    mdiCircle,
    mdiCircleHalf,
    mdiPlusBox,
    mdiMinusBox,
    mdiOpenInNew,
    mdiDotsVertical,
    mdiGithub,
    mdiExport,
    mdiChartBarStacked,
} from '@mdi/js'

import App from './App.vue';
import Search from './Search.vue';
import Cluster from './Cluster.vue';

window.document.title = "BFVD";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: { name: 'search' } },
        { name: 'search', path: '/', component: Search },
        { name: 'lca', path: '/lca/:taxid/:type', component: Search },
        { name: 'foldseek', path: '/foldseek/:jobid', component: Search },
        { name: 'cluster', path: '/cluster/:cluster', component: Cluster },
    ],
    linkActiveClass: 'active',
    scrollBehavior (to, from, savedPosition) {
        if (savedPosition) {
          return savedPosition
        } else {
          return { x: 0, y: 0 }
        }
    },
});

const mq = window.matchMedia('(prefers-color-scheme: dark)')

const vuetify = createVuetify({
    components: vuetifyComponents,
    directives: vuetifyDirectives,
    icons: {
        defaultSet: 'mdiSvg',
        aliases,
        sets: {
            mdiSvg: mdi,
        },
    },
    theme: {
        defaultTheme: mq.matches ? 'dark' : 'light',
        // Vuetify 3 shifted the default light primary from #1976D2 to #1867C0. Links are
        // themed off primary (see the anchor rule in App.vue), so pin the v2 values to
        // keep the palette identical to the previous BFVD site. Dark was already #2196F3.
        themes: {
            light: { colors: { primary: '#1976D2' } },
            dark:  { colors: { primary: '#2196F3' } },
        },
    },
})

mq.addEventListener('change', (e) => {
    vuetify.theme.change(e.matches ? 'dark' : 'light');
})

const $MDI = {
    History: mdiHistory,
    ChevronLeft: mdiChevronLeft,
    ChevronRight: mdiChevronRight,
    ClockOutline: mdiClockOutline,
    AlertCircleOutline: mdiAlertCircleOutline,
    HelpCircleOutline: mdiHelpCircleOutline,
    Magnify: mdiMagnify,
    Tune: mdiTune,
    Dns: mdiDns,
    ReorderHorizontal: mdiReorderHorizontal,
    Delete: mdiDelete,
    FileDownloadOutline: mdiFileDownloadOutline,
    CloudDownloadOutline: mdiCloudDownloadOutline,
    FormatListBulleted: mdiFormatListBulleted,
    Label: mdiLabel,
    LabelOutline: mdiLabelOutline,
    NotificationClearAll: mdiNotificationClearAll,
    ProgressWrench: mdiProgressWrench,
    Restore: mdiRestore,
    Fullscreen: mdiFullscreen,
    ArrowRightCircle: mdiArrowRightCircle,
    ArrowRightCircleOutline: mdiArrowRightCircleOutline,
    Circle: mdiCircle,
    CircleHalf: mdiCircleHalf,
    PlusBox: mdiPlusBox,
    MinusBox: mdiMinusBox,
    DotsVertical: mdiDotsVertical,
    OpenInNew: mdiOpenInNew,
    GitHub: mdiGithub,
    Export: mdiExport,
    ChartBarStacked: mdiChartBarStacked
};

// let apiBase = "http://localhost:3000/api";
// let apiBase = "https://cluster.foldseek.com/api";
// let apiBase = "https://bfvd.foldseek.com/api";
let apiBase = "/api";
let defaultHeaders = {};

const axiosConfig = {
    baseURL: apiBase,
    headers: defaultHeaders
};

const app = createApp(App);
app.config.globalProperties.$MDI = $MDI;
app.config.globalProperties.$axios = create(axiosConfig);
app.config.globalProperties.$molstarService = new MolstarService();
app.use(router);
app.use(vuetify);

// make sure our CSS is load last
import './assets/style.css';

app.mount('#app');