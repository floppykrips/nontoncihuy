// api/films.js — GET semua film (publik) | POST tambah film (admin only)
import { supabase }               from './_supabase.js';
import { requireAdmin, setCors }  from './_auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: ambil film dari Supabase (publik) ────────────────────────────
  if (req.method === 'GET') {
    const { category, type, q } = req.query;

    let query = supabase
      .from('films')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (category) query = query.eq('category', category);
    if (type)     query = query.eq('type', type);
    if (q)        query = query.ilike('title', `%${q}%`);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Normalisasi field biar frontend bisa pakai langsung
    const results = (data || []).map(f => ({
      ...f,
      isCustom:       true,
      vote_average:   f.rating ?? 0,
      release_date:   f.year   ? `${f.year}-01-01` : '',
      first_air_date: f.year   ? `${f.year}-01-01` : '',
    }));

    return res.status(200).json({ results, total: results.length });
  }

  // ── POST: tambah film baru (admin only) ──────────────────────────────
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;

    const { title, year, poster, video, desc, rating, type, category, genre } = req.body;

    if (!title?.trim() || !poster?.trim()) {
      return res.status(400).json({ error: 'title dan poster wajib diisi' });
    }

    const { data, error } = await supabase
      .from('films')
      .insert([{
        title:    title.trim(),
        year:     year ? String(year) : null,
        poster:   poster.trim(),
        video:    video?.trim()  || null,
        desc:     desc?.trim()   || null,
        rating:   parseFloat(rating) || 0,
        type:     type     || 'movie',
        category: category || 'trending',
        genre:    genre?.trim()  || null,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ ...data, isCustom: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
