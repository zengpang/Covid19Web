import { RouteRecordRaw } from "vue-router";
import { MainPage } from "../view/MainPage";
export const routes:RouteRecordRaw[]=[
    {path:'/',redirect:'/mainpage'},
    {
        path:'/mainpage',

        component:MainPage
    }
]
