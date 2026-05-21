<template>
  <AppShell :plain-middle="true" :plain-bottom="true">
    <template #hero>
      <section class="college-hero" :style="heroStyle">
        <div class="logo-block">{{ initials }}</div>
        <div class="hero-copy">
          <Breadcrumb />
          <h1>{{ displayName }}</h1>
          <p>{{ college?.intro || t.introFallback }}</p>
        </div>
      </section>
    </template>

    <template #middle>
      <section class="info-grid">
        <article class="card intro-panel surface-card">
          <div class="section-heading">
            <h2>{{ t.introTitle }}</h2>
            <p>{{ t.introSubtitle }}</p>
          </div>
          <p class="long-copy">{{ college?.intro || t.introFallback }}</p>
        </article>

        <article class="card meta-panel surface-card">
          <div class="section-heading">
            <h2>{{ t.metaTitle }}</h2>
            <p>{{ t.metaSubtitle }}</p>
          </div>
          <div class="meta-list">
            <div class="meta-item">
              <strong>{{ t.metaCode }}</strong>
              <span>{{ college?.code || '-' }}</span>
            </div>
            <div class="meta-item">
              <strong>{{ t.metaMajors }}</strong>
              <span>{{ majors.length }}</span>
            </div>
            <div class="meta-item">
              <strong>{{ t.metaCourses }}</strong>
              <span>{{ courses.length }}</span>
            </div>
          </div>
        </article>
      </section>
    </template>

    <template #bottom>
      <section class="info-grid">
        <article class="card list-panel surface-card">
          <div class="section-heading">
            <h2>{{ t.majorTitle }}</h2>
            <p>{{ t.majorSubtitle }}</p>
          </div>
          <div v-if="!majors.length" ref="majorListRef" class="empty-state list-shell">{{ t.emptyMajors }}</div>
          <div v-else ref="majorListRef" class="chip-grid list-shell">
            <router-link
              v-for="major in majors"
              :key="major.code"
              class="major-link"
              :to="`/major/${major.code}`"
            >
              {{ pickText(locale, major.name_zh, major.name_en, major.code) }}
            </router-link>
          </div>
        </article>

        <article class="card list-panel surface-card">
          <div class="section-heading collapsible-heading">
            <div>
              <h2>{{ t.courseTitle }}</h2>
              <p>{{ t.courseSubtitle }}</p>
            </div>
            <button class="list-toggle" type="button" @click="courseExpanded = !courseExpanded">
              {{ courseExpanded ? t.collapseCourses : t.expandCourses }}
            </button>
          </div>
          <div v-if="courses.length" class="course-toolbar">
            <input
              v-model.trim="courseKeyword"
              class="course-filter"
              type="text"
              :placeholder="t.courseFilterPlaceholder"
            />
            <span class="course-count">
              {{ filteredCourses.length }} / {{ courses.length }}
            </span>
          </div>
          <div v-if="!courses.length" class="empty-state list-shell">{{ t.emptyCourses }}</div>
          <div v-else-if="!filteredCourses.length" class="empty-state list-shell">{{ t.emptyFilteredCourses }}</div>
          <div
            v-else
            class="course-list-shell list-shell"
            :class="{ expanded: courseExpanded }"
            :style="courseListShellStyle"
          >
            <div class="course-list">
              <router-link
                v-for="course in filteredCourses"
                :key="course.course_code"
                class="course-row"
                :to="`/course/${course.course_code}`"
              >
                <strong>{{ pickText(locale, course.name_zh, course.name_en, course.course_code) }}</strong>
                <span>{{ course.course_code }}</span>
              </router-link>
            </div>
          </div>
        </article>
      </section>
    </template>
  </AppShell>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getCollegeDetail } from '../api/college'
import { getCollegeCourses } from '../api/course'
import { getMajors } from '../api/major'
import AppShell from '../components/AppShell.vue'
import Breadcrumb from '../components/Breadcrumb.vue'
import { useBreadcrumbStore } from '../stores/breadcrumb'
import { useUiStore } from '../stores/ui'
import { buildCollegePalette, buildInitials, pickText } from '../utils/content'

const route = useRoute()
const breadcrumb = useBreadcrumbStore()
const uiStore = useUiStore()

const college = ref(null)
const majors = ref([])
const courses = ref([])
const courseExpanded = ref(false)
const courseKeyword = ref('')
const majorListRef = ref(null)
const collapsedCourseMaxHeight = ref(320)
let majorListResizeObserver = null

const copy = {
  zh: {
    introTitle: '学院介绍',
    introSubtitle: '学院概览与定位',
    introFallback: '当前没有录入学院介绍，可以先浏览下面的专业和课程内容。',
    metaTitle: '学院信息',
    metaSubtitle: '数据概览',
    metaCode: '学院代码',
    metaMajors: '专业数量',
    metaCourses: '开设课程',
    majorTitle: '专业',
    majorSubtitle: '按专业继续深入',
    courseTitle: '学院开设课程',
    courseSubtitle: '汇总该学院下的相关课程',
    emptyMajors: '暂无专业数据。',
    emptyCourses: '暂无课程数据。'
  },
  en: {
    introTitle: 'College introduction',
    introSubtitle: 'Overview and positioning',
    introFallback: 'No introduction is available yet, but you can still browse majors and courses below.',
    metaTitle: 'College facts',
    metaSubtitle: 'Data snapshot',
    metaCode: 'College code',
    metaMajors: 'Majors',
    metaCourses: 'Courses',
    majorTitle: 'Majors',
    majorSubtitle: 'Continue by major',
    courseTitle: 'Courses offered',
    courseSubtitle: 'A combined list of related courses in this college',
    emptyMajors: 'No major data yet.',
    emptyCourses: 'No course data yet.'
  }
}

copy.zh.expandCourses = '展开课程'
copy.zh.collapseCourses = '收起课程'
copy.zh.courseFilterPlaceholder = '搜索本学院课程名称或课程编号'
copy.zh.emptyFilteredCourses = '没有匹配到对应课程。'
copy.en.expandCourses = 'Open courses'
copy.en.collapseCourses = 'Collapse courses'
copy.en.courseFilterPlaceholder = 'Search courses in this college'
copy.en.emptyFilteredCourses = 'No matching courses were found.'

const locale = computed(() => uiStore.locale)
const t = computed(() => copy[locale.value])
const displayName = computed(() => pickText(locale.value, college.value?.name_zh, college.value?.name_en, route.params.code))
const initials = computed(() => buildInitials(displayName.value))
const heroStyle = computed(() => {
  const [start, end] = buildCollegePalette(college.value?.code)
  return {
    '--hero-start': start,
    '--hero-end': end
  }
})
const filteredCourses = computed(() => {
  const keyword = courseKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return courses.value
  }

  return courses.value.filter((course) => {
    const nameZh = String(course.name_zh || '').toLowerCase()
    const nameEn = String(course.name_en || '').toLowerCase()
    const courseCode = String(course.course_code || '').toLowerCase()
    return nameZh.includes(keyword) || nameEn.includes(keyword) || courseCode.includes(keyword)
  })
})
const courseListShellStyle = computed(() =>
  courseExpanded.value ? { maxHeight: '1600px' } : { maxHeight: `${collapsedCourseMaxHeight.value}px` }
)

function syncCollapsedCourseHeight() {
  const measuredHeight = majorListRef.value?.offsetHeight || 0
  collapsedCourseMaxHeight.value = Math.max(320, measuredHeight)
}

onMounted(async () => {
  const code = String(route.params.code)
  college.value = await getCollegeDetail(code)
  majors.value = await getMajors(code)
  courses.value = await getCollegeCourses(code)
  await nextTick()
  syncCollapsedCourseHeight()

  if (typeof ResizeObserver !== 'undefined' && majorListRef.value) {
    majorListResizeObserver = new ResizeObserver(() => {
      if (!courseExpanded.value) {
        syncCollapsedCourseHeight()
      }
    })
    majorListResizeObserver.observe(majorListRef.value)
  }

  breadcrumb.set([
    { title: locale.value === 'zh' ? '首页' : 'Home', path: '/home' },
    { title: displayName.value, path: '' }
  ])
})

onBeforeUnmount(() => {
  if (majorListResizeObserver) {
    majorListResizeObserver.disconnect()
  }
})
</script>

<style scoped>
.college-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 22px;
  align-items: center;
  padding: 8px;
}

.logo-block {
  width: 120px;
  height: 120px;
  border-radius: 30px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--hero-start), var(--hero-end));
  color: #fff;
  font-size: 2rem;
  font-weight: 800;
}

.hero-copy h1 {
  margin: 12px 0 8px;
  font-size: clamp(1.8rem, 1.3rem + 1.8vw, 3rem);
}

.hero-copy p,
.long-copy {
  margin: 0;
  color: #475569;
}

.intro-panel {
  grid-column: span 8;
}

.meta-panel {
  grid-column: span 4;
}

.list-panel {
  grid-column: span 6;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.list-shell {
  min-height: 320px;
}

.major-link {
  display: flex;
  align-items: center;
  min-height: 92px;
  padding: 20px 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 100%);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 700;
  line-height: 1.35;
}

.collapsible-heading {
  align-items: center;
}

.list-toggle {
  border: 1px solid rgba(11, 79, 108, 0.16);
  border-radius: 999px;
  background: #fff;
  color: #0f172a;
  padding: 12px 18px;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.list-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.course-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.course-filter {
  min-width: min(100%, 320px);
  flex: 1 1 280px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(255, 255, 255, 0.92);
}

.course-count {
  color: #64748b;
  font-size: 0.95rem;
}

.course-list-shell {
  overflow: auto;
  max-height: 320px;
  transition: max-height 260ms ease;
  padding-right: 6px;
}

.course-list-shell.expanded {
  max-height: 1600px;
}

.course-list {
  display: grid;
  gap: 12px;
}

.course-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
}

.course-row span {
  color: #64748b;
}

.surface-card {
  min-height: 100%;
  padding: 24px 26px;
}

@media (max-width: 900px) {
  .college-hero {
    grid-template-columns: 1fr;
  }

  .intro-panel,
  .meta-panel,
  .list-panel {
    grid-column: span 12;
  }

  .course-row {
    display: grid;
  }

  .collapsible-heading {
    align-items: start;
  }
}
</style>
