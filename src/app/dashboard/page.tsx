import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to your Dashboard</CardTitle>
        <CardDescription>
          Manage your services, profile, and view analytics from here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Select an option from the sidebar to get started.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/services">Go to My Services</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/services/new">Add New Service</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
