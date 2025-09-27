import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>
          Track the performance of your services. This feature is coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Here you will see view counts and contact clicks for each of your
          listings.
        </p>
      </CardContent>
    </Card>
  );
}
