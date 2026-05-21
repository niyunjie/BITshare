import { defineStore } from 'pinia'

export const useBreadcrumbStore = defineStore('breadcrumb',{

  state:()=>({
    items:[]
  }),

  actions:{

    set(items){
      this.items = items
    },

    clear(){
      this.items = []
    }

  }

})