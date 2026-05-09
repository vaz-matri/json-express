import DefaultTheme from 'vitepress/theme'
import HeroImage from './HeroImage.vue'
import { h } from 'vue'
import './custom.css'

export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'home-hero-image': () => h(HeroImage)
        })
    }
}
