<template>
  <div class="min-h-screen bg-background">
    <header class="border-b border-border bg-card">
      <div class="container flex h-16 items-center justify-between">
        <router-link to="/admin/events" class="text-muted-foreground inline-flex items-center">
          <span class="mr-2">←</span>
          <span>Back to Events</span>
        </router-link>
        <button
          @click="handleSave"
          :disabled="isSaving"
          class="py-2 px-3 rounded bg-primary text-primary-foreground"
        >
          <span v-if="isSaving" class="inline-flex items-center"
            ><span
              class="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"
            ></span
            >Saving...</span
          >
          <span v-else>Save Event</span>
        </button>
      </div>
    </header>

    <div class="container py-8 max-w-3xl">
      <h1 class="font-display text-3xl font-bold text-foreground mb-8">
        {{ isNew ? 'Create Event' : 'Edit Event' }}
      </h1>

      <div v-if="isCheckingAdmin" class="min-h-[200px] flex items-center justify-center">
        <div
          class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>

      <div v-else class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-card border-border p-4 rounded">
          <h3 class="text-foreground text-lg font-medium mb-2">Event Details</h3>
          <div class="space-y-4">
            <div>
              <label class="text-foreground block mb-1">Event Name *</label>
              <input
                v-model="formData.name"
                placeholder="Annual Gala Night"
                class="w-full bg-input border-border text-foreground rounded p-2"
              />
            </div>

            <div>
              <label class="text-foreground block mb-1">Description</label>
              <textarea
                v-model="formData.description"
                placeholder="Event description..."
                class="w-full bg-input border-border text-foreground rounded p-2 min-h-[100px]"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-foreground block mb-1">Date *</label>
                <input
                  type="date"
                  v-model="formData.date"
                  class="w-full bg-input border-border text-foreground rounded p-2"
                />
              </div>
              <div>
                <label class="text-foreground block mb-1">Time *</label>
                <input
                  type="time"
                  v-model="formData.time"
                  class="w-full bg-input border-border text-foreground rounded p-2"
                />
              </div>
            </div>

            <div>
              <label class="text-foreground block mb-1">Location *</label>
              <input
                v-model="formData.location"
                placeholder="Event venue address"
                class="w-full bg-input border-border text-foreground rounded p-2"
              />
            </div>

            <div>
              <label class="text-foreground block mb-1">Image de l'événement</label>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="onFileChange"
                class="hidden"
              />
              <div v-if="imagePreview" class="relative">
                <img
                  :src="imagePreview"
                  alt="Event preview"
                  class="w-full h-48 object-cover rounded-lg border border-border"
                />
                <button
                  @click="removeImage"
                  class="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded p-1"
                >
                  ✖
                </button>
              </div>
              <div v-else>
                <button
                  @click="() => fileInputRef?.click()"
                  class="w-full h-32 border-dashed rounded bg-transparent"
                  :disabled="isUploading"
                >
                  <span v-if="isUploading" class="inline-flex items-center"
                    ><span
                      class="animate-spin h-5 w-5 mr-2 border-2 border-current border-t-transparent rounded-full"
                    ></span
                    >Upload en cours...</span
                  >
                  <span v-else>Cliquer pour uploader une image</span>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4">
              <div>
                <label class="text-foreground block">Publish Event</label>
                <p class="text-sm text-muted-foreground">Make this event visible to the public</p>
              </div>
              <input type="checkbox" v-model="formData.is_published" />
            </div>
          </div>
        </div>

        <!-- Ticket Types -->
        <div class="bg-card border-border p-4 rounded">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-foreground text-lg font-medium">Ticket Types</h3>
            <button @click="addTicketType" class="py-1 px-3 rounded border">＋ Add Type</button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(ticket, index) in ticketTypes"
              :key="index"
              class="grid grid-cols-[1fr_100px_100px_40px] gap-3 items-end"
            >
              <div>
                <label class="text-sm text-foreground block mb-1">Name</label>
                <input
                  v-model="ticket.name"
                  placeholder="Standard"
                  class="w-full bg-input border-border text-foreground rounded p-2"
                />
              </div>
              <div>
                <label class="text-sm text-foreground block mb-1">Price (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="ticket.price"
                  class="w-full bg-input border-border text-foreground rounded p-2"
                />
              </div>
              <div>
                <label class="text-sm text-foreground block mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  v-model.number="ticket.capacity"
                  class="w-full bg-input border-border text-foreground rounded p-2"
                />
              </div>
              <button
                @click="removeTicketType(index)"
                :disabled="ticketTypes.length === 1"
                class="py-1 px-2 rounded text-destructive"
              >
                ✖
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string | undefined
const isNew = !id || id === 'new'

const isCheckingAdmin = ref(true)
const isSaving = ref(false)
const isUploading = ref(false)
const imagePreview = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

interface TicketType {
  id?: string
  name: string
  price: number
  capacity: number
}

interface FormDataType {
  name: string
  description?: string
  date?: string
  time?: string
  location?: string
  image_url?: string
  is_published?: boolean
}

const formData = reactive<FormDataType>({
  name: '',
  description: '',
  date: '',
  time: '',
  location: '',
  image_url: '',
  is_published: false,
})

const ticketTypes = ref<TicketType[]>([{ name: 'Standard', price: 0, capacity: 100 }])

const checkAdmin = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    router.push('/admin/login')
    return false
  }
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!roleData) {
    router.push('/admin/login')
    return false
  }
  return true
}

const fetchEventAndTickets = async () => {
  if (isNew) return
  try {
    const { data: eventData, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    if (eventErr) throw eventErr
    if (eventData) {
      formData.name = eventData.name || ''
      formData.description = eventData.description || ''
      formData.date = eventData.date || ''
      formData.time = eventData.time || ''
      formData.location = eventData.location || ''
      formData.image_url = eventData.image_url || ''
      formData.is_published = !!eventData.is_published
      if (eventData.image_url) imagePreview.value = eventData.image_url
    }

    const { data: tdata, error: tErr } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', id)
    if (tErr) throw tErr
    if (tdata && tdata.length > 0) {
      ticketTypes.value = tdata.map(
        (t: { id: string; name?: string; price?: number | string; capacity?: number }) => ({
          id: t.id,
          name: t.name || '',
          price: Number(t.price || 0),
          capacity: t.capacity || 0,
        }),
      )
    }
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(msg || 'Failed to load event')
  }
}

const handleSave = async () => {
  if (!formData.name || !formData.date || !formData.time || !formData.location) {
    toast.error('Please fill in all required fields')
    return
  }
  isSaving.value = true
  try {
    let eventId = id
    if (isNew) {
      const { data, error } = await supabase.from('events').insert(formData).select().single()
      if (error) throw error
      eventId = data.id
    } else {
      const { error } = await supabase.from('events').update(formData).eq('id', id)
      if (error) throw error
    }

    if (!isNew) {
      const { data: existing } = await supabase.from('ticket_types').select('*').eq('event_id', id)
      const existingIds = (existing || []).map((t: { id: string }) => t.id)
      const currentIds = ticketTypes.value
        .filter((t: TicketType) => t.id)
        .map((t: TicketType) => t.id as string)
      const toDelete = existingIds.filter((x: string) => !currentIds.includes(x))
      if (toDelete.length > 0) await supabase.from('ticket_types').delete().in('id', toDelete)
    }

    for (const ticket of ticketTypes.value) {
      if (ticket.id) {
        await supabase
          .from('ticket_types')
          .update({ name: ticket.name, price: ticket.price, capacity: ticket.capacity })
          .eq('id', ticket.id)
      } else {
        await supabase.from('ticket_types').insert({
          event_id: eventId,
          name: ticket.name,
          price: ticket.price,
          capacity: ticket.capacity,
        })
      }
    }

    // invalidate admin events list by refetching where used, here we just navigate back
    toast.success(isNew ? 'Event created!' : 'Event updated!')
    router.push('/admin/events')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(msg || 'Failed to save event')
  } finally {
    isSaving.value = false
  }
}

const onFileChange = (e: Event) => {
  const el = e.target as HTMLInputElement
  const file = el.files?.[0]
  if (file) handleImageUpload(file)
}

const handleImageUpload = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    toast.error('Veuillez sélectionner une image')
    return
  }
  isUploading.value = true
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `events/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file)
    if (uploadError) throw uploadError
    const {
      data: { publicUrl },
    } = supabase.storage.from('event-images').getPublicUrl(filePath)
    formData.image_url = publicUrl
    imagePreview.value = publicUrl
    toast.success('Image uploadée avec succès')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(msg || "Échec de l'upload")
  } finally {
    isUploading.value = false
  }
}

const removeImage = () => {
  formData.image_url = ''
  imagePreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const addTicketType = () => ticketTypes.value.push({ name: '', price: 0, capacity: 100 })
const removeTicketType = (index: number) => ticketTypes.value.splice(index, 1)

onMounted(async () => {
  const ok = await checkAdmin()
  if (!ok) return
  await fetchEventAndTickets()
  isCheckingAdmin.value = false
})
</script>
