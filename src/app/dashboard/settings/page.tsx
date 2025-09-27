import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your account settings. This feature is coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Here you will be able to manage notification preferences and other account settings.
        </p>
      </CardContent>
    </Card>
  );
}
