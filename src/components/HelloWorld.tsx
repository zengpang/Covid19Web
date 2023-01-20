import { defineComponent } from "vue";

export const HelloWorld=defineComponent({
  setup:()=>{
    return ()=>(
      <div>
        欢迎
      </div>
    )
  }
})