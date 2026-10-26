import { supabase } from '../supabaseClient';
import type { Person, PersonKind, PhotoFraming } from '../types/person';

const PHOTO_BUCKET = 'people-photos';
const PHOTO_URL_TTL_SECONDS = 60 * 60;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const DEFAULT_FRAMING: PhotoFraming = { x: 50, y: 50, zoom: 1 };

// The API returns at most this many rows per request, so larger lists come in pages
const PAGE_SIZE = 1000;

// One tab of the page. includeAll only has an effect for admins (checked in the database).
export async function fetchPeople(kind: PersonKind, includeAll: boolean): Promise<Person[]> {
  const people: Person[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .rpc('list_people', { kind, include_all: includeAll })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    people.push(...((data ?? []) as Person[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  // The bucket is private, so sign every photo in one request
  const paths = people.map(p => p.photo_path).filter((p): p is string => !!p);
  if (paths.length === 0) return people;
  const { data: signed, error: signError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);
  if (signError) {
    console.error('Could not sign photo URLs:', signError);
    return people;
  }
  const urlByPath = new Map(signed.filter(s => s.signedUrl).map(s => [s.path, s.signedUrl]));
  return people.map(p => ({ ...p, photo_url: p.photo_path ? urlByPath.get(p.photo_path) : undefined }));
}

export async function setRepresented(kind: PersonKind, id: number, isRepresented: boolean) {
  const { error } = await supabase.from(kind).update({ is_represented: isRepresented }).eq('id', id);
  if (error) throw error;
}

export async function savePhotoFraming(kind: PersonKind, id: number, { x, y, zoom }: PhotoFraming) {
  const { error } = await supabase.from(kind).update({ photo_x: x, photo_y: y, photo_zoom: zoom }).eq('id', id);
  if (error) throw error;
}

// Uploads under a new path each time so browsers never show a cached old photo,
// then removes the previous file. Returns the new signed URL.
export async function uploadPhoto(kind: PersonKind, person: Person, file: File): Promise<{ path: string; url: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${kind}/${person.id}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '3600' });
  if (uploadError) throw uploadError;

  // A new photo starts centred; the old framing was for a different picture
  const { error: updateError } = await supabase
    .from(kind)
    .update({ photo_path: path, photo_x: DEFAULT_FRAMING.x, photo_y: DEFAULT_FRAMING.y, photo_zoom: DEFAULT_FRAMING.zoom })
    .eq('id', person.id);
  if (updateError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw updateError;
  }

  if (person.photo_path) {
    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([person.photo_path]);
    if (error) console.error('Could not remove old photo:', error);
  }

  const { data, error: signError } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, PHOTO_URL_TTL_SECONDS);
  if (signError) throw signError;
  return { path, url: data.signedUrl };
}
