import { defineComponent } from "vue";
import s from './MainPage.module.scss'

export const MainPage = defineComponent({
    setup: () => {
        
        return () => (
            <div class={s.mainPage}>
                <header>
                    <h1>城市名</h1>
                </header>
                <main>
                   
                </main>
            </div>
        )
    }
})