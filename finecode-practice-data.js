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
    // @@APPEND@@ 새 회차는 이 줄 위에 추가
  ],
  // 다음에 만들 묶음 예고. 없으면 null.
  upcoming: {
    name: `101~200번 후보 주제`,
    items: [
      `결제 연동 (PG 위젯, 웹훅 검증)`,
      `검색과 자동완성 (하이라이트, 최근 검색어)`,
      `대시보드와 차트 (ECharts, 반응형)`,
      `관리자 CRUD 화면 생성 패턴`,
      `알림 설정과 푸시 (Web Push)`,
      `PWA 와 오프라인 캐시`,
      `지도 연동 (카카오/네이버 지도)`,
      `소셜 공유, OG 이미지 생성`,
      `에디터 (TipTap) 와 이미지 붙여넣기`,
      `E2E 시나리오 테스트 (Playwright)`,
    ],
  },
};
