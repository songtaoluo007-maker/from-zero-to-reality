import {createApp} from 'vue'
import App from './App.vue'
import './style.css'
import {gsap} from 'gsap'
gsap.ticker.fps(60)
createApp(App).mount('#app')
