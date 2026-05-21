<template>
  <AppShell :plain-middle="true" :plain-bottom="true">
    <template #hero>
      <section id="major-overview" class="major-hero hero-card">
        <Breadcrumb />
        <div class="hero-grid">
          <div class="hero-copy">
            <h1>{{ displayName }}</h1>
            <p>{{ major?.intro || t.introFallback }}</p>
          </div>

          <div class="meta-list hero-meta">
            <div class="meta-item">
              <strong>{{ t.planMajorCode }}</strong>
              <span>{{ major?.code || route.params.code }}</span>
            </div>
            <div class="meta-item">
              <strong>{{ t.planRequiredCount }}</strong>
              <span>{{ required.length }}</span>
            </div>
            <div class="meta-item">
              <strong>{{ t.planElectiveCount }}</strong>
              <span>{{ elective.length }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <template #middle>
      <div id="major-plan">
        <DocumentPreviewPanel
          :title="t.planTitle"
          :subtitle="t.planSubtitle"
          :empty-text="t.emptyPlan"
          :documents="planDocuments"
          :download-label="t.downloadPlan"
          :preview-tip="t.previewTip"
        />
      </div>
    </template>

    <template #bottom>
      <section class="info-grid">
        <aside :class="['nav-sidebar', { collapsed: navSidebarCollapsed }]">
          <button
            class="sidebar-toggle nav-toggle"
            type="button"
            :aria-expanded="String(!navSidebarCollapsed)"
            @click="navSidebarCollapsed = !navSidebarCollapsed"
          >
            <span class="sidebar-toggle-icon menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span class="sidebar-toggle-label">
              {{ navSidebarCollapsed ? t.openNav : t.closeNav }}
            </span>
          </button>

          <section v-if="!navSidebarCollapsed" class="nav-card card">
            <div class="section-heading">
              <h2>{{ t.navTitle }}</h2>
              <p>{{ t.navSubtitle }}</p>
            </div>

            <div class="nav-links">
              <button type="button" class="nav-link" @click="scrollToSection('major-overview')">
                {{ t.navOverview }}
              </button>
              <button type="button" class="nav-link" @click="scrollToSection('major-plan')">
                {{ t.navPlan }}
              </button>
              <button type="button" class="nav-link" @click="scrollToSection('major-courses')">
                {{ t.navCourseGroups }}
              </button>
            </div>
          </section>
        </aside>

        <article id="major-courses" class="card course-panel surface-card">
          <div class="section-heading">
            <h2>{{ t.requiredTitle }}</h2>
            <p>{{ t.requiredSubtitle }}</p>
          </div>
          <div v-if="!required.length" class="empty-state">{{ t.emptyRequired }}</div>
          <div v-else class="course-grid">
            <router-link
              v-for="course in required"
              :key="course.course_code"
              class="course-card"
              :to="`/course/${course.course_code}`"
            >
              <strong>{{ pickText(locale, course.name_zh, course.name_en, course.course_code) }}</strong>
              <p>{{ t.termLabel }} {{ course.recommended_term || '-' }}</p>
              <span>{{ course.course_code }}</span>
            </router-link>
          </div>
        </article>

        <article id="major-elective" class="card course-panel surface-card">
          <div class="section-heading">
            <h2>{{ t.electiveTitle }}</h2>
            <p>{{ t.electiveSubtitle }}</p>
          </div>
          <div v-if="!elective.length" class="empty-state">{{ t.emptyElective }}</div>
          <div v-else class="course-grid">
            <router-link
              v-for="course in elective"
              :key="course.course_code"
              class="course-card alt"
              :to="`/course/${course.course_code}`"
            >
              <strong>{{ pickText(locale, course.name_zh, course.name_en, course.course_code) }}</strong>
              <p>{{ t.termLabel }} {{ course.recommended_term || '-' }}</p>
              <span>{{ course.course_code }}</span>
            </router-link>
          </div>
        </article>
      </section>
    </template>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getMajorCourses } from '../api/course'
import { getMajorDetail } from '../api/major'
import { getMajorDocuments } from '../api/majorDocuments'
import AppShell from '../components/AppShell.vue'
import Breadcrumb from '../components/Breadcrumb.vue'
import DocumentPreviewPanel from '../components/DocumentPreviewPanel.vue'
import { useBreadcrumbStore } from '../stores/breadcrumb'
import { useUiStore } from '../stores/ui'
import { pickText } from '../utils/content'

const route = useRoute()
const breadcrumb = useBreadcrumbStore()
const uiStore = useUiStore()

const major = ref(null)
const required = ref([])
const elective = ref([])
const planDocuments = ref([])
const navSidebarCollapsed = ref(true)

const copy = {
  zh: {
    introFallback: '当前没有录入专业介绍，可先查看培养方案和课程分布。',
    planTitle: '培养方案',
    planSubtitle: '双语培养方案支持在线预览与下载，不提供上传。',
    planMajorCode: '专业代码',
    planRequiredCount: '必修课数量',
    planElectiveCount: '选修课数量',
    requiredTitle: '必修课',
    requiredSubtitle: '核心学习路径',
    electiveTitle: '选修课',
    electiveSubtitle: '扩展方向与能力提升',
    emptyRequired: '暂无必修课数据。',
    emptyElective: '暂无选修课数据。',
    emptyPlan: '暂无培养方案文件。',
    downloadPlan: '下载培养方案',
    previewTip: '支持浏览器内预览 PDF、Word、Excel 等文件',
    navTitle: '页面导航',
    navSubtitle: '快速跳转内容区',
    navOverview: '专业介绍',
    navPlan: '培养方案',
    navCourseGroups: '必修/选修',
    openNav: '导航',
    closeNav: '收起',
    termLabel: '建议学期'
  },
  en: {
    introFallback: 'No major introduction is available yet. You can still browse the plan and course distribution.',
    planTitle: 'Training plan',
    planSubtitle: 'Bilingual training plans support inline preview and download, with no upload entry.',
    planMajorCode: 'Major code',
    planRequiredCount: 'Required courses',
    planElectiveCount: 'Elective courses',
    requiredTitle: 'Required courses',
    requiredSubtitle: 'Core learning path',
    electiveTitle: 'Elective courses',
    electiveSubtitle: 'Expansion and skill growth',
    emptyRequired: 'No required course data yet.',
    emptyElective: 'No elective course data yet.',
    emptyPlan: 'No training plan files yet.',
    downloadPlan: 'Download plan',
    previewTip: 'PDF, Word, and Excel files are previewed inline when supported by the browser; otherwise they download.',
    navTitle: 'Page navigation',
    navSubtitle: 'Jump to sections',
    navOverview: 'Overview',
    navPlan: 'Plan',
    navCourseGroups: 'Req/Elec',
    openNav: 'Nav',
    closeNav: 'Hide',
    termLabel: 'Recommended term'
  }
}

const locale = computed(() => uiStore.locale)
const t = computed(() => copy[locale.value])
const displayName = computed(() =>
  pickText(locale.value, major.value?.name_zh, major.value?.name_en, route.params.code)
)

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId)

  if (!element) {
    return
  }

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

onMounted(async () => {
  const majorCode = String(route.params.code)
  major.value = await getMajorDetail(majorCode)
  const courses = await getMajorCourses(majorCode)
  planDocuments.value = await getMajorDocuments(majorCode)

  required.value = courses.filter((course) => course.category === 'required')
  elective.value = courses.filter((course) => course.category === 'elective' || course.category === 'public')

  breadcrumb.set([
    { title: locale.value === 'zh' ? '首页' : 'Home', path: '/home' },
    {
      title: pickText(
        locale.value,
        major.value?.college_name_zh,
        major.value?.college_name_en,
        major.value?.college_code
      ),
      path: major.value?.college_code ? `/college/${major.value.college_code}` : '/home'
    },
    { title: displayName.value, path: '' }
  ])
})
</script>

<style scoped>
.major-hero h1 {
  margin: 12px 0 10px;
  font-size: clamp(1.8rem, 1.3rem + 1.8vw, 3rem);
}

.major-hero p {
  margin: 0;
  color: #475569;
}

.hero-card {
  padding: 8px 4px 4px;
}

.course-panel {
  grid-column: span 6;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.7fr);
  gap: 18px;
  align-items: start;
}

.hero-copy {
  display: grid;
  gap: 10px;
}

.hero-meta {
  grid-template-columns: 1fr;
}

.hero-meta .meta-item {
  min-height: 104px;
  padding: 18px 20px;
  background: transparent;
  border-style: solid;
  border-width: 1px;
  border-color: rgba(148, 163, 184, 0.22);
}

.course-grid {
  display: grid;
  gap: 14px;
}

.course-card {
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(232, 245, 255, 0.9), rgba(255, 255, 255, 0.95));
  display: grid;
  gap: 8px;
}

.course-card.alt {
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.95), rgba(248, 250, 252, 0.95));
}

.course-card p,
.course-card span {
  margin: 0;
  color: #64748b;
}

.surface-card {
  min-height: 100%;
  padding: 24px 26px;
}

.nav-sidebar {
  position: fixed;
  top: 148px;
  left: 0;
  width: 300px;
  display: grid;
  gap: 12px;
  z-index: 30;
  transition: transform 0.28s ease;
  transform: translateX(-100%);
}

.nav-sidebar.collapsed {
  transform: translateX(-100%);
}

.nav-sidebar:not(.collapsed) {
  transform: translateX(0);
}

.sidebar-toggle {
  position: absolute;
  top: 28px;
  right: -58px;
  width: 58px;
  min-height: 136px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  cursor: pointer;
  padding: 12px 6px;
  font-weight: 700;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background-color 0.22s ease;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.16);
}

.sidebar-toggle-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0b4f6c 0%, #14532d 100%);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
}

.menu-icon {
  background: linear-gradient(135deg, #0b4f6c 0%, #14532d 100%);
  padding: 4px;
  gap: 2px;
}

.menu-icon span {
  display: block;
  width: 9px;
  height: 1.5px;
  border-radius: 999px;
  background: #fff;
}

.sidebar-toggle-label {
  font-size: 13px;
  letter-spacing: 0.02em;
  line-height: 1.15;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.nav-card {
  padding: 20px;
}

.nav-card .section-heading {
  display: grid;
  justify-content: start;
  gap: 6px;
}

.nav-card .section-heading p {
  max-width: 16ch;
}

.nav-links {
  display: grid;
  gap: 10px;
}

.nav-link {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(248, 250, 252, 0.96);
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: #0f172a;
}

@media (max-width: 900px) {
  .hero-grid,
  .course-panel {
    grid-template-columns: 1fr;
  }

  .course-panel {
    grid-column: span 12;
  }

  .nav-sidebar,
  .nav-sidebar.collapsed {
    position: static;
    width: 100%;
    transform: none;
  }

  .sidebar-toggle {
    position: static;
    width: 100%;
    min-height: 52px;
    border-radius: 18px;
    border-right: 1px solid rgba(148, 163, 184, 0.25);
    flex-direction: row;
  }

  .sidebar-toggle-label {
    font-size: 15px;
    writing-mode: horizontal-tb;
  }
}
</style>
