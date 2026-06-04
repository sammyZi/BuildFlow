import JSZip from 'jszip';
import { Artifact } from '@/types';

/**
 * Creates and triggers a browser download of a zip bundle containing
 * all three artifact markdown files for a given project.
 */
export async function downloadBundle(
  artifacts: Artifact[], 
  projectId: string,
  codeFiles?: { path: string; content: string }[]
): Promise<void> {
  const zip = new JSZip();

  // Map artifact types to their markdown filenames
  const fileNames: Record<string, string> = {
    requirements: 'requirements.md',
    design: 'design.md',
    tasks: 'tasks.md',
  };

  for (const artifact of artifacts) {
    const fileName = fileNames[artifact.artifact_type];
    if (fileName) {
      zip.file(fileName, artifact.content);
    }
  }

  if (codeFiles && Array.isArray(codeFiles)) {
    for (const file of codeFiles) {
      if (file.path && file.content) {
        zip.file(`code/${file.path}`, file.content);
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `project-${projectId}-${timestamp}.zip`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
