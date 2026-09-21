<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit2, Trash2, X, Tags, Layers, Search, Check, Loader2, FolderOpen } from 'lucide-vue-next'
import { useCategoryStore } from '../../stores/category'
import { useUIStore } from '../../stores/ui'

const categoryStore = useCategoryStore()
const ui = useUIStore()

const showModal = ref(false)
const editingId = ref(null)
const isSaving = ref(false)
const searchQuery = ref('')

const form = ref({
  name: '',
  subInput: '',       // tag-chip input
  subcategories: []   // array of strings
})

onMounted(() => categoryStore.fetchCategories())

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return categoryStore.categories
  return categoryStore.categories.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.subcategories.some(s => s.toLowerCase().includes(q))
  )
})

// ── Modal ──────────────────────────────────────────────────────────────────
const openAddModal = () => {
  editingId.value = null
  form.value = { name: '', subInput: '', subcategories: [] }
  showModal.value = true
}

const openEditModal = (cat) => {
  editingId.value = cat._id
  form.value = {
    name: cat.name,
    subInput: '',
    subcategories: Array.isArray(cat.subcategories) ? [...cat.subcategories] : []
  }
  showModal.value = true
}

// ── Tag chip management ────────────────────────────────────────────────────
const addSubTag = () => {
  const val = form.value.subInput.trim()
  if (val && !form.value.subcategories.includes(val)) {
    form.value.subcategories.push(val)
  }
  form.value.subInput = ''
}

const removeSubTag = (idx) => {
  form.value.subcategories.splice(idx, 1)
}

const onSubKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addSubTag()
  }
  if (e.key === 'Backspace' && !form.value.subInput && form.value.subcategories.length) {
    form.value.subcategories.pop()
  }
}

// ── Save ───────────────────────────────────────────────────────────────────
const saveCategory = async () => {
  if (!form.value.name.trim()) {
    ui.toast('Category name is required', 'error')
    return
  }
  // commit any pending subInput on save
  if (form.value.subInput.trim()) addSubTag()

  isSaving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      subcategories: form.value.subcategories
    }
    if (editingId.value) {
      await categoryStore.updateCategory(editingId.value, payload)
      ui.toast('Category updated! ✓', 'success')
    } else {
      await categoryStore.createCategory(payload)
      ui.toast('Category created! ✓', 'success')
    }
    showModal.value = false
  } catch (err) {
    ui.toast(err.response?.data?.message || err.message || 'Failed to save', 'error')
  } finally {
    isSaving.value = false
  }
}

const deleteCategory = async (id) => {
  if (await ui.confirm('Delete Category', 'This will remove the category. Products using it may lose filtering.', 'danger')) {
    try {
      await categoryStore.deleteCategory(id)
      ui.toast('Category deleted', 'success')
    } catch (err) {
      ui.toast(err.response?.data?.message || 'Failed to delete', 'error')
    }
  }
}

// ── Color palette per category index ─────────────────────────────────────
const PALETTES = [
  { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-500', tag: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-500', tag: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-sky-50',    border: 'border-sky-200',    icon: 'text-sky-500',    tag: 'bg-sky-100 text-sky-700 border-sky-200',          dot: 'bg-sky-500'    },
  { bg: 'bg-emerald-50',border: 'border-emerald-200',icon: 'text-emerald-500',tag: 'bg-emerald-100 text-emerald-700 border-emerald-200',dot: 'bg-emerald-500'},
  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-500',  tag: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-500'  },
  { bg: 'bg-rose-50',   border: 'border-rose-200',   icon: 'text-rose-500',   tag: 'bg-rose-100 text-rose-700 border-rose-200',        dot: 'bg-rose-500'   },
]
const palette = (idx) => PALETTES[idx % PALETTES.length]
</script>

<template>
  <div class="space-y-8">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Layers class="w-8 h-8 text-indigo-600" />
          <span>Category Manager</span>
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Organise your catalog with categories and subcategories.
          <span class="font-semibold text-indigo-600">{{ categoryStore.categories.length }}</span> categories total.
        </p>
      </div>
      <button
        @click="openAddModal"
        class="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex-shrink-0"
      >
        <Plus class="w-5 h-5" />
        <span>New Category</span>
      </button>
    </div>

    <!-- ── Search bar ──────────────────────────────────────────────────────── -->
    <div class="relative max-w-sm">
      <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search categories or subcategories..."
        class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-sm"
      />
    </div>

    <!-- ── Loading skeleton ────────────────────────────────────────────────── -->
    <template v-if="categoryStore.loading">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="i in 3" :key="i" class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="skeleton w-12 h-12 rounded-2xl"></div>
            <div class="space-y-2 flex-1">
              <div class="skeleton h-4 w-28"></div>
              <div class="skeleton h-3 w-20"></div>
            </div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <div class="skeleton h-6 w-16 rounded-full"></div>
            <div class="skeleton h-6 w-20 rounded-full"></div>
            <div class="skeleton h-6 w-14 rounded-full"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Empty state ─────────────────────────────────────────────────────── -->
    <div v-else-if="filteredCategories.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
        <FolderOpen class="w-12 h-12 text-indigo-300" />
      </div>
      <h3 class="text-lg font-bold text-slate-700">
        {{ searchQuery ? 'No categories match your search' : 'No categories yet' }}
      </h3>
      <p class="text-sm text-slate-400 mt-1 max-w-xs">
        {{ searchQuery ? 'Try a different keyword.' : 'Create your first category to organise your product catalog.' }}
      </p>
      <button v-if="!searchQuery" @click="openAddModal"
        class="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/25 transition">
        <Plus class="w-5 h-5" /> Create First Category
      </button>
    </div>

    <!-- ── Category Cards Grid ─────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="(cat, idx) in filteredCategories"
        :key="cat._id"
        class="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden flex flex-col"
      >
        <!-- Card top color strip -->
        <div class="h-1.5 w-full" :class="palette(idx).dot.replace('bg-', 'bg-')">
          <div class="h-full w-full" :class="palette(idx).dot"></div>
        </div>

        <div class="p-5 flex-1 flex flex-col">
          <!-- Category header -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                :class="[palette(idx).bg, palette(idx).border]">
                <Tags class="w-5 h-5" :class="palette(idx).icon" />
              </div>
              <div>
                <h3 class="font-extrabold text-slate-900 text-base leading-tight">{{ cat.name }}</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  {{ cat.subcategories.length }} subcategor{{ cat.subcategories.length === 1 ? 'y' : 'ies' }}
                </p>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                @click="openEditModal(cat)"
                class="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition"
                title="Edit"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
              <button
                @click="deleteCategory(cat._id)"
                class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition"
                title="Delete"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Subcategory chips -->
          <div class="flex-1">
            <div v-if="cat.subcategories.length > 0" class="flex flex-wrap gap-1.5">
              <span
                v-for="sub in cat.subcategories"
                :key="sub"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                :class="[palette(idx).tag, palette(idx).border]"
              >
                {{ sub }}
              </span>
            </div>
            <p v-else class="text-xs text-slate-400 italic">No subcategories yet — click Edit to add some.</p>
          </div>
        </div>

        <!-- Card footer -->
        <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span class="text-[11px] text-slate-400">ID: {{ cat._id.slice(-6).toUpperCase() }}</span>
          <button
            @click="openEditModal(cat)"
            class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
          >
            Edit <span class="text-slate-300">→</span>
          </button>
        </div>
      </div>
    </div>


    <!-- ══ ADD / EDIT MODAL ══════════════════════════════════════════════════ -->
    <Transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        @click.self="showModal = false"
      >
        <Transition name="pop">
          <div
            v-if="showModal"
            class="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 class="text-xl font-bold text-slate-900">
                  {{ editingId ? 'Edit Category' : 'New Category' }}
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ editingId ? 'Update category name and subcategories.' : 'Add a new product category to your store.' }}
                </p>
              </div>
              <button
                @click="showModal = false"
                class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body -->
            <form @submit.prevent="saveCategory" class="p-6 space-y-5">

              <!-- Category Name -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category Name *
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="e.g. Men, Women, Kids, Electronics"
                  class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition font-medium"
                />
              </div>

              <!-- Subcategories tag-chip editor -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subcategories
                </label>
                <p class="text-[11px] text-slate-400 mb-2">Type a subcategory and press <kbd class="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono text-[10px]">Enter</kbd> or <kbd class="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono text-[10px]">,</kbd> to add. Press <kbd class="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono text-[10px]">Backspace</kbd> to remove last.</p>

                <!-- Tag display + input -->
                <div
                  class="min-h-[56px] w-full rounded-2xl border border-slate-200 px-3 py-2.5 flex flex-wrap gap-2 items-center focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition cursor-text"
                  @click="$refs.subTagInput.focus()"
                >
                  <span
                    v-for="(sub, i) in form.subcategories"
                    :key="i"
                    class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-semibold"
                  >
                    {{ sub }}
                    <button type="button" @click.stop="removeSubTag(i)"
                      class="w-3.5 h-3.5 rounded-full bg-indigo-200 hover:bg-indigo-400 hover:text-white text-indigo-600 flex items-center justify-center transition text-[10px] leading-none">
                      ×
                    </button>
                  </span>
                  <input
                    ref="subTagInput"
                    v-model="form.subInput"
                    type="text"
                    placeholder="Type and press Enter..."
                    @keydown="onSubKeydown"
                    class="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder:text-slate-400"
                  />
                </div>

                <!-- Quick add buttons for common subcategories -->
                <div v-if="!editingId" class="mt-3 flex flex-wrap gap-1.5">
                  <span class="text-[10px] text-slate-400 font-bold uppercase self-center">Quick add:</span>
                  <button
                    v-for="preset in ['T-Shirts','Shirts','Pants','Shorts','Dresses','Jackets','Shoes','Bags','Accessories','Hoodies','Jeans','Skirts']"
                    :key="preset"
                    type="button"
                    @click="() => { if(!form.subcategories.includes(preset)) form.subcategories.push(preset) }"
                    :class="form.subcategories.includes(preset)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'"
                    class="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition flex items-center gap-1"
                  >
                    <Check v-if="form.subcategories.includes(preset)" class="w-2.5 h-2.5" />
                    {{ preset }}
                  </button>
                </div>
              </div>

              <!-- Footer buttons -->
              <div class="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  @click="showModal = false"
                  class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isSaving"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <Check v-else class="w-4 h-4" />
                  {{ isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Category') }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite ease-in-out;
  border-radius: 0.75rem;
}

/* Modal backdrop */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Modal pop */
.pop-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { transition: all 0.2s ease; }
.pop-enter-from { opacity: 0; transform: scale(0.92) translateY(8px); }
.pop-leave-to   { opacity: 0; transform: scale(0.95); }
</style>
