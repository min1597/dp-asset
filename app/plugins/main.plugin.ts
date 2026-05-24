export default defineNuxtPlugin(() => {
  return {
    provide: {
      copy: async (text: string) => {
        if (import.meta.client) {
          await navigator.clipboard.writeText(text)
        }
      }
    }
  }
})
