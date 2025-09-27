"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listServicesByProvider, deleteService, createService, type Service } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function MyServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await listServicesByProvider(user.uid);
        setServices(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const ok = window.confirm('Delete this service? This cannot be undone.');
    if (!ok) return;
    try {
      await deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Service deleted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: err?.message || 'Please try again.' });
    }
  };

  const seedSampleServices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const samples: Omit<Service, 'id' | 'createdAt'>[] = [
        {
          title: 'Professional Plumbing Repairs & Installation',
          description: 'Experienced plumber available for repairs, installations, and emergency fixes. Fast, reliable, and affordable.',
          price: 150,
          category: 'Plumbing',
          city: 'Tripoli',
          area: 'Hay Al-Andalus',
          availabilityNote: 'Available from 9 AM to 6 PM',
          images: [{ url: 'https://placehold.co/800x600.png' }],
          contactPhone: '+218911234567',
          contactWhatsapp: '+218911234567',
          providerId: user.uid,
        },
        {
          title: 'Full House Cleaning Service',
          description: 'Thorough, professional home cleaning with your schedule in mind. Eco-friendly products on request.',
          price: 250,
          category: 'Home Services',
          city: 'Benghazi',
          area: 'Al-Sabri',
          availabilityNote: 'Weekdays and weekends',
          images: [{ url: 'https://placehold.co/800x600.png' }],
          contactPhone: '+218912345678',
          contactWhatsapp: '+218912345678',
          providerId: user.uid,
        },
        {
          title: 'Expert Car Mechanic for All Brands',
          description: 'Diagnostics, maintenance, and repairs for all makes and models. Mobile service available.',
          price: 200,
          category: 'Automotive',
          city: 'Misrata',
          area: 'City Center',
          availabilityNote: '9 AM - 8 PM',
          images: [{ url: 'https://placehold.co/800x600.png' }],
          contactPhone: '+218913456789',
          contactWhatsapp: '+218913456789',
          providerId: user.uid,
        },
      ];

      for (const s of samples) {
        await createService(s);
      }
      const data = await listServicesByProvider(user.uid);
      setServices(data);
      toast({ title: 'Sample services created' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Seeding failed', description: err?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Services</CardTitle>
          <CardDescription>
            View and manage all your service listings.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/services/new">New Service</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={seedSampleServices}>Seed samples</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : services.length === 0 ? (
          <div className="text-muted-foreground">
            <p>You have no services yet.</p>
            <Button asChild className="mt-3 mr-3">
              <Link href="/dashboard/services/new">Create your first service</Link>
            </Button>
            <Button variant="outline" onClick={seedSampleServices} className="mt-3">Seed sample services</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Price (LYD)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{service.category}</Badge>
                  </TableCell>
                  <TableCell>{service.city}</TableCell>
                  <TableCell>{service.price}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/services/${service.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/services/${service.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
