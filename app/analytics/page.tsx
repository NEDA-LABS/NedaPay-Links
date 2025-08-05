'use client';

import AnalyticsWrapper from './AnalyticsWrapper';
import { withDashboardLayout } from '@/utils/withDashboardLayout';

function AnalyticsPage() {
  return <AnalyticsWrapper />;
}

export default withDashboardLayout(AnalyticsPage);

