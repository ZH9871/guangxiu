import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/Home.vue';

import Guangxiu from './components/Guangxiu.vue';
import TeachingHelper from './components/TeachingHelper.vue';
import I2V from './components/I2V.vue';
import T2I from './components/T2I.vue';
import PicManage from './components/PicManage.vue';
import BackFunc from "@/components/BackFunc.vue";
import Login from "@/components/Login.vue";
import Register from "@/components/Register.vue";

const routes = [
    {
        path: '/',         // 访问根路径时默认进入“走进广绣”
        redirect: '/Guangxiu'
    },
    {
        path: '/Home',     // 首页组件隐藏路由（导航不展示，仅预留给后续优化）
        name: 'Home',
        component: Home
    },
    {
        path: '/Teaching',
        name: 'Teaching',
        component: TeachingHelper
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
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/register',
        name: 'Register',
        component: Register
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;