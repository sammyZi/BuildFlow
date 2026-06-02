'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResultsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    if (projectId) {
      router.replace(`/dashboard/project/${projectId}`);
    }
  }, [projectId, router]);

  return null;
}
