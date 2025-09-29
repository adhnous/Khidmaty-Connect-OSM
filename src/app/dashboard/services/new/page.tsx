import { ServiceForm } from '@/components/service-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getClientLocale, tr } from '@/lib/i18n';

export default function NewServicePage() {
  const locale = getClientLocale();
  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{tr(locale, 'dashboard.serviceForm.newTitle')}</CardTitle>
          <CardDescription>
            {tr(locale, 'dashboard.serviceForm.newSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm />
        </CardContent>
      </Card>
    </div>
  );
}
