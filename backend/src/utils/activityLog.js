import supabase from '../config/supabase.js'

export async function logActivity({ userId, documentId = null, action, metadata = {} }) {
  if (!userId || !action) {
    return
  }

  const { error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    document_id: documentId,
    action,
    metadata,
  })

  if (error) {
    console.error('Activity log insert failed:', error.message)
  }
}
