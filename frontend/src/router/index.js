import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import CollegeView from '../views/CollegeView.vue'
import MajorView from '../views/MajorView.vue'
import CourseView from '../views/CourseView.vue'
import SearchView from '../views/SearchView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', component: LoginView },
    { path: '/home', component: HomeView },
    { path: '/:pathMatch(.*)*', component: NotFoundView },
    { path:'/college/:code', component: CollegeView},
    { path:'/major/:code', component: MajorView},
    { path:'/course/:code', component: CourseView},
    { path:'/search', component: SearchView}
  ]
})

router.beforeEach((to, from, next) => {

  const userStore = useUserStore()

  if (userStore.isLogin && to.path === '/login') {
    next('/home')
    return
  }

  if (!userStore.isLogin && to.path !== '/login') {
    next('/login')
    return
  }

  next()
})

export default router
