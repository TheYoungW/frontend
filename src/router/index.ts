import { createRouter, createWebHistory } from 'vue-router'
import TeachingArm from '../views/TeachingArm.vue'
import OperatingArm from '../views/OperatingArm.vue'

const routes = [
  {
    path: '/',
    redirect: '/teaching'
  },
  {
    path: '/teaching',
    name: 'TeachingArm',
    component: TeachingArm
  },
  {
    path: '/operating',
    name: 'OperatingArm',
    component: OperatingArm
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
