<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import HeroImage from './HeroImage.vue'
import { useData } from 'vitepress'
import { computed } from 'vue'

const { page, frontmatter } = useData()

const isBlogLayout = computed(() => {
  return (page.value.relativePath.startsWith('blog/') || page.value.relativePath.startsWith('seo/')) && !page.value.relativePath.endsWith('index.md')
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-image>
      <HeroImage />
    </template>
    
    <template #doc-before>
      <div v-if="isBlogLayout" class="blog-meta-header">
        <div class="meta-item author" v-if="frontmatter.author">
          <span class="avatar">👤</span> {{ frontmatter.author }}
        </div>
        <div class="meta-item date" v-if="frontmatter.date">
          📅 {{ new Date(frontmatter.date).toLocaleDateString() }}
        </div>
        <div class="meta-item tag" v-if="frontmatter.category">
          🏷️ {{ frontmatter.category }}
        </div>
      </div>
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
.blog-meta-header {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
