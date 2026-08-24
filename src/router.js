import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/Home.vue';

import Guangxiu from './components/Guangxiu.vue';
import TeachingHelper from './components/TeachingHelper.vue';
import I2V from './components/I2V.vue';
import T2I from './components/T2I.vue';
import PicManage from './components/PicManage.vue';
import BackFunc from "@/components/BackFunc.vue";

const routes = [
    {
        path: '/',         // 访问路径
        name: 'Home',      // 路由名称
        component: Home    // 对应的组件
    },
    {
        path: '/Teaching',
        name: 'Teaching',
        component: TeachingHelper
    },
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/Guangxiu',
        name: 'Guangxiu',
        component: Guangxiu
    },
    {
        path: '/T2I',
        name: 'T2I',
        component: T2I
    },
    {
        path: '/Teaching',
        name: 'Teaching',
        component: TeachingHelper
    },
    {
        path: '/I2V',
        name: 'I2V',
        component: I2V
    },
    {
        path: '/PicManage',
        name: 'PicManage',
        component: PicManage
    },
    {
        path: '/BackFunc',
        name: 'BackFunc',
        component: BackFunc
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;