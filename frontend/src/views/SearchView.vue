<template>
  <AppShell :plain-middle="true">
    <template #hero>
      <section class="search-hero">
        <Breadcrumb />
        <h1>{{ t.title }}</h1>
        <p>{{ subtitle }}</p>
      </section>
    </template>

    <template #middle>
      <section class="search-panel card">
        <div class="section-heading">
          <h2>{{ t.resultTitle }}</h2>
          <p>{{ resultCountText }}</p>
        </div>

        <div v-if="loading" class="empty-state">{{ t.loading }}</div>
        <div
          v-else-if="!results.courses.length && !results.majors.length && !results.colleges.length"
          class="empty-state"
        >
          {{ t.empty }}
        </div>
        <div v-else class="search-sections">
          <section v-if="results.courses.length" class="result-section">
            <div class="section-heading compact">
              <h3>{{ t.courseTitle }}</h3>
              <p>{{ results.courses.length }} {{ t.resultSuffix }}</p>
            </div>
            <div class="result-list">
              <router-link
                v-for="course in results.courses"
                :key="course.course_code"
                class="result-card"
                :to="`/course/${course.course_code}`"
              >
                <strong>{{ pickText(locale, course.name_zh, course.name_en, course.course_code) }}</strong>
                <p>{{ course.description || t.courseFallback }}</p>
                <span>{{ course.course_code }}</span>
              </router-link>
            </div>
          </section>

          <section v-if="results.majors.length" class="result-section">
            <div class="section-heading compact">
              <h3>{{ t.majorTitle }}</h3>
              <p>{{ results.majors.length }} {{ t.resultSuffix }}</p>
            </div>
            <div class="result-list">
              <router-link
                v-for="major in results.majors"
                :key="major.code"
                class="result-card"
                :to="`/major/${major.code}`"
              >
                <strong>{{ pickText(locale, major.name_zh, major.name_en, major.code) }}</strong>
                <p>{{ major.intro || t.majorFallback }}</p>
                <span>
                  {{ pickText(locale, major.college_name_zh, major.college_name_en, major.college_code) }}
                </span>
              </router-link>
            </div>
          </section>

          <section v-if="results.colleges.length" class="result-section">
            <div class="section-heading compact">
              <h3>{{ t.collegeTitle }}</h3>
              <p>{{ results.colleges.length }} {{ t.resultSuffix }}</p>
            </div>
            <div class="result-list">
              <router-link
                v-for="college in results.colleges"
                :key="college.code"
                class="result-card"
                :to="`/college/${college.code}`"
              >
                <strong>{{ pickText(locale, college.name_zh, college.name_en, college.code) }}</strong>
                <p>{{ college.intro || t.collegeFallback }}</p>
                <span>{{ college.code }}</span>
              </router-link>
            </div>
          </section>
        </div>
      </section>
    </template>
  </AppShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { searchKeyword } from '../api/search'
import AppShell from '../components/AppShell.vue'
import Breadcrumb from '../components/Breadcrumb.vue'
import { useBreadcrumbStore } from '../stores/breadcrumb'
import { useUiStore } from '../stores/ui'
import { pickText } from '../utils/content'

const route = useRoute()
const breadcrumb = useBreadcrumbStore()
const uiStore = useUiStore()

const results = ref({
  colleges: [],
  majors: [],
  courses: []
})
const loading = ref(false)

const copy = {
  zh: {
    title: '搜索结果',
    resultTitle: '匹配内容',
    loading: '正在搜索...',
    empty: '没有找到匹配的课程、专业或学院。',
    courseTitle: '课程',
    majorTitle: '专业',
    collegeTitle: '学院',
    courseFallback: '当前没有录入课程简介。',
    majorFallback: '当前没有录入专业介绍。',
    collegeFallback: '当前没有录入学院介绍。',
    keywordPrefix: '关键词',
    resultSuffix: '条结果'
  },
  en: {
    title: 'Search results',
    resultTitle: 'Matches',
    loading: 'Searching...',
    empty: 'No matching course, major, or college was found.',
    courseTitle: 'Courses',
    majorTitle: 'Majors',
    collegeTitle: 'Colleges',
    courseFallback: 'No course description is available.',
    majorFallback: 'No major introduction is available.',
    collegeFallback: 'No college introduction is available.',
    keywordPrefix: 'Keyword',
    resultSuffix: 'results'
  }
}

const locale = computed(() => uiStore.locale)
const t = computed(() => copy[locale.value])
const keyword = computed(() => String(route.query.q || '').trim())
const subtitle = computed(() =>
  keyword.value ? `${t.value.keywordPrefix}: ${keyword.value}` : t.value.empty
)
const totalCount = computed(
  () => results.value.courses.length + results.value.majors.length + results.value.colleges.length
)
const resultCountText = computed(() => `${totalCount.value} ${t.value.resultSuffix}`)

async function loadResults() {
  if (!keyword.value) {
    results.value = {
      colleges: [],
      majors: [],
      courses: []
    }
    return
  }

  loading.value = true

  try {
    results.value = await searchKeyword(keyword.value)
  } catch (error) {
    console.error(error)
    results.value = {
      colleges: [],
      majors: [],
      courses: []
    }
  } finally {
    loading.value = false
  }

  breadcrumb.set([
    { title: locale.value === 'zh' ? '首页' : 'Home', path: '/home' },
    { title: t.value.title, path: '' }
  ])
}

watch([keyword, locale], loadResults, { immediate: true })
</script>

<style scoped>
.search-hero h1 {
  margin: 12px 0 10px;
  font-size: clamp(1.8rem, 1.3rem + 1.8vw, 3rem);
}

.search-hero p {
  margin: 0;
  color: #475569;
}

.search-panel {
  display: grid;
  gap: 24px;
  padding: 28px;
}

.search-sections {
  display: grid;
  gap: 24px;
}

.section-heading.compact {
  gap: 4px;
}

.result-section {
  display: grid;
  gap: 14px;
}

.result-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.result-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.78);
  display: grid;
  gap: 8px;
}

.result-card p,
.result-card span {
  margin: 0;
  color: #64748b;
}
</style>
