/*
 * finecode-practice-data.js — Vue 3 & Nuxt 3 실무 코드
 *
 * 파인코드(나쁜 예 / 좋은 예)와 달리, 바로 가져다 쓰는 코드 조각을 모은다.
 * 항목 대부분은 single { label, code } 한 칸이고, 비교가 뜻있는 곳만 bad/good 을 쓴다.
 * 화면과 체크 저장은 finecode-check.js 가 맡는다 (practice.html, practice-later.html).
 * 필드 설명은 finecode-vue-data.js 머리말과 같다. 백틱은 \` 로, 달러-중괄호는 \${ 로 쓴다.
 */
window.FINECODE = {
  key: 'practice',
  subject: `Vue 3 & Nuxt 3`,
  brand: `실무 코드`,
  lang: 'vue',
  sessions: [
    {
      id: 'practice-1', no: 1, name: `로그인과 토큰 관리`,
      lead: `로그인, 액세스/리프레시 토큰, 만료 시 자동 재발급, 로그아웃까지 한 벌입니다. axios 와 $fetch 두 버전을 모두 둡니다. 01번부터 순서대로 읽으면 흐름이 이어집니다.`,
      lessons: [
        {
          id: 'l1', short: `전체 구조`,
          title: `토큰 인증의 전체 그림과 파일 배치`,
          why: `액세스 토큰은 짧게(15분), 리프레시 토큰은 길게(7~30일) 둡니다. 액세스 토큰이 만료되면 리프레시로 새로 받고, 리프레시까지 만료되면 로그아웃입니다. 이 회차의 코드는 아래 파일로 나뉩니다.`,
          single: { label: `✓ 구조`, code: String.raw`
src/
  api/
    client.ts          # axios 인스턴스 + 인터셉터 (03, 04번)
    auth.api.ts        # login, refresh, logout, me 호출 함수 (02번)
  stores/
    auth.ts            # Pinia: user, accessToken, login(), logout(), fetchMe() (07번)
  router/
    guards.ts          # 라우트 가드 (08번)
  composables/
    useAuthSync.ts     # 탭 동기화, 자동 로그아웃 (09, 10번)

토큰 보관 원칙
  accessToken   메모리(Pinia 상태). 새로고침하면 사라지므로 앱 시작 때 refresh 로 다시 받는다
  refreshToken  httpOnly 쿠키 (서버가 Set-Cookie). JS 에서 읽지 않는다
  localStorage  토큰을 넣지 않는다 (XSS 로 유출). "로그인한 적 있음" 플래그 정도만

요청 흐름
  요청 → [요청 인터셉터] Authorization: Bearer <accessToken> 부착
      → 401 → [응답 인터셉터] refresh 호출(한 번만) → 새 토큰으로 원 요청 재시도
      → refresh 도 실패 → 상태 비우고 /login 으로
` },
          lang: 'plain',
        },
        {
          id: 'l2', short: `auth.api.ts`,
          title: `로그인, 재발급, 로그아웃 API 함수`,
          why: `컴포넌트나 스토어가 URL 을 직접 알지 않게 API 호출을 함수로 감쌉니다. refresh 는 쿠키로 인증하므로 withCredentials 가 꼭 필요합니다.`,
          single: { label: `✓ src/api/auth.api.ts`, code: String.raw`
import { api, rawApi } from './client'

export interface User { id: number; name: string; email: string; role: 'admin' | 'user' }
export interface LoginBody { email: string; password: string }
export interface TokenRes { accessToken: string; expiresIn: number }   // 초 단위

export const authApi = {
  login: (body: LoginBody) =>
    rawApi.post<TokenRes & { user: User }>('/auth/login', body).then(r => r.data),

  // 리프레시 토큰은 httpOnly 쿠키에 있다. 인터셉터를 타지 않는 rawApi 로 부른다 (무한 루프 방지)
  refresh: () =>
    rawApi.post<TokenRes>('/auth/refresh').then(r => r.data),

  logout: () =>
    rawApi.post('/auth/logout'),       // 서버가 리프레시 쿠키를 지운다

  me: () =>
    api.get<User>('/users/me').then(r => r.data)
}
` },
        },
        {
          id: 'l3', short: `요청 인터셉터`,
          title: `axios 인스턴스와 토큰 부착`,
          why: `baseURL, 타임아웃, 쿠키 전송을 한 곳에서 정하고, 모든 요청에 액세스 토큰을 붙입니다. 스토어를 직접 import 하면 순환 참조가 나기 쉬우니 토큰 getter 를 주입합니다.`,
          single: { label: `✓ src/api/client.ts (1/2)`, code: String.raw`
import axios, { type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE ?? '/api'

// 인터셉터가 없는 인스턴스: refresh, login 용
export const rawApi = axios.create({ baseURL, timeout: 10_000, withCredentials: true })

// 일반 인스턴스
export const api = axios.create({ baseURL, timeout: 10_000, withCredentials: true })

// 스토어를 직접 import 하지 않고 토큰을 읽는 함수를 주입받는다 (순환 참조 방지)
let getToken: () => string | null = () => null
let onRefreshed: (t: string) => void = () => {}
let onAuthLost: () => void = () => {}
export function bindAuth(h: { getToken: typeof getToken; onRefreshed: typeof onRefreshed; onAuthLost: typeof onAuthLost }) {
  getToken = h.getToken; onRefreshed = h.onRefreshed; onAuthLost = h.onAuthLost
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})
` },
        },
        {
          id: 'l4', short: `401 재발급`,
          title: `응답 인터셉터: 401 이면 한 번만 재발급하고 원 요청을 다시 보낸다`,
          why: `동시에 여러 요청이 401 을 받으면 refresh 가 여러 번 나가 서로를 무효화합니다. 진행 중인 refresh Promise 를 하나만 두고 나머지는 그것을 기다렸다가 새 토큰으로 재시도합니다. 재시도는 요청당 한 번입니다.`,
          single: { label: `✓ src/api/client.ts (2/2)`, code: String.raw`
import { authApi } from './auth.api'

let refreshing: Promise<string> | null = null

function refreshOnce(): Promise<string> {
  if (!refreshing) {
    refreshing = authApi.refresh()
      .then(res => { onRefreshed(res.accessToken); return res.accessToken })
      .finally(() => { refreshing = null })        // 끝나면 다음 만료 때 다시 만들 수 있게
  }
  return refreshing                                 // 동시 요청은 같은 Promise 를 기다린다
}

api.interceptors.response.use(
  res => res,
  async (error) => {
    const { config, response } = error
    const status = response?.status

    // 401 이 아니거나, 이미 한 번 재시도한 요청이면 그대로 실패
    if (status !== 401 || !config || config._retried) return Promise.reject(error)

    // 로그인 실패(401) 자체는 재발급 대상이 아니다
    if (config.url?.includes('/auth/')) return Promise.reject(error)

    config._retried = true
    try {
      const token = await refreshOnce()
      config.headers.Authorization = 'Bearer ' + token
      return api(config)                            // 원래 요청을 새 토큰으로 다시
    } catch (e) {
      onAuthLost()                                  // refresh 실패: 로그아웃 처리 (06번)
      return Promise.reject(e)
    }
  }
)

declare module 'axios' {
  export interface InternalAxiosRequestConfig { _retried?: boolean }
}
` },
          note: `서버가 만료를 401 대신 다른 코드(예: 419, 혹은 body 의 code: 'TOKEN_EXPIRED')로 주면 그 조건으로 바꿉니다. 403 은 권한 문제라 재발급 대상이 아닙니다.`,
        },
        {
          id: 'l5', short: `$fetch 버전`,
          title: `Nuxt $fetch(ofetch) 로 같은 패턴`,
          why: `Nuxt 에서는 axios 대신 $fetch.create 의 onRequest / onResponseError 훅으로 같은 일을 합니다. ofetch 는 재시도 옵션이 있지만 토큰 교체가 필요하니 직접 재호출합니다.`,
          single: { label: `✓ plugins/api.ts (Nuxt)`, code: String.raw`
export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuthStore()
  let refreshing: Promise<string> | null = null

  const refreshOnce = () => {
    if (!refreshing) {
      refreshing = $fetch<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' })
        .then(r => { auth.setToken(r.accessToken); return r.accessToken })
        .finally(() => { refreshing = null })
    }
    return refreshing
  }

  const api = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (auth.accessToken) options.headers.set('Authorization', 'Bearer ' + auth.accessToken)
    },
    async onResponseError({ request, options, response }) {
      if (response.status !== 401 || (options as any)._retried || String(request).includes('/auth/')) return
      ;(options as any)._retried = true
      try {
        const token = await refreshOnce()
        options.headers.set('Authorization', 'Bearer ' + token)
        // ofetch 는 훅에서 응답을 바꿀 수 없다. 호출 쪽이 다시 부르도록 재요청 결과를 던진다
        throw new RetryWith(await $fetch(request, { ...options, headers: options.headers }))
      } catch (e) {
        if (e instanceof RetryWith) throw e
        await auth.logout()
        await nuxtApp.runWithContext(() => navigateTo('/login'))
      }
    }
  })

  // RetryWith 를 풀어 주는 얇은 래퍼: 호출 쪽은 $api 만 쓴다
  const $api = (async (req: any, opts?: any) => {
    try { return await api(req, opts) }
    catch (e) { if (e instanceof RetryWith) return e.data; throw e }
  }) as typeof api

  return { provide: { api: $api } }
})

class RetryWith { constructor(public data: unknown) {} }
` },
          note: `서버 쪽(server/api)에서 세션 쿠키 방식을 쓴다면 이 재발급 로직은 필요 없습니다. 파인코드 13회차의 nuxt-auth-utils 방식이 더 단순합니다. 이 코드는 별도 백엔드가 JWT 를 발급하는 경우를 위한 것입니다.`,
        },
        {
          id: 'l6', short: `재발급 실패`,
          title: `재발급 실패 시 로그아웃과 중복 리다이렉트 방지`,
          why: `여러 요청이 동시에 실패하면 /login 으로 여러 번 이동하거나 토스트가 겹칩니다. 한 번만 처리하는 플래그와, 원래 가던 곳을 기억하는 redirect 가 필요합니다.`,
          single: { label: `✓ src/stores/auth.ts 의 일부 + main.ts 연결`, code: String.raw`
// stores/auth.ts
let loggingOut = false
export async function handleAuthLost() {
  if (loggingOut) return
  loggingOut = true
  try {
    const auth = useAuthStore()
    auth.$reset()
    const current = router.currentRoute.value
    if (current.name !== 'login') {
      await router.replace({ name: 'login', query: { redirect: current.fullPath } })
      toast.info('세션이 만료되었습니다. 다시 로그인해 주세요')
    }
  } finally {
    loggingOut = false
  }
}

// main.ts: 스토어와 인터셉터를 잇는다
const auth = useAuthStore(pinia)
bindAuth({
  getToken: () => auth.accessToken,
  onRefreshed: (t) => auth.setToken(t),
  onAuthLost: handleAuthLost
})
` },
        },
        {
          id: 'l7', short: `auth 스토어`,
          title: `Pinia auth 스토어: 상태, 로그인, 로그아웃, 앱 시작 복원`,
          why: `액세스 토큰은 메모리에만 있으니 새로고침하면 사라집니다. 앱이 뜰 때 refresh 를 한 번 시도해 복원하고, 그동안 가드가 기다리게 ready Promise 를 둡니다.`,
          single: { label: `✓ src/stores/auth.ts`, code: String.raw`
import { defineStore } from 'pinia'
import { authApi, type User } from '@/api/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  const expiresAt = ref(0)

  function setToken(token: string, expiresIn = 900) {
    accessToken.value = token
    expiresAt.value = Date.now() + expiresIn * 1000
  }

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    setToken(res.accessToken, res.expiresIn)
    user.value = res.user
    localStorage.setItem('hasSession', '1')          // 토큰이 아니라 힌트만
  }

  async function logout() {
    try { await authApi.logout() } catch { /* 이미 끊겼어도 진행 */ }
    $reset()
  }

  function $reset() {
    user.value = null; accessToken.value = null; expiresAt.value = 0
    localStorage.removeItem('hasSession')
  }

  // 앱 시작: 로그인한 적이 있으면 refresh 로 복원. 한 번만 실행되고 가드가 기다린다
  let readyPromise: Promise<void> | null = null
  function ready() {
    if (!readyPromise) {
      readyPromise = (async () => {
        if (!localStorage.getItem('hasSession')) return
        try {
          const res = await authApi.refresh()
          setToken(res.accessToken, res.expiresIn)
          user.value = await authApi.me()
        } catch { $reset() }
      })()
    }
    return readyPromise
  }

  return { user, accessToken, isLoggedIn, expiresAt, setToken, login, logout, $reset, ready }
})
` },
        },
        {
          id: 'l8', short: `라우트 가드`,
          title: `라우트 가드: 복원이 끝날 때까지 기다리고, 역할도 본다`,
          why: `가드가 복원 전에 isLoggedIn 을 보면 로그인한 사용자도 /login 으로 튕깁니다. ready() 를 먼저 기다립니다. 로그인 페이지는 이미 로그인한 사용자를 홈으로 보냅니다.`,
          single: { label: `✓ src/router/guards.ts`, code: String.raw`
import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta { public?: boolean; roles?: Array<'admin' | 'user'> }
}

export function installGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.ready()                                       // 새로고침 직후 복원 대기

    if (to.meta.public) {
      if (to.name === 'login' && auth.isLoggedIn) return { name: 'home' }
      return true
    }
    if (!auth.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (to.meta.roles && !to.meta.roles.includes(auth.user!.role)) {
      return { name: 'forbidden' }
    }
    return true
  })
}

// routes
{ path: '/login', name: 'login', component: LoginPage, meta: { public: true } }
{ path: '/admin', name: 'admin', component: AdminPage, meta: { roles: ['admin'] } }

// 로그인 성공 후 복귀 (LoginPage)
const back = String(route.query.redirect ?? '/')
router.replace(back.startsWith('/') && !back.startsWith('//') ? back : '/')
` },
        },
        {
          id: 'l9', short: `탭 동기화`,
          title: `한 탭에서 로그아웃하면 모든 탭이 따라간다`,
          why: `탭 A 에서 로그아웃했는데 탭 B 는 로그인 화면을 유지하면 다음 요청에서 401 이 나고 혼란스럽습니다. BroadcastChannel 로 알리고 받는 쪽은 상태를 비웁니다.`,
          single: { label: `✓ src/composables/useAuthSync.ts`, code: String.raw`
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth') : null

type Msg = { type: 'logout' } | { type: 'login' }

export function broadcastAuth(msg: Msg) { channel?.postMessage(msg) }

export function useAuthSync() {
  const auth = useAuthStore()
  const router = useRouter()
  const handler = (e: MessageEvent<Msg>) => {
    if (e.data.type === 'logout' && auth.isLoggedIn) {
      auth.$reset()
      router.replace({ name: 'login' })
    }
    if (e.data.type === 'login' && !auth.isLoggedIn) {
      location.reload()                       // 가장 단순하고 확실한 복원
    }
  }
  channel?.addEventListener('message', handler)
  onScopeDispose(() => channel?.removeEventListener('message', handler))
}

// 스토어의 login / logout 끝에서
broadcastAuth({ type: 'login' })
broadcastAuth({ type: 'logout' })
// App.vue 에서 useAuthSync() 한 번
` },
        },
        {
          id: 'l10', short: `선제 갱신, 자동 로그아웃`,
          title: `만료 1분 전에 미리 갱신하고, 오래 안 쓰면 자동 로그아웃`,
          why: `만료 직후 첫 요청이 401 로 한 번 실패했다 재시도하는 것보다, 만료 전에 조용히 갱신하는 편이 매끄럽습니다. 금융·관리 화면은 비활성 시간이 길면 로그아웃합니다.`,
          single: { label: `✓ src/composables/useSessionKeeper.ts`, code: String.raw`
import { useIdle, useIntervalFn } from '@vueuse/core'

export function useSessionKeeper({ idleMinutes = 30 } = {}) {
  const auth = useAuthStore()

  // 1) 선제 갱신: 30초마다 보고 만료 60초 전이면 refresh
  useIntervalFn(async () => {
    if (!auth.isLoggedIn) return
    if (auth.expiresAt - Date.now() < 60_000) {
      try { const r = await authApi.refresh(); auth.setToken(r.accessToken, r.expiresIn) }
      catch { handleAuthLost() }
    }
  }, 30_000)

  // 2) 비활성 자동 로그아웃: 마우스/키보드/터치가 idleMinutes 동안 없으면
  const { idle } = useIdle(idleMinutes * 60 * 1000)
  watch(idle, (isIdle) => {
    if (isIdle && auth.isLoggedIn) {
      auth.logout()
      toast.info('오랫동안 사용하지 않아 로그아웃되었습니다')
    }
  })
}
` },
          note: `탭이 백그라운드면 브라우저가 타이머를 늦춥니다. 포커스가 돌아올 때(visibilitychange) 한 번 더 만료를 확인하면 안전합니다 (7회차 10번).`,
        },
      ],
    },
    {
      id: 'practice-2', no: 2, name: `API 계층`,
      lead: `컴포넌트가 URL 과 axios 를 직접 만지지 않게 API 호출을 한 층으로 모으고, 에러·재시도·취소·중복을 그 층에서 처리합니다.`,
      lessons: [
        {
          id: 'l1', short: `서비스 함수`,
          title: `API 는 도메인별 서비스 함수로 감싼다`,
          badLabel: `✕ 컴포넌트가 직접`, goodLabel: `✓ 서비스 층`,
          why: `URL 이 컴포넌트에 흩어지면 엔드포인트가 바뀔 때 전부 찾아야 하고 타입도 제각각입니다. 서비스 함수는 한 곳에서 URL, 타입, 변환을 책임집니다.`,
          bad: String.raw`
// UserList.vue
const { data } = await axios.get('/api/v1/users?page=' + page + '&size=20')
users.value = data.content
`,
          good: String.raw`
// api/user.api.ts
export interface Page<T> { items: T[]; total: number; page: number; size: number }

export const userApi = {
  list: (params: { page: number; size?: number; q?: string }) =>
    api.get<Page<User>>('/users', { params: { size: 20, ...params } }).then(r => r.data),
  get: (id: number) => api.get<User>('/users/' + id).then(r => r.data),
  create: (body: Omit<User, 'id'>) => api.post<User>('/users', body).then(r => r.data),
  update: (id: number, body: Partial<User>) => api.patch<User>('/users/' + id, body).then(r => r.data),
  remove: (id: number) => api.delete('/users/' + id).then(() => undefined)
}

// UserList.vue
const pageData = await userApi.list({ page: page.value, q: query.value })
`,
        },
        {
          id: 'l2', short: `ApiError`,
          title: `에러를 ApiError 하나로 정규화한다`,
          why: `axios 에러, 네트워크 에러, 서버가 보낸 { code, message } 가 제각각이면 쓰는 쪽마다 분기가 달라집니다. 인터셉터에서 한 모양으로 바꿔 던집니다.`,
          single: { label: `✓ src/api/error.ts + 인터셉터`, code: String.raw`
export class ApiError extends Error {
  constructor(
    public status: number,          // 0 = 네트워크/타임아웃
    public code: string,            // 서버의 에러 코드 또는 'NETWORK' | 'TIMEOUT' | 'UNKNOWN'
    message: string,
    public fieldErrors?: Record<string, string>,
    public raw?: unknown
  ) { super(message); this.name = 'ApiError' }

  get isNetwork() { return this.status === 0 }
  get isAuth() { return this.status === 401 || this.status === 403 }
  get isValidation() { return this.status === 422 || this.status === 400 }
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  if (axios.isCancel(e)) return new ApiError(0, 'CANCELED', '요청이 취소되었습니다', undefined, e)
  if (axios.isAxiosError(e)) {
    if (!e.response) {
      const timeout = e.code === 'ECONNABORTED'
      return new ApiError(0, timeout ? 'TIMEOUT' : 'NETWORK', timeout ? '응답이 늦습니다' : '네트워크 연결을 확인하세요', undefined, e)
    }
    const body = e.response.data ?? {}
    return new ApiError(e.response.status, body.code ?? 'HTTP_' + e.response.status,
      body.message ?? '요청을 처리하지 못했습니다', body.errors, e)
  }
  return new ApiError(0, 'UNKNOWN', '알 수 없는 오류', undefined, e)
}

// client.ts 응답 인터셉터 맨 끝
api.interceptors.response.use(r => r, e => Promise.reject(toApiError(e)))

// 쓰는 쪽
try { await userApi.create(form) }
catch (e) {
  const err = e as ApiError
  if (err.isValidation && err.fieldErrors) setErrors(err.fieldErrors)
  else toast.error(err.message)
}
` },
        },
        {
          id: 'l3', short: `재시도`,
          title: `네트워크 오류와 5xx 는 지수 백오프로 재시도, GET 만`,
          why: `일시적 장애에 바로 실패 화면을 보여 주면 사용자가 새로고침을 누릅니다. 멱등한 GET 만 몇 번 재시도하고, POST 는 중복 생성 위험이 있어 하지 않습니다.`,
          single: { label: `✓ src/api/retry.ts`, code: String.raw`
import type { AxiosInstance } from 'axios'

export function installRetry(instance: AxiosInstance, { retries = 3, baseMs = 300 } = {}) {
  instance.interceptors.response.use(undefined, async (error) => {
    const cfg = error.config
    if (!cfg) throw error
    const method = (cfg.method ?? 'get').toLowerCase()
    const status = error.response?.status
    const retryable = method === 'get' && (!error.response || status >= 500 || status === 429)
    cfg._retryCount = cfg._retryCount ?? 0
    if (!retryable || cfg._retryCount >= retries || axios.isCancel(error)) throw error

    cfg._retryCount++
    const retryAfter = Number(error.response?.headers?.['retry-after'])
    const wait = retryAfter ? retryAfter * 1000
               : baseMs * 2 ** (cfg._retryCount - 1) + Math.random() * 100   // 지터
    await new Promise(r => setTimeout(r, wait))
    return instance(cfg)
  })
}
installRetry(api)

declare module 'axios' { export interface InternalAxiosRequestConfig { _retryCount?: number } }
` },
          note: `ofetch 는 <code>retry</code>, <code>retryDelay</code>, <code>retryStatusCodes</code> 옵션이 내장되어 있습니다: <code>$fetch(url, { retry: 3, retryDelay: 500 })</code>.`,
        },
        {
          id: 'l4', short: `취소`,
          title: `페이지를 떠나거나 새 검색이 시작되면 이전 요청을 취소한다`,
          why: `취소하지 않으면 늦게 온 옛 응답이 새 화면을 덮고, 떠난 페이지의 요청이 토스트를 띄웁니다. AbortController 를 컴포저블이 관리합니다.`,
          single: { label: `✓ src/composables/useAbortable.ts`, code: String.raw`
export function useAbortable() {
  let ctrl: AbortController | null = null

  // 새 요청을 시작할 때마다 이전 것을 취소하고 새 signal 을 준다
  function next() {
    ctrl?.abort()
    ctrl = new AbortController()
    return ctrl.signal
  }
  onScopeDispose(() => ctrl?.abort())      // 컴포넌트가 사라지면 취소
  return { next }
}

// 사용: 검색
const { next } = useAbortable()
watch(query, async (q) => {
  const signal = next()
  try {
    results.value = await userApi.search(q, { signal })     // axios: { signal } 옵션
  } catch (e) {
    if ((e as ApiError).code === 'CANCELED') return        // 취소는 무시
    throw e
  }
})
` },
        },
        {
          id: 'l5', short: `중복 제거`,
          title: `같은 요청이 동시에 나가면 하나만 보내고 결과를 공유한다`,
          why: `헤더, 사이드바, 본문이 각자 /users/me 를 부르면 같은 요청이 세 번 나갑니다. 진행 중인 요청을 키로 기억해 두고 같은 키는 그 Promise 를 돌려줍니다.`,
          single: { label: `✓ src/api/dedupe.ts`, code: String.raw`
const inflight = new Map<string, Promise<unknown>>()

export function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const found = inflight.get(key)
  if (found) return found as Promise<T>
  const p = run().finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

// 서비스에서
export const userApi = {
  me: () => dedupe('users/me', () => api.get<User>('/users/me').then(r => r.data))
}

// GET 전체에 적용하려면 요청 인터셉터에서 method+url+params 로 키를 만들어 어댑터를 감싼다.
// Nuxt 의 useFetch 는 같은 키의 요청을 기본으로 공유하므로 이 코드가 필요 없다.
` },
        },
        {
          id: 'l6', short: `전역 로딩`,
          title: `진행 중 요청 수로 전역 로딩 바를 켠다`,
          why: `화면마다 loading ref 를 두면 빠지는 곳이 생깁니다. 인터셉터에서 요청 수를 세고, 상단 로딩 바 하나가 그것을 봅니다. 조용히 보낼 요청은 옵션으로 뺍니다.`,
          single: { label: `✓ src/stores/loading.ts + 인터셉터`, code: String.raw`
export const useLoadingStore = defineStore('loading', () => {
  const count = ref(0)
  const active = computed(() => count.value > 0)
  const start = () => count.value++
  const stop = () => { count.value = Math.max(0, count.value - 1) }
  return { active, start, stop }
})

// client.ts
api.interceptors.request.use((cfg) => {
  if (!cfg.silent) useLoadingStore().start()
  return cfg
})
api.interceptors.response.use(
  (res) => { if (!res.config.silent) useLoadingStore().stop(); return res },
  (err) => { if (!err.config?.silent) useLoadingStore().stop(); return Promise.reject(err) }
)
declare module 'axios' { export interface AxiosRequestConfig { silent?: boolean } }

// 조용한 요청: 폴링, 자동 저장
api.get('/notifications/count', { silent: true })

<!-- App.vue -->
<div class="top-bar" :class="{ on: loading.active }" />
` },
        },
        {
          id: 'l7', short: `업로드 진행률`,
          title: `업로드 진행률과 취소`,
          why: `큰 파일은 진행률이 없으면 멈춘 것처럼 보입니다. axios 의 onUploadProgress 와 AbortController 로 진행률 표시와 취소를 붙입니다.`,
          single: { label: `✓ src/composables/useUpload.ts`, code: String.raw`
export function useUpload() {
  const progress = ref(0)
  const status = ref<'idle' | 'uploading' | 'done' | 'error' | 'canceled'>('idle')
  let ctrl: AbortController | null = null

  async function upload(file: File, url = '/files') {
    ctrl = new AbortController()
    status.value = 'uploading'; progress.value = 0
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post<{ id: string; url: string }>(url, fd, {
        signal: ctrl.signal,
        onUploadProgress: (e) => { if (e.total) progress.value = Math.round(e.loaded / e.total * 100) }
      })
      status.value = 'done'
      return res.data
    } catch (e) {
      status.value = (e as ApiError).code === 'CANCELED' ? 'canceled' : 'error'
      throw e
    }
  }
  const cancel = () => ctrl?.abort()
  return { progress, status, upload, cancel }
}

<progress :value="progress" max="100" /> {{ progress }}%
<button v-if="status === 'uploading'" @click="cancel">취소</button>
` },
        },
        {
          id: 'l8', short: `타입 있는 클라이언트`,
          title: `request&lt;T&gt; 한 함수로 메서드를 통일한다`,
          why: `get/post 마다 .then(r =&gt; r.data) 를 반복하면 잊는 곳이 생깁니다. 제네릭 request 하나로 응답 본문만 돌려주고, 서비스 함수는 그 위에 얇게 얹습니다.`,
          single: { label: `✓ src/api/request.ts`, code: String.raw`
import type { AxiosRequestConfig } from 'axios'

export async function request<T>(cfg: AxiosRequestConfig): Promise<T> {
  const res = await api.request<T>(cfg)
  return res.data
}
export const http = {
  get:   <T>(url: string, cfg?: AxiosRequestConfig) => request<T>({ ...cfg, url, method: 'GET' }),
  post:  <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig) => request<T>({ ...cfg, url, method: 'POST', data }),
  patch: <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig) => request<T>({ ...cfg, url, method: 'PATCH', data }),
  del:   <T = void>(url: string, cfg?: AxiosRequestConfig) => request<T>({ ...cfg, url, method: 'DELETE' })
}

// 서비스: 짧아진다
export const orderApi = {
  list: (params: OrderQuery) => http.get<Page<Order>>('/orders', { params }),
  cancel: (id: number) => http.post<Order>('/orders/' + id + '/cancel')
}
` },
        },
        {
          id: 'l9', short: `환경 설정`,
          title: `baseURL 과 타임아웃은 환경 변수, 개발은 프록시`,
          why: `개발에서 다른 포트의 백엔드를 직접 부르면 CORS 와 쿠키 문제가 납니다. Vite 프록시로 같은 출처처럼 보이게 하고, 운영에서는 환경 변수로 주소를 줍니다.`,
          single: { label: `✓ vite.config.ts + .env`, code: String.raw`
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true }   // /api/users → 8080/api/users
    }
  }
})

// .env.development   VITE_API_BASE=/api          (프록시)
// .env.production    VITE_API_BASE=https://api.example.com

// Nuxt: nuxt.config.ts
routeRules: { '/api/**': { proxy: 'http://localhost:8080/api/**' } }   // 개발/운영 모두 Nitro 프록시
runtimeConfig: { public: { apiBase: '/api' } }
` },
          lang: 'vue',
        },
        {
          id: 'l10', short: `MSW 모킹`,
          title: `백엔드 없이 개발: MSW 로 API 를 흉내낸다`,
          why: `백엔드가 아직 없거나 특정 에러를 재현해야 할 때 코드에 if (mock) 을 넣으면 운영에 새어 나갑니다. MSW 는 네트워크 층에서 가로채 앱 코드를 전혀 바꾸지 않습니다.`,
          single: { label: `✓ src/mocks/handlers.ts + main.ts`, code: String.raw`
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw'

export const handlers = [
  http.get('/api/users', async ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    await delay(300)
    return HttpResponse.json({ items: fakeUsers(page), total: 57, page, size: 20 })
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string }
    if (body.email === 'fail@test.com') return HttpResponse.json({ code: 'INVALID', message: '아이디 또는 비밀번호가 틀립니다' }, { status: 401 })
    return HttpResponse.json({ accessToken: 'mock', expiresIn: 900, user: { id: 1, name: 'kim', email: body.email, role: 'admin' } })
  })
]

// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
export const worker = setupWorker(...handlers)

// main.ts
if (import.meta.env.DEV && import.meta.env.VITE_MOCK === '1') {
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}
// npx msw init public/ --save   (서비스 워커 파일 생성)
` },
        },
      ],
    },
    {
      id: 'practice-3', no: 3, name: `폼 실무 패턴`,
      lead: `로그인, 회원가입, 자동 저장, 다단계, 주소 검색처럼 실제 화면에서 반복되는 폼 코드입니다. VeeValidate + zod 를 기준으로 합니다.`,
      lessons: [
        {
          id: 'l1', short: `로그인 폼`,
          title: `로그인 폼 전체: 검증, 에러, 로딩, 비밀번호 보기`,
          why: `가장 많이 만드는 폼입니다. 서버 401 메시지를 폼 수준 오류로 보여 주고, 제출 중에는 버튼을 잠그며, 성공하면 원래 가려던 곳으로 돌아갑니다.`,
          single: { label: `✓ pages/login.vue`, code: String.raw`
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = toTypedSchema(z.object({
  email: z.string().email('이메일 형식이 아닙니다'),
  password: z.string().min(8, '8자 이상 입력하세요')
}))
const { defineField, handleSubmit, errors, isSubmitting } = useForm({ validationSchema: schema })
const [email, emailAttrs] = defineField('email', { validateOnBlur: true, validateOnModelUpdate: false })
const [password, passwordAttrs] = defineField('password', { validateOnBlur: true, validateOnModelUpdate: false })
const showPw = ref(false)
const formError = ref('')
const auth = useAuthStore(); const route = useRoute(); const router = useRouter()

const onSubmit = handleSubmit(async (v) => {
  formError.value = ''
  try {
    await auth.login(v.email, v.password)
    const back = String(route.query.redirect ?? '/')
    router.replace(back.startsWith('/') ? back : '/')
  } catch (e) {
    const err = e as ApiError
    formError.value = err.status === 401 ? '이메일 또는 비밀번호가 올바르지 않습니다' : err.message
  }
})
</script>

<template>
  <form @submit="onSubmit" novalidate>
    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    <label for="email">이메일</label>
    <input id="email" v-model="email" v-bind="emailAttrs" type="email" autocomplete="username" :aria-invalid="!!errors.email">
    <p class="err">{{ errors.email }}</p>
    <label for="pw">비밀번호</label>
    <div class="pw">
      <input id="pw" v-model="password" v-bind="passwordAttrs" :type="showPw ? 'text' : 'password'" autocomplete="current-password">
      <button type="button" @click="showPw = !showPw" :aria-label="showPw ? '비밀번호 숨기기' : '비밀번호 보기'">👁</button>
    </div>
    <p class="err">{{ errors.password }}</p>
    <button type="submit" :disabled="isSubmitting">{{ isSubmitting ? '로그인 중…' : '로그인' }}</button>
  </form>
</template>
` },
        },
        {
          id: 'l2', short: `회원가입`,
          title: `회원가입: 비밀번호 확인, 약관, 이메일 중복 비동기 검사`,
          why: `두 필드를 비교하는 규칙은 zod 의 refine 으로, 서버에 물어봐야 하는 중복 검사는 디바운스된 비동기 검증으로 처리합니다.`,
          single: { label: `✓ pages/signup.vue (핵심만)`, code: String.raw`
const schema = toTypedSchema(
  z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Za-z]/, '영문 포함').regex(/\d/, '숫자 포함'),
    confirm: z.string(),
    agree: z.literal(true, { errorMap: () => ({ message: '약관에 동의해야 합니다' }) })
  }).refine(v => v.password === v.confirm, { path: ['confirm'], message: '비밀번호가 다릅니다' })
)
const { defineField, handleSubmit, errors, setFieldError, isSubmitting } = useForm({ validationSchema: schema })
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirm, confirmAttrs] = defineField('confirm')
const [agree, agreeAttrs] = defineField('agree', { type: 'checkbox' })

// 이메일 중복: 입력이 멈추고 400ms 뒤, 형식이 맞을 때만 서버에 묻는다
const checking = ref(false)
const checkEmail = useDebounceFn(async (v: string) => {
  if (!z.string().email().safeParse(v).success) return
  checking.value = true
  try {
    const { available } = await authApi.checkEmail(v)
    if (!available) setFieldError('email', '이미 가입된 이메일입니다')
  } finally { checking.value = false }
}, 400)
watch(email, (v) => v && checkEmail(v))

const onSubmit = handleSubmit(async (v) => {
  try { await authApi.signup(v); navigateTo('/welcome') }
  catch (e) { const err = e as ApiError; if (err.fieldErrors) setErrors(err.fieldErrors); else toast.error(err.message) }
})
` },
        },
        {
          id: 'l3', short: `자동 저장`,
          title: `긴 글은 자동 저장: 디바운스, 로컬 임시본, 서버 초안`,
          why: `브라우저가 닫히거나 네트워크가 끊겨도 작성 중인 글이 남아야 합니다. 입력이 멈추면 localStorage 에 먼저, 2초 뒤 서버 초안에 저장하고 저장 상태를 보여 줍니다.`,
          single: { label: `✓ composables/useAutosave.ts`, code: String.raw`
import { useDebounceFn, useLocalStorage, watchDebounced } from '@vueuse/core'

export function useAutosave<T extends object>(key: string, form: Ref<T>, save: (v: T) => Promise<void>) {
  const draft = useLocalStorage<T | null>('draft:' + key, null)
  const state = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const savedAt = ref<Date | null>(null)

  // 1) 복원 제안
  const hasDraft = computed(() => !!draft.value)
  function restore() { if (draft.value) form.value = { ...form.value, ...draft.value } }
  function discard() { draft.value = null }

  // 2) 로컬은 즉시(300ms), 서버는 2초 뒤
  watchDebounced(form, (v) => { draft.value = { ...v } }, { deep: true, debounce: 300 })
  watchDebounced(form, async (v) => {
    state.value = 'saving'
    try { await save({ ...v }); state.value = 'saved'; savedAt.value = new Date() }
    catch { state.value = 'error' }
  }, { deep: true, debounce: 2000 })

  // 3) 탭을 닫을 때 저장 중이면 경고
  useEventListener(window, 'beforeunload', (e) => { if (state.value === 'saving') { e.preventDefault(); e.returnValue = '' } })

  return { state, savedAt, hasDraft, restore, discard }
}

// 사용
const form = ref({ title: '', body: '' })
const { state, savedAt, hasDraft, restore, discard } = useAutosave('post:' + id, form, (v) => postApi.saveDraft(id, v))
// <p v-if="hasDraft">저장되지 않은 임시본이 있습니다 <button @click="restore">불러오기</button> <button @click="discard">삭제</button></p>
// <span>{{ state === 'saving' ? '저장 중…' : state === 'saved' ? savedAt.toLocaleTimeString() + ' 저장됨' : '' }}</span>
` },
        },
        {
          id: 'l4', short: `다단계 폼`,
          title: `다단계 폼: 단계별 검증, 뒤로 가도 값 유지`,
          why: `단계마다 컴포넌트를 바꾸면 입력값이 사라집니다. 값은 부모(useForm) 하나가 들고, 단계 컴포넌트는 그 일부만 보여 주며, 다음으로 갈 때 그 단계의 필드만 검증합니다.`,
          single: { label: `✓ pages/checkout.vue`, code: String.raw`
<script setup lang="ts">
const steps = [
  { key: 'shipping', title: '배송지', fields: ['name', 'phone', 'address'] },
  { key: 'payment',  title: '결제',   fields: ['method', 'cardNo'] },
  { key: 'review',   title: '확인',   fields: [] }
] as const
const step = ref(0)
const { values, validateField, handleSubmit, meta } = useForm({ validationSchema: toTypedSchema(CheckoutSchema) })

async function next() {
  // 현재 단계 필드만 검증
  const results = await Promise.all(steps[step.value].fields.map(f => validateField(f)))
  if (results.every(r => r.valid)) step.value++
}
const prev = () => step.value--
const submit = handleSubmit(async (v) => { await orderApi.create(v); navigateTo('/orders/done') })
</script>

<template>
  <ol class="stepper">
    <li v-for="(s, i) in steps" :key="s.key" :class="{ on: i === step, done: i < step }">{{ s.title }}</li>
  </ol>
  <!-- KeepAlive 로 단계 컴포넌트의 내부 UI 상태(펼침 등)도 유지. 값은 어차피 useForm 에 있다 -->
  <KeepAlive>
    <ShippingStep v-if="step === 0" />
    <PaymentStep v-else-if="step === 1" />
    <ReviewStep v-else :values="values" />
  </KeepAlive>
  <div class="actions">
    <button v-if="step > 0" type="button" @click="prev">이전</button>
    <button v-if="step < steps.length - 1" type="button" @click="next">다음</button>
    <button v-else type="button" @click="submit" :disabled="!meta.valid">주문하기</button>
  </div>
</template>
<!-- 단계 컴포넌트는 useField('name') 처럼 이름만으로 부모 폼에 연결된다 -->
` },
        },
        {
          id: 'l5', short: `주소 검색`,
          title: `우편번호 검색 팝업 연동 (다음/카카오 우편번호)`,
          why: `외부 스크립트는 필요할 때 한 번만 로드하고, 콜백 결과를 폼 필드에 넣습니다. SSR 에서는 window 가 없으니 클라이언트에서만 부릅니다.`,
          single: { label: `✓ composables/usePostcode.ts`, code: String.raw`
import { useScriptTag } from '@vueuse/core'

declare global { interface Window { daum: any } }

export function usePostcode() {
  const { load } = useScriptTag('https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js', () => {}, { manual: true })

  async function open(): Promise<{ zonecode: string; address: string; buildingName: string }> {
    await load()                                  // 한 번만 로드, 이후 호출은 즉시
    return new Promise((resolve) => {
      new window.daum.Postcode({
        oncomplete: (d: any) => resolve({ zonecode: d.zonecode, address: d.roadAddress || d.jibunAddress, buildingName: d.buildingName })
      }).open()
    })
  }
  return { open }
}

// 폼에서
const { open } = usePostcode()
async function pickAddress() {
  const r = await open()
  setFieldValue('zip', r.zonecode)
  setFieldValue('address1', r.address + (r.buildingName ? ' (' + r.buildingName + ')' : ''))
  nextTick(() => detailInput.value?.focus())      // 상세 주소로 포커스
}
<input v-model="zip" readonly> <button type="button" @click="pickAddress">주소 검색</button>
` },
        },
        {
          id: 'l6', short: `입력 마스크`,
          title: `전화번호, 카드번호 자동 하이픈`,
          why: `사용자가 하이픈을 넣든 말든 같은 값이 저장되어야 합니다. 표시는 포맷하고 모델에는 숫자만 두는 컴포넌트로 만듭니다.`,
          single: { label: `✓ components/MaskedInput.vue`, code: String.raw`
<script setup lang="ts">
const model = defineModel<string>({ default: '' })        // 숫자만 저장
const props = defineProps<{ kind: 'phone' | 'card' | 'biz' }>()

const formats: Record<typeof props.kind, (d: string) => string> = {
  phone: d => d.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3').replace(/^(\d{3})(\d{1,4})$/, '$1-$2'),
  card:  d => d.replace(/(\d{4})(?=\d)/g, '$1-'),
  biz:   d => d.replace(/^(\d{3})(\d{2})(\d{0,5})$/, '$1-$2-$3')
}
const maxLen = { phone: 11, card: 16, biz: 10 }

const shown = computed(() => formats[props.kind](model.value))
function onInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, maxLen[props.kind])
  model.value = digits
  ;(e.target as HTMLInputElement).value = formats[props.kind](digits)   // 커서 튐 최소화
}
</script>
<template>
  <input :value="shown" @input="onInput" inputmode="numeric" :autocomplete="kind === 'phone' ? 'tel' : 'off'">
</template>

<!-- <MaskedInput v-model="form.phone" kind="phone" />   저장값: 01012345678 -->
` },
        },
        {
          id: 'l7', short: `날짜 범위`,
          title: `날짜 범위 입력: 시작 ≤ 끝, 최대 기간, 빠른 선택`,
          why: `시작일이 끝일보다 늦거나 1년 넘는 범위를 서버에 보내면 조회가 무겁거나 오류가 납니다. 스키마로 막고 "최근 7일" 같은 빠른 선택을 둡니다.`,
          single: { label: `✓ components/DateRange.vue`, code: String.raw`
<script setup lang="ts">
import dayjs from 'dayjs'
const range = defineModel<{ from: string; to: string }>({ required: true })   // 'YYYY-MM-DD'
const props = defineProps<{ maxDays?: number }>()

const error = computed(() => {
  const f = dayjs(range.value.from), t = dayjs(range.value.to)
  if (!f.isValid() || !t.isValid()) return '날짜를 선택하세요'
  if (t.isBefore(f)) return '종료일이 시작일보다 빠릅니다'
  if (props.maxDays && t.diff(f, 'day') > props.maxDays) return '최대 ' + props.maxDays + '일까지 조회할 수 있습니다'
  return ''
})
defineExpose({ valid: computed(() => !error.value) })

const quick = [
  { label: '오늘', days: 0 }, { label: '7일', days: 6 }, { label: '30일', days: 29 }
]
function pick(days: number) {
  range.value = { from: dayjs().subtract(days, 'day').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') }
}
</script>
<template>
  <div class="range">
    <input type="date" v-model="range.from" :max="range.to">
    ~
    <input type="date" v-model="range.to" :min="range.from" :max="dayjs().format('YYYY-MM-DD')">
    <button v-for="q in quick" :key="q.label" type="button" @click="pick(q.days)">{{ q.label }}</button>
    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>
` },
        },
        {
          id: 'l8', short: `종속 셀렉트`,
          title: `시/도 → 구/군 처럼 앞 선택에 따라 뒤 옵션이 바뀌는 셀렉트`,
          why: `앞 값이 바뀌면 뒤 값은 초기화해야 하고, 뒤 옵션은 서버에서 받아오는 동안 비활성이어야 합니다. 수정 화면에서는 초기값으로 두 단계를 미리 채웁니다.`,
          single: { label: `✓ components/RegionSelect.vue`, code: String.raw`
<script setup lang="ts">
const model = defineModel<{ sido: string; sigungu: string }>({ required: true })

const { data: sidos } = await useFetch('/api/regions')                               // [{ code, name }]
const { data: sigungus, status } = await useFetch('/api/regions/children', {
  query: { parent: computed(() => model.value.sido) },                               // sido 가 바뀌면 자동 재요청
  immediate: !!model.value.sido,
  default: () => []
})

watch(() => model.value.sido, (next, prev) => {
  if (prev !== undefined && next !== prev) model.value.sigungu = ''                 // 앞이 바뀌면 뒤 초기화 (첫 로드는 제외)
})
</script>
<template>
  <select v-model="model.sido">
    <option value="">시/도</option>
    <option v-for="s in sidos" :key="s.code" :value="s.code">{{ s.name }}</option>
  </select>
  <select v-model="model.sigungu" :disabled="!model.sido || status === 'pending'">
    <option value="">{{ status === 'pending' ? '불러오는 중…' : '구/군' }}</option>
    <option v-for="g in sigungus" :key="g.code" :value="g.code">{{ g.name }}</option>
  </select>
</template>
` },
        },
        {
          id: 'l9', short: `제출 후 처리`,
          title: `제출 결과 처리를 한 함수로: 성공 토스트, 필드 오류 매핑, 재시도`,
          why: `폼마다 try/catch 와 토스트 코드를 반복하면 메시지가 제각각이 됩니다. 제출 래퍼 하나가 ApiError 를 받아 필드 오류는 폼에, 나머지는 토스트로 보냅니다.`,
          single: { label: `✓ composables/useSubmit.ts`, code: String.raw`
export function useSubmit<T>(form: { setErrors: (e: Record<string, string>) => void }) {
  const submitting = ref(false)
  async function run(action: () => Promise<T>, opts: { success?: string; onSuccess?: (r: T) => void } = {}) {
    if (submitting.value) return                      // 이중 제출 방지
    submitting.value = true
    try {
      const r = await action()
      if (opts.success) toast.success(opts.success)
      opts.onSuccess?.(r)
      return r
    } catch (e) {
      const err = toApiError(e)
      if (err.isValidation && err.fieldErrors) form.setErrors(err.fieldErrors)
      else if (err.isNetwork) toast.error(err.message, { action: { label: '다시 시도', onClick: () => run(action, opts) } })
      else toast.error(err.message)
    } finally { submitting.value = false }
  }
  return { submitting, run }
}

// 사용
const form = useForm({ validationSchema })
const { submitting, run } = useSubmit(form)
const onSubmit = form.handleSubmit(v => run(() => userApi.create(v), { success: '저장했습니다', onSuccess: (u) => navigateTo('/users/' + u.id) }))
` },
        },
        {
          id: 'l10', short: `이탈 방지`,
          title: `수정 중 페이지를 떠나면 확인하고, 저장 후에는 묻지 않는다`,
          why: `실수로 뒤로 가기를 눌러 입력을 날리는 일을 막습니다. 라우터 이동은 onBeforeRouteLeave, 탭 닫기는 beforeunload 로 잡고, 저장 직후에는 dirty 를 초기화해 묻지 않습니다.`,
          single: { label: `✓ composables/useLeaveGuard.ts`, code: String.raw`
export function useLeaveGuard(isDirty: () => boolean, message = '저장하지 않은 변경 사항이 있습니다. 나갈까요?') {
  let bypass = false
  onBeforeRouteLeave(() => {
    if (bypass || !isDirty()) return true
    return window.confirm(message)                       // 2회차 5회차의 Promise confirm 으로 바꿔도 된다
  })
  useEventListener(window, 'beforeunload', (e) => {
    if (!bypass && isDirty()) { e.preventDefault(); e.returnValue = '' }
  })
  return { allowLeave: () => { bypass = true } }         // 저장 뒤 이동할 때 호출
}

// 사용 (VeeValidate)
const { meta, resetForm } = useForm({ validationSchema, initialValues: props.user })
const { allowLeave } = useLeaveGuard(() => meta.value.dirty)
const save = handleSubmit(async (v) => {
  await userApi.update(id, v)
  resetForm({ values: v })          // 저장한 값이 새 기준: dirty = false
  allowLeave()
  navigateTo('/users/' + id)
})
` },
        },
      ],
    },
    {
      id: 'practice-4', no: 4, name: `목록과 데이터`,
      lead: `페이지네이션, 무한 스크롤, 검색, 정렬·필터 URL 동기화, 선택, 낙관적 업데이트, 폴링, 내보내기까지 목록 화면의 모든 조각입니다.`,
      lessons: [
        {
          id: 'l1', short: `서버 페이지네이션`,
          title: `서버 페이지네이션 + URL 동기화`,
          why: `페이지 번호가 URL 에 있어야 새로고침과 공유, 뒤로 가기가 됩니다. 쿼리를 라우트에서 읽어 useFetch 에 넘기면 주소가 바뀔 때 자동으로 다시 불러옵니다.`,
          single: { label: `✓ pages/users/index.vue`, code: String.raw`
<script setup lang="ts">
const route = useRoute(); const router = useRouter()
const page = computed({
  get: () => Math.max(1, Number(route.query.page ?? 1)),
  set: (p) => router.push({ query: { ...route.query, page: p > 1 ? p : undefined } })
})
const size = 20
const { data, status } = await useFetch('/api/users', {
  query: { page, size },                                  // page ref 가 바뀌면 자동 재요청
  default: () => ({ items: [], total: 0 })
})
const pages = computed(() => Math.ceil(data.value.total / size))
</script>
<template>
  <UserTable :items="data.items" :loading="status === 'pending'" />
  <Pagination v-model="page" :pages="pages" />
</template>

<!-- components/Pagination.vue: 현재 ±2 와 양 끝만 보여 주는 번호 목록 -->
<script setup lang="ts">
const model = defineModel<number>({ required: true })
const props = defineProps<{ pages: number }>()
const shown = computed(() => {
  const s = new Set([1, props.pages, model.value - 2, model.value - 1, model.value, model.value + 1, model.value + 2]
    .filter(p => p >= 1 && p <= props.pages))
  return [...s].sort((a, b) => a - b)
})
</script>
<template>
  <nav aria-label="페이지">
    <button :disabled="model <= 1" @click="model--">이전</button>
    <template v-for="(p, i) in shown" :key="p">
      <span v-if="i > 0 && p - shown[i - 1] > 1">…</span>
      <button :aria-current="p === model ? 'page' : undefined" @click="model = p">{{ p }}</button>
    </template>
    <button :disabled="model >= pages" @click="model++">다음</button>
  </nav>
</template>
` },
        },
        {
          id: 'l2', short: `무한 스크롤`,
          title: `무한 스크롤: 커서 기반, 바닥 감지, 끝 처리`,
          why: `오프셋 페이지네이션은 새 글이 끼어들면 중복이 생깁니다. 마지막 항목의 커서를 보내고, 바닥의 보초 요소가 보이면 다음을 불러옵니다. 이미 불러오는 중이거나 끝이면 멈춥니다.`,
          single: { label: `✓ composables/useInfiniteList.ts`, code: String.raw`
export function useInfiniteList<T extends { id: number | string }>(
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>
) {
  const items = ref<T[]>([]) as Ref<T[]>
  const cursor = ref<string | null>(null)
  const done = ref(false)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function loadMore() {
    if (loading.value || done.value) return
    loading.value = true; error.value = null
    try {
      const r = await fetchPage(cursor.value)
      items.value.push(...r.items)
      cursor.value = r.nextCursor
      if (!r.nextCursor) done.value = true
    } catch (e) { error.value = e as Error }
    finally { loading.value = false }
  }
  function reset() { items.value = []; cursor.value = null; done.value = false; return loadMore() }

  const sentinel = ref<HTMLElement | null>(null)
  useIntersectionObserver(sentinel, ([e]) => { if (e.isIntersecting) loadMore() }, { rootMargin: '200px' })   // 바닥 200px 전에 미리

  return { items, done, loading, error, loadMore, reset, sentinel }
}

// 사용
const { items, done, loading, error, loadMore, sentinel } = useInfiniteList(c => feedApi.list({ cursor: c, size: 20 }))
await loadMore()
<FeedItem v-for="it in items" :key="it.id" :item="it" />
<div ref="sentinel" />
<p v-if="loading">불러오는 중…</p>
<p v-else-if="error">실패했습니다 <button @click="loadMore">다시</button></p>
<p v-else-if="done">마지막입니다</p>
` },
        },
        {
          id: 'l3', short: `검색`,
          title: `검색: 디바운스, 최소 글자, 취소, 빈 결과`,
          why: `타이핑마다 요청하면 서버가 힘들고 응답 순서가 꼬입니다. 300ms 멈춤 뒤, 2글자 이상일 때만 보내고, 새 검색이 시작되면 이전 요청을 취소합니다.`,
          single: { label: `✓ composables/useSearch.ts`, code: String.raw`
export function useSearch<T>(search: (q: string, signal: AbortSignal) => Promise<T[]>, { min = 2, delay = 300 } = {}) {
  const query = ref('')
  const results = ref<T[]>([]) as Ref<T[]>
  const status = ref<'idle' | 'typing' | 'loading' | 'done' | 'error'>('idle')
  const debounced = refDebounced(query, delay)
  const { next } = useAbortable()

  watch(query, () => { if (query.value.trim().length >= min) status.value = 'typing' })
  watch(debounced, async (q) => {
    q = q.trim()
    if (q.length < min) { results.value = []; status.value = 'idle'; next(); return }
    status.value = 'loading'
    try { results.value = await search(q, next()); status.value = 'done' }
    catch (e) { if ((e as ApiError).code !== 'CANCELED') status.value = 'error' }
  })
  return { query, results, status }
}

// 사용
const { query, results, status } = useSearch((q, signal) => productApi.search(q, { signal }))
<input v-model="query" type="search" placeholder="2글자 이상">
<ul v-if="status === 'done' && results.length"><li v-for="r in results" :key="r.id">{{ r.name }}</li></ul>
<p v-else-if="status === 'done'">'{{ query }}' 에 대한 결과가 없습니다</p>
<p v-else-if="status === 'loading'">검색 중…</p>
` },
        },
        {
          id: 'l4', short: `정렬·필터 URL`,
          title: `정렬과 필터 상태를 URL 쿼리에 두는 컴포저블`,
          why: `필터를 걸고 상세에 갔다 돌아오면 필터가 풀려 있으면 짜증납니다. 쿼리 파라미터와 ref 를 양방향으로 묶는 작은 컴포저블 하나로 모든 목록이 같은 동작을 합니다.`,
          single: { label: `✓ composables/useQueryState.ts`, code: String.raw`
export function useQueryState<T extends string | number>(key: string, defaultValue: T) {
  const route = useRoute(); const router = useRouter()
  return computed<T>({
    get: () => {
      const raw = route.query[key]
      if (raw == null) return defaultValue
      return (typeof defaultValue === 'number' ? Number(raw) : String(raw)) as T
    },
    set: (v) => {
      const query = { ...route.query, [key]: v === defaultValue ? undefined : String(v) }
      if (key !== 'page') query.page = undefined            // 필터가 바뀌면 1페이지로
      router.replace({ query })
    }
  })
}

// 목록 페이지
const page = useQueryState('page', 1)
const sort = useQueryState<'latest' | 'price' | 'name'>('sort', 'latest')
const category = useQueryState('cat', '')
const { data } = await useFetch('/api/products', { query: { page, sort, category } })

<select v-model="sort"><option value="latest">최신순</option><option value="price">가격순</option></select>
` },
          note: `@vueuse/router 의 <code>useRouteQuery</code> 가 같은 일을 합니다. 위 코드는 "필터 변경 시 1페이지로" 규칙을 넣기 위해 직접 쓴 버전입니다.`,
        },
        {
          id: 'l5', short: `행 선택`,
          title: `테이블 행 선택: 전체 선택, 부분 선택(indeterminate), 페이지 넘어도 유지`,
          why: `전체 선택 체크박스는 세 상태(없음, 일부, 전부)를 가져야 하고, 선택 집합은 페이지를 넘겨도 남아야 합니다. id Set 으로 관리합니다.`,
          single: { label: `✓ composables/useSelection.ts`, code: String.raw`
export function useSelection<T extends { id: number | string }>(visible: Ref<T[]>) {
  const selected = ref(new Set<T['id']>()) as Ref<Set<T['id']>>
  const isSelected = (id: T['id']) => selected.value.has(id)
  function toggle(id: T['id']) {
    const s = new Set(selected.value)
    s.has(id) ? s.delete(id) : s.add(id)
    selected.value = s
  }
  const visibleSelected = computed(() => visible.value.filter(i => selected.value.has(i.id)).length)
  const allVisible = computed(() => visible.value.length > 0 && visibleSelected.value === visible.value.length)
  const someVisible = computed(() => visibleSelected.value > 0 && !allVisible.value)
  function toggleAll() {
    const s = new Set(selected.value)
    visible.value.forEach(i => allVisible.value ? s.delete(i.id) : s.add(i.id))
    selected.value = s
  }
  const clear = () => { selected.value = new Set() }
  return { selected, isSelected, toggle, allVisible, someVisible, toggleAll, clear, count: computed(() => selected.value.size) }
}

<!-- 헤더 -->
<input type="checkbox" :checked="allVisible" :indeterminate="someVisible" @change="toggleAll" aria-label="전체 선택">
<!-- 행 -->
<tr v-for="u in items" :key="u.id" :class="{ selected: isSelected(u.id) }">
  <td><input type="checkbox" :checked="isSelected(u.id)" @change="toggle(u.id)"></td>
<!-- 툴바 -->
<div v-if="count" class="bulk">{{ count }}개 선택 <button @click="bulkDelete([...selected])">삭제</button> <button @click="clear">해제</button></div>
` },
        },
        {
          id: 'l6', short: `낙관적 삭제`,
          title: `낙관적 업데이트: 먼저 지우고, 실패하면 되돌린다`,
          why: `삭제 버튼을 누르고 응답을 기다렸다 지우면 느리게 느껴집니다. 화면에서 먼저 지우고 서버가 실패하면 원래 자리에 되돌리며 알립니다.`,
          single: { label: `✓ composables/useOptimisticRemove.ts`, code: String.raw`
export function useOptimisticRemove<T extends { id: number | string }>(list: Ref<T[]>, remove: (id: T['id']) => Promise<void>) {
  async function run(id: T['id']) {
    const idx = list.value.findIndex(i => i.id === id)
    if (idx < 0) return
    const [removed] = list.value.splice(idx, 1)               // 1) 먼저 지운다
    try {
      await remove(id)                                        // 2) 서버
    } catch (e) {
      list.value.splice(Math.min(idx, list.value.length), 0, removed)   // 3) 실패: 되돌린다
      toast.error('삭제하지 못했습니다')
      throw e
    }
  }
  return { run }
}

// 사용 (Nuxt 4 의 data 는 shallowRef 라 list 를 교체하는 방식으로)
const { data } = await useFetch('/api/todos', { default: () => [] })
const items = computed({ get: () => data.value, set: v => { data.value = v } })
const { run: removeTodo } = useOptimisticRemove(items, id => $fetch('/api/todos/' + id, { method: 'DELETE' }))
` },
          note: `되돌리기가 어려운 작업(결제, 전송)은 낙관적으로 하지 않습니다. "실행 취소" 토스트(5회차 01번)와 함께 쓰면 삭제 UX 가 더 좋아집니다.`,
        },
        {
          id: 'l7', short: `폴링`,
          title: `폴링: 보일 때만, 백오프, 포커스 복귀 시 즉시`,
          why: `탭이 뒤에 있는데도 5초마다 요청하면 서버와 배터리를 낭비합니다. 문서가 보일 때만 돌리고, 실패하면 간격을 늘리고, 돌아오면 바로 한 번 갱신합니다.`,
          single: { label: `✓ composables/usePolling.ts`, code: String.raw`
export function usePolling(fn: () => Promise<void>, { interval = 5000, maxInterval = 60000 } = {}) {
  const visible = useDocumentVisibility()
  let current = interval
  let timer: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  async function tick() {
    if (stopped) return
    if (visible.value === 'visible') {
      try { await fn(); current = interval }                       // 성공: 간격 복구
      catch { current = Math.min(current * 2, maxInterval) }        // 실패: 백오프
    }
    timer = setTimeout(tick, current)
  }
  watch(visible, (v) => { if (v === 'visible') { if (timer) clearTimeout(timer); tick() } })   // 돌아오면 즉시
  onMounted(tick)
  onScopeDispose(() => { stopped = true; if (timer) clearTimeout(timer) })
}

// 사용: 주문 상태
const { data, refresh } = await useFetch('/api/orders/' + id)
usePolling(refresh, { interval: 3000 })
// 끝난 상태면 멈추고 싶을 때: watch(() => data.value?.status, s => { if (s === 'done') stop() })  → stop 을 반환하도록 확장
` },
        },
        {
          id: 'l8', short: `목록 ↔ 상세`,
          title: `상세에 갔다 와도 목록 스크롤과 데이터를 유지한다`,
          why: `목록에서 50번째 항목을 눌렀다 돌아왔는데 맨 위로 가 있으면 사용자가 다시 내려야 합니다. 라우터 scrollBehavior 로 위치를, KeepAlive 또는 useFetch 캐시로 데이터를 유지합니다.`,
          single: { label: `✓ router 설정 + 페이지`, code: String.raw`
// Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved                                   // 뒤로 가기: 저장된 위치
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  }
})

// 목록 데이터 유지 (Vue): 라우트 컴포넌트를 KeepAlive 로
<RouterView v-slot="{ Component }">
  <KeepAlive include="UserList">
    <component :is="Component" />
  </KeepAlive>
</RouterView>
// UserList.vue 에 defineOptions({ name: 'UserList' }); 돌아왔을 때 갱신이 필요하면 onActivated(() => refresh())

// Nuxt: app/router.options.ts 에 scrollBehavior 를 같은 모양으로 둔다.
// 데이터는 useFetch 가 키로 캐시하므로 돌아오면 즉시 보이고, getCachedData 로 재요청을 막을 수 있다
const { data } = await useFetch('/api/users', {
  key: 'users',
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
})
` },
        },
        {
          id: 'l9', short: `CSV 내보내기`,
          title: `현재 목록을 CSV 로 내려받기 (한글 깨짐 방지)`,
          why: `엑셀은 BOM 이 없는 UTF-8 CSV 를 한글이 깨진 채로 엽니다. BOM 을 붙이고, 쉼표와 따옴표가 든 값은 감쌉니다. 큰 데이터는 서버에서 생성해 받습니다.`,
          single: { label: `✓ utils/csv.ts`, code: String.raw`
export function toCsv<T extends object>(rows: T[], columns: { key: keyof T; label: string }[]) {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const head = columns.map(c => esc(c.label)).join(',')
  const body = rows.map(r => columns.map(c => esc(r[c.key])).join(',')).join('\n')
  return '﻿' + head + '\n' + body                    // BOM: 엑셀 한글
}

export function downloadText(text: string, filename: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

// 사용
downloadText(toCsv(items, [{ key: 'name', label: '이름' }, { key: 'email', label: '이메일' }]), 'users-' + today + '.csv')

// 수천 건 이상: 서버가 만든 파일을 받는다 (6회차 07번)
` },
        },
        {
          id: 'l10', short: `가상 스크롤 + 검색`,
          title: `클라이언트에 다 있는 큰 목록: 필터 + 가상 스크롤`,
          why: `수만 건을 한 번에 받아 클라이언트에서 거르는 화면(코드표, 로그)은 DOM 을 다 그리면 멈춥니다. computed 로 거르고 보이는 줄만 그립니다.`,
          single: { label: `✓ components/BigList.vue`, code: String.raw`
<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
const props = defineProps<{ rows: Array<{ id: number; code: string; name: string }> }>()
const q = ref('')
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  return s ? props.rows.filter(r => r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s)) : props.rows
})
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(filtered, { itemHeight: 40, overscan: 10 })
watch(q, () => scrollTo(0))
</script>
<template>
  <input v-model="q" placeholder="코드 또는 이름"> <span>{{ filtered.length.toLocaleString() }}건</span>
  <div v-bind="containerProps" style="height: 480px">
    <div v-bind="wrapperProps">
      <div v-for="{ data, index } in list" :key="data.id" class="row" style="height: 40px">
        <span class="idx">{{ index + 1 }}</span> <b>{{ data.code }}</b> {{ data.name }}
      </div>
    </div>
  </div>
</template>
` },
        },
      ],
    },
    {
      id: 'practice-5', no: 5, name: `UI 상태와 피드백`,
      lead: `토스트, 확인창, 모달, 로딩 바, 빈 상태, 복사, 단축키, 바깥 클릭 같은 앱 전체가 공유하는 UI 장치들입니다.`,
      lessons: [
        {
          id: 'l1', short: `토스트`,
          title: `토스트 매니저: 스토어 + Teleport 컨테이너, 자동 닫힘, 실행 취소`,
          why: `어디서든 toast.success('저장됨') 한 줄로 쓰려면 상태는 스토어에, 렌더링은 앱 루트의 컨테이너 하나에 둡니다. 같은 메시지 연타는 합치고, 삭제 같은 작업에는 "실행 취소" 버튼을 붙입니다.`,
          single: { label: `✓ stores/toast.ts + components/ToastHost.vue`, code: String.raw`
// stores/toast.ts
export interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string; action?: { label: string; onClick: () => void }; timeout: number }
let seq = 0
export const useToastStore = defineStore('toast', () => {
  const items = ref<Toast[]>([])
  function push(type: Toast['type'], message: string, opts: Partial<Pick<Toast, 'action' | 'timeout'>> = {}) {
    const dup = items.value.find(t => t.message === message && t.type === type)
    if (dup) return dup.id                                        // 같은 토스트 연타 방지
    const t: Toast = { id: ++seq, type, message, timeout: type === 'error' ? 6000 : 3000, ...opts }
    items.value.push(t)
    if (t.timeout > 0) setTimeout(() => dismiss(t.id), t.timeout)
    return t.id
  }
  const dismiss = (id: number) => { items.value = items.value.filter(t => t.id !== id) }
  return { items, push, dismiss }
})
// 어디서든 쓰는 얇은 API (컴포넌트 밖에서도)
export const toast = {
  success: (m: string, o?: any) => useToastStore().push('success', m, o),
  error:   (m: string, o?: any) => useToastStore().push('error', m, o),
  info:    (m: string, o?: any) => useToastStore().push('info', m, o)
}

<!-- components/ToastHost.vue (app.vue 에 한 번) -->
<Teleport to="body">
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in store.items" :key="t.id" class="toast" :class="t.type" role="status">
        {{ t.message }}
        <button v-if="t.action" @click="t.action.onClick(); store.dismiss(t.id)">{{ t.action.label }}</button>
        <button @click="store.dismiss(t.id)" aria-label="닫기">×</button>
      </div>
    </TransitionGroup>
  </div>
</Teleport>

// 실행 취소가 있는 삭제
toast.info('삭제했습니다', { timeout: 5000, action: { label: '실행 취소', onClick: () => restore(item) } })
` },
        },
        {
          id: 'l2', short: `confirm`,
          title: `확인 다이얼로그를 Promise 로: await confirm('삭제할까요?')`,
          why: `window.confirm 은 스타일을 못 바꾸고 모바일에서 어색합니다. 스토어에 요청을 넣고 루트의 다이얼로그가 보여 준 뒤 resolve 하면 쓰는 쪽은 await 한 줄입니다.`,
          single: { label: `✓ composables/useConfirm.ts + components/ConfirmHost.vue`, code: String.raw`
// composables/useConfirm.ts
interface Req { title: string; message?: string; okText?: string; danger?: boolean; resolve: (ok: boolean) => void }
const current = ref<Req | null>(null)

export function confirm(title: string, opts: Omit<Req, 'title' | 'resolve'> = {}) {
  return new Promise<boolean>((resolve) => { current.value = { title, ...opts, resolve } })
}
export function useConfirmHost() {
  const answer = (ok: boolean) => { current.value?.resolve(ok); current.value = null }
  return { current, answer }
}

<!-- components/ConfirmHost.vue (app.vue 에 한 번) -->
<script setup lang="ts">
const { current, answer } = useConfirmHost()
const okBtn = ref<HTMLButtonElement | null>(null)
watch(current, (c) => { if (c) nextTick(() => okBtn.value?.focus()) })
onKeyStroke('Escape', () => current.value && answer(false))
</script>
<template>
  <Teleport to="body">
    <div v-if="current" class="overlay" @click.self="answer(false)">
      <div class="dialog" role="alertdialog" aria-modal="true" :aria-labelledby="'cf-title'">
        <h2 id="cf-title">{{ current.title }}</h2>
        <p v-if="current.message">{{ current.message }}</p>
        <button @click="answer(false)">취소</button>
        <button ref="okBtn" :class="{ danger: current.danger }" @click="answer(true)">{{ current.okText ?? '확인' }}</button>
      </div>
    </div>
  </Teleport>
</template>

// 사용
async function remove(id: number) {
  if (!await confirm('이 항목을 삭제할까요?', { message: '되돌릴 수 없습니다', okText: '삭제', danger: true })) return
  await userApi.remove(id)
}
` },
        },
        {
          id: 'l3', short: `모달 매니저`,
          title: `모달 스택: 여러 겹, Esc 는 맨 위만, 포커스 복귀, 라우트 이동 시 닫기`,
          why: `모달 위에 모달이 뜨는 화면에서 Esc 가 전부를 닫거나, 닫은 뒤 포커스가 사라지거나, 뒤로 가기에 모달이 남는 문제가 흔합니다. 스택 하나가 그 규칙을 관리합니다.`,
          single: { label: `✓ composables/useModalStack.ts + components/BaseModal.vue`, code: String.raw`
// composables/useModalStack.ts
const stack = ref<string[]>([])
export function useModalStack() {
  const router = useRouter()
  router.afterEach(() => { stack.value = [] })                       // 페이지 이동 시 모두 닫힘(각 모달이 watch 로 반응)
  return { stack }
}

<!-- components/BaseModal.vue -->
<script setup lang="ts">
const open = defineModel<boolean>({ required: true })
const props = defineProps<{ title: string }>()
const id = useId()
const { stack } = useModalStack()
const panel = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

const isTop = computed(() => stack.value.at(-1) === id)
watch(open, async (v) => {
  if (v) {
    returnFocus = document.activeElement as HTMLElement
    stack.value.push(id)
    await nextTick(); panel.value?.focus()
    document.body.style.overflow = 'hidden'
  } else {
    stack.value = stack.value.filter(x => x !== id)
    if (!stack.value.length) document.body.style.overflow = ''
    returnFocus?.focus()
  }
}, { immediate: true })
watch(stack, (s) => { if (open.value && !s.includes(id)) open.value = false })   // 라우트 이동으로 비워지면 닫는다
onKeyStroke('Escape', () => { if (open.value && isTop.value) open.value = false })
const { activate, deactivate } = useFocusTrap(panel)                              // @vueuse/integrations
watch(open, v => v ? nextTick(activate) : deactivate())
onUnmounted(() => { stack.value = stack.value.filter(x => x !== id) })
</script>
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="overlay" :style="{ zIndex: 1000 + stack.indexOf(id) }" @click.self="open = false">
        <div ref="panel" class="modal" role="dialog" aria-modal="true" :aria-labelledby="id + '-t'" tabindex="-1">
          <h2 :id="id + '-t'">{{ title }}</h2>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
` },
        },
        {
          id: 'l4', short: `로딩 바`,
          title: `상단 로딩 바: 라우트 이동 + API 요청을 함께 반영`,
          why: `페이지 이동과 API 호출 중 어느 쪽이든 진행 중이면 바가 보여야 합니다. 둘을 합친 하나의 상태를 보고, 짧은 요청에는 깜빡이지 않게 지연을 둡니다.`,
          single: { label: `✓ components/TopBar.vue`, code: String.raw`
<script setup lang="ts">
const loading = useLoadingStore()                 // 2회차 06번의 요청 카운트
const routing = ref(false)
const router = useRouter()
router.beforeEach(() => { routing.value = true })
router.afterEach(() => { routing.value = false })
router.onError(() => { routing.value = false })

const active = computed(() => loading.active || routing.value)
const shown = ref(false)
let t: ReturnType<typeof setTimeout>
watch(active, (v) => {
  clearTimeout(t)
  if (v) t = setTimeout(() => { shown.value = true }, 150)    // 150ms 안에 끝나면 안 보여 준다
  else shown.value = false
})
</script>
<template>
  <div class="top-bar" :class="{ on: shown }" aria-hidden="true" />
</template>
<style scoped>
.top-bar { position: fixed; top: 0; left: 0; height: 3px; width: 0; background: var(--accent); z-index: 9999; opacity: 0; transition: width .4s, opacity .2s; }
.top-bar.on { width: 90%; opacity: 1; transition: width 8s cubic-bezier(.1,.7,.1,1), opacity .2s; }
</style>
<!-- Nuxt 라면 <NuxtLoadingIndicator /> 가 라우트 쪽을, 위 코드의 loading.active 를 그 color/duration 과 섞어도 된다 -->
` },
        },
        {
          id: 'l5', short: `AsyncState`,
          title: `로딩·오류·빈 상태를 한 컴포넌트가 처리한다`,
          why: `목록마다 v-if 세 개를 쓰면 빈 상태 문구가 제각각이고 재시도 버튼을 빠뜨립니다. 상태와 데이터를 받아 네 경우를 그려 주는 래퍼 하나로 통일합니다.`,
          single: { label: `✓ components/AsyncState.vue`, code: String.raw`
<script setup lang="ts" generic="T">
defineProps<{
  status: 'idle' | 'pending' | 'success' | 'error'
  data: T | undefined | null
  error?: { message: string } | null
  empty?: (d: T) => boolean
  retry?: () => void
}>()
</script>
<template>
  <slot v-if="status === 'pending' && data == null" name="loading"><SkeletonList /></slot>
  <div v-else-if="status === 'error'" class="state error" role="alert">
    <p>{{ error?.message ?? '불러오지 못했습니다' }}</p>
    <button v-if="retry" @click="retry">다시 시도</button>
  </div>
  <slot v-else-if="data != null && (empty ? empty(data) : Array.isArray(data) && data.length === 0)" name="empty">
    <div class="state empty">표시할 내용이 없습니다</div>
  </slot>
  <slot v-else-if="data != null" :data="data" />
</template>

<!-- 사용 -->
<AsyncState :status="status" :data="data" :error="error" :retry="refresh">
  <template #default="{ data: users }">
    <UserTable :items="users" />
  </template>
  <template #empty>아직 사용자가 없습니다 <NuxtLink to="/users/new">추가하기</NuxtLink></template>
</AsyncState>
` },
        },
        {
          id: 'l6', short: `클릭 디렉티브`,
          title: `v-debounce-click 과 v-loading: 연타 방지와 버튼 로딩`,
          why: `모든 버튼에 disabled 와 로딩 상태를 손으로 넣기는 번거롭습니다. 디렉티브가 클릭 핸들러의 Promise 를 보고 끝날 때까지 잠급니다.`,
          single: { label: `✓ directives/asyncClick.ts`, code: String.raw`
import type { Directive } from 'vue'

// <button v-async-click="save">저장</button>  : save 가 Promise 를 돌려주면 끝날 때까지 disabled + .loading
export const vAsyncClick: Directive<HTMLButtonElement, (e: MouseEvent) => unknown> = {
  mounted(el, binding) {
    let busy = false
    el.addEventListener('click', async (e) => {
      if (busy) return
      const r = binding.value(e)
      if (!(r instanceof Promise)) return
      busy = true; el.disabled = true; el.classList.add('loading'); el.setAttribute('aria-busy', 'true')
      try { await r }
      finally { busy = false; el.disabled = false; el.classList.remove('loading'); el.removeAttribute('aria-busy') }
    })
  }
}

// 등록: app.directive('async-click', vAsyncClick)   (Nuxt: plugins/directives.ts 에서 nuxtApp.vueApp.directive)
// CSS: button.loading::after { content: ''; ... 스피너 }  또는 button.loading { opacity: .6; cursor: progress }
` },
        },
        {
          id: 'l7', short: `복사`,
          title: `클립보드 복사 + 2초 피드백`,
          why: `복사 버튼은 눌렀는지 알 수 없으면 사용자가 여러 번 누릅니다. 성공 시 아이콘과 문구를 잠깐 바꾸고, 권한이 없는 환경은 선택 가능한 입력으로 대체합니다.`,
          single: { label: `✓ components/CopyButton.vue`, code: String.raw`
<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
const props = defineProps<{ text: string; label?: string }>()
const { copy, copied, isSupported } = useClipboard({ copiedDuring: 2000 })
</script>
<template>
  <button v-if="isSupported" type="button" @click="copy(text)" :aria-label="(copied ? '복사됨: ' : '복사: ') + (label ?? text)">
    <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" />
    {{ copied ? '복사됨' : (label ?? '복사') }}
  </button>
  <input v-else :value="text" readonly @focus="($event.target as HTMLInputElement).select()">
</template>

<!-- <CopyButton :text="order.number" label="주문번호 복사" /> -->
` },
        },
        {
          id: 'l8', short: `단축키`,
          title: `전역 단축키: 입력 중에는 무시, 도움말 표시`,
          why: `단축키가 입력창 안에서도 동작하면 글을 쓰다 화면이 바뀝니다. 입력 요소에 포커스가 있을 때는 건너뛰고, ? 로 목록을 보여 줍니다.`,
          single: { label: `✓ composables/useShortcuts.ts`, code: String.raw`
import { useMagicKeys, useActiveElement, whenever } from '@vueuse/core'

export function useShortcuts(map: Record<string, { run: () => void; desc: string }>) {
  const keys = useMagicKeys()
  const active = useActiveElement()
  const typing = computed(() => {
    const el = active.value
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
  })
  for (const [combo, { run }] of Object.entries(map)) {
    whenever(keys[combo], () => { if (!typing.value) run() })
  }
  return { list: Object.entries(map).map(([k, v]) => ({ key: k, desc: v.desc })) }
}

// app.vue
const router = useRouter()
const { list } = useShortcuts({
  'g+h':       { run: () => router.push('/'),        desc: '홈으로' },
  'g+o':       { run: () => router.push('/orders'),  desc: '주문 목록' },
  'ctrl+k':    { run: () => openSearch(),            desc: '검색' },
  'shift+/':   { run: () => showHelp.value = true,   desc: '단축키 도움말' }
})
` },
        },
        {
          id: 'l9', short: `드롭다운`,
          title: `드롭다운/팝오버: 바깥 클릭 닫기, 위치 자동 조정, 키보드`,
          why: `절대 위치로 둔 메뉴는 화면 끝에서 잘리고, 바깥을 눌러도 안 닫히며, 키보드로 못 다룹니다. floating-ui 로 위치를, onClickOutside 와 Esc 로 닫기를 처리합니다.`,
          single: { label: `✓ components/Dropdown.vue`, code: String.raw`
<script setup lang="ts">
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

const open = ref(false)
const trigger = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const { floatingStyles } = useFloating(trigger, menu, {
  placement: 'bottom-start', middleware: [offset(6), flip(), shift({ padding: 8 })], whileElementsMounted: autoUpdate
})
onClickOutside(menu, () => { open.value = false }, { ignore: [trigger] })
onKeyStroke('Escape', () => { if (open.value) { open.value = false; trigger.value?.focus() } })
const id = useId()
</script>
<template>
  <button ref="trigger" type="button" :aria-expanded="open" :aria-controls="id" aria-haspopup="menu" @click="open = !open">
    <slot name="trigger" />
  </button>
  <Teleport to="body">
    <div v-if="open" ref="menu" :id="id" role="menu" class="menu" :style="floatingStyles">
      <slot :close="() => open = false" />
    </div>
  </Teleport>
</template>

<!-- 사용 -->
<Dropdown>
  <template #trigger>더보기 ▾</template>
  <template #default="{ close }">
    <button role="menuitem" @click="edit(); close()">수정</button>
    <button role="menuitem" @click="remove(); close()">삭제</button>
  </template>
</Dropdown>
` },
          note: `메뉴 항목 사이 방향키 이동까지 필요하면 Reka UI 의 DropdownMenu 를 쓰는 편이 빠릅니다 (파인코드 17회차 06번).`,
        },
        {
          id: 'l10', short: `반응형`,
          title: `브레이크포인트 기반 레이아웃 전환과 모바일 내비`,
          why: `CSS 미디어 쿼리로 숨기기만 하면 모바일에도 데스크톱 메뉴 DOM 이 남아 있습니다. JS 로 브레이크포인트를 읽어 다른 컴포넌트를 그리되, SSR 첫 화면은 CSS 로 맞춥니다.`,
          single: { label: `✓ composables/useLayout.ts + layouts/default.vue`, code: String.raw`
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

export function useLayout() {
  const bp = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })   // SSR 에서는 데스크톱으로 가정
  const isMobile = bp.smaller('md')
  const sidebarOpen = ref(false)
  watch(isMobile, (m) => { if (!m) sidebarOpen.value = false })           // 데스크톱으로 넓어지면 드로어 닫기
  const route = useRoute()
  watch(() => route.fullPath, () => { sidebarOpen.value = false })        // 페이지 이동 시 닫기
  return { isMobile, sidebarOpen }
}

<!-- layouts/default.vue -->
<script setup lang="ts">
const { isMobile, sidebarOpen } = useLayout()
</script>
<template>
  <header>
    <button v-if="isMobile" @click="sidebarOpen = true" aria-label="메뉴 열기">☰</button>
    <NavLinks v-else />
  </header>
  <BaseModal v-if="isMobile" v-model="sidebarOpen" title="메뉴"><NavLinks vertical /></BaseModal>
  <main><slot /></main>
</template>
` },
        },
      ],
    },
    {
      id: 'practice-6', no: 6, name: `파일과 미디어`,
      lead: `드래그 앤 드롭, 미리보기, 리사이즈, 진행률, 다중 업로드 큐, 서버 저장, S3 직접 업로드, 다운로드, 엑셀 가져오기까지입니다.`,
      lessons: [
        {
          id: 'l1', short: `드롭존`,
          title: `드래그 앤 드롭 + 클릭 선택 업로드 영역`,
          why: `드롭 영역은 dragover 기본 동작을 막아야 하고, 키보드 사용자를 위해 숨은 input 과 버튼이 함께 있어야 합니다. 종류와 크기 검증을 통과한 파일만 올립니다.`,
          single: { label: `✓ components/DropZone.vue`, code: String.raw`
<script setup lang="ts">
import { useDropZone } from '@vueuse/core'
const props = withDefaults(defineProps<{ accept?: string[]; maxMb?: number; multiple?: boolean }>(), { accept: () => ['image/*'], maxMb: 10, multiple: true })
const emit = defineEmits<{ files: [files: File[]]; reject: [reason: string] }>()
const zone = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

function accept(files: File[] | null) {
  if (!files) return
  const ok: File[] = []
  for (const f of files) {
    const typeOk = props.accept.some(a => a.endsWith('/*') ? f.type.startsWith(a.slice(0, -1)) : f.type === a)
    if (!typeOk) { emit('reject', f.name + ': 허용되지 않는 형식'); continue }
    if (f.size > props.maxMb * 1024 * 1024) { emit('reject', f.name + ': ' + props.maxMb + 'MB 초과'); continue }
    ok.push(f)
  }
  if (ok.length) emit('files', props.multiple ? ok : ok.slice(0, 1))
}
const { isOverDropZone } = useDropZone(zone, { onDrop: accept, dataTypes: (t) => t.some(x => props.accept.some(a => a.endsWith('/*') ? x.startsWith(a.slice(0, -1)) : x === a)) })
function onPick(e: Event) { accept(Array.from((e.target as HTMLInputElement).files ?? [])); (e.target as HTMLInputElement).value = '' }
</script>
<template>
  <div ref="zone" class="dropzone" :class="{ over: isOverDropZone }" @click="input?.click()" @keydown.enter.space.prevent="input?.click()" tabindex="0" role="button" aria-label="파일 선택 또는 끌어다 놓기">
    <input ref="input" type="file" :accept="accept.join(',')" :multiple="multiple" hidden @change="onPick">
    <slot>여기에 파일을 끌어다 놓거나 클릭해서 선택</slot>
  </div>
</template>
` },
        },
        {
          id: 'l2', short: `미리보기, 리사이즈`,
          title: `이미지 미리보기와 클라이언트 리사이즈`,
          why: `휴대폰 사진은 5~10MB 라 그대로 올리면 느리고 서버 비용이 듭니다. canvas 로 긴 변 1600px 정도로 줄여 올리면 품질 손실 없이 10분의 1이 됩니다.`,
          single: { label: `✓ utils/image.ts`, code: String.raw`
export function previewUrl(file: File) {
  const url = URL.createObjectURL(file)
  onScopeDispose(() => URL.revokeObjectURL(url))          // 컴포저블/컴포넌트 안에서 호출할 때 자동 해제
  return url
}

export async function resizeImage(file: File, { maxSide = 1600, quality = 0.85, type = 'image/jpeg' } = {}): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })   // EXIF 회전 반영
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  if (scale === 1 && file.size < 1_000_000) return file                           // 이미 작으면 그대로
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('encode')), type, quality))
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type })
}

// 사용
const files = ref<{ file: File; url: string }[]>([])
async function onFiles(list: File[]) {
  for (const f of list) { const small = await resizeImage(f); files.value.push({ file: small, url: URL.createObjectURL(small) }) }
}
<img v-for="f in files" :key="f.url" :src="f.url" alt="">
` },
        },
        {
          id: 'l3', short: `큐 업로드`,
          title: `다중 파일 업로드 큐: 동시 3개, 개별 진행률, 재시도`,
          why: `20개를 한꺼번에 보내면 브라우저 연결 제한에 걸리고 하나 실패하면 전부 꼬입니다. 큐에서 3개씩 꺼내 보내고 항목마다 상태와 재시도를 둡니다.`,
          single: { label: `✓ composables/useUploadQueue.ts`, code: String.raw`
export interface UploadItem { id: number; file: File; progress: number; status: 'queued' | 'uploading' | 'done' | 'error'; result?: { url: string }; error?: string; ctrl?: AbortController }
let seq = 0

export function useUploadQueue(upload: (file: File, onProgress: (p: number) => void, signal: AbortSignal) => Promise<{ url: string }>, concurrency = 3) {
  const items = ref<UploadItem[]>([])
  let running = 0

  function add(files: File[]) {
    files.forEach(f => items.value.push({ id: ++seq, file: f, progress: 0, status: 'queued' }))
    pump()
  }
  async function pump() {
    while (running < concurrency) {
      const next = items.value.find(i => i.status === 'queued')
      if (!next) return
      running++
      run(next).finally(() => { running--; pump() })
    }
  }
  async function run(item: UploadItem) {
    item.status = 'uploading'; item.ctrl = new AbortController()
    try {
      item.result = await upload(item.file, p => { item.progress = p }, item.ctrl.signal)
      item.status = 'done'; item.progress = 100
    } catch (e) {
      item.status = 'error'; item.error = (e as Error).message
    }
  }
  const retry = (id: number) => { const it = items.value.find(i => i.id === id); if (it && it.status === 'error') { it.status = 'queued'; it.error = undefined; pump() } }
  const cancel = (id: number) => { const it = items.value.find(i => i.id === id); it?.ctrl?.abort(); if (it) items.value = items.value.filter(i => i.id !== id) }
  const allDone = computed(() => items.value.length > 0 && items.value.every(i => i.status === 'done'))
  return { items, add, retry, cancel, allDone }
}

// 사용 (2회차 07번의 업로드 함수를 넘긴다)
const { items, add, retry, cancel } = useUploadQueue((file, onProgress, signal) =>
  api.post('/files', toFormData(file), { signal, onUploadProgress: e => onProgress(Math.round(e.loaded / (e.total ?? 1) * 100)) }).then(r => r.data))
` },
        },
        {
          id: 'l4', short: `서버 저장`,
          title: `Nuxt 서버에서 multipart 받기, 검증, 저장`,
          why: `파일 이름과 MIME 타입은 클라이언트가 보낸 값이라 믿을 수 없습니다. 매직 바이트로 종류를 확인하고, 이름은 서버가 새로 만들며, 크기 제한을 둡니다.`,
          single: { label: `✓ server/api/files.post.ts`, code: String.raw`
import { randomUUID } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileTypeFromBuffer } from 'file-type'

const MAX = 10 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const parts = await readMultipartFormData(event)
  const part = parts?.find(p => p.name === 'file')
  if (!part?.data) throw createError({ statusCode: 400, statusMessage: '파일이 없습니다' })
  if (part.data.length > MAX) throw createError({ statusCode: 413, statusMessage: '10MB 이하만 가능합니다' })

  const detected = await fileTypeFromBuffer(part.data)              // 확장자가 아니라 내용으로 판단
  if (!detected || !ALLOWED.has(detected.mime)) throw createError({ statusCode: 415, statusMessage: '허용되지 않는 형식' })

  const id = randomUUID()
  const dir = process.env.UPLOAD_DIR ?? './uploads'
  await mkdir(dir, { recursive: true })
  await writeFile(dir + '/' + id + '.' + detected.ext, part.data)   // 서버가 정한 이름으로

  const row = await db.file.create({ data: { id, ownerId: user.id, mime: detected.mime, size: part.data.length, original: part.filename ?? '' } })
  return { id: row.id, url: '/api/files/' + row.id }
})
// 운영에서는 로컬 디스크 대신 S3/R2 에 쓴다 (06번). 서빙은 server/api/files/[id].get.ts 에서 소유권 확인 뒤 sendStream
` },
        },
        {
          id: 'l5', short: `presigned URL`,
          title: `S3 presigned URL 로 브라우저에서 직접 업로드`,
          why: `큰 파일이 앱 서버를 거치면 서버 메모리와 대역폭을 먹습니다. 서버는 서명된 URL 만 발급하고 브라우저가 S3 에 바로 PUT 한 뒤, 완료를 서버에 알립니다.`,
          single: { label: `✓ server/api/uploads/sign.post.ts + 클라이언트`, code: String.raw`
// server/api/uploads/sign.post.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { name, type, size } = await readValidatedBody(event, z.object({ name: z.string(), type: z.string(), size: z.number().max(100e6) }).parse)
  const key = 'u/' + user.id + '/' + crypto.randomUUID() + '-' + name.replace(/[^\w.-]/g, '_')
  const s3 = new S3Client({ region: process.env.AWS_REGION })
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: type }), { expiresIn: 300 })
  return { url, key }
})

// 클라이언트
async function uploadDirect(file: File, onProgress: (p: number) => void, signal: AbortSignal) {
  const { url, key } = await $fetch('/api/uploads/sign', { method: 'POST', body: { name: file.name, type: file.type, size: file.size } })
  await axios.put(url, file, { headers: { 'Content-Type': file.type }, signal, onUploadProgress: e => onProgress(Math.round(e.loaded / (e.total ?? 1) * 100)) })
  return await $fetch('/api/uploads/complete', { method: 'POST', body: { key, name: file.name, size: file.size } })   // DB 기록은 서버가
}
// 버킷 CORS 에 PUT 과 앱 origin 을 허용해야 한다
` },
        },
        {
          id: 'l6', short: `다운로드`,
          title: `인증이 필요한 파일 다운로드와 파일명`,
          why: `a href 로 바로 걸면 Authorization 헤더가 안 붙습니다. blob 으로 받아 링크를 만들거나, 서버가 짧게 유효한 다운로드 URL 을 발급합니다. 파일명은 Content-Disposition 에서 꺼냅니다.`,
          single: { label: `✓ utils/download.ts`, code: String.raw`
export async function downloadFile(url: string, fallbackName = 'download') {
  const res = await api.get(url, { responseType: 'blob' })
  const cd = res.headers['content-disposition'] ?? ''
  const m = /filename\*=UTF-8''([^;]+)/.exec(cd) || /filename="?([^";]+)"?/.exec(cd)
  const name = m ? decodeURIComponent(m[1]) : fallbackName
  const href = URL.createObjectURL(res.data)
  const a = Object.assign(document.createElement('a'), { href, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

// 서버 (Nuxt): 한글 파일명은 RFC 5987 형식으로
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const file = await db.file.findOrThrow(getRouterParam(event, 'id'), user.id)
  setHeader(event, 'Content-Type', file.mime)
  setHeader(event, 'Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(file.original))
  return sendStream(event, createReadStream(file.path))
})

// 큰 파일: 서버가 presigned GET URL 을 주고 <a :href="url" download> 로 (쿠키/헤더 불필요)
` },
        },
        {
          id: 'l7', short: `지연 로딩`,
          title: `이미지 지연 로딩과 흐린 플레이스홀더`,
          why: `목록의 이미지 100장을 한 번에 받으면 첫 화면이 늦습니다. loading=lazy 와 고정 비율로 레이아웃 흔들림을 막고, 작은 썸네일을 흐리게 깔아 두면 로딩이 자연스럽습니다.`,
          single: { label: `✓ components/LazyImg.vue`, code: String.raw`
<script setup lang="ts">
const props = defineProps<{ src: string; alt: string; width: number; height: number; placeholder?: string }>()
const loaded = ref(false)
const failed = ref(false)
</script>
<template>
  <div class="img" :style="{ aspectRatio: width + ' / ' + height, backgroundImage: placeholder ? 'url(' + placeholder + ')' : undefined }">
    <img v-if="!failed" :src="src" :alt="alt" :width="width" :height="height" loading="lazy" decoding="async"
         :class="{ in: loaded }" @load="loaded = true" @error="failed = true">
    <div v-else class="fallback" role="img" :aria-label="alt">이미지를 불러올 수 없습니다</div>
  </div>
</template>
<style scoped>
.img { position: relative; overflow: hidden; background-size: cover; filter: none; }
.img img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .3s; }
.img img.in { opacity: 1; }
</style>

<!-- Nuxt 라면 <NuxtImg :src :width :height placeholder loading="lazy" sizes="100vw md:50vw" /> 가 이 일을 다 한다 -->
` },
        },
        {
          id: 'l8', short: `PDF 와 인쇄`,
          title: `PDF 미리보기와 화면 인쇄`,
          why: `PDF 는 브라우저 내장 뷰어로 iframe 에 띄우면 됩니다. 영수증처럼 화면을 인쇄할 때는 인쇄용 CSS 로 메뉴를 숨기고 페이지 나눔을 정합니다.`,
          single: { label: `✓ components/PdfViewer.vue + 인쇄 CSS`, code: String.raw`
<script setup lang="ts">
const props = defineProps<{ src: string }>()          // 인증이 필요하면 blob URL 을 넘긴다 (06번 방식으로 받아서)
const blobUrl = ref('')
onMounted(async () => {
  const res = await api.get(props.src, { responseType: 'blob' })
  blobUrl.value = URL.createObjectURL(res.data)
})
onUnmounted(() => URL.revokeObjectURL(blobUrl.value))
</script>
<template>
  <iframe v-if="blobUrl" :src="blobUrl + '#toolbar=1&view=FitH'" class="pdf" title="문서 미리보기" />
  <p v-else>불러오는 중…</p>
</template>

<!-- 인쇄 -->
<button @click="window.print()">인쇄</button>
<style>
@media print {
  header, nav, .no-print, .toasts { display: none !important; }
  main { margin: 0; padding: 0; }
  .page-break { break-before: page; }
  a[href]::after { content: ''; }            /* 링크 주소 출력 방지 */
  @page { size: A4; margin: 15mm; }
}
</style>
` },
        },
        {
          id: 'l9', short: `엑셀 가져오기`,
          title: `엑셀/CSV 가져오기: 파싱, 행별 검증, 오류 표`,
          why: `대량 등록은 엑셀로 받는 경우가 많습니다. 브라우저에서 파싱해 행마다 검증 결과를 보여 주고, 문제없는 행만 서버로 보냅니다.`,
          single: { label: `✓ composables/useSheetImport.ts`, code: String.raw`
import * as XLSX from 'xlsx'
import { z } from 'zod'

const Row = z.object({
  이름: z.string().min(1), 이메일: z.string().email(), 전화: z.string().regex(/^\d{10,11}$/, '숫자만 10~11자리')
})
type Row = z.infer<typeof Row>

export function useSheetImport() {
  const rows = ref<{ no: number; data: Partial<Row>; errors: string[] }[]>([])

  async function parse(file: File) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    rows.value = raw.map((r, i) => {
      const norm = { ...r, 전화: String(r['전화'] ?? '').replace(/\D/g, '') }   // 숫자 셀의 0 탈락 대비
      const parsed = Row.safeParse(norm)
      return { no: i + 2, data: norm as Partial<Row>, errors: parsed.success ? [] : parsed.error.issues.map(x => x.path.join('.') + ': ' + x.message) }
    })
  }
  const valid = computed(() => rows.value.filter(r => !r.errors.length).map(r => r.data as Row))
  const invalidCount = computed(() => rows.value.length - valid.value.length)
  async function submit() { await userApi.bulkCreate(valid.value) }
  return { rows, valid, invalidCount, parse, submit }
}

<!-- 템플릿: 오류 행은 빨갛게, 상단에 "N건 중 M건 오류" -->
<tr v-for="r in rows" :key="r.no" :class="{ bad: r.errors.length }"><td>{{ r.no }}</td><td>{{ r.data.이름 }}</td><td class="err">{{ r.errors.join(', ') }}</td></tr>
` },
          note: `양식 파일을 먼저 내려받게 하면(헤더만 있는 xlsx) 열 이름 불일치가 줄어듭니다. 서버에서도 같은 스키마로 다시 검증합니다.`,
        },
        {
          id: 'l10', short: `아바타 자르기`,
          title: `프로필 사진 자르기(crop) 후 업로드`,
          why: `정사각형 아바타는 사용자가 영역을 고르게 해야 합니다. 라이브러리로 자른 결과를 canvas blob 으로 받아 리사이즈·업로드 흐름에 그대로 넣습니다.`,
          single: { label: `✓ components/AvatarCropper.vue`, code: String.raw`
<script setup lang="ts">
import { Cropper, type CropperResult } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
const props = defineProps<{ file: File }>()
const emit = defineEmits<{ done: [file: File]; cancel: [] }>()
const src = URL.createObjectURL(props.file)
onUnmounted(() => URL.revokeObjectURL(src))
const cropper = ref<InstanceType<typeof Cropper> | null>(null)

async function confirm() {
  const { canvas } = cropper.value!.getResult() as CropperResult
  if (!canvas) return
  const out = document.createElement('canvas'); out.width = out.height = 512
  out.getContext('2d')!.drawImage(canvas, 0, 0, 512, 512)
  const blob = await new Promise<Blob>(r => out.toBlob(b => r(b!), 'image/jpeg', 0.9))
  emit('done', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
}
</script>
<template>
  <Cropper ref="cropper" :src="src" :stencil-props="{ aspectRatio: 1 }" stencil-component="circle-stencil" class="crop" />
  <button @click="$emit('cancel')">취소</button> <button @click="confirm">적용</button>
</template>
` },
        },
      ],
    },
    {
      id: 'practice-7', no: 7, name: `실시간과 시간`,
      lead: `WebSocket 재연결, SSE 알림, 서버 시간 기준 카운트다운, 채팅 스크롤, 읽음 처리, 상대 시간, 오프라인 큐, 동시 편집 충돌까지입니다.`,
      lessons: [
        {
          id: 'l1', short: `WebSocket`,
          title: `끊기면 다시 붙는 WebSocket 클라이언트 + 하트비트`,
          why: `모바일에서 네트워크가 바뀌면 소켓이 조용히 죽습니다. 자동 재연결, 하트비트로 죽은 연결 감지, 재연결 뒤 재구독까지 한 컴포저블이 맡습니다.`,
          single: { label: `✓ composables/useLiveSocket.ts`, code: String.raw`
import { useWebSocket } from '@vueuse/core'

type Msg = { type: string; payload: unknown }

export function useLiveSocket(url: MaybeRefOrGetter<string>) {
  const handlers = new Map<string, Set<(p: any) => void>>()
  const subscriptions = new Set<string>()

  const { status, send, open, close } = useWebSocket(url, {
    autoReconnect: { retries: Infinity, delay: 2000 },
    heartbeat: { message: JSON.stringify({ type: 'ping' }), interval: 25_000, pongTimeout: 10_000 },
    onConnected() {
      subscriptions.forEach(ch => send(JSON.stringify({ type: 'subscribe', payload: ch })))   // 재연결 시 재구독
    },
    onMessage(_, e) {
      const msg: Msg = JSON.parse(e.data)
      if (msg.type === 'pong') return
      handlers.get(msg.type)?.forEach(h => h(msg.payload))
    }
  })

  function on<T>(type: string, h: (p: T) => void) {
    if (!handlers.has(type)) handlers.set(type, new Set())
    handlers.get(type)!.add(h)
    onScopeDispose(() => handlers.get(type)?.delete(h))
  }
  function subscribe(channel: string) {
    subscriptions.add(channel)
    if (status.value === 'OPEN') send(JSON.stringify({ type: 'subscribe', payload: channel }))
    onScopeDispose(() => { subscriptions.delete(channel); send(JSON.stringify({ type: 'unsubscribe', payload: channel })) })
  }
  return { status, on, subscribe, send: (m: Msg) => send(JSON.stringify(m)), open, close }
}

// 사용 (앱에 하나만 두려면 플러그인/스토어에서 만들어 provide)
const ws = useLiveSocket(() => (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws?token=' + auth.accessToken)
ws.subscribe('orders:' + orderId)
ws.on<Order>('order.updated', (o) => { order.value = o })
<span class="dot" :class="ws.status.value">{{ ws.status.value === 'OPEN' ? '실시간' : '재연결 중…' }}</span>
` },
        },
        {
          id: 'l2', short: `SSE`,
          title: `서버 → 클라이언트 단방향 알림은 SSE`,
          why: `알림, 진행률처럼 서버가 보내기만 하면 WebSocket 보다 SSE 가 단순하고 프록시 호환이 좋습니다. 브라우저가 재연결과 Last-Event-ID 를 알아서 처리합니다.`,
          single: { label: `✓ server/api/events.get.ts + composables/useNotifications.ts`, code: String.raw`
// server/api/events.get.ts (Nuxt/h3)
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const stream = createEventStream(event)
  const unsubscribe = notifications.subscribe(user.id, (n) => {
    stream.push({ id: String(n.id), event: 'notification', data: JSON.stringify(n) })
  })
  const keep = setInterval(() => stream.push({ event: 'ping', data: '' }), 30_000)   // 프록시 타임아웃 방지
  stream.onClosed(() => { clearInterval(keep); unsubscribe() })
  return stream.send()
})

// composables/useNotifications.ts
import { useEventSource } from '@vueuse/core'
export function useNotifications() {
  const list = ref<Notification[]>([])
  const unread = computed(() => list.value.filter(n => !n.read).length)
  const { event, data, status } = useEventSource('/api/events', ['notification'], { autoReconnect: true, withCredentials: true })
  watch(data, (d) => { if (event.value === 'notification' && d) list.value.unshift(JSON.parse(d)) })
  return { list, unread, status }
}
` },
        },
        {
          id: 'l3', short: `카운트다운`,
          title: `서버 시간 기준 카운트다운 (클라이언트 시계 오차 보정)`,
          why: `사용자 PC 시계는 몇 분씩 틀릴 수 있습니다. 서버가 보낸 서버 시각과 받은 시각의 차이(offset)를 기억해 두고 그것으로 남은 시간을 계산합니다.`,
          single: { label: `✓ composables/useCountdown.ts`, code: String.raw`
// 서버 응답에 serverTime(ISO) 을 함께 보낸다. 또는 /api/time 한 번 호출
let offset = 0                                   // 서버 - 클라이언트 (ms)
export function syncClock(serverTimeIso: string) { offset = new Date(serverTimeIso).getTime() - Date.now() }
export const serverNow = () => Date.now() + offset

export function useCountdown(deadlineIso: MaybeRefOrGetter<string>) {
  const left = ref(0)
  const tick = () => { left.value = Math.max(0, new Date(toValue(deadlineIso)).getTime() - serverNow()) }
  tick()
  const { pause } = useIntervalFn(tick, 1000)
  watch(left, v => { if (v === 0) pause() })
  const expired = computed(() => left.value === 0)
  const text = computed(() => {
    const s = Math.floor(left.value / 1000)
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
  })
  return { left, expired, text }
}

// 사용: 결제 제한 시간
const { data } = await useFetch('/api/orders/' + id)      // { expiresAt, serverTime }
syncClock(data.value.serverTime)
const { text, expired } = useCountdown(() => data.value.expiresAt)
<p>{{ expired ? '시간이 지났습니다' : '남은 시간 ' + text }}</p>
` },
        },
        {
          id: 'l4', short: `채팅 스크롤`,
          title: `채팅 목록: 새 메시지에 바닥 유지, 위로 올리면 과거 로드`,
          why: `사용자가 과거를 읽는 중에 새 메시지가 와서 바닥으로 튀면 안 되고, 바닥에 있을 때는 따라가야 합니다. 과거를 위로 끼워 넣을 때는 스크롤 위치를 보정합니다.`,
          single: { label: `✓ components/ChatList.vue`, code: String.raw`
<script setup lang="ts">
const props = defineProps<{ messages: Msg[]; loadOlder: () => Promise<void> }>()
const box = ref<HTMLElement | null>(null)
const atBottom = ref(true)
const newCount = ref(0)

function onScroll() {
  const el = box.value!
  atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  if (atBottom.value) newCount.value = 0
  if (el.scrollTop < 80) loadMore()
}
let loading = false
async function loadMore() {
  if (loading) return
  loading = true
  const el = box.value!; const before = el.scrollHeight
  await props.loadOlder()
  await nextTick()
  el.scrollTop += el.scrollHeight - before          // 끼워 넣은 높이만큼 보정: 화면이 안 움직인다
  loading = false
}
const scrollToBottom = () => nextTick(() => { box.value!.scrollTop = box.value!.scrollHeight; newCount.value = 0 })

watch(() => props.messages.at(-1)?.id, () => {      // 새 메시지
  if (atBottom.value) scrollToBottom()
  else newCount.value++
})
onMounted(scrollToBottom)
</script>
<template>
  <div ref="box" class="chat" @scroll.passive="onScroll">
    <ChatMessage v-for="m in messages" :key="m.id" :msg="m" />
  </div>
  <button v-if="newCount" class="new-msgs" @click="scrollToBottom">새 메시지 {{ newCount }}개 ↓</button>
</template>
` },
        },
        {
          id: 'l5', short: `읽음 처리`,
          title: `알림 읽음 처리: 보이면 읽음, 낙관적 뱃지 감소`,
          why: `클릭해야만 읽음이 되면 뱃지가 안 줄어 불편합니다. 항목이 화면에 1초 이상 보이면 읽음으로 보내되, 요청은 묶어서 보내고 뱃지는 먼저 줄입니다.`,
          single: { label: `✓ composables/useMarkRead.ts`, code: String.raw`
export function useMarkRead(markRead: (ids: number[]) => Promise<void>) {
  const pending = new Set<number>()
  const flush = useDebounceFn(async () => {
    const ids = [...pending]; pending.clear()
    if (!ids.length) return
    try { await markRead(ids) } catch { ids.forEach(id => pending.add(id)) }   // 실패하면 다음 flush 에 다시
  }, 800)

  // 요소가 1초 이상 보이면 읽음
  function observe(el: Ref<HTMLElement | null>, item: { id: number; read: boolean }) {
    let timer: ReturnType<typeof setTimeout> | null = null
    useIntersectionObserver(el, ([e]) => {
      if (e.isIntersecting && !item.read) timer = setTimeout(() => { item.read = true; pending.add(item.id); flush() }, 1000)
      else if (timer) { clearTimeout(timer); timer = null }
    }, { threshold: 0.6 })
  }
  return { observe }
}

// NotificationItem.vue
const el = ref<HTMLElement | null>(null)
const { observe } = inject(markReadKey)!
observe(el, props.item)                     // item.read 가 바뀌면 부모의 unread computed 가 바로 줄어든다
` },
        },
        {
          id: 'l6', short: `상대 시간`,
          title: `"3분 전" 표시와 시간대, 그리고 하이드레이션 안전`,
          why: `상대 시간은 1분마다 갱신되어야 하고, 서버와 클라이언트가 다른 시각에 렌더링하면 하이드레이션이 깨집니다. 서버에서는 절대 시각을, 마운트 뒤에 상대 시간으로 바꿉니다.`,
          single: { label: `✓ components/TimeAgo.vue`, code: String.raw`
<script setup lang="ts">
import { useTimeAgo, useNow } from '@vueuse/core'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'; import tz from 'dayjs/plugin/timezone'
dayjs.extend(utc); dayjs.extend(tz)

const props = defineProps<{ at: string; zone?: string }>()          // ISO 문자열 (UTC)
const mounted = useMounted()
const now = useNow({ interval: 60_000 })
const absolute = computed(() => dayjs(props.at).tz(props.zone ?? 'Asia/Seoul').format('YYYY-MM-DD HH:mm'))
const relative = computed(() => {
  const diff = now.value.getTime() - new Date(props.at).getTime()
  if (diff > 7 * 86400_000) return absolute.value                   // 일주일 넘으면 날짜
  return useTimeAgo(props.at, { messages: KO }).value
})
const KO = { justNow: '방금', past: (n: string) => n + ' 전', future: (n: string) => n + ' 후', minute: (n: number) => n + '분', hour: (n: number) => n + '시간', day: (n: number) => n + '일', second: (n: number) => n + '초', month: (n: number) => n + '개월', year: (n: number) => n + '년', week: (n: number) => n + '주', invalid: '' } as const
</script>
<template>
  <time :datetime="at" :title="absolute">{{ mounted ? relative : absolute }}</time>
</template>
` },
        },
        {
          id: 'l7', short: `오프라인 큐`,
          title: `오프라인이면 요청을 큐에 담았다가 돌아오면 보낸다`,
          why: `현장 앱(배송, 점검)은 네트워크가 자주 끊깁니다. 저장 요청을 IndexedDB 큐에 넣어 두고 온라인이 되면 순서대로 재전송합니다.`,
          single: { label: `✓ composables/useOfflineQueue.ts`, code: String.raw`
import { useOnline, useIDBKeyval } from '@vueuse/core'   // @vueuse/integrations/useIDBKeyval

interface Job { id: string; url: string; method: 'POST' | 'PUT' | 'PATCH'; body: unknown; createdAt: number }

export function useOfflineQueue() {
  const online = useOnline()
  const { data: queue } = useIDBKeyval<Job[]>('offline-queue', [])
  const syncing = ref(false)

  async function enqueue(job: Omit<Job, 'id' | 'createdAt'>) {
    const j: Job = { ...job, id: crypto.randomUUID(), createdAt: Date.now() }
    if (online.value) {
      try { return await api.request({ url: j.url, method: j.method, data: j.body, headers: { 'Idempotency-Key': j.id } }) }
      catch (e) { if (!(e as ApiError).isNetwork) throw e }        // 네트워크 외 오류는 즉시 실패
    }
    queue.value = [...queue.value, j]
    toast.info('오프라인 상태입니다. 연결되면 자동으로 저장됩니다')
  }

  async function flush() {
    if (syncing.value || !online.value || !queue.value.length) return
    syncing.value = true
    try {
      for (const j of [...queue.value]) {
        await api.request({ url: j.url, method: j.method, data: j.body, headers: { 'Idempotency-Key': j.id } })   // 서버가 같은 키는 한 번만 처리
        queue.value = queue.value.filter(x => x.id !== j.id)
      }
      toast.success('저장되지 않았던 항목을 모두 보냈습니다')
    } catch { /* 다음 기회에 */ }
    finally { syncing.value = false }
  }
  watch(online, (v) => { if (v) flush() })
  onMounted(flush)
  return { online, pending: computed(() => queue.value.length), enqueue, flush }
}
` },
        },
        {
          id: 'l8', short: `동시 편집 충돌`,
          title: `낙관적 잠금: version 으로 덮어쓰기를 막고 409 를 처리한다`,
          why: `두 사람이 같은 문서를 열고 나중에 저장한 쪽이 먼저 저장한 내용을 덮어씁니다. 읽을 때 받은 version 을 저장 때 보내고, 서버가 다르면 409 로 거부합니다.`,
          single: { label: `✓ 서버 + 클라이언트`, code: String.raw`
// server/api/docs/[id].patch.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { version, ...patch } = await readValidatedBody(event, DocPatch.parse)
  const updated = await db.doc.updateMany({ where: { id, version }, data: { ...patch, version: { increment: 1 } } })
  if (updated.count === 0) {
    const current = await db.doc.findUnique({ where: { id } })
    throw createError({ statusCode: 409, statusMessage: '다른 사용자가 먼저 수정했습니다', data: { current } })
  }
  return db.doc.findUnique({ where: { id } })
})

// 클라이언트
async function save() {
  try {
    const saved = await $fetch('/api/docs/' + id, { method: 'PATCH', body: { ...form, version: doc.value.version } })
    doc.value = saved
  } catch (e) {
    const err = e as FetchError
    if (err.statusCode === 409) {
      const theirs = err.data.current
      const ok = await confirm('다른 사용자가 먼저 수정했습니다', { message: '최신 내용을 불러올까요? 내 변경은 사라집니다', okText: '최신 불러오기' })
      if (ok) { doc.value = theirs; resetForm({ values: theirs }) }
      // 또는 두 버전을 나란히 보여 주고 병합하게 한다
    } else throw e
  }
}
` },
        },
        {
          id: 'l9', short: `탭 비활성`,
          title: `탭이 보이지 않으면 멈추고, 돌아오면 따라잡는다`,
          why: `백그라운드 탭의 소켓과 타이머는 자원만 씁니다. 숨겨지면 구독을 끊고, 돌아올 때 마지막 이후 변경을 한 번에 받아 상태를 맞춥니다.`,
          single: { label: `✓ composables/useResumable.ts`, code: String.raw`
export function useResumable(opts: { onPause: () => void; onResume: (awaySeconds: number) => void; pauseAfter?: number }) {
  const visible = useDocumentVisibility()
  let hiddenAt = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  watch(visible, (v) => {
    if (v === 'hidden') {
      hiddenAt = Date.now()
      timer = setTimeout(opts.onPause, opts.pauseAfter ?? 30_000)       // 30초 이상 숨겨지면 멈춘다 (잠깐 전환은 유지)
    } else {
      if (timer) { clearTimeout(timer); timer = null }
      const away = Math.round((Date.now() - hiddenAt) / 1000)
      if (hiddenAt && away >= (opts.pauseAfter ?? 30_000) / 1000) opts.onResume(away)
      hiddenAt = 0
    }
  })
}

// 사용: 대시보드
const ws = useLiveSocket(url)
useResumable({
  onPause: () => ws.close(),
  onResume: async () => { await refresh(); ws.open() }     // 전체를 한 번 다시 받고 실시간 재개
})
` },
        },
        {
          id: 'l10', short: `선택 기준`,
          title: `폴링, SSE, WebSocket 중 무엇을 쓸지`,
          why: `실시간이라고 전부 WebSocket 을 쓰면 인프라가 복잡해집니다. 갱신 빈도와 방향으로 고릅니다.`,
          single: { label: `✓ 선택 기준`, code: String.raw`
폴링 (4회차 07번)
  갱신 주기 ≥ 10초, 화면 몇 개만, 인프라 추가 없음
  예: 주문 상태, 작업 진행률, 알림 개수
  → useFetch + usePolling. 보일 때만, 백오프

SSE (02번)
  서버 → 클라이언트 단방향, 초 단위 갱신, HTTP 그대로 (프록시, 인증 쿠키 호환)
  예: 알림 스트림, 로그 tail, AI 응답 스트리밍, 긴 작업 진행률
  → createEventStream + useEventSource. 브라우저가 재연결

WebSocket (01번)
  양방향, 100ms 단위, 클라이언트도 자주 보냄
  예: 채팅, 협업 편집, 실시간 게임, 거래 호가
  → useWebSocket + 재연결/하트비트/재구독. 서버는 별도 소켓 서버나 Nitro WebSocket (experimental)

공통
  재연결 뒤에는 "놓친 것" 을 REST 로 한 번 받는다 (09번)
  메시지는 { type, payload } 로 고정하고 타입별 핸들러 등록
  인증: 쿠키(SSE/WS 같은 출처) 또는 첫 메시지/쿼리로 토큰, 만료 시 재연결
` },
          lang: 'plain',
        },
      ],
    },
    {
      id: 'practice-8', no: 8, name: `권한과 역할`,
      lead: `역할과 권한 모델, v-can 디렉티브, 메뉴 필터, 라우트와 서버 검사, 소유자 검사, 기능 플래그까지 한 벌로 맞춥니다.`,
      lessons: [
        {
          id: 'l1', short: `권한 모델`,
          title: `역할 → 권한 매핑과 can() 하나로 통일`,
          why: `user.role === 'admin' 이 코드 곳곳에 박히면 역할이 늘 때마다 전부 고칩니다. 역할은 권한 묶음일 뿐이고, 코드는 "어떤 권한이 있는가" 만 묻습니다. 매핑은 shared 에 두어 서버와 같이 씁니다.`,
          single: { label: `✓ shared/utils/permissions.ts`, code: String.raw`
export const PERMISSIONS = [
  'order:read', 'order:write', 'order:refund',
  'user:read', 'user:write', 'user:delete',
  'report:read', 'settings:write'
] as const
export type Permission = (typeof PERMISSIONS)[number]
export type Role = 'admin' | 'manager' | 'staff' | 'viewer'

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin:   PERMISSIONS,
  manager: ['order:read', 'order:write', 'order:refund', 'user:read', 'report:read'],
  staff:   ['order:read', 'order:write', 'user:read'],
  viewer:  ['order:read', 'report:read']
}

export function permissionsOf(roles: Role[]): Set<Permission> {
  return new Set(roles.flatMap(r => ROLE_PERMISSIONS[r] ?? []))
}
export function can(perms: Set<Permission>, needed: Permission | Permission[], mode: 'all' | 'any' = 'all') {
  const list = Array.isArray(needed) ? needed : [needed]
  return mode === 'all' ? list.every(p => perms.has(p)) : list.some(p => perms.has(p))
}

// 클라이언트: composables/usePermission.ts
export function usePermission() {
  const { user } = useUserSession()
  const perms = computed(() => permissionsOf(user.value?.roles ?? []))
  return { can: (p: Permission | Permission[], mode?: 'all' | 'any') => can(perms.value, p, mode) }
}
` },
        },
        {
          id: 'l2', short: `v-can`,
          title: `v-can 디렉티브: 권한 없으면 숨기거나 비활성`,
          why: `템플릿마다 v-if="can('order:refund')" 를 쓰면 길고, 비활성 처리와 일관되지 않습니다. 디렉티브가 숨김(기본)과 disabled(.disable 수식어)를 처리합니다.`,
          single: { label: `✓ directives/can.ts`, code: String.raw`
import type { Directive } from 'vue'
import type { Permission } from '#shared/utils/permissions'

// <button v-can="'order:refund'">환불</button>            권한 없으면 제거
// <button v-can.disable="'order:refund'">환불</button>    권한 없으면 disabled + 툴팁
// <div v-can.any="['user:write', 'user:delete']">
export const vCan: Directive<HTMLElement, Permission | Permission[]> = {
  mounted(el, binding) { apply(el, binding) },
  updated(el, binding) { apply(el, binding) }
}
function apply(el: HTMLElement, binding: any) {
  const { can } = usePermission()
  const ok = can(binding.value, binding.modifiers.any ? 'any' : 'all')
  if (binding.modifiers.disable) {
    ;(el as HTMLButtonElement).disabled = !ok
    el.title = ok ? '' : '권한이 없습니다'
    el.setAttribute('aria-disabled', String(!ok))
  } else {
    el.style.display = ok ? '' : 'none'
    if (!ok) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden')
  }
}
// Nuxt: plugins/directives.ts  → nuxtApp.vueApp.directive('can', vCan)
// 숨김은 UX 용일 뿐이다. 실제 보호는 서버(05번)에서 한다
` },
        },
        {
          id: 'l3', short: `메뉴 필터`,
          title: `메뉴 정의에 권한을 적고 자동으로 거른다`,
          why: `메뉴를 템플릿에 v-if 로 하나씩 걸면 권한이 바뀔 때 메뉴와 라우트가 어긋납니다. 메뉴 데이터에 permission 을 적고 computed 로 거릅니다. 하위가 전부 걸러지면 상위도 숨깁니다.`,
          single: { label: `✓ config/menu.ts + components/SideNav.vue`, code: String.raw`
export interface MenuItem { label: string; to?: string; icon?: string; permission?: Permission | Permission[]; children?: MenuItem[] }

export const MENU: MenuItem[] = [
  { label: '대시보드', to: '/', icon: 'home' },
  { label: '주문', icon: 'cart', permission: 'order:read', children: [
    { label: '주문 목록', to: '/orders' },
    { label: '환불 요청', to: '/orders/refunds', permission: 'order:refund' }
  ]},
  { label: '사용자', to: '/users', permission: 'user:read' },
  { label: '설정', to: '/settings', permission: 'settings:write' }
]

// SideNav.vue
const { can } = usePermission()
function filter(items: MenuItem[]): MenuItem[] {
  return items.flatMap(it => {
    if (it.permission && !can(it.permission)) return []
    const children = it.children ? filter(it.children) : undefined
    if (it.children && !children?.length) return []            // 자식이 다 걸러지면 부모도 제거
    return [{ ...it, children }]
  })
}
const menu = computed(() => filter(MENU))
` },
        },
        {
          id: 'l4', short: `라우트 보호`,
          title: `페이지 메타에 권한을 적고 미들웨어가 403 으로 보낸다`,
          why: `URL 을 직접 치고 들어오는 경우를 막습니다. 메뉴와 같은 권한 이름을 페이지 메타에 적어 한 곳에서 관리합니다.`,
          single: { label: `✓ middleware/permission.global.ts`, code: String.raw`
declare module '#app' { interface PageMeta { permission?: Permission | Permission[] } }

export default defineNuxtRouteMiddleware((to) => {
  if (!to.meta.permission) return
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  const { can } = usePermission()
  if (!can(to.meta.permission)) {
    return abortNavigation(createError({ statusCode: 403, statusMessage: '접근 권한이 없습니다' }))   // error.vue 가 403 화면
  }
})

// pages/orders/refunds.vue
definePageMeta({ permission: 'order:refund' })
` },
        },
        {
          id: 'l5', short: `서버 검사`,
          title: `서버 헬퍼 requirePermission: API 는 반드시 서버에서 막는다`,
          why: `UI 숨김과 라우트 가드는 우회됩니다. 모든 보호된 API 가 같은 헬퍼를 부르게 하면 빠지는 곳을 grep 으로 찾을 수 있습니다.`,
          single: { label: `✓ server/utils/auth.ts`, code: String.raw`
import type { H3Event } from 'h3'
import { permissionsOf, can, type Permission } from '#shared/utils/permissions'

export async function requirePermission(event: H3Event, needed: Permission | Permission[], mode: 'all' | 'any' = 'all') {
  const { user } = await requireUserSession(event)                       // 401
  const perms = permissionsOf(user.roles)
  if (!can(perms, needed, mode)) {
    throw createError({ statusCode: 403, statusMessage: '권한이 없습니다', data: { needed } })
  }
  return { user, perms }
}

// server/api/orders/[id]/refund.post.ts
export default defineEventHandler(async (event) => {
  const { user } = await requirePermission(event, 'order:refund')
  return refundOrder(getRouterParam(event, 'id')!, user.id)
})
// 점검: grep -L "requirePermission\|requireUserSession" server/api/**/*.ts  → 보호가 빠진 핸들러 목록
` },
        },
        {
          id: 'l6', short: `소유자 검사`,
          title: `"내 것만" 규칙: 소유자이거나 관리자`,
          why: `user:write 권한이 있어도 남의 프로필을 고치면 안 됩니다. 리소스 소유자 검사는 권한 검사와 별개로 필요합니다. 클라이언트에도 같은 함수를 두어 버튼을 맞춥니다.`,
          single: { label: `✓ shared/utils/ownership.ts`, code: String.raw`
export function canEditPost(viewer: { id: number; roles: Role[] } | null, post: { authorId: number; status: string }) {
  if (!viewer) return false
  if (viewer.roles.includes('admin')) return true
  return viewer.id === post.authorId && post.status !== 'archived'
}

// 서버
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const post = await db.post.findUniqueOrThrow({ where: { id: getRouterParam(event, 'id') } })
  if (!canEditPost(user, post)) throw createError({ statusCode: 403 })
  ...
})

// 클라이언트: 같은 함수로 버튼 표시
const { user } = useUserSession()
const editable = computed(() => canEditPost(user.value, post.value))
<button v-if="editable" @click="edit">수정</button>
` },
        },
        {
          id: 'l7', short: `기능 플래그`,
          title: `기능 플래그: 사용자별/비율별로 새 기능을 켠다`,
          why: `새 기능을 전원에게 한 번에 열면 문제 시 롤백이 배포입니다. 플래그로 일부에게만 열고, 코드는 if (flag) 한 줄로 분기합니다. 플래그 값은 서버가 정해 세션과 함께 내려줍니다.`,
          single: { label: `✓ server + composables/useFlag.ts`, code: String.raw`
// server/utils/flags.ts
const FLAGS = {
  'new-checkout': (u: User) => u.roles.includes('admin') || hash(u.id) % 100 < 20,   // 관리자 + 20%
  'ai-summary':   (u: User) => u.plan === 'pro'
} as const
export type Flag = keyof typeof FLAGS
export const flagsFor = (u: User) => Object.fromEntries(Object.entries(FLAGS).map(([k, f]) => [k, f(u)])) as Record<Flag, boolean>
// 로그인 시 세션에 flags 를 넣거나 /api/me 응답에 포함

// composables/useFlag.ts
export function useFlag(name: Flag) {
  const { user } = useUserSession()
  const override = useRoute().query['ff.' + name]                 // ?ff.new-checkout=1 로 개발 중 강제 (개발 환경만)
  return computed(() => import.meta.dev && override != null ? override === '1' : !!user.value?.flags?.[name])
}

<CheckoutV2 v-if="useFlag('new-checkout').value" />
<CheckoutV1 v-else />
` },
          note: `플래그가 10개를 넘으면 LaunchDarkly, Unleash, PostHog 같은 도구를 씁니다. 오래된 플래그는 정리하지 않으면 코드가 두 벌이 됩니다.`,
        },
        {
          id: 'l8', short: `가장(impersonate)`,
          title: `관리자가 사용자로 보기: 안전한 가장 패턴`,
          why: `지원팀이 "그 사용자 화면" 을 봐야 할 때 비밀번호를 받는 건 금물입니다. 관리자 세션에 가장 대상만 기록하고, 읽기 전용으로 제한하며, 감사 로그를 남깁니다.`,
          single: { label: `✓ server/api/admin/impersonate.post.ts + 미들웨어`, code: String.raw`
// 시작
export default defineEventHandler(async (event) => {
  const { user: admin } = await requirePermission(event, 'user:impersonate')
  const { userId } = await readValidatedBody(event, z.object({ userId: z.number() }).parse)
  const target = await db.user.findUniqueOrThrow({ where: { id: userId } })
  await audit.log({ actor: admin.id, action: 'impersonate.start', target: target.id })
  await setUserSession(event, {
    user: { id: target.id, name: target.name, roles: ['viewer'] },          // 대상의 권한이 아니라 읽기 전용
    secure: { impersonator: admin.id, originalUser: admin }
  })
  return { ok: true }
})

// 종료: secure.originalUser 로 세션을 되돌린다
// 서버 미들웨어: 가장 중에는 쓰기 차단
export default defineEventHandler(async (event) => {
  const s = await getUserSession(event)
  if (s.secure?.impersonator && !['GET', 'HEAD'].includes(event.method) && !event.path.startsWith('/api/admin/impersonate')) {
    throw createError({ statusCode: 403, statusMessage: '가장 중에는 변경할 수 없습니다' })
  }
})
// 화면: 상단에 "OO 사용자로 보는 중 — 종료" 띠를 항상 표시
` },
        },
        {
          id: 'l9', short: `권한 갱신`,
          title: `역할이 바뀌면 세션을 다시 읽어 UI 와 서버가 같게`,
          why: `관리자가 역할을 바꿔도 사용자의 세션에는 옛 역할이 남습니다. 세션에 버전을 두고 서버가 요청마다 확인하거나, 변경 시 해당 사용자 세션을 무효화합니다.`,
          single: { label: `✓ server/middleware/session-version.ts`, code: String.raw`
// 사용자 행에 sessionVersion 컬럼. 역할 변경, 비밀번호 변경, 강제 로그아웃 때 +1
export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) return
  const s = await getUserSession(event)
  if (!s.user) return
  const v = await cache.get('sv:' + s.user.id) ?? (await db.user.findUnique({ where: { id: s.user.id }, select: { sessionVersion: true } }))?.sessionVersion
  if (v !== s.sessionVersion) {
    const fresh = await db.user.findUniqueOrThrow({ where: { id: s.user.id } })
    await replaceUserSession(event, { user: pickPublic(fresh), sessionVersion: fresh.sessionVersion })   // 세션 갱신
    setHeader(event, 'X-Session-Refreshed', '1')
  }
})

// 클라이언트: 응답 헤더를 보고 useUserSession().fetch() 로 다시 읽는다
onResponse({ response }) { if (response.headers.get('X-Session-Refreshed')) useUserSession().fetch() }
` },
        },
        {
          id: 'l10', short: `점검 목록`,
          title: `권한 구현 점검 목록`,
          why: `권한은 한 곳만 빠져도 사고입니다. 배포 전에 확인할 것들입니다.`,
          single: { label: `✓ 점검`, code: String.raw`
[ ] 권한 이름(Permission)과 역할 매핑은 shared/ 한 곳에만 있다. 클라이언트와 서버가 같은 파일을 import 한다
[ ] 모든 server/api 핸들러가 requireUserSession 또는 requirePermission 을 부른다 (공개 API 는 명시적으로 // public 주석)
[ ] 리소스 소유권 검사는 권한 검사와 별도로 한다 (내 글, 내 주문, 내 회사)
[ ] 목록 API 는 소유자/회사 범위로 WHERE 를 건다 (id 를 바꿔 넣는 IDOR 방지)
[ ] UI 의 v-can, 메뉴 필터, 라우트 메타는 모두 같은 can() 을 쓴다. UI 숨김은 보호가 아니다
[ ] 403 과 404 를 구분한다: 존재 여부를 숨겨야 하면 404
[ ] 역할 변경 시 기존 세션이 갱신되거나 무효화된다
[ ] 관리자 가장은 읽기 전용 + 감사 로그 + 화면 표시
[ ] 권한 관련 테스트: 역할별로 허용/거부 케이스를 API 테스트로 둔다
[ ] 기능 플래그는 만료일을 적고 정리한다
` },
          lang: 'plain',
        },
      ],
    },
    {
      id: 'practice-9', no: 9, name: `에러 처리와 로깅`,
      lead: `전역 에러 핸들러, 에러 분류와 사용자 메시지, Sentry, 경계와 재시도, 서버 로그와 requestId, 사용자 행동 로그까지입니다.`,
      lessons: [
        {
          id: 'l1', short: `전역 핸들러`,
          title: `잡히지 않은 오류를 한 곳에서 받는다`,
          why: `컴포넌트 렌더링 오류, 이벤트 핸들러 오류, Promise 거부, 일반 JS 오류는 각각 다른 경로로 새어 나갑니다. 네 경로를 모두 하나의 report 로 모읍니다.`,
          single: { label: `✓ plugins/error.ts (Nuxt) / main.ts (Vue)`, code: String.raw`
export default defineNuxtPlugin((nuxtApp) => {
  // 1) Vue 컴포넌트 안에서 난 오류 (렌더링, 라이프사이클, 핸들러)
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => report(err, { source: 'vue', info, component: instance?.$options.name })
  // 2) Nuxt 가 잡은 오류 (SSR 포함)
  nuxtApp.hook('vue:error', (err, _i, info) => report(err, { source: 'nuxt', info }))
  nuxtApp.hook('app:error', (err) => report(err, { source: 'app' }))

  if (import.meta.client) {
    // 3) 처리되지 않은 Promise
    window.addEventListener('unhandledrejection', (e) => { report(e.reason, { source: 'promise' }); e.preventDefault() })
    // 4) 일반 JS 오류, 리소스 로드 실패
    window.addEventListener('error', (e) => report(e.error ?? e.message, { source: 'window', file: e.filename, line: e.lineno }))
  }
})

export function report(err: unknown, ctx: Record<string, unknown> = {}) {
  const e = toApiError(err)                                  // 2회차 02번: 모든 오류를 한 모양으로
  if (e.code === 'CANCELED') return                           // 취소는 오류가 아니다
  if (e.isNetwork) { toast.error('네트워크 연결을 확인하세요'); return }
  if (e.isAuth) return                                        // 인터셉터가 처리한다
  console.error('[report]', e, ctx)
  sentry?.captureException(e.raw ?? e, { extra: { ...ctx, code: e.code, status: e.status } })
  if (!e.isValidation) toast.error(userMessage(e))            // 03번
}
` },
        },
        {
          id: 'l2', short: `사용자 메시지`,
          title: `에러 코드 → 사용자 문구 매핑, 개발자 메시지는 보여 주지 않는다`,
          why: `"Cannot read properties of undefined" 를 사용자에게 보여 줄 수는 없습니다. 코드별 문구를 한 표에 두고, 없는 코드는 상태 코드별 기본 문구를 씁니다.`,
          single: { label: `✓ utils/errorMessages.ts`, code: String.raw`
const BY_CODE: Record<string, string> = {
  NETWORK: '네트워크 연결을 확인하세요',
  TIMEOUT: '서버 응답이 늦습니다. 잠시 후 다시 시도하세요',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다',
  DUPLICATE_EMAIL: '이미 가입된 이메일입니다',
  INSUFFICIENT_STOCK: '재고가 부족합니다',
  PAYMENT_DECLINED: '결제가 거절되었습니다. 카드사에 문의하세요'
}
const BY_STATUS: Record<number, string> = {
  400: '요청이 올바르지 않습니다', 403: '권한이 없습니다', 404: '찾을 수 없습니다',
  409: '다른 사용자가 먼저 변경했습니다', 413: '파일이 너무 큽니다', 429: '요청이 너무 많습니다. 잠시 후 다시 시도하세요',
  500: '서버 오류가 발생했습니다', 502: '서버에 연결할 수 없습니다', 503: '서버 점검 중입니다'
}

export function userMessage(e: ApiError): string {
  if (BY_CODE[e.code]) return BY_CODE[e.code]
  if (e.status >= 400 && e.status < 500 && e.message && e.status !== 500) return e.message   // 서버가 createError 로 쓴 문구는 사용자용
  return BY_STATUS[e.status] ?? '문제가 발생했습니다. 잠시 후 다시 시도하세요'
}
// 서버 원칙: 4xx 의 statusMessage 는 사용자가 읽을 문구로 쓰고, 5xx 는 내부 정보를 담지 않는다
` },
        },
        {
          id: 'l3', short: `Sentry`,
          title: `Sentry 연동: 사용자 컨텍스트, 릴리스, 소스맵, 샘플링`,
          why: `운영에서 난 오류는 콘솔이 없습니다. Sentry 가 스택, 브라우저, 사용자, 직전 동작을 모아 줍니다. 소스맵을 올려야 압축된 스택이 읽힙니다.`,
          single: { label: `✓ nuxt.config.ts + sentry.client.config.ts`, code: String.raw`
// npx @sentry/wizard@latest -i nuxt   (@sentry/nuxt 모듈 설치와 설정 파일 생성)

// sentry.client.config.ts
import * as Sentry from '@sentry/nuxt'
Sentry.init({
  dsn: useRuntimeConfig().public.sentryDsn,
  environment: import.meta.env.MODE,
  release: useRuntimeConfig().public.release,            // 빌드 때 git sha 를 넣는다
  tracesSampleRate: 0.1,                                 // 성능 추적 10%
  replaysOnErrorSampleRate: 1.0,                         // 오류 난 세션은 리플레이 저장
  beforeSend(event, hint) {
    const err = hint.originalException as ApiError | undefined
    if (err?.code === 'CANCELED' || err?.isNetwork || err?.status === 401) return null   // 잡음 제거
    return event
  },
  ignoreErrors: ['ResizeObserver loop', 'Non-Error promise rejection']
})

// 로그인/로그아웃 시
Sentry.setUser(user ? { id: String(user.id) } : null)    // 이메일 등 개인정보는 넣지 않는다
// 의미 있는 동작은 빵부스러기로
Sentry.addBreadcrumb({ category: 'checkout', message: 'step 2 → 3', level: 'info' })

// nuxt.config.ts: sentry: { sourceMapsUploadOptions: { org, project, authToken: process.env.SENTRY_AUTH_TOKEN } }, sourcemap: { client: 'hidden' }
` },
        },
        {
          id: 'l4', short: `경계와 재시도`,
          title: `구역별 에러 경계와 "다시 시도"`,
          why: `사이드 위젯 하나 때문에 페이지 전체가 죽으면 안 됩니다. 구역을 경계로 감싸고, 재시도 버튼이 그 구역만 다시 그리게 key 를 바꿉니다.`,
          single: { label: `✓ components/ErrorBoundary.vue`, code: String.raw`
<script setup lang="ts">
const props = defineProps<{ name: string }>()
const error = ref<Error | null>(null)
const key = ref(0)
onErrorCaptured((err) => {
  error.value = err as Error
  report(err, { source: 'boundary', boundary: props.name })
  return false                               // 위로 전파하지 않는다
})
function retry() { error.value = null; key.value++ }   // key 변경으로 자식을 새로 마운트
</script>
<template>
  <div v-if="error" class="boundary-error" role="alert">
    <p>{{ name }} 영역을 표시하지 못했습니다</p>
    <button @click="retry">다시 시도</button>
  </div>
  <div v-else :key="key"><slot /></div>
</template>

<!-- 사용 -->
<ErrorBoundary name="추천 상품"><RecommendWidget /></ErrorBoundary>
<ErrorBoundary name="최근 활동"><ActivityFeed /></ErrorBoundary>
<!-- Nuxt 의 <NuxtErrorBoundary> 도 같은 역할. 서버 렌더링 중 오류는 error.vue 로 간다 -->
` },
        },
        {
          id: 'l5', short: `중복 억제`,
          title: `같은 오류 토스트가 겹치지 않게, 폭주 시 묶기`,
          why: `목록 20개가 동시에 실패하면 토스트 20개가 뜹니다. 같은 메시지는 3초 안에 한 번만, 짧은 시간에 여러 오류가 나면 "N건의 오류" 로 묶습니다.`,
          single: { label: `✓ utils/errorToast.ts`, code: String.raw`
const recent = new Map<string, number>()
let burst = 0
let burstTimer: ReturnType<typeof setTimeout> | null = null

export function errorToast(message: string) {
  const now = Date.now()
  const last = recent.get(message) ?? 0
  if (now - last < 3000) return                              // 같은 문구 3초 억제
  recent.set(message, now)

  burst++
  if (burst === 1) {
    toast.error(message)
    burstTimer = setTimeout(() => {
      if (burst > 1) toast.error('그 외 ' + (burst - 1) + '건의 오류가 더 있습니다')
      burst = 0
    }, 1500)
  }
  // 1.5초 안의 추가 오류는 묶음 문구로만
}
// report() 의 toast.error 를 errorToast 로 바꾼다
` },
        },
        {
          id: 'l6', short: `서버 로그`,
          title: `서버 로그: 구조화 + requestId 로 요청 추적`,
          why: `console.log 문자열은 검색이 안 됩니다. JSON 로그에 requestId 를 붙이면 한 요청의 로그를 전부 모을 수 있고, 클라이언트 오류 보고에 같은 id 를 넣으면 양쪽을 잇습니다.`,
          single: { label: `✓ server/middleware/request-log.ts + server/utils/logger.ts`, code: String.raw`
// server/utils/logger.ts
import pino from 'pino'
export const logger = pino({ level: process.env.LOG_LEVEL ?? (import.meta.dev ? 'debug' : 'info'),
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'] })

// server/middleware/request-log.ts
export default defineEventHandler((event) => {
  const id = getHeader(event, 'x-request-id') ?? crypto.randomUUID()
  event.context.requestId = id
  event.context.log = logger.child({ requestId: id, path: event.path, method: event.method })
  setHeader(event, 'X-Request-Id', id)
  const start = performance.now()
  event.node.res.on('finish', () => {
    const ms = Math.round(performance.now() - start)
    const status = event.node.res.statusCode
    event.context.log[status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info']({ status, ms }, 'request')
  })
})

// 핸들러 안에서
event.context.log.info({ orderId }, 'refund requested')

// 오류 핸들러(nitro plugin): logger.error({ err, requestId }, 'unhandled')
// 클라이언트: 실패 응답의 X-Request-Id 를 토스트/보고에 포함 → "문의 시 이 번호를 알려 주세요: a1b2c3"
` },
        },
        {
          id: 'l7', short: `error.vue`,
          title: `error.vue: 상태별 화면, 보고, 돌아가기`,
          why: `404 와 500 은 다른 화면이어야 하고, 500 은 보고가 가야 하며, 사용자는 홈이나 이전으로 갈 수 있어야 합니다. 개발 모드에서만 스택을 보여 줍니다.`,
          single: { label: `✓ error.vue`, code: String.raw`
<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)
onMounted(() => { if (!is404.value) report(props.error, { source: 'error.vue' }) })
const home = () => clearError({ redirect: '/' })
const back = () => { clearError(); history.length > 1 ? history.back() : navigateTo('/') }
useSeoMeta({ title: () => (is404.value ? '페이지를 찾을 수 없습니다' : '오류') })
</script>
<template>
  <NuxtLayout name="minimal">
    <main class="error-page">
      <template v-if="is404">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>주소가 바뀌었거나 삭제된 페이지입니다.</p>
      </template>
      <template v-else-if="error.statusCode === 403">
        <h1>접근 권한이 없습니다</h1>
      </template>
      <template v-else>
        <h1>문제가 발생했습니다</h1>
        <p>잠시 후 다시 시도해 주세요. 계속되면 문의해 주세요.</p>
        <pre v-if="$config.public.dev">{{ error.stack }}</pre>
      </template>
      <button @click="back">이전으로</button> <button @click="home">홈으로</button>
    </main>
  </NuxtLayout>
</template>
` },
        },
        {
          id: 'l8', short: `로그 수준`,
          title: `개발·운영 로그 수준과 클라이언트 로거`,
          why: `운영 콘솔에 디버그 로그가 쏟아지면 진짜 오류가 묻히고 내부 정보가 보입니다. 수준이 있는 얇은 로거를 두고 빌드 환경으로 수준을 정합니다.`,
          single: { label: `✓ utils/log.ts`, code: String.raw`
type Level = 'debug' | 'info' | 'warn' | 'error'
const ORDER: Level[] = ['debug', 'info', 'warn', 'error']
const min: Level = import.meta.dev ? 'debug' : 'warn'

function make(scope: string) {
  const ok = (l: Level) => ORDER.indexOf(l) >= ORDER.indexOf(min)
  return {
    debug: (...a: unknown[]) => ok('debug') && console.debug('[' + scope + ']', ...a),
    info:  (...a: unknown[]) => ok('info')  && console.info('[' + scope + ']', ...a),
    warn:  (...a: unknown[]) => ok('warn')  && console.warn('[' + scope + ']', ...a),
    error: (...a: unknown[]) => { console.error('[' + scope + ']', ...a); sentry?.captureMessage(scope + ': ' + String(a[0]), 'error') }
  }
}
export const log = Object.assign(make('app'), { scope: make })

// 사용
const l = log.scope('checkout')
l.debug('step', step.value, values)          // 운영에서는 출력되지 않는다
l.error('payment failed', err)

// 운영 콘솔에서 임시로 켜기: localStorage.debug = '1' 을 보고 min 을 debug 로 (운영 디버깅용)
` },
        },
        {
          id: 'l9', short: `행동 로그`,
          title: `사용자 행동 이벤트를 한 함수로 추상화한다`,
          why: `GA, Amplitude, 자체 서버 등 어디로 보내든 컴포넌트는 track('이벤트', 속성) 만 알면 됩니다. 도구를 바꿔도 호출 코드는 그대로입니다. 개인정보는 넣지 않습니다.`,
          single: { label: `✓ composables/useTrack.ts`, code: String.raw`
type Events = {
  'product.view': { id: number; category: string }
  'cart.add': { id: number; qty: number; price: number }
  'checkout.step': { step: number }
  'search': { query: string; results: number }
}
type Sink = <K extends keyof Events>(name: K, props: Events[K], ctx: { path: string; userId?: number }) => void

const sinks: Sink[] = []
export function addTrackSink(s: Sink) { sinks.push(s) }

export function useTrack() {
  const route = useRoute(); const { user } = useUserSession()
  return function track<K extends keyof Events>(name: K, props: Events[K]) {
    const ctx = { path: route.path, userId: user.value?.id }
    if (import.meta.dev) console.debug('[track]', name, props)
    sinks.forEach(s => { try { s(name, props, ctx) } catch { /* 추적 실패가 앱을 깨면 안 된다 */ } })
  }
}

// plugins/analytics.client.ts: 실제 전송은 여기서만
addTrackSink((name, props) => window.gtag?.('event', name, props))
addTrackSink((name, props, ctx) => navigator.sendBeacon('/api/events', JSON.stringify({ name, props, ctx, at: Date.now() })))

// 컴포넌트
const track = useTrack()
track('cart.add', { id: product.id, qty: 1, price: product.price })   // 이벤트 이름과 속성이 타입 검사된다
` },
        },
        {
          id: 'l10', short: `느린 요청`,
          title: `느린 요청 감지와 성능 로그`,
          why: `오류는 없는데 느린 화면은 보고가 안 됩니다. 인터셉터에서 소요 시간을 재서 임계를 넘으면 경고 로그를 남기고, 페이지 전환 시간도 함께 기록합니다.`,
          single: { label: `✓ client.ts 인터셉터 + plugins/perf.client.ts`, code: String.raw`
// client.ts
api.interceptors.request.use(cfg => { cfg._start = performance.now(); return cfg })
api.interceptors.response.use(res => {
  const ms = performance.now() - (res.config._start ?? 0)
  if (ms > 3000) log.warn('slow request', res.config.method, res.config.url, Math.round(ms) + 'ms', res.headers['x-request-id'])
  return res
})
declare module 'axios' { export interface InternalAxiosRequestConfig { _start?: number } }

// plugins/perf.client.ts: 페이지 전환 시간
export default defineNuxtPlugin((nuxtApp) => {
  let start = 0
  nuxtApp.hook('page:start', () => { start = performance.now() })
  nuxtApp.hook('page:finish', () => {
    const ms = Math.round(performance.now() - start)
    if (ms > 2000) log.warn('slow navigation', useRoute().path, ms + 'ms')
    track('page.timing', { path: useRoute().path, ms })
  })
})

// Core Web Vitals 는 web-vitals 패키지로: onLCP, onINP, onCLS → 같은 track 으로 보낸다
` },
        },
      ],
    },
    {
      id: 'practice-10', no: 10, name: `성능 UX 패턴`,
      lead: `체감 속도를 올리는 코드입니다. 낙관적 갱신, 프리페치, 스켈레톤과 Suspense, 병렬 요청, 워커, 상태 보존, 입력 스로틀, 지연 로딩, 측정까지입니다.`,
      lessons: [
        {
          id: 'l1', short: `낙관적 갱신`,
          title: `낙관적 갱신 일반 패턴: 좋아요, 토글, 수량`,
          why: `서버 응답을 기다렸다 UI 를 바꾸면 모든 클릭이 200ms 씩 늦게 느껴집니다. 먼저 바꾸고 실패하면 되돌립니다. 연타는 마지막 값만 보냅니다.`,
          single: { label: `✓ composables/useOptimistic.ts`, code: String.raw`
export function useOptimistic<T>(value: Ref<T>, commit: (next: T) => Promise<T | void>, { debounce = 0 } = {}) {
  const pending = ref(false)
  let latest = 0
  const send = useDebounceFn(async (next: T, prev: T, seq: number) => {
    try {
      const r = await commit(next)
      if (seq === latest && r !== undefined) value.value = r as T      // 서버가 돌려준 확정값
    } catch (e) {
      if (seq === latest) { value.value = prev; toast.error('저장하지 못했습니다') }
    } finally { if (seq === latest) pending.value = false }
  }, debounce)

  function set(next: T) {
    const prev = value.value
    value.value = next                                                   // 1) 즉시 반영
    pending.value = true
    send(next, prev, ++latest)                                           // 2) 서버 (연타 시 마지막만)
  }
  return { set, pending }
}

// 좋아요
const liked = ref(post.liked); const likes = ref(post.likes)
const { set: setLiked } = useOptimistic(liked, (v) => postApi.like(post.id, v).then(r => { likes.value = r.likes }))
<button @click="setLiked(!liked)" :aria-pressed="liked">♥ {{ likes }}</button>

// 수량 (연타 300ms 묶음)
const qty = ref(item.qty)
const { set: setQty, pending } = useOptimistic(qty, (v) => cartApi.setQty(item.id, v), { debounce: 300 })
` },
        },
        {
          id: 'l2', short: `프리페치`,
          title: `마우스를 올리면 다음 페이지 코드와 데이터를 미리 받는다`,
          why: `클릭 뒤에 받기 시작하면 300ms 가 걸립니다. hover 나 보이는 순간에 미리 받으면 클릭 즉시 뜹니다. NuxtLink 는 코드를 미리 받고, 데이터는 직접 당깁니다.`,
          single: { label: `✓ components/ProductLink.vue`, code: String.raw`
<script setup lang="ts">
const props = defineProps<{ id: number }>()
const nuxtApp = useNuxtApp()
let warmed = false
async function warm() {
  if (warmed) return
  warmed = true
  // useFetch 와 같은 키로 페이로드 캐시에 넣어 두면 상세 페이지의 useFetch 가 재요청 없이 쓴다
  const key = 'product-' + props.id
  if (!nuxtApp.payload.data[key]) nuxtApp.payload.data[key] = await $fetch('/api/products/' + props.id)
}
</script>
<template>
  <!-- prefetch-on="interaction": hover/focus 때 페이지 청크를 받는다 (기본은 보일 때) -->
  <NuxtLink :to="'/products/' + id" prefetch-on="interaction" @mouseenter="warm" @focus="warm" @touchstart.passive="warm">
    <slot />
  </NuxtLink>
</template>

<!-- 상세 페이지: 같은 키, getCachedData 로 캐시 우선 -->
const { data } = await useFetch('/api/products/' + id, { key: 'product-' + id, getCachedData: (k, app) => app.payload.data[k] })
` },
          note: `Vue Router 만 쓸 때는 라우트의 <code>component: () =&gt; import(...)</code> 를 hover 시 미리 호출하면 코드가 미리 받아집니다: <code>router.resolve(to).matched.forEach(m =&gt; typeof m.components?.default === 'function' &amp;&amp; m.components.default())</code>.`,
        },
        {
          id: 'l3', short: `Suspense`,
          title: `Suspense 로 비동기 컴포넌트 묶음에 스켈레톤 하나`,
          why: `위젯 셋이 각자 로딩을 그리면 화면이 세 번 들썩입니다. Suspense 가 셋 모두 준비될 때까지 스켈레톤 하나를 보여 주고 한 번에 바꿉니다.`,
          single: { label: `✓ pages/dashboard.vue`, code: String.raw`
<template>
  <Suspense>
    <template #default>
      <div class="grid">
        <SalesWidget />      <!-- 각각 <script setup> 에서 await useFetch(...) -->
        <OrdersWidget />
        <VisitorsWidget />
      </div>
    </template>
    <template #fallback>
      <DashboardSkeleton />  <!-- 같은 grid 구조의 회색 블록 -->
    </template>
  </Suspense>
</template>

<!-- 주의
  - Suspense 안의 컴포넌트가 await 하면 에러는 onErrorCaptured 로 잡는다 (9회차 04번 경계와 함께)
  - 위젯이 느린 하나 때문에 전체가 늦으면, 그 위젯만 Suspense 밖으로 빼서 useLazyFetch 로
  - Nuxt 페이지는 이미 <NuxtPage> 가 Suspense 로 감싸져 있다. 페이지 안에서 부분 묶음에만 쓴다
-->
` },
        },
        {
          id: 'l4', short: `병렬 요청`,
          title: `독립된 요청은 await 를 나란히 두지 말고 함께 보낸다`,
          why: `await 세 줄은 순서대로 기다려 300ms × 3 입니다. 서로 의존하지 않는 요청은 동시에 보내 가장 느린 하나만큼만 기다립니다.`,
          badLabel: `✕ 순차`, goodLabel: `✓ 병렬`,
          bad: String.raw`
const { data: user } = await useFetch('/api/me')
const { data: orders } = await useFetch('/api/orders')
const { data: coupons } = await useFetch('/api/coupons')
// 900ms
`,
          good: String.raw`
// Nuxt: await 없이 만들고 한 번에 기다린다
const userReq = useFetch('/api/me')
const ordersReq = useFetch('/api/orders')
const couponsReq = useFetch('/api/coupons')
const [{ data: user }, { data: orders }, { data: coupons }] = await Promise.all([userReq, ordersReq, couponsReq])
// 300ms

// 의존이 있는 것만 순서대로
const { data: user } = await useFetch('/api/me')
const { data: team } = await useFetch(() => '/api/teams/' + user.value.teamId)

// 하나만 실패해도 나머지를 쓰려면 Promise.allSettled
`,
        },
        {
          id: 'l5', short: `Web Worker`,
          title: `무거운 계산은 Web Worker 로 메인 스레드를 비운다`,
          why: `수만 건 집계, 이미지 처리, 대용량 파싱을 메인 스레드에서 하면 입력과 애니메이션이 멈춥니다. 워커에서 돌리고 결과만 받습니다.`,
          single: { label: `✓ workers/aggregate.ts + composables/useAggregate.ts`, code: String.raw`
// workers/aggregate.ts
self.onmessage = (e: MessageEvent<{ rows: Row[]; by: string }>) => {
  const { rows, by } = e.data
  const out = new Map<string, number>()
  for (const r of rows) out.set(r[by], (out.get(r[by]) ?? 0) + r.amount)
  self.postMessage([...out.entries()])
}

// composables/useAggregate.ts
export function useAggregate() {
  const worker = new Worker(new URL('../workers/aggregate.ts', import.meta.url), { type: 'module' })   // Vite 가 번들링
  onScopeDispose(() => worker.terminate())
  return (rows: Row[], by: string) => new Promise<[string, number][]>((resolve) => {
    worker.onmessage = (e) => resolve(e.data)
    worker.postMessage({ rows, by })
  })
}

// 더 간단히: VueUse
import { useWebWorkerFn } from '@vueuse/core'
const { workerFn, workerStatus } = useWebWorkerFn((rows: Row[]) => rows.reduce((a, r) => a + r.amount, 0))
const total = await workerFn(rows)      // 함수가 워커에서 실행된다 (외부 변수 참조 불가)
` },
        },
        {
          id: 'l6', short: `상태 보존`,
          title: `탭과 스크롤 위치를 보존해 "돌아왔을 때 그대로"`,
          why: `상세 보고 돌아오면 탭이 첫 탭으로, 스크롤이 맨 위로 가면 사용자는 매번 다시 찾습니다. KeepAlive 와 scrollBehavior, 그리고 탭 상태의 URL 저장을 조합합니다.`,
          single: { label: `✓ app/router.options.ts + 목록 페이지`, code: String.raw`
// app/router.options.ts (Nuxt) : 뒤로 가기 때 저장된 스크롤 복원
import type { RouterConfig } from '@nuxt/schema'
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 80 }
    if (to.path === from.path) return false         // 쿼리만 바뀌면 유지 (필터 변경)
    return { top: 0 }
  }
}

// 목록 페이지: 컴포넌트 보존
definePageMeta({ keepalive: { max: 3 } })          // 이 페이지 인스턴스를 유지 (Nuxt)
onActivated(() => { if (Date.now() - loadedAt > 60_000) refresh() })   // 오래됐으면 갱신

// 탭 상태는 URL 로 (4회차 04번 useQueryState)
const tab = useQueryState('tab', 'info')

// 가상 목록의 스크롤은 KeepAlive 로 보존되지 않으니 직접: onDeactivated 에서 scrollTop 저장, onActivated 에서 복원
` },
        },
        {
          id: 'l7', short: `입력 스로틀`,
          title: `검색 입력은 디바운스, 스크롤·리사이즈는 스로틀, 정렬은 requestIdleCallback`,
          why: `이벤트마다 무거운 일을 하면 입력이 끊깁니다. 종류에 맞는 조절 방식을 고릅니다.`,
          single: { label: `✓ 선택과 코드`, code: String.raw`
import { refDebounced, useThrottleFn, useDebounceFn } from '@vueuse/core'

// 1) 검색어: 입력이 멈춘 뒤 (debounce)
const query = ref('')
const debouncedQuery = refDebounced(query, 300)
watch(debouncedQuery, search)

// 2) 스크롤 위치에 따른 헤더 축소: 일정 간격마다 (throttle)
const onScroll = useThrottleFn(() => { compact.value = window.scrollY > 80 }, 100)
useEventListener(window, 'scroll', onScroll, { passive: true })

// 3) 창 크기에 따른 레이아웃 재계산: 끝난 뒤 한 번 (debounce)
useEventListener(window, 'resize', useDebounceFn(relayout, 150))

// 4) 급하지 않은 큰 정렬/집계: 브라우저가 한가할 때
function scheduleIdle(fn: () => void) {
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1000 }) : setTimeout(fn, 0)
}
watch(rows, () => scheduleIdle(() => { stats.value = compute(rows.value) }))

// 5) 입력 즉시 반영이 필요한 것(체크박스, 토글)은 조절하지 않는다. 서버 전송만 묶는다 (01번)
` },
        },
        {
          id: 'l8', short: `지연 로딩`,
          title: `모달, 에디터, 차트는 열 때 받고, 첫 화면 밖은 보일 때 받는다`,
          why: `첫 화면에서 안 보이는 것까지 첫 번들에 넣으면 첫 표시가 늦습니다. Lazy 컴포넌트와 가시성 트리거로 필요한 시점에 받습니다.`,
          single: { label: `✓ 패턴 모음`, code: String.raw`
<!-- 1) 열 때만: 모달 내용 -->
<BaseModal v-model="open" title="상품 편집">
  <LazyProductEditor v-if="open" :id="id" />        <!-- open 이 true 가 될 때 청크를 받는다 -->
</BaseModal>

<!-- 2) 보일 때: 긴 페이지 아래쪽 -->
<LazyReviewSection hydrate-on-visible />            <!-- Nuxt 3.16+: 보일 때 하이드레이션 -->
<LazyFooterMap hydrate-on-idle />

<!-- 3) 조건부로만: 권한 있는 사람만 -->
<LazyAdminPanel v-if="can('settings:write')" />

// 4) 라이브러리: 쓰는 함수 안에서
async function exportPdf() {
  const { default: jsPDF } = await import('jspdf')
  ...
}

// 5) 라우트 그룹: 관리자 페이지 전체를 별도 청크로 (Vite)
// vite.config.ts build.rollupOptions.output.manualChunks: (id) => id.includes('/pages/admin/') ? 'admin' : undefined
` },
        },
        {
          id: 'l9', short: `타임아웃 UI`,
          title: `느린 네트워크 대비: 3초 넘으면 안내, 10초 넘으면 취소 버튼`,
          why: `스피너만 영원히 돌면 사용자는 멈춘 줄 압니다. 시간이 지나면 "조금 더 걸립니다", 더 지나면 취소나 재시도를 제안합니다.`,
          single: { label: `✓ composables/useSlowHint.ts`, code: String.raw`
export function useSlowHint(active: Ref<boolean>, { slowAfter = 3000, stuckAfter = 10000 } = {}) {
  const phase = ref<'none' | 'slow' | 'stuck'>('none')
  let t1: any, t2: any
  watch(active, (on) => {
    clearTimeout(t1); clearTimeout(t2); phase.value = 'none'
    if (on) {
      t1 = setTimeout(() => { phase.value = 'slow' }, slowAfter)
      t2 = setTimeout(() => { phase.value = 'stuck' }, stuckAfter)
    }
  }, { immediate: true })
  onScopeDispose(() => { clearTimeout(t1); clearTimeout(t2) })
  return { phase }
}

// 사용
const { data, status, refresh } = useFetch('/api/report', { immediate: false })
const { next } = useAbortable()
const loading = computed(() => status.value === 'pending')
const { phase } = useSlowHint(loading)

<button @click="refresh">보고서 생성</button>
<div v-if="loading" class="wait">
  <Spinner />
  <p v-if="phase === 'slow'">조금 더 걸리고 있습니다…</p>
  <p v-else-if="phase === 'stuck'">응답이 없습니다. <button @click="refresh">다시 시도</button></p>
</div>
` },
        },
        {
          id: 'l10', short: `측정`,
          title: `Web Vitals 를 수집해 실제 사용자 속도를 본다`,
          why: `개발 PC 의 Lighthouse 점수와 사용자의 체감은 다릅니다. 실제 방문에서 LCP, INP, CLS 를 재서 보내고, 페이지별로 추적합니다.`,
          single: { label: `✓ plugins/vitals.client.ts`, code: String.raw`
import { onLCP, onINP, onCLS, onTTFB, type Metric } from 'web-vitals'

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const send = (m: Metric) => {
    const body = JSON.stringify({ name: m.name, value: Math.round(m.value * 1000) / 1000, rating: m.rating, id: m.id, path: route.path, nav: m.navigationType })
    navigator.sendBeacon?.('/api/vitals', body) ?? fetch('/api/vitals', { method: 'POST', body, keepalive: true })
  }
  onLCP(send); onINP(send); onCLS(send); onTTFB(send)
})

// server/api/vitals.post.ts: 로그로 남기거나 시계열 DB 로. 페이지별 p75 를 대시보드에
// 목표: LCP < 2.5s, INP < 200ms, CLS < 0.1 (p75)

// 개발 중 확인
//   npx nuxi analyze           번들 구성
//   Chrome DevTools > Performance, Lighthouse
//   npx unlighthouse --site https://...   전체 페이지 점수표
` },
        },
      ],
    },
    {
      id: 'practice-11', no: 11, name: `결제 연동`,
      lead: `PG 결제위젯으로 결제를 받는 전체 흐름입니다. 주문 생성, 위젯, 서버 승인, 실패 처리, 웹훅 검증, 상태 머신, 환불, 정기 결제, 테스트 환경 분리까지 다룹니다. 토스페이먼츠 결제위젯 기준이지만 다른 PG 도 구조는 같습니다.`,
      lessons: [
        {
          id: 'l1', short: `전체 흐름`,
          title: `금액은 서버가 정하고, 승인도 서버가 한다`,
          why: `프론트가 보낸 금액을 그대로 믿으면 1원 결제가 됩니다. 주문 생성과 승인은 서버, 프론트는 위젯을 띄우고 리다이렉트만 받습니다. 이 그림을 먼저 보고 나머지 항목을 읽으세요.`,
          lang: 'plain',
          single: { label: `✓ 흐름과 파일 구성`, code: String.raw`
[브라우저]                         [우리 서버 (Nitro)]                  [PG]
  1. 장바구니 → "결제하기"
     POST /api/orders  ───────────▶  금액 계산, orderId 발급, PENDING 저장
     ◀── { orderId, amount, orderName }
  2. 결제위젯 렌더 (clientKey)
     requestPayment({ orderId, amount, successUrl, failUrl })  ────────▶  카드사 인증
  3. successUrl?paymentKey&orderId&amount 로 리다이렉트
     POST /api/payments/confirm ──▶  주문 조회, amount 일치 검증
                                     PG 승인 API (secretKey) ──────────▶  승인
                                     PAID 로 전이, 결제 정보 저장
     ◀── { ok }                      (실패하면 FAILED + 사유)
  4. (비동기) 웹훅 ◀──────────────────────────────────────────────────  상태 변경 통지
                                     서명 검증, 멱등 처리, 상태 보정

파일
  server/api/orders.post.ts                 02번  주문 생성
  components/pay/PayWidget.vue              03번  위젯 렌더와 결제 요청
  pages/pay/success.vue, server/api/payments/confirm.post.ts   04번  승인
  pages/pay/fail.vue                        05번  실패/취소
  server/api/webhooks/pg.post.ts            06번  웹훅
  utils/orderState.ts                       07번  상태 머신
  server/api/payments/[key]/cancel.post.ts  08번  환불
  server/api/billing/*                      09번  정기 결제
  nuxt.config.ts runtimeConfig              10번  키와 환경

원칙 세 가지
  · secretKey 는 서버 환경변수에만. 브라우저에는 clientKey 만 간다
  · 승인 전에 "주문의 amount == 리다이렉트로 온 amount" 를 반드시 비교한다
  · 승인과 웹훅은 둘 다 올 수 있다. 상태 전이는 멱등하게
` },
        },
        {
          id: 'l2', short: `주문 생성`,
          title: `서버가 금액을 다시 계산해 주문을 만든다`,
          why: `장바구니 항목 id 만 받아 서버에서 가격, 할인, 배송비를 다시 계산합니다. 프론트가 계산한 금액은 표시용일 뿐입니다. orderId 는 PG 규칙(영문·숫자·-·_, 6~64자)에 맞춰 서버가 발급합니다.`,
          single: { label: `✓ server/api/orders.post.ts`, code: String.raw`
import { z } from 'zod'
import { customAlphabet } from 'nanoid'

const newOrderId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 12)   // 헷갈리는 글자 제외

const Body = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1),
  couponCode: z.string().optional(),
  addressId: z.string()
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)                        // 8회차 04번
  const body = Body.parse(await readBody(event))

  const products = await db.product.findMany({ where: { id: { in: body.items.map(i => i.productId) }, active: true } })
  if (products.length !== body.items.length) throw createError({ statusCode: 400, statusMessage: '판매 중이 아닌 상품이 있습니다' })

  // 금액은 여기서만 계산한다. 프론트 값은 받지도 않는다
  const lines = body.items.map((i) => {
    const p = products.find(x => x.id === i.productId)!
    if (p.stock < i.qty) throw createError({ statusCode: 409, statusMessage: '재고가 부족합니다: ' + p.name })
    return { productId: p.id, name: p.name, unitPrice: p.price, qty: i.qty, subtotal: p.price * i.qty }
  })
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0)
  const discount = body.couponCode ? await applyCoupon(body.couponCode, subtotal, user.id) : 0
  const shipping = subtotal - discount >= 50_000 ? 0 : 3_000
  const amount = subtotal - discount + shipping

  const order = await db.order.create({
    data: {
      id: 'ORD-' + newOrderId(), userId: user.id, status: 'PENDING',
      amount, subtotal, discount, shipping, addressId: body.addressId,
      orderName: lines.length === 1 ? lines[0].name : lines[0].name + ' 외 ' + (lines.length - 1) + '건',
      lines: { create: lines }
    }
  })
  // 위젯에 필요한 것만 돌려준다
  return { orderId: order.id, amount: order.amount, orderName: order.orderName, customerName: user.name, customerEmail: user.email }
})
` },
        },
        {
          id: 'l3', short: `결제위젯`,
          title: `SDK 는 클라이언트에서만 로드하고, 위젯은 컴포넌트가 감싼다`,
          why: `결제 SDK 는 window 가 필요하므로 SSR 에서 돌면 안 됩니다. onMounted 에서 스크립트를 로드하고 위젯을 그린 뒤, 결제하기 버튼이 requestPayment 를 부릅니다. 금액이 바뀌면 위젯에도 알려야 합니다.`,
          single: { label: `✓ components/pay/PayWidget.vue`, code: String.raw`
<script setup lang="ts">
import { loadScript } from '~/utils/loadScript'     // 17회차 01번과 같은 유틸

const props = defineProps<{ orderId: string; amount: number; orderName: string; customerEmail: string; customerName: string }>()
const emit = defineEmits<{ ready: []; error: [message: string] }>()
const { public: { tossClientKey } } = useRuntimeConfig()
const auth = useAuthStore()

const ready = ref(false)
const paying = ref(false)
let widgets: any = null

onMounted(async () => {
  try {
    await loadScript('https://js.tosspayments.com/v2/standard')
    const toss = (window as any).TossPayments(tossClientKey)
    widgets = toss.widgets({ customerKey: auth.user!.id })     // 비회원이면 TossPayments.ANONYMOUS
    await widgets.setAmount({ currency: 'KRW', value: props.amount })
    await Promise.all([
      widgets.renderPaymentMethods({ selector: '#pay-methods', variantKey: 'DEFAULT' }),
      widgets.renderAgreement({ selector: '#pay-agreement', variantKey: 'AGREEMENT' })
    ])
    ready.value = true
    emit('ready')
  } catch (e: any) {
    emit('error', e?.message ?? '결제 모듈을 불러오지 못했습니다')
  }
})

// 쿠폰 적용 등으로 금액이 바뀌면 위젯에도 반영한다 (안 하면 승인 단계에서 금액 불일치로 실패)
watch(() => props.amount, (v) => widgets?.setAmount({ currency: 'KRW', value: v }))

async function pay() {
  if (!widgets || paying.value) return
  paying.value = true
  try {
    await widgets.requestPayment({
      orderId: props.orderId, orderName: props.orderName,
      customerEmail: props.customerEmail, customerName: props.customerName,
      successUrl: location.origin + '/pay/success',            // 여기로 돌아온다 (04번)
      failUrl: location.origin + '/pay/fail'                   // 실패·취소 (05번)
    })
    // 리다이렉트되므로 이 아래는 보통 실행되지 않는다
  } catch (e: any) {
    paying.value = false
    if (e?.code === 'USER_CANCEL') return                      // 창 닫음: 오류 아님
    emit('error', e?.message ?? '결제 요청에 실패했습니다')
  }
}
defineExpose({ pay })
</script>

<template>
  <div>
    <div id="pay-methods" />
    <div id="pay-agreement" />
    <button class="btn-primary w-full" :disabled="!ready || paying" @click="pay">
      {{ paying ? '결제 창을 여는 중…' : amount.toLocaleString() + '원 결제하기' }}
    </button>
  </div>
</template>
` },
        },
        {
          id: 'l4', short: `서버 승인`,
          title: `성공 페이지는 서버에 승인을 요청하고, 서버는 금액을 대조한 뒤 PG 를 부른다`,
          why: `successUrl 로 돌아왔다고 결제가 끝난 게 아닙니다. 승인(confirm) 을 서버가 호출해야 실제로 돈이 빠집니다. 승인 전 금액 대조가 핵심이고, 같은 orderId 로 두 번 눌려도 한 번만 승인되게 합니다.`,
          single: { label: `✓ pages/pay/success.vue + server/api/payments/confirm.post.ts`, code: String.raw`
<!-- pages/pay/success.vue -->
<script setup lang="ts">
const route = useRoute()
const { $api } = useNuxtApp()
const state = ref<'confirming' | 'done' | 'error'>('confirming')
const message = ref('')

onMounted(async () => {
  const { paymentKey, orderId, amount } = route.query as Record<string, string>
  if (!paymentKey || !orderId || !amount) return navigateTo('/pay/fail?code=INVALID_PARAMS')
  try {
    await $api('/api/payments/confirm', { method: 'POST', body: { paymentKey, orderId, amount: Number(amount) } })
    state.value = 'done'
    history.replaceState(null, '', '/pay/success')            // 새로고침해도 재승인 요청이 가지 않게 쿼리 제거
  } catch (e: any) {
    state.value = 'error'; message.value = userMessage(toApiError(e))
  }
})
</script>
<template>
  <div class="center">
    <p v-if="state === 'confirming'">결제를 확인하고 있습니다…</p>
    <template v-else-if="state === 'done'"><h1>결제가 완료되었습니다</h1><NuxtLink to="/orders">주문 내역 보기</NuxtLink></template>
    <template v-else><h1>결제를 완료하지 못했습니다</h1><p>{{ message }}</p><NuxtLink to="/cart">장바구니로</NuxtLink></template>
  </div>
</template>

// server/api/payments/confirm.post.ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { paymentKey, orderId, amount } = await readBody<{ paymentKey: string; orderId: string; amount: number }>(event)
  const { tossSecretKey } = useRuntimeConfig()

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== user.id) throw createError({ statusCode: 404, statusMessage: '주문을 찾을 수 없습니다' })
  if (order.status === 'PAID') return { ok: true, already: true }           // 멱등: 새로고침, 뒤로가기
  if (order.status !== 'PENDING') throw createError({ statusCode: 409, statusMessage: '승인할 수 없는 주문 상태입니다' })
  if (order.amount !== amount) {                                              // 핵심: 금액 대조
    await db.order.update({ where: { id: orderId }, data: { status: 'FAILED', failReason: 'AMOUNT_MISMATCH' } })
    throw createError({ statusCode: 400, statusMessage: '결제 금액이 주문 금액과 다릅니다' })
  }

  // 동시에 두 번 들어와도 한 번만 승인되도록 상태를 먼저 선점한다
  const claimed = await db.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'CONFIRMING' } })
  if (claimed.count === 0) throw createError({ statusCode: 409, statusMessage: '이미 처리 중인 주문입니다' })

  try {
    const res = await $fetch<any>('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(tossSecretKey + ':').toString('base64') },
      body: { paymentKey, orderId, amount }
    })
    await db.$transaction([
      db.order.update({ where: { id: orderId }, data: { status: 'PAID', paidAt: new Date(res.approvedAt) } }),
      db.payment.create({ data: { orderId, paymentKey, method: res.method, amount: res.totalAmount, raw: res } }),
      ...(await decreaseStock(orderId))
    ])
    return { ok: true }
  } catch (e: any) {
    const code = e?.data?.code ?? 'CONFIRM_FAILED'
    await db.order.update({ where: { id: orderId }, data: { status: 'FAILED', failReason: code } })
    throw createError({ statusCode: 402, statusMessage: e?.data?.message ?? '결제 승인에 실패했습니다', data: { code } })
  }
})
` },
        },
        {
          id: 'l5', short: `실패와 취소`,
          title: `failUrl 은 사용자 취소와 진짜 실패를 구분해 보여 준다`,
          why: `사용자가 결제창을 닫은 것은 오류가 아닙니다. PG 가 붙여 주는 code 로 문구를 고르고, 주문은 PENDING 으로 남겨 다시 시도할 수 있게 합니다. 한도 초과처럼 카드 문제는 다른 수단을 권합니다.`,
          single: { label: `✓ pages/pay/fail.vue`, code: String.raw`
<script setup lang="ts">
const route = useRoute()
const code = String(route.query.code ?? '')
const orderId = String(route.query.orderId ?? '')

const MESSAGES: Record<string, { title: string; hint?: string; retry: boolean }> = {
  USER_CANCEL:            { title: '결제를 취소했습니다', retry: true },
  PAY_PROCESS_CANCELED:   { title: '결제를 취소했습니다', retry: true },
  PAY_PROCESS_ABORTED:    { title: '결제가 중단되었습니다', hint: '잠시 후 다시 시도해 주세요', retry: true },
  REJECT_CARD_COMPANY:    { title: '카드사에서 승인을 거절했습니다', hint: '다른 카드나 결제 수단을 이용해 주세요', retry: true },
  EXCEED_MAX_DAILY_PAYMENT_COUNT: { title: '일일 결제 한도를 초과했습니다', retry: false },
  INVALID_CARD_EXPIRATION: { title: '카드 유효기간이 올바르지 않습니다', retry: true },
  AMOUNT_MISMATCH:        { title: '결제 금액이 바뀌었습니다', hint: '장바구니에서 금액을 확인한 뒤 다시 결제해 주세요', retry: false },
  INVALID_PARAMS:         { title: '잘못된 접근입니다', retry: false }
}
const info = MESSAGES[code] ?? { title: '결제에 실패했습니다', hint: route.query.message as string, retry: true }
const isCancel = code === 'USER_CANCEL' || code === 'PAY_PROCESS_CANCELED'

onMounted(() => {
  // 취소는 로그만, 실패는 리포트 (9회차 01번)
  if (!isCancel) report(new Error('payment failed: ' + code), { orderId, message: route.query.message })
})
</script>

<template>
  <div class="center">
    <h1>{{ info.title }}</h1>
    <p v-if="info.hint" class="muted">{{ info.hint }}</p>
    <p v-if="!isCancel && code" class="tiny muted">오류 코드: {{ code }}</p>
    <div class="row">
      <NuxtLink v-if="info.retry && orderId" :to="'/checkout?orderId=' + orderId" class="btn-primary">다시 결제하기</NuxtLink>
      <NuxtLink to="/cart" class="btn">장바구니로</NuxtLink>
    </div>
  </div>
</template>
` },
        },
        {
          id: 'l6', short: `웹훅 검증`,
          title: `웹훅은 서명을 검증하고, 같은 이벤트는 한 번만 처리하고, 빨리 200 을 준다`,
          why: `웹훅 주소는 공개되어 있으니 누구나 POST 를 보낼 수 있습니다. 서명 검증이 없으면 가짜 "결제 완료" 를 받게 됩니다. PG 는 응답이 늦으면 같은 이벤트를 다시 보내므로 eventId 로 멱등 처리하고 무거운 일은 응답 뒤에 합니다.`,
          single: { label: `✓ server/api/webhooks/pg.post.ts`, code: String.raw`
import { createHmac, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { pgWebhookSecret } = useRuntimeConfig()
  const raw = await readRawBody(event, 'utf8')                               // 서명은 원문 기준. readBody 로 파싱하면 안 된다
  if (!raw) throw createError({ statusCode: 400 })

  // 1) 서명 검증 (PG 마다 헤더 이름·방식이 다르다. 문서대로)
  const given = getHeader(event, 'x-pg-signature') ?? ''
  const expected = createHmac('sha256', pgWebhookSecret).update(raw).digest('hex')
  if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    throw createError({ statusCode: 401, statusMessage: 'bad signature' })
  }

  const payload = JSON.parse(raw) as { eventId: string; eventType: string; data: { orderId: string; paymentKey: string; status: string } }

  // 2) 멱등: 같은 eventId 는 두 번 처리하지 않는다 (unique 제약으로 경합도 막는다)
  try {
    await db.webhookEvent.create({ data: { id: payload.eventId, type: payload.eventType, payload } })
  } catch (e: any) {
    if (e.code === 'P2002') return { ok: true, duplicate: true }
    throw e
  }

  // 3) 처리. 승인 API 결과와 경쟁할 수 있으니 상태 전이는 07번 transition 으로
  const { orderId, status } = payload.data
  switch (status) {
    case 'DONE':     await transition(orderId, 'PAID', { source: 'webhook' }); break
    case 'CANCELED': await transition(orderId, 'REFUNDED', { source: 'webhook' }); break
    case 'ABORTED':
    case 'EXPIRED':  await transition(orderId, 'FAILED', { source: 'webhook', reason: status }); break
    default:         console.warn('[webhook] unhandled status', status)
  }

  // 4) 메일, 재고, 알림 같은 느린 일은 응답을 막지 않는다
  event.waitUntil?.(afterPaymentJobs(orderId)) ?? afterPaymentJobs(orderId).catch(report)
  return { ok: true }
})

// 로컬 개발: 웹훅이 localhost 로 못 오므로 터널을 쓴다
//   npx cloudflared tunnel --url http://localhost:3000   (또는 ngrok)
//   PG 콘솔의 웹훅 주소를 https://xxxx.trycloudflare.com/api/webhooks/pg 로
` },
        },
        {
          id: 'l7', short: `상태 머신`,
          title: `허용된 전이만 표로 두고, 모든 상태 변경은 transition() 을 거친다`,
          why: `PAID 에서 PENDING 으로 돌아가거나, 환불된 주문이 다시 PAID 가 되는 일은 승인·웹훅·관리자 수정이 뒤섞이면 실제로 일어납니다. 전이 표 하나로 막고, 전이 기록도 남깁니다. 프론트는 같은 표로 배지를 그립니다.`,
          single: { label: `✓ shared/orderState.ts (서버·프론트 공용)`, code: String.raw`
export type OrderStatus = 'PENDING' | 'CONFIRMING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED' | 'REFUNDED' | 'FAILED'

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ['CONFIRMING', 'PAID', 'FAILED', 'CANCELED'],
  CONFIRMING: ['PAID', 'FAILED'],
  PAID:       ['PREPARING', 'REFUNDED', 'PAID'],       // PAID→PAID: 승인과 웹훅이 둘 다 올 때 무해하게 통과
  PREPARING:  ['SHIPPED', 'REFUNDED'],
  SHIPPED:    ['DELIVERED'],
  DELIVERED:  ['REFUNDED'],
  CANCELED: [], REFUNDED: [], FAILED: ['PENDING']      // 실패한 주문은 재시도 가능
}

export const LABELS: Record<OrderStatus, { text: string; tone: 'gray' | 'blue' | 'green' | 'red' | 'amber' }> = {
  PENDING: { text: '결제 대기', tone: 'gray' }, CONFIRMING: { text: '승인 중', tone: 'amber' },
  PAID: { text: '결제 완료', tone: 'blue' }, PREPARING: { text: '상품 준비 중', tone: 'blue' },
  SHIPPED: { text: '배송 중', tone: 'blue' }, DELIVERED: { text: '배송 완료', tone: 'green' },
  CANCELED: { text: '취소', tone: 'gray' }, REFUNDED: { text: '환불', tone: 'red' }, FAILED: { text: '결제 실패', tone: 'red' }
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false
}

// server/utils/orderTransition.ts
export async function transition(orderId: string, to: OrderStatus, meta: Record<string, unknown> = {}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } })
    if (!order) throw createError({ statusCode: 404 })
    const from = order.status as OrderStatus
    if (from === to) return order                                     // 멱등
    if (!canTransition(from, to)) {
      console.warn('[order] illegal transition', orderId, from, '->', to, meta)
      throw createError({ statusCode: 409, statusMessage: from + ' 에서 ' + to + ' 로 바꿀 수 없습니다' })
    }
    await tx.orderHistory.create({ data: { orderId, from, to, meta } })
    return tx.order.update({ where: { id: orderId }, data: { status: to, ...(to === 'PAID' && { paidAt: new Date() }) } })
  })
}

<!-- 프론트: components/OrderStatusBadge.vue -->
<script setup lang="ts">
import { LABELS, type OrderStatus } from '~/shared/orderState'
const props = defineProps<{ status: OrderStatus }>()
const label = computed(() => LABELS[props.status])
</script>
<template><span class="badge" :class="'tone-' + label.tone">{{ label.text }}</span></template>
` },
        },
        {
          id: 'l8', short: `환불과 취소`,
          title: `환불은 멱등키를 붙여 PG 에 요청하고, 부분 환불 누적을 관리한다`,
          why: `환불 버튼을 두 번 누르면 두 번 환불될 수 있습니다. PG 의 멱등키 헤더를 쓰고, 부분 환불은 남은 금액을 넘지 못하게 서버에서 막습니다. 상태는 전액 환불 때만 REFUNDED 로 갑니다.`,
          single: { label: `✓ server/api/payments/[key]/cancel.post.ts + 프론트 호출`, code: String.raw`
// server/api/payments/[key]/cancel.post.ts
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

const Body = z.object({ reason: z.string().min(1).max(200), amount: z.number().int().positive().optional() })  // amount 없으면 전액

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const paymentKey = getRouterParam(event, 'key')!
  const body = Body.parse(await readBody(event))
  const { tossSecretKey } = useRuntimeConfig()

  const payment = await db.payment.findUnique({ where: { paymentKey }, include: { order: true } })
  if (!payment) throw createError({ statusCode: 404 })
  const isOwner = payment.order.userId === user.id
  if (!isOwner && !can(user, 'order:refund')) throw createError({ statusCode: 403 })     // 8회차 01번
  if (isOwner && !['PAID', 'PREPARING'].includes(payment.order.status)) {
    throw createError({ statusCode: 409, statusMessage: '배송이 시작된 주문은 고객센터로 문의해 주세요' })
  }

  const refundable = payment.amount - payment.refunded
  const amount = body.amount ?? refundable
  if (amount > refundable) throw createError({ statusCode: 400, statusMessage: '환불 가능 금액은 ' + refundable.toLocaleString() + '원입니다' })

  const idempotencyKey = randomUUID()                      // 같은 요청의 재시도에는 같은 키를 쓰는 것이 더 좋다 (요청 레코드에 저장)
  const res = await $fetch<any>('https://api.tosspayments.com/v1/payments/' + paymentKey + '/cancel', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(tossSecretKey + ':').toString('base64'), 'Idempotency-Key': idempotencyKey },
    body: { cancelReason: body.reason, cancelAmount: amount }
  })

  const full = amount === refundable
  await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { paymentKey }, data: { refunded: { increment: amount } } })
    await tx.refund.create({ data: { paymentKey, amount, reason: body.reason, by: user.id, idempotencyKey, raw: res } })
    if (full) await transition(payment.orderId, 'REFUNDED', { by: user.id })
  })
  return { ok: true, refunded: payment.refunded + amount, full }
})

// 프론트: 확인 모달 (5회차 02번) 을 거쳐 한 번만
async function refund(order: Order) {
  const reason = await prompt({ title: '환불 사유', placeholder: '단순 변심 등' })
  if (!reason) return
  if (!(await confirm({ title: order.amount.toLocaleString() + '원을 환불할까요?', danger: true }))) return
  await asyncAction(() => $api('/api/payments/' + order.paymentKey + '/cancel', { method: 'POST', body: { reason } }), { success: '환불이 접수되었습니다' })
  refresh()
}
` },
        },
        {
          id: 'l9', short: `정기 결제`,
          title: `빌링키는 서버가 발급받아 저장하고, 청구는 스케줄러가 한다`,
          why: `구독은 카드 정보를 저장하지 않고 빌링키(카드 토큰) 만 저장합니다. 매월 청구는 서버 작업이 돌고, 실패하면 며칠 뒤 재시도한 뒤 안내 메일을 보냅니다. 사용자는 카드 변경과 해지만 합니다.`,
          single: { label: `✓ server/api/billing/* + server/tasks/charge.ts`, code: String.raw`
// 1) 프론트: 카드 등록 창을 열고 successUrl 로 authKey 를 받는다
await toss.requestBillingAuth({ method: 'CARD', customerKey: auth.user.id, successUrl: origin + '/billing/success', failUrl: origin + '/billing/fail' })

// 2) server/api/billing/register.post.ts — authKey → billingKey 교환, 카드 정보는 마스킹된 것만 저장
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { authKey } = await readBody<{ authKey: string }>(event)
  const res = await pg('/v1/billing/authorizations/issue', { method: 'POST', body: { authKey, customerKey: user.id } })
  await db.billingMethod.upsert({
    where: { userId: user.id },
    create: { userId: user.id, billingKey: res.billingKey, cardCompany: res.card.company, cardLast4: res.card.number.slice(-4) },
    update: { billingKey: res.billingKey, cardCompany: res.card.company, cardLast4: res.card.number.slice(-4) }
  })
  return { ok: true, card: res.card.company + ' ' + res.card.number.slice(-4) }
})

// 3) server/tasks/charge.ts — 매일 새벽 실행 (Nitro scheduledTasks 또는 외부 cron)
export default defineTask({
  meta: { name: 'billing:charge' },
  async run() {
    const due = await db.subscription.findMany({ where: { status: 'ACTIVE', nextBillingAt: { lte: new Date() } }, include: { user: { include: { billingMethod: true } } } })
    for (const sub of due) {
      const orderId = 'SUB-' + sub.id + '-' + formatDate(sub.nextBillingAt, 'yyyyMM')     // 월별 고정: 재실행돼도 같은 orderId → PG 가 중복 거절
      try {
        const res = await pg('/v1/billing/' + sub.user.billingMethod.billingKey, {
          method: 'POST', body: { customerKey: sub.userId, amount: sub.plan.price, orderId, orderName: sub.plan.name + ' 월 구독' }
        })
        await db.subscription.update({ where: { id: sub.id }, data: { nextBillingAt: addMonths(sub.nextBillingAt, 1), failCount: 0, lastPaymentKey: res.paymentKey } })
      } catch (e: any) {
        const failCount = sub.failCount + 1
        if (failCount >= 3) {
          await db.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE', failCount } })
          await sendMail(sub.user.email, 'subscription-past-due', { plan: sub.plan.name })
        } else {
          await db.subscription.update({ where: { id: sub.id }, data: { nextBillingAt: addDays(new Date(), 3), failCount } })   // 3일 뒤 재시도
          await sendMail(sub.user.email, 'subscription-retry', { plan: sub.plan.name, code: e?.data?.code })
        }
      }
    }
    return { result: due.length }
  }
})
// nuxt.config.ts: nitro: { experimental: { tasks: true }, scheduledTasks: { '0 4 * * *': ['billing:charge'] } }

// 4) 해지: 즉시가 아니라 "현재 결제 주기 끝까지 유지" 가 보통
//    status: 'CANCEL_AT_PERIOD_END', 청구 작업에서 nextBillingAt 지나면 'CANCELED' 로
` },
        },
        {
          id: 'l10', short: `환경과 테스트`,
          title: `테스트 키와 운영 키를 환경변수로 가르고, 결제 체크리스트를 둔다`,
          why: `운영 키로 로컬에서 결제 테스트를 하면 실제 돈이 나갑니다. 키는 환경별 변수로만 들어오고, secret 은 runtimeConfig 비공개 영역에 둡니다. 출시 전에 아래 체크리스트를 한 번 돕니다.`,
          single: { label: `✓ nuxt.config.ts + .env + 체크리스트`, code: String.raw`
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    tossSecretKey: '',                  // NUXT_TOSS_SECRET_KEY   (서버 전용)
    pgWebhookSecret: '',                // NUXT_PG_WEBHOOK_SECRET
    public: {
      tossClientKey: ''                 // NUXT_PUBLIC_TOSS_CLIENT_KEY  (브라우저로 간다)
    }
  }
})

// .env.development          .env.production (CI/호스팅의 secret 으로 주입, 저장소에 두지 않는다)
// NUXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_...     live_gck_...
// NUXT_TOSS_SECRET_KEY=test_gsk_...            live_gsk_...
//
// 키 접두어로 실수 방지: 서버 시작 시 검사
if (process.env.NODE_ENV !== 'production' && useRuntimeConfig().tossSecretKey.startsWith('live_')) {
  throw new Error('개발 환경에서 운영 결제 키가 설정되어 있습니다')
}

// server/utils/pg.ts — PG 호출을 한 곳으로 (인증 헤더, 오류 변환, 로그)
export const pg = $fetch.create({
  baseURL: 'https://api.tosspayments.com',
  onRequest({ options }) {
    options.headers = { ...options.headers, Authorization: 'Basic ' + Buffer.from(useRuntimeConfig().tossSecretKey + ':').toString('base64') }
  },
  onResponseError({ response }) { console.error('[pg]', response.status, response._data?.code, response._data?.message) }
})

/* 출시 전 체크리스트
 [ ] 승인 API 에서 amount 를 주문과 대조한다 (04번)
 [ ] 승인·웹훅·환불 모두 transition() 을 거친다 (07번)
 [ ] 웹훅 서명 검증 + eventId 멱등 (06번), 운영 웹훅 주소 등록
 [ ] 테스트 카드로: 성공 / 사용자 취소 / 한도 초과 / 금액 변조(쿼리 amount 수정) 각각 확인
 [ ] 새로고침·뒤로가기로 success 페이지 재진입 시 재승인 요청이 가지 않는다
 [ ] 결제 완료 메일·재고 차감은 한 번만 (afterPaymentJobs 멱등)
 [ ] secret 키가 번들에 없다: grep -r "gsk_" .output/public
 [ ] 환불 권한 (본인 + order:refund), 부분 환불 누적 한도
 [ ] 운영 전환 후 100원 실결제 → 환불로 끝까지 확인
*/
` },
        },
      ],
    },
    {
      id: 'practice-12', no: 12, name: `검색과 자동완성`,
      lead: `검색창 하나에 들어가는 것들입니다. 디바운스와 경쟁 조건, 키보드로 되는 자동완성, 하이라이트, 최근·인기 검색어, URL 과 동기화되는 결과 페이지, 패싯 필터, 오타 제안, 서버 검색 API, 측정까지.`,
      lessons: [
        {
          id: 'l1', short: `useSearch`,
          title: `디바운스 + 이전 요청 취소 + 늦게 온 응답 버리기`,
          why: `"ab" 의 응답이 "abc" 의 응답보다 늦게 오면 화면이 과거로 돌아갑니다. 입력마다 이전 요청을 abort 하고, 그래도 끝난 응답은 순번으로 걸러 냅니다. 2글자 미만은 요청하지 않습니다.`,
          single: { label: `✓ composables/useSearch.ts`, code: String.raw`
import { refDebounced } from '@vueuse/core'

export function useSearch<T>(fetcher: (q: string, signal: AbortSignal) => Promise<T[]>, opts: { min?: number; delay?: number } = {}) {
  const { min = 2, delay = 200 } = opts
  const query = ref('')
  const debounced = refDebounced(query, delay)
  const results = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)

  let controller: AbortController | null = null
  let seq = 0

  watch(debounced, async (q) => {
    q = q.trim()
    controller?.abort()                                 // 이전 요청 취소
    if (q.length < min) { results.value = []; loading.value = false; return }

    controller = new AbortController()
    const my = ++seq
    loading.value = true; error.value = null
    try {
      const list = await fetcher(q, controller.signal)
      if (my !== seq) return                            // 취소가 안 먹은 늦은 응답: 버린다
      results.value = list
    } catch (e: any) {
      if (e.name === 'AbortError' || e.code === 'CANCELED') return
      if (my === seq) error.value = '검색에 실패했습니다'
    } finally {
      if (my === seq) loading.value = false
    }
  })

  function clear() { query.value = ''; results.value = [] }
  return { query, results, loading, error, clear }
}

// 사용
const { query, results, loading } = useSearch((q, signal) =>
  $api<Product[]>('/api/search/suggest', { query: { q, limit: 8 }, signal })
)
` },
        },
        {
          id: 'l2', short: `자동완성 UI`,
          title: `키보드로 다 되는 콤보박스: ↑↓ 이동, Enter 선택, Esc 닫기, 바깥 클릭 닫기`,
          why: `마우스로만 되는 자동완성은 반쪽입니다. role=combobox / listbox / option 과 aria-activedescendant 를 붙이면 스크린리더도 읽습니다. 선택 시 입력값을 바꾸고 드롭다운을 닫습니다.`,
          single: { label: `✓ components/SearchBox.vue`, code: String.raw`
<script setup lang="ts" generic="T extends { id: string; label: string }">
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{ items: T[]; loading?: boolean; placeholder?: string }>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ select: [item: T]; submit: [query: string] }>()

const root = useTemplateRef('root')
const open = ref(false)
const active = ref(-1)
const listId = useId()

watch(() => props.items, () => { active.value = -1; open.value = props.items.length > 0 })
onClickOutside(root, () => (open.value = false))

function move(d: 1 | -1) {
  if (!open.value) { open.value = props.items.length > 0; return }
  const n = props.items.length
  active.value = n ? (active.value + d + n) % n : -1
  nextTick(() => document.getElementById(listId + '-' + active.value)?.scrollIntoView({ block: 'nearest' }))
}
function choose(i: number) {
  const item = props.items[i]
  if (!item) return
  model.value = item.label
  open.value = false
  emit('select', item)
}
function onEnter() {
  if (open.value && active.value >= 0) return choose(active.value)
  open.value = false
  emit('submit', model.value.trim())
}
</script>

<template>
  <div ref="root" class="searchbox" role="combobox" :aria-expanded="open" :aria-owns="listId" aria-haspopup="listbox">
    <input
      v-model="model" type="search" autocomplete="off" :placeholder="placeholder"
      aria-autocomplete="list" :aria-controls="listId" :aria-activedescendant="active >= 0 ? listId + '-' + active : undefined"
      @focus="open = items.length > 0" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="onEnter" @keydown.esc="open = false"
    >
    <span v-if="loading" class="spinner" aria-hidden="true" />
    <ul v-show="open" :id="listId" role="listbox" class="dropdown">
      <li
        v-for="(item, i) in items" :key="item.id" :id="listId + '-' + i" role="option"
        :aria-selected="i === active" :class="{ active: i === active }"
        @mousedown.prevent="choose(i)" @mousemove="active = i"
      >
        <slot name="item" :item="item" :query="model"><span v-html="highlight(item.label, model)" /></slot>
      </li>
    </ul>
  </div>
</template>
<!-- mousedown.prevent: 클릭으로 input 의 blur 가 먼저 일어나 목록이 닫히는 것을 막는다 -->
` },
        },
        {
          id: 'l3', short: `하이라이트`,
          title: `일치 부분만 mark 로 감싸되, 먼저 escape 하고 나서 감싼다`,
          why: `v-html 에 사용자 텍스트를 넣을 때 escape 를 빼먹으면 XSS 입니다. 텍스트를 먼저 escape 하고 쿼리도 정규식 특수문자를 escape 한 뒤 감쌉니다. 여러 단어는 각각 표시합니다.`,
          single: { label: `✓ utils/highlight.ts`, code: String.raw`
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const escRe = (s: string) => s.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')

export function highlight(text: string, query: string, tag = 'mark'): string {
  const safe = esc(text)
  const words = query.trim().split(/\s+/).filter(Boolean).map(escRe)
  if (!words.length) return safe
  const re = new RegExp('(' + words.join('|') + ')', 'gi')
  return safe.replace(re, '<' + tag + '>$1</' + tag + '>')
}
// highlight('Vue 3 & Nuxt', 'nuxt vue')  →  '<mark>Vue</mark> 3 &amp; <mark>Nuxt</mark>'

// v-html 대신 컴포넌트로 쓰고 싶으면: 조각으로 쪼개 렌더 (escape 걱정이 없다)
export function splitHighlight(text: string, query: string): { text: string; hit: boolean }[] {
  const words = query.trim().split(/\s+/).filter(Boolean).map(escRe)
  if (!words.length) return [{ text, hit: false }]
  const re = new RegExp('(' + words.join('|') + ')', 'gi')
  return text.split(re).filter(Boolean).map((part) => ({ text: part, hit: re.test(part) && (re.lastIndex = 0, true) }))
}

<!-- components/Highlight.vue -->
<script setup lang="ts">
const props = defineProps<{ text: string; query: string }>()
const parts = computed(() => splitHighlight(props.text, props.query))
</script>
<template>
  <span><template v-for="(p, i) in parts" :key="i"><mark v-if="p.hit">{{ p.text }}</mark><template v-else>{{ p.text }}</template></template></span>
</template>

/* 한글 초성 검색이 필요하면 (ㅇㅈ → 인증) */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
export function toChosung(s: string) {
  return [...s].map((ch) => { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch }).join('')
}
export const matchesChosung = (text: string, q: string) => /^[ㄱ-ㅎ]+$/.test(q) && toChosung(text).includes(q)
` },
        },
        {
          id: 'l4', short: `최근 검색어`,
          title: `최근 검색어는 localStorage 에 최대 10개, 중복은 맨 앞으로`,
          why: `비로그인에도 동작해야 하므로 localStorage 가 맞습니다. 같은 검색어는 지우고 맨 앞에 다시 넣습니다. 개별 삭제와 전체 삭제, 그리고 "저장 안 함" 설정을 둡니다.`,
          single: { label: `✓ composables/useRecentSearches.ts`, code: String.raw`
import { useLocalStorage } from '@vueuse/core'

const KEY = 'search:recent'
const MAX = 10

export function useRecentSearches() {
  const list = useLocalStorage<string[]>(KEY, [])                 // SSR 에서는 초기값 [] 로 그려지고 클라이언트에서 채워진다
  const enabled = useLocalStorage('search:recent:enabled', true)

  function add(q: string) {
    q = q.trim()
    if (!q || !enabled.value) return
    list.value = [q, ...list.value.filter((x) => x !== q)].slice(0, MAX)
  }
  function remove(q: string) { list.value = list.value.filter((x) => x !== q) }
  function clear() { list.value = [] }
  return { list, enabled, add, remove, clear }
}

<!-- 검색창 포커스 시 입력이 비어 있으면 최근 검색어 패널 -->
<script setup lang="ts">
const recent = useRecentSearches()
const { query } = useSearch(...)
const showRecent = computed(() => focused.value && !query.value.trim() && recent.list.value.length > 0)
function submit(q: string) { recent.add(q); navigateTo({ path: '/search', query: { q } }) }
</script>
<template>
  <ClientOnly>                                                     <!-- localStorage 값은 클라이언트에서만 -->
    <div v-if="showRecent" class="dropdown">
      <div class="row between"><b>최근 검색어</b><button class="link" @click="recent.clear()">전체 삭제</button></div>
      <ul>
        <li v-for="q in recent.list.value" :key="q" class="row between">
          <button class="grow text-left" @mousedown.prevent="submit(q)">{{ q }}</button>
          <button aria-label="삭제" @mousedown.prevent="recent.remove(q)">×</button>
        </li>
      </ul>
      <label class="tiny"><input v-model="recent.enabled.value" type="checkbox"> 최근 검색어 저장</label>
    </div>
  </ClientOnly>
</template>
` },
        },
        {
          id: 'l5', short: `인기 검색어`,
          title: `검색 로그를 서버에 쌓고, 인기 검색어는 캐시된 집계로 준다`,
          why: `인기 검색어는 매 요청마다 집계하면 무겁습니다. 검색 제출을 로그 테이블에 남기고, 집계 결과는 5분 캐시합니다. 로그에는 결과 수도 남겨 "결과 0건 검색어" 를 뽑을 수 있게 합니다.`,
          single: { label: `✓ server/api/search/popular.get.ts + 로그 적재`, code: String.raw`
// server/api/search/log.post.ts — 검색 제출마다 (응답은 기다리지 않는다, 10번 참고)
export default defineEventHandler(async (event) => {
  const { q, count } = await readBody<{ q: string; count: number }>(event)
  const term = q.trim().toLowerCase().slice(0, 100)
  if (!term) return
  await db.searchLog.create({ data: { term, count, userId: event.context.user?.id ?? null } })
  return null
})

// server/api/search/popular.get.ts — 최근 7일, 5분 캐시
export default cachedEventHandler(async () => {
  const since = new Date(Date.now() - 7 * 86_400_000)
  const rows = await db.searchLog.groupBy({
    by: ['term'], where: { createdAt: { gte: since }, count: { gt: 0 } },       // 결과 없는 검색어는 제외
    _count: { term: true }, orderBy: { _count: { term: 'desc' } }, take: 10
  })
  const blocked = await getBlockedTerms()                                        // 운영자가 뺀 단어
  return rows.filter((r) => !blocked.has(r.term)).map((r, i) => ({ rank: i + 1, term: r.term, count: r._count.term }))
}, { maxAge: 300, name: 'search-popular', getKey: () => 'all' })

// 결과 0건 검색어 (운영 대시보드용): 상품 등록·동의어 추가의 근거가 된다
export const zeroResultTerms = () => db.searchLog.groupBy({
  by: ['term'], where: { count: 0, createdAt: { gte: lastWeek() } }, _count: { term: true }, orderBy: { _count: { term: 'desc' } }, take: 50
})

<!-- 프론트 -->
<script setup lang="ts">
const { data: popular } = await useFetch('/api/search/popular', { server: true, default: () => [] })
</script>
<template>
  <ol class="popular">
    <li v-for="p in popular" :key="p.term">
      <NuxtLink :to="{ path: '/search', query: { q: p.term } }"><b>{{ p.rank }}</b> {{ p.term }}</NuxtLink>
    </li>
  </ol>
</template>
` },
        },
        {
          id: 'l6', short: `결과 페이지와 URL`,
          title: `검색 상태는 URL 쿼리가 원본이다: 뒤로가기, 공유, 새로고침이 다 된다`,
          why: `q, 정렬, 페이지, 필터를 ref 로 들고 있으면 새로고침에 날아가고 링크 공유도 안 됩니다. URL 쿼리를 읽어 상태를 만들고, 바꾸면 router.replace 로 URL 을 바꾸고, useFetch 는 URL 을 watch 합니다.`,
          single: { label: `✓ pages/search.vue`, code: String.raw`
<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// URL → 상태 (한 곳에서 파싱·기본값)
const params = computed(() => ({
  q: String(route.query.q ?? '').trim(),
  page: Math.max(1, Number(route.query.page) || 1),
  sort: ['relevance', 'price_asc', 'price_desc', 'newest'].includes(String(route.query.sort)) ? String(route.query.sort) : 'relevance',
  category: toArray(route.query.category),
  brand: toArray(route.query.brand),
  minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined,
  maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined
}))

// 상태 → URL (빈 값은 지운다, 조건이 바뀌면 page 는 1 로)
function update(patch: Partial<typeof params.value>) {
  const next: Record<string, any> = { ...route.query, ...patch }
  if (!('page' in patch)) next.page = undefined
  for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === '' || (Array.isArray(next[k]) && !next[k].length) || next[k] === 1 && k === 'page') delete next[k]
  router.replace({ query: next })                      // push 로 하면 글자마다 히스토리가 쌓인다
}

const { data, status } = await useFetch('/api/search', {
  query: params,                                       // computed 를 넘기면 바뀔 때마다 다시 요청
  watch: [params],
  default: () => ({ items: [], total: 0, facets: {} })
})

useSeoMeta({ title: () => (params.value.q ? '"' + params.value.q + '" 검색 결과' : '검색'), robots: 'noindex' })

const { add: addRecent } = useRecentSearches()
watch(() => params.value.q, (q) => q && addRecent(q), { immediate: true })
</script>

<template>
  <div class="search-page">
    <SearchBox :model-value="params.q" @submit="(q) => update({ q })" />
    <div class="row between">
      <p>{{ data.total.toLocaleString() }}건</p>
      <select :value="params.sort" @change="update({ sort: ($event.target as HTMLSelectElement).value })">
        <option value="relevance">정확도순</option><option value="newest">최신순</option>
        <option value="price_asc">낮은 가격순</option><option value="price_desc">높은 가격순</option>
      </select>
    </div>
    <div class="cols">
      <FacetFilter :facets="data.facets" :selected="params" @change="update" />     <!-- 07번 -->
      <ProductGrid :items="data.items" :loading="status === 'pending'" />
      <EmptySearch v-if="status === 'success' && !data.items.length" :query="params.q" @suggest="(q) => update({ q })" />  <!-- 08번 -->
    </div>
    <Pagination :page="params.page" :total="data.total" :per-page="24" @change="(page) => update({ page })" />
  </div>
</template>
` },
        },
        {
          id: 'l7', short: `패싯 필터`,
          title: `패싯은 서버가 개수와 함께 주고, 선택은 URL 배열 쿼리로`,
          why: `"브랜드 (12)" 처럼 개수가 보여야 쓸모 있는 필터입니다. 서버가 현재 조건에서의 패싯 집계를 함께 주고, 선택은 category=a&category=b 배열 쿼리로 표현합니다. 선택된 항목은 결과가 0이어도 보여 줘야 해제할 수 있습니다.`,
          single: { label: `✓ components/search/FacetFilter.vue`, code: String.raw`
<script setup lang="ts">
type Facet = { value: string; label: string; count: number }
const props = defineProps<{
  facets: Record<string, Facet[]>                 // { category: [...], brand: [...] }
  selected: { category: string[]; brand: string[]; minPrice?: number; maxPrice?: number }
}>()
const emit = defineEmits<{ change: [patch: Record<string, unknown>] }>()

const GROUPS = [{ key: 'category', label: '카테고리' }, { key: 'brand', label: '브랜드' }] as const
const expanded = reactive<Record<string, boolean>>({})

function toggle(key: 'category' | 'brand', value: string) {
  const cur = props.selected[key]
  emit('change', { [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] })
}
// 선택했지만 현재 집계에 없는 값도 목록에 남긴다 (해제할 수 있어야 한다)
function options(key: 'category' | 'brand') {
  const list = props.facets[key] ?? []
  const missing = props.selected[key].filter((v) => !list.some((f) => f.value === v)).map((v) => ({ value: v, label: v, count: 0 }))
  const all = [...missing, ...list]
  return expanded[key] ? all : all.slice(0, 6)
}
const activeCount = computed(() => props.selected.category.length + props.selected.brand.length + (props.selected.minPrice || props.selected.maxPrice ? 1 : 0))

const price = reactive({ min: props.selected.minPrice ?? '', max: props.selected.maxPrice ?? '' })
function applyPrice() { emit('change', { minPrice: price.min || undefined, maxPrice: price.max || undefined }) }
</script>

<template>
  <aside class="facets">
    <div class="row between">
      <b>필터 <span v-if="activeCount" class="badge">{{ activeCount }}</span></b>
      <button v-if="activeCount" class="link" @click="emit('change', { category: [], brand: [], minPrice: undefined, maxPrice: undefined })">초기화</button>
    </div>
    <section v-for="g in GROUPS" :key="g.key">
      <h4>{{ g.label }}</h4>
      <label v-for="o in options(g.key)" :key="o.value" class="row" :class="{ muted: !o.count }">
        <input type="checkbox" :checked="selected[g.key].includes(o.value)" @change="toggle(g.key, o.value)">
        <span class="grow">{{ o.label }}</span><span class="tiny">{{ o.count }}</span>
      </label>
      <button v-if="(facets[g.key]?.length ?? 0) > 6" class="link tiny" @click="expanded[g.key] = !expanded[g.key]">{{ expanded[g.key] ? '접기' : '더 보기' }}</button>
    </section>
    <section>
      <h4>가격</h4>
      <form class="row" @submit.prevent="applyPrice">
        <input v-model.number="price.min" type="number" placeholder="최소" min="0"> ~ <input v-model.number="price.max" type="number" placeholder="최대">
        <button type="submit">적용</button>
      </form>
    </section>
  </aside>
</template>
` },
        },
        {
          id: 'l8', short: `빈 결과와 제안`,
          title: `결과가 없으면 왜 없는지, 대신 무엇을 볼지 보여 준다`,
          why: `"검색 결과가 없습니다" 한 줄은 이탈로 이어집니다. 오타 교정 제안, 필터 해제 제안, 인기 검색어 세 가지를 순서대로 보여 줍니다. 교정 후보는 서버가 검색어 사전에서 편집 거리로 찾습니다.`,
          single: { label: `✓ components/search/EmptySearch.vue + server/api/search/suggest-fix.get.ts`, code: String.raw`
<!-- components/search/EmptySearch.vue -->
<script setup lang="ts">
const props = defineProps<{ query: string; hasFilters?: boolean }>()
const emit = defineEmits<{ suggest: [q: string]; clearFilters: [] }>()
const { data: fix } = await useFetch('/api/search/suggest-fix', { query: { q: props.query }, watch: [() => props.query], default: () => null })
const { data: popular } = await useFetch('/api/search/popular', { default: () => [] })
</script>
<template>
  <div class="empty">
    <h3>"{{ query }}" 에 대한 결과가 없습니다</h3>
    <p v-if="fix?.term">혹시 <button class="link" @click="emit('suggest', fix.term)"><b>{{ fix.term }}</b></button> 을(를) 찾으셨나요?</p>
    <p v-else-if="hasFilters">필터를 <button class="link" @click="emit('clearFilters')">해제</button>하면 결과가 있을 수 있습니다</p>
    <ul class="tips"><li>단어의 철자를 확인해 보세요</li><li>더 짧거나 일반적인 단어로 검색해 보세요</li></ul>
    <p v-if="popular.length">많이 찾는 검색어: <NuxtLink v-for="p in popular.slice(0, 5)" :key="p.term" :to="{ query: { q: p.term } }" class="chip">{{ p.term }}</NuxtLink></p>
  </div>
</template>

// server/api/search/suggest-fix.get.ts — 상품명·카테고리·브랜드 단어 사전에서 가장 가까운 단어
export default cachedEventHandler(async (event) => {
  const q = String(getQuery(event).q ?? '').trim().toLowerCase()
  if (q.length < 2 || q.length > 30) return null
  const dict = await getTermDictionary()                            // Set<string>, 10분 캐시로 메모리에
  if (dict.has(q)) return null
  let best: { term: string; d: number } | null = null
  const maxD = q.length <= 4 ? 1 : 2
  for (const term of dict) {
    if (Math.abs(term.length - q.length) > maxD) continue
    const d = levenshtein(q, term, maxD)
    if (d <= maxD && (!best || d < best.d)) best = { term, d }
  }
  return best ? { term: best.term } : null
}, { maxAge: 600, getKey: (e) => String(getQuery(e).q ?? '') })

function levenshtein(a: string, b: string, limit: number) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > limit) return limit + 1                            // 조기 종료
    prev = cur
  }
  return prev[b.length]
}
` },
        },
        {
          id: 'l9', short: `서버 검색 API`,
          title: `정렬은 화이트리스트, 페이지는 상한, 전문 검색은 DB 기능으로`,
          why: `정렬 컬럼을 쿼리 그대로 orderBy 에 넣으면 아무 컬럼이나 정렬됩니다. LIKE '%q%' 는 작을 땐 충분하고, 커지면 Postgres 전문 검색(tsvector) 이나 검색 엔진으로 갑니다. 패싯은 같은 조건에서 집계합니다.`,
          single: { label: `✓ server/api/search/index.get.ts`, code: String.raw`
import { z } from 'zod'

const Query = z.object({
  q: z.string().trim().max(100).default(''),
  page: z.coerce.number().int().min(1).max(100).default(1),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest']).default('relevance'),
  category: z.union([z.string(), z.array(z.string())]).optional().transform(toArray),
  brand: z.union([z.string(), z.array(z.string())]).optional().transform(toArray),
  minPrice: z.coerce.number().optional(), maxPrice: z.coerce.number().optional()
})
const PER_PAGE = 24
const ORDER = { price_asc: { price: 'asc' }, price_desc: { price: 'desc' }, newest: { createdAt: 'desc' }, relevance: undefined } as const

export default defineEventHandler(async (event) => {
  const p = Query.parse(getQuery(event))
  const where = {
    active: true,
    ...(p.category.length && { categoryId: { in: p.category } }),
    ...(p.brand.length && { brand: { in: p.brand } }),
    ...((p.minPrice || p.maxPrice) && { price: { gte: p.minPrice, lte: p.maxPrice } }),
    ...(p.q && { OR: [{ name: { contains: p.q, mode: 'insensitive' } }, { keywords: { has: p.q.toLowerCase() } }] })
  }

  const [items, total, categoryFacet, brandFacet] = await Promise.all([
    db.product.findMany({ where, orderBy: ORDER[p.sort] ?? [{ score: 'desc' }, { id: 'asc' }], skip: (p.page - 1) * PER_PAGE, take: PER_PAGE, select: cardSelect }),
    db.product.count({ where }),
    // 패싯: 자기 자신의 필터는 뺀 조건으로 집계해야 "다른 카테고리도 고를 수 있게" 보인다
    db.product.groupBy({ by: ['categoryId'], where: { ...where, categoryId: undefined }, _count: true }),
    db.product.groupBy({ by: ['brand'], where: { ...where, brand: undefined }, _count: true, orderBy: { _count: { brand: 'desc' } }, take: 30 })
  ])

  event.waitUntil?.(db.searchLog.create({ data: { term: p.q.toLowerCase(), count: total } }).catch(() => {}))   // 05번 로그

  return {
    items, total, page: p.page, perPage: PER_PAGE,
    facets: {
      category: await labelCategories(categoryFacet.map((f) => ({ value: f.categoryId, count: f._count }))),
      brand: brandFacet.map((f) => ({ value: f.brand, label: f.brand, count: f._count }))
    }
  }
})

/* Postgres 전문 검색으로 바꿀 때 (relevance 정렬이 진짜 의미를 갖는다)
   ALTER TABLE product ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))) STORED;
   CREATE INDEX product_tsv_idx ON product USING GIN (tsv);
   SELECT *, ts_rank(tsv, q) AS rank FROM product, plainto_tsquery('simple', $1) q WHERE tsv @@ q ORDER BY rank DESC LIMIT 24;
   한국어 형태소가 필요하면 pg_bigm / Meilisearch / Elasticsearch(nori) 로. 상품 10만 개 이하면 Meilisearch 가 가장 손이 덜 간다 */
` },
        },
        {
          id: 'l10', short: `측정`,
          title: `검색어, 결과 수, 클릭 순위를 모아 배치로 보낸다`,
          why: `검색이 잘 되는지는 "결과 0건 비율" 과 "클릭한 결과의 순위" 로 알 수 있습니다. 이벤트를 큐에 모아 5초마다 또는 페이지를 떠날 때 sendBeacon 으로 보냅니다. 요청 하나하나 보내면 네트워크 탭이 지저분해집니다.`,
          single: { label: `✓ composables/useSearchAnalytics.ts`, code: String.raw`
type Ev =
  | { type: 'search'; q: string; count: number; filters: number; at: number }
  | { type: 'click'; q: string; itemId: string; rank: number; page: number; at: number }
  | { type: 'zero'; q: string; at: number }

const queue: Ev[] = []
let timer: ReturnType<typeof setTimeout> | null = null

function flush() {
  if (!queue.length) return
  const batch = queue.splice(0, queue.length)
  const body = JSON.stringify({ events: batch, sid: getSessionId() })
  // 페이지 이탈 중에도 전송이 보장되는 API. 64KB 제한, 응답은 못 읽는다
  if (!navigator.sendBeacon?.('/api/analytics/search', new Blob([body], { type: 'application/json' }))) {
    fetch('/api/analytics/search', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {})
  }
}
function enqueue(ev: Ev) {
  queue.push(ev)
  if (queue.length >= 20) return flush()
  timer ??= setTimeout(() => { timer = null; flush() }, 5000)
}
if (import.meta.client) {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())   // 탭 전환·닫기 모두 잡힌다 (unload 보다 믿을 만하다)
}

export function useSearchAnalytics() {
  return {
    searched: (q: string, count: number, filters = 0) => { enqueue({ type: 'search', q, count, filters, at: Date.now() }); if (!count) enqueue({ type: 'zero', q, at: Date.now() }) },
    clicked: (q: string, itemId: string, index: number, page: number, perPage: number) =>
      enqueue({ type: 'click', q, itemId, rank: (page - 1) * perPage + index + 1, page, at: Date.now() })
  }
}

// pages/search.vue 에서
const ana = useSearchAnalytics()
watch(data, (d) => d && ana.searched(params.value.q, d.total, activeFilterCount.value))
// ProductGrid 의 @click="(item, i) => ana.clicked(params.q, item.id, i, params.page, 24)"

/* 서버 server/api/analytics/search.post.ts 는 받은 배치를 그대로 적재. 주간 리포트 질문:
   - 결과 0건 비율 = zero / search           (높으면 동의어·오타 교정·상품 등록)
   - 평균 클릭 순위, 1페이지 클릭 비율       (낮으면 정렬·랭킹 조정)
   - 검색 후 클릭 없는 비율                   (결과는 있는데 안 맞는 경우) */
` },
        },
      ],
    },
    {
      id: 'practice-13', no: 13, name: `대시보드와 차트`,
      lead: `ECharts 를 Nuxt 에서 쓰는 방법입니다. 클라이언트 전용 래퍼, 데이터를 옵션으로 바꾸는 층, 다크 모드, 기간 선택기, KPI 카드, 반응형 그리드, 드릴다운, 지연 로딩, 자동 갱신, 내보내기.`,
      lessons: [
        {
          id: 'l1', short: `차트 래퍼`,
          title: `ECharts 는 필요한 부품만 가져오고, 컴포넌트 하나가 init·resize·dispose 를 맡는다`,
          why: `echarts 전체를 import 하면 1MB 가 넘습니다. 쓰는 차트와 부품만 등록합니다. init 은 onMounted(클라이언트), 크기 변화는 ResizeObserver, 언마운트에 dispose. 옵션이 바뀌면 setOption 만 다시 부릅니다.`,
          single: { label: `✓ components/chart/EChart.vue`, code: String.raw`
<script setup lang="ts">
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption, ECElementEvent } from 'echarts'
import { useResizeObserver } from '@vueuse/core'

echarts.use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, TitleComponent, CanvasRenderer])

const props = withDefaults(defineProps<{ option: EChartsOption; loading?: boolean; height?: string; theme?: string }>(), { height: '320px' })
const emit = defineEmits<{ click: [e: ECElementEvent]; ready: [chart: echarts.ECharts] }>()

const el = useTemplateRef('el')
let chart: echarts.ECharts | null = null

function init() {
  chart?.dispose()
  chart = echarts.init(el.value!, props.theme, { renderer: 'canvas' })
  chart.setOption(props.option)
  chart.on('click', (e) => emit('click', e as ECElementEvent))
  emit('ready', chart)
}

onMounted(init)
onBeforeUnmount(() => { chart?.dispose(); chart = null })
useResizeObserver(el, () => chart?.resize())

watch(() => props.option, (o) => chart?.setOption(o, { notMerge: true }), { deep: true })    // 시리즈 수가 바뀌어도 잔상이 없도록 notMerge
watch(() => props.loading, (v) => (v ? chart?.showLoading({ text: '', maskColor: 'transparent' }) : chart?.hideLoading()), { immediate: true })
watch(() => props.theme, init)                                                               // 테마는 init 을 다시 해야 바뀐다 (03번)

defineExpose({ getChart: () => chart })
</script>

<template>
  <div ref="el" class="echart" :style="{ height }" />
</template>

<!-- 사용: 서버에서는 빈 div 만 나오고 클라이언트에서 그려진다. SSR 에서 echarts 를 import 해도 init 을 안 하므로 안전하지만,
     번들에서 서버 쪽을 빼고 싶으면 <ClientOnly> 로 감싸거나 components/chart/EChart.client.vue 로 이름 짓는다 -->
` },
        },
        {
          id: 'l2', short: `옵션 변환`,
          title: `API 응답을 차트 옵션으로 바꾸는 함수를 따로 두고, 색과 단위를 한 곳에서 정한다`,
          why: `컴포넌트 안에서 옵션 객체를 직접 조립하면 차트마다 색, 툴팁, 축 포맷이 제각각이 됩니다. toLineOption(rows) 처럼 변환 함수를 두고 팔레트와 포맷터는 공용 상수에서 가져옵니다.`,
          single: { label: `✓ utils/chart/options.ts`, code: String.raw`
import type { EChartsOption } from 'echarts'

export const PALETTE = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']
export const fmtNumber = (n: number) => n >= 1e8 ? (n / 1e8).toFixed(1) + '억' : n >= 1e4 ? (n / 1e4).toFixed(1) + '만' : n.toLocaleString()
export const fmtDate = (iso: string) => iso.slice(5).replace('-', '/')                       // 2026-03-05 → 03/05

const base: EChartsOption = {
  color: PALETTE,
  grid: { left: 48, right: 16, top: 32, bottom: 32, containLabel: false },
  tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, valueFormatter: (v) => fmtNumber(Number(v)) },
  legend: { top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  textStyle: { fontFamily: 'inherit' }
}

export type Row = { date: string; [series: string]: number | string }

export function toLineOption(rows: Row[], series: { key: string; name: string; unit?: string }[], opts: { area?: boolean; stack?: boolean } = {}): EChartsOption {
  return {
    ...base,
    xAxis: { type: 'category', data: rows.map((r) => fmtDate(r.date)), boundaryGap: false, axisTick: { show: false }, axisLine: { show: false } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => fmtNumber(v) }, splitLine: { lineStyle: { type: 'dashed' } } },
    series: series.map((s) => ({
      name: s.name, type: 'line', smooth: true, symbol: 'none', data: rows.map((r) => r[s.key]),
      ...(opts.area && { areaStyle: { opacity: 0.08 } }), ...(opts.stack && { stack: 'total' }),
      ...(s.unit && { tooltip: { valueFormatter: (v: any) => fmtNumber(Number(v)) + s.unit } })
    }))
  }
}

export function toBarOption(items: { label: string; value: number }[], opts: { horizontal?: boolean; top?: number } = {}): EChartsOption {
  const data = [...items].sort((a, b) => b.value - a.value).slice(0, opts.top ?? 10)
  const cat = { type: 'category' as const, data: data.map((d) => d.label), inverse: !!opts.horizontal }
  const val = { type: 'value' as const, axisLabel: { formatter: (v: number) => fmtNumber(v) } }
  return { ...base, legend: { show: false }, tooltip: { trigger: 'item' }, xAxis: opts.horizontal ? val : cat, yAxis: opts.horizontal ? cat : val,
    series: [{ type: 'bar', data: data.map((d) => d.value), barMaxWidth: 28, itemStyle: { borderRadius: 4 } }] }
}

export function toPieOption(items: { label: string; value: number }[]): EChartsOption {
  return { ...base, tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' }, legend: { orient: 'vertical', right: 0, top: 'middle' },
    series: [{ type: 'pie', radius: ['55%', '80%'], center: ['35%', '50%'], label: { show: false }, data: items.map((d) => ({ name: d.label, value: d.value })) }] }
}

// 컴포넌트에서
const option = computed(() => toLineOption(data.value.rows, [{ key: 'orders', name: '주문' }, { key: 'visitors', name: '방문' }], { area: true }))
` },
        },
        {
          id: 'l3', short: `다크 모드`,
          title: `다크 테마를 한 번 등록하고, 컬러 모드가 바뀌면 차트를 다시 init 한다`,
          why: `ECharts 테마는 init 시점에 정해지므로 setOption 으로는 안 바뀝니다. 앱의 컬러 모드(@nuxtjs/color-mode) 를 보고 theme prop 을 바꾸면 01번 래퍼가 다시 init 합니다. 테마 색은 CSS 변수와 맞춥니다.`,
          single: { label: `✓ plugins/echarts-theme.client.ts + 사용`, code: String.raw`
// plugins/echarts-theme.client.ts
import * as echarts from 'echarts/core'

export default defineNuxtPlugin(() => {
  echarts.registerTheme('dark-app', {
    backgroundColor: 'transparent',
    textStyle: { color: '#cbd5e1' },
    legend: { textStyle: { color: '#cbd5e1' } },
    categoryAxis: { axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
    valueAxis: { axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } }
  })
  echarts.registerTheme('light-app', {
    backgroundColor: 'transparent',
    textStyle: { color: '#334155' },
    categoryAxis: { axisLabel: { color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    valueAxis: { axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } } }
  })
})

// composables/useChartTheme.ts
export function useChartTheme() {
  const colorMode = useColorMode()                                  // @nuxtjs/color-mode
  return computed(() => (colorMode.value === 'dark' ? 'dark-app' : 'light-app'))
}

<!-- 사용 -->
<script setup lang="ts">
const theme = useChartTheme()
</script>
<template>
  <EChart :option="option" :theme="theme" />
</template>

<!-- CSS 변수에서 색을 읽어 테마를 만들고 싶으면 (디자인 토큰과 한 벌로)
     const css = getComputedStyle(document.documentElement)
     const text = css.getPropertyValue('--text-muted').trim()
     registerTheme 을 플러그인이 아니라 컬러 모드 watch 안에서 호출하고 이름을 바꿔 가며 등록 -->
` },
        },
        {
          id: 'l4', short: `기간 선택기`,
          title: `프리셋 + 직접 선택, 결과는 from/to 문자열로 URL 에 둔다`,
          why: `대시보드의 모든 위젯은 같은 기간을 봅니다. 기간은 페이지 레벨 상태이고 URL 에 있어야 링크로 공유됩니다. 프리셋을 누르면 날짜를 계산해 넣고, 비교 기간(직전 같은 길이) 은 파생값으로 계산합니다.`,
          single: { label: `✓ composables/useDateRange.ts + components/DateRangePicker.vue`, code: String.raw`
// composables/useDateRange.ts
import { format, subDays, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns'

const PRESETS = {
  today: { label: '오늘', range: () => [new Date(), new Date()] },
  d7: { label: '7일', range: () => [subDays(new Date(), 6), new Date()] },
  d30: { label: '30일', range: () => [subDays(new Date(), 29), new Date()] },
  month: { label: '이번 달', range: () => [startOfMonth(new Date()), new Date()] },
  lastMonth: { label: '지난 달', range: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] }
} as const
export type Preset = keyof typeof PRESETS
const iso = (d: Date) => format(d, 'yyyy-MM-dd')

export function useDateRange(defaultPreset: Preset = 'd30') {
  const route = useRoute(); const router = useRouter()
  const range = computed(() => {
    const from = String(route.query.from ?? ''), to = String(route.query.to ?? '')
    if (/^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to) return { from, to }
    const [f, t] = PRESETS[defaultPreset].range(); return { from: iso(f), to: iso(t) }
  })
  const preset = computed<Preset | null>(() => (Object.keys(PRESETS) as Preset[]).find((k) => { const [f, t] = PRESETS[k].range(); return iso(f) === range.value.from && iso(t) === range.value.to }) ?? null)
  const days = computed(() => differenceInDays(new Date(range.value.to), new Date(range.value.from)) + 1)
  const previous = computed(() => ({ from: iso(subDays(new Date(range.value.from), days.value)), to: iso(subDays(new Date(range.value.from), 1)) }))   // 직전 같은 길이

  function set(from: string, to: string) { router.replace({ query: { ...route.query, from, to } }) }
  function setPreset(k: Preset) { const [f, t] = PRESETS[k].range(); set(iso(f), iso(t)) }
  return { range, preset, previous, days, set, setPreset, PRESETS }
}

<!-- components/DateRangePicker.vue -->
<script setup lang="ts">
const { range, preset, set, setPreset, PRESETS } = useDateRange()
const custom = reactive({ from: range.value.from, to: range.value.to })
watch(range, (r) => Object.assign(custom, r))
</script>
<template>
  <div class="row gap">
    <button v-for="(p, k) in PRESETS" :key="k" class="chip" :class="{ active: preset === k }" @click="setPreset(k)">{{ p.label }}</button>
    <form class="row" @submit.prevent="set(custom.from, custom.to)">
      <input v-model="custom.from" type="date" :max="custom.to"> ~ <input v-model="custom.to" type="date" :min="custom.from" :max="new Date().toISOString().slice(0, 10)">
      <button type="submit" class="btn-sm">적용</button>
    </form>
  </div>
</template>
` },
        },
        {
          id: 'l5', short: `KPI 카드`,
          title: `숫자 하나와 직전 기간 대비 증감, 작은 스파크라인`,
          why: `대시보드 상단의 숫자 카드는 값만으로는 의미가 없고 "지난 기간보다 얼마나" 가 핵심입니다. 증감률 색, 0 으로 나누기, 로딩 스켈레톤, 축약 표기를 카드 컴포넌트가 다 처리하면 페이지는 숫자만 넘깁니다.`,
          single: { label: `✓ components/dashboard/StatCard.vue`, code: String.raw`
<script setup lang="ts">
import { fmtNumber } from '~/utils/chart/options'

const props = withDefaults(defineProps<{
  label: string; value?: number; previous?: number; unit?: string; trend?: number[]
  loading?: boolean; invert?: boolean          // invert: 낮을수록 좋은 지표 (이탈률, 응답시간)
  format?: (n: number) => string
}>(), { format: fmtNumber })

const delta = computed(() => {
  if (props.value == null || props.previous == null) return null
  if (props.previous === 0) return props.value === 0 ? 0 : null       // 이전이 0 이면 증감률 계산 불가 → "신규"
  return (props.value - props.previous) / props.previous
})
const tone = computed(() => {
  if (delta.value == null || delta.value === 0) return 'flat'
  const up = delta.value > 0
  return (up !== props.invert) ? 'good' : 'bad'
})
const spark = computed(() => {
  const t = props.trend ?? []; if (t.length < 2) return ''
  const max = Math.max(...t), min = Math.min(...t), span = max - min || 1
  return t.map((v, i) => (i / (t.length - 1) * 100).toFixed(1) + ',' + (28 - (v - min) / span * 26).toFixed(1)).join(' ')
})
</script>

<template>
  <div class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <template v-if="loading"><div class="skeleton h-8 w-24" /><div class="skeleton h-4 w-16" /></template>
    <template v-else>
      <div class="stat-value">{{ value == null ? '–' : format(value) }}<span v-if="unit" class="unit">{{ unit }}</span></div>
      <div class="stat-delta" :class="tone">
        <template v-if="delta == null && previous === 0">신규</template>
        <template v-else-if="delta == null">–</template>
        <template v-else>{{ delta > 0 ? '▲' : delta < 0 ? '▼' : '' }} {{ Math.abs(delta * 100).toFixed(1) }}% <span class="muted">vs 직전 기간</span></template>
      </div>
    </template>
    <svg v-if="spark" class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline :points="spark" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
    </svg>
  </div>
</template>

<!-- 페이지: 숫자만 넘긴다 -->
<StatCard label="매출" :value="kpi?.revenue" :previous="kpi?.prevRevenue" unit="원" :trend="kpi?.revenueTrend" :loading="pending" />
<StatCard label="이탈률" :value="kpi?.bounce" :previous="kpi?.prevBounce" unit="%" invert :format="(n) => n.toFixed(1)" :loading="pending" />
` },
        },
        {
          id: 'l6', short: `그리드 레이아웃`,
          title: `12칸 그리드에 카드를 배치하고, 모바일은 1열로 떨어진다`,
          why: `대시보드는 "어떤 위젯이 어디에" 가 전부입니다. CSS grid 의 grid-column span 으로 폭을 정하고 모바일은 모두 12칸으로. 차트는 높이가 고정이어야 레이아웃이 흔들리지 않습니다. 카드 껍데기는 제목·도구·본문 슬롯으로 통일합니다.`,
          single: { label: `✓ components/dashboard/Grid.vue + Panel.vue + 페이지`, code: String.raw`
<!-- components/dashboard/Panel.vue : 모든 위젯의 껍데기 -->
<script setup lang="ts">
defineProps<{ title: string; span?: number; description?: string; error?: string | null }>()
</script>
<template>
  <section class="panel" :style="{ '--span': span ?? 6 }">
    <header class="panel-head">
      <div><h3>{{ title }}</h3><p v-if="description" class="tiny muted">{{ description }}</p></div>
      <div class="panel-tools"><slot name="tools" /></div>
    </header>
    <div v-if="error" class="panel-error">{{ error }} <button class="link" @click="$emit('retry')">다시 시도</button></div>
    <div v-else class="panel-body"><slot /></div>
  </section>
</template>

<style>
.dash-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
.panel { grid-column: span var(--span); background: var(--card); border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; min-width: 0; }
.panel-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px 0; }
.panel-body { padding: 12px 16px 16px; flex: 1; min-height: 0; }
.panel-error { padding: 24px; text-align: center; color: var(--danger); }
@media (max-width: 1024px) { .panel { grid-column: span min(12, calc(var(--span) * 2)); } }   /* 태블릿: 폭 두 배 (3→6, 6→12) */
@media (max-width: 640px)  { .panel { grid-column: span 12; } }
</style>

<!-- pages/admin/dashboard.vue -->
<template>
  <div class="dash-page">
    <div class="row between wrap"><h1>대시보드</h1><DateRangePicker /></div>
    <div class="dash-grid">
      <StatCard v-for="k in kpis" :key="k.label" v-bind="k" class="panel" style="--span: 3" />
      <Panel title="매출 추이" :span="8" :error="trendError" @retry="refreshTrend"><EChart :option="trendOption" :loading="trendPending" height="300px" /></Panel>
      <Panel title="결제 수단" :span="4"><EChart :option="methodOption" height="300px" /></Panel>
      <Panel title="상위 상품" :span="6"><EChart :option="topOption" height="360px" @click="drill" /></Panel>
      <Panel title="최근 주문" :span="6"><RecentOrders :items="recent" /></Panel>
    </div>
  </div>
</template>
` },
        },
        {
          id: 'l7', short: `드릴다운`,
          title: `차트 클릭은 이벤트로 올리고, 페이지가 어디로 갈지 정한다`,
          why: `막대를 누르면 그 상품 목록으로, 날짜 점을 누르면 그 날 주문으로 가는 것이 드릴다운입니다. 래퍼는 클릭 이벤트를 그대로 올리고, 페이지가 seriesName·dataIndex 를 보고 라우팅합니다. 범례 토글·데이터 줌은 ECharts 가 알아서 합니다.`,
          single: { label: `✓ 클릭 처리 + 데이터 줌 + 선택 강조`, code: String.raw`
<script setup lang="ts">
import type { ECElementEvent } from 'echarts'

const { range } = useDateRange()
const { data: top } = await useFetch('/api/stats/top-products', { query: range })
const topOption = computed(() => toBarOption(top.value.map((p) => ({ label: p.name, value: p.revenue })), { horizontal: true }))

// 막대 클릭 → 상품 상세. 옵션의 data 순서와 응답 순서가 같아야 dataIndex 로 찾을 수 있다 (정렬은 변환 함수에서 하니 id 를 같이 두자)
function drill(e: ECElementEvent) {
  if (e.componentType !== 'series') return
  const item = topOption.value.__ids?.[e.dataIndex]            // 변환 함수가 __ids 를 같이 돌려주게 하거나
  const product = top.value.find((p) => p.name === e.name)      // name 으로 역추적
  if (product) navigateTo({ path: '/admin/orders', query: { ...range.value, productId: product.id } })
}

// 시계열: 날짜 클릭 → 그 날 주문. 데이터 줌으로 구간 확대
const trendOption = computed<EChartsOption>(() => ({
  ...toLineOption(rows.value, series),
  dataZoom: [{ type: 'inside', zoomOnMouseWheel: 'ctrl' }, { type: 'slider', height: 18, bottom: 0 }],     // ctrl+휠로 확대, 아래 슬라이더
  grid: { left: 48, right: 16, top: 32, bottom: 48 }
}))
function drillDate(e: ECElementEvent) {
  const date = rows.value[e.dataIndex]?.date
  if (date) navigateTo({ path: '/admin/orders', query: { from: date, to: date } })
}

// 선택 강조: 같은 항목을 다른 위젯에서 하이라이트 (dispatchAction)
const chartRef = useTemplateRef<InstanceType<typeof EChart>>('chartRef')
function highlight(name: string) {
  const c = chartRef.value?.getChart(); if (!c) return
  c.dispatchAction({ type: 'downplay' })
  c.dispatchAction({ type: 'highlight', seriesIndex: 0, name })
  c.dispatchAction({ type: 'showTip', seriesIndex: 0, name })
}
</script>

<template>
  <EChart ref="chartRef" :option="topOption" @click="drill" />
  <EChart :option="trendOption" @click="drillDate" />
  <!-- 클릭 가능하다는 힌트: 커서. 래퍼에서 chart.getZr().on('mousemove', ...) 로 series 위에서만 pointer 로 바꿔도 된다 -->
</template>
` },
        },
        {
          id: 'l8', short: `지연 로딩`,
          title: `화면에 들어올 때 데이터를 부르고, 무거운 차트는 비동기 컴포넌트로`,
          why: `위젯 20개가 한꺼번에 API 를 부르면 첫 화면이 느립니다. 보이는 패널만 먼저 부르고, 아래쪽은 스크롤되어 들어올 때 부릅니다. 지도·히트맵 같은 무거운 차트 부품은 defineAsyncComponent 로 별도 청크에.`,
          single: { label: `✓ composables/useLazyPanel.ts + 사용`, code: String.raw`
// composables/useLazyPanel.ts
import { useIntersectionObserver } from '@vueuse/core'

export function useLazyPanel(el: Ref<HTMLElement | null>, opts: { rootMargin?: string } = {}) {
  const visible = ref(false)
  const { stop } = useIntersectionObserver(el, ([entry]) => {
    if (entry?.isIntersecting) { visible.value = true; stop() }      // 한 번 보이면 끝. 다시 숨어도 유지
  }, { rootMargin: opts.rootMargin ?? '200px 0px' })                 // 200px 전에 미리
  return visible
}

<!-- components/dashboard/LazyPanel.vue : 보일 때까지 슬롯을 그리지 않는다 -->
<script setup lang="ts">
defineProps<{ title: string; span?: number; height?: string }>()
const el = useTemplateRef('el')
const visible = useLazyPanel(el)
</script>
<template>
  <div ref="el" :style="{ '--span': span ?? 6 }" class="panel">
    <Panel v-if="visible" :title="title" :span="span"><slot /></Panel>
    <div v-else class="panel-body" :style="{ height: height ?? '320px' }"><div class="skeleton h-full" /></div>
  </div>
</template>

<!-- 위젯: 자기 데이터는 자기가 부른다. LazyPanel 안에 있으면 보일 때 setup 이 돌아 그때 요청이 나간다 -->
<script setup lang="ts">
const { range } = useDateRange()
const { data, status } = await useLazyFetch('/api/stats/funnel', { query: range })    // 라우트 전환을 막지 않는다
</script>

// 무거운 차트 부품은 별도 청크로
const HeatmapChart = defineAsyncComponent({
  loader: () => import('~/components/chart/HeatmapChart.vue'),     // echarts/charts 의 HeatmapChart + VisualMapComponent 는 이 파일 안에서 use()
  loadingComponent: PanelSkeleton, delay: 200
})

<template>
  <LazyPanel title="시간대별 접속" :span="12" height="360px"><HeatmapChart :option="heatOption" /></LazyPanel>
</template>
` },
        },
        {
          id: 'l9', short: `자동 갱신`,
          title: `탭이 보일 때만 주기적으로 갱신하고, 마지막 갱신 시각을 보여 준다`,
          why: `운영 대시보드는 켜 두고 보는 화면입니다. 1분마다 갱신하되 탭이 숨겨지면 멈추고, 다시 보이면 즉시 한 번 갱신합니다. "방금 · 2분 전" 표시와 수동 새로고침 버튼이 있으면 데이터가 살아 있다는 신뢰가 생깁니다.`,
          single: { label: `✓ composables/useAutoRefresh.ts`, code: String.raw`
import { useIntervalFn, useDocumentVisibility, useTimeAgo } from '@vueuse/core'

export function useAutoRefresh(refresh: () => Promise<unknown>, intervalMs = 60_000) {
  const enabled = useLocalStorage('dash:auto-refresh', true)
  const lastAt = ref<Date | null>(null)
  const refreshing = ref(false)
  const visibility = useDocumentVisibility()

  async function run() {
    if (refreshing.value) return
    refreshing.value = true
    try { await refresh(); lastAt.value = new Date() } finally { refreshing.value = false }
  }

  const { pause, resume } = useIntervalFn(run, intervalMs, { immediate: false })
  watch([enabled, visibility], ([on, vis]) => {
    if (on && vis === 'visible') { resume(); if (lastAt.value && Date.now() - lastAt.value.getTime() > intervalMs) run() }   // 돌아오자마자 오래됐으면 즉시
    else pause()
  }, { immediate: true })

  const ago = useTimeAgo(() => lastAt.value ?? new Date(), { showSecond: true, updateInterval: 10_000 })
  return { enabled, lastAt, ago, refreshing, run }
}

<!-- 페이지 -->
<script setup lang="ts">
const { range } = useDateRange()
const { data: kpi, refresh: refreshKpi } = await useFetch('/api/stats/kpi', { query: range })
const { data: trend, refresh: refreshTrend } = await useFetch('/api/stats/trend', { query: range })
const auto = useAutoRefresh(() => Promise.all([refreshKpi(), refreshTrend()]))
onMounted(() => (auto.lastAt.value = new Date()))
</script>
<template>
  <div class="row gap tiny muted">
    <span v-if="auto.lastAt.value">{{ auto.refreshing.value ? '갱신 중…' : auto.ago.value + ' 갱신' }}</span>
    <button class="link" :disabled="auto.refreshing.value" @click="auto.run()">새로고침</button>
    <label><input v-model="auto.enabled.value" type="checkbox"> 자동 갱신</label>
  </div>
</template>
<!-- 서버 쪽: 통계 API 는 cachedEventHandler({ maxAge: 30 }) 로. 대시보드 10명이 1분마다 눌러도 DB 는 30초에 한 번 -->
` },
        },
        {
          id: 'l10', short: `내보내기`,
          title: `차트는 PNG 로, 데이터는 CSV 로, 전체는 인쇄 스타일로`,
          why: `"이 그래프 보고서에 넣어 주세요" 는 꼭 옵니다. ECharts 의 getDataURL 로 PNG, 원본 rows 로 CSV(BOM 포함해야 엑셀에서 한글이 안 깨짐), 페이지 전체는 @media print 로 사이드바를 숨기고 그리드를 1열로.`,
          single: { label: `✓ utils/export.ts + print.css`, code: String.raw`
// utils/export.ts
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function chartToPng(chart: echarts.ECharts, filename: string, dark = false) {
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: dark ? '#0f172a' : '#ffffff', excludeComponents: ['toolbox', 'dataZoom'] })
  const a = Object.assign(document.createElement('a'), { href: url, download: filename + '.png' })
  a.click()
}

export function toCsv(rows: Record<string, unknown>[], columns?: { key: string; label: string }[]) {
  const cols = columns ?? Object.keys(rows[0] ?? {}).map((k) => ({ key: k, label: k }))
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const lines = [cols.map((c) => cell(c.label)).join(','), ...rows.map((r) => cols.map((c) => cell(r[c.key])).join(','))]
  return new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })        // BOM: 엑셀 한글 깨짐 방지
}

<!-- Panel 의 tools 슬롯 -->
<Panel title="매출 추이" :span="8">
  <template #tools>
    <button class="icon-btn" title="PNG 저장" @click="chartToPng(chartRef!.getChart()!, '매출추이_' + range.from + '_' + range.to, isDark)">⤓</button>
    <button class="icon-btn" title="CSV 저장" @click="downloadBlob(toCsv(rows, [{ key: 'date', label: '날짜' }, { key: 'orders', label: '주문' }, { key: 'revenue', label: '매출' }]), '매출추이.csv')">CSV</button>
  </template>
  <EChart ref="chartRef" :option="trendOption" />
</Panel>

/* assets/css/print.css — nuxt.config css 에 추가하거나 <style media="print"> */
@media print {
  .sidebar, .topbar, .panel-tools, .date-range-picker, button { display: none !important; }
  .dash-grid { display: block; }
  .panel { break-inside: avoid; margin-bottom: 16px; border: 1px solid #ddd; }
  .echart { height: 260px !important; }                     /* 인쇄 직전 window.print 전에 chart.resize() 를 한 번 */
  body { background: #fff; color: #000; }
}
// 인쇄 버튼: window.addEventListener('beforeprint', () => charts.forEach(c => c.resize())) 로 인쇄 폭에 맞춘다
` },
        },
      ],
    },
    {
      id: 'practice-14', no: 14, name: `관리자 CRUD 화면 생성 패턴`,
      lead: `관리자 페이지는 리소스마다 목록·폼·상세가 반복됩니다. 리소스 정의 하나에서 서버 핸들러, 검증, 목록 테이블, 폼을 만들어 내는 패턴입니다. 상품 10개 종류의 관리 화면을 파일 몇 개로 끝냅니다.`,
      lessons: [
        {
          id: 'l1', short: `리소스 정의`,
          title: `리소스 하나를 필드 목록으로 선언하고, 나머지는 여기서 만들어 낸다`,
          why: `목록 컬럼, 폼 입력, 검증, 정렬 가능 여부가 필드마다 제각각 코드로 흩어지면 필드 하나 추가에 파일 다섯 개를 고칩니다. 선언 하나에 모아 두면 추가가 한 줄입니다.`,
          single: { label: `✓ shared/resources/types.ts + shared/resources/product.ts`, code: String.raw`
// shared/resources/types.ts
export type FieldType = 'text' | 'textarea' | 'number' | 'money' | 'boolean' | 'select' | 'date' | 'datetime' | 'image' | 'relation' | 'tags' | 'richtext'
export interface Field {
  key: string; label: string; type: FieldType
  required?: boolean; placeholder?: string; help?: string
  options?: { value: string; label: string }[]                 // select
  relation?: { resource: string; labelKey: string }            // relation: 다른 리소스 참조
  min?: number; max?: number; maxLength?: number
  list?: boolean | { width?: string; sortable?: boolean }      // 목록에 보일지
  form?: boolean | 'create' | 'edit'                           // 폼에 보일지 (false: 서버가 채우는 값)
  searchable?: boolean
}
export interface Resource {
  name: string; label: string; labelPlural?: string
  fields: Field[]
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  softDelete?: boolean
  permissions?: { read?: string; write?: string; delete?: string }   // 8회차 can() 의 권한 이름
  titleKey?: string                                                   // 상세·삭제 확인에 보여 줄 필드
}
export const defineResource = (r: Resource) => r

// shared/resources/product.ts
export default defineResource({
  name: 'product', label: '상품', labelPlural: '상품',
  titleKey: 'name', softDelete: true, defaultSort: { key: 'createdAt', dir: 'desc' },
  permissions: { read: 'product:read', write: 'product:write', delete: 'product:delete' },
  fields: [
    { key: 'id', label: 'ID', type: 'text', list: { width: '90px' }, form: false },
    { key: 'name', label: '상품명', type: 'text', required: true, maxLength: 100, list: { sortable: true }, searchable: true },
    { key: 'categoryId', label: '카테고리', type: 'relation', relation: { resource: 'category', labelKey: 'name' }, required: true, list: true },
    { key: 'price', label: '판매가', type: 'money', required: true, min: 0, list: { sortable: true, width: '120px' } },
    { key: 'stock', label: '재고', type: 'number', min: 0, list: { sortable: true, width: '90px' } },
    { key: 'status', label: '상태', type: 'select', options: [{ value: 'draft', label: '임시' }, { value: 'active', label: '판매 중' }, { value: 'soldout', label: '품절' }], required: true, list: true },
    { key: 'thumbnail', label: '대표 이미지', type: 'image', list: { width: '60px' } },
    { key: 'description', label: '설명', type: 'richtext', form: true },
    { key: 'tags', label: '태그', type: 'tags' },
    { key: 'createdAt', label: '등록일', type: 'datetime', form: false, list: { sortable: true, width: '150px' } }
  ]
})

// shared/resources/index.ts
import product from './product'; import category from './category'; import coupon from './coupon'
export const RESOURCES: Record<string, Resource> = { product, category, coupon }
export const getResource = (name: string) => { const r = RESOURCES[name]; if (!r) throw createError({ statusCode: 404, statusMessage: '없는 리소스' }); return r }
` },
        },
        {
          id: 'l2', short: `서버 공통 핸들러`,
          title: `list/get/create/update/delete 를 리소스 이름만 바꿔 재사용한다`,
          why: `리소스 10개면 핸들러 50개가 아니라, 경로에서 리소스 이름을 읽는 공통 핸들러 5개입니다. 권한, 검색, 정렬 화이트리스트, 소프트 삭제가 한 곳에서 일관되게 적용됩니다. 특수한 리소스는 훅으로 끼어듭니다.`,
          single: { label: `✓ server/api/admin/[resource]/index.get.ts 등 + server/utils/crud.ts`, code: String.raw`
// server/utils/crud.ts
import { getResource } from '~/shared/resources'

type Hooks = { beforeCreate?: (data: any, ctx: Ctx) => any; beforeUpdate?: (id: string, data: any, ctx: Ctx) => any; afterWrite?: (row: any, ctx: Ctx) => void }
const HOOKS: Record<string, Hooks> = { product: { beforeCreate: (d) => ({ ...d, slug: slugify(d.name) }) } }
type Ctx = { user: User; event: H3Event }

export function crud(event: H3Event) {
  const name = getRouterParam(event, 'resource')!
  const res = getResource(name)
  const model = (db as any)[name]                                     // Prisma 모델 이름 = 리소스 이름 규약
  const hooks = HOOKS[name] ?? {}
  const schema = resourceSchema(res)                                  // 03번
  const where0 = res.softDelete ? { deletedAt: null } : {}
  const listable = res.fields.filter((f) => f.list)
  const include = Object.fromEntries(res.fields.filter((f) => f.type === 'relation').map((f) => [f.key.replace(/Id$/, ''), { select: { id: true, [f.relation!.labelKey]: true } }]))

  return {
    res,
    async list() {
      const q = getQuery(event)
      const page = Math.max(1, Number(q.page) || 1), per = Math.min(100, Number(q.per) || 20)
      const sortable = listable.filter((f) => typeof f.list === 'object' && f.list.sortable).map((f) => f.key)
      const sortKey = sortable.includes(String(q.sort)) ? String(q.sort) : res.defaultSort?.key ?? 'id'
      const dir = q.dir === 'asc' ? 'asc' : 'desc'
      const search = String(q.q ?? '').trim()
      const where = {
        ...where0,
        ...(search && { OR: res.fields.filter((f) => f.searchable).map((f) => ({ [f.key]: { contains: search, mode: 'insensitive' } })) }),
        ...parseFilters(q, res)                                        // status=active 같은 select 필드 필터
      }
      const [items, total] = await Promise.all([
        model.findMany({ where, orderBy: { [sortKey]: dir }, skip: (page - 1) * per, take: per, include }),
        model.count({ where })
      ])
      return { items, total, page, per }
    },
    get: (id: string) => model.findFirstOrThrow({ where: { id, ...where0 }, include }),
    async create(ctx: Ctx) {
      let data = schema.create.parse(await readBody(event))
      data = (await hooks.beforeCreate?.(data, ctx)) ?? data
      const row = await model.create({ data: { ...data, createdBy: ctx.user.id } })
      await audit(ctx, name, row.id, 'create', null, row)            // 09번
      hooks.afterWrite?.(row, ctx); return row
    },
    async update(id: string, ctx: Ctx) {
      const before = await this.get(id)
      let data = schema.update.parse(await readBody(event))
      data = (await hooks.beforeUpdate?.(id, data, ctx)) ?? data
      const row = await model.update({ where: { id }, data: { ...data, updatedBy: ctx.user.id } })
      await audit(ctx, name, id, 'update', before, row); hooks.afterWrite?.(row, ctx); return row
    },
    async remove(id: string, ctx: Ctx) {
      const before = await this.get(id)
      const row = res.softDelete ? await model.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: ctx.user.id } }) : await model.delete({ where: { id } })
      await audit(ctx, name, id, 'delete', before, null); return row
    }
  }
}

// server/api/admin/[resource]/index.get.ts
export default defineEventHandler(async (event) => { const c = crud(event); await requirePermission(event, c.res.permissions?.read); return c.list() })
// server/api/admin/[resource]/index.post.ts
export default defineEventHandler(async (event) => { const c = crud(event); const user = await requirePermission(event, c.res.permissions?.write); return c.create({ user, event }) })
// server/api/admin/[resource]/[id].get.ts / .patch.ts / .delete.ts 도 같은 식으로 한 줄씩
` },
        },
        {
          id: 'l3', short: `검증 공유`,
          title: `필드 정의에서 zod 스키마를 만들어 서버와 폼이 같은 규칙을 쓴다`,
          why: `서버 검증과 폼 검증을 따로 쓰면 반드시 어긋납니다. 필드 타입·required·min·max 에서 스키마를 생성하면 둘이 같은 함수를 부릅니다. 생성용(모두 필수) 과 수정용(partial) 을 같이 만듭니다.`,
          single: { label: `✓ shared/resources/schema.ts`, code: String.raw`
import { z, type ZodTypeAny } from 'zod'
import type { Field, Resource } from './types'

function fieldSchema(f: Field): ZodTypeAny {
  let s: ZodTypeAny
  switch (f.type) {
    case 'text': case 'textarea': case 'richtext':
      s = z.string().trim(); if (f.maxLength) s = (s as z.ZodString).max(f.maxLength, f.label + '은(는) ' + f.maxLength + '자 이하'); if (f.required) s = (s as z.ZodString).min(1, f.label + '을(를) 입력하세요'); break
    case 'number': case 'money':
      s = z.coerce.number({ invalid_type_error: f.label + '은(는) 숫자여야 합니다' }); if (f.min != null) s = (s as z.ZodNumber).min(f.min); if (f.max != null) s = (s as z.ZodNumber).max(f.max); if (f.type === 'money') s = (s as z.ZodNumber).int(); break
    case 'boolean':  s = z.coerce.boolean(); break
    case 'select':   s = z.enum(f.options!.map((o) => o.value) as [string, ...string[]], { errorMap: () => ({ message: f.label + '을(를) 선택하세요' }) }); break
    case 'date':     s = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식'); break
    case 'datetime': s = z.coerce.date(); break
    case 'image':    s = z.string().url().or(z.literal('')); break
    case 'relation': s = z.string().min(1, f.label + '을(를) 선택하세요'); break
    case 'tags':     s = z.array(z.string().trim().min(1)).max(20); break
    default:         s = z.any()
  }
  return f.required ? s : s.optional().nullable()
}

export function resourceSchema(res: Resource) {
  const formFields = res.fields.filter((f) => f.form !== false)
  const shape = Object.fromEntries(formFields.map((f) => [f.key, fieldSchema(f)]))
  const create = z.object(shape).strict()                             // 모르는 키는 거부: 프론트가 id/createdAt 을 실어 보내도 무시가 아니라 400
  const update = create.partial()
  return { create, update, fields: formFields }
}

// 서버: schema.create.parse(body)          → ZodError 는 9회차 02번처럼 400 + 필드별 메시지로
// 폼  : toTypedSchema(schema.create)       → VeeValidate (06번). 같은 메시지가 양쪽에서 나온다
// 타입: type ProductInput = z.infer<ReturnType<typeof resourceSchema>['create']>
` },
        },
        {
          id: 'l4', short: `useResource`,
          title: `프론트는 리소스 이름 하나로 목록·단건·생성·수정·삭제를 얻는다`,
          why: `페이지마다 $api 경로를 조립하면 오타와 캐시 무효화 누락이 생깁니다. useResource('product') 가 키를 정하고, 쓰기 뒤에는 관련 목록 캐시를 지웁니다. 목록 파라미터는 URL 쿼리와 묶습니다.`,
          single: { label: `✓ composables/useResource.ts`, code: String.raw`
import { RESOURCES } from '~/shared/resources'

export function useResource<T extends { id: string }>(name: string) {
  const res = RESOURCES[name]
  if (!res) throw new Error('unknown resource ' + name)
  const { $api } = useNuxtApp()
  const base = '/api/admin/' + name

  // 목록: 쿼리는 URL 에서 (12회차 06번과 같은 패턴). 키에 name 을 넣어 리소스별로 캐시
  function useList(query: Ref<Record<string, unknown>>) {
    return useFetch<{ items: T[]; total: number; page: number; per: number }>(base, {
      query, watch: [query], key: 'list:' + name, default: () => ({ items: [], total: 0, page: 1, per: 20 })
    })
  }
  const useOne = (id: MaybeRefOrGetter<string>) => useFetch<T>(() => base + '/' + toValue(id), { key: 'one:' + name + ':' + toValue(id) })

  // 쓰기 뒤: 이 리소스의 목록·단건 캐시를 모두 무효화 (다음 진입 때 다시 받는다)
  const invalidate = (id?: string) => { clearNuxtData((k) => k.startsWith('list:' + name) || (id ? k === 'one:' + name + ':' + id : k.startsWith('one:' + name))); refreshNuxtData('list:' + name) }

  return {
    res, useList, useOne, invalidate,
    create: async (data: Partial<T>) => { const row = await $api<T>(base, { method: 'POST', body: data }); invalidate(); return row },
    update: async (id: string, data: Partial<T>) => { const row = await $api<T>(base + '/' + id, { method: 'PATCH', body: data }); invalidate(id); return row },
    remove: async (id: string) => { await $api(base + '/' + id, { method: 'DELETE' }); invalidate(id) },
    bulk: async (ids: string[], action: string, payload?: unknown) => { const r = await $api(base + '/bulk', { method: 'POST', body: { ids, action, payload } }); invalidate(); return r },
    label: (count?: number) => (count != null ? count.toLocaleString() + '개 ' : '') + (res.labelPlural ?? res.label)
  }
}

// relation 필드의 선택지: 작은 리소스는 통째로, 큰 리소스는 검색형으로 (06번 RelationSelect)
export function useRelationOptions(resource: string, labelKey: string) {
  return useFetch<{ items: any[] }>('/api/admin/' + resource, { query: { per: 100, sort: labelKey, dir: 'asc' }, key: 'rel:' + resource,
    transform: (r) => r.items.map((i) => ({ value: i.id, label: i[labelKey] })), default: () => [] })
}
` },
        },
        {
          id: 'l5', short: `목록 테이블`,
          title: `컬럼은 필드 정의에서, 정렬·검색·페이지는 URL 에서, 행 선택은 테이블이`,
          why: `리소스별 목록 페이지는 제목과 리소스 이름만 다릅니다. 테이블 컴포넌트가 list 필드로 컬럼을 만들고 타입별 셀 렌더링(돈·날짜·이미지·상태 배지) 을 맡습니다. 선택된 id 는 일괄 작업(10번) 으로 넘깁니다.`,
          single: { label: `✓ components/admin/ResourceTable.vue + pages/admin/[resource]/index.vue`, code: String.raw`
<!-- components/admin/ResourceTable.vue -->
<script setup lang="ts" generic="T extends { id: string }">
import type { Resource, Field } from '~/shared/resources/types'
const props = defineProps<{ resource: Resource; items: T[]; loading?: boolean; sort: string; dir: 'asc' | 'desc' }>()
const emit = defineEmits<{ sort: [key: string]; open: [item: T] }>()
const selected = defineModel<string[]>('selected', { default: () => [] })

const columns = computed(() => props.resource.fields.filter((f) => f.list))
const allChecked = computed(() => props.items.length > 0 && props.items.every((i) => selected.value.includes(i.id)))
function toggleAll() { selected.value = allChecked.value ? [] : props.items.map((i) => i.id) }
function cell(item: any, f: Field) {
  const v = item[f.key]
  if (v == null || v === '') return '–'
  switch (f.type) {
    case 'money': return Number(v).toLocaleString() + '원'
    case 'datetime': return formatDate(v, 'yyyy-MM-dd HH:mm')
    case 'boolean': return v ? '예' : '아니오'
    case 'select': return f.options?.find((o) => o.value === v)?.label ?? v
    case 'relation': return item[f.key.replace(/Id$/, '')]?.[f.relation!.labelKey] ?? v
    case 'tags': return (v as string[]).join(', ')
    default: return String(v)
  }
}
</script>
<template>
  <table class="table" :class="{ loading }">
    <thead><tr>
      <th class="w-8"><input type="checkbox" :checked="allChecked" @change="toggleAll"></th>
      <th v-for="f in columns" :key="f.key" :style="{ width: typeof f.list === 'object' ? f.list.width : undefined }"
          :class="{ sortable: typeof f.list === 'object' && f.list.sortable }" @click="typeof f.list === 'object' && f.list.sortable && emit('sort', f.key)">
        {{ f.label }} <span v-if="sort === f.key">{{ dir === 'asc' ? '↑' : '↓' }}</span>
      </th>
    </tr></thead>
    <tbody>
      <tr v-for="item in items" :key="item.id" :class="{ selected: selected.includes(item.id) }" @click="emit('open', item)">
        <td @click.stop><input v-model="selected" type="checkbox" :value="item.id"></td>
        <td v-for="f in columns" :key="f.key">
          <img v-if="f.type === 'image' && item[f.key]" :src="item[f.key]" class="thumb" alt="">
          <StatusBadge v-else-if="f.key === 'status'" :value="item[f.key]" :options="f.options" />
          <template v-else>{{ cell(item, f) }}</template>
        </td>
      </tr>
      <tr v-if="!loading && !items.length"><td :colspan="columns.length + 1" class="empty">{{ resource.label }}이(가) 없습니다</td></tr>
    </tbody>
  </table>
</template>

<!-- pages/admin/[resource]/index.vue : 모든 리소스가 이 한 페이지를 쓴다 -->
<script setup lang="ts">
const route = useRoute(); const router = useRouter()
const name = route.params.resource as string
const r = useResource(name)
const query = computed(() => ({ page: Number(route.query.page) || 1, q: route.query.q ?? '', sort: route.query.sort ?? r.res.defaultSort?.key, dir: route.query.dir ?? r.res.defaultSort?.dir, ...pickFilters(route.query, r.res) }))
const { data, status } = await r.useList(query)
const selected = ref<string[]>([])
function set(patch: Record<string, unknown>) { router.replace({ query: { ...route.query, ...patch, page: 'page' in patch ? patch.page : undefined } }) }
function sortBy(key: string) { set({ sort: key, dir: query.value.sort === key && query.value.dir === 'desc' ? 'asc' : 'desc' }) }
definePageMeta({ middleware: 'admin', layout: 'admin' })
</script>
<template>
  <AdminPage :title="r.label(data.total)">
    <template #actions><NuxtLink :to="'/admin/' + name + '/new'" class="btn-primary">+ {{ r.res.label }} 추가</NuxtLink></template>
    <ListToolbar :resource="r.res" :query="query" @change="set" />
    <BulkBar v-if="selected.length" :resource="r.res" :ids="selected" @done="selected = []" />
    <ResourceTable v-model:selected="selected" :resource="r.res" :items="data.items" :loading="status === 'pending'" :sort="query.sort" :dir="query.dir" @sort="sortBy" @open="(i) => navigateTo('/admin/' + name + '/' + i.id)" />
    <Pagination :page="data.page" :total="data.total" :per-page="data.per" @change="(page) => set({ page })" />
  </AdminPage>
</template>
` },
        },
        {
          id: 'l6', short: `자동 폼`,
          title: `필드 타입별 입력 컴포넌트를 표로 매핑하고, 폼은 필드를 돌며 그린다`,
          why: `타입 → 컴포넌트 표가 있으면 리소스에 richtext 필드를 추가해도 폼 코드를 안 건드립니다. VeeValidate 의 useForm 에 03번 스키마를 넣어 검증하고, 필드별 오류는 각 입력 아래에 나옵니다.`,
          single: { label: `✓ components/admin/ResourceForm.vue`, code: String.raw`
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { Resource, Field } from '~/shared/resources/types'
import { resourceSchema } from '~/shared/resources/schema'

const props = defineProps<{ resource: Resource; initial?: Record<string, any>; mode: 'create' | 'edit'; saving?: boolean }>()
const emit = defineEmits<{ submit: [values: Record<string, any>] }>()

const schema = resourceSchema(props.resource)
const fields = computed(() => schema.fields.filter((f) => f.form === true || f.form === undefined || f.form === props.mode))

// 타입 → 컴포넌트. 새 타입은 여기 한 줄
const INPUTS: Record<string, Component> = {
  text: resolveComponent('FieldText'), textarea: resolveComponent('FieldTextarea'), number: resolveComponent('FieldNumber'), money: resolveComponent('FieldMoney'),
  boolean: resolveComponent('FieldSwitch'), select: resolveComponent('FieldSelect'), date: resolveComponent('FieldDate'), datetime: resolveComponent('FieldDate'),
  image: resolveComponent('FieldImage'), relation: resolveComponent('FieldRelation'), tags: resolveComponent('FieldTags'), richtext: resolveComponent('FieldRichText')
}

const { handleSubmit, errors, defineField, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(props.mode === 'create' ? schema.create : schema.update),
  initialValues: props.initial ?? Object.fromEntries(fields.value.map((f) => [f.key, f.type === 'tags' ? [] : f.type === 'boolean' ? false : '']))
})
const models = Object.fromEntries(fields.value.map((f) => [f.key, defineField(f.key)]))      // [value, attrs]

const onSubmit = handleSubmit((values) => emit('submit', values))
useLeaveGuard(() => meta.value.dirty && !props.saving)                                       // 3회차 10번: 수정 중 이탈 확인
defineExpose({ resetForm, isDirty: () => meta.value.dirty })
</script>

<template>
  <form class="form-grid" @submit.prevent="onSubmit">
    <div v-for="f in fields" :key="f.key" class="field" :class="{ wide: ['textarea', 'richtext', 'image'].includes(f.type) }">
      <label :for="'f-' + f.key">{{ f.label }}<span v-if="f.required" class="req">*</span></label>
      <component
        :is="INPUTS[f.type]" :id="'f-' + f.key"
        v-model="models[f.key][0].value" v-bind="models[f.key][1].value"
        :field="f" :invalid="!!errors[f.key]" :placeholder="f.placeholder"
        :options="f.options" :relation="f.relation" :min="f.min" :max="f.max" :maxlength="f.maxLength"
      />
      <p v-if="errors[f.key]" class="error">{{ errors[f.key] }}</p>
      <p v-else-if="f.help" class="help">{{ f.help }}</p>
    </div>
    <div class="form-actions">
      <slot name="actions" :dirty="meta.dirty" />
      <button type="submit" class="btn-primary" :disabled="saving || (mode === 'edit' && !meta.dirty)">{{ saving ? '저장 중…' : mode === 'create' ? '등록' : '저장' }}</button>
    </div>
  </form>
</template>

<!-- FieldRelation: 선택지가 100개 이하면 select, 아니면 검색형 콤보박스 (12회차 02번 SearchBox 재사용) -->
<!-- FieldImage: 6회차 드롭존 + 업로드 → URL 을 값으로 -->
` },
        },
        {
          id: 'l7', short: `생성·수정 페이지`,
          title: `new 와 id 를 한 페이지에서, 저장 뒤 목록 복귀와 "계속 추가" 를 지원한다`,
          why: `생성과 수정 페이지를 따로 만들면 폼이 두 벌이 됩니다. id 가 'new' 면 생성 모드, 아니면 데이터를 받아 수정 모드. 저장 성공 후 목록으로 가되, 연속 등록이 잦은 리소스는 "저장하고 하나 더" 를 둡니다.`,
          single: { label: `✓ pages/admin/[resource]/[id].vue`, code: String.raw`
<script setup lang="ts">
const route = useRoute()
const name = route.params.resource as string
const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')
const r = useResource<any>(name)
const toast = useToast()

const { data: item, status } = isNew.value
  ? { data: ref(null), status: ref('success') }
  : await r.useOne(id)
if (!isNew.value && status.value === 'error') throw createError({ statusCode: 404, statusMessage: r.res.label + '을(를) 찾을 수 없습니다', fatal: true })

const saving = ref(false)
const formRef = useTemplateRef<any>('formRef')
const andMore = ref(false)

async function save(values: Record<string, any>) {
  saving.value = true
  try {
    if (isNew.value) {
      const row = await r.create(values)
      toast.success(r.res.label + '을(를) 등록했습니다')
      if (andMore.value) { formRef.value?.resetForm(); andMore.value = false; return }       // 하나 더
      await navigateTo('/admin/' + name + '/' + row.id, { replace: true })                 // 등록 → 수정 화면으로 (뒤로가기 시 new 로 안 돌아가게 replace)
    } else {
      await r.update(id.value, values)
      toast.success('저장했습니다')
      formRef.value?.resetForm({ values })                                                 // dirty 초기화
    }
  } catch (e) {
    const err = toApiError(e)
    if (err.isValidation) toast.error('입력을 확인하세요')                                 // 필드 오류는 폼이 setErrors 로 표시 (3회차 01번)
    else toast.error(userMessage(err))
  } finally { saving.value = false }
}

async function remove() {
  if (!(await confirm({ title: '"' + item.value?.[r.res.titleKey ?? 'id'] + '" 을(를) 삭제할까요?', message: r.res.softDelete ? '삭제 후 30일 안에 복원할 수 있습니다' : '되돌릴 수 없습니다', danger: true }))) return
  await r.remove(id.value); toast.success('삭제했습니다'); await navigateTo('/admin/' + name)
}
definePageMeta({ middleware: 'admin', layout: 'admin' })
</script>

<template>
  <AdminPage :title="isNew ? r.res.label + ' 추가' : item?.[r.res.titleKey ?? 'id'] ?? r.res.label" :back="'/admin/' + name">
    <template v-if="!isNew" #actions>
      <button class="btn-danger" @click="remove">삭제</button>
      <AuditLink :resource="name" :id="id" />                                               <!-- 09번 -->
    </template>
    <ResourceForm ref="formRef" :resource="r.res" :initial="item ?? undefined" :mode="isNew ? 'create' : 'edit'" :saving="saving" @submit="save">
      <template v-if="isNew" #actions>
        <button type="submit" class="btn" :disabled="saving" @click="andMore = true">저장하고 하나 더</button>
      </template>
    </ResourceForm>
  </AdminPage>
</template>
` },
        },
        {
          id: 'l8', short: `소프트 삭제`,
          title: `삭제는 deletedAt 을 찍고, 휴지통에서 복원하고, 연관 데이터는 미리 알려 준다`,
          why: `관리자가 잘못 누른 삭제를 되돌릴 수 있어야 합니다. 목록 조회는 deletedAt null 만 보고, 휴지통 화면은 반대로 봅니다. 주문이 달린 상품처럼 연관 데이터가 있으면 삭제 전에 개수를 보여 주고, 30일 지난 건 배치가 정리합니다.`,
          single: { label: `✓ 휴지통 API + 연관 확인 + 정리 작업`, code: String.raw`
// server/api/admin/[resource]/trash.get.ts — 삭제된 것만
export default defineEventHandler(async (event) => {
  const c = crud(event); await requirePermission(event, c.res.permissions?.delete)
  if (!c.res.softDelete) throw createError({ statusCode: 400, statusMessage: '휴지통이 없는 리소스' })
  const model = (db as any)[c.res.name]
  return model.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, take: 200, include: { deletedByUser: { select: { name: true } } } })
})

// server/api/admin/[resource]/[id]/restore.post.ts
export default defineEventHandler(async (event) => {
  const c = crud(event); const user = await requirePermission(event, c.res.permissions?.delete)
  const id = getRouterParam(event, 'id')!
  const row = await (db as any)[c.res.name].update({ where: { id }, data: { deletedAt: null, deletedBy: null } })
  await audit({ user, event }, c.res.name, id, 'restore', null, row)
  return row
})

// 삭제 전 연관 데이터 개수: server/api/admin/[resource]/[id]/refs.get.ts
const REFS: Record<string, (id: string) => Promise<{ label: string; count: number }[]>> = {
  product: async (id) => [
    { label: '주문', count: await db.orderLine.count({ where: { productId: id } }) },
    { label: '장바구니', count: await db.cartItem.count({ where: { productId: id } }) },
    { label: '리뷰', count: await db.review.count({ where: { productId: id } }) }
  ],
  category: async (id) => [{ label: '상품', count: await db.product.count({ where: { categoryId: id, deletedAt: null } }) }]
}
export default defineEventHandler(async (event) => (REFS[getRouterParam(event, 'resource')!]?.(getRouterParam(event, 'id')!) ?? []))

// 프론트 삭제 확인 (07번 remove 를 이렇게 바꾼다)
async function remove() {
  const refs = (await $api<{ label: string; count: number }[]>('/api/admin/' + name + '/' + id.value + '/refs')).filter((r) => r.count > 0)
  const message = refs.length
    ? '연결된 데이터가 있습니다: ' + refs.map((r) => r.label + ' ' + r.count + '건') + '. 삭제해도 기존 주문·리뷰는 유지되며 목록과 검색에서만 사라집니다.'
    : r.res.softDelete ? '삭제 후 30일 안에 휴지통에서 복원할 수 있습니다' : '되돌릴 수 없습니다'
  if (!(await confirm({ title: '삭제할까요?', message, danger: true, confirmText: '삭제' }))) return
  await r.remove(id.value); toast.success('삭제했습니다', { action: { label: '실행 취소', onClick: () => $api('/api/admin/' + name + '/' + id.value + '/restore', { method: 'POST' }).then(() => r.invalidate()) } })
  await navigateTo('/admin/' + name)
}

// server/tasks/purge-trash.ts — 30일 지난 소프트 삭제 행을 실제로 지운다 (매일)
export default defineTask({ meta: { name: 'trash:purge' }, async run() {
  const cutoff = new Date(Date.now() - 30 * 86_400_000); let n = 0
  for (const name of Object.keys(RESOURCES).filter((k) => RESOURCES[k].softDelete)) n += (await (db as any)[name].deleteMany({ where: { deletedAt: { lt: cutoff } } })).count
  return { result: n }
} })
` },
        },
        {
          id: 'l9', short: `감사 로그`,
          title: `누가 언제 무엇을 바꿨는지, 바뀐 필드만 diff 로 남긴다`,
          why: `"가격이 왜 바뀌었죠?" 에 답하려면 변경 전후가 있어야 합니다. 모든 쓰기가 02번 crud 를 거치므로 거기서 한 번만 기록합니다. 전체 스냅샷이 아니라 바뀐 필드만 저장하면 읽기도 쉽고 용량도 작습니다.`,
          single: { label: `✓ server/utils/audit.ts + components/admin/AuditTimeline.vue`, code: String.raw`
// server/utils/audit.ts
const IGNORE = new Set(['updatedAt', 'updatedBy', 'createdAt', 'createdBy'])

export function diff(before: any, after: any) {
  if (!before || !after) return null
  const out: Record<string, { from: unknown; to: unknown }> = {}
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (IGNORE.has(k) || typeof after[k] === 'object' && after[k] && !Array.isArray(after[k]) && !(after[k] instanceof Date)) continue   // 관계 객체 제외
    const a = before[k] instanceof Date ? before[k].toISOString() : before[k], b = after[k] instanceof Date ? after[k].toISOString() : after[k]
    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = { from: a, to: b }
  }
  return Object.keys(out).length ? out : null
}

export async function audit(ctx: { user: User; event: H3Event }, resource: string, targetId: string, action: 'create' | 'update' | 'delete' | 'restore' | 'bulk', before: any, after: any) {
  const changes = action === 'update' ? diff(before, after) : null
  if (action === 'update' && !changes) return                       // 아무것도 안 바뀐 저장은 기록하지 않는다
  await db.auditLog.create({ data: {
    resource, targetId, action, changes, actorId: ctx.user.id,
    ip: getRequestIP(ctx.event, { xForwardedFor: true }), ua: getHeader(ctx.event, 'user-agent')?.slice(0, 200),
    requestId: ctx.event.context.requestId                           // 9회차 05번: 서버 로그와 연결
  } })
}

// server/api/admin/audit.get.ts : ?resource=product&targetId=... 또는 ?actorId=...
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'audit:read')
  const q = getQuery(event)
  return db.auditLog.findMany({ where: { resource: q.resource as string, targetId: q.targetId as string, actorId: q.actorId as string }, orderBy: { createdAt: 'desc' }, take: 100, include: { actor: { select: { name: true } } } })
})

<!-- components/admin/AuditTimeline.vue -->
<script setup lang="ts">
const props = defineProps<{ resource: string; targetId: string }>()
const { data: logs } = await useFetch('/api/admin/audit', { query: { resource: props.resource, targetId: props.targetId }, default: () => [] })
const res = RESOURCES[props.resource]
const label = (k: string) => res.fields.find((f) => f.key === k)?.label ?? k
const show = (v: unknown) => v == null || v === '' ? '(없음)' : Array.isArray(v) ? v.join(', ') : String(v)
const ACTION = { create: '등록', update: '수정', delete: '삭제', restore: '복원', bulk: '일괄 변경' }
</script>
<template>
  <ol class="timeline">
    <li v-for="l in logs" :key="l.id">
      <div class="row gap tiny muted"><b>{{ l.actor?.name ?? '시스템' }}</b> {{ ACTION[l.action] }} <time>{{ formatDate(l.createdAt, 'MM-dd HH:mm') }}</time></div>
      <ul v-if="l.changes" class="changes">
        <li v-for="(c, k) in l.changes" :key="k"><b>{{ label(k) }}</b>: <del>{{ show(c.from) }}</del> → <ins>{{ show(c.to) }}</ins></li>
      </ul>
    </li>
  </ol>
</template>
` },
        },
        {
          id: 'l10', short: `일괄 작업과 가져오기`,
          title: `선택한 행에 상태 변경·삭제를 한 번에, CSV 는 미리보기와 오류 행을 보여 주고 넣는다`,
          why: `상품 200개 품절 처리를 하나씩 할 수는 없습니다. 일괄 작업은 서버에서 트랜잭션으로, 결과는 성공/실패 개수로. CSV 가져오기는 먼저 파싱해 보여 주고(검증 오류 행 표시), 확인 후에 넣습니다. 부분 성공을 명확히 알려 줍니다.`,
          single: { label: `✓ server/api/admin/[resource]/bulk.post.ts + import 흐름`, code: String.raw`
// server/api/admin/[resource]/bulk.post.ts
export default defineEventHandler(async (event) => {
  const c = crud(event); const user = await requirePermission(event, c.res.permissions?.write)
  const { ids, action, payload } = z.object({ ids: z.array(z.string()).min(1).max(500), action: z.enum(['set', 'delete', 'restore']), payload: z.record(z.unknown()).optional() }).parse(await readBody(event))
  const model = (db as any)[c.res.name]
  const schema = resourceSchema(c.res)

  if (action === 'set') {
    const data = schema.update.parse(payload)                          // 바꿀 필드만, 같은 검증
    const r = await model.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { ...data, updatedBy: user.id } })
    await audit({ user, event }, c.res.name, ids.join(','), 'bulk', null, { count: r.count, data })
    return { ok: r.count, failed: ids.length - r.count }
  }
  if (action === 'delete') { const r = await model.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date(), deletedBy: user.id } }); return { ok: r.count, failed: ids.length - r.count } }
  if (action === 'restore') { const r = await model.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } }); return { ok: r.count, failed: 0 } }
})

<!-- components/admin/BulkBar.vue : 선택 N개 → 상태 변경 / 삭제 -->
<script setup lang="ts">
const props = defineProps<{ resource: Resource; ids: string[] }>(); const emit = defineEmits<{ done: [] }>()
const r = useResource(props.resource.name); const toast = useToast()
const statusField = props.resource.fields.find((f) => f.key === 'status')
async function setStatus(value: string) {
  const res = await r.bulk(props.ids, 'set', { status: value })
  toast[res.failed ? 'warning' : 'success'](res.ok + '개 변경' + (res.failed ? ', ' + res.failed + '개 실패' : '')); emit('done')
}
async function removeAll() {
  if (!(await confirm({ title: props.ids.length + '개를 삭제할까요?', danger: true }))) return
  const res = await r.bulk(props.ids, 'delete'); toast.success(res.ok + '개 삭제'); emit('done')
}
</script>
<template>
  <div class="bulk-bar"><b>{{ ids.length }}개 선택</b>
    <select v-if="statusField" @change="setStatus(($event.target as HTMLSelectElement).value)"><option value="">상태 변경…</option><option v-for="o in statusField.options" :key="o.value" :value="o.value">{{ o.label }}</option></select>
    <button class="btn-danger-sm" @click="removeAll">삭제</button>
  </div>
</template>

// CSV 가져오기: 1) 파싱·검증은 클라이언트에서 미리보기 (6회차 10번 파서) 2) 유효한 행만 서버로
async function preview(file: File) {
  const rows = await parseCsv(file)                                    // [{ 상품명, 판매가, ... }]
  const byLabel = Object.fromEntries(r.res.fields.map((f) => [f.label, f.key]))
  const schema = resourceSchema(r.res).create
  previewRows.value = rows.map((raw, i) => {
    const data = Object.fromEntries(Object.entries(raw).map(([label, v]) => [byLabel[label] ?? label, v]))
    const parsed = schema.safeParse(data)
    return parsed.success ? { line: i + 2, data: parsed.data, errors: null } : { line: i + 2, data, errors: parsed.error.issues.map((e) => e.path.join('.') + ': ' + e.message) }
  })
}
async function commit() {
  const valid = previewRows.value.filter((r) => !r.errors).map((r) => r.data)
  const res = await $api<{ ok: number; failed: { line: number; message: string }[] }>('/api/admin/' + name + '/import', { method: 'POST', body: { rows: valid } })   // 서버는 createMany 가 아니라 행별 create + 오류 수집 (부분 성공 보고)
  toast.success(res.ok + '개 등록' + (res.failed.length ? ', ' + res.failed.length + '개 실패' : '')); r.invalidate()
}
<!-- 미리보기 표: 오류 행은 빨간 배경 + 사유. "오류 N행은 제외하고 M행 등록" 버튼 -->
` },
        },
      ],
    },
    {
      id: 'practice-15', no: 15, name: `알림 설정과 푸시 (Web Push)`,
      lead: `인앱 알림, 브라우저 푸시, 이메일을 한 모델로 다루는 방법입니다. 권한 요청 UX, 서비스 워커, VAPID 구독, 서버 발송, 클릭 처리, 설정 페이지, 알림 센터, 읽지 않은 수 배지, 서버 쪽 알림 파이프라인.`,
      lessons: [
        {
          id: 'l1', short: `전체 구조`,
          title: `알림은 "타입 × 채널" 이고, 발송은 서버의 notify() 한 곳에서 시작한다`,
          why: `댓글 알림은 인앱으로만, 결제 알림은 푸시와 메일로. 이런 조합이 사용자 설정과 섞이면 코드가 금방 꼬입니다. 타입과 채널을 표로 정의하고 notify() 가 설정을 보고 채널별 발송기로 흘려보냅니다.`,
          lang: 'plain',
          single: { label: `✓ 모델과 흐름`, code: String.raw`
타입 (무슨 일)                     기본 채널          사용자가 끌 수 있나
  order.paid     결제 완료           inapp, push, email   push/email 만
  order.shipped  배송 시작           inapp, push          push 만
  comment.reply  내 글에 답글        inapp, push          전부
  promo          프로모션            email                전부 (마케팅 동의)
  system         공지·보안           inapp, email         없음

테이블
  notification_setting  (userId, type, channel, enabled)      없으면 기본값
  notification          (id, userId, type, title, body, url, data, readAt, createdAt)   인앱 목록
  push_subscription     (id, userId, endpoint, p256dh, auth, ua, createdAt, lastUsedAt)
  email_queue           (…)  메일은 큐로 (지연·재시도)

흐름
  이벤트 발생 (결제 승인, 댓글 저장)
    └─ notify(userId, 'order.paid', { orderId, amount })         10번
         ├─ 설정 조회 → 켜진 채널만
         ├─ inapp : notification INSERT → SSE 로 "새 알림" 이벤트 → 배지 +1           08·09번
         ├─ push  : push_subscription 조회 → web-push 로 발송 → 410 이면 구독 삭제      05번
         └─ email : 템플릿 렌더 → email_queue

브라우저
  설정 페이지에서 "푸시 켜기" → 권한 요청 (02) → SW 등록 (03) → pushManager.subscribe (04) → POST /api/push/subscribe
  SW 가 push 이벤트를 받아 showNotification → notificationclick 으로 url 열기 (06)

파일
  public/sw.js                          03·06
  composables/usePush.ts                02·04
  server/utils/push.ts, notify.ts       05·10
  pages/settings/notifications.vue      07
  components/NotificationCenter.vue     08
  composables/useUnread.ts              09
` },
        },
        {
          id: 'l2', short: `권한 요청 UX`,
          title: `들어오자마자 묻지 않는다: 맥락 있는 안내 → 사용자가 누르면 그때 requestPermission`,
          why: `페이지 열리자마자 뜨는 권한 창은 대부분 "차단" 을 받고, 한 번 차단되면 되돌리기 어렵습니다. 알림이 필요한 순간(주문 완료, 설정 페이지) 에 우리 UI 로 먼저 설명하고, 동의한 클릭 안에서 브라우저 권한을 요청합니다.`,
          single: { label: `✓ composables/usePush.ts (권한 부분) + components/PushPrompt.vue`, code: String.raw`
// composables/usePush.ts — 1/2
export function usePushPermission() {
  const supported = computed(() => import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
  const permission = ref<NotificationPermission | 'unsupported'>('default')
  const dismissedAt = useLocalStorage<number | null>('push:prompt-dismissed', null)

  onMounted(() => { permission.value = supported.value ? Notification.permission : 'unsupported' })

  // 안내를 보여 줄지: 지원하고, 아직 default 이고, 최근 14일 안에 "나중에" 를 누르지 않았을 때
  const shouldPrompt = computed(() => permission.value === 'default' && (!dismissedAt.value || Date.now() - dismissedAt.value > 14 * 86_400_000))

  async function request(): Promise<NotificationPermission> {
    if (!supported.value) return 'denied'
    const result = await Notification.requestPermission()     // 반드시 사용자 클릭 핸들러 안에서 (iOS Safari 는 특히)
    permission.value = result
    return result
  }
  function dismiss() { dismissedAt.value = Date.now() }
  return { supported, permission, shouldPrompt, request, dismiss }
}

<!-- components/PushPrompt.vue : 우리 UI 로 먼저 설명. 주문 완료 페이지나 설정에서 사용 -->
<script setup lang="ts">
const props = defineProps<{ reason?: string }>()
const { shouldPrompt, permission, request, dismiss } = usePushPermission()
const { subscribe } = usePushSubscription()                     // 04번
const busy = ref(false)
async function enable() {
  busy.value = true
  try {
    if ((await request()) === 'granted') { await subscribe(); useToast().success('알림을 켰습니다') }
  } finally { busy.value = false }
}
</script>
<template>
  <div v-if="shouldPrompt" class="push-prompt">
    <p><b>{{ reason ?? '배송 상태가 바뀌면' }}</b> 알려 드릴까요?</p>
    <p class="tiny muted">브라우저 알림으로 보냅니다. 설정에서 언제든 끌 수 있습니다.</p>
    <div class="row gap">
      <button class="btn-primary" :disabled="busy" @click="enable">알림 받기</button>
      <button class="btn" @click="dismiss">나중에</button>
    </div>
  </div>
  <p v-else-if="permission === 'denied'" class="tiny muted">
    알림이 차단되어 있습니다. 주소창 왼쪽 자물쇠 → 알림 → 허용으로 바꾼 뒤 새로고침하세요.
  </p>
</template>
` },
        },
        {
          id: 'l3', short: `서비스 워커`,
          title: `sw.js 는 push 를 받아 알림을 띄우고, 클릭을 받아 창을 연다`,
          why: `푸시는 탭이 닫혀 있어도 서비스 워커가 받습니다. push 이벤트에서 payload 를 읽어 showNotification, 같은 tag 면 갱신. 이 파일은 빌드를 안 거치므로 public/ 에 두고 순수 JS 로 씁니다.`,
          single: { label: `✓ public/sw.js`, code: String.raw`
// public/sw.js — 번들러를 안 거친다. import 없이, 브라우저 JS 로
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = { title: '알림', body: '', url: '/', tag: undefined, icon: '/icons/icon-192.png' }
  try { data = { ...data, ...event.data.json() } } catch { data.body = event.data?.text() ?? '' }

  event.waitUntil((async () => {
    // 같은 내용의 탭이 이미 포커스되어 있으면 OS 알림 대신 앱 안에서 보여 주기 (선택)
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const focused = wins.find((w) => w.focused)
    if (focused && data.inappIfFocused !== false) { focused.postMessage({ type: 'push', data }); return }

    await self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon, badge: '/icons/badge-72.png',       // badge: 안드로이드 상태바용 단색 아이콘
      tag: data.tag,                                        // 같은 tag 는 새 알림으로 교체 (배송 상태 갱신 등)
      renotify: !!data.tag,
      data: { url: data.url, id: data.id },
      actions: data.actions ?? [],                          // [{ action: 'open', title: '보기' }] (지원 브라우저만)
      timestamp: data.at ?? Date.now()
    })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url ?? '/', self.location.origin).href
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const same = wins.find((w) => w.url === url) ?? wins[0]
    if (same) { await same.focus(); if (same.url !== url) same.navigate(url); same.postMessage({ type: 'notification-click', id: event.notification.data?.id }) }
    else await self.clients.openWindow(url)
    // 읽음 처리: 앱이 떠 있지 않아도 서버에 알린다
    if (event.notification.data?.id) fetch('/api/notifications/' + event.notification.data.id + '/read', { method: 'POST', credentials: 'include' }).catch(() => {})
  })())
})

self.addEventListener('pushsubscriptionchange', (event) => {
  // 브라우저가 구독을 갱신했을 때: 새 구독을 서버에 다시 등록
  event.waitUntil(self.registration.pushManager.subscribe(event.oldSubscription?.options ?? { userVisibleOnly: true })
    .then((sub) => fetch('/api/push/subscribe', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })))
})
// PWA 를 같이 쓰면 (16회차) 이 내용을 vite-pwa 의 injectManifest 소스 파일에 합친다. SW 는 하나만 있어야 한다
` },
        },
        {
          id: 'l4', short: `구독 등록`,
          title: `VAPID 공개키로 구독을 만들고 서버에 저장한다. 끄면 양쪽 다 지운다`,
          why: `pushManager.subscribe 가 돌려주는 endpoint·keys 가 "이 브라우저로 보내는 주소" 입니다. 서버에 저장해야 보낼 수 있습니다. 공개키는 base64url 을 Uint8Array 로 바꿔 넣어야 하고, 이미 구독이 있으면 재사용합니다.`,
          single: { label: `✓ composables/usePush.ts (구독 부분) + server/api/push/subscribe.post.ts`, code: String.raw`
// composables/usePush.ts — 2/2
function urlBase64ToUint8Array(s: string) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushSubscription() {
  const { public: { vapidPublicKey } } = useRuntimeConfig()
  const { $api } = useNuxtApp()
  const subscribed = ref<boolean | null>(null)                  // null: 아직 모름

  async function registration() {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    return reg
  }
  async function current() {
    if (!('serviceWorker' in navigator)) return null
    const reg = await navigator.serviceWorker.getRegistration('/')
    return reg ? reg.pushManager.getSubscription() : null
  }
  onMounted(async () => { subscribed.value = !!(await current()) })

  async function subscribe() {
    const reg = await registration()
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) }))
    await $api('/api/push/subscribe', { method: 'POST', body: { ...sub.toJSON(), ua: navigator.userAgent.slice(0, 200) } })
    subscribed.value = true
  }
  async function unsubscribe() {
    const sub = await current()
    if (sub) { await $api('/api/push/subscribe', { method: 'DELETE', body: { endpoint: sub.endpoint } }); await sub.unsubscribe() }
    subscribed.value = false
  }
  return { subscribed, subscribe, unsubscribe }
}

// server/api/push/subscribe.post.ts — endpoint 가 유니크. 같은 브라우저는 upsert
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const b = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string(), auth: z.string() }), ua: z.string().optional() }).parse(await readBody(event))
  await db.pushSubscription.upsert({
    where: { endpoint: b.endpoint },
    create: { userId: user.id, endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth, ua: b.ua },
    update: { userId: user.id, p256dh: b.keys.p256dh, auth: b.keys.auth, lastUsedAt: new Date() }      // 다른 계정으로 로그인하면 소유자가 바뀐다
  })
  return { ok: true }
})
// subscribe.delete.ts: db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } })
// 로그아웃 시(1회차 06번 handleAuthLost) unsubscribe() 도 같이 → 공용 PC 에서 남의 알림이 뜨지 않는다

// VAPID 키 생성 (한 번만): npx web-push generate-vapid-keys
//   NUXT_PUBLIC_VAPID_PUBLIC_KEY=...   NUXT_VAPID_PRIVATE_KEY=...   NUXT_VAPID_SUBJECT=mailto:admin@example.com
` },
        },
        {
          id: 'l5', short: `서버 발송`,
          title: `web-push 로 사용자의 모든 기기에 보내고, 죽은 구독(410) 은 그 자리에서 지운다`,
          why: `한 사용자가 PC·폰 여러 구독을 가질 수 있습니다. 전부에 보내되 실패를 개별로 처리합니다. 410 Gone / 404 는 브라우저가 구독을 버린 것이니 DB 에서도 지웁니다. payload 는 4KB 제한이라 본문은 짧게, 상세는 url 로.`,
          single: { label: `✓ server/utils/push.ts`, code: String.raw`
import webpush from 'web-push'

let configured = false
function setup() {
  if (configured) return
  const { vapidPrivateKey, vapidSubject, public: { vapidPublicKey } } = useRuntimeConfig()
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  configured = true
}

export type PushPayload = { id?: string; title: string; body: string; url: string; tag?: string; icon?: string; actions?: { action: string; title: string }[]; inappIfFocused?: boolean }

export async function sendPush(userId: string, payload: PushPayload) {
  setup()
  const subs = await db.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return { sent: 0, removed: 0 }
  const body = JSON.stringify({ ...payload, at: Date.now() })
  if (Buffer.byteLength(body) > 3800) console.warn('[push] payload too large', Buffer.byteLength(body))

  let sent = 0, removed = 0
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
        TTL: 60 * 60 * 24,                                    // 하루 안에 기기가 안 켜지면 버린다
        urgency: payload.tag?.startsWith('order') ? 'high' : 'normal'
      })
      sent++
      db.pushSubscription.update({ where: { id: s.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
    } catch (e: any) {
      if (e.statusCode === 410 || e.statusCode === 404) { await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}); removed++ }
      else if (e.statusCode === 429) console.warn('[push] rate limited', s.endpoint.slice(0, 40))
      else console.error('[push] failed', e.statusCode, e.body)
    }
  }))
  return { sent, removed }
}

// 많은 사용자에게 (프로모션): 한 번에 다 보내지 말고 묶어서. 큐가 있으면 큐로
export async function sendPushBulk(userIds: string[], payload: PushPayload, concurrency = 20) {
  for (let i = 0; i < userIds.length; i += concurrency) await Promise.all(userIds.slice(i, i + concurrency).map((id) => sendPush(id, payload)))
}

// 테스트 엔드포인트 (개발용): server/api/push/test.post.ts → sendPush(user.id, { title: '테스트', body: '잘 옵니다', url: '/settings/notifications' })
// 90일 이상 lastUsedAt 이 없는 구독은 정리 작업에서 삭제
` },
        },
        {
          id: 'l6', short: `클릭과 앱 연결`,
          title: `앱이 떠 있으면 SW 메시지로 받아 인앱으로 보여 주고, 클릭은 해당 화면으로 보낸다`,
          why: `탭이 열려 있는데 OS 알림까지 뜨면 이중입니다. 03번 SW 가 포커스된 창에 postMessage 를 보내면 앱은 토스트로 보여 줍니다. 클릭 메시지를 받으면 읽음 처리와 목록 갱신을 합니다.`,
          single: { label: `✓ plugins/push-bridge.client.ts`, code: String.raw`
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return
  const toast = useToast()
  const unread = useUnread()                                   // 09번

  navigator.serviceWorker.addEventListener('message', (event) => {
    const msg = event.data
    if (!msg?.type) return

    if (msg.type === 'push') {
      // 포커스된 탭에서 받은 푸시: OS 알림 대신 인앱 토스트
      const d = msg.data
      toast.info(d.title, { description: d.body, duration: 8000, action: d.url ? { label: '보기', onClick: () => navigateTo(d.url) } : undefined })
      unread.bump(1)
      refreshNuxtData('notifications')                         // 알림 센터가 열려 있으면 갱신
    }

    if (msg.type === 'notification-click') {
      // 다른 탭의 OS 알림을 눌러 이 창이 포커스·이동됨. SW 가 read 요청은 이미 보냈다
      unread.refresh()
      refreshNuxtData('notifications')
    }
  })

  // 앱이 살아 있는 동안 SW 가 갱신되면 (배포 후) 새 SW 로 전환 — 16회차 06번과 겹치면 그쪽 하나만
  navigator.serviceWorker.addEventListener('controllerchange', () => console.info('[sw] controller changed'))
})

// 알림 url 규칙: 항상 앱 내부 경로 (/orders/ORD-123). 외부 링크는 /go?to=... 로 감싸 서버에서 검증 후 리다이렉트
// 알림 id 를 url 에 ?n=<id> 로 붙이면 도착 페이지에서 "어느 알림에서 왔는지" 측정·읽음 처리가 쉽다
` },
        },
        {
          id: 'l7', short: `설정 페이지`,
          title: `타입 × 채널 토글 표, 바꾸는 즉시 저장, 끌 수 없는 것은 잠근다`,
          why: `저장 버튼이 있는 설정 페이지는 사용자가 저장을 잊습니다. 토글은 즉시 저장하고 실패하면 되돌립니다. "시스템 알림" 처럼 끌 수 없는 항목은 비활성으로 보여 주고, 푸시 채널은 브라우저 권한 상태와 함께 보여 줍니다.`,
          single: { label: `✓ pages/settings/notifications.vue`, code: String.raw`
<script setup lang="ts">
import { NOTIFICATION_TYPES, CHANNELS, type Channel } from '~/shared/notifications'    // 01번 표를 코드로: [{ type, label, channels: ['inapp','push','email'], locked: ['inapp'] }]
const { $api } = useNuxtApp(); const toast = useToast()
const { permission, request } = usePushPermission()
const push = usePushSubscription()

const { data: settings } = await useFetch<Record<string, Record<Channel, boolean>>>('/api/me/notification-settings')  // { 'order.paid': { inapp: true, push: true, email: false }, ... }

async function toggle(type: string, channel: Channel) {
  const prev = settings.value![type][channel]
  settings.value![type][channel] = !prev                                        // 낙관적
  try { await $api('/api/me/notification-settings', { method: 'PATCH', body: { type, channel, enabled: !prev } }) }
  catch { settings.value![type][channel] = prev; toast.error('저장하지 못했습니다') }
}

// 푸시 채널 전체 on/off: 권한 + 구독까지 한 번에
async function togglePushAll() {
  if (push.subscribed.value) { await push.unsubscribe(); return }
  if (permission.value !== 'granted' && (await request()) !== 'granted') return toast.error('브라우저에서 알림이 차단되었습니다')
  await push.subscribe()
}
const dnd = reactive({ enabled: false, from: '22:00', to: '08:00' })             // 방해 금지 시간: 서버 notify() 가 push 만 보류했다가 아침에 묶어 보낸다
</script>

<template>
  <SettingsPage title="알림">
    <section class="card">
      <div class="row between">
        <div><b>브라우저 푸시</b><p class="tiny muted">이 기기에서 {{ push.subscribed.value ? '받는 중' : '꺼짐' }}<template v-if="permission === 'denied'"> · 브라우저에서 차단됨</template></p></div>
        <Switch :model-value="!!push.subscribed.value" :disabled="permission === 'denied'" @update:model-value="togglePushAll" />
      </div>
    </section>

    <table class="settings-table">
      <thead><tr><th>알림</th><th v-for="c in CHANNELS" :key="c.key">{{ c.label }}</th></tr></thead>
      <tbody>
        <tr v-for="t in NOTIFICATION_TYPES" :key="t.type">
          <td><b>{{ t.label }}</b><p class="tiny muted">{{ t.description }}</p></td>
          <td v-for="c in CHANNELS" :key="c.key">
            <Switch v-if="t.channels.includes(c.key)" :model-value="settings![t.type][c.key]"
              :disabled="t.locked?.includes(c.key) || (c.key === 'push' && !push.subscribed.value)"
              :title="t.locked?.includes(c.key) ? '끌 수 없는 알림입니다' : undefined" @update:model-value="toggle(t.type, c.key)" />
            <span v-else class="muted">–</span>
          </td>
        </tr>
      </tbody>
    </table>

    <section class="card">
      <label class="row between"><b>방해 금지 시간</b><Switch v-model="dnd.enabled" /></label>
      <div v-if="dnd.enabled" class="row gap"><input v-model="dnd.from" type="time"> ~ <input v-model="dnd.to" type="time"><span class="tiny muted">이 시간에는 푸시를 보내지 않고 아침에 모아서 보냅니다</span></div>
    </section>
  </SettingsPage>
</template>
` },
        },
        {
          id: 'l8', short: `알림 센터`,
          title: `종 아이콘 드롭다운: 최근 20개, 열면 보이는 것만 읽음, 더 보기는 전체 페이지로`,
          why: `알림 센터는 열 때마다 전부 읽음 처리하면 사용자가 못 본 알림도 사라집니다. 열렸을 때 화면에 보인 항목만 읽음으로 보내고, "모두 읽음" 은 따로 둡니다. 새 알림은 SSE(7회차) 로 받아 맨 위에 끼웁니다.`,
          single: { label: `✓ components/NotificationCenter.vue`, code: String.raw`
<script setup lang="ts">
type Noti = { id: string; type: string; title: string; body: string; url?: string; readAt: string | null; createdAt: string }
const { $api } = useNuxtApp()
const open = ref(false)
const unread = useUnread()

const { data: list, refresh } = await useLazyFetch<Noti[]>('/api/notifications', { query: { limit: 20 }, key: 'notifications', default: () => [], immediate: false })
watch(open, (v) => v && refresh())                                      // 열 때 받는다

// 실시간: 7회차 02번 useSSE. 새 알림을 맨 위에
useSSE('/api/notifications/stream', { notification: (n: Noti) => { list.value = [n, ...list.value].slice(0, 20); unread.bump(1) } })

// 보인 항목만 읽음 처리: 각 항목이 IntersectionObserver 로 자기 id 를 보고
const seen = new Set<string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
function onSeen(n: Noti) {
  if (n.readAt || seen.has(n.id)) return
  seen.add(n.id)
  flushTimer ??= setTimeout(async () => {
    flushTimer = null
    const ids = [...seen]; seen.clear()
    await $api('/api/notifications/read', { method: 'POST', body: { ids } })
    list.value.forEach((x) => ids.includes(x.id) && (x.readAt = new Date().toISOString()))
    unread.bump(-ids.length)
  }, 1500)
}
async function readAll() { await $api('/api/notifications/read-all', { method: 'POST' }); list.value.forEach((x) => (x.readAt ??= new Date().toISOString())); unread.set(0) }
function go(n: Noti) { open.value = false; if (n.url) navigateTo(n.url + (n.url.includes('?') ? '&' : '?') + 'n=' + n.id) }
</script>

<template>
  <Dropdown v-model="open" align="end" width="360px">
    <template #trigger>
      <button class="icon-btn" aria-label="알림"><IconBell /><span v-if="unread.count.value" class="badge-dot">{{ unread.count.value > 99 ? '99+' : unread.count.value }}</span></button>
    </template>
    <div class="row between pad"><b>알림</b><button class="link tiny" :disabled="!unread.count.value" @click="readAll">모두 읽음</button></div>
    <ul class="noti-list">
      <li v-for="n in list" :key="n.id" v-intersect="() => onSeen(n)" :class="{ unread: !n.readAt }" @click="go(n)">
        <NotiIcon :type="n.type" />
        <div class="grow"><b>{{ n.title }}</b><p class="tiny">{{ n.body }}</p><time class="tiny muted">{{ timeAgo(n.createdAt) }}</time></div>
      </li>
      <li v-if="!list.length" class="empty">새 알림이 없습니다</li>
    </ul>
    <NuxtLink to="/notifications" class="block center tiny" @click="open = false">전체 보기</NuxtLink>
  </Dropdown>
</template>
<!-- v-intersect: directives/intersect.ts — IntersectionObserver 로 50% 이상 보이면 한 번 콜백. /notifications 페이지는 4회차 02번 무한 스크롤 -->
` },
        },
        {
          id: 'l9', short: `읽지 않은 수`,
          title: `카운트는 하나의 상태로 두고 SSE 로 맞추며, 탭 제목과 앱 배지에도 반영한다`,
          why: `종 아이콘, 탭 제목 "(3) 사이트", 모바일 홈 화면 아이콘 배지가 서로 다른 숫자를 보여 주면 안 됩니다. useUnread 하나가 숫자를 갖고, 바뀔 때 title 과 navigator.setAppBadge 를 함께 갱신합니다.`,
          single: { label: `✓ composables/useUnread.ts`, code: String.raw`
export const useUnread = () => {
  const count = useState<number>('unread-count', () => 0)
  const { $api } = useNuxtApp()

  async function refresh() {
    try { count.value = (await $api<{ count: number }>('/api/notifications/unread-count')).count } catch {}
  }
  function set(n: number) { count.value = Math.max(0, n) }
  function bump(d: number) { set(count.value + d) }

  if (import.meta.client) {
    // 탭 제목 접두어
    const baseTitle = useState('base-title', () => document.title.replace(/^\(\d+\+?\) /, ''))
    useHead({ titleTemplate: (t) => (count.value ? '(' + (count.value > 99 ? '99+' : count.value) + ') ' : '') + (t ?? baseTitle.value) })

    // 설치된 PWA 아이콘 배지 (지원 브라우저만. Badging API)
    watch(count, (n) => { const nav = navigator as any; if (!nav.setAppBadge) return; n ? nav.setAppBadge(n) : nav.clearAppBadge() }, { immediate: true })

    // 탭을 다시 보면 맞춰 준다 (SSE 끊김·다른 탭에서 읽음 처리)
    useEventListener(document, 'visibilitychange', () => document.visibilityState === 'visible' && refresh())
    // 다른 탭과 동기화 (1회차 09번 BroadcastChannel 재사용)
    const bc = new BroadcastChannel('unread'); bc.onmessage = (e) => set(e.data)
    watch(count, (n) => bc.postMessage(n))
  }
  return { count, refresh, set, bump }
}

// app.vue 또는 default 레이아웃: 로그인 상태면 처음 한 번 + SSE 연결
const auth = useAuthStore(); const unread = useUnread()
watch(() => auth.isLoggedIn, (on) => on ? unread.refresh() : unread.set(0), { immediate: true })

// server/api/notifications/unread-count.get.ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { count: await db.notification.count({ where: { userId: user.id, readAt: null } }) }
})
// 인앱 알림이 많아지면 count 쿼리가 느려진다 → user.unreadCount 컬럼을 두고 INSERT/READ 때 증감 (트랜잭션)
` },
        },
        {
          id: 'l10', short: `notify 파이프라인`,
          title: `notify(userId, type, data) 가 템플릿, 설정, 방해 금지, 채널 발송을 순서대로 처리한다`,
          why: `알림을 보내는 코드가 결제·댓글·배송 모듈마다 흩어지면 설정 반영이 빠지는 곳이 생깁니다. 한 함수가 받아서 템플릿으로 문구를 만들고 설정을 보고 채널별로 넘깁니다. 호출하는 쪽은 await 하지 않습니다.`,
          single: { label: `✓ server/utils/notify.ts`, code: String.raw`
import { sendPush } from './push'
import { enqueueEmail } from './email'

type Tpl = (d: any) => { title: string; body: string; url: string; tag?: string }
const TEMPLATES: Record<string, Tpl> = {
  'order.paid':     (d) => ({ title: '결제가 완료되었습니다', body: d.orderName + ' · ' + d.amount.toLocaleString() + '원', url: '/orders/' + d.orderId, tag: 'order-' + d.orderId }),
  'order.shipped':  (d) => ({ title: '배송이 시작되었습니다', body: d.orderName + ' · ' + d.carrier, url: '/orders/' + d.orderId, tag: 'order-' + d.orderId }),
  'comment.reply':  (d) => ({ title: d.authorName + '님이 답글을 남겼습니다', body: d.preview.slice(0, 80), url: '/posts/' + d.postId + '#c-' + d.commentId }),
  'system':         (d) => ({ title: d.title, body: d.body, url: d.url ?? '/notifications' })
}
const DEFAULTS: Record<string, Record<Channel, boolean>> = {
  'order.paid': { inapp: true, push: true, email: true }, 'order.shipped': { inapp: true, push: true, email: false },
  'comment.reply': { inapp: true, push: true, email: false }, 'system': { inapp: true, push: false, email: true }
}

export function notify(userId: string, type: keyof typeof TEMPLATES, data: any) {
  // 호출자는 기다리지 않는다. 실패가 본 작업(결제 승인) 을 망치면 안 된다
  return run(userId, type, data).catch((e) => console.error('[notify]', type, userId, e))
}

async function run(userId: string, type: string, data: any) {
  const tpl = TEMPLATES[type]; if (!tpl) throw new Error('unknown notification type ' + type)
  const msg = tpl(data)
  const [user, rows] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true, dndFrom: true, dndTo: true, marketingOptIn: true } }),
    db.notificationSetting.findMany({ where: { userId, type } })
  ])
  if (!user) return
  const on: Record<Channel, boolean> = { ...DEFAULTS[type] }
  for (const r of rows) on[r.channel as Channel] = r.enabled
  if (type === 'promo' && !user.marketingOptIn) return                        // 법적 동의가 설정보다 우선

  // 1) 인앱: 항상 먼저 (id 를 푸시 payload 에 싣는다)
  let notiId: string | undefined
  if (on.inapp) {
    const n = await db.notification.create({ data: { userId, type, title: msg.title, body: msg.body, url: msg.url, data } })
    notiId = n.id
    publishSSE(userId, 'notification', n)                                      // 7회차 02번의 서버 쪽: 연결된 탭에 밀어 준다
  }
  // 2) 푸시: 방해 금지면 보류 큐에 (아침에 digest 로)
  if (on.push) {
    if (inDnd(user.dndFrom, user.dndTo)) await db.deferredPush.create({ data: { userId, payload: { ...msg, id: notiId } } })
    else await sendPush(userId, { ...msg, id: notiId })
  }
  // 3) 메일: 큐로. 템플릿 이름 = 타입
  if (on.email) await enqueueEmail({ to: user.email, template: type, data: { ...data, url: absoluteUrl(msg.url) } })
}

// 사용 (11회차 04번 승인 뒤): notify(order.userId, 'order.paid', { orderId, orderName: order.orderName, amount: order.amount })
// 보류된 푸시 작업 (매일 08:00): 사용자별로 묶어 "밤사이 알림 3건" 하나로 보낸 뒤 삭제
` },
        },
      ],
    },
    {
      id: 'practice-16', no: 16, name: `PWA 와 오프라인 캐시`,
      lead: `@vite-pwa/nuxt 로 설치 가능한 앱을 만드는 방법입니다. 매니페스트와 아이콘, 프리캐시와 런타임 캐시 전략, 오프라인 페이지, 설치 프롬프트, 새 버전 알림, 사용자별 캐시 분리, 오프라인 쓰기 큐, 독립 실행 모드 UI, 점검.`,
      lessons: [
        {
          id: 'l1', short: `설정`,
          title: `@vite-pwa/nuxt 하나로 매니페스트, 서비스 워커, 등록 코드를 만든다`,
          why: `서비스 워커를 손으로 쓰면 캐시 버전 관리에서 반드시 사고가 납니다. vite-pwa 가 빌드 산출물 목록으로 프리캐시 매니페스트를 만들고 Workbox 로 전략을 선언합니다. 15회차 푸시 SW 가 있으면 injectManifest 로 합칩니다.`,
          single: { label: `✓ nuxt.config.ts`, code: String.raw`
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    registerType: 'prompt',                       // 'autoUpdate' 면 새 버전이 조용히 적용된다. 폼 작성 중이면 위험하니 prompt (06번)
    manifest: {
      name: '파인마켓', short_name: '파인마켓', description: '빠른 배송 쇼핑',
      lang: 'ko', start_url: '/?source=pwa', scope: '/', display: 'standalone',
      background_color: '#ffffff', theme_color: '#2563eb',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }   // 안드로이드 둥근 아이콘용 (02번)
      ],
      shortcuts: [{ name: '주문 내역', url: '/orders', icons: [{ src: '/icons/orders-96.png', sizes: '96x96' }] }],
      screenshots: []                             // 데스크톱 설치 UI 를 풍성하게 하려면 추가
    },
    workbox: {
      navigateFallback: '/offline',               // 04번: 네트워크 없을 때 보여 줄 페이지
      navigateFallbackDenylist: [/^\/api\//, /^\/admin/],
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],   // 프리캐시 대상 (빌드 산출물)
      globIgnores: ['**/node_modules/**', '_nuxt/*.map'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      cleanupOutdatedCaches: true,
      runtimeCaching: [ /* 03번 */ ]
    },
    client: { installPrompt: true },              // $pwa.showInstallPrompt (05번)
    devOptions: { enabled: false, type: 'module' } // 개발 중 SW 를 켜면 HMR 과 캐시가 싸운다. 점검할 때만 true (10번)
  }
})

// Nuxt 가 만든 head 에 <link rel="manifest"> 와 theme-color 가 자동으로 들어간다
// app.vue 에 <NuxtPwaManifest /> (또는 <VitePwaManifest />) 를 두면 명시적으로 주입된다
` },
        },
        {
          id: 'l2', short: `아이콘과 설치 조건`,
          title: `maskable 아이콘, iOS 용 apple-touch-icon, 설치 가능 조건 체크리스트`,
          why: `아이콘 하나를 모든 플랫폼이 다르게 자릅니다. 안드로이드는 maskable(안전 영역 80%), iOS 는 apple-touch-icon 을 따로 봅니다. 설치 가능 조건(HTTPS, 매니페스트, SW, 아이콘) 중 하나라도 빠지면 설치 버튼이 안 뜹니다.`,
          single: { label: `✓ 아이콘 생성 + app.vue head + 체크리스트`, code: String.raw`
# 아이콘 한 장(1024x1024 SVG/PNG) 에서 전부 만들기
npx @vite-pwa/assets-generator --preset minimal-2023 public/logo.svg
#  → public/pwa-64x64.png, pwa-192x192.png, pwa-512x512.png, maskable-icon-512x512.png, apple-touch-icon-180x180.png, favicon.ico
#  maskable: 로고를 가운데 80% 안에, 바깥은 배경색으로 채운 것. 안드로이드가 원·사각으로 잘라도 로고가 안 잘린다

<!-- app.vue : iOS 는 매니페스트 아이콘을 안 쓴다 -->
<script setup lang="ts">
useHead({
  link: [
    { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
  ],
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },            // iOS 홈 화면에서 독립 실행
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: '파인마켓' },
    { name: 'theme-color', content: '#2563eb', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#0f172a', media: '(prefers-color-scheme: dark)' }
  ]
})
</script>

/* 설치 가능 조건 (Chrome 기준). DevTools > Application > Manifest 의 "Installability" 에서 확인
 [ ] HTTPS (localhost 는 예외)
 [ ] manifest: name/short_name, start_url, display standalone|fullscreen|minimal-ui, icons 192 + 512 PNG
 [ ] 서비스 워커 등록됨 (fetch 핸들러 있음)
 [ ] start_url 이 오프라인에서도 응답 (프리캐시 또는 navigateFallback)
 [ ] 사용자 상호작용 후 beforeinstallprompt 가 온다 (05번)
 iOS Safari: 설치 프롬프트 API 없음. "공유 → 홈 화면에 추가" 안내를 직접 보여 줘야 한다 (05번)
 iOS 16.4+ 에서만 푸시 가능하고, 홈 화면에 추가한 상태에서만 동작 */
` },
        },
        {
          id: 'l3', short: `캐시 전략`,
          title: `정적 자산은 프리캐시, 이미지는 CacheFirst, API 는 NetworkFirst, 폰트는 StaleWhileRevalidate`,
          why: `모든 요청을 한 전략으로 다루면 API 가 캐시에서 나오거나 이미지가 매번 네트워크를 탑니다. URL 패턴별로 전략을 정하고, 각 캐시는 개수·기간 상한을 둬서 저장소를 무한히 먹지 않게 합니다.`,
          single: { label: `✓ nuxt.config.ts > pwa.workbox.runtimeCaching`, code: String.raw`
runtimeCaching: [
  // 1) 업로드 이미지·CDN: 한 번 받으면 캐시 우선. 30일, 최대 200개
  {
    urlPattern: ({ url }) => url.hostname === 'cdn.example.com' || url.pathname.startsWith('/uploads/'),
    handler: 'CacheFirst',
    options: { cacheName: 'images', expiration: { maxEntries: 200, maxAgeSeconds: 30 * 86_400, purgeOnQuotaError: true }, cacheableResponse: { statuses: [0, 200] } }
  },
  // 2) 구글 폰트: 있는 걸 쓰고 뒤에서 갱신
  { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i, handler: 'StaleWhileRevalidate', options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 86_400 } } },
  // 3) 읽기 API (상품·카테고리): 네트워크 먼저, 3초 안 오면 캐시. 오프라인이면 캐시
  {
    urlPattern: ({ url, request }) => request.method === 'GET' && /^\/api\/(products|categories|search)/.test(url.pathname),
    handler: 'NetworkFirst',
    options: { cacheName: 'api-read', networkTimeoutSeconds: 3, expiration: { maxEntries: 100, maxAgeSeconds: 3600 }, cacheableResponse: { statuses: [200] } }
  },
  // 4) 개인 API (/api/me, /api/orders): 캐시하지 않는다 (07번). 명시적으로 NetworkOnly
  { urlPattern: ({ url }) => /^\/api\/(me|orders|cart|notifications)/.test(url.pathname), handler: 'NetworkOnly' },
  // 5) 페이지 HTML (SSR): 네트워크 먼저, 실패하면 캐시된 같은 페이지 → 없으면 navigateFallback
  { urlPattern: ({ request }) => request.mode === 'navigate', handler: 'NetworkFirst', options: { cacheName: 'pages', networkTimeoutSeconds: 4, expiration: { maxEntries: 50, maxAgeSeconds: 86_400 } } }
]

/* 전략 고르기
   CacheFirst            바뀌지 않는 것 (해시 붙은 파일, 업로드 이미지). 프리캐시는 사실상 이것
   StaleWhileRevalidate  좀 오래돼도 되는 것 (폰트, 아바타, 설정값)
   NetworkFirst          최신이 중요하지만 오프라인에도 보여 주고 싶은 것 (목록, 상세, 페이지)
   NetworkOnly           개인 데이터, 쓰기 요청, 실시간
   POST/PUT 은 Workbox 가 캐시하지 않는다. 오프라인 쓰기는 08번 큐로

   _nuxt/*.js 는 파일명에 해시가 있어 프리캐시(globPatterns) 로 충분. SSR 페이지 HTML 은 프리캐시 대상이 아니므로 5) 가 필요하다 */
` },
        },
        {
          id: 'l4', short: `오프라인 페이지`,
          title: `네트워크가 없을 때 보여 줄 /offline 과, 앱 안의 오프라인 띠`,
          why: `캐시에 없는 페이지를 오프라인에서 열면 브라우저 기본 공룡 화면이 뜹니다. /offline 페이지를 프리캐시해 두고 navigateFallback 으로 보냅니다. 앱이 떠 있는 동안 연결이 끊기면 상단 띠로 알리고 복구되면 자동으로 다시 시도합니다.`,
          single: { label: `✓ pages/offline.vue + components/OfflineBar.vue`, code: String.raw`
<!-- pages/offline.vue : 외부 자원 없이, 작게. 이 페이지 자체가 프리캐시에 들어가야 한다 -->
<script setup lang="ts">
definePageMeta({ layout: false })
const online = useOnline()                                             // @vueuse/core
watch(online, (on) => on && (history.length > 1 ? history.back() : navigateTo('/')))   // 복구되면 원래 페이지로
</script>
<template>
  <main class="offline">
    <h1>인터넷에 연결되어 있지 않습니다</h1>
    <p>연결이 복구되면 자동으로 돌아갑니다.</p>
    <button class="btn" @click="location.reload()">다시 시도</button>
    <p class="tiny muted">최근에 본 상품은 <NuxtLink to="/recent">여기</NuxtLink>에서 오프라인으로도 볼 수 있습니다</p>
  </main>
</template>

// nuxt.config.ts: /offline 이 SSR 산출물에 포함되게
//   routeRules: { '/offline': { prerender: true } }
//   pwa.workbox.navigateFallback: '/offline'  (01번) — 프리랜더된 offline/index.html 이 globPatterns 로 프리캐시된다
//   SSR 앱이면 additionalManifestEntries: [{ url: '/offline', revision: buildId }] 로 명시해도 된다

<!-- components/OfflineBar.vue : 레이아웃 최상단 -->
<script setup lang="ts">
const online = useOnline()
const wasOffline = ref(false)
watch(online, (on) => {
  if (!on) wasOffline.value = true
  else if (wasOffline.value) { refreshNuxtData(); setTimeout(() => (wasOffline.value = false), 2000) }   // 복구: 데이터 다시 받고 "연결됨" 잠깐
})
</script>
<template>
  <Transition name="slide-down">
    <div v-if="!online" class="offline-bar" role="status">오프라인입니다. 보고 있는 내용은 저장된 것일 수 있습니다.</div>
    <div v-else-if="wasOffline" class="offline-bar ok" role="status">다시 연결되었습니다</div>
  </Transition>
</template>
<!-- navigator.onLine 은 "네트워크 인터페이스가 있다" 일 뿐 인터넷이 된다는 뜻은 아니다.
     확실히 알려면 2회차 03번 재시도의 네트워크 오류 횟수나 /api/health 핑으로 보완 -->
` },
        },
        {
          id: 'l5', short: `설치 프롬프트`,
          title: `브라우저 기본 배너를 막고 우리 버튼으로 띄운다, iOS 는 안내 화면으로`,
          why: `브라우저가 알아서 띄우는 설치 배너는 타이밍을 고를 수 없습니다. beforeinstallprompt 를 잡아 두고 "앱으로 설치" 버튼에서 prompt() 를 부릅니다. iOS 는 API 가 없으니 공유 메뉴 안내를 보여 줍니다. 이미 설치됐거나 거절했으면 숨깁니다.`,
          single: { label: `✓ composables/useInstallPrompt.ts + components/InstallBanner.vue`, code: String.raw`
// composables/useInstallPrompt.ts
export function useInstallPrompt() {
  const deferred = useState<any>('bip-event', () => null)
  const installed = ref(false)
  const dismissedAt = useLocalStorage<number | null>('pwa:install-dismissed', null)
  const isIOS = computed(() => import.meta.client && /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream)
  const isStandalone = computed(() => import.meta.client && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true))

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred.value = e })   // 기본 배너 막고 보관
    window.addEventListener('appinstalled', () => { installed.value = true; deferred.value = null; track('pwa_installed') })
  })

  const canPrompt = computed(() => !!deferred.value && !installed.value && !isStandalone.value)
  const showIOSGuide = computed(() => isIOS.value && !isStandalone.value)
  const shouldShow = computed(() => (canPrompt.value || showIOSGuide.value) && (!dismissedAt.value || Date.now() - dismissedAt.value > 30 * 86_400_000))

  async function install() {
    if (!deferred.value) return
    deferred.value.prompt()
    const { outcome } = await deferred.value.userChoice           // 'accepted' | 'dismissed'
    track('pwa_install_prompt', { outcome })
    if (outcome === 'dismissed') dismissedAt.value = Date.now()
    deferred.value = null
  }
  const dismiss = () => (dismissedAt.value = Date.now())
  return { shouldShow, canPrompt, showIOSGuide, isStandalone, install, dismiss }
}

<!-- components/InstallBanner.vue : 두 번째 방문부터, 페이지 아래쪽에 -->
<script setup lang="ts">
const { shouldShow, canPrompt, showIOSGuide, install, dismiss } = useInstallPrompt()
const visits = useLocalStorage('visits', 0); onMounted(() => visits.value++)
const guide = ref(false)
</script>
<template>
  <div v-if="shouldShow && visits > 1" class="install-banner">
    <img src="/pwa-64x64.png" alt="" width="40" height="40">
    <div class="grow"><b>앱으로 설치</b><p class="tiny muted">홈 화면에서 바로 열고, 더 빠르게</p></div>
    <button v-if="canPrompt" class="btn-primary" @click="install">설치</button>
    <button v-else-if="showIOSGuide" class="btn-primary" @click="guide = true">방법 보기</button>
    <button class="icon-btn" aria-label="닫기" @click="dismiss">×</button>
    <Modal v-model="guide" title="홈 화면에 추가">
      <ol><li>Safari 아래의 <b>공유</b> 버튼을 누르세요</li><li><b>홈 화면에 추가</b>를 선택하세요</li><li>오른쪽 위 <b>추가</b>를 누르세요</li></ol>
    </Modal>
  </div>
</template>
` },
        },
        {
          id: 'l6', short: `새 버전 알림`,
          title: `새 SW 가 대기 중이면 토스트로 알리고, 사용자가 누를 때 바꾼다`,
          why: `autoUpdate 는 작성 중인 폼 위에서 페이지를 새로고침할 수 있습니다. prompt 모드에서 needRefresh 가 true 가 되면 "새 버전이 있습니다" 토스트를 띄우고, 누르면 updateServiceWorker(true) 로 전환·새로고침합니다. 배포 감지는 주기적으로 SW 를 확인합니다.`,
          single: { label: `✓ plugins/pwa-update.client.ts`, code: String.raw`
export default defineNuxtPlugin(() => {
  const { $pwa } = useNuxtApp()                                   // @vite-pwa/nuxt 가 주입. needRefresh / offlineReady / updateServiceWorker
  if (!$pwa) return
  const toast = useToast()

  // 처음 설치 완료: 조용히 (또는 작은 토스트)
  watch(() => $pwa.offlineReady, (v) => v && toast.info('오프라인에서도 사용할 수 있습니다', { duration: 4000 }))

  // 새 버전 대기 중
  watch(() => $pwa.needRefresh, (v) => {
    if (!v) return
    toast.info('새 버전이 있습니다', {
      duration: 0,                                                 // 닫을 때까지
      action: { label: '업데이트', onClick: async () => {
        if (document.querySelector('form[data-dirty="true"]') && !(await confirm({ title: '작성 중인 내용이 사라질 수 있습니다. 업데이트할까요?' }))) return
        await $pwa.updateServiceWorker(true)                      // 대기 중 SW 에 skipWaiting → controllerchange → 새로고침
      } }
    })
  })

  // 배포 감지: 탭을 오래 켜 두면 SW 확인이 안 일어난다. 1시간마다 + 탭 복귀 때 update()
  const check = () => navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {})
  setInterval(check, 60 * 60 * 1000)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
})

/* 새로고침이 두 번 되거나 안 되면: registerType 'prompt' + updateServiceWorker(true) 조합이 맞는지,
   직접 쓴 SW 에 skipWaiting/clientsClaim 이 있는지 확인 (15회차 03번 과 합칠 때 흔한 충돌)
   API 응답 형식이 바뀌는 배포라면: 서버가 X-App-Version 헤더를 주고, 2회차 인터셉터가 빌드 버전과 다르면 강제 업데이트 토스트 */
` },
        },
        {
          id: 'l7', short: `개인 데이터와 캐시`,
          title: `개인 API 는 캐시하지 않고, 로그아웃 때 런타임 캐시를 비운다`,
          why: `NetworkFirst 로 /api/me 를 캐시하면 공용 PC 에서 다음 사람이 오프라인 상태에서 앞사람 정보를 봅니다. 개인 경로는 NetworkOnly(03번) 로 두고, 로그아웃·계정 전환 때 pages·api-read 캐시도 지웁니다. 캐시 키에 사용자를 넣는 방법도 있습니다.`,
          single: { label: `✓ utils/pwaCache.ts + 로그아웃 연결`, code: String.raw`
// utils/pwaCache.ts
const USER_CACHES = ['pages', 'api-read']                             // 03번에서 사용자별 내용이 섞일 수 있는 캐시들

export async function clearUserCaches() {
  if (!('caches' in window)) return
  const names = await caches.keys()
  await Promise.all(names.filter((n) => USER_CACHES.some((u) => n.includes(u))).map((n) => caches.delete(n)))
}

// 1회차 06번 handleAuthLost / 로그아웃 액션에서
async function logout() {
  await auth.logout()
  await Promise.all([clearUserCaches(), pushUnsubscribe(), clearIndexedDbQueue()])     // 캐시, 푸시 구독, 오프라인 큐 모두
  navigateTo('/login')
}

// 대안: 사용자별 캐시 키 — SW 쪽 (injectManifest 로 직접 쓸 때)
import { NetworkFirst } from 'workbox-strategies'
import { registerRoute } from 'workbox-routing'
let userId = 'anon'
self.addEventListener('message', (e) => { if (e.data?.type === 'SET_USER') userId = e.data.userId ?? 'anon' })   // 앱이 로그인/아웃 때 postMessage
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/orders'),
  new NetworkFirst({ cacheName: 'api-user', plugins: [{ cacheKeyWillBeUsed: async ({ request }) => request.url + '#u=' + userId }] })
)
// 앱: navigator.serviceWorker.controller?.postMessage({ type: 'SET_USER', userId: auth.user?.id })

/* 또 하나: 응답에 Cache-Control: private, no-store 가 있어도 Workbox 런타임 캐시는 그걸 안 본다. 전략으로 막아야 한다.
   캐시에 토큰이 들어갈 일은 없게 — Authorization 헤더는 요청에만 있고 응답 본문에 토큰을 넣지 않는다 (1회차) */
` },
        },
        {
          id: 'l8', short: `오프라인 쓰기 큐`,
          title: `실패한 쓰기 요청을 IndexedDB 에 넣고, 연결되면 순서대로 다시 보낸다`,
          why: `지하철에서 쓴 댓글이 "전송 실패" 로 사라지면 안 됩니다. 네트워크 오류인 POST 를 큐에 저장하고 온라인이 되면 재전송합니다. Workbox 의 BackgroundSyncPlugin 이 SW 쪽에서 같은 일을 하지만, 앱 쪽 큐가 UI 반영(대기 중 표시) 에 유리합니다. 멱등키는 필수입니다.`,
          single: { label: `✓ composables/useOfflineQueue.ts`, code: String.raw`
import { openDB } from 'idb'

type Job = { id: string; url: string; method: string; body: unknown; createdAt: number; tries: number }
const dbp = () => openDB('offline', 1, { upgrade: (d) => { d.createObjectStore('queue', { keyPath: 'id' }) } })

export function useOfflineQueue() {
  const { $api } = useNuxtApp()
  const pending = useState<number>('offline-pending', () => 0)
  const online = useOnline()

  async function count() { pending.value = (await (await dbp()).count('queue')) }

  // 쓰기 요청 래퍼: 네트워크 오류면 큐에 넣고 "대기 중" 결과를 돌려준다
  async function send<T>(url: string, body: unknown, method = 'POST'): Promise<{ ok: true; data: T } | { ok: false; queued: true; id: string }> {
    const id = crypto.randomUUID()                                     // 멱등키: 재전송돼도 서버가 한 번만 처리 (헤더로)
    try {
      const data = await $api<T>(url, { method, body, headers: { 'Idempotency-Key': id } })
      return { ok: true, data }
    } catch (e) {
      const err = toApiError(e)
      if (!err.isNetwork && err.status !== 0) throw e                 // 4xx/5xx 는 큐에 넣지 않는다 (재전송해도 똑같이 실패)
      await (await dbp()).put('queue', { id, url, method, body, createdAt: Date.now(), tries: 0 } satisfies Job)
      await count()
      return { ok: false, queued: true, id }
    }
  }

  let flushing = false
  async function flush() {
    if (flushing || !online.value) return
    flushing = true
    try {
      const db = await dbp()
      const jobs = (await db.getAll('queue')).sort((a, b) => a.createdAt - b.createdAt)     // 순서 보장
      for (const job of jobs) {
        try {
          await $api(job.url, { method: job.method, body: job.body, headers: { 'Idempotency-Key': job.id } })
          await db.delete('queue', job.id)
        } catch (e) {
          const err = toApiError(e)
          if (err.isNetwork) break                                      // 아직 안 됨: 멈추고 다음 기회에
          if (job.tries >= 3 || (err.status >= 400 && err.status < 500)) { await db.delete('queue', job.id); useToast().error('보내지 못한 요청이 있습니다: ' + job.url) }
          else await db.put('queue', { ...job, tries: job.tries + 1 })
        }
      }
    } finally { flushing = false; await count() }
  }

  if (import.meta.client) { watch(online, (on) => on && flush(), { immediate: true }); onMounted(count) }
  return { send, flush, pending }
}

// 사용: 댓글 작성
const q = useOfflineQueue()
const r = await q.send('/api/comments', { postId, text })
if (!r.ok) { comments.value.push({ id: r.id, text, pending: true }); toast.info('오프라인입니다. 연결되면 보냅니다') }   // 대기 중 표시
// 서버: Idempotency-Key 를 24시간 저장해 같은 키의 재요청에는 저장된 응답을 돌려준다 (11회차 08번과 같은 생각)
` },
        },
        {
          id: 'l9', short: `독립 실행 UI`,
          title: `standalone 모드에서는 브라우저 뒤로가기가 없다: 앱 안에 내비게이션을 둔다`,
          why: `홈 화면에서 연 PWA 는 주소창도 뒤로가기 버튼도 없습니다(안드로이드는 제스처가 있지만 iOS 는 없음). display-mode 미디어 쿼리로 감지해 상단에 뒤로가기를 보여 주고, 외부 링크는 새 창으로, 하단 탭 바는 안전 영역을 고려합니다.`,
          single: { label: `✓ composables/useDisplayMode.ts + layouts/default.vue`, code: String.raw`
// composables/useDisplayMode.ts
export function useDisplayMode() {
  const standalone = ref(false)
  onMounted(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    standalone.value = mq.matches || (navigator as any).standalone === true
    mq.addEventListener('change', (e) => (standalone.value = e.matches))
  })
  return { standalone }
}

<!-- layouts/default.vue -->
<script setup lang="ts">
const { standalone } = useDisplayMode()
const route = useRoute(); const router = useRouter()
const canGoBack = computed(() => standalone.value && route.path !== '/' && window.history.length > 1)
</script>
<template>
  <div class="app" :class="{ standalone }">
    <header class="topbar">
      <button v-if="canGoBack" class="icon-btn" aria-label="뒤로" @click="router.back()">‹</button>
      <NuxtLink to="/" class="logo">파인마켓</NuxtLink>
      <NotificationCenter />
    </header>
    <main><slot /></main>
    <nav v-if="standalone" class="tabbar">
      <NuxtLink to="/">홈</NuxtLink><NuxtLink to="/search">검색</NuxtLink><NuxtLink to="/cart">장바구니</NuxtLink><NuxtLink to="/me">내 정보</NuxtLink>
    </nav>
  </div>
</template>
<style>
.standalone .topbar { padding-top: env(safe-area-inset-top); }                 /* 노치 */
.tabbar { position: fixed; bottom: 0; padding-bottom: env(safe-area-inset-bottom); display: flex; }
@media (display-mode: standalone) { .browser-only { display: none; } }          /* "앱으로 설치" 배너 등 */
</style>

// 외부 링크: standalone 안에서 외부 사이트로 가면 돌아올 방법이 없다 → target=_blank
// nuxt.config: app.head.meta viewport 에 viewport-fit=cover 가 있어야 safe-area 변수가 채워진다
// 결제(11회차) 처럼 외부 창을 여는 흐름은 standalone 에서 새 창이 브라우저로 튀어나갈 수 있다 → 리다이렉트 방식(successUrl) 이 안전
` },
        },
        {
          id: 'l10', short: `점검과 디버깅`,
          title: `Lighthouse 와 Application 탭으로 확인하고, 막히면 SW 를 지우고 다시`,
          why: `PWA 문제의 대부분은 "옛 SW 가 옛 캐시를 물고 있는 것" 입니다. 어디서 확인하고 어떻게 지우는지, 개발 중에는 어떻게 켜 보는지, 흔한 증상과 원인을 정리합니다.`,
          lang: 'plain',
          single: { label: `✓ 체크리스트`, code: String.raw`
확인 도구
  Chrome DevTools > Application
    Manifest        아이콘·설치 가능 여부(Installability) 오류 메시지
    Service Workers 상태(activated / waiting), "Update on reload" 체크(개발 중), Unregister
    Cache Storage   workbox-precache-*, images, api-read … 안에 뭐가 들었나
    Storage         "Clear site data" 한 방에 전부 삭제
  Lighthouse > PWA 카테고리 (또는 npx unlighthouse)
  chrome://serviceworker-internals   모든 SW 와 로그
  안드로이드 실기기: chrome://inspect 로 원격 디버깅. iOS: Safari > 개발자용 메뉴

개발 중에 켜 보기
  pwa.devOptions.enabled: true  → dev 서버에서도 SW 가 뜬다. HMR 이 이상하면 다시 false
  nuxi build && nuxi preview    → 실제 빌드로 보는 게 정확하다 (프리캐시 매니페스트는 빌드 때 만들어진다)

흔한 증상 → 원인
  배포했는데 옛 화면       prompt 모드에서 업데이트 토스트를 안 눌렀거나(06번), 탭을 오래 켜 둠 → update() 주기 확인
  로그인했는데 옛 사용자   개인 API 가 캐시됨 → 03·07번. NetworkOnly 와 로그아웃 캐시 삭제
  오프라인에서 흰 화면     navigateFallback 페이지가 프리캐시에 없음 → /offline prerender + globPatterns
  설치 버튼이 안 뜸        매니페스트 아이콘 512 PNG 누락, SW 에 fetch 핸들러 없음, HTTPS 아님
  iOS 에서 푸시가 안 옴    홈 화면에 추가한 상태가 아니거나 iOS < 16.4
  API 가 두 번 호출됨      NetworkFirst 의 타임아웃(3초) 뒤 캐시 응답 + 뒤늦은 네트워크 응답은 캐시 갱신용. 정상
  용량 경고               expiration maxEntries 없는 캐시 → 상한 추가, purgeOnQuotaError

사용자에게 알려 줄 "꼬였을 때" 해결책
  설정 페이지에 "앱 데이터 초기화" 버튼: caches.keys() 전부 삭제 + SW unregister + location.reload()
  const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister()))
  const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k)))
` },
        },
      ],
    },
    {
      id: 'practice-17', no: 17, name: `지도 연동 (카카오/네이버 지도)`,
      lead: `지도 SDK 를 Nuxt 에 넣는 방법입니다. 스크립트 지연 로딩, 지도 래퍼 컴포넌트, 반응형 마커 동기화, 현재 위치, 주소와 좌표 변환, 클러스터링, 지도 범위 기반 목록, 장소 검색, 길찾기 앱 연동, 정적 지도. 카카오맵 기준이고 네이버 지도도 같은 구조입니다.`,
      lessons: [
        {
          id: 'l1', short: `SDK 로딩`,
          title: `스크립트는 한 번만, 필요할 때, Promise 로 로드한다`,
          why: `지도 SDK 는 수백 KB 라 모든 페이지에서 head 에 넣으면 안 됩니다. 지도가 있는 페이지의 onMounted 에서 로드하되 같은 URL 은 한 번만 요청하고, 동시에 두 컴포넌트가 불러도 같은 Promise 를 기다리게 합니다. 카카오는 autoload=false 로 두고 kakao.maps.load 를 따로 부릅니다.`,
          single: { label: `✓ utils/loadScript.ts + composables/useKakaoMaps.ts`, code: String.raw`
// utils/loadScript.ts — 어떤 외부 스크립트든 (결제 SDK, 카카오 공유, 지도)
const loading = new Map<string, Promise<void>>()

export function loadScript(src: string, attrs: Record<string, string> = {}): Promise<void> {
  if (import.meta.server) return Promise.reject(new Error('loadScript is client only'))
  if (loading.has(src)) return loading.get(src)!
  const existing = document.querySelector<HTMLScriptElement>('script[src="' + src + '"]')
  if (existing?.dataset.loaded) return Promise.resolve()

  const p = new Promise<void>((resolve, reject) => {
    const s = existing ?? document.createElement('script')
    if (!existing) { s.src = src; s.async = true; Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v)) }
    s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve() }, { once: true })
    s.addEventListener('error', () => { loading.delete(src); s.remove(); reject(new Error('script load failed: ' + src)) }, { once: true })
    if (!existing) document.head.appendChild(s)
  })
  loading.set(src, p)
  return p
}

// composables/useKakaoMaps.ts — SDK 준비를 보장하고 kakao.maps 네임스페이스를 돌려준다
let ready: Promise<typeof kakao.maps> | null = null

export function useKakaoMaps() {
  const { public: { kakaoJsKey } } = useRuntimeConfig()
  function load() {
    ready ??= loadScript('https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + kakaoJsKey + '&autoload=false&libraries=services,clusterer')
      .then(() => new Promise<typeof kakao.maps>((resolve) => kakao.maps.load(() => resolve(kakao.maps))))
      .catch((e) => { ready = null; throw e })                       // 실패하면 다음 호출이 다시 시도
    return ready
  }
  return { load }
}
// 타입: npm i -D kakao.maps.d.ts  → tsconfig types 에 "kakao.maps.d.ts"
// 네이버: https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=...&submodules=geocoder  → window.naver.maps (autoload 개념 없음)
// 키는 public 이지만 카카오/네이버 콘솔에서 허용 도메인을 등록해야 다른 사이트에서 못 쓴다
` },
        },
        {
          id: 'l2', short: `지도 컴포넌트`,
          title: `지도 하나 = 컴포넌트 하나. 자식에게 map 을 provide 하고, 크기가 바뀌면 relayout`,
          why: `지도 객체를 페이지가 직접 만들면 마커·오버레이 코드가 페이지에 다 들어옵니다. KakaoMap 이 init 과 생명주기를 맡고, 자식(마커, 오버레이) 은 inject 로 map 을 받아 자기 일만 합니다. 숨겨졌다 보이거나 크기가 바뀌면 relayout 을 불러야 회색 타일이 안 남습니다.`,
          single: { label: `✓ components/map/KakaoMap.vue`, code: String.raw`
<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'

export type LatLng = { lat: number; lng: number }
const props = withDefaults(defineProps<{ center: LatLng; level?: number; height?: string; draggable?: boolean }>(), { level: 4, height: '400px', draggable: true })
const emit = defineEmits<{ ready: [map: kakao.maps.Map]; idle: [payload: { center: LatLng; level: number; bounds: { sw: LatLng; ne: LatLng } }]; click: [pos: LatLng] }>()

const el = useTemplateRef('el')
const map = shallowRef<kakao.maps.Map | null>(null)                 // 지도 객체는 반응형으로 감싸면 안 된다 (deep proxy → 매우 느려짐)
const error = ref<string | null>(null)
const { load } = useKakaoMaps()

provide(MAP_KEY, map)                                                // 자식 컴포넌트용. MAP_KEY = Symbol('kakao-map') as InjectionKey<ShallowRef<kakao.maps.Map|null>>

onMounted(async () => {
  try {
    const maps = await load()
    const m = new maps.Map(el.value!, { center: new maps.LatLng(props.center.lat, props.center.lng), level: props.level, draggable: props.draggable })
    maps.event.addListener(m, 'idle', () => {
      const b = m.getBounds(), c = m.getCenter()
      emit('idle', { center: { lat: c.getLat(), lng: c.getLng() }, level: m.getLevel(), bounds: { sw: toLL(b.getSouthWest()), ne: toLL(b.getNorthEast()) } })
    })
    maps.event.addListener(m, 'click', (e: kakao.maps.event.MouseEvent) => emit('click', toLL(e.latLng)))
    map.value = m
    emit('ready', m)
  } catch (e: any) { error.value = '지도를 불러오지 못했습니다' }
})

// 바깥에서 center/level 을 바꾸면 따라간다 (사용자가 드래그한 건 idle 로 올라가고, 부모가 다시 center 를 내리지 않으면 그대로)
watch(() => props.center, (c) => map.value?.panTo(new kakao.maps.LatLng(c.lat, c.lng)))
watch(() => props.level, (l) => map.value?.setLevel(l))
useResizeObserver(el, () => map.value?.relayout())                 // 탭·모달 안에서 열릴 때, 창 크기 변경

const toLL = (p: kakao.maps.LatLng): LatLng => ({ lat: p.getLat(), lng: p.getLng() })
defineExpose({ map })
</script>

<template>
  <div class="map-wrap" :style="{ height }">
    <div ref="el" class="map" />
    <div v-if="!map && !error" class="map-skeleton" />
    <div v-if="error" class="map-error">{{ error }}</div>
    <slot v-if="map" />                                               <!-- 마커 등은 map 이 준비된 뒤에만 그려진다 -->
  </div>
</template>

<!-- 사용 -->
<ClientOnly>
  <KakaoMap :center="{ lat: 37.5665, lng: 126.978 }" :level="5" @idle="onIdle">
    <MapMarkers :items="stores" @select="open" />
  </KakaoMap>
  <template #fallback><div class="map-skeleton" style="height: 400px" /></template>
</ClientOnly>
` },
        },
        {
          id: 'l3', short: `마커 동기화`,
          title: `배열이 바뀌면 추가·삭제·이동만 반영한다. 전부 지우고 다시 그리지 않는다`,
          why: `목록이 바뀔 때마다 마커를 전부 지우고 다시 만들면 깜빡이고 느립니다. id 로 기존 마커 Map 을 유지하며 새로 온 것은 추가, 사라진 것은 제거, 좌표가 바뀐 것은 setPosition. 선택된 마커는 이미지를 바꿉니다.`,
          single: { label: `✓ components/map/MapMarkers.vue`, code: String.raw`
<script setup lang="ts">
export type MarkerItem = { id: string; lat: number; lng: number; title?: string; kind?: string }
const props = defineProps<{ items: MarkerItem[]; selectedId?: string | null }>()
const emit = defineEmits<{ select: [item: MarkerItem]; hover: [item: MarkerItem | null] }>()

const map = inject(MAP_KEY)!
const markers = new Map<string, kakao.maps.Marker>()                 // 반응형 아님: 의도적
const images = {
  default: new kakao.maps.MarkerImage('/map/pin.png', new kakao.maps.Size(28, 36), { offset: new kakao.maps.Point(14, 36) }),
  selected: new kakao.maps.MarkerImage('/map/pin-active.png', new kakao.maps.Size(36, 46), { offset: new kakao.maps.Point(18, 46) })
}

function sync(items: MarkerItem[]) {
  const m = map.value; if (!m) return
  const seen = new Set<string>()
  for (const it of items) {
    seen.add(it.id)
    const pos = new kakao.maps.LatLng(it.lat, it.lng)
    let mk = markers.get(it.id)
    if (!mk) {
      mk = new kakao.maps.Marker({ map: m, position: pos, title: it.title, image: images.default, clickable: true })
      kakao.maps.event.addListener(mk, 'click', () => emit('select', it))
      kakao.maps.event.addListener(mk, 'mouseover', () => emit('hover', it))
      kakao.maps.event.addListener(mk, 'mouseout', () => emit('hover', null))
      markers.set(it.id, mk)
    } else if (!mk.getPosition().equals(pos)) mk.setPosition(pos)
  }
  for (const [id, mk] of markers) if (!seen.has(id)) { mk.setMap(null); markers.delete(id) }
}

watch(() => props.items, sync, { immediate: true, deep: false })     // 배열 참조가 바뀔 때만. 항목 안을 바꾸면 새 배열로 넘길 것
watch(() => props.selectedId, (id, prev) => {
  if (prev && markers.has(prev)) { markers.get(prev)!.setImage(images.default); markers.get(prev)!.setZIndex(0) }
  if (id && markers.has(id)) { const mk = markers.get(id)!; mk.setImage(images.selected); mk.setZIndex(10); map.value?.panTo(mk.getPosition()) }
})
onBeforeUnmount(() => { markers.forEach((mk) => mk.setMap(null)); markers.clear() })
</script>
<template><slot /></template>   <!-- 렌더링할 DOM 은 없다. 지도에 직접 그린다 -->

<!-- 말풍선(커스텀 오버레이) 은 HTML 로: Vue 컴포넌트를 쓰고 싶으면 Teleport 가 아니라 render + 컨테이너 div 를 CustomOverlay content 로 -->
<script lang="ts">
export function useMapOverlay(map: ShallowRef<kakao.maps.Map | null>) {
  let overlay: kakao.maps.CustomOverlay | null = null
  let app: ReturnType<typeof createApp> | null = null
  function show(pos: LatLng, component: Component, props: Record<string, unknown>) {
    hide()
    const el = document.createElement('div')
    app = createApp(component, { ...props, onClose: hide }); app.mount(el)
    overlay = new kakao.maps.CustomOverlay({ map: map.value!, position: new kakao.maps.LatLng(pos.lat, pos.lng), content: el, yAnchor: 1.3 })
  }
  function hide() { overlay?.setMap(null); overlay = null; app?.unmount(); app = null }
  onBeforeUnmount(hide)
  return { show, hide }
}
</script>
` },
        },
        {
          id: 'l4', short: `현재 위치`,
          title: `위치 권한은 버튼을 눌렀을 때 요청하고, 거부·실패·느림에 각각 대응한다`,
          why: `페이지 열자마자 위치를 물으면 거부당합니다. "내 위치" 버튼에서 요청하고, 거부되면 설정 안내, 10초 안에 안 오면 타임아웃, 실패하면 기본 위치(서울시청) 나 IP 기반 대략 위치로 갑니다. 정확도가 낮으면 원으로 표시합니다.`,
          single: { label: `✓ composables/useMyLocation.ts + 버튼`, code: String.raw`
export function useMyLocation(fallback: LatLng = { lat: 37.5665, lng: 126.978 }) {
  const pos = ref<LatLng | null>(null)
  const accuracy = ref<number | null>(null)
  const state = ref<'idle' | 'locating' | 'ok' | 'denied' | 'unavailable' | 'timeout'>('idle')

  async function locate(opts: { highAccuracy?: boolean } = {}): Promise<LatLng> {
    if (!('geolocation' in navigator)) { state.value = 'unavailable'; return fallback }
    state.value = 'locating'
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => { pos.value = { lat: p.coords.latitude, lng: p.coords.longitude }; accuracy.value = p.coords.accuracy; state.value = 'ok'; resolve(pos.value) },
        (err) => {
          state.value = err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable'
          resolve(fallback)
        },
        { enableHighAccuracy: !!opts.highAccuracy, timeout: 10_000, maximumAge: 60_000 }     // 1분 안의 캐시된 위치는 재사용
      )
    })
  }

  // 권한 상태 미리 보기 (버튼 문구용). 지원 안 하는 브라우저도 있다
  const permission = ref<PermissionState | 'unknown'>('unknown')
  onMounted(async () => {
    try { const s = await navigator.permissions.query({ name: 'geolocation' }); permission.value = s.state; s.onchange = () => (permission.value = s.state) } catch {}
  })
  return { pos, accuracy, state, permission, locate }
}

<!-- 지도 위 "내 위치" 버튼 -->
<script setup lang="ts">
const my = useMyLocation()
const center = ref<LatLng>({ lat: 37.5665, lng: 126.978 })
const toast = useToast()
let circle: kakao.maps.Circle | null = null

async function goMyLocation(map: kakao.maps.Map) {
  const p = await my.locate()
  if (my.state.value === 'denied') return toast.error('위치 권한이 꺼져 있습니다. 브라우저 설정에서 허용해 주세요')
  if (my.state.value !== 'ok') return toast.warning('현재 위치를 찾지 못해 기본 위치를 보여 줍니다')
  center.value = p
  map.setLevel(my.accuracy.value! > 500 ? 6 : 3)
  circle?.setMap(null)
  circle = new kakao.maps.Circle({ map, center: new kakao.maps.LatLng(p.lat, p.lng), radius: my.accuracy.value!, strokeWeight: 1, strokeColor: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.12 })
}
</script>
<template>
  <KakaoMap ref="mapRef" :center="center">
    <button class="map-btn my-loc" :class="{ busy: my.state.value === 'locating' }" aria-label="내 위치" @click="goMyLocation(mapRef!.map!)">◎</button>
  </KakaoMap>
</template>
<!-- HTTPS 가 아니면 geolocation 은 동작하지 않는다 (localhost 제외). 위치를 서버로 보낼 때는 반올림(소수 3자리 ≈ 100m) 해서 보내는 걸 고려 -->
` },
        },
        {
          id: 'l5', short: `주소 ↔ 좌표`,
          title: `브라우저 SDK 의 geocoder 는 화면용, 서버 저장은 REST API 로 한 번 변환해 좌표를 저장한다`,
          why: `매장 등록 때 주소만 받고 조회 때마다 지오코딩하면 느리고 할당량을 먹습니다. 저장 시점에 서버가 REST API(키 비공개) 로 좌표를 구해 함께 저장합니다. 화면에서 즉시 미리보기는 SDK geocoder 로. 클릭한 지점의 주소는 coord2Address.`,
          single: { label: `✓ composables/useGeocoder.ts + server/utils/geocode.ts`, code: String.raw`
// composables/useGeocoder.ts — 화면용 (SDK services 라이브러리)
export function useGeocoder() {
  const { load } = useKakaoMaps()
  async function geocoder() { await load(); return new kakao.maps.services.Geocoder() }

  async function addressToCoord(address: string): Promise<(LatLng & { roadAddress: string; jibunAddress: string }) | null> {
    const g = await geocoder()
    return new Promise((resolve) => g.addressSearch(address, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || !result[0]) return resolve(null)
      const r = result[0]
      resolve({ lat: Number(r.y), lng: Number(r.x), roadAddress: r.road_address?.address_name ?? '', jibunAddress: r.address?.address_name ?? '' })
    }))
  }
  async function coordToAddress(p: LatLng): Promise<string | null> {
    const g = await geocoder()
    return new Promise((resolve) => g.coord2Address(p.lng, p.lat, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || !result[0]) return resolve(null)
      resolve(result[0].road_address?.address_name ?? result[0].address?.address_name ?? null)
    }))
  }
  return { addressToCoord, coordToAddress }
}

// 매장 등록 폼: 3회차 05번 주소 검색(다음 우편번호) → 좌표 미리보기 → 저장은 주소만 보내고 서버가 다시 변환
const { addressToCoord } = useGeocoder()
watch(() => form.address, async (a) => { preview.value = a ? await addressToCoord(a) : null })

// server/utils/geocode.ts — REST 키는 서버에만. 결과는 주소별로 캐시 (같은 주소를 또 묻지 않는다)
export async function geocode(address: string): Promise<LatLng | null> {
  const key = 'geocode:' + address.trim()
  const cached = await useStorage('cache').getItem<LatLng | null>(key)
  if (cached !== null && cached !== undefined) return cached
  const { kakaoRestKey } = useRuntimeConfig()
  const res = await $fetch<any>('https://dapi.kakao.com/v2/local/search/address.json', { query: { query: address }, headers: { Authorization: 'KakaoAK ' + kakaoRestKey } })
  const d = res.documents?.[0]
  const out = d ? { lat: Number(d.y), lng: Number(d.x) } : null
  await useStorage('cache').setItem(key, out)                        // null 도 캐시 (없는 주소를 반복 조회하지 않게)
  return out
}
// server/api/admin/stores.post.ts 에서: const coord = await geocode(body.address); if (!coord) throw createError({ statusCode: 400, statusMessage: '주소를 찾을 수 없습니다' })
// DB: lat, lng 컬럼 + (Postgres 면) PostGIS geography 컬럼과 GIST 인덱스 → 07번 범위 검색이 빨라진다
` },
        },
        {
          id: 'l6', short: `클러스터링`,
          title: `마커가 수백 개면 클러스터러로 묶고, 수만 개면 서버가 줌 레벨별로 묶어 준다`,
          why: `마커 1,000개를 그대로 그리면 지도가 버벅입니다. SDK 의 MarkerClusterer 가 화면 안 마커를 묶어 숫자로 보여 줍니다. 데이터가 수만 개면 애초에 다 내려받지 않고 서버가 현재 줌 레벨의 격자로 집계해 "클러스터 또는 개별" 을 돌려줍니다.`,
          single: { label: `✓ components/map/MapCluster.vue + server/api/stores/clusters.get.ts`, code: String.raw`
<!-- components/map/MapCluster.vue : SDK 클러스터러 (clusterer 라이브러리를 01번 URL 에 포함) -->
<script setup lang="ts">
const props = defineProps<{ items: MarkerItem[] }>()
const emit = defineEmits<{ select: [item: MarkerItem] }>()
const map = inject(MAP_KEY)!
let clusterer: kakao.maps.MarkerClusterer | null = null
const markers = new Map<string, kakao.maps.Marker>()

onMounted(() => {
  clusterer = new kakao.maps.MarkerClusterer({
    map: map.value!, averageCenter: true, minLevel: 5,                 // 레벨 5 이상(축소) 에서만 묶는다
    disableClickZoom: false, gridSize: 80,
    calculator: [10, 50, 200],                                         // 구간별 스타일
    styles: [{ width: '36px', height: '36px', background: 'rgba(37,99,235,.85)', borderRadius: '18px', color: '#fff', textAlign: 'center', lineHeight: '36px', fontWeight: '600' },
             { width: '44px', height: '44px', background: 'rgba(37,99,235,.9)', borderRadius: '22px', color: '#fff', textAlign: 'center', lineHeight: '44px', fontWeight: '600' },
             { width: '52px', height: '52px', background: 'rgba(220,38,38,.9)', borderRadius: '26px', color: '#fff', textAlign: 'center', lineHeight: '52px', fontWeight: '700' }]
  })
})
watch(() => props.items, (items) => {
  if (!clusterer) return
  clusterer.clear(); markers.clear()
  const list = items.map((it) => { const mk = new kakao.maps.Marker({ position: new kakao.maps.LatLng(it.lat, it.lng), title: it.title }); kakao.maps.event.addListener(mk, 'click', () => emit('select', it)); markers.set(it.id, mk); return mk })
  clusterer.addMarkers(list)                                           // 한 번에 넣어야 빠르다 (addMarker 반복 금지)
}, { immediate: true })
onBeforeUnmount(() => clusterer?.clear())
</script>
<template><slot /></template>

// server/api/stores/clusters.get.ts — 데이터가 많을 때: bbox + level 로 격자 집계
export default cachedEventHandler(async (event) => {
  const q = z.object({ swLat: z.coerce.number(), swLng: z.coerce.number(), neLat: z.coerce.number(), neLng: z.coerce.number(), level: z.coerce.number().int().min(1).max(14) }).parse(getQuery(event))
  if (q.level <= 4) {                                                  // 확대: 개별 마커 (최대 500)
    const items = await db.$queryRaw<MarkerItem[]>\`SELECT id, name AS title, lat, lng FROM store WHERE lat BETWEEN \${q.swLat} AND \${q.neLat} AND lng BETWEEN \${q.swLng} AND \${q.neLng} LIMIT 500\`
    return { type: 'items', items }
  }
  const cell = 0.002 * Math.pow(2, q.level - 4)                       // 레벨마다 격자 2배
  const clusters = await db.$queryRaw<{ lat: number; lng: number; count: number }[]>\`
    SELECT AVG(lat) AS lat, AVG(lng) AS lng, COUNT(*)::int AS count
    FROM store WHERE lat BETWEEN \${q.swLat} AND \${q.neLat} AND lng BETWEEN \${q.swLng} AND \${q.neLng}
    GROUP BY FLOOR(lat / \${cell}), FLOOR(lng / \${cell})\`
  return { type: 'clusters', clusters }
}, { maxAge: 60, getKey: (e) => JSON.stringify(getQuery(e)) })
// 프론트: type 이 clusters 면 숫자 오버레이(클릭 → 그 지점으로 setLevel(level-2)), items 면 03번 MapMarkers
` },
        },
        {
          id: 'l7', short: `범위 기반 목록`,
          title: `지도를 움직이면 보이는 범위의 목록을 받고, 목록과 마커가 서로 하이라이트된다`,
          why: `"이 지역 검색" 패턴입니다. idle 이벤트(드래그·줌이 끝난 시점) 를 디바운스해 bbox 로 요청하고, 결과는 목록과 마커 둘 다에 씁니다. 목록 항목에 마우스를 올리면 마커가, 마커를 올리면 목록 항목이 강조됩니다. URL 에 범위를 두면 공유도 됩니다.`,
          single: { label: `✓ pages/stores/map.vue`, code: String.raw`
<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const route = useRoute(); const router = useRouter()
const bounds = ref<{ sw: LatLng; ne: LatLng } | null>(null)
const level = ref(5)
const selectedId = ref<string | null>(null)
const hoverId = ref<string | null>(null)
const searchHere = ref(false)                                          // "이 지역에서 재검색" 모드 (자동 vs 수동)

const initialCenter = computed<LatLng>(() => ({ lat: Number(route.query.lat) || 37.5665, lng: Number(route.query.lng) || 126.978 }))

const query = computed(() => bounds.value && { swLat: bounds.value.sw.lat, swLng: bounds.value.sw.lng, neLat: bounds.value.ne.lat, neLng: bounds.value.ne.lng, level: level.value, category: route.query.category })
const { data, status, execute } = await useFetch('/api/stores/in-bounds', { query, immediate: false, watch: false, default: () => ({ items: [], total: 0 }) })

const onIdle = useDebounceFn((p: { center: LatLng; level: number; bounds: { sw: LatLng; ne: LatLng } }) => {
  bounds.value = p.bounds; level.value = p.level
  router.replace({ query: { ...route.query, lat: p.center.lat.toFixed(5), lng: p.center.lng.toFixed(5), level: p.level } })   // 공유·뒤로가기용
  if (!searchHere.value) execute()                                     // 자동 모드: 움직일 때마다
  else showRefetchButton.value = true                                  // 수동 모드: 버튼만 보여 준다
}, 300)
const showRefetchButton = ref(false)
function refetchHere() { showRefetchButton.value = false; execute() }

const items = computed(() => data.value.items)
const listRef = useTemplateRef<HTMLElement>('listRef')
watch(hoverId, (id) => id && listRef.value?.querySelector('[data-id="' + id + '"]')?.scrollIntoView({ block: 'nearest' }))   // 마커 hover → 목록 스크롤
</script>

<template>
  <div class="map-page">
    <aside ref="listRef" class="list">
      <div class="row between"><b>{{ data.total }}곳</b><label class="tiny"><input v-model="searchHere" type="checkbox"> 지도 이동 시 자동 검색 끄기</label></div>
      <StoreCard v-for="s in items" :key="s.id" :data-id="s.id" :store="s" :class="{ hover: hoverId === s.id, active: selectedId === s.id }"
        @mouseenter="hoverId = s.id" @mouseleave="hoverId = null" @click="selectedId = s.id" />
      <p v-if="status === 'success' && !items.length" class="empty">이 지역에는 매장이 없습니다. 지도를 축소해 보세요</p>
    </aside>
    <ClientOnly>
      <KakaoMap :center="initialCenter" :level="Number(route.query.level) || 5" height="100%" @idle="onIdle">
        <MapMarkers :items="items" :selected-id="selectedId ?? hoverId" @select="(s) => (selectedId = s.id)" @hover="(s) => (hoverId = s?.id ?? null)" />
        <button v-if="showRefetchButton" class="map-btn center-top" @click="refetchHere">이 지역에서 재검색</button>
        <div v-if="status === 'pending'" class="map-loading">불러오는 중…</div>
      </KakaoMap>
    </ClientOnly>
  </div>
</template>
<!-- 서버 in-bounds: 06번 clusters 와 같은 bbox 쿼리 + 카테고리 필터, LIMIT 200 과 total. 모바일은 목록을 바텀시트로 (5회차 10번) -->
` },
        },
        {
          id: 'l8', short: `장소 검색`,
          title: `키워드 장소 검색은 SDK Places 로, UI 는 12회차 SearchBox 를 재사용한다`,
          why: `"강남역 스타벅스" 같은 검색은 우리 DB 가 아니라 지도 서비스의 장소 DB 가 맞습니다. Places.keywordSearch 를 Promise 로 감싸고, 현재 지도 중심 기준으로 가까운 순으로 받습니다. 선택하면 그 좌표로 이동하고 마커를 찍습니다.`,
          single: { label: `✓ composables/usePlaces.ts + 사용`, code: String.raw`
export type Place = { id: string; label: string; address: string; lat: number; lng: number; category: string; phone?: string; url: string }

export function usePlaces() {
  const { load } = useKakaoMaps()
  let ps: kakao.maps.services.Places | null = null

  async function search(keyword: string, opts: { near?: LatLng; radius?: number; signal?: AbortSignal } = {}): Promise<Place[]> {
    const maps = await load()
    ps ??= new maps.services.Places()
    return new Promise((resolve) => {
      ps!.keywordSearch(keyword, (result, status) => {
        if (opts.signal?.aborted) return resolve([])                   // 01번 useSearch 와 호환: 취소되면 빈 결과
        if (status !== maps.services.Status.OK) return resolve([])
        resolve(result.map((r) => ({ id: r.id, label: r.place_name, address: r.road_address_name || r.address_name, lat: Number(r.y), lng: Number(r.x), category: r.category_group_name, phone: r.phone, url: r.place_url })))
      }, { ...(opts.near && { location: new maps.LatLng(opts.near.lat, opts.near.lng), radius: opts.radius ?? 5000, sort: maps.services.SortBy.DISTANCE }), size: 10 })
    })
  }
  return { search }
}

<!-- 지도 위 검색창 -->
<script setup lang="ts">
const places = usePlaces()
const mapCenter = ref<LatLng>({ lat: 37.5665, lng: 126.978 })
const { query, results, loading } = useSearch<Place>((q, signal) => places.search(q, { near: mapCenter.value, signal }))   // 12회차 01번
const picked = ref<Place | null>(null)
const center = ref<LatLng>(mapCenter.value)

function pick(p: Place) { picked.value = p; center.value = { lat: p.lat, lng: p.lng } }
</script>
<template>
  <KakaoMap :center="center" :level="3" @idle="(p) => (mapCenter = p.center)">
    <div class="map-search">
      <SearchBox v-model="query" :items="results" :loading="loading" placeholder="장소, 주소 검색" @select="pick">
        <template #item="{ item }"><b>{{ item.label }}</b><span class="tiny muted">{{ item.address }}</span></template>
      </SearchBox>
    </div>
    <MapMarkers v-if="picked" :items="[picked]" :selected-id="picked.id" />
  </KakaoMap>
</template>
<!-- 주소(도로명·지번) 로 들어온 검색어는 Places 보다 05번 addressSearch 가 정확하다. 숫자·"로"·"길" 이 섞이면 둘 다 부르고 합친다 -->
` },
        },
        {
          id: 'l9', short: `길찾기와 앱 연동`,
          title: `길찾기는 지도 앱의 URL 로 넘기고, 앱이 없으면 웹으로 떨어지게 한다`,
          why: `길찾기를 직접 구현할 이유가 없습니다. 카카오맵·네이버지도·티맵은 좌표와 이름을 받는 URL 을 제공합니다. 모바일에서는 앱 스킴을 먼저 시도하고 일정 시간 안에 앱이 안 열리면 웹 URL 로 갑니다. 데스크톱은 바로 웹으로.`,
          single: { label: `✓ utils/mapLinks.ts + components/DirectionsMenu.vue`, code: String.raw`
// utils/mapLinks.ts
type Dest = { name: string; lat: number; lng: number }
const enc = encodeURIComponent

export const mapLinks = (d: Dest) => ({
  kakao: {
    label: '카카오맵',
    web: 'https://map.kakao.com/link/to/' + enc(d.name) + ',' + d.lat + ',' + d.lng,
    app: 'kakaomap://route?ep=' + d.lat + ',' + d.lng + '&by=CAR'
  },
  naver: {
    label: '네이버 지도',
    web: 'https://map.naver.com/p/directions/-/' + d.lng + ',' + d.lat + ',' + enc(d.name) + '/-/car',
    app: 'nmap://route/car?dlat=' + d.lat + '&dlng=' + d.lng + '&dname=' + enc(d.name) + '&appname=' + enc(location.origin)   // appname 필수
  },
  tmap: {
    label: '티맵',
    web: 'https://apis.openapi.sk.com/tmap/app/routes?name=' + enc(d.name) + '&lon=' + d.lng + '&lat=' + d.lat,
    app: 'tmap://route?goalname=' + enc(d.name) + '&goalx=' + d.lng + '&goaly=' + d.lat
  },
  // 지도에서 보기 (길찾기 아님)
  view: 'https://map.kakao.com/link/map/' + enc(d.name) + ',' + d.lat + ',' + d.lng
})

const isMobile = () => /android|iphone|ipad/i.test(navigator.userAgent)

// 앱 스킴 시도 → 1.5초 안에 페이지가 숨겨지지 않으면 (앱이 안 열렸으면) 웹으로
export function openApp(app: string, web: string) {
  if (!isMobile()) return window.open(web, '_blank', 'noopener')
  const start = Date.now()
  let fell = false
  const fallback = () => { if (fell) return; fell = true; if (document.visibilityState === 'visible' && Date.now() - start < 2500) location.href = web }
  const onHide = () => { fell = true; document.removeEventListener('visibilitychange', onHide) }   // 앱이 열려 페이지가 숨겨짐: 폴백 취소
  document.addEventListener('visibilitychange', onHide)
  setTimeout(fallback, 1500)
  location.href = app
}

<!-- components/DirectionsMenu.vue -->
<script setup lang="ts">
const props = defineProps<{ dest: { name: string; lat: number; lng: number } }>()
const links = computed(() => mapLinks(props.dest))
const copy = useCopy()                                               // 5회차 07번
</script>
<template>
  <Dropdown>
    <template #trigger><button class="btn">길찾기</button></template>
    <button v-for="k in ['kakao', 'naver', 'tmap'] as const" :key="k" class="menu-item" @click="openApp(links[k].app, links[k].web)">{{ links[k].label }}</button>
    <a :href="links.view" target="_blank" rel="noopener" class="menu-item">큰 지도로 보기</a>
    <button class="menu-item" @click="copy(dest.name + ' ' + dest.lat + ',' + dest.lng)">좌표 복사</button>
  </Dropdown>
</template>
<!-- 주소 텍스트 옆에는 항상 "복사" 버튼. 택시 앱에 붙여넣는 사용자가 많다 -->
` },
        },
        {
          id: 'l10', short: `정적 지도`,
          title: `상세 페이지는 정적 지도 이미지로 시작하고, 누르면 인터랙티브 지도로 바꾼다`,
          why: `매장 상세에 들어올 때마다 SDK 300KB 를 받고 타일을 로드할 이유가 없습니다. 서버가 프록시한 정적 지도 이미지(SSR·캐시 가능, 접근성 alt 가능) 를 먼저 보여 주고, 사용자가 누르면 그때 02번 지도를 띄웁니다. 한 페이지에 지도 여러 개도 피합니다.`,
          single: { label: `✓ server/api/map/static.get.ts + components/map/StaticMap.vue`, code: String.raw`
// server/api/map/static.get.ts — 네이버 Static Map 프록시 (키 숨김, 캐시). 카카오는 공식 정적 지도 API 가 없어 네이버/구글을 쓴다
export default defineEventHandler(async (event) => {
  const q = z.object({ lat: z.coerce.number(), lng: z.coerce.number(), w: z.coerce.number().int().max(1024).default(640), h: z.coerce.number().int().max(1024).default(320), level: z.coerce.number().int().min(1).max(20).default(16) }).parse(getQuery(event))
  const { naverClientId, naverClientSecret } = useRuntimeConfig()
  const key = ['static', q.lat.toFixed(5), q.lng.toFixed(5), q.w, q.h, q.level].join(':')
  const storage = useStorage('cache')
  let buf = await storage.getItemRaw<Buffer>(key)
  if (!buf) {
    const res = await $fetch.raw<ArrayBuffer>('https://maps.apigw.ntruss.com/map-static/v2/raster', {
      query: { w: q.w, h: q.h, center: q.lng + ',' + q.lat, level: q.level, scale: 2, markers: 'type:d|size:mid|pos:' + q.lng + ' ' + q.lat, format: 'png' },
      headers: { 'x-ncp-apigw-api-key-id': naverClientId, 'x-ncp-apigw-api-key': naverClientSecret }, responseType: 'arrayBuffer'
    })
    buf = Buffer.from(res._data!)
    await storage.setItemRaw(key, buf, { ttl: 7 * 86_400 })         // 7일
  }
  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, max-age=604800, immutable')
  return buf
})

<!-- components/map/StaticMap.vue : 이미지 → 클릭하면 인터랙티브 -->
<script setup lang="ts">
const props = defineProps<{ lat: number; lng: number; name: string; height?: number }>()
const interactive = ref(false)
const src = computed(() => '/api/map/static?' + new URLSearchParams({ lat: String(props.lat), lng: String(props.lng), w: '640', h: String(props.height ?? 320) }))
</script>
<template>
  <div class="static-map" :style="{ height: (height ?? 320) + 'px' }">
    <ClientOnly v-if="interactive">
      <KakaoMap :center="{ lat, lng }" :level="3" :height="(height ?? 320) + 'px'"><MapMarkers :items="[{ id: 'me', lat, lng, title: name }]" /></KakaoMap>
    </ClientOnly>
    <button v-else class="static-map-btn" @click="interactive = true" :aria-label="name + ' 위치 지도 열기'">
      <img :src="src" :alt="name + ' 위치 지도'" width="640" :height="height ?? 320" loading="lazy" decoding="async">
      <span class="hint">지도를 누르면 움직일 수 있습니다</span>
    </button>
    <div class="row gap tiny"><span>{{ name }}</span><DirectionsMenu :dest="{ name, lat, lng }" /></div>
  </div>
</template>

/* 성능 메모
   - 목록 페이지의 카드마다 지도 금지. 카드엔 정적 이미지 또는 거리 텍스트만
   - 지도는 v-if 로 안 보일 때 제거 (탭 전환 시). v-show 로 숨기면 relayout 필요 + 메모리 유지
   - SDK 로딩은 사용자가 지도 영역 근처로 스크롤할 때 (13회차 08번 useLazyPanel) 미리 시작해 두면 클릭 시 즉시 뜬다 */
` },
        },
      ],
    },
    {
      id: 'practice-18', no: 18, name: `소셜 공유와 OG 이미지`,
      lead: `링크를 공유했을 때 예쁘게 보이고, 공유 버튼이 어디서나 동작하게 하는 방법입니다. OG 메타, 동적 OG 이미지 생성, Web Share API, 카카오톡 공유, SNS 공유 URL, UTM 과 짧은 링크, 미리보기 디버깅, canonical·sitemap, 앱 딥 링크.`,
      lessons: [
        {
          id: 'l1', short: `OG 메타`,
          title: `페이지마다 useSeoMeta 로 title·description·og:image 를 절대 URL 로 넣는다`,
          why: `공유 미리보기는 크롤러가 SSR HTML 의 메타만 봅니다. 클라이언트에서 나중에 넣은 메타는 못 봅니다. useSeoMeta 는 SSR 에서 head 에 들어가고 타입이 있습니다. og:image 는 반드시 절대 URL 이어야 합니다.`,
          single: { label: `✓ composables/useShareMeta.ts + 페이지`, code: String.raw`
// composables/useShareMeta.ts — 기본값과 절대 URL 처리를 한 곳에
export function useShareMeta(input: MaybeRefOrGetter<{ title: string; description?: string; image?: string; type?: 'website' | 'article' | 'product'; noindex?: boolean; publishedAt?: string }>) {
  const { public: { siteUrl, siteName } } = useRuntimeConfig()
  const route = useRoute()
  const abs = (p?: string) => (!p ? siteUrl + '/og-default.png' : p.startsWith('http') ? p : siteUrl + p)

  const m = computed(() => { const v = toValue(input); return {
    title: v.title, titleTemplate: '%s · ' + siteName,
    description: v.description ?? '',
    ogTitle: v.title, ogDescription: v.description ?? '', ogType: v.type ?? 'website', ogSiteName: siteName, ogLocale: 'ko_KR',
    ogUrl: siteUrl + route.path,                                      // 쿼리 제외: 공유 URL 은 canonical 과 같게 (09번)
    ogImage: abs(v.image), ogImageWidth: 1200, ogImageHeight: 630, ogImageAlt: v.title,
    twitterCard: 'summary_large_image' as const, twitterTitle: v.title, twitterDescription: v.description ?? '', twitterImage: abs(v.image),
    robots: v.noindex ? 'noindex, nofollow' : 'index, follow',
    ...(v.publishedAt && { articlePublishedTime: v.publishedAt })
  } })
  useSeoMeta(m)
  useHead({ link: [{ rel: 'canonical', href: siteUrl + route.path }] })
}

<!-- pages/products/[id].vue -->
<script setup lang="ts">
const { data: product } = await useFetch('/api/products/' + useRoute().params.id)
if (!product.value) throw createError({ statusCode: 404, fatal: true })
useShareMeta(() => ({
  title: product.value!.name,
  description: product.value!.summary.slice(0, 120),                   // 카카오는 ~100자, 페이스북 ~300자. 짧게
  image: product.value!.ogImage ?? '/og/products/' + product.value!.id + '.png',   // 02·03번 동적 이미지
  type: 'product'
}))
</script>

// nuxt.config.ts: runtimeConfig.public.siteUrl 은 환경변수 NUXT_PUBLIC_SITE_URL (https://example.com, 끝에 / 없이)
// app.vue 에 useShareMeta({ title: '파인마켓', description: '빠른 배송 쇼핑' }) 기본값 → 페이지가 덮어쓴다
// SPA(ssr:false) 나 클라이언트 전용 페이지는 크롤러가 메타를 못 본다: routeRules 로 공유될 페이지만 SSR/prerender
` },
        },
        {
          id: 'l2', short: `동적 OG 이미지`,
          title: `nuxt-og-image 로 Vue 컴포넌트를 1200×630 이미지로 만든다`,
          why: `상품·글마다 다른 미리보기 이미지가 클릭률을 바꿉니다. nuxt-og-image 는 Vue 컴포넌트를 Satori 로 그려 /__og-image/ 경로로 서빙하고 캐시합니다. Satori 제약(flex 만, 일부 CSS 만, 폰트 등록) 안에서 템플릿을 만듭니다.`,
          single: { label: `✓ components/OgImage/Product.vue + 사용`, code: String.raw`
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-og-image'],
  site: { url: 'https://example.com', name: '파인마켓' },               // nuxt-site-config
  ogImage: {
    fonts: ['Noto+Sans+KR:400', 'Noto+Sans+KR:700'],                    // 한글 폰트 필수. 없으면 네모로 나온다 (구글 폰트 이름 또는 로컬 파일)
    defaults: { cacheMaxAgeSeconds: 60 * 60 * 24 * 7 }
  }
})

<!-- components/OgImage/Product.vue : Satori 규칙 — 모든 div 는 display:flex, grid 없음, position absolute 가능, 이미지는 절대 URL 또는 data URL -->
<script setup lang="ts">
defineProps<{ title: string; price: number; image: string; badge?: string }>()
</script>
<template>
  <div class="w-full h-full flex bg-white" style="font-family: 'Noto Sans KR'">
    <img :src="image" class="w-[520px] h-full object-cover" />
    <div class="flex flex-col justify-between flex-1 p-14">
      <div class="flex flex-col">
        <div v-if="badge" class="flex self-start px-4 py-1 rounded-full bg-blue-600 text-white text-2xl">{{ badge }}</div>
        <div class="text-6xl font-bold mt-6 leading-tight" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">{{ title }}</div>
      </div>
      <div class="flex items-end justify-between">
        <div class="text-5xl font-bold text-blue-700">{{ price.toLocaleString() }}원</div>
        <div class="flex items-center text-3xl text-gray-500"><img src="https://example.com/logo-mark.png" class="w-10 h-10 mr-3" />파인마켓</div>
      </div>
    </div>
  </div>
</template>

<!-- pages/products/[id].vue -->
<script setup lang="ts">
defineOgImageComponent('Product', {                                     // → og:image 메타가 /__og-image/... 로 자동 설정된다 (01번의 image 는 빼도 된다)
  title: product.value.name, price: product.value.price, image: product.value.thumbnailUrl, badge: product.value.isNew ? 'NEW' : undefined
}, { cacheMaxAgeSeconds: 86_400 })
</script>

// 개발 중 미리보기: /__og-image/... 를 직접 열거나 Nuxt DevTools 의 OG Image 탭. 서버리스 배포는 resvg/satori 바이너리 호환 확인 (Vercel·Netlify·Cloudflare 는 문서에 프리셋이 있다)
` },
        },
        {
          id: 'l3', short: `직접 만들기`,
          title: `모듈 없이: satori + resvg 로 PNG 를 만드는 서버 라우트`,
          why: `모듈이 과하거나 배포 환경에서 안 맞을 때, 서버 라우트에서 직접 만들면 통제가 쉽습니다. satori 가 JSX 모양 객체를 SVG 로, resvg 가 PNG 로. 폰트는 서버에 파일로 두고 한 번만 읽습니다. 캐시 헤더를 길게 줍니다.`,
          single: { label: `✓ server/routes/og/products/[id].png.ts`, code: String.raw`
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFile } from 'node:fs/promises'

let fonts: { name: string; data: Buffer; weight: 400 | 700 }[] | null = null
async function loadFonts() {
  fonts ??= [
    { name: 'Noto Sans KR', data: await readFile('server/assets/fonts/NotoSansKR-Regular.ttf'), weight: 400 },   // nitro serverAssets 로 포함
    { name: 'Noto Sans KR', data: await readFile('server/assets/fonts/NotoSansKR-Bold.ttf'), weight: 700 }
  ]
  return fonts
}
// satori 는 React 요소 모양의 객체를 받는다. h() 헬퍼로 만든다
const h = (type: string, props: Record<string, unknown>, ...children: unknown[]) => ({ type, props: { ...props, children: children.length === 1 ? children[0] : children } })

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const product = await db.product.findUnique({ where: { id }, select: { name: true, price: true, thumbnailUrl: true, updatedAt: true } })
  if (!product) throw createError({ statusCode: 404 })

  // ETag 로 조건부 응답 (크롤러·CDN 이 다시 받지 않게)
  const etag = '"' + id + '-' + product.updatedAt.getTime() + '"'
  if (getHeader(event, 'if-none-match') === etag) { setResponseStatus(event, 304); return '' }

  const svg = await satori(
    h('div', { style: { display: 'flex', width: '100%', height: '100%', background: '#fff', fontFamily: 'Noto Sans KR' } },
      h('img', { src: product.thumbnailUrl, style: { width: 520, height: 630, objectFit: 'cover' } }),
      h('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: 56 } },
        h('div', { style: { fontSize: 60, fontWeight: 700, lineHeight: 1.25, overflow: 'hidden', maxHeight: 230 } }, product.name),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
          h('div', { style: { fontSize: 48, fontWeight: 700, color: '#1d4ed8' } }, product.price.toLocaleString() + '원'),
          h('div', { style: { fontSize: 28, color: '#6b7280' } }, '파인마켓')))),
    { width: 1200, height: 630, fonts: await loadFonts() }
  )
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400')
  setHeader(event, 'etag', etag)
  return png
})
// 01번에서 image: '/og/products/' + id + '.png'. 이미지 생성이 ~200ms 라 CDN 캐시가 중요하다. 트래픽이 크면 생성 후 S3 에 올리고 그 URL 을 쓴다
// nuxt.config: nitro: { serverAssets: [{ baseName: 'fonts', dir: './server/assets/fonts' }] } 또는 useStorage('assets:fonts')
` },
        },
        {
          id: 'l4', short: `공유 버튼`,
          title: `navigator.share 가 되면 OS 공유 시트, 안 되면 우리 메뉴(복사·SNS)`,
          why: `모바일은 OS 공유 시트가 가장 익숙하고 모든 앱으로 보낼 수 있습니다. 데스크톱은 대부분 지원이 없으니 복사와 SNS 버튼 메뉴로 폴백합니다. share() 는 사용자 제스처 안에서만 되고, 취소는 AbortError 라 오류로 보여 주면 안 됩니다.`,
          single: { label: `✓ composables/useShare.ts + components/ShareButton.vue`, code: String.raw`
export type ShareData = { title: string; text?: string; url: string; files?: File[] }

export function useShare() {
  const native = computed(() => import.meta.client && typeof navigator.share === 'function')
  const copy = useCopy(); const toast = useToast()

  async function share(data: ShareData): Promise<'shared' | 'copied' | 'cancelled' | 'fallback'> {
    if (native.value && (!data.files || navigator.canShare?.({ files: data.files }))) {
      try { await navigator.share(data); track('share', { method: 'native', url: data.url }); return 'shared' }
      catch (e: any) { if (e.name === 'AbortError') return 'cancelled'; /* 그 외는 폴백으로 */ }
    }
    return 'fallback'
  }
  async function copyLink(url: string) { await copy(url); toast.success('링크를 복사했습니다'); track('share', { method: 'copy', url }); return 'copied' as const }
  return { native, share, copyLink }
}

<!-- components/ShareButton.vue -->
<script setup lang="ts">
const props = defineProps<{ title: string; text?: string; path?: string; image?: string }>()
const { public: { siteUrl } } = useRuntimeConfig()
const route = useRoute()
const { native, share, copyLink } = useShare()
const menu = ref(false)
const url = computed(() => withUtm(siteUrl + (props.path ?? route.path), { source: 'share', medium: 'button' }))   // 07번

async function onClick() {
  if (native.value) { const r = await share({ title: props.title, text: props.text, url: url.value }); if (r !== 'fallback') return }
  menu.value = true
}
</script>
<template>
  <div class="share">
    <button class="btn" aria-haspopup="menu" :aria-expanded="menu" @click="onClick"><IconShare /> 공유</button>
    <Dropdown v-model="menu" align="end">
      <button class="menu-item" @click="copyLink(url); menu = false">링크 복사</button>
      <KakaoShareButton :title="title" :description="text" :image="image" :url="url" class="menu-item" />   <!-- 05번 -->
      <a v-for="s in socialLinks({ url, title })" :key="s.key" :href="s.href" class="menu-item" @click.prevent="openPopup(s.href); menu = false">{{ s.label }}</a>   <!-- 06번 -->
    </Dropdown>
  </div>
</template>
<!-- 이미지 파일까지 공유(인스타·메신저로 이미지 보내기): const file = new File([await (await fetch(img)).blob()], 'share.png', { type: 'image/png' }); share({ ..., files: [file] }) -->
` },
        },
        {
          id: 'l5', short: `카카오톡 공유`,
          title: `카카오 SDK 는 공유 버튼이 보일 때 로드하고, 피드 템플릿으로 보낸다`,
          why: `국내 서비스에서 카카오톡 공유는 가장 많이 쓰는 버튼입니다. JS SDK 를 17회차 01번 loadScript 로 지연 로딩하고 Kakao.init 은 한 번만. 피드 템플릿(sendDefault) 이면 콘솔 설정 없이 되고, 메시지 템플릿(sendCustom) 은 콘솔에서 만든 id 를 씁니다.`,
          single: { label: `✓ composables/useKakaoShare.ts + components/KakaoShareButton.vue`, code: String.raw`
let inited = false
export function useKakaoShare() {
  const { public: { kakaoJsKey } } = useRuntimeConfig()
  async function sdk() {
    await loadScript('https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js', { integrity: 'sha384-...', crossorigin: 'anonymous' })   // 버전·integrity 는 카카오 문서의 최신 값으로
    const K = (window as any).Kakao
    if (!inited) { K.init(kakaoJsKey); inited = true }                 // 두 번 init 하면 오류
    return K
  }

  async function shareFeed(p: { title: string; description?: string; imageUrl: string; url: string; buttonTitle?: string; like?: number; comment?: number }) {
    const K = await sdk()
    const link = { mobileWebUrl: p.url, webUrl: p.url }               // 플랫폼 콘솔의 "사이트 도메인" 에 등록된 도메인이어야 한다
    K.Share.sendDefault({
      objectType: 'feed',
      content: { title: p.title, description: p.description ?? '', imageUrl: p.imageUrl, imageWidth: 1200, imageHeight: 630, link },
      ...(p.like != null && { social: { likeCount: p.like, commentCount: p.comment } }),
      buttons: [{ title: p.buttonTitle ?? '자세히 보기', link }],
      installTalk: true                                                // 카톡이 없으면 설치 유도
    })
    track('share', { method: 'kakao', url: p.url })
  }

  // 콘솔에서 만든 메시지 템플릿을 쓸 때 (디자인을 운영이 바꿀 수 있다)
  async function shareCustom(templateId: number, args: Record<string, string>) {
    const K = await sdk(); K.Share.sendCustom({ templateId, templateArgs: args })
  }
  return { shareFeed, shareCustom }
}

<!-- components/KakaoShareButton.vue -->
<script setup lang="ts">
const props = defineProps<{ title: string; description?: string; image?: string; url: string }>()
const { public: { siteUrl } } = useRuntimeConfig()
const { shareFeed } = useKakaoShare()
const busy = ref(false)
async function go() {
  busy.value = true
  try { await shareFeed({ title: props.title, description: props.description, imageUrl: props.image ?? siteUrl + '/og-default.png', url: withUtm(props.url, { source: 'kakao', medium: 'share' }) }) }
  catch { useToast().error('카카오톡 공유를 열지 못했습니다') }
  finally { busy.value = false }
}
</script>
<template><button :disabled="busy" @click="go"><img src="/icons/kakao.svg" alt="" width="18"> 카카오톡</button></template>

<!-- 이미지는 반드시 공개 URL, 800×400 이상 권장. 카카오 서버가 가져가서 캐시하므로 바꿔도 한동안 옛 이미지가 보인다 (08번) -->
` },
        },
        {
          id: 'l6', short: `SNS 공유 URL`,
          title: `X·페이스북·라인·네이버 블로그는 URL 하나로 공유된다. 팝업으로 연다`,
          why: `각 SNS 는 공유용 URL 엔드포인트를 제공해서 SDK 가 필요 없습니다. 파라미터 인코딩만 정확하면 됩니다. 새 탭보다 작은 팝업이 "공유하고 돌아오기" 에 맞고, 팝업이 막히면 새 탭으로 폴백합니다.`,
          single: { label: `✓ utils/socialLinks.ts`, code: String.raw`
const enc = encodeURIComponent

export function socialLinks(p: { url: string; title: string; text?: string; hashtags?: string[] }) {
  const u = (source: string) => withUtm(p.url, { source, medium: 'social' })      // 07번: 출처별 UTM
  return [
    { key: 'x', label: 'X (트위터)', href: 'https://twitter.com/intent/tweet?url=' + enc(u('x')) + '&text=' + enc(p.title) + (p.hashtags?.length ? '&hashtags=' + enc(p.hashtags.join(',')) : '') },
    { key: 'facebook', label: '페이스북', href: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(u('facebook')) },     // 제목·설명은 OG 메타에서 가져간다. quote 파라미터는 폐지됨
    { key: 'line', label: '라인', href: 'https://social-plugins.line.me/lineit/share?url=' + enc(u('line')) + '&text=' + enc(p.title) },
    { key: 'naver', label: '네이버 블로그', href: 'https://blog.naver.com/openapi/share?url=' + enc(u('naver')) + '&title=' + enc(p.title) },
    { key: 'band', label: '밴드', href: 'https://band.us/plugin/share?body=' + enc(p.title + '\n' + u('band')) + '&route=' + enc(u('band')) },
    { key: 'threads', label: '스레드', href: 'https://www.threads.net/intent/post?text=' + enc(p.title + ' ' + u('threads')) },
    { key: 'email', label: '이메일', href: 'mailto:?subject=' + enc(p.title) + '&body=' + enc((p.text ? p.text + '\n\n' : '') + u('email')) }
  ]
}

export function openPopup(href: string, name = 'share', w = 600, h = 560) {
  if (href.startsWith('mailto:')) { location.href = href; return }
  const left = window.screenX + (window.outerWidth - w) / 2, top = window.screenY + (window.outerHeight - h) / 2
  const win = window.open(href, name, 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',noopener,noreferrer')
  if (!win) window.open(href, '_blank', 'noopener,noreferrer')         // 팝업 차단 → 새 탭
}

// 인스타그램·틱톡은 웹 공유 URL 이 없다. 04번 navigator.share 로 이미지 파일을 보내거나 "링크 복사" 안내
// 공유 수 집계는 SNS 가 안 알려 준다. 07번 짧은 링크의 클릭 수로 역추적
` },
        },
        {
          id: 'l7', short: `UTM 과 짧은 링크`,
          title: `공유 링크에는 출처를 붙이고, 짧은 링크는 서버 리다이렉트로 클릭을 센다`,
          why: `어느 채널에서 왔는지 모르면 공유 기능이 쓸모 있는지 알 수 없습니다. utm_source 를 채널별로 붙이고, 긴 URL 은 /s/abc123 짧은 링크로 바꿔 보기 좋게 하면서 리다이렉트 때 클릭을 셉니다. 짧은 링크의 OG 는 원본 페이지에서 가져가게 302 로 보냅니다.`,
          single: { label: `✓ utils/utm.ts + server/routes/s/[code].get.ts`, code: String.raw`
// utils/utm.ts
export function withUtm(url: string, utm: { source: string; medium: string; campaign?: string; content?: string }) {
  const u = new URL(url)
  u.searchParams.set('utm_source', utm.source); u.searchParams.set('utm_medium', utm.medium)
  if (utm.campaign) u.searchParams.set('utm_campaign', utm.campaign); if (utm.content) u.searchParams.set('utm_content', utm.content)
  return u.toString()
}
// 공유 받은 사람이 들어왔을 때: 1회 방문 세션에 utm 을 저장해 전환(가입·구매) 에 붙인다. 그리고 주소창에서는 지운다 (재공유 시 utm 이 중첩되지 않게)
export default defineNuxtPlugin(() => {
  const route = useRoute(); const router = useRouter()
  const utm = Object.fromEntries(Object.entries(route.query).filter(([k]) => k.startsWith('utm_')))
  if (Object.keys(utm).length) { sessionStorage.setItem('utm', JSON.stringify(utm)); router.replace({ query: Object.fromEntries(Object.entries(route.query).filter(([k]) => !k.startsWith('utm_'))) }) }
})

// server/api/share-link.post.ts — 짧은 링크 만들기 (같은 URL 은 같은 코드)
import { customAlphabet } from 'nanoid'
const code = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 7)
export default defineEventHandler(async (event) => {
  const { url } = z.object({ url: z.string().url() }).parse(await readBody(event))
  const { public: { siteUrl } } = useRuntimeConfig()
  if (!url.startsWith(siteUrl)) throw createError({ statusCode: 400, statusMessage: '우리 사이트 링크만 줄일 수 있습니다' })   // 오픈 리다이렉트 방지
  const row = await db.shortLink.upsert({ where: { url }, create: { url, code: code() }, update: {} })
  return { short: siteUrl + '/s/' + row.code }
})

// server/routes/s/[code].get.ts — 302 + 클릭 집계. 크롤러는 302 를 따라가 원본의 OG 를 읽는다
export default defineEventHandler(async (event) => {
  const row = await db.shortLink.findUnique({ where: { code: getRouterParam(event, 'code')! } })
  if (!row) throw createError({ statusCode: 404 })
  const ua = getHeader(event, 'user-agent') ?? ''
  const isBot = /bot|crawler|spider|facebookexternalhit|kakaotalk-scrap|twitterbot|slackbot/i.test(ua)
  if (!isBot) event.waitUntil?.(db.shortLinkClick.create({ data: { linkId: row.id, referer: getHeader(event, 'referer'), ua: ua.slice(0, 200), ip: getRequestIP(event, { xForwardedFor: true }) } }).catch(() => {}))
  return sendRedirect(event, row.url, 302)                             // 301 은 브라우저가 캐시해 집계가 빠진다
})
// ShareButton 의 url 을 짧은 링크로: const { short } = await $api('/api/share-link', { method: 'POST', body: { url } }) — 버튼을 누를 때 만든다 (페이지마다 미리 만들지 않는다)
` },
        },
        {
          id: 'l8', short: `미리보기 디버깅`,
          title: `각 플랫폼의 디버거로 캐시를 지우며 확인한다. 로컬은 터널로`,
          why: `OG 를 고쳤는데 카톡에서 옛 이미지가 보이는 건 거의 플랫폼 캐시입니다. 플랫폼마다 캐시 초기화 도구가 있고, 로컬 개발 서버는 공개 URL 이 아니라 크롤러가 못 옵니다. 자주 틀리는 것 목록을 같이 둡니다.`,
          lang: 'plain',
          single: { label: `✓ 체크리스트`, code: String.raw`
디버거 (캐시 초기화 + 어떻게 보이는지)
  카카오      https://developers.kakao.com/tool/debugger/sharing    URL 넣고 "초기화" → 카톡 미리보기 캐시 삭제
  페이스북    https://developers.facebook.com/tools/debug/           "Scrape Again"
  X           카드 검증기는 폐지. 트윗 작성 화면에서 미리보기로 확인. 캐시는 ~7일
  링크드인    https://www.linkedin.com/post-inspector/
  슬랙·디스코드  메시지를 지우고 다시 붙여넣기 (슬랙은 /debug 불가, 보통 즉시 갱신)
  범용        https://www.opengraph.xyz  또는  curl -A "facebookexternalhit/1.1" https://example.com/products/1 | grep og:

로컬 확인
  npx cloudflared tunnel --url http://localhost:3000   → 임시 공개 URL. NUXT_PUBLIC_SITE_URL 도 그 URL 로 (og:image 절대 경로)
  크롤러 흉내: curl -A "kakaotalk-scrap/1.0" ... / "Twitterbot/1.0" — 봇 UA 에 다른 응답을 주는 로직이 있다면 꼭

자주 틀리는 것
  og:image 가 상대 경로            절대 URL 이어야 한다 (01번 abs)
  이미지 1200×630 이 아님           카톡·FB 는 비율이 안 맞으면 잘리거나 작은 썸네일로 떨어진다. 최소 600×315, 권장 1200×630, 8MB 이하
  이미지 URL 에 쿼리·리다이렉트       일부 크롤러가 못 가져온다. 최종 URL 로
  클라이언트에서만 메타 설정         SSR HTML 에 있어야 한다. ssr:false 페이지는 안 된다
  og:url 과 canonical 이 다름       공유 집계가 쪼개진다. 둘 다 쿼리 없는 같은 URL
  description 너무 김               카톡 ~100자, 그 뒤는 …
  이미지 생성 라우트가 느림           크롤러 타임아웃(~5초) → 03번 캐시 헤더, 미리 생성
  robots.txt 가 /og/ 를 막음         크롤러가 이미지를 못 가져온다
  노출 전 "다시 바꿨는데 안 바뀜"     og:image URL 에 버전(?v=updatedAt) 을 붙이면 캐시를 무력화할 수 있다
` },
        },
        {
          id: 'l9', short: `canonical·sitemap`,
          title: `canonical 은 쿼리 없는 한 URL, sitemap 은 동적 URL 을 서버가 만들고, 검색 결과 페이지는 noindex`,
          why: `같은 상품이 /products/1?ref=a 와 ?utm=b 로 흩어지면 검색 엔진이 중복으로 봅니다. canonical 하나로 모으고, sitemap 은 @nuxtjs/sitemap 이 DB 의 URL 을 받아 만들게 하며, 검색·필터 결과처럼 무한히 생기는 페이지는 색인에서 뺍니다.`,
          single: { label: `✓ nuxt.config.ts + server/api/__sitemap__/urls.ts`, code: String.raw`
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap', '@nuxtjs/robots'],                       // 또는 @nuxtjs/seo 하나로 묶음 (og-image 포함)
  site: { url: 'https://example.com', name: '파인마켓' },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],                                  // 동적 URL 공급
    exclude: ['/admin/**', '/me/**', '/pay/**', '/search'],
    defaults: { changefreq: 'daily', priority: 0.7 },
    sitemaps: { pages: { includeAppSources: true }, products: { sources: ['/api/__sitemap__/urls?type=products'] } }   // 5만 개 넘으면 분할
  },
  robots: {
    disallow: ['/admin', '/me', '/api', '/pay', '/search'],
    sitemap: 'https://example.com/sitemap_index.xml'
  },
  routeRules: {
    '/search': { robots: false },                                        // noindex 헤더
    '/products/**': { swr: 600 },                                        // 크롤러에게 빠르게
    '/go/**': { robots: false }
  }
})

// server/api/__sitemap__/urls.ts
export default defineSitemapEventHandler(async (event) => {
  const type = getQuery(event).type
  if (type === 'products') {
    const rows = await db.product.findMany({ where: { active: true, deletedAt: null }, select: { id: true, updatedAt: true, thumbnailUrl: true } })
    return rows.map((p) => ({ loc: '/products/' + p.id, lastmod: p.updatedAt, images: p.thumbnailUrl ? [{ loc: p.thumbnailUrl }] : [] }))
  }
  const posts = await db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
  return posts.map((p) => ({ loc: '/blog/' + p.slug, lastmod: p.updatedAt }))
})

// 페이지: 01번 useShareMeta 가 canonical 을 route.path (쿼리 없음) 로 넣는다. 페이지네이션은 ?page=2 를 canonical 에 포함하는 게 맞다 → 그 페이지만 override:
//   useHead({ link: [{ rel: 'canonical', href: siteUrl + route.path + (page > 1 ? '?page=' + page : '') }] })
// 상품이 삭제되면 410 Gone (404 보다 빨리 색인에서 빠진다): throw createError({ statusCode: 410 })
// 확인: https://example.com/sitemap_index.xml, Search Console 에 등록. robots: https://example.com/robots.txt
` },
        },
        {
          id: 'l10', short: `앱 딥 링크`,
          title: `앱이 있으면 앱으로, 없으면 웹으로: 유니버설 링크 파일과 스마트 배너`,
          why: `네이티브 앱이 있는 서비스는 공유 링크가 앱에서 열려야 합니다. iOS 유니버설 링크와 안드로이드 앱 링크는 사이트의 .well-known 파일로 "이 도메인은 이 앱 것" 을 증명합니다. 파일만 올리면 되고 Nuxt 는 public/ 으로 서빙합니다. 미설치 사용자는 웹으로, 그리고 배너로 설치를 권합니다.`,
          single: { label: `✓ public/.well-known/* + 스마트 배너 + 앱 열기 버튼`, code: String.raw`
// public/.well-known/apple-app-site-association   (확장자 없음, Content-Type application/json 으로 서빙돼야 한다)
{
  "applinks": { "apps": [], "details": [
    { "appID": "TEAMID1234.com.example.finemarket", "paths": ["/products/*", "/orders/*", "/s/*", "NOT /admin/*"] }
  ] },
  "webcredentials": { "apps": ["TEAMID1234.com.example.finemarket"] }
}
// public/.well-known/assetlinks.json   (안드로이드)
[{ "relation": ["delegate_permission/common.handle_all_urls"],
   "target": { "namespace": "android_app", "package_name": "com.example.finemarket", "sha256_cert_fingerprints": ["AB:CD:...:EF"] } }]

// nuxt.config.ts — 확장자 없는 파일의 MIME 보장
routeRules: { '/.well-known/apple-app-site-association': { headers: { 'content-type': 'application/json' } } }
// 확인: https://example.com/.well-known/apple-app-site-association 이 200 + JSON, 리다이렉트 없이 (www ↔ non-www 둘 다)

<!-- app.vue : iOS 스마트 배너 (Safari 가 상단에 "앱에서 열기" 를 보여 준다). 안드로이드는 06번 식 자체 배너 -->
<script setup lang="ts">
const route = useRoute()
useHead({ meta: [{ name: 'apple-itunes-app', content: 'app-id=123456789, app-argument=https://example.com' + route.fullPath }] })
</script>

<!-- components/OpenInAppBanner.vue : 모바일 웹 상단. 17회차 09번 openApp 재사용 -->
<script setup lang="ts">
const route = useRoute()
const show = useLocalStorage('open-in-app-dismissed', 0)
const isMobile = import.meta.client && /android|iphone/i.test(navigator.userAgent)
const visible = computed(() => isMobile && Date.now() - show.value > 7 * 86_400_000)
function open() {
  const path = route.fullPath
  const store = /iphone/i.test(navigator.userAgent) ? 'https://apps.apple.com/app/id123456789' : 'https://play.google.com/store/apps/details?id=com.example.finemarket'
  openApp('finemarket://open?path=' + encodeURIComponent(path), store)   // 앱 스킴 → 1.5초 안에 안 열리면 스토어
}
</script>
<template>
  <div v-if="visible" class="app-banner">
    <img src="/pwa-64x64.png" alt="" width="36"><div class="grow"><b>파인마켓 앱</b><p class="tiny muted">앱에서 더 편하게</p></div>
    <button class="btn-primary btn-sm" @click="open">열기</button><button class="icon-btn" aria-label="닫기" @click="show = Date.now()">×</button>
  </div>
</template>

// 유니버설 링크가 설정되면 공유된 https 링크를 누르는 것만으로 앱이 열린다 (앱 스킴 불필요). 스킴은 "앱으로 열기" 버튼처럼 명시적 동작에만
// 앱 안의 웹뷰에서 우리 사이트를 열 때는 UA 에 앱 표식을 넣고, 배너·설치 유도는 숨긴다
` },
        },
      ],
    },
    {
      id: 'practice-19', no: 19, name: `에디터 (TipTap) 와 이미지 붙여넣기`,
      lead: `TipTap 으로 리치 텍스트 에디터를 넣는 방법입니다. 기본 컴포넌트, 툴바, 이미지 붙여넣기·드롭 업로드, 링크, 멘션, 자동 저장, 저장 형식과 서버 sanitize, 읽기 전용 렌더링, 글자 수 제한, 확장 묶음과 성능.`,
      lessons: [
        {
          id: 'l1', short: `기본 에디터`,
          title: `useEditor 로 만들고 v-model 로 HTML 을 주고받는 컴포넌트 하나`,
          why: `TipTap 은 ProseMirror 위의 헤드리스 에디터라 UI 는 우리가 만듭니다. 에디터 인스턴스는 클라이언트에서만 만들고 언마운트 때 destroy 합니다. v-model 은 바깥에서 값이 바뀔 때만 setContent 해야 커서가 안 튑니다.`,
          single: { label: `✓ components/editor/RichEditor.vue`, code: String.raw`
<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = withDefaults(defineProps<{ placeholder?: string; editable?: boolean; minHeight?: string }>(), { placeholder: '내용을 입력하세요', editable: true, minHeight: '240px' })
const model = defineModel<string>({ default: '' })                   // HTML 문자열. JSON 으로 다루려면 07번
const emit = defineEmits<{ ready: [editor: Editor] }>()

const editor = useEditor({
  content: model.value,
  editable: props.editable,
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),    // codeBlock 은 10번에서 하이라이트 버전으로
    Placeholder.configure({ placeholder: props.placeholder })
  ],
  editorProps: { attributes: { class: 'prose focus:outline-none', style: 'min-height:' + props.minHeight } },
  onUpdate: ({ editor }) => { model.value = editor.isEmpty ? '' : editor.getHTML() },   // 빈 문서는 '<p></p>' 가 아니라 '' 로
  onCreate: ({ editor }) => emit('ready', editor)
})

// 바깥에서 값이 바뀐 경우만 반영 (자기 자신이 낸 업데이트는 같은 HTML 이라 건너뛴다)
watch(model, (v) => { const e = editor.value; if (e && v !== e.getHTML() && !(v === '' && e.isEmpty)) e.commands.setContent(v, false) })
watch(() => props.editable, (v) => editor.value?.setEditable(v))
onBeforeUnmount(() => editor.value?.destroy())

defineExpose({ editor, focus: () => editor.value?.commands.focus('end') })
</script>

<template>
  <div class="rich-editor" :class="{ readonly: !editable }">
    <EditorToolbar v-if="editor && editable" :editor="editor" />                     <!-- 02번 -->
    <EditorContent :editor="editor" />
  </div>
</template>

<!-- 사용: SSR 에서는 그리지 않는다 -->
<ClientOnly>
  <RichEditor v-model="form.body" placeholder="본문" />
  <template #fallback><div class="skeleton" style="height: 280px" /></template>
</ClientOnly>

<style>
.rich-editor { border: 1px solid var(--border); border-radius: 8px; }
.rich-editor .ProseMirror { padding: 16px; }
.rich-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--muted); float: left; height: 0; pointer-events: none; }
</style>
` },
        },
        {
          id: 'l2', short: `툴바`,
          title: `툴바 버튼은 선언 배열로, 활성 상태는 isActive 로, 명령은 chain().focus() 로`,
          why: `버튼마다 템플릿을 복붙하면 20개가 금방 됩니다. {icon, label, action, active} 배열로 선언하고 v-for 로 그립니다. 명령 앞에 focus() 를 붙여야 버튼 클릭으로 포커스를 잃은 뒤에도 에디터에 적용됩니다. 비활성(can()) 도 같이 봅니다.`,
          single: { label: `✓ components/editor/EditorToolbar.vue`, code: String.raw`
<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
const props = defineProps<{ editor: Editor }>()

type Btn = { key: string; label: string; icon: string; shortcut?: string; run: (e: Editor) => boolean; active?: (e: Editor) => boolean; can?: (e: Editor) => boolean }
const groups: Btn[][] = [
  [
    { key: 'bold', label: '굵게', icon: 'B', shortcut: 'Ctrl+B', run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
    { key: 'italic', label: '기울임', icon: 'I', shortcut: 'Ctrl+I', run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
    { key: 'strike', label: '취소선', icon: 'S', run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive('strike') },
    { key: 'code', label: '코드', icon: '<>', run: (e) => e.chain().focus().toggleCode().run(), active: (e) => e.isActive('code') }
  ],
  [
    { key: 'h1', label: '제목 1', icon: 'H1', run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), active: (e) => e.isActive('heading', { level: 1 }) },
    { key: 'h2', label: '제목 2', icon: 'H2', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
    { key: 'quote', label: '인용', icon: '❝', run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive('blockquote') },
    { key: 'ul', label: '목록', icon: '•', run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
    { key: 'ol', label: '번호 목록', icon: '1.', run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') }
  ],
  [
    { key: 'link', label: '링크', icon: '🔗', shortcut: 'Ctrl+K', run: (e) => { e.emit('open-link' as any); return true }, active: (e) => e.isActive('link') },   // 04번
    { key: 'image', label: '이미지', icon: '🖼', run: (e) => { pickImage(e); return true } },                                                                   // 03번
    { key: 'hr', label: '구분선', icon: '—', run: (e) => e.chain().focus().setHorizontalRule().run() }
  ],
  [
    { key: 'undo', label: '실행 취소', icon: '↶', shortcut: 'Ctrl+Z', run: (e) => e.chain().focus().undo().run(), can: (e) => e.can().undo() },
    { key: 'redo', label: '다시 실행', icon: '↷', shortcut: 'Ctrl+Shift+Z', run: (e) => e.chain().focus().redo().run(), can: (e) => e.can().redo() }
  ]
]
// isActive 는 selection 이 바뀔 때마다 다시 계산돼야 한다. editor 는 Vue 가 반응형으로 감싸 주므로 (useEditor) 템플릿에서 직접 호출하면 된다
</script>

<template>
  <div class="toolbar" role="toolbar" aria-label="서식">
    <template v-for="(group, gi) in groups" :key="gi">
      <span v-if="gi" class="sep" />
      <button v-for="b in group" :key="b.key" type="button" class="tb-btn"
        :class="{ active: b.active?.(editor) }" :disabled="b.can ? !b.can(editor) : false"
        :title="b.label + (b.shortcut ? ' (' + b.shortcut + ')' : '')" :aria-label="b.label" :aria-pressed="b.active ? !!b.active(editor) : undefined"
        @mousedown.prevent @click="b.run(editor)">{{ b.icon }}</button>                                <!-- mousedown.prevent: 에디터 포커스·선택이 풀리지 않게 -->
    </template>
  </div>
</template>
<!-- 선택 영역 위에 뜨는 버블 메뉴: import { BubbleMenu } from '@tiptap/vue-3' → <BubbleMenu :editor="editor" :tippy-options="{ duration: 100 }"> 굵게·기울임·링크 </BubbleMenu> -->
` },
        },
        {
          id: 'l3', short: `이미지 업로드`,
          title: `붙여넣기·드롭·버튼 모두 한 업로드 함수로: 자리표시자 먼저, 업로드 끝나면 URL 교체`,
          why: `스크린샷을 Ctrl+V 하는 게 가장 흔한 이미지 입력입니다. 클립보드·드롭의 파일을 가로채 업로드하고, 기다리는 동안 흐린 미리보기(data URL) 를 넣었다가 끝나면 실제 URL 로 바꿉니다. base64 를 본문에 그대로 두면 안 됩니다(용량·보안).`,
          single: { label: `✓ components/editor/extensions/imageUpload.ts`, code: String.raw`
import Image from '@tiptap/extension-image'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const MAX = 10 * 1024 * 1024
export type Uploader = (file: File, onProgress?: (p: number) => void) => Promise<{ url: string; width?: number; height?: number }>

export const ImageUpload = Image.extend<{ upload: Uploader; inline: boolean; allowBase64: boolean; HTMLAttributes: Record<string, any> }>({
  addOptions() { return { ...this.parent?.(), upload: async () => { throw new Error('upload not configured') }, allowBase64: false } },
  addAttributes() { return { ...this.parent?.(), width: { default: null }, height: { default: null }, 'data-uploading': { default: null } } },

  addProseMirrorPlugins() {
    const { upload } = this.options
    const editor = this.editor
    const handleFiles = (files: File[], pos?: number) => {
      const images = files.filter((f) => f.type.startsWith('image/'))
      if (!images.length) return false
      images.forEach((f) => insertAndUpload(editor, f, upload, pos))
      return true                                                      // 기본 붙여넣기(base64 삽입) 를 막는다
    }
    return [new Plugin({
      key: new PluginKey('imageUpload'),
      props: {
        handlePaste: (_view, event) => handleFiles(Array.from(event.clipboardData?.files ?? [])),
        handleDrop: (view, event) => {
          const files = Array.from(event.dataTransfer?.files ?? []); if (!files.length) return false
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
          event.preventDefault(); return handleFiles(files, pos)
        }
      }
    })]
  }
})

async function insertAndUpload(editor: any, file: File, upload: Uploader, pos?: number) {
  if (file.size > MAX) return useToast().error('이미지는 10MB 이하만 올릴 수 있습니다')
  const resized = await resizeImage(file, { maxWidth: 1600, quality: 0.85 })        // 6회차 02번: 업로드 전 리사이즈
  const preview = URL.createObjectURL(resized)
  const id = 'up-' + Math.random().toString(36).slice(2)
  const insertAt = pos ?? editor.state.selection.from
  editor.chain().insertContentAt(insertAt, { type: 'image', attrs: { src: preview, 'data-uploading': id } }).run()   // 자리표시자 (CSS 로 흐리게 + 스피너)

  try {
    const { url, width, height } = await upload(resized)
    replaceBySrc(editor, preview, { src: url, width, height, 'data-uploading': null })
  } catch {
    removeBySrc(editor, preview); useToast().error('이미지 업로드에 실패했습니다')
  } finally { URL.revokeObjectURL(preview) }
}
function findImage(editor: any, src: string) { let found: number | null = null; editor.state.doc.descendants((node: any, p: number) => { if (node.type.name === 'image' && node.attrs.src === src) { found = p; return false } }); return found }
function replaceBySrc(editor: any, src: string, attrs: Record<string, unknown>) { const p = findImage(editor, src); if (p != null) editor.view.dispatch(editor.state.tr.setNodeMarkup(p, undefined, { ...editor.state.doc.nodeAt(p)!.attrs, ...attrs })) }
function removeBySrc(editor: any, src: string) { const p = findImage(editor, src); if (p != null) editor.view.dispatch(editor.state.tr.delete(p, p + 1)) }

// RichEditor.vue 의 extensions 에: ImageUpload.configure({ upload: (file) => uploadImage(file) })  — uploadImage 는 6회차 03번 (presigned 또는 /api/upload)
// 툴바 이미지 버튼: input[type=file] 를 열어 같은 insertAndUpload 로. 제출 시 data-uploading 이 남아 있으면 "업로드 중인 이미지가 있습니다" 로 막는다
// CSS: img[data-uploading] { opacity: .5; filter: blur(1px) }
` },
        },
        {
          id: 'l4', short: `링크`,
          title: `링크는 버블 입력으로 넣고, 자동 링크를 켜되 javascript: 같은 스킴은 막는다`,
          why: `prompt() 로 URL 을 받는 건 임시방편입니다. 선택 영역 위에 작은 입력창을 띄워 넣고 제거합니다. 붙여넣은 URL 은 자동으로 링크가 되게 하고, 허용 스킴을 http·https·mailto·tel 로 제한해 XSS 를 막습니다. 외부 링크는 새 탭 + rel 을 붙입니다.`,
          single: { label: `✓ Link 설정 + components/editor/LinkPopover.vue`, code: String.raw`
// RichEditor.vue extensions 에 추가
import Link from '@tiptap/extension-link'
Link.configure({
  openOnClick: false,                                                   // 편집 중 클릭으로 이동하지 않게. 읽기 모드에서는 true
  autolink: true, linkOnPaste: true,
  defaultProtocol: 'https',
  protocols: ['http', 'https', 'mailto', 'tel'],
  isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && !/^javascript:|^data:|^vbscript:/i.test(url.trim()),
  HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
  shouldAutoLink: (url) => /^https?:\/\//i.test(url) || /^[\w-]+(\.[\w-]+)+/.test(url)
})

<!-- components/editor/LinkPopover.vue : 툴바 '링크' 버튼 또는 Ctrl+K 로 열린다 -->
<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
const props = defineProps<{ editor: Editor }>()
const open = ref(false); const url = ref(''); const input = useTemplateRef('input')
const anchor = ref<{ x: number; y: number } | null>(null)

function show() {
  const { from, to } = props.editor.state.selection
  if (from === to && !props.editor.isActive('link')) return useToast().info('링크를 걸 텍스트를 먼저 선택하세요')
  url.value = props.editor.getAttributes('link').href ?? ''
  const rect = props.editor.view.coordsAtPos(from); anchor.value = { x: rect.left, y: rect.bottom + 6 }
  open.value = true; nextTick(() => input.value?.select())
}
function apply() {
  let href = url.value.trim()
  if (!href) return remove()
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) href = 'https://' + href
  if (/^javascript:/i.test(href)) return
  props.editor.chain().focus().extendMarkRange('link').setLink({ href }).run(); open.value = false
}
function remove() { props.editor.chain().focus().extendMarkRange('link').unsetLink().run(); open.value = false }

onMounted(() => props.editor.on('open-link' as any, show))             // 02번 툴바가 emit
useEventListener(document, 'keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k' && props.editor.isFocused) { e.preventDefault(); show() } })
</script>
<template>
  <Teleport to="body">
    <form v-if="open" class="link-popover" :style="{ left: anchor!.x + 'px', top: anchor!.y + 'px' }" @submit.prevent="apply" @keydown.esc="open = false">
      <input ref="input" v-model="url" type="text" placeholder="https://" autocomplete="off" spellcheck="false">
      <button type="submit" class="btn-sm">적용</button>
      <button v-if="editor.isActive('link')" type="button" class="btn-sm" @click="remove">제거</button>
    </form>
  </Teleport>
</template>
<!-- 링크 미리보기 카드(제목·썸네일) 가 필요하면: 서버 /api/unfurl?url= 가 18회차 OG 를 읽어 오고, 별도 노드(LinkCard) 로 삽입 -->
` },
        },
        {
          id: 'l5', short: `멘션`,
          title: `@ 를 치면 사용자 검색 목록이 뜨고, 선택하면 id 를 가진 멘션 노드가 들어간다`,
          why: `멘션은 "텍스트 @홍길동" 이 아니라 사용자 id 를 가진 노드여야 이름이 바뀌어도 따라가고 알림(15회차) 을 보낼 수 있습니다. Mention 확장의 suggestion 에 검색 함수와 목록 렌더러를 줍니다. 목록은 키보드로 고를 수 있어야 합니다.`,
          single: { label: `✓ components/editor/extensions/mention.ts + MentionList.vue`, code: String.raw`
// mention.ts
import Mention from '@tiptap/extension-mention'
import { VueRenderer } from '@tiptap/vue-3'
import tippy, { type Instance } from 'tippy.js'
import MentionList from '../MentionList.vue'

export const MentionExt = Mention.configure({
  HTMLAttributes: { class: 'mention' },
  renderText: ({ node }) => '@' + node.attrs.label,                      // 플레인 텍스트 변환(알림 미리보기 등) 에서
  renderHTML: ({ node }) => ['a', { class: 'mention', 'data-id': node.attrs.id, href: '/users/' + node.attrs.id }, '@' + node.attrs.label],
  suggestion: {
    char: '@',
    allowSpaces: false,
    items: async ({ query }) => {
      if (query.length < 1) return []
      return await $fetch<{ id: string; label: string; avatar?: string }[]>('/api/users/search', { query: { q: query, limit: 6 } })   // 12회차 서버 검색 재사용
    },
    render: () => {
      let component: VueRenderer; let popup: Instance[]
      return {
        onStart: (props) => {
          component = new VueRenderer(MentionList, { props, editor: props.editor })
          if (!props.clientRect) return
          popup = tippy('body', { getReferenceClientRect: props.clientRect as any, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start' })
        },
        onUpdate: (props) => { component.updateProps(props); if (props.clientRect) popup[0].setProps({ getReferenceClientRect: props.clientRect as any }) },
        onKeyDown: (props) => { if (props.event.key === 'Escape') { popup[0].hide(); return true } return component.ref?.onKeyDown(props) ?? false },
        onExit: () => { popup[0].destroy(); component.destroy() }
      }
    }
  }
})

<!-- MentionList.vue -->
<script setup lang="ts">
const props = defineProps<{ items: { id: string; label: string; avatar?: string }[]; command: (item: { id: string; label: string }) => void }>()
const index = ref(0)
watch(() => props.items, () => (index.value = 0))
function select(i: number) { const it = props.items[i]; if (it) props.command({ id: it.id, label: it.label }) }
function onKeyDown({ event }: { event: KeyboardEvent }) {
  if (event.key === 'ArrowUp') { index.value = (index.value + props.items.length - 1) % props.items.length; return true }
  if (event.key === 'ArrowDown') { index.value = (index.value + 1) % props.items.length; return true }
  if (event.key === 'Enter') { select(index.value); return true }
  return false
}
defineExpose({ onKeyDown })
</script>
<template>
  <div class="mention-list" role="listbox">
    <button v-for="(it, i) in items" :key="it.id" role="option" :aria-selected="i === index" :class="{ active: i === index }" @click="select(i)" @mousemove="index = i">
      <img v-if="it.avatar" :src="it.avatar" alt="" class="avatar-xs"> {{ it.label }}
    </button>
    <div v-if="!items.length" class="muted tiny pad">없음</div>
  </div>
</template>

// 저장 후: 서버가 본문 JSON 에서 type === 'mention' 노드의 attrs.id 를 모아 notify(id, 'comment.mention', …) (15회차 10번). HTML 로 저장했다면 a.mention[data-id] 를 파싱
` },
        },
        {
          id: 'l6', short: `자동 저장`,
          title: `2초 멈추면 임시 저장하고, 다시 열면 "저장되지 않은 내용" 을 복원할지 묻는다`,
          why: `긴 글을 쓰다가 탭을 닫거나 세션이 끊기면 다 날아갑니다. 입력이 멈추고 2초 뒤 localStorage 와 서버 draft 에 저장하고, 들어왔을 때 서버 본문보다 최신 draft 가 있으면 복원을 제안합니다. 저장 상태를 작게 보여 줍니다.`,
          single: { label: `✓ composables/useDraft.ts`, code: String.raw`
import { useDebounceFn, useLocalStorage } from '@vueuse/core'

export function useDraft(key: string, content: Ref<string>, opts: { remote?: (html: string) => Promise<void>; serverUpdatedAt?: string } = {}) {
  const local = useLocalStorage<{ html: string; at: number } | null>('draft:' + key, null)
  const state = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const savedAt = ref<number | null>(null)
  let lastSaved = content.value

  const save = useDebounceFn(async () => {
    const html = content.value
    if (html === lastSaved) return
    state.value = 'saving'
    local.value = { html, at: Date.now() }                                // 1) 로컬은 즉시·항상
    try { await opts.remote?.(html); lastSaved = html; savedAt.value = Date.now(); state.value = 'saved' }   // 2) 서버 draft (선택)
    catch { state.value = 'error' }
  }, 2000)
  watch(content, save)

  // 복원 제안: 로컬 draft 가 서버 본문보다 최신이고 내용이 다를 때
  const restorable = computed(() => {
    const d = local.value
    if (!d || d.html === content.value) return null
    if (opts.serverUpdatedAt && d.at < new Date(opts.serverUpdatedAt).getTime()) return null
    return d
  })
  function restore() { if (local.value) { content.value = local.value.html; lastSaved = content.value } }
  function discard() { local.value = null }
  function clear() { local.value = null; lastSaved = content.value }     // 정식 저장(발행) 후

  // 탭 닫기 직전: 디바운스를 기다리지 않고 로컬에 바로
  useEventListener(window, 'pagehide', () => { if (content.value !== lastSaved) local.value = { html: content.value, at: Date.now() } })
  return { state, savedAt, restorable, restore, discard, clear }
}

<!-- pages/posts/[id]/edit.vue -->
<script setup lang="ts">
const { data: post } = await useFetch('/api/posts/' + id)
const body = ref(post.value!.body)
const draft = useDraft('post:' + id, body, { remote: (html) => $api('/api/posts/' + id + '/draft', { method: 'PUT', body: { html } }), serverUpdatedAt: post.value!.updatedAt })
async function publish() { await $api('/api/posts/' + id, { method: 'PATCH', body: { body: body.value } }); draft.clear(); toast.success('저장했습니다') }
</script>
<template>
  <div v-if="draft.restorable.value" class="banner">
    {{ timeAgo(draft.restorable.value.at) }}에 저장된 임시 내용이 있습니다.
    <button class="link" @click="draft.restore()">복원</button> · <button class="link" @click="draft.discard()">삭제</button>
  </div>
  <RichEditor v-model="body" />
  <p class="tiny muted">{{ { idle: '', saving: '저장 중…', saved: '임시 저장됨 ' + (draft.savedAt.value ? timeAgo(draft.savedAt.value) : ''), error: '임시 저장 실패 (로컬에는 저장됨)' }[draft.state.value] }}</p>
</template>
` },
        },
        {
          id: 'l7', short: `저장과 sanitize`,
          title: `서버는 받은 HTML 을 허용 목록으로 걸러 저장하고, 보여 줄 때도 걸러진 것만 내보낸다`,
          why: `에디터가 만든 HTML 이라도 브라우저 요청은 누구나 조작할 수 있습니다. 서버에서 sanitize-html 로 태그·속성·스킴을 허용 목록으로 거르고 저장합니다. JSON 으로 저장하면 구조가 보장되지만 서버 렌더에 generateHTML 이 필요합니다. 둘 중 하나를 정하고, 어느 쪽이든 sanitize 는 서버에서.`,
          single: { label: `✓ server/utils/sanitize.ts + 저장 핸들러`, code: String.raw`
import sanitizeHtml from 'sanitize-html'

const ALLOWED_IMG_HOSTS = ['cdn.example.com', 'uploads.example.com']

export function sanitizeRich(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 's', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'hr', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'mark'],
    allowedAttributes: {
      a: ['href', 'rel', 'target', 'class', 'data-id'],                 // mention
      img: ['src', 'alt', 'width', 'height', 'loading'],
      pre: ['class'], code: ['class'],                                   // language-ts
      td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'],
      span: ['class'], '*': ['data-type']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https'] },                             // data: 이미지 금지 (03번이 업로드로 바꿨어야 한다)
    allowedClasses: { a: ['mention'], pre: [/^language-/], code: [/^language-/], span: [/^hljs-/] },
    transformTags: {
      a: (tag, attrs) => ({ tagName: 'a', attribs: { ...attrs, rel: 'noopener noreferrer nofollow', ...(attrs.href && /^https?:/.test(attrs.href) && !attrs.href.startsWith(process.env.NUXT_PUBLIC_SITE_URL!) && { target: '_blank' }) } }),
      img: (tag, attrs) => { try { const u = new URL(attrs.src); if (!ALLOWED_IMG_HOSTS.includes(u.hostname)) return { tagName: 'img', attribs: {} } } catch { return { tagName: 'img', attribs: {} } }; return { tagName: 'img', attribs: { ...attrs, loading: 'lazy' } } }
    },
    exclusiveFilter: (f) => f.tag === 'img' && !f.attribs.src          // src 가 지워진 img 는 통째로 제거
  })
}

// server/api/posts/[id].patch.ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { body } = z.object({ body: z.string().max(200_000) }).parse(await readBody(event))
  const clean = sanitizeRich(body)
  const text = clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()           // 검색·미리보기용 플레인 텍스트
  const mentions = [...clean.matchAll(/class="mention"[^>]*data-id="([^"]+)"/g)].map((m) => m[1])
  const post = await db.post.update({ where: { id: getRouterParam(event, 'id')!, authorId: user.id }, data: { body: clean, excerpt: text.slice(0, 200), updatedAt: new Date() } })
  for (const id of new Set(mentions)) if (id !== user.id) notify(id, 'post.mention', { postId: post.id, authorName: user.name })
  return post
})

/* JSON 으로 저장하기로 했다면
   - 에디터: editor.getJSON() 을 저장, setContent(json)
   - 서버 렌더: import { generateHTML } from '@tiptap/html' + 같은 확장 목록 → HTML → sanitizeRich → 응답 (확장 목록이 에디터와 같아야 한다: shared/editorExtensions.ts 로 공유)
   - 장점: 구조 검색(멘션 노드 찾기), 다른 포맷 변환이 쉽다. 단점: 서버에 확장 의존, 마이그레이션 */
` },
        },
        {
          id: 'l8', short: `읽기 전용 렌더링`,
          title: `보여 줄 때는 에디터를 띄우지 않는다: 걸러진 HTML + prose 스타일 + 코드 하이라이트`,
          why: `글 목록·상세에서 TipTap 인스턴스를 만드는 건 낭비입니다(번들·초기화). 서버가 걸러 준 HTML 을 v-html 로 넣고 CSS 로 에디터와 같은 모양을 냅니다. 코드 블록은 보여 줄 때 하이라이트하고, 이미지는 lazy, 링크 클릭은 라우터로.`,
          single: { label: `✓ components/editor/RichContent.vue`, code: String.raw`
<script setup lang="ts">
const props = defineProps<{ html: string }>()                          // 반드시 서버에서 sanitize 된 것만 (07번). 사용자 입력을 바로 넣지 않는다
const el = useTemplateRef('el')

onMounted(async () => {
  const root = el.value!
  // 1) 코드 블록 하이라이트: 있을 때만 로드
  const blocks = root.querySelectorAll('pre code')
  if (blocks.length) {
    const { default: hljs } = await import('highlight.js/lib/core')
    const { default: ts } = await import('highlight.js/lib/languages/typescript'); hljs.registerLanguage('typescript', ts)
    const { default: xml } = await import('highlight.js/lib/languages/xml'); hljs.registerLanguage('html', xml)
    blocks.forEach((b) => hljs.highlightElement(b as HTMLElement))
  }
  // 2) 이미지: 클릭하면 라이트박스, 자연 크기 비율로 레이아웃 흔들림 방지는 서버가 width/height 를 넣어 줬다 (03번)
  root.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; img.decoding = 'async'; img.addEventListener('click', () => openLightbox(img.src)) })
})

// 3) 내부 링크는 라우터로 (전체 새로고침 방지), 외부는 새 탭 (sanitize 가 target 을 넣었다)
const router = useRouter()
function onClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest('a'); if (!a) return
  const href = a.getAttribute('href') ?? ''
  if (href.startsWith('/') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); router.push(href) }
}
</script>

<template>
  <div ref="el" class="prose rich-content" v-html="html" @click="onClick" />
</template>

<style>
/* 에디터(.ProseMirror) 와 같은 규칙을 공유한다: assets/css/prose.css 를 둘 다 import */
.prose { line-height: 1.7; word-break: keep-all; overflow-wrap: anywhere; }
.prose h1 { font-size: 1.75rem; margin: 1.5em 0 .5em; } .prose h2 { font-size: 1.4rem; margin: 1.3em 0 .4em; }
.prose p { margin: .75em 0; } .prose img { max-width: 100%; height: auto; border-radius: 8px; cursor: zoom-in; }
.prose blockquote { border-left: 3px solid var(--border); padding-left: 1em; color: var(--muted); }
.prose pre { background: #0f172a; color: #e2e8f0; padding: 1em; border-radius: 8px; overflow-x: auto; font-size: .9em; }
.prose code:not(pre code) { background: var(--chip); padding: .1em .35em; border-radius: 4px; font-size: .9em; }
.prose a.mention { color: var(--accent); font-weight: 500; text-decoration: none; }
.prose table { border-collapse: collapse; width: 100%; } .prose td, .prose th { border: 1px solid var(--border); padding: .4em .6em; }
</style>
<!-- SSR 에서 v-html 은 그대로 나가므로 SEO 도 된다. 하이라이트만 클라이언트. 첫 화면 깜빡임이 싫으면 서버에서 하이라이트해 저장 -->
` },
        },
        {
          id: 'l9', short: `글자 수 제한`,
          title: `CharacterCount 로 세고, 한도 근처에서 색을 바꾸고, 넘으면 제출을 막는다`,
          why: `댓글 1,000자 같은 제한은 입력을 끊는 것보다 넘었음을 보여 주는 편이 낫습니다(붙여넣기 때 뒷부분이 조용히 잘리면 당황). limit 옵션은 입력을 막고, 없이 쓰면 세기만 합니다. 서버도 같은 길이를 검사합니다(07번 text 기준).`,
          single: { label: `✓ CharacterCount 설정 + 카운터 UI`, code: String.raw`
// RichEditor.vue extensions
import CharacterCount from '@tiptap/extension-character-count'
CharacterCount.configure({ limit: props.hardLimit ?? null, mode: 'textSize' })   // limit 을 주면 그 이상 입력·붙여넣기가 잘린다. 보통 hardLimit 은 null 로 두고 UI 로 알린다

// 글자 수 노출: editor.storage.characterCount.characters() / words()
defineExpose({ editor, characters: () => editor.value?.storage.characterCount.characters() ?? 0 })

<!-- components/editor/CharCounter.vue -->
<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
const props = defineProps<{ editor: Editor; max: number }>()
const count = computed(() => props.editor.storage.characterCount.characters())   // editor 가 반응형이라 업데이트마다 다시 계산
const ratio = computed(() => count.value / props.max)
const tone = computed(() => ratio.value > 1 ? 'over' : ratio.value > 0.9 ? 'warn' : '')
</script>
<template>
  <div class="char-counter" :class="tone" aria-live="polite">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--border)" stroke-width="3" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="62.8" :stroke-dashoffset="62.8 * (1 - Math.min(ratio, 1))" transform="rotate(-90 12 12)" />
    </svg>
    <span>{{ count.toLocaleString() }} / {{ max.toLocaleString() }}</span>
    <span v-if="tone === 'over'" class="tiny">{{ (count - max).toLocaleString() }}자 초과</span>
  </div>
</template>

<!-- 폼에서 -->
<RichEditor ref="ed" v-model="form.body" />
<CharCounter v-if="ed?.editor" :editor="ed.editor" :max="1000" />
<button :disabled="(ed?.characters() ?? 0) > 1000 || !form.body">등록</button>

// 서버 (07번 핸들러): if (text.length > 1000) throw createError({ statusCode: 400, statusMessage: '본문은 1,000자 이하로 입력하세요' })
// 이미지·멘션은 한 글자로 센다 (textSize 모드는 텍스트만). 한글은 자소가 아니라 글자 단위로 센다 (String.length 와 같음, 이모지는 2)
` },
        },
        {
          id: 'l10', short: `확장 묶음과 성능`,
          title: `쓰는 확장만 한 파일에 모으고, 코드블록 하이라이트·표·체크리스트·마크다운 단축키를 붙인다`,
          why: `확장 목록은 에디터·서버 렌더(07번) 가 같이 써야 하므로 shared 에 한 벌로 둡니다. 코드블록은 lowlight 로 하이라이트, 표와 체크리스트는 필요할 때만. 큰 문서는 에디터 자체보다 이미지와 하이라이트가 느리니 지연 로딩합니다.`,
          single: { label: `✓ shared/editorExtensions.ts + 성능 메모`, code: String.raw`
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'                    // "-- → —", 따옴표 등 자동 치환
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import ts from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { ImageUpload } from '~/components/editor/extensions/imageUpload'
import { MentionExt } from '~/components/editor/extensions/mention'

const lowlight = createLowlight(); lowlight.register({ ts, typescript: ts, html: xml, vue: xml })

export function editorExtensions(opts: { placeholder?: string; upload?: Uploader; mentions?: boolean; tables?: boolean } = {}) {
  return [
    StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3] } }),   // 마크다운 단축키는 StarterKit 에 포함: "# ", "- ", "1. ", "> ", "\`" 가 입력 규칙으로 동작
    Placeholder.configure({ placeholder: opts.placeholder ?? '' }),
    Typography,
    Link.configure({ /* 04번 */ }),
    CharacterCount,
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'ts' }),
    TaskList, TaskItem.configure({ nested: true }),
    ...(opts.tables ? [Table.configure({ resizable: true }), TableRow, TableHeader, TableCell] : []),
    ...(opts.upload ? [ImageUpload.configure({ upload: opts.upload })] : []),
    ...(opts.mentions ? [MentionExt] : [])
  ]
}
// 에디터: useEditor({ extensions: editorExtensions({ placeholder, upload: uploadImage, mentions: true }) })
// 서버 JSON 렌더: generateHTML(json, editorExtensions())  — 같은 함수. 서버에서는 ImageUpload 의 플러그인이 쓰이지 않지만 스키마는 같아야 한다

/* 성능
   - 에디터 번들: @tiptap 코어 + StarterKit ≈ 100KB gz. 글쓰기 페이지에서만 로드되도록 RichEditor 는 defineAsyncComponent 또는 .client.vue + <ClientOnly>
   - lowlight 언어는 쓰는 것만 등록 (전부 등록하면 +500KB)
   - 이미지 많은 문서: 03번 리사이즈(1600px) + 서버가 width/height 를 넣어 CLS 방지 + 읽기 모드 lazy
   - 수천 줄 문서에서 타이핑이 느리면: 툴바의 isActive 계산을 줄이거나 (selectionUpdate 에서 한 번 계산해 ref 에), 협업 커서 같은 데코레이션 확인
   - onUpdate 마다 getHTML() 은 비싸다. 06번 자동 저장처럼 디바운스된 곳에서만 직렬화하고, v-model 은 getJSON 으로 바꾸는 것도 방법
   - 협업 편집이 필요해지면 @tiptap/extension-collaboration + Y.js (Hocuspocus 서버). 7회차 10번 충돌 처리 대신 CRDT */
` },
        },
      ],
    },
    {
      id: 'practice-20', no: 20, name: `E2E 시나리오 테스트 (Playwright)`,
      lead: `Playwright 로 "진짜 브라우저에서 진짜 흐름" 을 검증하는 방법입니다. 설정, 로그인 픽스처, 페이지 객체, 네트워크 모킹, 폼 시나리오, 파일 업로드·다운로드, 시각 회귀, 접근성 검사, CI, 플래키 대응.`,
      lessons: [
        {
          id: 'l1', short: `설정`,
          title: `webServer 로 빌드된 앱을 띄우고, 데스크톱·모바일 두 프로젝트로 돌린다`,
          why: `E2E 는 dev 서버가 아니라 빌드 결과(nuxi preview) 로 돌려야 운영과 같습니다. baseURL 을 두면 테스트에서 상대 경로만 씁니다. 실패 시 trace 를 남겨 CI 에서도 무슨 일이 있었는지 볼 수 있게 합니다.`,
          single: { label: `✓ playwright.config.ts`, code: String.raw`
import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI
const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  fullyParallel: true,
  forbidOnly: CI,                                     // test.only 가 남아 있으면 CI 실패
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'e2e-results.xml' }]] : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL: 'http://localhost:' + PORT,
    trace: 'on-first-retry',                          // 재시도 때만 trace (용량). 로컬 디버깅은 --trace on
    screenshot: 'only-on-failure',
    video: CI ? 'retain-on-failure' : 'off',
    locale: 'ko-KR', timezoneId: 'Asia/Seoul',
    testIdAttribute: 'data-testid'
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },                                                          // 02번 로그인
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, dependencies: ['setup'], testIgnore: /admin/ },          // 관리자는 데스크톱만
    ...(CI ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] }] : [])
  ],
  webServer: {
    command: CI ? 'node .output/server/index.mjs' : 'npm run build && node .output/server/index.mjs',       // CI 는 빌드 단계를 따로 (09번)
    port: PORT, reuseExistingServer: !CI, timeout: 120_000,
    env: { PORT: String(PORT), NUXT_PUBLIC_API_BASE: 'http://localhost:' + PORT, DATABASE_URL: process.env.E2E_DATABASE_URL ?? 'file:./e2e.db', NUXT_TOSS_SECRET_KEY: 'test_sk_dummy' }
  }
})

// package.json
//   "e2e": "playwright test", "e2e:ui": "playwright test --ui", "e2e:headed": "playwright test --headed --project=chromium", "e2e:report": "playwright show-report"
// 설치: npm i -D @playwright/test && npx playwright install --with-deps chromium
// 폴더: e2e/ { global.setup.ts, fixtures.ts, pages/, specs/*.spec.ts, data/ }
` },
        },
        {
          id: 'l2', short: `로그인 픽스처`,
          title: `로그인은 한 번만 해서 storageState 로 저장하고, 테스트는 로그인된 상태로 시작한다`,
          why: `테스트마다 로그인 화면을 거치면 느리고 로그인 자체가 플래키 원인이 됩니다. setup 프로젝트가 API 로 로그인해 쿠키를 파일로 저장하고, 각 테스트는 그 상태로 시작합니다. 역할별(일반·관리자) 로 파일을 나누고, 비로그인 테스트는 state 를 비웁니다.`,
          single: { label: `✓ e2e/global.setup.ts + e2e/fixtures.ts`, code: String.raw`
// e2e/global.setup.ts — 1회차의 로그인 API 를 직접 호출 (UI 로그인 테스트는 따로 한 개만)
import { test as setup, expect } from '@playwright/test'

const USERS = { user: { email: 'e2e-user@example.com', password: 'e2e-pass-1234!', file: 'e2e/.auth/user.json' }, admin: { email: 'e2e-admin@example.com', password: 'e2e-pass-1234!', file: 'e2e/.auth/admin.json' } }

for (const [role, u] of Object.entries(USERS)) {
  setup('login as ' + role, async ({ request }) => {
    await request.post('/api/e2e/reset', { data: { seed: 'base' } })                 // 테스트 DB 초기화 + 시드 (E2E 환경에서만 열리는 엔드포인트, 10번)
    const res = await request.post('/api/auth/login', { data: { email: u.email, password: u.password } })
    expect(res.ok()).toBeTruthy()
    await request.storageState({ path: u.file })                                      // 쿠키(refresh 토큰) 저장. access 토큰이 메모리 전용이면 앱이 첫 로드에서 재발급한다 (1회차 07번)
  })
}

// e2e/fixtures.ts — 역할별 page 와 공용 헬퍼
import { test as base, type Page } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { CheckoutPage } from './pages/CheckoutPage'

type Fixtures = { adminPage: Page; guestPage: Page; loginPage: LoginPage; checkout: CheckoutPage; api: ReturnType<typeof apiHelpers> }

export const test = base.extend<Fixtures>({
  storageState: 'e2e/.auth/user.json',                                               // 기본: 일반 사용자 로그인 상태
  adminPage: async ({ browser }, use) => { const ctx = await browser.newContext({ storageState: 'e2e/.auth/admin.json' }); await use(await ctx.newPage()); await ctx.close() },
  guestPage: async ({ browser }, use) => { const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } }); await use(await ctx.newPage()); await ctx.close() },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
  api: async ({ request }, use) => use(apiHelpers(request))
})
export { expect } from '@playwright/test'

function apiHelpers(request: APIRequestContext) {
  return {
    createProduct: async (data: Partial<Product>) => (await request.post('/api/e2e/products', { data })).json(),       // 테스트 데이터는 UI 가 아니라 API 로 만든다 (빠르고 안정적)
    reset: () => request.post('/api/e2e/reset', { data: { seed: 'base' } })
  }
}

// .gitignore: e2e/.auth/
// 사용: import { test, expect } from '../fixtures'  →  test('주문 내역이 보인다', async ({ page }) => { await page.goto('/orders'); ... })
` },
        },
        {
          id: 'l3', short: `페이지 객체`,
          title: `화면 조작은 Page Object 에, 테스트는 시나리오만 읽히게`,
          why: `셀렉터가 테스트 파일마다 흩어지면 버튼 문구 하나 바뀔 때 테스트 30개를 고칩니다. 페이지별 클래스가 locator 와 동작을 갖고, 테스트는 login('a','b') 처럼 읽힙니다. locator 는 role·label·testid 순으로 고르고 CSS 클래스는 피합니다.`,
          single: { label: `✓ e2e/pages/LoginPage.ts + CheckoutPage.ts`, code: String.raw`
import { type Page, type Locator, expect } from '@playwright/test'

export class LoginPage {
  readonly email: Locator; readonly password: Locator; readonly submit: Locator; readonly error: Locator
  constructor(readonly page: Page) {
    this.email = page.getByLabel('이메일')                                 // <label for> 또는 aria-label 로 연결돼 있어야 한다 (접근성 = 테스트 용이성)
    this.password = page.getByLabel('비밀번호', { exact: true })
    this.submit = page.getByRole('button', { name: '로그인' })
    this.error = page.getByRole('alert')
  }
  async goto(redirect?: string) { await this.page.goto('/login' + (redirect ? '?redirect=' + encodeURIComponent(redirect) : '')) }
  async login(email: string, password: string) { await this.email.fill(email); await this.password.fill(password); await this.submit.click() }
  async expectError(text: string | RegExp) { await expect(this.error).toContainText(text) }
}

export class CheckoutPage {
  constructor(readonly page: Page) {}
  readonly total = () => this.page.getByTestId('order-total')               // 숫자·동적 텍스트는 testid 가 안정적
  readonly payButton = () => this.page.getByRole('button', { name: /원 결제하기$/ })
  async goto(orderId: string) { await this.page.goto('/checkout?orderId=' + orderId); await expect(this.payButton()).toBeEnabled() }   // 위젯 준비까지
  async applyCoupon(code: string) {
    await this.page.getByPlaceholder('쿠폰 코드').fill(code)
    await this.page.getByRole('button', { name: '적용' }).click()
    await expect(this.page.getByText(/쿠폰이 적용되었습니다/)).toBeVisible()
  }
  async totalAmount() { return Number((await this.total().innerText()).replace(/[^\d]/g, '')) }
}

// e2e/specs/login.spec.ts — 시나리오만 보인다
import { test, expect } from '../fixtures'
test.use({ storageState: { cookies: [], origins: [] } })                   // 이 파일은 비로그인으로

test('잘못된 비밀번호면 오류를 보여 준다', async ({ loginPage }) => {
  await loginPage.goto()
  await loginPage.login('e2e-user@example.com', 'wrong')
  await loginPage.expectError('이메일 또는 비밀번호가 올바르지 않습니다')
})
test('로그인 후 원래 가려던 페이지로 돌아간다', async ({ page, loginPage }) => {
  await page.goto('/orders')
  await expect(page).toHaveURL(/\/login\?redirect=/)                       // 1회차 08번 가드
  await loginPage.login('e2e-user@example.com', 'e2e-pass-1234!')
  await expect(page).toHaveURL('/orders')
  await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible()
})
/* locator 우선순위: getByRole > getByLabel > getByPlaceholder > getByText > getByTestId > CSS. 컴포넌트에 data-testid 를 둘 때는 의미 있는 이름 (order-total, product-card) */
` },
        },
        {
          id: 'l4', short: `네트워크 모킹`,
          title: `외부 API 와 실패 케이스는 page.route 로 가로채고, 우리 API 는 가능하면 진짜로`,
          why: `결제 PG·지도·외부 서비스는 테스트에서 호출하면 안 되고, 500 오류나 느린 응답은 실제로 만들기 어렵습니다. route 로 응답을 꾸며 "서버가 죽었을 때 UI" 를 검증합니다. 우리 백엔드까지 전부 모킹하면 E2E 의 의미가 없으니 외부·실패에만 씁니다.`,
          single: { label: `✓ e2e/specs/error-handling.spec.ts`, code: String.raw`
import { test, expect } from '../fixtures'

test('상품 목록 API 가 500 이면 재시도 버튼이 보이고, 재시도하면 복구된다', async ({ page }) => {
  let calls = 0
  await page.route('**/api/products?*', async (route) => {
    calls++
    if (calls === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusMessage: 'boom' }) })
    return route.continue()                                               // 두 번째부터는 진짜 서버로
  })
  await page.goto('/products')
  await expect(page.getByText('목록을 불러오지 못했습니다')).toBeVisible()
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  expect(calls).toBe(2)
})

test('느린 API 는 스켈레톤을 보여 주고 결과로 바뀐다', async ({ page }) => {
  await page.route('**/api/products?*', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue() })
  await page.goto('/products')
  await expect(page.getByTestId('product-skeleton')).toBeVisible()
  await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 5000 })
  await expect(page.getByTestId('product-skeleton')).toHaveCount(0)
})

test('토큰 만료(401) 가 나면 재발급 후 원래 요청이 성공한다', async ({ page }) => {     // 1회차 04번 인터셉터 검증
  let first = true
  await page.route('**/api/orders', (route) => first ? (first = false, route.fulfill({ status: 401, body: '{}' })) : route.continue())
  await page.goto('/orders')
  await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible()
  await expect(page.getByRole('row')).not.toHaveCount(0)
  await expect(page).not.toHaveURL(/login/)                                 // 로그아웃되지 않았다
})

test('결제 위젯(외부 SDK) 은 가짜로 바꾼다', async ({ page, checkout, api }) => {
  await page.route('https://js.tosspayments.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: FAKE_TOSS_SDK }))   // e2e/data/fakeToss.ts: requestPayment 가 successUrl 로 이동하는 스텁
  await page.route('https://api.tosspayments.com/**', (route) => route.fulfill({ json: { approvedAt: new Date().toISOString(), method: '카드', totalAmount: 15000 } }))   // 서버 측 호출은 route 로 못 잡는다 → 서버는 E2E 모드에서 PG 스텁을 쓴다 (10번)
  const order = await api.createOrder({ items: [{ productId: 'p1', qty: 1 }] })
  await checkout.goto(order.id)
  await checkout.payButton().click()
  await expect(page).toHaveURL(/\/pay\/success/)
  await expect(page.getByRole('heading', { name: '결제가 완료되었습니다' })).toBeVisible()
})
// 요청을 검증하려면: const req = page.waitForRequest('**/api/orders'); await button.click(); expect((await req).postDataJSON()).toMatchObject({ ... })
// HAR 녹화로 외부 응답 재생: page.routeFromHAR('e2e/data/kakao.har', { url: '**/dapi.kakao.com/**', update: false })
` },
        },
        {
          id: 'l5', short: `폼 시나리오`,
          title: `회원가입 폼: 유효성 메시지, 서버 오류, 성공 경로를 한 파일에서`,
          why: `폼은 E2E 가 가장 가치 있는 곳입니다. 입력 → 블러 → 메시지, 제출 → 서버 400 → 필드 오류 표시(3회차), 성공 → 이동까지. test.step 으로 단계를 나누면 리포트에서 어디서 멈췄는지 바로 보입니다.`,
          single: { label: `✓ e2e/specs/signup.spec.ts`, code: String.raw`
import { test, expect } from '../fixtures'
test.use({ storageState: { cookies: [], origins: [] } })

const unique = () => 'e2e+' + Date.now() + '@example.com'

test('회원가입 유효성과 성공 흐름', async ({ page }) => {
  await page.goto('/signup')
  const email = page.getByLabel('이메일'), pw = page.getByLabel('비밀번호', { exact: true }), pw2 = page.getByLabel('비밀번호 확인'), submit = page.getByRole('button', { name: '가입하기' })

  await test.step('빈 제출은 필드별 오류를 보여 준다', async () => {
    await submit.click()
    await expect(page.getByText('이메일을 입력하세요')).toBeVisible()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toBeFocused()                                     // 첫 오류 필드로 포커스 (3회차 02번)
  })

  await test.step('형식 오류는 블러 시점에 나온다', async () => {
    await email.fill('not-an-email'); await email.blur()
    await expect(page.getByText('올바른 이메일 형식이 아닙니다')).toBeVisible()
    await email.fill(unique()); await expect(page.getByText('올바른 이메일 형식이 아닙니다')).toBeHidden()
  })

  await test.step('비밀번호 확인 불일치', async () => {
    await pw.fill('Strong-pass-1'); await pw2.fill('Strong-pass-2'); await pw2.blur()
    await expect(page.getByText('비밀번호가 일치하지 않습니다')).toBeVisible()
    await pw2.fill('Strong-pass-1')
  })

  await test.step('서버가 중복 이메일(409) 을 돌려주면 필드 오류로 보인다', async () => {
    await page.route('**/api/auth/signup', (route) => route.fulfill({ status: 409, json: { code: 'DUPLICATE_EMAIL', errors: { email: '이미 가입된 이메일입니다' } } }), { times: 1 })
    await page.getByLabel('이용약관에 동의합니다').check()
    await submit.click()
    await expect(page.getByText('이미 가입된 이메일입니다')).toBeVisible()
    await expect(submit).toBeEnabled()                                     // 로딩이 풀렸다
  })

  await test.step('성공하면 환영 페이지로', async () => {
    await submit.click()                                                   // 이번엔 진짜 서버
    await expect(page).toHaveURL('/welcome')
    await expect(page.getByRole('heading', { name: /환영합니다/ })).toBeVisible()
  })
})

test('작성 중 이탈하면 확인창이 뜬다', async ({ page }) => {                // 3회차 10번
  await page.goto('/signup'); await page.getByLabel('이메일').fill('a@b.c')
  page.once('dialog', (d) => { expect(d.message()).toContain('작성 중인 내용'); d.dismiss() })   // beforeunload 는 dialog 로 온다
  await page.goto('/', { waitUntil: 'commit' }).catch(() => {})
  await expect(page).toHaveURL(/signup/)                                  // 취소했으니 남아 있다
})
// 셀렉트·체크박스·날짜: selectOption('active'), check(), fill('2026-03-01'). 커스텀 드롭다운은 getByRole('combobox').click() → getByRole('option', { name }).click()
` },
        },
        {
          id: 'l6', short: `파일 업로드·다운로드`,
          title: `setInputFiles 로 올리고, waitForEvent('download') 로 받고, 드롭은 DataTransfer 로 흉내 낸다`,
          why: `파일 선택 창은 OS 창이라 클릭할 수 없습니다. input[type=file] 에 직접 파일을 넣거나 filechooser 이벤트를 잡습니다. 다운로드는 이벤트로 받아 파일 내용까지 검사할 수 있습니다. 드롭존(6회차) 은 DataTransfer 를 만들어 drop 이벤트를 쏩니다.`,
          single: { label: `✓ e2e/specs/files.spec.ts`, code: String.raw`
import { test, expect } from '../fixtures'
import { readFileSync } from 'node:fs'

test('프로필 사진 업로드 → 미리보기 → 저장', async ({ page }) => {
  await page.goto('/me/profile')
  // 1) 숨겨진 input 에 직접 (가장 안정적)
  await page.getByTestId('avatar-input').setInputFiles('e2e/data/avatar.png')
  await expect(page.getByTestId('avatar-preview')).toHaveAttribute('src', /^blob:|^data:/)
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('저장했습니다')).toBeVisible()
  await expect(page.getByTestId('avatar-preview')).toHaveAttribute('src', /uploads/)   // 서버 URL 로 바뀜

  // 2) 버튼이 파일 창을 여는 경우
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '사진 변경' }).click()
  await (await chooser).setFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(11 * 1024 * 1024) })   // 메모리에서 만든 파일
  await expect(page.getByRole('alert')).toContainText('10MB 이하')
})

test('드롭존에 끌어다 놓기', async ({ page }) => {
  await page.goto('/files')
  const dataTransfer = await page.evaluateHandle(async () => {
    const dt = new DataTransfer()
    dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], 'drop.png', { type: 'image/png' }))
    return dt
  })
  const zone = page.getByTestId('dropzone')
  await zone.dispatchEvent('dragenter', { dataTransfer }); await expect(zone).toHaveClass(/dragover/)
  await zone.dispatchEvent('drop', { dataTransfer })
  await expect(page.getByText('drop.png')).toBeVisible()
})

test('CSV 내보내기는 BOM 과 헤더가 있다', async ({ page }) => {               // 4회차 10번 / 13회차 10번
  await page.goto('/admin/orders')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV' }).click()
  const d = await download
  expect(d.suggestedFilename()).toMatch(/orders.*\.csv$/)
  const content = readFileSync(await d.path(), 'utf8')
  expect(content.charCodeAt(0)).toBe(0xfeff)
  expect(content.split(/\r?\n/)[0]).toBe('주문번호,주문일,상태,금액')
})
// 큰 업로드 진행률(6회차 04번): page.route 로 응답을 지연시키고 progressbar 의 aria-valuenow 가 증가하는지 expect.poll 로
` },
        },
        {
          id: 'l7', short: `시각 회귀`,
          title: `핵심 화면만 스크린샷 비교, 동적 영역은 가리고, 애니메이션은 끈다`,
          why: `CSS 리팩터링이 어디를 깨뜨렸는지는 스크린샷 비교가 가장 빨리 잡습니다. 모든 페이지를 찍으면 유지가 안 되니 레이아웃·디자인 시스템 컴포넌트·주요 페이지 5~10장만. 날짜·아바타·차트 같은 동적 영역은 mask 로 가립니다. 스냅샷은 CI 와 같은 OS 에서 만듭니다.`,
          single: { label: `✓ e2e/specs/visual.spec.ts`, code: String.raw`
import { test, expect } from '../fixtures'

test.describe('visual', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', '스냅샷은 chromium 에서만')   // 브라우저마다 렌더링이 달라 스냅샷이 3벌이 된다

  test('상품 상세', async ({ page }) => {
    await page.goto('/products/p1')
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.evaluate(() => document.fonts.ready)                        // 웹폰트 로드 전에 찍으면 다르다
    await expect(page).toHaveScreenshot('product-detail.png', {
      fullPage: true,
      mask: [page.getByTestId('review-date'), page.getByTestId('recommend-carousel')],   // 동적 영역
      maxDiffPixelRatio: 0.01
    })
  })

  test('다크 모드 헤더', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.getByRole('banner')).toHaveScreenshot('header-dark.png')   // 요소 단위
  })

  test('디자인 시스템 컴포넌트', async ({ page }) => {                        // /__playground 같은 내부 페이지에 버튼·입력·배지 모음
    await page.goto('/__playground/components')
    for (const name of ['buttons', 'inputs', 'badges', 'cards']) {
      await expect(page.getByTestId('section-' + name)).toHaveScreenshot(name + '.png')
    }
  })
})

/* 운영
   - 첫 실행 또는 의도한 변경 후: npx playwright test visual --update-snapshots   (변경된 PNG 를 커밋. PR 리뷰에서 그림으로 보인다)
   - 스냅샷 파일명에 OS 가 붙는다 (product-detail-chromium-linux.png). 로컬 mac 과 CI linux 가 다르면 → CI 에서만 생성·비교하거나 Docker(mcr.microsoft.com/playwright) 로 로컬도 linux 로
   - animations: 'disabled' (config) + CSS: @media (prefers-reduced-motion) 를 테스트에서 켜기 → page.emulateMedia({ reducedMotion: 'reduce' })
   - 플래키 원인 1위: 이미지 lazy 로딩 → fullPage 전에 page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)) 후 다시 위로, 또는 mask
   - 실패 리포트에 expected / actual / diff 세 장이 붙는다. diff 가 전체 흐림이면 안티앨리어싱 → threshold 조정, 국소면 진짜 변경 */
` },
        },
        {
          id: 'l8', short: `접근성 검사`,
          title: `axe 로 주요 페이지의 접근성 위반을 자동으로 잡는다`,
          why: `라벨 없는 입력, 대비 부족, 중복 id 같은 건 사람이 매번 못 봅니다. @axe-core/playwright 를 주요 페이지에 돌리면 PR 마다 잡힙니다. 처음에는 위반이 많으니 심각도(critical·serious) 만 실패로 두고, 알려진 예외는 태그로 제외합니다.`,
          single: { label: `✓ e2e/specs/a11y.spec.ts`, code: String.raw`
import { test, expect } from '../fixtures'
import AxeBuilder from '@axe-core/playwright'

const PAGES = [
  { path: '/', name: '홈' }, { path: '/products', name: '상품 목록' }, { path: '/products/p1', name: '상품 상세' },
  { path: '/cart', name: '장바구니' }, { path: '/orders', name: '주문 내역' }, { path: '/settings/notifications', name: '알림 설정' }
]

for (const p of PAGES) {
  test('a11y: ' + p.name, async ({ page }) => {
    await page.goto(p.path)
    await page.getByRole('main').waitFor()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .exclude('[data-a11y-ignore]')                                    // 서드파티 위젯(결제·지도) 처럼 우리가 못 고치는 영역
      .disableRules(['color-contrast'])                                 // 대비는 디자인 토큰 단계에서 따로 검사. 처음엔 제외하고 나중에 켠다
      .analyze()

    const serious = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact ?? ''))
    if (serious.length) {
      // 리포트에 읽기 좋게 첨부
      await test.info().attach('a11y-violations', { contentType: 'application/json', body: JSON.stringify(serious, null, 2) })
      const summary = serious.map((v) => '- [' + v.impact + '] ' + v.id + ': ' + v.help + '\n' + v.nodes.slice(0, 3).map((n) => '    ' + n.target.join(' ')).join('\n')).join('\n')
      expect(serious, '접근성 위반:\n' + summary).toHaveLength(0)
    }
  })
}

test('모달이 열리면 포커스가 갇히고 Esc 로 닫힌다', async ({ page }) => {        // axe 가 못 잡는 동작 규칙은 직접
  await page.goto('/products/p1')
  await page.getByRole('button', { name: '리뷰 쓰기' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('textbox').first()).toBeFocused()        // 첫 입력으로 포커스
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab')
  await expect(page.locator(':focus')).toBeAttached(); expect(await dialog.locator(':focus').count()).toBe(1)   // 포커스가 다이얼로그 밖으로 안 나간다
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: '리뷰 쓰기' })).toBeFocused()   // 열었던 버튼으로 복귀
})
// 자주 나오는 위반: label 없는 input (getByLabel 이 안 되는 것과 같은 문제), 아이콘 버튼의 aria-label 누락, 이미지 alt 누락, 헤딩 레벨 건너뜀, 색만으로 상태 표현
` },
        },
        {
          id: 'l9', short: `CI`,
          title: `GitHub Actions: 브라우저 캐시, 빌드 한 번, 샤딩, 실패 시 리포트·trace 업로드`,
          why: `E2E 는 느려서 CI 설계가 중요합니다. 브라우저 바이너리를 캐시하고, 빌드는 한 번만 하고, 샤드로 병렬 실행합니다. 실패하면 HTML 리포트와 trace 를 artifact 로 올려 로컬에서 열어 볼 수 있게 합니다. PR 에는 결과 요약을 코멘트로.`,
          single: { label: `✓ .github/workflows/e2e.yml`, code: String.raw`
name: e2e
on:
  pull_request:
  push: { branches: [main] }
concurrency: { group: e2e-\${{ github.ref }}, cancel-in-progress: true }       # 같은 PR 에 새 푸시가 오면 이전 실행 취소

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env: { NUXT_PUBLIC_SITE_URL: http://localhost:3100 }
      - uses: actions/upload-artifact@v4
        with: { name: build, path: .output, retention-days: 1 }

  e2e:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix: { shard: [1, 2, 3] }
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: e2e, POSTGRES_DB: e2e }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with: { name: build, path: .output }
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: pw-cache
        with: { path: ~/.cache/ms-playwright, key: pw-\${{ runner.os }}-\${{ hashFiles('package-lock.json') }} }
      - run: npx playwright install --with-deps chromium
        if: steps.pw-cache.outputs.cache-hit != 'true'
      - run: npx playwright install-deps chromium
        if: steps.pw-cache.outputs.cache-hit == 'true'
      - run: npx prisma migrate deploy
        env: { DATABASE_URL: postgresql://postgres:e2e@localhost:5432/e2e }
      - run: npx playwright test --shard=\${{ matrix.shard }}/3
        env:
          CI: true
          E2E_DATABASE_URL: postgresql://postgres:e2e@localhost:5432/e2e
          E2E_MODE: '1'                                                      # 서버가 PG 스텁·reset 엔드포인트를 켜는 플래그 (10번)
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: e2e-report-\${{ matrix.shard }}, path: playwright-report, retention-days: 7 }
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: e2e-traces-\${{ matrix.shard }}, path: test-results, retention-days: 7 }

# 로컬에서 trace 보기: artifact 를 받아 npx playwright show-trace test-results/<test>/trace.zip
# 샤드 리포트 합치기: reporter 에 'blob' 추가 → 별도 job 에서 npx playwright merge-reports --reporter html ./all-blob-reports
# 시각 회귀(07번) 스냅샷은 ubuntu 에서 만든 것을 커밋한다. 로컬은 docker run --rm -v $PWD:/work -w /work mcr.microsoft.com/playwright:v1.50.0-noble npx playwright test visual
` },
        },
        {
          id: 'l10', short: `플래키 대응`,
          title: `기다림은 locator 와 expect 에 맡기고, 데이터는 테스트마다 독립시키고, 실패는 trace 로 본다`,
          why: `"가끔 실패" 는 신뢰를 잃게 합니다. 원인은 대부분 셋입니다. 고정 sleep 으로 기다린 것, 테스트끼리 데이터를 공유한 것, 네트워크 타이밍에 기댄 것. 각각의 처방과, 재시도는 임시방편이라는 것, trace 읽는 법을 정리합니다.`,
          single: { label: `✓ 규칙과 서버 측 E2E 모드`, code: String.raw`
// ✗ 금지                                         // ✓ 대신
await page.waitForTimeout(2000)                   await expect(locator).toBeVisible()           // locator/expect 는 자동으로 기다린다 (expect.timeout 까지 폴링)
await page.click('.btn')                          await page.getByRole('button', { name: '저장' }).click()   // CSS 클래스는 스타일 리팩터링에 깨진다
expect(await locator.textContent()).toBe('3')     await expect(locator).toHaveText('3')          // 왼쪽은 한 번만 읽고 끝. 오른쪽은 재시도
await page.goto('/x'); await page.waitForLoadState('networkidle')   await page.goto('/x'); await expect(page.getByRole('main')).toBeVisible()   // networkidle 은 SSE/폴링이 있으면 영원히 안 온다
if (await locator.isVisible()) { ... }            // 조건 분기 자체가 플래키. 상태를 확정시키는 셋업으로 바꾼다
test.describe.configure({ mode: 'serial' })       // 테스트 간 순서 의존은 한 테스트의 step 으로 합친다 (05번)

// 숫자·비동기 상태: expect.poll
await expect.poll(async () => (await api.getOrder(id)).status, { timeout: 10_000, intervals: [500, 1000] }).toBe('PAID')

// 데이터 독립: 테스트가 자기 데이터를 만들고 (02번 api 픽스처), 고유값은 시간/랜덤으로. 전역 reset 은 setup 에서 한 번
test('…', async ({ api, page }) => { const p = await api.createProduct({ name: 'E2E ' + Date.now() }); await page.goto('/products/' + p.id) })

// 서버: E2E 모드에서만 열리는 것들 (server/api/e2e/*.ts 를 E2E_MODE 가 아니면 404)
export default defineEventHandler(async (event) => {
  if (process.env.E2E_MODE !== '1') throw createError({ statusCode: 404 })
  const { seed } = await readBody(event)
  await db.$executeRawUnsafe('TRUNCATE "Order", "Product", "User" RESTART IDENTITY CASCADE')
  await seedDatabase(seed)                                                 // prisma/seed-e2e.ts: 사용자 2명, 상품 10개, 쿠폰
  return { ok: true }
})
// PG·메일·푸시는 E2E_MODE 에서 스텁 구현으로 바꾼다: export const pg = process.env.E2E_MODE ? fakePg : realPg  (11회차 10번의 pg.ts)
// 메일은 보낸 내용을 /api/e2e/mailbox 에서 읽을 수 있게 메모리에 쌓는다 → "가입 메일의 링크를 눌러 인증" 시나리오

/* 실패했을 때
   1. npx playwright show-report → 실패 테스트 → Trace 탭: 각 액션 전후 스크린샷, 네트워크, 콘솔, DOM 스냅샷을 시간순으로
   2. 로컬 재현: npx playwright test signup --headed --debug  (Inspector 로 한 단계씩)  또는  --ui
   3. 10번 돌려 보기: npx playwright test signup --repeat-each 10   → 1번이라도 실패하면 플래키
   4. retries 는 "알고 있는 외부 요인(브라우저 크래시)" 용. 재시도로 통과한 테스트는 리포트에 flaky 로 표시된다 → 주 1회 flaky 목록을 비운다

   속도: 로그인은 storageState (02), 데이터는 API (02), 외부는 route (04), 샤딩 (09). 3분 넘는 스위트는 핵심 흐름(스모크) 과 전체로 나눠 PR 에는 스모크만 */
` },
        },
      ],
    },
    // @@APPEND@@ 새 회차는 이 줄 위에 추가
  ],
  // 다음에 만들 묶음 예고. 없으면 null.
  upcoming: {
    name: `201~300번 후보 주제`,
    items: [
      `멀티 테넌트와 워크스페이스 전환`,
      `온보딩 투어와 빈 상태 설계`,
      `캘린더와 일정 UI`,
      `칸반 보드와 드래그 앤 드롭`,
      `PDF 생성과 인쇄용 문서`,
      `채팅 UI 심화 (읽음, 타이핑, 첨부)`,
      `설정 페이지 패턴 (계정, 보안, 결제 수단)`,
      `피처 플래그와 A/B 테스트`,
      `이메일 템플릿과 발송 큐`,
      `성능 예산과 CI 측정`,
    ],
  },
};
