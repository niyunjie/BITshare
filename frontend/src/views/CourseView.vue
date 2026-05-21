<template>
  <AppShell :plain-middle="true" :plain-bottom="true">
    <template #hero>
      <section id="course-overview" class="course-hero hero-card">
        <div class="hero-grid">
          <div class="hero-copy">
            <div>
              <Breadcrumb />
              <h1>{{ title }}</h1>
              <p>{{ course?.description || t.descriptionFallback }}</p>
            </div>
          </div>

          <div class="hero-side">
            <div class="meta-list two-col">
              <div class="meta-item">
                <strong>{{ t.metaCode }}</strong>
                <span>{{ course?.course_code || '-' }}</span>
              </div>
              <div class="meta-item">
                <strong>{{ t.metaCredit }}</strong>
                <span>{{ course?.credit || '-' }}</span>
              </div>
              <div class="meta-item">
                <strong>{{ t.metaCollege }}</strong>
                <span>{{ teachingCollege }}</span>
              </div>
              <div class="meta-item">
                <strong>{{ t.metaMajor }}</strong>
                <span>{{ teachingMajor }}</span>
              </div>
            </div>
            <a
              v-if="course"
              class="pill-link"
              :href="`${API_BASE_URL}/download-all/${course.course_code}`"
              target="_blank"
              rel="noreferrer"
            >
              {{ t.downloadAll }}
            </a>
          </div>
        </div>
      </section>
    </template>

    <template #middle>
      <div id="course-outline">
        <DocumentPreviewPanel
          :title="t.outlineTitle"
          :subtitle="t.outlineSubtitle"
          :empty-text="t.emptyOutline"
          :documents="outlineDocuments"
          :download-label="t.downloadOutline"
          :preview-tip="t.previewTip"
        />
      </div>
    </template>

    <template #bottom>
      <section class="bottom-layout">
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
              <button type="button" class="nav-link" @click="scrollToSection('course-overview')">
                {{ t.navOverview }}
              </button>
              <button type="button" class="nav-link" @click="scrollToSection('course-outline')">
                {{ t.navOutline }}
              </button>
              <button type="button" class="nav-link" @click="scrollToSection('course-resources')">
                {{ t.navResources }}
              </button>
              <a
                v-if="course"
                class="nav-link nav-link-anchor"
                :href="`${API_BASE_URL}/download-all/${course.course_code}`"
                target="_blank"
                rel="noreferrer"
              >
                {{ t.downloadAll }}
              </a>
            </div>
          </section>
        </aside>

        <article id="course-resources" class="card resource-panel surface-card">
          <div class="section-heading">
            <h2>{{ t.resourceTitle }}</h2>
            <p>{{ t.resourceSubtitle }}</p>
          </div>
          <div v-if="!exams.length && !ppts.length && !notes.length" class="empty-state">
            {{ t.emptyResource }}
          </div>
          <div v-else class="resource-sections">
            <div class="resource-section">
              <div class="section-heading">
                <h3>{{ t.examTitle }}</h3>
                <p>{{ t.examSubtitle }}</p>
              </div>
              <div v-if="!exams.length" class="empty-state">{{ t.emptyExam }}</div>
              <div v-else class="resource-list">
                <div v-for="(list, year) in examGroups" :key="year" class="exam-group">
                  <strong class="group-label">{{ year }}</strong>
                  <a
                    v-for="resource in list"
                    :key="resource.id"
                    class="resource-row"
                    :href="`${API_BASE_URL}/download/${resource.id}`"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{{ resource.title }}</span>
                    <span>{{ t.download }}</span>
                  </a>
                </div>
              </div>
            </div>

            <div class="resource-section">
              <div class="section-heading">
                <h3>PPT</h3>
                <p>{{ t.pptSubtitle }}</p>
              </div>
              <div v-if="!ppts.length" class="empty-state">{{ t.emptyPpt }}</div>
              <div v-else class="resource-list">
                <a
                  v-for="resource in ppts"
                  :key="resource.id"
                  class="resource-row"
                  :href="`${API_BASE_URL}/download/${resource.id}`"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{{ resource.title }}</span>
                  <span>{{ t.download }}</span>
                </a>
              </div>
            </div>

            <div class="resource-section">
              <div class="section-heading">
                <h3>{{ t.noteTitle }}</h3>
                <p>{{ t.noteSubtitle }}</p>
              </div>
              <div v-if="!notes.length" class="empty-state">{{ t.emptyNote }}</div>
              <div v-else class="resource-list">
                <a
                  v-for="resource in notes"
                  :key="resource.id"
                  class="resource-row"
                  :href="`${API_BASE_URL}/download/${resource.id}`"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{{ resource.title }}</span>
                  <span>{{ t.download }}</span>
                </a>
              </div>
            </div>
          </div>
        </article>

        <aside :class="['upload-sidebar', { collapsed: uploadSidebarCollapsed }]">
          <button
            class="sidebar-toggle upload-toggle"
            type="button"
            :aria-expanded="String(!uploadSidebarCollapsed)"
            @click="uploadSidebarCollapsed = !uploadSidebarCollapsed"
          >
            <span class="sidebar-toggle-icon">
              {{ uploadSidebarCollapsed ? '+' : '-' }}
            </span>
            <span class="sidebar-toggle-label">
              {{ uploadSidebarCollapsed ? t.openUpload : t.closeUpload }}
            </span>
          </button>

          <section v-if="!uploadSidebarCollapsed" class="upload-card card">
            <div class="section-heading">
              <h2>{{ t.uploadTitle }}</h2>
              <p>{{ t.uploadSubtitle }}</p>
            </div>

            <div class="upload-grid">
              <label>
                <span>{{ t.formType }}</span>
                <select v-model="uploadType">
                  <option value="exam">{{ t.typeExam }}</option>
                  <option value="ppt">PPT</option>
                  <option value="note">{{ t.typeNote }}</option>
                </select>
              </label>

              <label>
                <span>{{ t.formTitle }}</span>
                <input v-model="uploadTitle" :placeholder="t.formTitlePlaceholder" type="text" />
              </label>

              <label v-if="uploadType === 'exam'">
                <span>{{ t.formYear }}</span>
                <input v-model="academicYear" :placeholder="t.formYearPlaceholder" type="text" />
              </label>

              <label>
                <span>{{ t.formFile }}</span>
                <input ref="fileInput" type="file" @change="handleFile" />
              </label>
            </div>

            <div class="upload-actions">
              <button class="upload-button" type="button" :disabled="uploading" @click="uploadFile">
                {{ uploading ? t.uploading : t.uploadNow }}
              </button>
              <span v-if="uploadMessage" :class="['upload-message', uploadSuccess ? 'success' : 'error']">
                {{ uploadMessage }}
              </span>
            </div>
          </section>
        </aside>
      </section>
    </template>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getCourseDetail } from '../api/courseDetail'
import { API_BASE_URL } from '../api/http'
import { getResources } from '../api/resource'
import AppShell from '../components/AppShell.vue'
import Breadcrumb from '../components/Breadcrumb.vue'
import DocumentPreviewPanel from '../components/DocumentPreviewPanel.vue'
import { useBreadcrumbStore } from '../stores/breadcrumb'
import { useUiStore } from '../stores/ui'
import { pickText } from '../utils/content'

const route = useRoute()
const breadcrumb = useBreadcrumbStore()
const uiStore = useUiStore()

const course = ref(null)
const outlines = ref([])
const exams = ref([])
const ppts = ref([])
const notes = ref([])

const uploadType = ref('exam')
const uploadTitle = ref('')
const academicYear = ref('')
const selectedFile = ref(null)
const uploading = ref(false)
const uploadMessage = ref('')
const uploadSuccess = ref(false)
const fileInput = ref(null)
const uploadSidebarCollapsed = ref(true)
const navSidebarCollapsed = ref(true)

const copy = {
  zh: {
    descriptionFallback: '当前没有录入课程介绍，可先查看课程大纲与资料区。',
    downloadAll: '下载全部资料',
    overviewTitle: '课程介绍',
    overviewSubtitle: '课程信息总览',
    metaCode: '课程编号',
    metaCollege: '授课学院',
    metaCredit: '学分',
    metaMajor: '关联专业',
    outlineTitle: '课程大纲',
    outlineSubtitle: '双语课程大纲支持在线预览与下载，不提供上传。',
    emptyOutline: '暂无课程大纲。',
    uploadTitle: '资料上传',
    uploadSubtitle: '补充考试、PPT、笔记资料',
    formType: '资料类型',
    typeExam: '试卷',
    typeNote: '笔记',
    formTitle: '标题',
    formTitlePlaceholder: '请输入资料标题',
    formYear: '学年',
    formYearPlaceholder: '例如 2025-2026',
    formFile: '文件',
    uploading: '上传中...',
    uploadNow: '上传资料',
    resourceTitle: '资料',
    resourceSubtitle: '试卷、PPT 与笔记并列展示',
    emptyResource: '暂无资料。',
    examTitle: '试卷',
    examSubtitle: '按学年查看',
    pptSubtitle: '课件资料',
    noteTitle: '笔记',
    noteSubtitle: '学习记录与整理',
    emptyExam: '暂无试卷。',
    emptyPpt: '暂无 PPT。',
    emptyNote: '暂无笔记。',
    download: '下载',
    downloadOutline: '下载课程大纲',
    uploadSelectFile: '请选择文件',
    uploadSuccess: '上传成功',
    uploadFailed: '上传失败',
    uploadError: '上传发生错误',
    previewTip: '支持浏览器内预览 PDF、Word、Excel 等文件',
    navTitle: '页面导航',
    navSubtitle: '快速跳转内容区',
    navOverview: '课程介绍',
    navOutline: '课程大纲',
    navResources: '资料区',
    openNav: '导航',
    closeNav: '收起',
    openUpload: '上传',
    closeUpload: '收起'
  },
  en: {
    descriptionFallback: 'No course description is available yet. You can still browse the outline and resources below.',
    downloadAll: 'Download all resources',
    overviewTitle: 'Course overview',
    overviewSubtitle: 'Course facts at a glance',
    metaCode: 'Course code',
    metaCollege: 'Teaching college',
    metaCredit: 'Credits',
    metaMajor: 'Related major',
    outlineTitle: 'Course outline',
    outlineSubtitle: 'Bilingual outlines support inline preview and download, with no upload entry.',
    emptyOutline: 'No course outline yet.',
    uploadTitle: 'Upload resources',
    uploadSubtitle: 'Add exams, PPT, and notes.',
    formType: 'Resource type',
    typeExam: 'Exam',
    typeNote: 'Notes',
    formTitle: 'Title',
    formTitlePlaceholder: 'Enter a resource title',
    formYear: 'Academic year',
    formYearPlaceholder: 'For example 2025-2026',
    formFile: 'File',
    uploading: 'Uploading...',
    uploadNow: 'Upload resource',
    resourceTitle: 'Resources',
    resourceSubtitle: 'Exams, PPT, and notes shown side by side',
    emptyResource: 'No resources yet.',
    examTitle: 'Exams',
    examSubtitle: 'Grouped by academic year',
    pptSubtitle: 'Lecture materials',
    noteTitle: 'Notes',
    noteSubtitle: 'Study notes and summaries',
    emptyExam: 'No exams yet.',
    emptyPpt: 'No PPT files yet.',
    emptyNote: 'No notes yet.',
    download: 'Download',
    downloadOutline: 'Download outline',
    uploadSelectFile: 'Please choose a file',
    uploadSuccess: 'Upload succeeded',
    uploadFailed: 'Upload failed',
    uploadError: 'Upload error',
    previewTip: 'PDF, Word, and Excel files are previewed inline when supported by the browser; otherwise they download.',
    navTitle: 'Page navigation',
    navSubtitle: 'Jump to sections',
    navOverview: 'Overview',
    navOutline: 'Outline',
    navResources: 'Resources',
    openNav: 'Nav',
    closeNav: 'Hide',
    openUpload: 'Upload',
    closeUpload: 'Hide'
  }
}

const locale = computed(() => uiStore.locale)
const t = computed(() => copy[locale.value])
const title = computed(() => pickText(locale.value, course.value?.name_zh, course.value?.name_en, route.params.code))
const teachingCollege = computed(() =>
  pickText(locale.value, course.value?.college_name_zh, course.value?.college_name_en, '-')
)
const teachingMajor = computed(() => {
  const majorTitle = pickText(locale.value, course.value?.major_name_zh, course.value?.major_name_en, '')
  return majorTitle || '-'
})
const examGroups = computed(() => {
  const map = {}

  exams.value.forEach((resource) => {
    const year = resource.academic_year || (locale.value === 'zh' ? '未标注学年' : 'Unspecified')
    if (!map[year]) {
      map[year] = []
    }
    map[year].push(resource)
  })

  return Object.fromEntries(Object.entries(map).sort((a, b) => String(b[0]).localeCompare(String(a[0]))))
})
const outlineDocuments = computed(() =>
  outlines.value.map((resource) => ({
    id: String(resource.id),
    title: resource.title,
    original_name: resource.original_name || resource.filename || resource.title,
    preview_url: `/api/preview/${resource.id}`,
    download_url: `/api/download/${resource.id}`
  }))
)

function handleFile(event) {
  const [file] = event.target.files
  selectedFile.value = file || null

  if (!uploadTitle.value && file) {
    uploadTitle.value = file.name
  }
}

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

async function loadResources(code) {
  const resources = await getResources(code)
  outlines.value = resources.filter((resource) => resource.type === 'outline')
  exams.value = resources.filter((resource) => resource.type === 'exam')
  ppts.value = resources.filter((resource) => resource.type === 'ppt')
  notes.value = resources.filter((resource) => resource.type === 'note')
}

async function uploadFile() {
  if (!selectedFile.value || !course.value) {
    uploadMessage.value = t.value.uploadSelectFile
    uploadSuccess.value = false
    return
  }

  uploading.value = true
  uploadMessage.value = ''
  uploadSuccess.value = false

  const form = new FormData()
  form.append('file', selectedFile.value)
  form.append('course_code', course.value.course_code)
  form.append('type', uploadType.value)
  form.append('title', uploadTitle.value || selectedFile.value.name)
  form.append('academic_year', academicYear.value)

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: form
    })
    const result = await response.json()

    if (!response.ok || result.code !== 0) {
      throw new Error(result.message || t.value.uploadFailed)
    }

    uploadMessage.value = t.value.uploadSuccess
    uploadSuccess.value = true
    uploadTitle.value = ''
    academicYear.value = ''
    selectedFile.value = null

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    await loadResources(course.value.course_code)
  } catch (error) {
    uploadMessage.value = error.message || t.value.uploadError
    uploadSuccess.value = false
  } finally {
    uploading.value = false
  }
}

onMounted(async () => {
  const code = String(route.params.code)
  course.value = await getCourseDetail(code)
  await loadResources(code)

  const items = [
    { title: locale.value === 'zh' ? '首页' : 'Home', path: '/home' },
    {
      title: pickText(locale.value, course.value?.college_name_zh, course.value?.college_name_en, course.value?.college_code),
      path: course.value?.college_code ? `/college/${course.value.college_code}` : '/home'
    },
  ]

  if (course.value?.major_code) {
    items.push({
      title: pickText(
        locale.value,
        course.value?.major_name_zh,
        course.value?.major_name_en,
        course.value?.major_code
      ),
      path: `/major/${course.value.major_code}`
    })
  }

  items.push({ title: title.value, path: '' })
  breadcrumb.set(items)
})
</script>

<style scoped>
.course-hero {
  display: block;
}

.course-hero h1 {
  margin: 12px 0 10px;
  font-size: clamp(1.8rem, 1.3rem + 1.8vw, 3rem);
}

.course-hero p {
  margin: 0;
  color: #475569;
  max-width: 64ch;
}

.hero-card {
  padding: 8px 4px 4px;
}

.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.hero-copy,
.hero-side {
  display: grid;
  gap: 16px;
}

.hero-side .meta-item {
  min-height: 108px;
  padding: 18px 20px;
  background: transparent;
  border-style: solid;
  border-width: 1px;
  border-color: rgba(148, 163, 184, 0.22);
}

.upload-card {
  display: grid;
  gap: 18px;
  padding: 20px;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.upload-grid label {
  display: grid;
  gap: 8px;
}

.upload-grid span {
  color: #64748b;
  font-size: 14px;
}

.upload-grid input,
.upload-grid select,
.upload-button {
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: #fff;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-button {
  cursor: pointer;
  background: linear-gradient(135deg, #0b4f6c 0%, #14532d 100%);
  color: #fff;
  border: none;
}

.upload-message.success {
  color: #166534;
}

.upload-message.error {
  color: #b91c1c;
}

.resource-panel {
  min-width: 0;
}

.resource-sections {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.bottom-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  align-items: start;
}

.nav-sidebar,
.upload-sidebar {
  position: fixed;
  top: 148px;
  display: grid;
  gap: 12px;
  z-index: 30;
  transition: transform 0.28s ease;
}

.nav-sidebar {
  left: 0;
  width: 320px;
  transform: translateX(-100%);
}

.nav-sidebar.collapsed {
  transform: translateX(-100%);
}

.nav-sidebar:not(.collapsed) {
  transform: translateX(0);
}

.upload-sidebar {
  right: 0;
  width: 360px;
  transform: translateX(100%);
}

.upload-sidebar.collapsed {
  transform: translateX(100%);
}

.upload-sidebar:not(.collapsed) {
  transform: translateX(0);
}

.sidebar-toggle {
  position: absolute;
  top: 28px;
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

.nav-toggle {
  right: -58px;
}

.upload-toggle {
  left: -58px;
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

.upload-card .section-heading,
.nav-card .section-heading {
  display: grid;
  justify-content: start;
  gap: 6px;
}

.upload-card .section-heading h2,
.nav-card .section-heading h2 {
  white-space: nowrap;
}

.upload-card .section-heading p,
.nav-card .section-heading p {
  max-width: 18ch;
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

.nav-link-anchor {
  display: inline-flex;
  align-items: center;
}

.surface-card {
  padding: 24px 26px;
}

.resource-section {
  display: grid;
  align-content: start;
  gap: 12px;
}

.resource-list {
  display: grid;
  gap: 10px;
}

.resource-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.95);
}

.group-label {
  display: inline-block;
  margin-bottom: 8px;
}

.exam-group + .exam-group {
  margin-top: 12px;
}

@media (max-width: 960px) {
  .resource-sections,
  .two-col,
  .hero-grid,
  .bottom-layout {
    grid-template-columns: 1fr;
  }

  .upload-sidebar,
  .nav-sidebar,
  .nav-sidebar.collapsed,
  .upload-sidebar.collapsed {
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

  .nav-toggle {
    border-left: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 18px;
  }

  .upload-toggle {
    left: auto;
  }

  .sidebar-toggle-label {
    font-size: 15px;
    writing-mode: horizontal-tb;
  }
}
</style>
