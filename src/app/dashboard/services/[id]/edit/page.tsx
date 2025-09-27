"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { deleteField } from 'firebase/firestore';
import L from 'leaflet';
import { useMapEvents } from 'react-leaflet';

import { getServiceById, updateService, type Service, type ServiceImage } from '@/lib/services';
import { serviceSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AddressSearch from '@/components/address-search';

const EditSchema = serviceSchema; // reuse same fields

type EditFormData = z.infer<typeof EditSchema>;

// Client-only react-leaflet components to avoid double-init in dev
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false }) as any;
const ScaleControl = dynamic(() => import('react-leaflet').then((m) => m.ScaleControl), { ssr: false }) as any;

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<ServiceImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [mapMounted, setMapMounted] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const form = useForm<EditFormData>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: '',
      city: 'Tripoli',
      area: '',
      availabilityNote: '',
      contactPhone: '',
      contactWhatsapp: '',
    },
  });

  // Require sign-in to edit
  useEffect(() => {
    if (!authLoading && !user) {
      toast({ variant: 'destructive', title: 'Please sign in', description: 'You must be signed in to edit a service.' });
      router.push('/login');
    }
  }, [authLoading, user, router, toast]);

  useEffect(() => {
    (async () => {
      const id = params?.id;
      if (!id) return;
      const doc = await getServiceById(id);
      if (!doc) {
        router.push('/dashboard/services');
        return;
      }
      // Optional: Only allow the owner to edit
      if (user && (doc as Service).providerId && (doc as Service).providerId !== user.uid) {
        toast({ variant: 'destructive', title: 'Not allowed', description: 'You can only edit your own service.' });
        router.push('/dashboard/services');
        return;
      }
      // Populate form with existing values
      form.reset({
        title: doc.title,
        description: doc.description,
        price: doc.price,
        category: doc.category,
        city: doc.city,
        area: doc.area,
        availabilityNote: doc.availabilityNote ?? '',
        contactPhone: (doc as any).contactPhone ?? '',
        contactWhatsapp: (doc as any).contactWhatsapp ?? '',
        videoUrl: (doc as any).videoUrl ?? '',
      });
      setImages(doc.images ?? []);
      setLat((doc as any).lat);
      setLng((doc as any).lng);
      setLoading(false);
    })();
  }, [params, form, router, user, toast]);

  useEffect(() => {
    setMapMounted(true);
  }, []);

  // Leaflet marker icon (div-based to avoid asset issues)
  const markerIcon = useMemo(() => {
    return L.divIcon({
      className: '',
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.15)"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);

  const tileUrl = process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttrib = process.env.NEXT_PUBLIC_OSM_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Reverse geocode selected point to show human-readable address (free Nominatim)
  useEffect(() => {
    let abort = false;
    async function run() {
      if (typeof lat !== 'number' || typeof lng !== 'number') { setSelectedAddress(''); return; }
      try {
        const lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('lat', String(lat));
        url.searchParams.set('lon', String(lng));
        url.searchParams.set('accept-language', lang);
        const res = await fetch(url.toString(), { headers: { 'Accept-Language': lang } });
        if (!res.ok) throw new Error('reverse failed');
        const data = await res.json();
        if (!abort) setSelectedAddress(data.display_name || '');
      } catch {
        if (!abort) setSelectedAddress('');
      }
    }
    void run();
    return () => { abort = true; };
  }, [lat, lng]);

  // Keep lat/lng synced to the map center when zooming or panning (edit form)
  function CenterWatcher() {
    const map: any = useMapEvents({
      zoomend() {
        const c = map.getCenter();
        setLat(Number(c.lat.toFixed(6)));
        setLng(Number(c.lng.toFixed(6)));
      },
      moveend() {
        const c = map.getCenter();
        setLat(Number(c.lat.toFixed(6)));
        setLng(Number(c.lng.toFixed(6)));
      },
    });
    return null;
  }

  // --- Image helpers (match create form modes) ---
  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressToDataUrl(file: File, maxWidth = 800, quality = 0.6): Promise<string> {
    const raw = await fileToDataUrl(file);
    const img = document.createElement('img');
    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = rej;
      img.src = raw;
    });
    const scale = Math.min(1, maxWidth / (img.width || maxWidth));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((img.width || maxWidth) * scale);
    canvas.height = Math.round((img.height || maxWidth) * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  async function uploadImagesLocal(files: File[]): Promise<ServiceImage[]> {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    const res = await fetch('/api/uploads', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { urls: string[] };
    return (data.urls || []).map((u) => ({ url: u }));
  }

  async function uploadImagesCloudinary(files: File[]): Promise<ServiceImage[]> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    if (!cloudName || !preset) throw new Error('Cloudinary not configured');
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const out: ServiceImage[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', preset);
      const r = await fetch(endpoint, { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const url: string = j.secure_url || j.url;
      const publicId: string | undefined = j.public_id;
      out.push({ url, ...(publicId ? { publicId } : {}) });
    }
    return out;
  }

  async function handleAddFiles(files: File[]) {
    if (files.length === 0) return;
    const mode = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MODE || '').toLowerCase();
    try {
      let added: ServiceImage[] = [];
      if (mode === 'local') {
        added = await uploadImagesLocal(files);
      } else if (mode === 'cloudinary') {
        added = await uploadImagesCloudinary(files);
      } else {
        // inline fallback
        const limited = files.slice(0, 4);
        const dataUrls = await Promise.all(limited.map((f) => compressToDataUrl(f)));
        added = dataUrls.map((u) => ({ url: u }));
      }
      setImages((prev) => [...prev, ...added]);
      toast({ title: 'Images added' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Add images failed', description: e?.message || 'Please try again.' });
    }
  }

  async function handleReplaceFile(index: number, file: File) {
    const mode = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MODE || '').toLowerCase();
    try {
      let next: ServiceImage;
      if (mode === 'local') {
        const [img] = await uploadImagesLocal([file]);
        next = img;
      } else if (mode === 'cloudinary') {
        const [img] = await uploadImagesCloudinary([file]);
        next = img;
      } else {
        const url = await compressToDataUrl(file);
        next = { url };
      }
      setImages((prev) => prev.map((it, i) => (i === index ? next : it)));
      toast({ title: 'Image replaced' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Replace failed', description: e?.message || 'Please try again.' });
    }
  }

  function handleReplaceUrl(index: number) {
    const url = window.prompt('Paste new image URL');
    if (!url) return;
    setImages((prev) => prev.map((it, i) => (i === index ? { url } : it)));
    toast({ title: 'Image replaced' });
  }

  function moveImage(index: number, delta: number) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddUrl() {
    const v = newImageUrl.trim();
    if (!v) return;
    setImages((prev) => [...prev, { url: v }]);
    setNewImageUrl('');
  }

  function handleUseMyLocation() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      toast({ variant: 'destructive', title: 'Geolocation not available', description: 'Your browser does not support geolocation.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = Number(pos.coords.latitude.toFixed(6));
        const ln = Number(pos.coords.longitude.toFixed(6));
        setLat(la);
        setLng(ln);
        toast({ title: 'Location set', description: `${la}, ${ln}` });
      },
      (err) => {
        toast({ variant: 'destructive', title: 'Could not get location', description: err?.message || 'Permission denied' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function onSubmit(data: EditFormData) {
    try {
      setSubmitting(true);
      const id = params?.id as string;
      const payload: any = {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        city: data.city,
        area: data.area,
        availabilityNote: data.availabilityNote,
        contactPhone: data.contactPhone,
        contactWhatsapp: data.contactWhatsapp,
        images,
      };
      // Handle optional coordinates: set values if present, otherwise delete fields
      if (typeof lat === 'number') payload.lat = lat; else payload.lat = deleteField();
      if (typeof lng === 'number') payload.lng = lng; else payload.lng = deleteField();
      if (typeof data.videoUrl === 'string' && data.videoUrl.trim()) payload.videoUrl = data.videoUrl.trim(); else payload.videoUrl = deleteField();

      await updateService(id, payload);
      toast({ title: 'Service updated' });
      router.push(`/services/${id}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: err?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit service</CardTitle>
          <CardDescription>Update your listing information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Plumbing','Home Services','Automotive','Education','Electrical','Carpentry','Gardening'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (in LYD)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Video URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Tripoli','Benghazi','Misrata'].map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area / Neighborhood</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="availabilityNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability Note (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +218911234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactWhatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +218911234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <FormLabel>Location (optional)</FormLabel>
                <AddressSearch
                  className="max-w-md"
                  placeholder="Search address or place (free)"
                  countryCodes="ly"
                  onSelect={({ lat, lng }) => {
                    setLat(Number(lat.toFixed(6)));
                    setLng(Number(lng.toFixed(6)));
                  }}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel className="text-xs">Latitude</FormLabel>
                    <Input
                      placeholder="e.g., 32.8872"
                      value={lat ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        setLat(v === '' ? undefined : Number(v));
                      }}
                    />
                  </div>
                  <div>
                    <FormLabel className="text-xs">Longitude</FormLabel>
                    <Input
                      placeholder="e.g., 13.1913"
                      value={lng ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        setLng(v === '' ? undefined : Number(v));
                      }}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseMyLocation}
                    >
                      Use my location
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setLat(undefined);
                        setLng(undefined);
                      }}
                    >
                      Clear location
                    </Button>
                  </div>
                </div>

                {/* Map picker (client-only) */}
                {mapMounted && (
                  <div className="h-64 w-full overflow-hidden rounded border">
                    <MapContainer
                      key={`${lat ?? 'city'}-${lng ?? 'city'}`}
                      center={(lat != null && lng != null)
                        ? [lat, lng]
                        : (form.getValues('city')?.toLowerCase() === 'benghazi'
                            ? [32.1167, 20.0667]
                            : form.getValues('city')?.toLowerCase() === 'misrata'
                              ? [32.3783, 15.0906]
                              : [32.8872, 13.1913])}
                      zoom={13}
                      className="h-full w-full cursor-crosshair"
                      scrollWheelZoom={true}
                      whenReady={(m: any) => {
                        // no-op, but ensures first render happens after mount
                      }}
                      onClick={(e: any) => {
                        const { lat: la, lng: ln } = e.latlng || {};
                        if (typeof la === 'number' && typeof ln === 'number') {
                          setLat(Number(la.toFixed(6)));
                          setLng(Number(ln.toFixed(6)));
                        }
                      }}
                    >
                      <CenterWatcher />
                      <TileLayer attribution={tileAttrib} url={tileUrl} />
                      <ScaleControl position="bottomleft" />
                      {(lat != null && lng != null) && (
                        <Marker
                          position={[lat, lng] as any}
                          draggable={true}
                          icon={markerIcon as any}
                          eventHandlers={{
                            dragend: (e: any) => {
                              const p = e.target.getLatLng();
                              setLat(Number(p.lat.toFixed(6)));
                              setLng(Number(p.lng.toFixed(6)));
                            },
                          }}
                        >
                          <Popup>Selected location</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      {lat != null && lng != null ? (
                        <span>Selected: {lat.toFixed(6)}, {lng.toFixed(6)}{selectedAddress ? ` — ${selectedAddress}` : ''}</span>
                      ) : (
                        <span>Click on the map to set a precise location.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <FormLabel>Images</FormLabel>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAddFiles(Array.from(e.target.files ?? []))}
                    />
                    Add files
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Paste image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={handleAddUrl}>Add URL</Button>
                  </div>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative overflow-hidden rounded border">
                        <Image
                          src={img.url}
                          alt={`Image ${i + 1}`}
                          width={400}
                          height={300}
                          className="aspect-video w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <div className="flex gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => moveImage(i, -1)} disabled={i === 0}>Up</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}>Down</Button>
                          </div>
                          <div className="flex gap-1">
                            <input
                              id={`replace-file-${i}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleReplaceFile(i, f);
                                // allow selecting the same file again later
                                e.currentTarget.value = '';
                              }}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`replace-file-${i}`)?.click()}>Replace</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleReplaceUrl(i)}>Replace URL</Button>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(i)}>Remove</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No images yet.</p>
                )}
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
