// api/films/[id].js — PUT edit film | DELETE hapus film (admin only)
import { supabase }               from '../_supabase.js';
import { requireAdmin, setCors }  from '../_auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID tidak boleh kosong' });

  // ── PUT: update film ────────────────────────────────────────────────
  if (req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;

    const { title, year, poster, video, desc, rating, type, category, genre } = req.body;

    if (!title?.trim() || !poster?.trim()) {
      return res.status(400).json({ error: 'title dan poster wajib diisi' });
    }

    const { data, error } = await supabase
      .from('films')
      .update({
        title:      title.trim(),
        year:       year ? String(year) : null,
        poster:     poster.trim(),
        video:      video?.trim()  || null,
        desc:       desc?.trim()   || null,
        rating:     parseFloat(rating) || 0,
        type:       type     || 'movie',
        category:   category || 'trending',
        genre:      genre?.trim()  || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: 'Film tidak ditemukan' });

    return res.status(200).json({ ...data, isCustom: true });
  }

  // ── DELETE: hapus film ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;

    const { error, count } = await supabase
      .from('films')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error)    return res.status(500).json({ error: error.message });
    if (count === 0) return res.status(404).json({ error: 'Film tidak ditemukan' });

    return res.status(200).json({ success: true, id });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
