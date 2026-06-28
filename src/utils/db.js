import { supabase } from './supabase'

export async function loadStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function saveAllStaff(staffList) {
  const { error: delError } = await supabase.from('staff').delete().gte('id', 0)
  if (delError) throw delError

  const rows = staffList.map((s, i) => ({
    name: s.name,
    role: s.role,
    shifts: s.shifts,
    sort_order: i,
  }))
  const { data, error } = await supabase.from('staff').insert(rows).select()
  if (error) throw error
  return data
}

export async function updateStaffShifts(id, shifts) {
  const { error } = await supabase.from('staff').update({ shifts }).eq('id', id)
  if (error) throw error
}

export async function loadRecords() {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data
}

export async function insertRecords(records) {
  const rows = records.map((r) => ({
    name: r.name,
    type: r.type,
    ts: r.ts,
    time_str: r.timeStr,
  }))
  const { data, error } = await supabase.from('records').insert(rows).select()
  if (error) throw error
  return data
}

export async function updateRecord(id, updates) {
  const { error } = await supabase.from('records').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteRecord(id) {
  const { error } = await supabase.from('records').delete().eq('id', id)
  if (error) throw error
}

export async function clearAllRecords() {
  const { error } = await supabase.from('records').delete().gte('id', 0)
  if (error) throw error
}
