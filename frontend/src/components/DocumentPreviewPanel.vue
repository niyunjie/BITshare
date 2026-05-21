<template>
  <section class="preview-card card">
    <div class="section-heading">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
      <a
        v-if="activeDocument"
        class="pill-link"
        :href="buildAbsoluteUrl(activeDocument.download_url)"
        target="_blank"
        rel="noreferrer"
      >
        {{ downloadLabel }}
      </a>
    </div>

    <div v-if="!documents.length" class="empty-state">{{ emptyText }}</div>

    <div v-else class="preview-layout">
      <div class="document-tabs">
        <button
          v-for="document in documents"
          :key="document.id"
          type="button"
          :class="['document-tab', { active: document.id === activeId }]"
          @click="activeId = document.id"
        >
          <strong>{{ document.title || document.original_name }}</strong>
          <span>{{ document.original_name }}</span>
        </button>
      </div>

      <div class="preview-stage">
        <iframe
          v-if="activeDocument && canPreviewInline"
          :key="activeDocument.id"
          class="preview-frame"
          :src="buildAbsoluteUrl(activeDocument.preview_url)"
          :title="activeDocument.title || activeDocument.original_name"
        />

        <div v-else-if="activeDocument" class="preview-fallback">
          <strong>{{ unsupportedTitle }}</strong>
          <p>{{ unsupportedMessage }}</p>
          <a
            class="pill-link"
            :href="buildAbsoluteUrl(activeDocument.download_url)"
            target="_blank"
            rel="noreferrer"
          >
            {{ downloadLabel }}
          </a>
        </div>

        <p class="preview-tip">{{ previewTip }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

import { API_BASE_URL } from '../api/http'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  emptyText: {
    type: String,
    required: true
  },
  documents: {
    type: Array,
    default: () => []
  },
  downloadLabel: {
    type: String,
    required: true
  },
  previewTip: {
    type: String,
    required: true
  }
})

const activeId = ref('')
const inlinePreviewExtensions = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt'])

const activeDocument = computed(
  () => props.documents.find((document) => document.id === activeId.value) || props.documents[0] || null
)

const activeExtension = computed(() => {
  const fileName = activeDocument.value?.original_name || activeDocument.value?.title || ''
  const parts = fileName.split('.')

  if (parts.length < 2) {
    return ''
  }

  return parts.at(-1)?.toLowerCase() || ''
})

const canPreviewInline = computed(() => inlinePreviewExtensions.has(activeExtension.value))
const unsupportedTitle = computed(() => '当前格式暂不支持浏览器内直接预览')
const unsupportedMessage = computed(() => {
  const extensionLabel = activeExtension.value ? activeExtension.value.toUpperCase() : '该'
  return `${extensionLabel} 文件可以下载后查看；如果需要页内预览，建议转换为 PDF。`
})

watch(
  () => props.documents,
  (documents) => {
    if (!documents.length) {
      activeId.value = ''
      return
    }

    if (!documents.some((document) => document.id === activeId.value)) {
      activeId.value = documents[0].id
    }
  },
  { immediate: true }
)

function buildAbsoluteUrl(path) {
  if (!path) {
    return ''
  }

  if (path.startsWith('http')) {
    return path
  }

  return `${API_BASE_URL.replace(/\/api$/, '')}${path}`
}
</script>

<style scoped>
.preview-card {
  padding: 24px;
}

.preview-layout {
  display: grid;
  gap: 18px;
}

.document-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
  gap: 12px;
  align-items: stretch;
}

.document-tab {
  padding: 18px 22px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 24px;
  background: rgba(248, 250, 252, 0.92);
  cursor: pointer;
  text-align: left;
  display: grid;
  gap: 6px;
  min-height: 110px;
}

.document-tab strong {
  color: #0f172a;
  font-size: 1.05rem;
}

.document-tab span {
  color: #64748b;
  word-break: break-word;
  font-size: 0.98rem;
}

.document-tab.active {
  border-color: rgba(11, 79, 108, 0.38);
  background: rgba(234, 245, 250, 0.96);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.preview-stage {
  min-height: 760px;
  display: grid;
  gap: 14px;
}

.preview-frame {
  width: 100%;
  min-height: 720px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 28px;
  background: #fff;
}

.preview-fallback {
  min-height: 720px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 14px;
  padding: 42px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 28px;
  background: rgba(248, 250, 252, 0.92);
  text-align: center;
}

.preview-fallback strong,
.preview-fallback p {
  margin: 0;
}

.preview-fallback strong {
  font-size: 1.1rem;
}

.preview-fallback p {
  color: #64748b;
  max-width: 34ch;
  font-size: 1.02rem;
  line-height: 1.6;
  margin-inline: auto;
}

.preview-tip {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  text-align: center;
}

@media (max-width: 960px) {
  .document-tabs {
    grid-template-columns: 1fr;
  }

  .preview-stage {
    min-height: 520px;
  }

  .preview-frame,
  .preview-fallback {
    min-height: 480px;
  }
}
</style>
