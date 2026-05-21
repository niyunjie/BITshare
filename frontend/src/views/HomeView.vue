<template>
  <AppShell :plain-middle="true">
    <template #hero>
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-kicker">{{ t.heroKicker }}</p>
          <h1>{{ t.heroTitle }}</h1>
          <p class="hero-description">{{ t.heroDescription }}</p>
          <div class="hero-actions">
            <router-link class="pill-link" :to="featuredLink">{{ t.exploreNow }}</router-link>
            <span class="hero-hint">{{ t.heroHint }}</span>
          </div>
        </div>

        <div class="carousel card">
          <div class="section-heading">
            <h2>{{ t.carouselTitle }}</h2>
            <p>{{ currentSlideIndex + 1 }} / {{ slides.length || 1 }}</p>
          </div>
          <div class="carousel-panel" :style="carouselStyle">
            <p class="slide-tag">{{ slides[currentSlideIndex]?.tag }}</p>
            <h3>{{ slides[currentSlideIndex]?.title }}</h3>
            <p>{{ slides[currentSlideIndex]?.description }}</p>
          </div>
          <div class="carousel-dots">
            <button
              v-for="(slide, index) in slides"
              :key="slide.title"
              :class="{ active: index === currentSlideIndex }"
              type="button"
              @click="currentSlideIndex = index"
            />
          </div>
        </div>
      </section>
    </template>

    <template #middle>
      <section class="info-grid">
        <article class="card announcement-panel compact-card">
          <div class="section-heading">
            <h2>{{ t.noticeTitle }}</h2>
            <p>{{ t.noticeSubtitle }}</p>
          </div>
          <div class="notice-list">
            <div v-for="notice in notices" :key="notice.title" class="notice-item">
              <strong>{{ notice.title }}</strong>
              <p>{{ notice.description }}</p>
            </div>
          </div>
        </article>

        <article class="card stats-panel compact-card">
          <div class="section-heading">
            <h2>{{ t.snapshotTitle }}</h2>
            <p>{{ t.snapshotSubtitle }}</p>
          </div>
          <div class="stats-grid">
            <div class="stat">
              <strong>{{ officialColleges.length }}</strong>
              <span>{{ t.statsColleges }}</span>
            </div>
            <div class="stat">
              <strong>{{ totalMajors }}</strong>
              <span>{{ t.statsMajors }}</span>
            </div>
            <div class="stat">
              <strong>{{ t.statsAccessValue }}</strong>
              <span>{{ t.statsAccessLabel }}</span>
            </div>
          </div>
        </article>
      </section>
    </template>

    <template #bottom>
      <section class="catalog-section">
        <div class="section-heading">
          <h2>{{ t.collegeTitle }}</h2>
          <p>{{ t.collegeSubtitle }}</p>
        </div>

        <div v-if="!officialColleges.length" class="empty-state">{{ t.emptyColleges }}</div>

        <div v-else class="college-grid">
          <router-link
            v-for="college in officialColleges"
            :key="college.code"
            class="college-card"
            :to="`/college/${college.code}`"
            :style="{
              '--college-start': buildCollegePalette(college.code)[0],
              '--college-end': buildCollegePalette(college.code)[1]
            }"
          >
            <div class="college-badge">{{ buildInitials(pickText(locale, college.name_zh, college.name_en, college.code)) }}</div>
            <strong>{{ pickText(locale, college.name_zh, college.name_en, college.code) }}</strong>
            <p>{{ college.intro || t.collegeFallback }}</p>
          </router-link>
        </div>
      </section>
    </template>

    <template #extra>
      <section v-if="otherColleges.length" class="catalog-section other-section">
        <div class="section-heading other-heading">
          <div>
            <h2>{{ t.otherTitle }}</h2>
            <p>{{ t.otherSubtitle }}</p>
          </div>
          <button class="toggle-button" type="button" @click="otherExpanded = !otherExpanded">
            {{ otherExpanded ? t.otherToggleClose : t.otherToggleOpen }}
          </button>
        </div>

        <transition name="other-panel">
          <div v-show="otherExpanded" class="college-grid other-grid">
            <router-link
              v-for="college in otherColleges"
              :key="college.code"
              class="college-card other-card"
              :to="`/college/${college.code}`"
              :style="{
                '--college-start': buildCollegePalette(college.code)[0],
                '--college-end': buildCollegePalette(college.code)[1]
              }"
            >
              <div class="college-badge">
                {{ buildInitials(pickText(locale, college.name_zh, college.name_en, college.code)) }}
              </div>
              <strong>{{ pickText(locale, college.name_zh, college.name_en, college.code) }}</strong>
              <p>{{ college.intro || t.otherFallback }}</p>
            </router-link>
          </div>
        </transition>
      </section>
    </template>
  </AppShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import AppShell from '../components/AppShell.vue'
import { getColleges } from '../api/college'
import { getMajors } from '../api/major'
import { useUiStore } from '../stores/ui'
import { buildCollegePalette, buildInitials, pickText } from '../utils/content'

const uiStore = useUiStore()
const colleges = ref([])
const majorsByCollege = ref({})
const currentSlideIndex = ref(0)
const otherExpanded = ref(false)
let timerId = null

const copy = {
  zh: {
    heroKicker: 'BITshare Campus',
    heroTitle: '一个账号进入北理工课程资料地图',
    heroDescription: '围绕学院、专业和课程组织资料，帮助你在电脑、平板和手机上都能快速找到想要的内容。',
    exploreNow: '开始查看学院',
    heroHint: '顶部搜索支持课程名和课程编号',
    carouselTitle: '轮播图',
    noticeTitle: '公告',
    noticeSubtitle: '平台使用提醒',
    snapshotTitle: '平台概览',
    snapshotSubtitle: '当前可浏览的数据视图',
    statsColleges: '学院',
    statsMajors: '专业',
    statsAccessValue: '24/7',
    statsAccessLabel: '跨屏访问',
    collegeTitle: '学院',
    collegeSubtitle: '按学院进入专业与课程内容',
    emptyColleges: '暂无学院数据。',
    collegeFallback: '进入查看学院简介、专业与课程。',
    noticeList: [
      { title: '统一入口', description: '使用北理工账号密码登录后，未登录用户无法访问任意业务页面。' },
      { title: '跨端适配', description: '页面已经按桌面端、平板和手机视口优化排版。' },
      { title: '资源检索', description: '可通过头部搜索快速跳转课程结果页。' }
    ],
    slideIntro: '聚合学院、专业与课程的三层结构',
    slideSearch: '从头部搜索直接进入课程结果',
    slideAccess: '资料支持课程页面集中浏览与下载'
  },
  en: {
    heroKicker: 'BITshare Campus',
    heroTitle: 'One login for the BIT course resource map',
    heroDescription: 'Browse by college, major, and course with a responsive layout that works on desktop, tablet, and phone.',
    exploreNow: 'Browse colleges',
    heroHint: 'Header search supports course names and course codes',
    carouselTitle: 'Highlights',
    noticeTitle: 'Announcements',
    noticeSubtitle: 'How to use the platform',
    snapshotTitle: 'Overview',
    snapshotSubtitle: 'Current dataset view',
    statsColleges: 'Colleges',
    statsMajors: 'Majors',
    statsAccessValue: '24/7',
    statsAccessLabel: 'Responsive access',
    collegeTitle: 'Colleges',
    collegeSubtitle: 'Enter by college to explore majors and courses',
    emptyColleges: 'No college data yet.',
    collegeFallback: 'Open to view the introduction, majors, and courses.',
    noticeList: [
      { title: 'Single entry', description: 'BIT credentials are the only login path and unauthenticated users are blocked from all pages.' },
      { title: 'Responsive by default', description: 'The interface is tuned for desktop, tablet, and mobile screens.' },
      { title: 'Fast retrieval', description: 'Use header search to jump straight to the course results page.' }
    ],
    slideIntro: 'A three-layer structure built around colleges, majors, and courses',
    slideSearch: 'Jump into course results from the header search',
    slideAccess: 'Course resources stay together for reading and downloading'
  }
}

copy.zh.otherTitle = '其他'
copy.zh.otherSubtitle = '以下单位来自课程数据中的开课单位，暂未纳入学院与专业目录。'
copy.zh.otherFallback = '仅维护课程，不单独维护专业。'
copy.en.otherTitle = 'Other'
copy.en.otherSubtitle = 'These units come from course offering data and are not yet listed in the college-major catalog.'
copy.en.otherFallback = 'Courses only, with no separate major list.'
copy.zh.otherToggleOpen = '展开其他'
copy.zh.otherToggleClose = '收起其他'
copy.en.otherToggleOpen = 'Open other'
copy.en.otherToggleClose = 'Collapse other'

const locale = computed(() => uiStore.locale)
const t = computed(() => copy[locale.value])
const officialColleges = computed(() => colleges.value.filter((college) => !Number(college.is_virtual)))
const otherColleges = computed(() => colleges.value.filter((college) => Number(college.is_virtual)))
const totalMajors = computed(() =>
  Object.values(majorsByCollege.value).reduce((sum, majors) => sum + majors.length, 0)
)
const featuredLink = computed(() =>
  officialColleges.value[0]
    ? `/college/${officialColleges.value[0].code}`
    : otherColleges.value[0]
      ? `/college/${otherColleges.value[0].code}`
      : '/search?q=AUTO101'
)
const slides = computed(() => [
  {
    tag: '01',
    title: pickText(locale.value, '首页结构', 'Home structure'),
    description: t.value.slideIntro
  },
  {
    tag: '02',
    title: pickText(locale.value, '搜索入口', 'Search entry'),
    description: t.value.slideSearch
  },
  {
    tag: '03',
    title: pickText(locale.value, '资料获取', 'Resource access'),
    description: t.value.slideAccess
  }
])
const notices = computed(() => t.value.noticeList)
const paletteColleges = computed(() => (officialColleges.value.length ? officialColleges.value : colleges.value))
const carouselStyle = computed(() => ({
  '--carousel-start': buildCollegePalette(
    paletteColleges.value[currentSlideIndex.value % Math.max(paletteColleges.value.length, 1)]?.code
  )[0],
  '--carousel-end': buildCollegePalette(
    paletteColleges.value[currentSlideIndex.value % Math.max(paletteColleges.value.length, 1)]?.code
  )[1]
}))

onMounted(async () => {
  try {
    colleges.value = await getColleges()
    const entries = await Promise.all(
      officialColleges.value.map(async (college) => [college.code, await getMajors(college.code)])
    )
    majorsByCollege.value = Object.fromEntries(entries)
  } catch (error) {
    console.error(error)
    colleges.value = []
    majorsByCollege.value = {}
  }

  timerId = window.setInterval(() => {
    currentSlideIndex.value = (currentSlideIndex.value + 1) % slides.value.length
  }, 4200)
})

onBeforeUnmount(() => {
  if (timerId) {
    window.clearInterval(timerId)
  }
})
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr;
  gap: 20px;
  align-items: stretch;
}

.hero-copy {
  padding: 6px 4px;
}

.hero-kicker {
  margin: 0 0 12px;
  color: #0b4f6c;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  font-size: 12px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2rem, 1.4rem + 2vw, 3.7rem);
  line-height: 1.05;
}

.hero-description {
  max-width: 52ch;
  margin: 18px 0 24px;
  color: #475569;
  font-size: 1.05rem;
}

.hero-actions {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.hero-hint {
  color: #64748b;
}

.carousel {
  min-height: 280px;
}

.carousel-panel {
  padding: 24px;
  min-height: 200px;
  border-radius: 24px;
  color: #fff;
  background: linear-gradient(135deg, var(--carousel-start), var(--carousel-end));
}

.slide-tag {
  margin: 0 0 14px;
  opacity: 0.8;
  letter-spacing: 0.18em;
}

.carousel-panel h3 {
  margin: 0 0 10px;
  font-size: 1.6rem;
}

.carousel-panel p:last-child {
  margin: 0;
}

.carousel-dots {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.carousel-dots button {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: rgba(148, 163, 184, 0.45);
  cursor: pointer;
}

.carousel-dots .active {
  width: 34px;
  border-radius: 999px;
  background: #0b4f6c;
}

.announcement-panel {
  grid-column: span 7;
}

.stats-panel {
  grid-column: span 5;
}

.notice-list,
.stats-grid {
  display: grid;
  gap: 14px;
}

.notice-item {
  padding: 20px 22px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.9);
}

.notice-item strong {
  display: block;
  margin-bottom: 6px;
}

.notice-item p {
  margin: 0;
  color: #64748b;
}

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat {
  padding: 26px 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  text-align: center;
}

.compact-card {
  min-height: 100%;
}

.stat strong {
  display: block;
  font-size: 2rem;
}

.stat span {
  color: #64748b;
}

.college-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}

.college-card {
  min-height: 220px;
  padding: 22px;
  border-radius: 26px;
  color: #fff;
  background: linear-gradient(145deg, var(--college-start), var(--college-end));
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.college-badge {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 700;
}

.college-card strong {
  font-size: 1.25rem;
}

.college-card p {
  margin: 0;
  opacity: 0.92;
}

.other-section {
  margin-top: 34px;
  display: grid;
  gap: 16px;
}

.bottom-sections {
  display: grid;
  gap: 30px;
}

.catalog-section {
  display: grid;
  gap: 18px;
}

.other-heading {
  align-items: center;
}

.toggle-button {
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

.toggle-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.other-grid {
  padding-top: 4px;
}

.other-card {
  min-height: 170px;
}

.other-panel-enter-active,
.other-panel-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
  transform-origin: top center;
}

.other-panel-enter-from,
.other-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 960px) {
  .hero,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .announcement-panel,
  .stats-panel {
    grid-column: span 12;
  }

  .other-heading {
    align-items: start;
  }
}
</style>
