<template lang="pug">
main.console-page
  section.auth-shell(v-if="authMode !== 'app'")
    form.auth-panel(@submit.prevent="authMode === 'setup' ? setupAdmin() : login()")
      div.auth-head
        p.brand-kicker Deplois
        h1.brand-title Asset Console
        p.brand-copy(v-if="authMode === 'setup'") 최초 시스템 관리자 계정을 설정합니다.
        p.brand-copy(v-else) 시스템 관리자 계정으로 로그인합니다.
      div.auth-fields
        label.field
          span 관리자 ID
          input.compact-field(v-model="authForm.loginId" required type="text" placeholder="admin")
        label.field
          span 비밀번호
          input.compact-field(v-model="authForm.password" required type="password" placeholder="비밀번호")
        template(v-if="authMode === 'setup'")
          label.field
            span 이름
            input.compact-field(v-model="authForm.name" required type="text" placeholder="홍길동")
          label.field
            span 부서
            input.compact-field(v-model="authForm.department" required type="text" placeholder="인프라운영팀")
          label.field
            span 직책
            input.compact-field(v-model="authForm.title" required type="text" placeholder="시스템 관리자")
      div.action-row.auth-actions
        button.solid-button(type="submit" :disabled="authLoading")
          | {{ authLoading ? '처리 중...' : authMode === 'setup' ? '관리자 계정 생성' : '로그인' }}
      p.feedback(:class="{ error: !!authError, ok: !!authMessage && !authError }") {{ authError || authMessage }}

  section.console-frame(v-else)
    aside.menu-column
      div.brand-block
        p.brand-kicker Deplois
        h1.brand-title Asset Console
        p.brand-copy 3단 운영 패널에서 자산과 관리자를 빠르게 조회하고 수정합니다.
        div.session-box
          span.menu-eyebrow Signed In
          strong.session-id {{ authUser?.loginId }}
          button.ghost-button.logout-button(type="button" @click="logout") 로그아웃

      nav.menu-list
        button.menu-card(
          type="button"
          :class="{ active: currentMenu === 'main' }"
          @click="switchMenu('main')"
        )
          span.menu-eyebrow Main
          strong.menu-name 메인
          span.menu-meta {{ activeAssets }} active
        button.menu-card(
          type="button"
          :class="{ active: currentMenu === 'asset' }"
          @click="switchMenu('asset')"
        )
          span.menu-eyebrow Asset
          strong.menu-name 자산 관리
          span.menu-meta {{ assets.length }} items
        button.menu-card(
          type="button"
          :class="{ active: currentMenu === 'manager' }"
          @click="switchMenu('manager')"
        )
          span.menu-eyebrow Manager
          strong.menu-name 관리자 관리
          span.menu-meta {{ managers.length }} people
        button.menu-card(
          type="button"
          :class="{ active: currentMenu === 'server-room' }"
          @click="switchMenu('server-room')"
        )
          span.menu-eyebrow Facility
          strong.menu-name 서버실 관리
          span.menu-meta 3 modules

    section.list-column
      template(v-if="currentMenu === 'main'")
        div.list-toolbar
          div.column-head
            div
              h2 운영 현황
              p 자산과 관리자 상태를 한눈에 보는 간단 대시보드입니다.
          div.dashboard-panel
            div.dashboard-item
              span.label 운영 자산
              strong.dashboard-value {{ activeAssets }}
            div.dashboard-item
              span.label 폐기 자산
              strong.dashboard-value {{ disposedAssets }}
            div.dashboard-item
              span.label 활성 관리자
              strong.dashboard-value {{ activeManagers.length }}
            div.dashboard-item
              span.label 전체 자산
              strong.dashboard-value {{ assets.length }}

      template(v-else-if="currentMenu === 'asset'")
        div.list-toolbar
          div.column-head
            div
              h2 자산 목록
              p UUID, 시리얼, 이름, 장소 기준으로 조회합니다.
            button.ghost-button(type="button" @click="resetAssetForm") 새 자산
          div.utility-panel
            p.feedback(:class="{ error: !!lookupError, ok: !!lookupResult && !lookupError }") {{ lookupError || lookupMessage }}
          div.filter-stack
            input.compact-field(
              v-model="filters.query"
              type="text"
              placeholder="자산 검색"
              @keydown.enter.prevent="loadAssets"
            )
            div.inline-grid
              select.compact-field(v-model="filters.category")
                option(value="") 전체 카테고리
                option(v-for="option in categoryOptions" :key="option.value" :value="option.value") {{ option.label }}
              select.compact-field(v-model="filters.status")
                option(value="") 전체 상태
                option(value="active") 운영 중
                option(value="disposed") 폐기
            div.scan-action-row
              button.solid-button.dark(type="button" :class="{ 'active-action': serverSetupStage !== 'idle' }" @click="startServerSetup") 서버세팅
              button.ghost-button(type="button" @click="openScanner('lookup')") 스캔모드
        div.item-list
          button.item-card(
            v-for="asset in assets"
            :key="asset.id"
            type="button"
            :class="{ selected: asset.id === assetForm.id }"
            @click="selectAsset(asset)"
          )
            div.asset-row
              div.asset-copy
                strong.item-title [{{ categoryLabel(asset.category) }}] {{ asset.name }}
                p.item-code {{ asset.serialNumber }}
              span.status-pill(:class="asset.status") {{ asset.status === 'active' ? '운영 중' : '폐기' }}
          div.empty-box(v-if="!assets.length") 조건에 맞는 자산이 없습니다.

      template(v-else-if="currentMenu === 'manager'")
        div.list-toolbar
          div.column-head
            div
              h2 관리자 목록
              p 부서, 직책, 이름 기준으로 빠르게 선택합니다.
            button.ghost-button(type="button" @click="resetManagerForm") 새 관리자
          div.filter-stack
            input.compact-field(
              v-model="managerQuery"
              type="text"
              placeholder="관리자 검색"
            )
        div.item-list
          button.item-card(
            v-for="manager in filteredManagers"
            :key="manager.id"
            type="button"
            :class="{ selected: manager.id === managerForm.id }"
            @click="selectManager(manager)"
          )
            strong.item-title {{ manager.name }}
            p.item-sub {{ manager.department }} / {{ manager.title }}
            p.item-code {{ manager.isActive ? '활성' : '비활성' }}
          div.empty-box(v-if="!filteredManagers.length") 등록된 관리자가 없습니다.

      template(v-else)
        div.list-toolbar
          div.column-head
            div
              h2 서버실 관리
              p 데이터센터 내부 설비와 공간 현황을 관리합니다.
        div.item-list
          button.item-card(
            v-for="module in facilityModules"
            :key="module.id"
            type="button"
            :class="{ selected: currentFacilityMenu === module.id }"
            @click="currentFacilityMenu = module.id"
          )
            strong.item-title {{ module.name }}
            p.item-sub {{ module.description }}

    section.detail-column
      template(v-if="currentMenu === 'main'")
        div.column-head
          div
            h2 메인
            p 운영 현황만 표시하는 요약 화면입니다.
        div.detail-box
          div.detail-row
            span.label 자산 상태
            p 운영 자산 {{ activeAssets }} / 폐기 자산 {{ disposedAssets }}
          div.detail-row
            span.label 관리자 상태
            p 활성 관리자 {{ activeManagers.length }} / 전체 관리자 {{ managers.length }}

      template(v-else-if="currentMenu === 'asset'")
        div.column-head
          div
            h2 {{ assetForm.id ? '자산 상세 / 수정' : '자산 등록' }}
            p 선택한 자산 정보와 메타데이터를 관리합니다.
          span.side-note(v-if="selectedAsset") {{ selectedAsset.status === 'active' ? '운영 중' : '폐기 자산' }}
        form.detail-form(@submit.prevent="saveAsset")
          label.field
            span 시스템 ID
            input.compact-field(type="text" :value="assetForm.id || '저장 시 자동 생성'" readonly)
          div.inline-grid
            label.field
              span 시리얼 번호
              div.serial-scan-row
                input.compact-field(v-model="assetForm.serialNumber" type="text" placeholder="비워두면 DA-카테고리번호+5자리 자동 생성")
                button.ghost-button(type="button" @click="openScanner('serial')") 시리얼 스캔
            label.field
              span 카테고리
              select.compact-field(v-model="assetForm.category" required)
                option(v-for="option in categoryOptions" :key="option.value" :value="option.value") {{ option.label }}
          label.field
            span 장비 이름
            input.compact-field(v-model="assetForm.name" required type="text" placeholder="Dell PowerEdge R760")
          label.field
            span 관리 장소
            input.compact-field(v-model="assetForm.location" required type="text" placeholder="Seoul IDC A동 3F Rack B-12")
          div.location-reference(v-if="locationLinkedAsset")
            div.location-reference-copy
              span.label 참조 자산
              strong {{ locationLinkedAsset.name }}
              p.item-code {{ locationLinkedAsset.serialNumber }}
            button.ghost-button(type="button" @click="selectAsset(locationLinkedAsset)") 바로가기
          div.inline-grid
            label.field
              span 정 관리자
              select.compact-field(v-model="assetForm.primaryManagerId" required)
                option(value="") 선택하세요
                option(v-for="manager in activeManagers" :key="manager.id" :value="manager.id") {{ formatManager(manager) }}
            label.field
              span 부 관리자
              select.compact-field(v-model="assetForm.secondaryManagerId")
                option(value="") 선택 안 함
                option(v-for="manager in activeManagers" :key="manager.id" :value="manager.id") {{ formatManager(manager) }}
          label.field
            span 메타데이터
            textarea.compact-area(v-model="assetForm.metadataText" rows="7" placeholder='{"vendor":"Dell","ip":"10.10.0.12"}')
          label.field
            span 비고
            textarea.compact-area(v-model="assetForm.notes" rows="3" placeholder="특이사항 입력")
          div.action-row
            button.solid-button(type="submit" :disabled="assetSaving || !activeManagers.length")
              | {{ assetSaving ? '저장 중...' : assetForm.id ? '수정 저장' : '자산 등록' }}
            button.ghost-button(v-if="assetForm.id" type="button" :disabled="assetSaving" @click="copyAsset") 복사
            button.ghost-button(type="button" @click="resetAssetForm") 초기화
            button.danger-button(v-if="assetForm.id" type="button" :disabled="assetSaving" @click="disposeAsset") 폐기
          p.feedback(:class="{ error: !!assetError, ok: !!assetMessage && !assetError }") {{ assetError || assetMessage }}
          div.detail-box(v-if="selectedAsset")
            div.detail-row
              span.label 현재 선택
              strong {{ selectedAsset.name }}
            div.detail-row
              span.label 관리자
              p {{ formatManager(selectedAsset.primaryManager) }}
            div.detail-row(v-if="selectedAsset.secondaryManager")
              span.label 부 관리자
              p {{ formatManager(selectedAsset.secondaryManager) }}
            div.detail-row(v-if="selectedAsset.disposeReason || selectedAsset.disposedAt")
              span.label 폐기 정보
              p {{ selectedAsset.disposedAt ? new Date(selectedAsset.disposedAt).toLocaleString() : '-' }}
              p(v-if="selectedAsset.disposeReason") {{ selectedAsset.disposeReason }}

      template(v-else-if="currentMenu === 'manager'")
        div.column-head
          div
            h2 {{ managerForm.id ? '관리자 상세 / 수정' : '관리자 등록' }}
            p 정/부 관리자 후보를 등록하고 활성 상태를 관리합니다.
          span.side-note(v-if="managerForm.id") {{ managerForm.isActive ? '활성' : '비활성' }}
        form.detail-form(@submit.prevent="saveManager")
          label.field
            span 부서
            input.compact-field(v-model="managerForm.department" required type="text" placeholder="인프라운영팀")
          label.field
            span 직책
            input.compact-field(v-model="managerForm.title" required type="text" placeholder="매니저")
          label.field
            span 이름
            input.compact-field(v-model="managerForm.name" required type="text" placeholder="홍길동")
          label.field
            span 로그인 ID
            input.compact-field(v-model="managerForm.loginId" type="text" placeholder="로그인 미사용 시 비워두기")
          label.field
            span 비밀번호
            input.compact-field(v-model="managerForm.password" type="password" :placeholder="managerForm.id ? '변경할 때만 입력' : '로그인 사용 시 입력'")
          label.toggle-row(v-if="managerForm.id")
            input(type="checkbox" v-model="managerForm.isActive")
            span 활성 관리자
          div.action-row
            button.solid-button(type="submit" :disabled="managerSaving")
              | {{ managerSaving ? '저장 중...' : managerForm.id ? '수정 저장' : '관리자 등록' }}
            button.ghost-button(type="button" @click="resetManagerForm") 초기화
          p.feedback(:class="{ error: !!managerError, ok: !!managerMessage && !managerError }") {{ managerError || managerMessage }}
          div.detail-box(v-if="selectedManager")
            div.detail-row
              span.label 이름
              strong {{ selectedManager.name }}
            div.detail-row
              span.label 소속
              p {{ selectedManager.department }} / {{ selectedManager.title }}
            div.detail-row
              span.label 상태
              p {{ selectedManager.isActive ? '활성' : '비활성' }}
            div.detail-row
              span.label 로그인
              p {{ selectedManager.loginId || '미사용' }}

      template(v-else)
        div.column-head
          div
            h2 서버실 관리
            p {{ facilityModules.find((module) => module.id === currentFacilityMenu)?.description }}
          span.side-note DC-01
        template(v-if="currentFacilityMenu === 'power'")
          div.detail-box
            div.detail-row
              span.label 실시간 부하
              strong 182.4 kW
            div.detail-row
              span.label UPS 여유율
              p 31%
            div.detail-row
              span.label A 계통 / B 계통
              p 91.2 kW / 91.2 kW
            div.detail-row
              span.label 비고
              p 현재 랙 증설 가능 전력은 약 24kW 수준입니다.

        template(v-else-if="currentFacilityMenu === 'environment'")
          div.detail-box
            div.detail-row
              span.label 평균 온도
              strong 22.8°C
            div.detail-row
              span.label 평균 습도
              strong 47%
            div.detail-row
              span.label 핫존 경고
              p Rack C-04 후면 27.1°C
            div.detail-row
              span.label 센서 상태
              p 정상 18 / 점검 필요 1

        template(v-else)
          div.rack-layout
            div.rack-map
              div.rack-map-head
                h3 랙 배치 현황
                p 서버실 평면도 기준 개략 배치
              div.rack-grid
                template(v-for="row in rackRows" :key="row")
                  div.rack-cell.left Rack {{ row }}
                  div.rack-cell.middle Rack {{ row + 6 }}
                  div.rack-cell.right Rack {{ row + 12 }}
            div.rack-summary
              div.detail-box
                div.detail-row
                  span.label 좌측 열
                  p Core / Virtualization
                div.detail-row
                  span.label 중앙 열
                  p Database / Storage
                div.detail-row
                  span.label 우측 열
                  p Network / Security
                div.detail-row
                  span.label 점유율
                  p 18 / 18 랙 사용 중

    div.scanner-modal(v-if="scannerOpen")
      div.scanner-panel
        div.column-head
          div
            h2 스캔 모드
            p {{ scannerMode === 'serial' ? 'QR코드, Data Matrix, 바코드를 읽어 시리얼 번호에 입력합니다.' : 'QR코드, Data Matrix, 바코드를 읽어 자산을 조회합니다.' }}
          button.ghost-button(type="button" @click="closeScanner") 닫기
        div.scanner-stage
          video.scanner-video(ref="scannerVideoRef" autoplay playsinline muted)
          div.scanner-overlay
            div.scanner-frame-box
        p.feedback(:class="{ error: !!scannerError, ok: !!scannerStatus && !scannerError }") {{ scannerError || scannerStatus }}

    div.toast-stack
      div.toast-item(v-for="toast in toasts" :key="toast.id" :class="toast.type")
        strong.toast-title {{ toast.type === 'error' ? '안내' : '완료' }}
        p.toast-copy {{ toast.message }}
</template>

<script setup lang="ts">
type Manager = {
  id: string
  name: string
  department: string
  title: string
  isActive: boolean
  loginId?: string | null
}

type Asset = {
  id: string
  serialNumber: string
  name: string
  category: 'server' | 'network' | 'parts' | 'other'
  status: 'active' | 'disposed'
  location: string
  metadata: Record<string, unknown>
  notes: string | null
  disposedAt: string | null
  disposeReason: string | null
  primaryManager: Manager
  secondaryManager: Manager | null
}

const runtimeConfig = useRuntimeConfig()
const authTokenKey = 'asset-management-auth-token'

type AuthUser = {
  id: string
  loginId: string
  name?: string
} | null

type AuthMode = 'loading' | 'setup' | 'login' | 'app'
type ToastType = 'success' | 'error'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

const categoryOptions = [
  { value: 'server', label: '서버' },
  { value: 'network', label: '네트워크' },
  { value: 'parts', label: '파츠' },
  { value: 'other', label: '기타' }
]

const authMode = ref<AuthMode>('loading')
const authLoading = ref(false)
const authError = ref('')
const authMessage = ref('')
const authToken = ref('')
const authUser = ref<AuthUser>(null)
const authForm = reactive({
  name: '',
  department: '',
  title: '',
  loginId: '',
  password: ''
})

const currentMenu = ref<'main' | 'asset' | 'manager' | 'server-room'>('main')
const currentFacilityMenu = ref<'power' | 'environment' | 'rack'>('rack')
const managers = ref<Manager[]>([])
const assets = ref<Asset[]>([])
const managerQuery = ref('')
const rackRows = [1, 2, 3, 4, 5, 6]
const facilityModules = [
  { id: 'power', name: '전력 관리', description: 'UPS, 분전, 계통별 부하를 관리합니다.' },
  { id: 'environment', name: '온습도 현황', description: '서버실 센서 기반 온도와 습도를 확인합니다.' },
  { id: 'rack', name: '랙 배치 현황', description: '랙 위치와 용도를 평면 구조로 관리합니다.' }
] as const

const filters = reactive({
  query: '',
  category: '',
  status: ''
})

const managerForm = reactive({
  id: '',
  name: '',
  department: '',
  title: '',
  isActive: true,
  loginId: '',
  password: ''
})

const assetForm = reactive({
  id: '',
  serialNumber: '',
  name: '',
  category: 'server',
  location: '',
  primaryManagerId: '',
  secondaryManagerId: '',
  metadataText: '{\n  \n}',
  notes: ''
})

const managerSaving = ref(false)
const managerMessage = ref('')
const managerError = ref('')
const assetSaving = ref(false)
const assetMessage = ref('')
const assetError = ref('')
const lookupMessage = ref('리더기 입력 후 Enter를 보내면 자산이 자동 선택됩니다.')
const lookupError = ref('')
const lookupResult = ref<Asset | null>(null)
const locationLinkedAsset = ref<Asset | null>(null)
const bootError = ref('')
const scannerPreview = ref('')
let barcodeListener: ((event: KeyboardEvent) => void) | null = null
const scannerOpen = ref(false)
const scannerMode = ref<'lookup' | 'serial'>('lookup')
const scannerStatus = ref('카메라를 시작하면 코드를 자동으로 읽습니다.')
const scannerError = ref('')
const scannerVideoRef = ref<HTMLVideoElement | null>(null)
const serverSetupStage = ref<'idle' | 'asset' | 'location'>('idle')
const toasts = ref<ToastItem[]>([])
let toastId = 0
let scannerStream: MediaStream | null = null
let scannerFrameId: number | null = null
let scannerActive = false
let scannerCooldown = false
let lastDetectedCode = ''
let lastDetectedAt = 0
let locationLookupToken = 0
let locationLookupTimer: ReturnType<typeof window.setTimeout> | null = null
let assetFilterTimer: ReturnType<typeof window.setTimeout> | null = null

const activeManagers = computed(() => managers.value.filter((manager) => manager.isActive))
const activeAssets = computed(() => assets.value.filter((asset) => asset.status === 'active').length)
const disposedAssets = computed(() => assets.value.filter((asset) => asset.status === 'disposed').length)
const selectedAsset = computed(() => assets.value.find((asset) => asset.id === assetForm.id) ?? lookupResult.value)
const selectedManager = computed(() => managers.value.find((manager) => manager.id === managerForm.id) ?? null)
const filteredManagers = computed(() => {
  const keyword = managerQuery.value.trim().toLowerCase()
  if (!keyword) return managers.value

  return managers.value.filter((manager) => {
    return [manager.name, manager.department, manager.title].some((value) => value.toLowerCase().includes(keyword))
  })
})

function switchMenu(menu: 'main' | 'asset' | 'manager' | 'server-room') {
  currentMenu.value = menu
}

function categoryLabel(category: Asset['category']) {
  return categoryOptions.find((option) => option.value === category)?.label ?? category
}

function formatManager(manager: Manager | null) {
  if (!manager) return '미지정'
  return `${manager.department} / ${manager.title} / ${manager.name}`
}

function prettyJson(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isLocationReferenceCandidate(value: string) {
  if (!value) return false
  return value.length >= 1
}

function showToast(message: string, type: ToastType = 'success') {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }, 3200)
}

function resetAssetForm() {
  assetForm.id = ''
  assetForm.serialNumber = ''
  assetForm.name = ''
  assetForm.category = 'server'
  assetForm.location = ''
  assetForm.primaryManagerId = ''
  assetForm.secondaryManagerId = ''
  assetForm.metadataText = '{\n  \n}'
  assetForm.notes = ''
  assetMessage.value = ''
  assetError.value = ''
  lookupResult.value = null
}

function resetManagerForm() {
  managerForm.id = ''
  managerForm.name = ''
  managerForm.department = ''
  managerForm.title = ''
  managerForm.isActive = true
  managerForm.loginId = ''
  managerForm.password = ''
  managerMessage.value = ''
  managerError.value = ''
}

function selectAsset(asset: Asset) {
  currentMenu.value = 'asset'
  assetForm.id = asset.id
  assetForm.serialNumber = asset.serialNumber
  assetForm.name = asset.name
  assetForm.category = asset.category
  assetForm.location = asset.location
  assetForm.primaryManagerId = asset.primaryManager.id
  assetForm.secondaryManagerId = asset.secondaryManager?.id ?? ''
  assetForm.metadataText = prettyJson(asset.metadata)
  assetForm.notes = asset.notes ?? ''
  lookupResult.value = asset
  lookupMessage.value = `${asset.name} 자산을 선택했습니다.`
  lookupError.value = ''
}

function copyAsset() {
  const source = selectedAsset.value
  if (!source) return

  assetForm.id = ''
  assetForm.serialNumber = ''
  assetForm.name = source.name
  assetForm.category = source.category
  assetForm.location = source.location
  assetForm.primaryManagerId = source.primaryManager.id
  assetForm.secondaryManagerId = source.secondaryManager?.id ?? ''
  assetForm.metadataText = prettyJson(source.metadata)
  assetForm.notes = source.notes ?? ''
  lookupResult.value = null
  assetError.value = ''
  assetMessage.value = `${source.name} 자산 정보를 복사했습니다. 저장하면 새 자산으로 등록됩니다.`
}

function startServerSetup() {
  if (serverSetupStage.value !== 'idle') {
    stopServerSetup()
    lookupMessage.value = '서버세팅을 종료했습니다.'
    showToast('서버세팅을 종료했습니다.')
    return
  }

  serverSetupStage.value = 'asset'
  lookupError.value = ''
  lookupMessage.value = '서버세팅 모드입니다. 먼저 자산 태그를 스캔하세요.'
  showToast('서버세팅을 시작했습니다. 먼저 자산을 스캔하세요.')
}

function stopServerSetup() {
  serverSetupStage.value = 'idle'
}

function selectManager(manager: Manager) {
  currentMenu.value = 'manager'
  managerForm.id = manager.id
  managerForm.name = manager.name
  managerForm.department = manager.department
  managerForm.title = manager.title
  managerForm.isActive = manager.isActive
  managerForm.loginId = manager.loginId ?? ''
  managerForm.password = ''
  managerMessage.value = ''
  managerError.value = ''
}

async function api<T>(path: string, options?: any) {
  const headers = {
    ...(options?.headers ?? {}),
    ...(authToken.value ? { authorization: `Bearer ${authToken.value}` } : {})
  }

  return await $fetch<{ success: boolean, data: T, error: string | null }>(`${runtimeConfig.public.apiEndpoint}${path}`, {
    ...(options ?? {}),
    headers
  })
}

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as { data?: { error?: string | string[] } })?.data?.error
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message.length > 0) return message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

async function loadManagers() {
  const response = await api<Manager[]>('/v0/managers')
  managers.value = response.data
}

async function loadAssets() {
  const params = new URLSearchParams()
  if (filters.query.trim()) params.set('query', filters.query.trim())
  if (filters.category) params.set('category', filters.category)
  if (filters.status) params.set('status', filters.status)

  const response = await api<Asset[]>(`/v0/assets${params.toString() ? `?${params.toString()}` : ''}`)
  assets.value = response.data
}

async function handleServerSetupScan(code: string) {
  if (serverSetupStage.value === 'asset') {
    const found = await lookupAsset(code)
    if (!found) {
      showToast(`${code} 자산을 찾지 못했습니다.`, 'error')
      lookupMessage.value = '서버세팅 중입니다. 자산 태그를 다시 스캔하세요.'
      return
    }

    serverSetupStage.value = 'location'
    lookupMessage.value = '자산을 선택했습니다. 이제 관리 장소 태그를 스캔하세요.'
    showToast('자산 선택 완료. 이제 관리 장소를 스캔하세요.')
    return
  }

  if (serverSetupStage.value === 'location') {
    assetForm.location = code
    assetMessage.value = '관리 장소를 스캔해서 입력했습니다.'
    assetError.value = ''
    lookupMessage.value = `${selectedAsset.value?.name ?? '자산'}의 관리 장소를 입력했습니다. 다음 자산 태그를 스캔하세요.`
    showToast(`${code} 관리 장소를 입력했습니다.`)
    serverSetupStage.value = 'asset'
  }
}

async function saveManager() {
  managerSaving.value = true
  managerError.value = ''
  managerMessage.value = ''

  try {
    const payload = {
      name: managerForm.name,
      department: managerForm.department,
      title: managerForm.title,
      isActive: managerForm.isActive,
      loginId: managerForm.loginId || null,
      password: managerForm.password || undefined
    }

    if (managerForm.id) {
      await api<Manager>(`/v0/managers/${managerForm.id}`, {
        method: 'PATCH',
        body: payload
      })
      managerMessage.value = '관리자 정보를 수정했습니다.'
    }
    else {
      const response = await api<Manager>('/v0/managers', {
        method: 'POST',
        body: payload
      })
      managerForm.id = response.data.id
      managerMessage.value = '관리자를 등록했습니다.'
    }

    await loadManagers()
    managerForm.password = ''
  }
  catch (error) {
    managerError.value = getErrorMessage(error, '관리자 저장 중 오류가 발생했습니다.')
  }
  finally {
    managerSaving.value = false
  }
}

function parseMetadataText() {
  if (!assetForm.metadataText.trim()) return {}
  try {
    return JSON.parse(assetForm.metadataText)
  }
  catch {
    throw new Error('메타데이터는 올바른 JSON이어야 합니다.')
  }
}

async function saveAsset() {
  assetSaving.value = true
  assetError.value = ''
  assetMessage.value = ''

  try {
    const payload = {
      serialNumber: assetForm.serialNumber,
      name: assetForm.name,
      category: assetForm.category,
      location: assetForm.location,
      primaryManagerId: assetForm.primaryManagerId,
      secondaryManagerId: assetForm.secondaryManagerId || null,
      metadata: parseMetadataText(),
      notes: assetForm.notes || null
    }

    if (assetForm.id) {
      await api<Asset>(`/v0/assets/${assetForm.id}`, {
        method: 'PATCH',
        body: payload
      })
      assetMessage.value = '자산 정보를 수정했습니다.'
    }
    else {
      const response = await api<Asset>('/v0/assets', {
        method: 'POST',
        body: payload
      })
      assetForm.id = response.data.id
      assetMessage.value = '자산을 등록했습니다.'
    }

    await loadAssets()
  }
  catch (error) {
    assetError.value = getErrorMessage(error, '자산 저장 중 오류가 발생했습니다.')
  }
  finally {
    assetSaving.value = false
  }
}

async function disposeAsset() {
  if (!assetForm.id) return

  const disposeReason = window.prompt('폐기 사유를 입력하세요.', '교체 또는 폐기')
  if (disposeReason === null) return

  assetSaving.value = true
  assetError.value = ''

  try {
    await api<Asset>(`/v0/assets/${assetForm.id}/dispose`, {
      method: 'POST',
      body: { disposeReason }
    })
    assetMessage.value = '자산을 폐기 처리했습니다.'
    await loadAssets()
  }
  catch (error) {
    assetError.value = getErrorMessage(error, '폐기 처리 중 오류가 발생했습니다.')
  }
  finally {
    assetSaving.value = false
  }
}

async function lookupAsset(code: string) {
  const normalizedCode = code.trim()
  if (!normalizedCode) return false

  lookupError.value = ''

  try {
    const response = await api<Asset>(`/v0/assets/lookup?code=${encodeURIComponent(normalizedCode)}`)
    lookupResult.value = response.data
    selectAsset(response.data)
    lookupMessage.value = `${response.data.name} 자산을 조회했습니다.`
    return true
  }
  catch (error) {
    lookupResult.value = null
    lookupError.value = getErrorMessage(error, '조회 중 오류가 발생했습니다.')
    return false
  }
}

async function openScanner(mode: 'lookup' | 'serial' = 'lookup') {
  if (!import.meta.client) return
  scannerMode.value = mode
  scannerOpen.value = true
  scannerError.value = ''
  scannerStatus.value = '카메라를 준비하고 있습니다.'
  await nextTick()
  await startScanner()
}

function closeScanner() {
  scannerOpen.value = false
  scannerError.value = ''
  scannerMode.value = 'lookup'
  scannerStatus.value = '카메라를 시작하면 코드를 자동으로 읽습니다.'
  stopScanner()
}

async function startScanner() {
  if (!import.meta.client) return

  const BarcodeDetectorCtor = (window as typeof window & {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
    }
  }).BarcodeDetector

  if (!BarcodeDetectorCtor) {
    scannerError.value = '이 브라우저는 카메라 코드 스캔을 지원하지 않습니다.'
    showToast('이 브라우저에서는 스캔 모드를 사용할 수 없습니다.', 'error')
    return
  }

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    })

    const video = scannerVideoRef.value
    if (!video) throw new Error('카메라 화면을 초기화하지 못했습니다.')

    video.srcObject = scannerStream
    await video.play()

    const detector = new BarcodeDetectorCtor({
      formats: ['qr_code', 'data_matrix', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
    })

    scannerActive = true
    scannerStatus.value = '코드를 화면 중앙에 맞춰주세요.'
    scanLoop(detector)
  }
  catch (error) {
    scannerError.value = getErrorMessage(error, '카메라를 시작하지 못했습니다.')
    showToast(scannerError.value, 'error')
    stopScanner()
  }
}

function stopScanner() {
  scannerActive = false
  scannerCooldown = false
  lastDetectedCode = ''
  lastDetectedAt = 0

  if (scannerFrameId !== null) {
    window.cancelAnimationFrame(scannerFrameId)
    scannerFrameId = null
  }

  if (scannerStream) {
    for (const track of scannerStream.getTracks()) {
      track.stop()
    }
    scannerStream = null
  }

  const video = scannerVideoRef.value
  if (video) {
    video.pause()
    video.srcObject = null
  }
}

async function scanLoop(detector: { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> }) {
  if (!scannerActive || !scannerOpen.value) return

  const video = scannerVideoRef.value
  if (!video || video.readyState < 2) {
    scannerFrameId = window.requestAnimationFrame(() => scanLoop(detector))
    return
  }

  try {
    const detected = await detector.detect(video)
    const rawValue = detected[0]?.rawValue?.trim()

    if (rawValue && !scannerCooldown) {
      const now = Date.now()
      if (rawValue !== lastDetectedCode || now - lastDetectedAt > 2000) {
        scannerCooldown = true
        lastDetectedCode = rawValue
        lastDetectedAt = now
        if (scannerMode.value === 'serial') {
          assetForm.serialNumber = rawValue
          assetMessage.value = '시리얼 번호를 스캔해서 입력했습니다.'
          assetError.value = ''
          showToast(`${rawValue} 시리얼 번호를 입력했습니다.`)
          closeScanner()
          return
        }

        scannerStatus.value = `${rawValue} 조회 중입니다.`
        const found = await lookupAsset(rawValue)

        if (found) {
          showToast(`${rawValue} 자산을 선택했습니다.`)
          closeScanner()
          return
        }

        showToast(`${rawValue} 자산을 찾지 못했습니다.`, 'error')
        scannerStatus.value = '다른 코드를 다시 스캔해주세요.'
        window.setTimeout(() => {
          scannerCooldown = false
        }, 1200)
      }
    }
  }
  catch (error) {
    scannerError.value = getErrorMessage(error, '스캔 중 오류가 발생했습니다.')
  }

  scannerFrameId = window.requestAnimationFrame(() => scanLoop(detector))
}

function loadStoredToken() {
  if (!import.meta.client) return ''
  return window.localStorage.getItem(authTokenKey) ?? ''
}

function persistToken(token: string) {
  authToken.value = token
  if (import.meta.client) {
    window.localStorage.setItem(authTokenKey, token)
  }
}

function clearToken() {
  authToken.value = ''
  if (import.meta.client) {
    window.localStorage.removeItem(authTokenKey)
  }
}

async function checkAuthStatus() {
  const storedToken = loadStoredToken()
  if (storedToken) authToken.value = storedToken

  const response = await $fetch<{ success: boolean, data: { hasAdminAccount: boolean, authenticated: boolean, user: AuthUser }, error: string | null }>(
    `${runtimeConfig.public.apiEndpoint}/v0/auth/status`,
    {
      headers: storedToken ? { authorization: `Bearer ${storedToken}` } : {}
    }
  )

  authUser.value = response.data.user

  if (!response.data.hasAdminAccount) {
    authMode.value = 'setup'
    return
  }

  authMode.value = response.data.authenticated ? 'app' : 'login'
}

async function setupAdmin() {
  authLoading.value = true
  authError.value = ''
  authMessage.value = ''

  try {
    const response = await $fetch<{ success: boolean, data: { token: string, user: AuthUser }, error: string | null }>(
      `${runtimeConfig.public.apiEndpoint}/v0/auth/setup`,
      {
        method: 'POST',
        body: {
          loginId: authForm.loginId,
          password: authForm.password,
          name: authForm.name,
          department: authForm.department,
          title: authForm.title
        }
      }
    )

    persistToken(response.data.token)
    authUser.value = response.data.user
    authMessage.value = '관리자 계정을 생성했습니다.'
    authForm.password = ''
    authMode.value = 'app'
    await bootstrapApp()
  }
  catch (error) {
    authError.value = getErrorMessage(error, '관리자 계정 생성에 실패했습니다.')
  }
  finally {
    authLoading.value = false
  }
}

async function login() {
  authLoading.value = true
  authError.value = ''
  authMessage.value = ''

  try {
    const response = await $fetch<{ success: boolean, data: { token: string, user: AuthUser }, error: string | null }>(
      `${runtimeConfig.public.apiEndpoint}/v0/auth/login`,
      {
        method: 'POST',
        body: { loginId: authForm.loginId, password: authForm.password }
      }
    )

    persistToken(response.data.token)
    authUser.value = response.data.user
    authMode.value = 'app'
    authMessage.value = '로그인되었습니다.'
    authForm.password = ''
    await bootstrapApp()
  }
  catch (error) {
    authError.value = getErrorMessage(error, '로그인에 실패했습니다.')
  }
  finally {
    authLoading.value = false
  }
}

async function logout() {
  try {
    await api<null>('/v0/auth/logout', { method: 'POST' })
  }
  catch {
  }

  clearToken()
  authUser.value = null
  authMode.value = 'login'
  authForm.loginId = ''
  authForm.password = ''
  managers.value = []
  assets.value = []
  resetAssetForm()
  resetManagerForm()
}

async function bootstrapApp() {
  try {
    await Promise.all([loadManagers(), loadAssets()])
    bootError.value = ''
    managerError.value = ''
    assetError.value = ''
    lookupError.value = ''
  }
  catch (error) {
    bootError.value = getErrorMessage(error, '백엔드 연결에 실패했습니다. API 서버 상태를 확인해주세요.')
    managerError.value = bootError.value
    assetError.value = bootError.value
    lookupError.value = bootError.value
  }
}

watch(
  () => assetForm.location,
  async (value) => {
    const normalizedLocation = value.trim()
    const currentToken = ++locationLookupToken

    if (locationLookupTimer) {
      clearTimeout(locationLookupTimer)
      locationLookupTimer = null
    }

    if (!isLocationReferenceCandidate(normalizedLocation)) {
      locationLinkedAsset.value = null
      return
    }

    const cachedAsset = assets.value.find((asset) => asset.id === normalizedLocation)
    if (cachedAsset) {
      locationLinkedAsset.value = cachedAsset
      return
    }

    locationLookupTimer = window.setTimeout(async () => {
      try {
        const response = isUuid(normalizedLocation)
          ? await api<Asset>(`/v0/assets/${normalizedLocation}`)
          : await api<Asset>(`/v0/assets/lookup?code=${encodeURIComponent(normalizedLocation)}`)

        if (currentToken !== locationLookupToken) return
        locationLinkedAsset.value = response.data
      }
      catch {
        if (currentToken !== locationLookupToken) return
        locationLinkedAsset.value = null
      }
    }, 250)
  },
  { immediate: true }
)

watch(
  () => [filters.query, filters.category, filters.status],
  () => {
    if (authMode.value !== 'app') return
    if (assetFilterTimer) {
      clearTimeout(assetFilterTimer)
    }
    assetFilterTimer = window.setTimeout(() => {
      loadAssets().catch(() => {
      })
    }, 200)
  }
)

onMounted(async () => {
  try {
    await checkAuthStatus()
    if (authMode.value === 'app') {
      await bootstrapApp()
    }
  }
  catch (error) {
    authMode.value = 'login'
    authError.value = getErrorMessage(error, '인증 상태를 확인하지 못했습니다.')
  }

  let scannerBuffer = ''
  let lastKeystrokeAt = 0

  barcodeListener = (event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement | null
    if (
      activeElement &&
      (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName) ||
        activeElement.isContentEditable
      )
    ) return
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (authMode.value !== 'app') return

    const now = Date.now()
    if (now - lastKeystrokeAt > 5000) {
      scannerBuffer = ''
    }
    lastKeystrokeAt = now
    scannerPreview.value = scannerBuffer

    if (event.key === 'Escape') {
      scannerBuffer = ''
      scannerPreview.value = ''
      if (serverSetupStage.value !== 'idle') {
        stopServerSetup()
        lookupMessage.value = '서버세팅을 취소했습니다.'
      }
      else {
        lookupMessage.value = '리더기 입력 대기 중입니다.'
      }
      return
    }

    if (event.key === 'Enter') {
      const code = scannerBuffer.trim()
      if (code.length > 0) {
        if (serverSetupStage.value !== 'idle') {
          lookupError.value = ''
          handleServerSetupScan(code)
        }
        else {
          lookupMessage.value = `${code} 입력을 감지했습니다. 조회 중입니다.`
          lookupError.value = ''
          lookupAsset(scannerBuffer)
        }
      }
      scannerBuffer = ''
      scannerPreview.value = ''
      return
    }

    if (event.key === 'Backspace') {
      scannerBuffer = scannerBuffer.slice(0, -1)
      scannerPreview.value = scannerBuffer
      return
    }

    if (event.key.length === 1) {
      scannerBuffer += event.key
      scannerPreview.value = scannerBuffer
    }
  }

  window.addEventListener('keydown', barcodeListener, true)
})

onBeforeUnmount(() => {
  if (barcodeListener) {
    window.removeEventListener('keydown', barcodeListener, true)
  }
  if (assetFilterTimer) {
    clearTimeout(assetFilterTimer)
  }
  if (locationLookupTimer) {
    clearTimeout(locationLookupTimer)
  }
  stopScanner()
})
</script>

<style scoped>
.console-page {
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  padding: 0;
  overflow: hidden;
}

.auth-shell {
  width: 100vw;
  height: 100dvh;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #11211d 0%, #18332c 100%);
  padding: 24px;
}

.auth-panel {
  width: min(100%, 420px);
  display: grid;
  gap: 18px;
  padding: 28px;
  background: #ffffff;
  border: 1px solid rgba(17, 33, 29, 0.12);
}

.auth-head,
.auth-fields {
  display: grid;
  gap: 10px;
}

.auth-actions {
  grid-template-columns: 1fr;
}

.console-frame {
  width: 100vw;
  height: 100dvh;
  display: grid;
  grid-template-columns: clamp(160px, 18vw, 220px) clamp(220px, 28vw, 360px) minmax(320px, 1fr);
  overflow: hidden;
  border: 1px solid rgba(17, 33, 29, 0.09);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  box-shadow: none;
}

.menu-column,
.list-column,
.detail-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.menu-column {
  padding: 0;
  background: linear-gradient(180deg, #11211d 0%, #18332c 100%);
  color: white;
  gap: 0;
}

.list-column {
  padding: 0;
  border-left: 1px solid rgba(17, 33, 29, 0.08);
  border-right: 1px solid rgba(17, 33, 29, 0.08);
  background: #ffffff;
}

.detail-column {
  padding: 18px;
  background: rgba(255, 255, 255, 0.92);
}

.list-toolbar {
  padding: 18px 18px 0;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 3;
}

.brand-block {
  padding: 18px;
  display: grid;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 4;
  background: linear-gradient(180deg, #11211d 0%, #18332c 100%);
}

.session-box {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.session-id {
  font-size: 14px;
}

.brand-kicker {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}

.brand-title {
  margin: 0;
  font-size: 28px;
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.brand-copy {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.55;
}

.menu-list {
  display: grid;
  gap: 0;
  width: 100%;
  align-content: start;
}

.menu-card {
  width: 100%;
  min-width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: inherit;
  border-radius: 0;
  padding: 18px;
  cursor: pointer;
  display: grid;
  gap: 4px;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.menu-card:hover,
.menu-card.active {
  background: rgba(255, 255, 255, 0.14);
  border-bottom-color: rgba(255, 255, 255, 0.12);
}

.menu-eyebrow,
.menu-meta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.68);
}

.menu-name {
  font-size: 16px;
}

.info-panel,
.scan-panel {
  border-radius: 0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px;
}

.utility-panel {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.info-panel {
  display: grid;
  gap: 10px;
}

.info-row,
.detail-row {
  display: grid;
  gap: 4px;
}

.label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-color);
}

.menu-column .label {
  color: rgba(255, 255, 255, 0.58);
}

.scan-panel {
  display: grid;
  gap: 10px;
}

.scan-head,
.column-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.scan-head h2,
.column-head h2 {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.03em;
}

.column-head p {
  margin: 4px 0 0;
  color: var(--muted-color);
  font-size: 12px;
  line-height: 1.45;
}

.scan-chip,
.side-note {
  padding: 6px 9px;
  border-radius: 0;
  background: rgba(22, 137, 125, 0.1);
  color: #16897d;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.menu-column .scan-chip {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.filter-stack,
.detail-form,
.item-list {
  display: grid;
  gap: 12px;
}

.filter-stack {
  margin-top: 14px;
}

.item-list {
  flex: 1;
  min-height: 0;
  height: 0;
  overflow: auto;
  margin-top: 14px;
  padding-right: 0;
  align-content: start;
  grid-auto-rows: max-content;
  gap: 0;
}

.dashboard-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin-top: 14px;
  border: 1px solid rgba(17, 33, 29, 0.08);
  border-top: 0;
}

.dashboard-item {
  padding: 14px;
  border-top: 1px solid rgba(17, 33, 29, 0.08);
  border-right: 1px solid rgba(17, 33, 29, 0.08);
  display: grid;
  gap: 8px;
}

.dashboard-item:nth-child(2n) {
  border-right: 0;
}

.dashboard-value {
  font-size: 24px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.live-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #16897d;
  word-break: break-all;
}

.item-card {
  height: max-content;
  align-self: start;
  width: 100%;
  border: 0;
  border-bottom: 1px solid rgba(17, 33, 29, 0.08);
  background: #ffffff;
  border-radius: 0;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 6px;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.asset-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.asset-copy {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.item-card:hover,
.item-card.selected {
  background: rgba(22, 137, 125, 0.08);
}

.item-title {
  font-size: 14px;
  color: var(--text-color);
}

.item-sub,
.item-code {
  margin: 0;
  font-size: 12px;
  color: var(--muted-color);
  word-break: break-all;
}

.empty-box {
  border: 1px dashed rgba(17, 33, 29, 0.12);
  border-radius: 0;
  padding: 22px 14px;
  text-align: center;
  color: var(--muted-color);
  font-size: 13px;
}

.field {
  display: grid;
  gap: 7px;
  font-size: 12px;
  color: var(--muted-color);
  font-weight: 600;
}

.inline-grid,
.action-row {
  display: grid;
  gap: 10px;
}

.inline-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.action-row > * {
  width: 100%;
}

.scan-action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.serial-scan-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  gap: 10px;
}

.location-reference {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(17, 33, 29, 0.08);
  background: rgba(17, 33, 29, 0.03);
}

.location-reference-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.location-reference-copy strong {
  font-size: 14px;
  color: var(--text-color);
}

.compact-field,
.compact-area {
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(17, 33, 29, 0.1);
  background: white;
  color: var(--text-color);
  border-radius: 0;
  padding: 11px 13px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.compact-field:focus,
.compact-area:focus {
  border-color: rgba(22, 137, 125, 0.4);
  box-shadow: 0 0 0 4px rgba(22, 137, 125, 0.1);
}

.compact-area {
  resize: vertical;
  min-height: 90px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.solid-button,
.ghost-button,
.danger-button {
  border: 0;
  border-radius: 0;
  min-height: 44px;
  padding: 11px 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
}

.solid-button {
  background: linear-gradient(135deg, #16897d, #20ad9e);
  color: white;
}

.solid-button.dark {
  background: #11211d;
}

.solid-button.dark.active-action {
  background: #0f766e;
}

.ghost-button {
  background: rgba(17, 33, 29, 0.06);
  color: var(--text-color);
}

.logout-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-align: left;
}

.danger-button {
  background: #d84a4a;
  color: white;
}

.feedback {
  margin: 0;
  min-height: 18px;
  font-size: 12px;
  color: var(--muted-color);
}

.feedback.ok {
  color: #0f766e;
}

.feedback.error {
  color: #c73f3f;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 8px;
  border-radius: 0;
  font-size: 11px;
  font-weight: 700;
}

.status-pill.active {
  background: rgba(22, 137, 125, 0.12);
  color: #0f766e;
}

.status-pill.disposed {
  background: rgba(216, 74, 74, 0.12);
  color: #c73f3f;
}

.detail-box {
  margin-top: 6px;
  border-radius: 0;
  border: 1px solid rgba(17, 33, 29, 0.08);
  background: rgba(17, 33, 29, 0.03);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.rack-layout {
  display: grid;
  grid-template-rows: minmax(280px, 1fr) minmax(180px, auto);
  gap: 12px;
  min-height: 0;
}

.rack-map,
.rack-summary {
  min-height: 0;
}

.rack-map {
  border: 1px solid rgba(17, 33, 29, 0.08);
  background: rgba(17, 33, 29, 0.03);
  padding: 14px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
}

.rack-map-head h3,
.rack-map-head p {
  margin: 0;
}

.rack-map-head h3 {
  font-size: 16px;
}

.rack-map-head p {
  margin-top: 4px;
  color: var(--muted-color);
  font-size: 12px;
}

.rack-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px 24px;
  align-content: center;
  min-height: 0;
}

.rack-cell {
  min-height: 44px;
  border: 1px solid rgba(22, 137, 125, 0.35);
  background: rgba(22, 137, 125, 0.08);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #0f766e;
}

.rack-cell.left {
  grid-column: 1;
}

.rack-cell.middle {
  grid-column: 2;
}

.rack-cell.right {
  grid-column: 3;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
}

.scanner-modal {
  position: fixed;
  inset: 0;
  background: rgba(17, 33, 29, 0.66);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 30;
}

.scanner-panel {
  width: min(100%, 720px);
  display: grid;
  gap: 14px;
  background: #ffffff;
  border: 1px solid rgba(17, 33, 29, 0.12);
  padding: 18px;
}

.scanner-stage {
  position: relative;
  background: #061310;
  min-height: 360px;
  overflow: hidden;
}

.scanner-video {
  width: 100%;
  height: 100%;
  min-height: 360px;
  object-fit: cover;
  display: block;
}

.scanner-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.scanner-frame-box {
  width: min(72%, 360px);
  aspect-ratio: 1 / 1;
  border: 2px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 999px rgba(6, 19, 16, 0.34);
}

.toast-stack {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 40;
  display: grid;
  gap: 10px;
}

.toast-item {
  width: min(320px, calc(100vw - 36px));
  padding: 12px 14px;
  border: 1px solid rgba(17, 33, 29, 0.12);
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(17, 33, 29, 0.12);
  display: grid;
  gap: 4px;
}

.toast-item.success {
  border-left: 4px solid #16897d;
}

.toast-item.error {
  border-left: 4px solid #d84a4a;
}

.toast-title,
.toast-copy {
  margin: 0;
}

.toast-title {
  font-size: 12px;
}

.toast-copy {
  font-size: 12px;
  color: var(--muted-color);
  word-break: break-word;
}

@media (max-width: 900px) {
  .console-page {
    height: auto;
    min-height: 100dvh;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .console-frame {
    width: 100%;
    height: auto;
    min-height: 100dvh;
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(280px, 34dvh) minmax(0, 1fr);
  }

  .menu-column,
  .list-column,
  .detail-column {
    height: auto;
    min-height: 0;
  }

  .menu-column {
    overflow: visible;
  }

  .list-column {
    border-left: 0;
    border-right: 0;
    border-top: 1px solid rgba(17, 33, 29, 0.08);
    border-bottom: 1px solid rgba(17, 33, 29, 0.08);
  }

  .detail-column {
    padding: 14px;
    overflow: visible;
  }

  .brand-block {
    position: relative;
    padding: 14px 14px 12px;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-copy {
    font-size: 12px;
  }

  .menu-list {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .menu-card {
    min-width: 148px;
    flex: 0 0 148px;
    padding: 14px 12px;
    border-bottom: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }

  .menu-card:hover,
  .menu-card.active {
    border-bottom-color: transparent;
  }

  .list-toolbar {
    padding: 14px 14px 0;
  }

  .item-list {
    height: auto;
    min-height: 0;
    margin-top: 10px;
  }

  .dashboard-panel,
  .detail-box,
  .rack-map,
  .scanner-panel {
    margin-top: 0;
  }

  .menu-card,
  .item-card,
  .dashboard-item {
    padding: 14px;
  }

  .scanner-modal {
    padding: 0;
  }

  .scanner-panel {
    width: 100vw;
    height: 100dvh;
    gap: 12px;
    padding: 14px;
  }

  .scanner-stage,
  .scanner-video {
    min-height: 320px;
  }

  .scanner-frame-box {
    width: min(78vw, 320px);
  }

  .toast-stack {
    right: 12px;
    left: 12px;
    bottom: 12px;
  }

  .toast-item {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .auth-shell {
    padding: 12px;
  }

  .list-toolbar {
    padding: 12px 12px 0;
  }

  .inline-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scan-action-row {
    grid-template-columns: 1fr;
  }

  .serial-scan-row {
    grid-template-columns: 1fr;
  }

  .location-reference {
    align-items: stretch;
    flex-direction: column;
  }

  .column-head {
    gap: 8px;
  }

  .column-head h2 {
    font-size: 16px;
  }

  .scanner-stage,
  .scanner-video {
    min-height: 280px;
  }
}

@media (max-width: 520px) {
  .auth-shell {
    padding: 0;
  }

  .auth-panel {
    width: 100vw;
    min-height: 100dvh;
    padding: 20px 16px;
  }

  .detail-column {
    padding: 12px;
  }

  .menu-card {
    min-width: 132px;
    flex-basis: 132px;
  }

  .asset-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-row {
    grid-template-columns: 1fr;
  }
}
</style>
